import EstudianteModel from '@/lib/models/estudiante.model';
import { fail, ok, serverError } from '@/lib/http';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const estudiante = await EstudianteModel.findById(id);

    if (!estudiante) {
      return fail('Estudiante no encontrado', 404);
    }

    return ok(estudiante);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const estudiante = await EstudianteModel.update(id, body);

    if (!estudiante) {
      return fail('Estudiante no encontrado', 404);
    }

    return ok(estudiante, { message: 'Estudiante actualizado exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
