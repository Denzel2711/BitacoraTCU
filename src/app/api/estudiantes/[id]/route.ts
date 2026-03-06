import EstudianteModel from '@/lib/db/models/estudiante.model';
import { fail, ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const estudiante = await EstudianteModel.findById(Number(id));

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
    const { id } = await params;
    const body = await request.json();
    const estudiante = await EstudianteModel.update(Number(id), body);

    if (!estudiante) {
      return fail('Estudiante no encontrado', 404);
    }

    return ok(estudiante, { message: 'Estudiante actualizado exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
