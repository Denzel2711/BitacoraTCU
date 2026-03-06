import EstudianteModel from '@/lib/db/models/estudiante.model';
import { fail, ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ cedula: string }> }) {
  try {
    const { cedula } = await params;
    const estudiante = await EstudianteModel.findByCedula(cedula);

    if (!estudiante) {
      return fail('Estudiante no encontrado', 404);
    }

    return ok(estudiante);
  } catch (error) {
    return serverError(error);
  }
}
