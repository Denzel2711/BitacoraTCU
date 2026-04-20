'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FormHeader from '@/components/layout/FormHeader';
import { useAuthSession } from '@/hooks';
import { adminService, type AdminAcademic, type AdminStudent } from '@/services/admin';

const StudentRegistryView = () => {
  const router = useRouter();
  const { session, loading: authLoading, isAuthenticated } = useAuthSession();
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [academicos, setAcademicos] = useState<AdminAcademic[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    const roles = session?.user.roles || [];
    const canAccess = roles.includes('Admin') || roles.includes('Academico');
    if (!authLoading && isAuthenticated && !canAccess) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, session, router]);

  useEffect(() => {
    const load = async () => {
      if (!session?.accessToken) {
        return;
      }

      setLoading(true);
      try {
        const [studentsRows, academicosRows] = await Promise.all([
          adminService.getStudents(session.accessToken),
          adminService.getAcademicos(session.accessToken),
        ]);
        setStudents(studentsRows);
        setAcademicos(academicosRows);
      } catch (loadError) {
        setError((loadError as Error)?.message || 'No fue posible cargar estudiantes');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [session]);

  const academicoOptions = useMemo(() => academicos.map((item) => item.nombre_completo), [academicos]);

  const handleSaveStudent = async (student: AdminStudent) => {
    if (!session?.accessToken) {
      return;
    }

    setSavingStudentId(student.id);
    setError('');
    setSuccess('');

    try {
      await adminService.updateStudent(session.accessToken, student.id, {
        nombre: student.nombre,
        primerApellido: student.primer_apellido,
        segundoApellido: student.segundo_apellido || '',
        carrera: student.carrera,
        academicoACargo: student.academico_a_cargo,
        sede: student.sede,
      });
      setSuccess('Estudiante actualizado correctamente.');
    } catch (saveError) {
      setError((saveError as Error)?.message || 'No fue posible actualizar el estudiante');
    } finally {
      setSavingStudentId(null);
    }
  };

  if (authLoading || !session?.accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <p className="text-slate-700 font-medium">Validando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        <FormHeader />

        <div className="p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-cyan-900">Estudiantes Registrados</h1>
              <p className="text-sm text-slate-600">Edite datos de estudiante y consulte actividades con evidencias en pantalla separada.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/estudiantes/registro" className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700">
                Registrar estudiante
              </Link>
              <Link href="/admin" className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800">
                Volver al panel
              </Link>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">Cargando estudiantes...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-3 pr-3">Cédula</th>
                    <th className="py-3 pr-3">Nombre</th>
                    <th className="py-3 pr-3">Apellidos</th>
                    <th className="py-3 pr-3">Carrera</th>
                    <th className="py-3 pr-3">Académico</th>
                    <th className="py-3 pr-3">Sede</th>
                    <th className="py-3 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b last:border-0 align-top">
                      <td className="py-3 pr-3">{student.cedula}</td>
                      <td className="py-3 pr-3">
                        <input
                          value={student.nombre}
                          onChange={(e) => setStudents((prev) => prev.map((item) => item.id === student.id ? { ...item, nombre: e.target.value } : item))}
                          className="px-3 py-2 border rounded-lg min-w-40"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col gap-2">
                          <input
                            value={student.primer_apellido}
                            onChange={(e) => setStudents((prev) => prev.map((item) => item.id === student.id ? { ...item, primer_apellido: e.target.value } : item))}
                            className="px-3 py-2 border rounded-lg min-w-40"
                            placeholder="Primer apellido"
                          />
                          <input
                            value={student.segundo_apellido || ''}
                            onChange={(e) => setStudents((prev) => prev.map((item) => item.id === student.id ? { ...item, segundo_apellido: e.target.value } : item))}
                            className="px-3 py-2 border rounded-lg min-w-40"
                            placeholder="Segundo apellido"
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <input
                          value={student.carrera}
                          onChange={(e) => setStudents((prev) => prev.map((item) => item.id === student.id ? { ...item, carrera: e.target.value } : item))}
                          className="px-3 py-2 border rounded-lg min-w-44"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          value={student.academico_a_cargo}
                          onChange={(e) => setStudents((prev) => prev.map((item) => item.id === student.id ? { ...item, academico_a_cargo: e.target.value } : item))}
                          className="px-3 py-2 border rounded-lg min-w-44"
                        >
                          <option value="">Seleccione</option>
                          {academicoOptions.map((name) => (
                            <option key={`${student.id}-${name}`} value={name}>{name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-3">
                        <input
                          value={student.sede}
                          onChange={(e) => setStudents((prev) => prev.map((item) => item.id === student.id ? { ...item, sede: e.target.value } : item))}
                          className="px-3 py-2 border rounded-lg min-w-32"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSaveStudent(student)}
                            disabled={savingStudentId === student.id}
                            className="px-3 py-2 rounded-lg bg-slate-700 text-white font-semibold disabled:opacity-60"
                          >
                            {savingStudentId === student.id ? 'Guardando...' : 'Guardar'}
                          </button>
                          <Link
                            href={`/admin/estudiantes/${student.id}/actividades`}
                            className="px-3 py-2 rounded-lg bg-cyan-600 text-white font-semibold text-center hover:bg-cyan-700"
                          >
                            Ver actividades
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          {success && <p className="text-sm font-semibold text-green-700">{success}</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentRegistryView;
