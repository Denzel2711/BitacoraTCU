import type { NextRequest } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getPool } from '@/lib/db';
import EstudianteModel from '@/lib/db/models/estudiante.model';
import MatriculacionModel from '@/lib/db/models/matriculacion.model';
import { hashPassword } from '@/lib/auth/password';
import { requireAuthRole } from '@/lib/auth/authorization';
import { created, fail, serverError } from '@/lib/http';
import { assertSameOrigin } from '@/lib/security/request-context';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface OnboardingBody {
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  carrera: string;
  academicoACargo: string;
  sede: string;
  nombreUsuario: string;
  email: string;
  password: string;
  periodo: string;
  fechaInicio: string;
  reinicioDesdeCero?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const authError = requireAuthRole(request, ['Admin', 'Academico']);
    if (authError) {
      return authError;
    }

    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const body = (await request.json()) as OnboardingBody;

    const requiredFields = [
      body.cedula,
      body.nombre,
      body.primerApellido,
      body.carrera,
      body.academicoACargo,
      body.sede,
      body.nombreUsuario,
      body.email,
      body.password,
      body.periodo,
      body.fechaInicio,
    ];

    if (requiredFields.some((value) => !String(value ?? '').trim())) {
      return fail('Faltan campos requeridos para el registro del estudiante', 400);
    }

    if (!EMAIL_REGEX.test(body.email)) {
      return fail('El email no tiene un formato valido', 400);
    }

    if (!PASSWORD_REGEX.test(body.password)) {
      return fail('La contraseña debe tener 12+ caracteres, mayúsculas, minúsculas, números y símbolos', 400);
    }

    let estudiante = await EstudianteModel.findByCedulaForTutor(body.cedula);

    if (!estudiante) {
      estudiante = await EstudianteModel.create({
        cedula: body.cedula,
        nombre: body.nombre,
        primerApellido: body.primerApellido,
        segundoApellido: body.segundoApellido || '',
        carrera: body.carrera,
        academicoACargo: body.academicoACargo,
        sede: body.sede,
      });
    } else {
      estudiante = await EstudianteModel.update(estudiante.id, {
        nombre: body.nombre,
        primerApellido: body.primerApellido,
        segundoApellido: body.segundoApellido || '',
        carrera: body.carrera,
        academicoACargo: body.academicoACargo,
        sede: body.sede,
      });
    }

    if (!estudiante) {
      return fail('No se pudo crear/actualizar el estudiante', 500);
    }

    const passwordHash = await hashPassword(body.password);
    const [existingUsers] = await getPool().query<RowDataPacket[]>(
      `SELECT id FROM usuarios WHERE estudiante_id = ? LIMIT 1`,
      [estudiante.id]
    );

    let usuarioId: number;

    if (!existingUsers[0]) {
      const [insertResult] = await getPool().query<ResultSetHeader>(
        `INSERT INTO usuarios (
          nombre_usuario,
          email,
          password_hash,
          nombre_completo,
          rol,
          activo,
          estudiante_id,
          intentos_fallidos,
          requiere_cambio_password,
          fecha_cambio_password
        ) VALUES (?, ?, ?, ?, 'Estudiante', 1, ?, 0, 1, NULL)`,
        [
          body.nombreUsuario.trim(),
          body.email.trim().toLowerCase(),
          passwordHash,
          `${body.nombre.trim()} ${body.primerApellido.trim()} ${String(body.segundoApellido || '').trim()}`.trim(),
          estudiante.id,
        ]
      );

      usuarioId = insertResult.insertId;

      await getPool().query(
        `INSERT INTO usuario_roles (usuario_id, rol)
         VALUES (?, 'Estudiante')`,
        [usuarioId]
      );
    } else {
      usuarioId = Number(existingUsers[0].id);
      await getPool().query(
        `UPDATE usuarios
         SET nombre_usuario = ?,
             email = ?,
             nombre_completo = ?,
             password_hash = ?,
             activo = 1,
             estudiante_id = ?,
             intentos_fallidos = 0,
             bloqueado_hasta = NULL,
             requiere_cambio_password = 1,
             fecha_cambio_password = NULL
         WHERE id = ?`,
        [
          body.nombreUsuario.trim(),
          body.email.trim().toLowerCase(),
          `${body.nombre.trim()} ${body.primerApellido.trim()} ${String(body.segundoApellido || '').trim()}`.trim(),
          passwordHash,
          estudiante.id,
          usuarioId,
        ]
      );

      await getPool().query(
        `INSERT INTO usuario_roles (usuario_id, rol)
         VALUES (?, 'Estudiante')
         ON DUPLICATE KEY UPDATE rol = VALUES(rol)`,
        [usuarioId]
      );
    }

    const matriculacion = body.reinicioDesdeCero
      ? await MatriculacionModel.restartCycle({
          estudianteId: estudiante.id,
          periodo: body.periodo.trim(),
          fechaInicio: body.fechaInicio,
        })
      : await MatriculacionModel.create({
          estudianteId: estudiante.id,
          periodo: body.periodo.trim(),
          fechaInicio: body.fechaInicio,
        });

    if (!matriculacion) {
      return fail('No se pudo crear la matricula activa del estudiante', 500);
    }

    return created(
      {
        estudiante,
        usuarioId,
        matriculacion,
      },
      'Estudiante registrado y habilitado para iniciar sesion'
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException & { code?: string }).code === 'ER_DUP_ENTRY') {
      return fail('Ya existe un estudiante/usuario con esos datos únicos (cedula, email, usuario o periodo)', 409);
    }

    return serverError(error);
  }
}
