import EstudianteModel from '@/lib/db/models/estudiante.model';
import { created, fail, ok, serverError } from '@/lib/http';
import { registerAuditEvent } from '@/lib/services/audit.service';
import { requireAuthRole } from '@/lib/auth/authorization';
import { assertSameOrigin } from '@/lib/security/request-context';
import { validateCedula } from '@/utils/validators';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuthRole(request, ['Admin', 'Academico']);
    if (authError) {
      return authError;
    }

    const estudiantes = await EstudianteModel.findAll();
    return ok(estudiantes, { total: estudiantes.length });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authError = requireAuthRole(request, ['Admin', 'Academico']);
    if (authError) {
      return authError;
    }

    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const body = await request.json();

    if (!validateCedula(String(body?.cedula ?? ''))) {
      return fail('La cedula debe tener entre 9 y 30 caracteres alfanumericos', 400);
    }

    const estudiante = await EstudianteModel.create(body);

    await registerAuditEvent({
      tabla: 'estudiantes',
      accion: 'CREATE',
      registroId: estudiante?.id ?? null,
      descripcion: 'Creacion de estudiante',
      after: estudiante,
      request: request as NextRequest,
    });

    return created(estudiante, 'Estudiante creado exitosamente');
  } catch (error) {
    if ((error as NodeJS.ErrnoException & { code?: string })?.code === 'ER_DUP_ENTRY') {
      return fail('Ya existe un estudiante con esa cedula', 409);
    }
    return serverError(error);
  }
}
