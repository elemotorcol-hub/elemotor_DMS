import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { v2 as CloudinaryV2 } from 'cloudinary';
import { UserRole } from '@prisma/client';

import { DocumentsRepository } from './documents.repository';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CLOUDINARY_CLIENT } from '../upload/cloudinary.provider';
import { UploadService } from '../upload/upload.service';
import { FileUploadType } from '../upload/upload.validators';

/**
 * DocumentsService — Lógica de negocio del módulo de documentos.
 *
 * - Listar documentos del usuario autenticado
 * - Subir documento a Cloudinary y persistir metadata en DB
 * - Generar URL firmada de Cloudinary para descarga segura
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly uploadService: UploadService,
    @Inject(CLOUDINARY_CLIENT)
    private readonly cloudinary: typeof CloudinaryV2,
  ) {}

  // ─── Listar documentos ────────────────────────────────────────────────────

  /**
   * findMyDocuments — Retorna los documentos del usuario autenticado.
   */
  async findMyDocuments(userId: number) {
    return this.documentsRepository.findByUserId(userId);
  }

  // ─── Subir documento ──────────────────────────────────────────────────────

  /**
   * uploadDocument — Valida el ownership del pedido, sube el PDF a Cloudinary
   * y persiste la metadata del documento en la base de datos.
   */
  async uploadDocument(
    userId: number,
    userRole: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ) {
    // Ownership check: verificar que el pedido pertenece al usuario (o es admin)
    if (userRole !== UserRole.admin && userRole !== UserRole.super_admin) {
      const order = await this.documentsRepository.findOrderByIdAndUserId(dto.orderId, userId);
      if (!order) {
        throw new NotFoundException(
          `Pedido #${dto.orderId} no encontrado o no pertenece al usuario`,
        );
      }
    }

    // Subir archivo a Cloudinary (usa el servicio existente con validación incluida)
    const uploadResult = await this.uploadService.uploadFile(file, FileUploadType.DOCUMENT);

    // Determinar quién sube
    const uploadedBy = DocumentsRepository.resolveUploadedBy(userRole);

    // Persistir en base de datos
    const document = await this.documentsRepository.create({
      name: dto.name,
      type: dto.type,
      fileUrl: uploadResult.publicUrl,
      publicId: uploadResult.publicId,
      uploadedBy,
      order: { connect: { id: dto.orderId } },
      user: { connect: { id: userId } },
    });

    this.logger.log(
      `Document "${dto.name}" (${dto.type}) uploaded by user #${userId} for order #${dto.orderId}`,
    );

    return document;
  }

  // ─── URL firmada para descarga ─────────────────────────────────────────────

  /**
   * getDownloadUrl — Genera una URL firmada de Cloudinary válida por 15 minutos.
   * Verifica ownership del documento (cliente solo ve el suyo; admin ve todos).
   */
  async getDownloadUrl(docId: number, userId: number, userRole: string) {
    let document: Awaited<ReturnType<typeof this.documentsRepository.findByIdForAdmin>> | null;

    const isAdmin = userRole === UserRole.admin || userRole === UserRole.super_admin;

    if (isAdmin) {
      document = await this.documentsRepository.findByIdForAdmin(docId);
    } else {
      document = await this.documentsRepository.findByIdAndUserId(docId, userId);
    }

    if (!document) {
      throw new NotFoundException(`Documento #${docId} no encontrado`);
    }

    if (!(document as any).publicId) {
      // Documento antiguo sin publicId — devolver fileUrl directo
      this.logger.warn(
        `Document #${docId} has no publicId; returning raw fileUrl for compatibility`,
      );
      return { url: document.fileUrl, expiresAt: null };
    }

    // Generar URL firmada con expiración de 15 minutos
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;

    try {
      const signedUrl = this.cloudinary.utils.private_download_url(
        (document as any).publicId,
        '', // Permite extensión original (no forzar 'pdf')
        {
          resource_type: 'raw',
          expires_at: expiresAt,
          attachment: true,
        },
      );

      return {
        url: signedUrl,
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        documentName: document.name,
      };
    } catch (err) {
      this.logger.error(
        `Failed to generate signed URL for document #${docId}: ${(err as Error).message}`,
      );
      // Fallback: devolver URL pública si Cloudinary no retorna URL firmada
      return { url: document.fileUrl, expiresAt: null };
    }
  }
}
