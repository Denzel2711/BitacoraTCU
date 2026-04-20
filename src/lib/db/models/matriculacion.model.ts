import 'server-only';

import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '..';

export interface MatriculacionRow extends RowDataPacket {
  id: number;
  estudiante_id: number;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: 'Activa' | 'Completada' | 'Suspendida';
  activo: boolean;
}

interface MatriculacionInput {
  estudianteId: number;
  periodo: string;
  fechaInicio: string;
  estado?: 'Activa' | 'Completada' | 'Suspendida';
}

class MatriculacionModel {
  static async findActiveByEstudianteId(estudianteId: number): Promise<MatriculacionRow | undefined> {
    const [rows] = await getPool().query<MatriculacionRow[]>(
      `SELECT *
       FROM matriculaciones
       WHERE estudiante_id = ?
         AND activo = 1
         AND estado = 'Activa'
       ORDER BY fecha_inicio DESC, id DESC
       LIMIT 1`,
      [estudianteId]
    );

    return rows[0];
  }

  static async deactivateActiveByEstudianteId(estudianteId: number): Promise<void> {
    await getPool().query(
      `UPDATE matriculaciones
       SET activo = 0,
           estado = 'Suspendida',
           fecha_fin = COALESCE(fecha_fin, CURDATE())
       WHERE estudiante_id = ?
         AND activo = 1
         AND estado = 'Activa'`,
      [estudianteId]
    );
  }

  static async create(input: MatriculacionInput): Promise<MatriculacionRow | undefined> {
    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO matriculaciones (
        estudiante_id,
        periodo,
        fecha_inicio,
        estado,
        activo
      ) VALUES (?, ?, ?, ?, 1)`,
      [
        input.estudianteId,
        input.periodo,
        input.fechaInicio,
        input.estado || 'Activa',
      ]
    );

    const [rows] = await getPool().query<MatriculacionRow[]>(
      'SELECT * FROM matriculaciones WHERE id = ?',
      [result.insertId]
    );

    return rows[0];
  }

  static async restartCycle(input: MatriculacionInput): Promise<MatriculacionRow | undefined> {
    await this.deactivateActiveByEstudianteId(input.estudianteId);
    return this.create(input);
  }
}

export default MatriculacionModel;
