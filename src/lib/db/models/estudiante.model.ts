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
  static async findByIdentifier(identifier: string): Promise<EstudianteRow | undefined> {
    const trimmedIdentifier = identifier.trim();

    if (/^\d+$/.test(trimmedIdentifier)) {
      return this.findById(Number(trimmedIdentifier));
    }

    return this.findByCedula(trimmedIdentifier);
  }

  static async findAll(): Promise<EstudianteRow[]> {
    const [rows] = await getPool().query<EstudianteRow[]>(
      `SELECT e.*
       FROM estudiantes e
       INNER JOIN usuarios u ON u.estudiante_id = e.id AND u.activo = 1
       INNER JOIN usuario_roles ur ON ur.usuario_id = u.id AND ur.rol = 'Estudiante'
       INNER JOIN matriculaciones m ON m.estudiante_id = e.id AND m.estado = 'Activa' AND m.activo = 1
       WHERE e.activo = TRUE
       ORDER BY e.nombre, e.primer_apellido`
    );
    return rows;
  }

  static async findAllForTutor(): Promise<EstudianteRow[]> {
    const [rows] = await getPool().query<EstudianteRow[]>(
      'SELECT * FROM estudiantes WHERE activo = TRUE ORDER BY nombre, primer_apellido'
    );
    return rows;
  }

  static async findByCedula(cedula: string): Promise<EstudianteRow | undefined> {
    const [rows] = await getPool().query<EstudianteRow[]>(
      `SELECT e.*
       FROM estudiantes e
       INNER JOIN usuarios u ON u.estudiante_id = e.id AND u.activo = 1
       INNER JOIN usuario_roles ur ON ur.usuario_id = u.id AND ur.rol = 'Estudiante'
       INNER JOIN matriculaciones m ON m.estudiante_id = e.id AND m.estado = 'Activa' AND m.activo = 1
       WHERE e.cedula = ?
         AND e.activo = TRUE
       LIMIT 1`,
      [cedula]
    );
    return rows[0];
  }

  static async findByCedulaForTutor(cedula: string): Promise<EstudianteRow | undefined> {
    const [rows] = await getPool().query<EstudianteRow[]>(
      'SELECT * FROM estudiantes WHERE cedula = ? AND activo = TRUE LIMIT 1',
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
      `SELECT e.*
       FROM estudiantes e
       INNER JOIN usuarios u ON u.estudiante_id = e.id AND u.activo = 1
       INNER JOIN usuario_roles ur ON ur.usuario_id = u.id AND ur.rol = 'Estudiante'
       INNER JOIN matriculaciones m ON m.estudiante_id = e.id AND m.estado = 'Activa' AND m.activo = 1
       WHERE e.activo = TRUE
       AND (e.cedula LIKE ? OR e.nombre LIKE ? OR e.primer_apellido LIKE ? OR e.segundo_apellido LIKE ?)
       ORDER BY e.nombre, e.primer_apellido
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
