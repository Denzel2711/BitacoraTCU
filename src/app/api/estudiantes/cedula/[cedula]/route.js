import EstudianteModel from '@/lib/models/estudiante.model';
import { fail, ok, serverError } from '@/lib/http';

export async function GET(_request, { params }) {
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
