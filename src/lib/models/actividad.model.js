import { getPool } from '../database';

class ActividadModel {
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM vista_actividades_completas WHERE 1=1';
    const params = [];

    if (filters.estudianteId) {
      query += ' AND estudiante_id = ?';
      params.push(filters.estudianteId);
    }

    if (filters.cedula) {
      query += ' AND cedula = ?';
      params.push(filters.cedula);
    }

    if (filters.estado) {
      query += ' AND estado = ?';
      params.push(filters.estado);
    }

    if (filters.fechaInicio) {
      query += ' AND fecha_actividad >= ?';
      params.push(filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query += ' AND fecha_actividad <= ?';
      params.push(filters.fechaFin);
    }

    query += ' ORDER BY fecha_actividad DESC, fecha_registro DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(Number(filters.limit));
    }

    const [rows] = await getPool().query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query(
      'SELECT * FROM vista_actividades_completas WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async create(data) {
    const connection = await getPool().getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        'CALL sp_registrar_actividad(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @actividad_id)',
        [
          data.estudianteId,
          data.fechaActividad,
          data.tipoActividad,
          data.subtipoActividad,
          data.tipoCapacitacion || null,
          data.experienciasAprendizajes || null,
          data.descripcionActividad,
          data.horaInicio,
          data.horaFinal,
          data.ubicacionLat || null,
          data.ubicacionLng || null,
          data.descripcionUbicacion || null
        ]
      );

      const [idResult] = await connection.query('SELECT @actividad_id as id');
      const actividadId = idResult[0].id;

      await connection.commit();
      return this.findById(actividadId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id, data) {
    await getPool().query(
      `UPDATE actividades
       SET tipo_actividad = ?, subtipo_actividad = ?, tipo_capacitacion = ?,
           experiencias_aprendizajes = ?, descripcion_actividad = ?,
           hora_inicio = ?, hora_final = ?,
           ubicacion_lat = ?, ubicacion_lng = ?, descripcion_ubicacion = ?
       WHERE id = ?`,
      [
        data.tipoActividad,
        data.subtipoActividad,
        data.tipoCapacitacion || null,
        data.experienciasAprendizajes || null,
        data.descripcionActividad,
        data.horaInicio,
        data.horaFinal,
        data.ubicacionLat || null,
        data.ubicacionLng || null,
        data.descripcionUbicacion || null,
        id
      ]
    );

    return this.findById(id);
  }

  static async aprobar(id, observaciones = '') {
    await getPool().query('CALL sp_aprobar_actividad(?, ?)', [id, observaciones]);
    return this.findById(id);
  }

  static async rechazar(id, observaciones) {
    await getPool().query('CALL sp_rechazar_actividad(?, ?)', [id, observaciones]);
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM actividades WHERE id = ?', [id]);
    return true;
  }

  static async findByEstudiante(estudianteId) {
    const [rows] = await getPool().query(
      'SELECT * FROM vista_actividades_completas WHERE estudiante_id = ? ORDER BY fecha_actividad DESC',
      [estudianteId]
    );

    return rows;
  }

  static async getEstadisticas(estudianteId = null) {
    let query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'Aprobada' THEN 1 ELSE 0 END) as aprobadas,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'Rechazada' THEN 1 ELSE 0 END) as rechazadas,
        SUM(horas_trabajadas) as total_horas,
        AVG(horas_trabajadas) as promedio_horas
      FROM actividades
    `;

    const params = [];
    if (estudianteId) {
      query += ' WHERE estudiante_id = ?';
      params.push(estudianteId);
    }

    const [rows] = await getPool().query(query, params);
    return rows[0];
  }
}

export default ActividadModel;
