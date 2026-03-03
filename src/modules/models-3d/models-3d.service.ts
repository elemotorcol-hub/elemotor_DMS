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
import { UploadModel3dDto } from './dto/upload-model-3d.dto';

@Injectable()
export class Models3dService {
  private readonly logger = new Logger(Models3dService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // ─── Admin: Upload modelo 3D ─────────────────────────────────────────────────

  /**
   * Sube un archivo GLB a Cloudinary y registra el modelo 3D en BD.
   *
   * Validaciones:
   * - El trim debe existir.
   * - Solo puede existir UN modelo 3D por trim (@@unique en schema).
   *
   * Control de errores:
   * - Si la BD falla después del upload, se elimina el archivo de Cloudinary.
   */
  async upload(file: Express.Multer.File, dto: UploadModel3dDto) {
    // 1. Validar que el trim existe
    await this.assertTrimExists(dto.trimId);

    // 2. Validar unicidad: un solo modelo 3D por trim
    const existing = await this.prisma.model3d.findUnique({
      where: { trimId: dto.trimId },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `El trim #${dto.trimId} ya tiene un modelo 3D asociado (id: ${existing.id}). Elimínalo antes de subir uno nuevo.`,
      );
    }

    // 3. Subir a Cloudinary
    let uploadResult: { publicUrl: string; publicId: string };
    try {
      uploadResult = await this.uploadService.uploadTrimModel3d(file);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error al subir el modelo 3D a Cloudinary: ${(error as Error).message}`,
      );
    }

    // 4. Crear registro en BD (con rollback a Cloudinary si falla)
    try {
      return await this.prisma.model3d.create({
        data: {
          trimId: dto.trimId,
          fileUrl: uploadResult.publicUrl,
          publicId: uploadResult.publicId,
        },
      });
    } catch (error) {
      // Rollback: eliminar el archivo de Cloudinary
      try {
        await this.uploadService.deleteFile(uploadResult.publicId, 'raw');
      } catch (deleteError) {
        this.logger.error(
          `Rollback fallido: archivo Cloudinary publicId=${uploadResult.publicId} quedó huérfano. ` +
            `Error BD original: ${(error as Error).message}. Error rollback: ${(deleteError as Error).message}`,
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `El trim #${dto.trimId} ya tiene un modelo 3D. Constraint único violado.`,
        );
      }

      throw new InternalServerErrorException(
        'Error al guardar el modelo 3D en la base de datos. El archivo en Cloudinary fue eliminado.',
      );
    }
  }

  // ─── Admin: Eliminar modelo 3D ───────────────────────────────────────────────

  /**
   * Elimina el modelo 3D de Cloudinary y su registro de BD.
   */
  async remove(id: number) {
    const model3d = await this.prisma.model3d.findUnique({ where: { id } });
    if (!model3d) {
      throw new NotFoundException(`Modelo 3D #${id} no encontrado.`);
    }

    // 1. Eliminar de Cloudinary primero
    if (model3d.publicId) {
      await this.uploadService.deleteFile(model3d.publicId, 'raw');
    }

    // 2. Eliminar de BD
    try {
      await this.prisma.model3d.delete({ where: { id } });
    } catch (error) {
      this.logger.error(
        `Modelo 3D #${id} fue eliminado de Cloudinary pero falló la eliminación en BD: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'El archivo fue eliminado de Cloudinary pero falló al eliminar el registro en la base de datos. Contacte al administrador.',
      );
    }
  }

  // ─── Lectura pública ─────────────────────────────────────────────────────────

  /**
   * Retorna el modelo 3D asociado a un trim (si existe).
   */
  async findByTrim(trimId: number) {
    const model3d = await this.prisma.model3d.findUnique({
      where: { trimId },
    });
    return model3d ?? null;
  }

  async findOne(id: number) {
    const model3d = await this.prisma.model3d.findUnique({
      where: { id },
      include: { trim: { select: { id: true, name: true, modelId: true } } },
    });
    if (!model3d) {
      throw new NotFoundException(`Modelo 3D #${id} no encontrado.`);
    }
    return model3d;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async assertTrimExists(trimId: number): Promise<void> {
    const trim = await this.prisma.trim.findUnique({
      where: { id: trimId },
      select: { id: true },
    });
    if (!trim) {
      throw new NotFoundException(
        `Trim #${trimId} no encontrado. Proporciona un trimId válido.`,
      );
    }
  }
}
