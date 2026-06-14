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
 * - Proveer URL de previsualización (inline) y URL firmada de descarga segura
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

  /**
   * findOrderDocuments — Retorna todos los documentos de un pedido.
   * Verifica que el solicitante sea el propietario del pedido o un admin/super_admin.
   */
  async findOrderDocuments(orderId: number, userId: number, userRole: string) {
    const isAdmin = userRole === UserRole.admin || userRole === UserRole.super_admin;

    if (!isAdmin) {
      // Busca el pedido solo por ID para manejar pedidos con userId = null (creados por admin)
      const order = await this.documentsRepository.findOrderById(orderId);
      if (!order) {
        throw new NotFoundException(`Pedido #${orderId} no encontrado`);
      }
      // Permite acceso si el pedido pertenece al usuario o si no tiene usuario asignado
      if (order.userId !== null && order.userId !== userId) {
        throw new ForbiddenException('Sin acceso a este pedido');
      }
    }

    return this.documentsRepository.findByOrderId(orderId);
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

  // ─── Eliminar documento ───────────────────────────────────────────────────

  /**
   * deleteDocument — Solo admins. Elimina el archivo de Cloudinary y el registro de BD.
   */
  async deleteDocument(docId: number, userRole: string): Promise<{ message: string }> {
    const isAdmin = userRole === UserRole.admin || userRole === UserRole.super_admin;
    if (!isAdmin) {
      throw new ForbiddenException('Solo administradores pueden eliminar documentos');
    }

    const doc = await this.documentsRepository.findByIdForAdmin(docId);
    if (!doc) {
      throw new NotFoundException(`Documento #${docId} no encontrado`);
    }

    // Intentar eliminar de Cloudinary si tiene publicId
    if (doc.publicId) {
      try {
        const resourceType = doc.fileUrl.includes('/image/upload/') ? 'image' : 'raw';
        await this.cloudinary.uploader.destroy(doc.publicId, { resource_type: resourceType });
      } catch (err) {
        this.logger.warn(`No se pudo eliminar de Cloudinary el documento #${docId}: ${(err as Error).message}`);
      }
    }

    await this.documentsRepository.deleteById(docId);
    this.logger.log(`Document #${docId} deleted by admin`);
    return { message: `Documento #${docId} eliminado correctamente` };
  }

  // ─── URLs de previsualización y descarga ──────────────────────────────────

  /**
   * getDocumentUrls — Genera:
   * - previewUrl: URL directa de Cloudinary (inline, sin attachment)
   * - downloadUrl: URL firmada con expiración de 15 min (fuerza descarga)
   *
   * Verifica ownership del documento (cliente solo ve el suyo; admin ve todos).
   */
  async getDocumentUrls(
    docId: number,
    userId: number,
    userRole: string,
  ): Promise<{ previewUrl: string; downloadUrl: string; documentName: string; expiresAt: string | null }> {
    const isAdmin = userRole === UserRole.admin || userRole === UserRole.super_admin;

    // Admin: accede a cualquier documento
    // Cliente: puede descargar documentos de sus propios pedidos (incluso los subidos por el asesor)
    const docWithOrder = await this.documentsRepository.findByIdWithOrder(docId);
    if (!docWithOrder) {
      throw new NotFoundException(`Documento #${docId} no encontrado`);
    }

    if (!isAdmin) {
      const orderUserId = docWithOrder.order?.userId ?? null;
      // Permite acceso si el pedido pertenece al usuario o si el pedido no tiene usuario asignado
      if (orderUserId !== null && orderUserId !== userId) {
        throw new ForbiddenException(`Sin acceso al documento #${docId}`);
      }
    }

    // Extraer solo los campos del documento (sin la relación order)
    const { order: _order, ...document } = docWithOrder;

    // La previewUrl siempre es la URL pública almacenada (sin flags de descarga)
    const previewUrl = document.fileUrl;

    // Generar URL firmada con expiración de 15 minutos para descarga segura
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;

    // Determinar resource_type según cómo fue almacenado el archivo
    const resourceType = document.fileUrl.includes('/image/upload/') ? 'image' : 'raw';

    let downloadUrl: string;
    let expiresAtDate: string | null = null;

    try {
      if (!document.publicId) {
        // Documento legado sin publicId — usamos fileUrl como fallback
        this.logger.warn(`Document #${docId} has no publicId; returning raw fileUrl as downloadUrl`);
        downloadUrl = document.fileUrl;
      } else {
        downloadUrl = this.cloudinary.utils.private_download_url(
          document.publicId,
          'pdf',
          {
            resource_type: resourceType,
            expires_at: expiresAt,
            attachment: true,
          },
        );
        expiresAtDate = new Date(expiresAt * 1000).toISOString();
      }
    } catch (err) {
      this.logger.error(
        `Failed to generate signed download URL for document #${docId}: ${(err as Error).message}`,
      );
      // Fallback: devolver fileUrl directa si la firma de Cloudinary falla
      downloadUrl = document.fileUrl;
    }

    return {
      previewUrl,
      downloadUrl,
      documentName: document.name,
      expiresAt: expiresAtDate,
    };
  }
}
