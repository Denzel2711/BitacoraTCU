import { getPool } from '../database';

class EvidenciaModel {
  static async findByActividad(actividadId) {
    const [rows] = await getPool().query(
      'SELECT * FROM evidencias WHERE actividad_id = ?',
      [actividadId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM evidencias WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const [result] = await getPool().query(
      `INSERT INTO evidencias (actividad_id, tipo_evidencia, contenido_texto, ruta_archivo, nombre_archivo, tamano_archivo, tipo_mime)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.actividadId,
        data.tipoEvidencia,
        data.contenidoTexto || null,
        data.rutaArchivo || null,
        data.nombreArchivo || null,
        data.tamanoArchivo || null,
        data.tipoMime || null
      ]
    );

    return this.findById(result.insertId);
  }

  static async createTexto(actividadId, contenidoTexto) {
    return this.create({
      actividadId,
      tipoEvidencia: 'Texto',
      contenidoTexto
    });
  }

  static async createArchivo(actividadId, tipoEvidencia, fileInfo) {
    return this.create({
      actividadId,
      tipoEvidencia,
      rutaArchivo: fileInfo.path,
      nombreArchivo: fileInfo.filename,
      tamanoArchivo: fileInfo.size,
      tipoMime: fileInfo.mimetype
    });
  }

  static async delete(id) {
    await getPool().query('DELETE FROM evidencias WHERE id = ?', [id]);
    return true;
  }
}

export default EvidenciaModel;
