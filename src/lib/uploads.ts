import 'server-only';
import fs from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024);

type TipoEvidencia = 'Foto' | 'Documentos' | 'Texto' | 'No incluye';

const ALLOWED_TYPES: Record<string, string[]> = {
  Foto: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  Documentos: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

export const ensureUploadsDir = async (): Promise<void> => {
  await fs.mkdir(uploadsDir, { recursive: true });
};

export const validateEvidenceFile = (tipoEvidencia: TipoEvidencia, file: File | null): void => {
  if (!tipoEvidencia || tipoEvidencia === 'Texto' || tipoEvidencia === 'No incluye') return;

  if (!file) throw new Error('Archivo requerido para evidencias de tipo Foto o Documentos');
  if (file.size > MAX_FILE_SIZE) throw new Error('El archivo excede el tamaño máximo permitido (5MB)');

  const allowed = ALLOWED_TYPES[tipoEvidencia];
  if (!allowed) throw new Error('Tipo de evidencia no válido');
  if (!allowed.includes(file.type)) throw new Error(`Tipo de archivo no permitido para ${tipoEvidencia}`);
};

export interface UploadedFile {
  filename: string;
  path: string;
  absolutePath: string;
  size: number;
  mimetype: string;
}

export const saveUploadedFile = async (file: File | null): Promise<UploadedFile | null> => {
  if (!file) return null;

  await ensureUploadsDir();

  const originalName = file.name || 'archivo';
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${baseName}-${uniqueSuffix}${extension}`;
  const absolutePath = path.join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return { filename, path: `/uploads/${filename}`, absolutePath, size: buffer.length, mimetype: file.type };
};

export const deleteUploadedFileByUrl = async (fileUrlPath: string | null): Promise<void> => {
  if (!fileUrlPath) return;

  const normalizedPath = fileUrlPath.startsWith('/uploads/')
    ? fileUrlPath.replace('/uploads/', '')
    : fileUrlPath.replace(/^uploads\//, '');

  try {
    await fs.unlink(path.join(uploadsDir, normalizedPath));
  } catch {
    // Idempotente: ignorar si el archivo ya no existe
  }
};
