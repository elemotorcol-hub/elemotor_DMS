import { Injectable } from '@nestjs/common';
import { Document, Prisma, UploadedBy } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * DocumentsRepository — Capa de acceso a datos para el módulo de documentos.
 *
 * Encapsula todas las operaciones Prisma sobre el modelo Document.
 */
@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Listado ──────────────────────────────────────────────────────────────

  /** Lista todos los documentos de un usuario (propios + de órdenes vinculadas) */
  findByUserId(userId: number): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        OR: [
          { userId },                  // docs subidos por el propio usuario
          { order: { userId } },       // docs de órdenes que le pertenecen al usuario
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Acceso por ID ────────────────────────────────────────────────────────

  /** Busca un documento por ID verificando que pertenezca al usuario (ownership check) */
  findByIdAndUserId(id: number, userId: number): Promise<Document | null> {
    return this.prisma.document.findFirst({
      where: { id, userId },
    });
  }

  /** Busca un documento por ID para admin (sin restricción de propietario) */
  findByIdForAdmin(id: number): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id },
    });
  }

  // ─── Listado por pedido ───────────────────────────────────────────────────

  /** Lista todos los documentos de un pedido */
  findByOrderId(orderId: number): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Verificar ownership de pedido ───────────────────────────────────────

  /** Verifica que el pedido existe y pertenece al usuario */
  findOrderByIdAndUserId(orderId: number, userId: number) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true },
    });
  }

  /** Busca un pedido solo por ID (para verificación de ownership flexible) */
  findOrderById(orderId: number) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true },
    });
  }

  /** Busca un documento por ID incluyendo el userId del pedido para verificar ownership en el servicio */
  findByIdWithOrder(docId: number) {
    return this.prisma.document.findUnique({
      where: { id: docId },
      include: { order: { select: { userId: true } } },
    });
  }

  // ─── Creación ─────────────────────────────────────────────────────────────

  /** Crea un nuevo documento en la base de datos */
  create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  // ─── Eliminación ──────────────────────────────────────────────────────────

  /** Elimina un documento por ID */
  deleteById(id: number): Promise<Document> {
    return this.prisma.document.delete({ where: { id } });
  }

  // ─── Para limpiar uploadedBy (resolución del valor) ──────────────────────

  static resolveUploadedBy(role: string): UploadedBy {
    return role === 'admin' || role === 'super_admin'
      ? UploadedBy.admin
      : UploadedBy.client;
  }
}
