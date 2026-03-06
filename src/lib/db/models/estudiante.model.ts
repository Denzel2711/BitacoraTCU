import 'server-only';
import { getPool } from '..';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface EstudianteRow extends RowDataPacket {
  id: number;
  cedula: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  carrera: string;
  academico_a_cargo: string;
  sede: string;
  activo: boolean;
}

interface EstudianteInput {
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  carrera: string;
  academicoACargo: string;
  sede: string;
}

class EstudianteModel {
  static async findAll(): Promise<EstudianteRow[]> {
    const [rows] = await getPool().query<EstudianteRow[]>(
      'SELECT * FROM estudiantes WHERE activo = TRUE ORDER BY nombre, primer_apellido'
    );
    return rows;
  }

  static async findByCedula(cedula: string): Promise<EstudianteRow | undefined> {
    const [rows] = await getPool().query<EstudianteRow[]>(
      'SELECT * FROM estudiantes WHERE cedula = ? AND activo = TRUE',
      [cedula]
    );
    return rows[0];
  }

  static async findById(id: number): Promise<EstudianteRow | undefined> {
    const [rows] = await getPool().query<EstudianteRow[]>(
      'SELECT * FROM estudiantes WHERE id = ? AND activo = TRUE',
      [id]
    );
    return rows[0];
  }

  static async search(query: string): Promise<EstudianteRow[]> {
    const searchTerm = `%${query}%`;
    const [rows] = await getPool().query<EstudianteRow[]>(
      `SELECT * FROM estudiantes
       WHERE activo = TRUE
       AND (cedula LIKE ? OR nombre LIKE ? OR primer_apellido LIKE ? OR segundo_apellido LIKE ?)
       ORDER BY nombre, primer_apellido
       LIMIT 20`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
    return rows;
  }

  static async create(data: EstudianteInput): Promise<EstudianteRow | undefined> {
    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO estudiantes (cedula, nombre, primer_apellido, segundo_apellido, carrera, academico_a_cargo, sede)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.cedula, data.nombre, data.primerApellido, data.segundoApellido, data.carrera, data.academicoACargo, data.sede]
    );
    return this.findById(result.insertId);
  }

  static async update(id: number, data: Partial<EstudianteInput>): Promise<EstudianteRow | undefined> {
    await getPool().query(
      `UPDATE estudiantes
       SET nombre = ?, primer_apellido = ?, segundo_apellido = ?, carrera = ?, academico_a_cargo = ?, sede = ?
       WHERE id = ?`,
      [data.nombre, data.primerApellido, data.segundoApellido, data.carrera, data.academicoACargo, data.sede, id]
    );
    return this.findById(id);
  }

  static async getResumen(estudianteId: number): Promise<RowDataPacket | undefined> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT * FROM vista_resumen_estudiantes WHERE id = ?',
      [estudianteId]
    );
    return rows[0];
  }
}

export default EstudianteModel;
