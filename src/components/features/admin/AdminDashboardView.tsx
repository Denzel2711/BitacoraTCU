'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/layout/SectionHeader';
import { useAuthSession } from '@/hooks';

const AdminDashboardView = () => {
  const router = useRouter();
  const { session, loading, isAuthenticated, logout } = useAuthSession();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (!loading && isAuthenticated && session?.user.requiereCambioPassword) {
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
        <SectionHeader
          title="Panel de Gestión TCU"
          subtitle="Seleccione una sección para administrar usuarios, estudiantes y procesos académicos."
          tone="cyan"
        />

        <div className="p-8 space-y-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void logout()}
              className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>

          <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <Link href="/admin/estudiantes" className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 hover:bg-cyan-100 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Estudiantes</p>
              <h2 className="mt-2 text-xl font-bold text-cyan-900">Estudiantes Registrados</h2>
              <p className="mt-2 text-sm text-slate-600">Consulta y actualización general de la información de estudiantes.</p>
            </Link>

            <Link href="/admin/estudiantes/registro" className="rounded-2xl border border-orange-200 bg-orange-50 p-6 hover:bg-orange-100 transition-colors">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Registro</p>
              <h2 className="mt-2 text-xl font-bold text-orange-900">Registro de Estudiante</h2>
              <p className="mt-2 text-sm text-slate-600">Gestión de registro y continuidad de estudiantes en el sistema.</p>
            </Link>

            {isAdmin ? (
              <Link href="/admin/usuarios" className="rounded-2xl border border-slate-300 bg-slate-100 p-6 transition-colors hover:bg-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Usuarios</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Gestión de Usuarios</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Administración general de cuentas de acceso del sistema.
                </p>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
