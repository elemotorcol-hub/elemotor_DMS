import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Realiza un upsert seguro de un Trim, buscando por modelId y name.
 * Evita la duplicación de lógica en múltiples seeders.
 */
export async function upsertTrim(
  prisma: PrismaClient,
  modelId: number,
  name: string,
  data: Parameters<typeof prisma.trim.create>[0]['data'],
) {
  const existing = await prisma.trim.findFirst({ where: { modelId, name } });
  return existing ?? (await prisma.trim.create({ data }));
}

/**
 * Obtiene el hash de la contraseña de administrador.
 * En producción (NODE_ENV=production), arroja error si no existe la variable de entorno.
 * En desarrollo, usa un fallback y lanza una advertencia.
 */
export async function getAdminPasswordHash(): Promise<string> {
  const envPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!envPassword) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: ADMIN_SEED_PASSWORD is required in production.');
    }
    console.warn('⚠️  WARNING: Usando contraseña de admin por defecto. ¡Solo para DEV/Local!');
  }

  const passwordToHash = envPassword || 'Admin2025!';
  return bcrypt.hash(passwordToHash, 10);
}
