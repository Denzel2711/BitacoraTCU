import EstudianteModel from '@/lib/db/models/estudiante.model';
import { created, fail, ok, serverError } from '@/lib/http';

export async function GET() {
  try {
    const estudiantes = await EstudianteModel.findAll();
    return ok(estudiantes, { total: estudiantes.length });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const estudiante = await EstudianteModel.create(body);
    return created(estudiante, 'Estudiante creado exitosamente');
  } catch (error) {
    if ((error as NodeJS.ErrnoException & { code?: string })?.code === 'ER_DUP_ENTRY') {
      return fail('Ya existe un estudiante con esa cedula', 409);
    }
    return serverError(error);
  }
}
