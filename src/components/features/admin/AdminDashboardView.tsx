'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormHeader from '@/components/layout/FormHeader';
import { useAuthSession } from '@/hooks';

const AdminDashboardView = () => {
  const router = useRouter();
  const { session, loading, isAuthenticated, logout } = useAuthSession();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    const roles = session?.user.roles || [];
    const canAccessAdmin = roles.includes('Admin') || roles.includes('Academico');

    if (!loading && isAuthenticated && !canAccessAdmin) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, session, router]);

  if (loading || !session?.accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <p className="text-slate-700 font-medium">Validando sesión administrativa...</p>
      </div>
    );
  }

  const roles = session.user.roles || [];
  const isAdmin = roles.includes('Admin');
  const isAcademico = roles.includes('Academico');

  if (!isAdmin && !isAcademico) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 py-12 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        <FormHeader />

        <div className="p-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-cyan-900">Panel de Gestión TCU</h1>
              <p className="text-sm text-slate-600 max-w-3xl">
                Seleccione el módulo de trabajo: gestión de usuarios, estudiantes registrados y detalle de actividades/evidencias por estudiante.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/estudiantes" className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 hover:bg-cyan-100 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Estudiantes</p>
              <h2 className="mt-2 text-xl font-bold text-cyan-900">Estudiantes Registrados</h2>
              <p className="mt-2 text-sm text-slate-600">Listado editable de estudiantes y acceso al historial de actividades y evidencias.</p>
            </Link>

            <Link href="/admin/estudiantes/registro" className="rounded-2xl border border-orange-200 bg-orange-50 p-6 hover:bg-orange-100 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Registro</p>
              <h2 className="mt-2 text-xl font-bold text-orange-900">Onboarding de Estudiante</h2>
              <p className="mt-2 text-sm text-slate-600">Crear o reactivar estudiantes con matrícula activa y cuenta de acceso.</p>
            </Link>

            <Link
              href={isAdmin ? '/admin/usuarios' : '/admin'}
              className={`rounded-2xl border p-6 transition-colors ${isAdmin ? 'border-slate-300 bg-slate-100 hover:bg-slate-200' : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed pointer-events-none'}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Usuarios</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Gestión de Usuarios</h2>
              <p className="mt-2 text-sm text-slate-600">
                {isAdmin
                  ? 'Administrar cuentas y múltiples roles por usuario.'
                  : 'Solo administradores pueden gestionar usuarios.'}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
