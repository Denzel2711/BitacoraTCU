import EstudianteModel from '@/lib/db/models/estudiante.model';
import { fail, ok, serverError } from '@/lib/http';
import { registerAuditEvent } from '@/lib/services/audit.service';
import { assertSameOrigin } from '@/lib/security/request-context';
import { requireAuthRole } from '@/lib/auth/authorization';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const estudiante = await EstudianteModel.findByIdentifier(id);

    if (!estudiante) {
      return fail('Estudiante no encontrado', 404);
    }

    return ok(estudiante);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = requireAuthRole(request, ['Admin', 'Academico']);
    if (authError) {
      return authError;
    }

    const { id } = await params;
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const body = await request.json();
    const currentStudent = await EstudianteModel.findByIdentifier(id);

    if (!currentStudent) {
      return fail('Estudiante no encontrado', 404);
    }

    const estudiante = await EstudianteModel.update(currentStudent.id, body);

    if (!estudiante) {
      return fail('Estudiante no encontrado', 404);
    }

    await registerAuditEvent({
      tabla: 'estudiantes',
      accion: 'UPDATE',
      registroId: estudiante.id,
      descripcion: 'Actualizacion de estudiante',
      before: currentStudent,
      after: estudiante,
      request,
    });

    return ok(estudiante, { message: 'Estudiante actualizado exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
