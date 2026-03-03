import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UploadImagesDto } from './dto/upload-images.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // ─── Admin: Upload múltiple ────────────────────────────────────────────────

  /**
   * Sube uno o más archivos de imagen a Cloudinary y registra cada uno en la BD.
   *
   * Estrategia de error:
   * 1. Subir todos los archivos a Cloudinary primero (en paralelo).
   * 2. Si algún upload falla, eliminar los que ya subieron (rollback de Cloudinary).
   * 3. Insertar todos los registros en BD en un solo createMany.
   * 4. Si falla la BD, eliminar todos los archivos subidos.
   */
  async uploadMany(files: Express.Multer.File[], dto: UploadImagesDto) {
    // Validar que el trim existe
    await this.assertTrimExists(dto.trimId);

    // Calcular sortOrder base (máximo actual o 0 si no hay imágenes)
    let baseSortOrder = dto.sortOrder;
    if (baseSortOrder === undefined) {
      const aggr = await this.prisma.image.aggregate({
        where: { trimId: dto.trimId },
        _max: { sortOrder: true },
      });
      baseSortOrder = (aggr._max.sortOrder ?? -1) + 1;
    }

    // 1. Subir todos los archivos a Cloudinary en paralelo
    const uploadResults: { publicUrl: string; publicId: string }[] = [];
    try {
      const settled = await Promise.allSettled(
        files.map((file) => this.uploadService.uploadTrimImage(file)),
      );

      const failed: string[] = [];
      for (const result of settled) {
        if (result.status === 'fulfilled') {
          uploadResults.push({
            publicUrl: result.value.publicUrl,
            publicId: result.value.publicId,
          });
        } else {
          failed.push((result.reason as Error).message);
        }
      }

      if (failed.length > 0) {
        // Rollback: eliminar los que sí subieron
        await this.rollbackCloudinaryUploads(uploadResults, 'image');
        throw new InternalServerErrorException(
          `${failed.length} de ${files.length} archivo(s) fallaron al subirse a Cloudinary: ${failed.join(' | ')}`,
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(
        'Error al subir imágenes a Cloudinary.',
      );
    }

    // 2. Insertar registros en BD
    try {
      const data = uploadResults.map((r, index) => ({
        trimId: dto.trimId,
        url: r.publicUrl,
        publicId: r.publicId,
        type: dto.type,
        altText: dto.altText,
        sortOrder: baseSortOrder + index,
      }));

      await this.prisma.image.createMany({ data });

      // Retornar los registros recién creados
      const createdImages = await this.prisma.image.findMany({
        where: {
          trimId: dto.trimId,
          publicId: { in: uploadResults.map((r) => r.publicId) },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return createdImages;
    } catch (error) {
      // Rollback: eliminar todos los archivos de Cloudinary
      await this.rollbackCloudinaryUploads(uploadResults, 'image');

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Una o más URLs ya existen para el trim #${dto.trimId}.`,
        );
      }
      throw new InternalServerErrorException(
        'Error al guardar las imágenes en la base de datos.',
      );
    }
  }

  // ─── Admin: Actualizar metadatos ────────────────────────────────────────────

  /**
   * Actualiza solo los metadatos de una imagen (altText, type, sortOrder).
   * No permite cambiar el archivo físico.
   */
  async update(id: number, dto: UpdateImageDto) {
    try {
      return await this.prisma.image.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Imagen #${id} no encontrada.`);
      }
      throw error;
    }
  }

  // ─── Admin: Eliminar imagen ─────────────────────────────────────────────────

  /**
   * Elimina la imagen de Cloudinary y luego el registro de la BD.
   * Si Cloudinary falla, lanza excepción sin eliminar el registro de BD (sin huérfanos).
   * Si la BD falla después de eliminar de Cloudinary, registra el error en log.
   */
  async remove(id: number) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Imagen #${id} no encontrada.`);
    }

    // 1. Eliminar de Cloudinary primero (si falla, no tocamos la BD)
    if (image.publicId) {
      await this.uploadService.deleteFile(image.publicId, 'image');
    }

    // 2. Eliminar de BD
    try {
      await this.prisma.image.delete({ where: { id } });
    } catch (error) {
      // En este punto el archivo ya fue eliminado de Cloudinary.
      // Registramos el error pero no podemos revertir.
      this.logger.error(
        `Imagen #${id} fue eliminada de Cloudinary pero falló la eliminación en BD: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'El archivo fue eliminado de Cloudinary pero falló al eliminar el registro en la base de datos. Contacte al administrador.',
      );
    }
  }

  // ─── Lectura pública ────────────────────────────────────────────────────────

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.image.findMany({
        skip,
        take: limit,
        orderBy: [{ trimId: 'asc' }, { sortOrder: 'asc' }],
        include: {
          trim: {
            select: {
              id: true,
              name: true,
              active: true,
              model: { select: { id: true, name: true, year: true } },
            },
          },
        },
      }),
      this.prisma.image.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const image = await this.prisma.image.findUnique({
      where: { id },
      include: {
        trim: { include: { model: { include: { brand: true } } } },
      },
    });
    if (!image) {
      throw new NotFoundException(`Imagen #${id} no encontrada.`);
    }
    return image;
  }

  async findByTrim(trimId: number) {
    return this.prisma.image.findMany({
      where: { trimId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async assertTrimExists(trimId: number): Promise<void> {
    const trim = await this.prisma.trim.findUnique({
      where: { id: trimId },
      select: { id: true, active: true },
    });
    if (!trim) {
      throw new NotFoundException(
        `Trim #${trimId} no encontrado. Proporciona un trimId válido.`,
      );
    }
  }

  private async rollbackCloudinaryUploads(
    uploads: { publicId: string }[],
    resourceType: 'image' | 'raw',
  ): Promise<void> {
    await Promise.allSettled(
      uploads.map((u) =>
        this.uploadService.deleteFile(u.publicId, resourceType),
      ),
    );
  }
}
