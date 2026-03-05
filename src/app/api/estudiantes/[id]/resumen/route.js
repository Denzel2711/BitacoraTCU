import EstudianteModel from '@/lib/models/estudiante.model';
import { fail, ok, serverError } from '@/lib/http';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const resumen = await EstudianteModel.getResumen(id);

    if (!resumen) {
      return fail('Estudiante no encontrado', 404);
    }

    return ok(resumen);
  } catch (error) {
    return serverError(error);
  }
}
