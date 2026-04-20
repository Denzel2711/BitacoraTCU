import EstudianteModel from '@/lib/db/models/estudiante.model';
import { fail, ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const estudiante = await EstudianteModel.findByIdentifier(id);

    if (!estudiante) {
      return fail('Estudiante no encontrado', 404);
    }

    const resumen = await EstudianteModel.getResumen(estudiante.id);

    if (!resumen) {
      return fail('Estudiante no encontrado', 404);
    }

    return ok(resumen);
  } catch (error) {
    return serverError(error);
  }
}
