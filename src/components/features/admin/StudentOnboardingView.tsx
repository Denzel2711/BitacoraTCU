'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FormHeader from '@/components/layout/FormHeader';
import { useAuthSession } from '@/hooks';
import { adminService, type AdminAcademic } from '@/services/admin';
import { onboardingService } from '@/services/onboarding';

const StudentOnboardingView = () => {
  const router = useRouter();
  const { session, loading: authLoading, isAuthenticated } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [loadingAcademicos, setLoadingAcademicos] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [academicos, setAcademicos] = useState<AdminAcademic[]>([]);

  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [carrera, setCarrera] = useState('');
  const [academicoACargo, setAcademicoACargo] = useState('');
  const [sede, setSede] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reinicioDesdeCero, setReinicioDesdeCero] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
    }

    const roles = session?.user.roles || [];
    const canAccessAdmin = roles.includes('Admin') || roles.includes('Academico');

    if (!authLoading && isAuthenticated && !canAccessAdmin) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, session, router]);

  useEffect(() => {
    const loadAcademicos = async () => {
      if (!session?.accessToken) {
        return;
      }

      setLoadingAcademicos(true);
      try {
        const rows = await adminService.getAcademicos(session.accessToken);
        setAcademicos(rows);
      } catch (loadError) {
        setError((loadError as Error)?.message || 'No se pudo cargar la lista de académicos');
      } finally {
        setLoadingAcademicos(false);
      }
    };

    void loadAcademicos();
  }, [session?.accessToken]);

  const resetForm = () => {
    setCedula('');
    setNombre('');
    setPrimerApellido('');
    setSegundoApellido('');
    setCarrera('');
    setAcademicoACargo('');
    setSede('');
    setPeriodo('');
    setFechaInicio('');
    setNombreUsuario('');
    setEmail('');
    setPassword('');
    setReinicioDesdeCero(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!session?.accessToken) {
        throw new Error('Se requiere una sesion administrativa activa');
      }

      await onboardingService.registerStudent({
        cedula,
        nombre,
        primerApellido,
        segundoApellido,
        carrera,
        academicoACargo,
        sede,
        nombreUsuario,
        email,
        password,
        periodo,
        fechaInicio,
        reinicioDesdeCero,
      }, session.accessToken);

      setSuccess('Estudiante registrado y habilitado para iniciar sesión.');
      resetForm();
    } catch (submitError) {
      setError((submitError as Error)?.message || 'No se pudo completar el registro del estudiante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        <FormHeader />

        <div className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-cyan-900">Registro Manual de Estudiantes</h2>
              <p className="text-sm text-slate-600">
                Crear o reactivar estudiantes y abrir su ciclo activo de TCU sin perder historial anterior.
              </p>
            </div>
            <Link href="/admin" className="text-sm font-semibold text-cyan-700 underline">
              Volver al panel
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Cédula" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
            <input value={primerApellido} onChange={(e) => setPrimerApellido(e.target.value)} placeholder="Primer apellido" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
            <input value={segundoApellido} onChange={(e) => setSegundoApellido(e.target.value)} placeholder="Segundo apellido" className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
            <input value={carrera} onChange={(e) => setCarrera(e.target.value)} placeholder="Carrera" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />

            <select
              value={academicoACargo}
              onChange={(e) => setAcademicoACargo(e.target.value)}
              required
              className="px-4 py-3 border-2 border-slate-300 rounded-xl"
              disabled={loadingAcademicos}
            >
              <option value="">{loadingAcademicos ? 'Cargando académicos...' : 'Seleccione académico a cargo'}</option>
              {academicos.map((academico) => (
                <option key={academico.id} value={academico.nombre_completo}>
                  {academico.nombre_completo}
                </option>
              ))}
            </select>

            <input value={sede} onChange={(e) => setSede(e.target.value)} placeholder="Sede" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
            <input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Periodo (ej. 2026-I)" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />

            <div className="md:col-span-2 border rounded-xl p-4 bg-slate-50">
              <p className="text-sm font-semibold text-slate-900 mb-3">Credenciales del Estudiante</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} placeholder="Usuario" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña temporal" required className="px-4 py-3 border-2 border-slate-300 rounded-xl" />
              </div>
            </div>

            <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={reinicioDesdeCero}
                onChange={(e) => setReinicioDesdeCero(e.target.checked)}
              />
              Crear este registro como reinicio de ciclo (desactiva la matrícula activa anterior del estudiante).
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 disabled:opacity-60"
              >
                {loading ? 'Registrando...' : 'Registrar Estudiante'}
              </button>
            </div>
          </form>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          {success && <p className="text-sm font-semibold text-green-700">{success}</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentOnboardingView;
