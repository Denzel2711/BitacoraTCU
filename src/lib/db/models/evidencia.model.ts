import 'server-only';
import { getPool } from '..';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { UploadedFile } from '@/lib/uploads';

export interface EvidenciaRow extends RowDataPacket {
  id: number;
  actividad_id: number;
  tipo_evidencia: 'Texto' | 'Foto' | 'Documentos';
  contenido_texto: string | null;
  ruta_archivo: string | null;
  nombre_archivo: string | null;
  tamano_archivo: number | null;
  tipo_mime: string | null;
}

interface EvidenciaInput {
  actividadId: number;
  tipoEvidencia: string;
  contenidoTexto?: string | null;
  rutaArchivo?: string | null;
  nombreArchivo?: string | null;
  tamanoArchivo?: number | null;
  tipoMime?: string | null;
}

class EvidenciaModel {
  static async findByActividad(actividadId: number): Promise<EvidenciaRow[]> {
    const [rows] = await getPool().query<EvidenciaRow[]>(
      'SELECT * FROM evidencias WHERE actividad_id = ?',
      [actividadId]
    );
    return rows;
  }

  static async findById(id: number): Promise<EvidenciaRow | undefined> {
    const [rows] = await getPool().query<EvidenciaRow[]>(
      'SELECT * FROM evidencias WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async create(data: EvidenciaInput): Promise<EvidenciaRow | undefined> {
    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO evidencias (actividad_id, tipo_evidencia, contenido_texto, ruta_archivo, nombre_archivo, tamano_archivo, tipo_mime)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.actividadId, data.tipoEvidencia,
        data.contenidoTexto || null, data.rutaArchivo || null,
        data.nombreArchivo || null, data.tamanoArchivo || null, data.tipoMime || null,
      ]
    );
    return this.findById(result.insertId);
  }

  static async createTexto(actividadId: number, contenidoTexto: string): Promise<EvidenciaRow | undefined> {
    return this.create({ actividadId, tipoEvidencia: 'Texto', contenidoTexto });
  }

  static async createArchivo(
    actividadId: number,
    tipoEvidencia: string,
    fileInfo: UploadedFile
  ): Promise<EvidenciaRow | undefined> {
    return this.create({
      actividadId, tipoEvidencia,
      rutaArchivo: fileInfo.path,
      nombreArchivo: fileInfo.filename,
      tamanoArchivo: fileInfo.size,
      tipoMime: fileInfo.mimetype,
    });
  }

  static async delete(id: number): Promise<true> {
    await getPool().query('DELETE FROM evidencias WHERE id = ?', [id]);
    return true;
  }
}

export default EvidenciaModel;
