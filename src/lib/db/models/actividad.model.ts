import 'server-only';
import { getPool } from '..';
import EstudianteModel from './estudiante.model';
import MatriculacionModel from './matriculacion.model';
import type { RowDataPacket } from 'mysql2';

export interface ActividadRow extends RowDataPacket {
  id: number;
  estudiante_id: number;
  cedula: string;
  fecha_actividad: string;
  tipo_actividad: string;
  subtipo_actividad: string;
  tipo_capacitacion: string | null;
  experiencias_aprendizajes: string | null;
  descripcion_actividad: string;
  hora_inicio: string;
  hora_final: string;
  horas_trabajadas: number;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  descripcion_ubicacion: string | null;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  fecha_registro: string;
  matriculacion_id: number | null;
  periodo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  matriculacion_estado: 'Activa' | 'Completada' | 'Suspendida' | null;
}

interface ActividadFilters {
  estudianteId?: string | number;
  cedula?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  limit?: string | number;
}

interface ActividadInput {
  estudianteId: number;
  fechaActividad: string;
  tipoActividad: string;
  subtipoActividad: string;
  tipoCapacitacion?: string | null;
  experienciasAprendizajes?: string | null;
  descripcionActividad: string;
  horaInicio: string;
  horaFinal: string;
  ubicacionLat?: number | null;
  ubicacionLng?: number | null;
  descripcionUbicacion?: string | null;
}

class ActividadModel {
  private static async resolveEstudianteId(estudianteId?: string | number): Promise<number | null> {
    if (estudianteId === undefined || estudianteId === null || estudianteId === '') {
      return null;
    }

    const stringValue = String(estudianteId).trim();

    if (/^\d+$/.test(stringValue)) {
      return Number(stringValue);
    }

    const estudiante = await EstudianteModel.findByIdentifier(stringValue);
    return estudiante?.id ?? null;
  }

  static async findAll(filters: ActividadFilters = {}): Promise<ActividadRow[]> {
    let query = 'SELECT * FROM vista_actividades_completas WHERE 1=1';
    const params: unknown[] = [];

    const resolvedEstudianteId = await this.resolveEstudianteId(filters.estudianteId);
    if (filters.estudianteId && resolvedEstudianteId === null) {
      return [];
    }

    if (resolvedEstudianteId !== null) { query += ' AND estudiante_id = ?'; params.push(resolvedEstudianteId); }
    if (filters.cedula)       { query += ' AND cedula = ?';         params.push(filters.cedula); }
    if (filters.estado)       { query += ' AND estado = ?';         params.push(filters.estado); }
    if (filters.fechaInicio)  { query += ' AND fecha_actividad >= ?'; params.push(filters.fechaInicio); }
    if (filters.fechaFin)     { query += ' AND fecha_actividad <= ?'; params.push(filters.fechaFin); }

    query += ' ORDER BY fecha_actividad DESC, fecha_registro DESC';

    if (filters.limit) { query += ' LIMIT ?'; params.push(Number(filters.limit)); }

    const [rows] = await getPool().query<ActividadRow[]>(query, params);
    return rows;
  }

  static async findById(id: number): Promise<ActividadRow | undefined> {
    const [rows] = await getPool().query<ActividadRow[]>(
      'SELECT * FROM vista_actividades_completas WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async create(data: ActividadInput): Promise<ActividadRow | undefined> {
    const connection = await getPool().getConnection();
    try {
      const activeMatriculacion = await MatriculacionModel.findActiveByEstudianteId(data.estudianteId);

      if (!activeMatriculacion) {
        throw new Error('El estudiante no tiene una matricula activa de TCU para registrar actividades');
      }

      await connection.beginTransaction();
      await connection.query(
        'CALL sp_registrar_actividad(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @actividad_id)',
        [
          data.estudianteId, data.fechaActividad, data.tipoActividad, data.subtipoActividad,
          data.tipoCapacitacion || null, data.experienciasAprendizajes || null,
          data.descripcionActividad, data.horaInicio, data.horaFinal,
          data.ubicacionLat || null, data.ubicacionLng || null, data.descripcionUbicacion || null,
        ]
      );
      const [idResult] = await connection.query<RowDataPacket[]>('SELECT @actividad_id as id');
      const actividadId: number = idResult[0].id;

      await connection.query(
        'UPDATE actividades SET matriculacion_id = ? WHERE id = ?',
        [activeMatriculacion.id, actividadId]
      );

      await connection.commit();
      return this.findById(actividadId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, data: Partial<ActividadInput>): Promise<ActividadRow | undefined> {
    await getPool().query(
      `UPDATE actividades
       SET tipo_actividad = ?, subtipo_actividad = ?, tipo_capacitacion = ?,
           experiencias_aprendizajes = ?, descripcion_actividad = ?,
           hora_inicio = ?, hora_final = ?,
           ubicacion_lat = ?, ubicacion_lng = ?, descripcion_ubicacion = ?
       WHERE id = ?`,
      [
        data.tipoActividad, data.subtipoActividad, data.tipoCapacitacion || null,
        data.experienciasAprendizajes || null, data.descripcionActividad,
        data.horaInicio, data.horaFinal,
        data.ubicacionLat || null, data.ubicacionLng || null, data.descripcionUbicacion || null,
        id,
      ]
    );
    return this.findById(id);
  }

  static async aprobar(id: number, observaciones = ''): Promise<ActividadRow | undefined> {
    await getPool().query('CALL sp_aprobar_actividad(?, ?)', [id, observaciones]);
    return this.findById(id);
  }

  static async rechazar(id: number, motivo: string): Promise<ActividadRow | undefined> {
    await getPool().query('CALL sp_rechazar_actividad(?, ?)', [id, motivo]);
    return this.findById(id);
  }

  static async findByEstudiante(estudianteId: number | string): Promise<ActividadRow[]> {
    const resolvedEstudianteId = await this.resolveEstudianteId(estudianteId);

    if (resolvedEstudianteId === null) {
      return [];
    }

    const [rows] = await getPool().query<ActividadRow[]>(
      'SELECT * FROM vista_actividades_completas WHERE estudiante_id = ? ORDER BY fecha_actividad DESC',
      [resolvedEstudianteId]
    );
    return rows;
  }

  static async delete(id: number): Promise<true> {
    await getPool().query('DELETE FROM actividades WHERE id = ?', [id]);
    return true;
  }

  static async getEstadisticas(estudianteId: number | string | null = null): Promise<RowDataPacket> {
    let query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'Aprobada'  THEN 1 ELSE 0 END) as aprobadas,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'Rechazada' THEN 1 ELSE 0 END) as rechazadas,
        SUM(horas_trabajadas) as total_horas,
        AVG(horas_trabajadas) as promedio_horas
      FROM actividades
    `;
    const params: unknown[] = [];
    const resolvedEstudianteId = await this.resolveEstudianteId(estudianteId ?? undefined);
    if (estudianteId && resolvedEstudianteId === null) {
      return { total: 0, aprobadas: 0, pendientes: 0, rechazadas: 0, total_horas: 0, promedio_horas: 0 } as RowDataPacket;
    }

    if (resolvedEstudianteId !== null) { query += ' WHERE estudiante_id = ?'; params.push(resolvedEstudianteId); }

    const [rows] = await getPool().query<RowDataPacket[]>(query, params);
    return rows[0];
  }
}

export default ActividadModel;
