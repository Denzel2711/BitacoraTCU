import EstudianteModel from '@/lib/db/models/estudiante.model';
import { fail, ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return fail('El parametro de busqueda "q" es requerido', 400);
    }

    const estudiantes = await EstudianteModel.search(query);
    return ok(estudiantes, { total: estudiantes.length });
  } catch (error) {
    return serverError(error);
  }
}
