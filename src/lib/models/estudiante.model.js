import { getPool } from '../database';

class EstudianteModel {
  static async findAll() {
    const [rows] = await getPool().query(
      'SELECT * FROM estudiantes WHERE activo = TRUE ORDER BY nombre, primer_apellido'
    );
    return rows;
  }

  static async findByCedula(cedula) {
    const [rows] = await getPool().query(
      'SELECT * FROM estudiantes WHERE cedula = ? AND activo = TRUE',
      [cedula]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await getPool().query(
      'SELECT * FROM estudiantes WHERE id = ? AND activo = TRUE',
      [id]
    );
    return rows[0];
  }

  static async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await getPool().query(
      `SELECT * FROM estudiantes
       WHERE activo = TRUE
       AND (cedula LIKE ? OR nombre LIKE ? OR primer_apellido LIKE ? OR segundo_apellido LIKE ?)
       ORDER BY nombre, primer_apellido
       LIMIT 20`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
    return rows;
  }

  static async create(data) {
    const [result] = await getPool().query(
      `INSERT INTO estudiantes (cedula, nombre, primer_apellido, segundo_apellido, carrera, academico_a_cargo, sede)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.cedula,
        data.nombre,
        data.primerApellido,
        data.segundoApellido,
        data.carrera,
        data.academicoACargo,
        data.sede
      ]
    );

    return this.findById(result.insertId);
  }

  static async update(id, data) {
    await getPool().query(
      `UPDATE estudiantes
       SET nombre = ?, primer_apellido = ?, segundo_apellido = ?, carrera = ?, academico_a_cargo = ?, sede = ?
       WHERE id = ?`,
      [
        data.nombre,
        data.primerApellido,
        data.segundoApellido,
        data.carrera,
        data.academicoACargo,
        data.sede,
        id
      ]
    );

    return this.findById(id);
  }

  static async getResumen(estudianteId) {
    const [rows] = await getPool().query(
      'SELECT * FROM vista_resumen_estudiantes WHERE id = ?',
      [estudianteId]
    );
    return rows[0];
  }
}

export default EstudianteModel;
