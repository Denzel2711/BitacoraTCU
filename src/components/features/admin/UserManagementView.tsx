'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/layout/SectionHeader';
import { useAuthSession, useToast } from '@/hooks';
import { adminService, type AdminUser } from '@/services/admin';

const ROLE_OPTIONS: Array<'Admin' | 'Academico' | 'Estudiante'> = ['Admin', 'Academico', 'Estudiante'];
const CREATE_ROLE_OPTIONS: Array<'Admin' | 'Academico'> = ['Admin', 'Academico'];

const UserManagementView = () => {
  const router = useRouter();
  const { session, loading: authLoading, isAuthenticated } = useAuthSession();
  const { error: toastError, success: toastSuccess } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombreUsuario: '',
    nombreCompleto: '',
    email: '',
    password: '',
    roles: ['Academico'] as Array<'Admin' | 'Academico' | 'Estudiante'>,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (!authLoading && isAuthenticated && session?.user.requiereCambioPassword) {
      router.replace('/auth');
      return;
    }

    const isAdmin = session?.user.roles.includes('Admin');
    if (!authLoading && isAuthenticated && !isAdmin) {
      router.replace('/admin');
    }
  }, [authLoading, isAuthenticated, session, router]);

  useEffect(() => {
    const load = async () => {
      if (!session?.accessToken || !session.user.roles.includes('Admin')) {
        return;
      }

      setLoading(true);
      try {
        const rows = await adminService.getUsers(session.accessToken);
        setUsers(rows);
      } catch {
        toastError('No fue posible cargar usuarios. Intente nuevamente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [session]);

  const refreshUsers = async () => {
    if (!session?.accessToken) {
      return;
    }

    const rows = await adminService.getUsers(session.accessToken);
    setUsers(rows);
  };

  const toggleFormRole = (role: 'Admin' | 'Academico') => {
    setForm((prev) => {
      const exists = prev.roles.includes(role);
      const nextRoles = exists ? prev.roles.filter((r) => r !== role) : [...prev.roles, role];
      return { ...prev, roles: nextRoles };
    });
  };

  const toggleUserRole = (userId: number, role: 'Admin' | 'Academico' | 'Estudiante') => {
    setUsers((prev) => prev.map((user) => {
      if (user.id !== userId) {
        return user;
      }

      const currentRoles = user.roles || [user.rol];
      const exists = currentRoles.includes(role);
      const nextRoles = exists ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];

      return {
        ...user,
        roles: nextRoles,
        rol: nextRoles[0] || user.rol,
      };
    }));
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.accessToken) {
      return;
    }

    if (!form.roles.length) {
      toastError('Seleccione al menos un rol para el usuario.');
      return;
    }

    try {
      await adminService.createUser(session.accessToken, form);
      setForm({ nombreUsuario: '', nombreCompleto: '', email: '', password: '', roles: ['Academico'] });
      await refreshUsers();
      toastSuccess('Usuario creado correctamente.');
    } catch {
      toastError('No se pudo crear el usuario. Revise los datos e intente nuevamente.');
    }
  };

  const handleSaveUser = async (user: AdminUser) => {
    const roles = user.roles || [user.rol];
    if (!roles.length) {
      toastError('Cada usuario debe tener al menos un rol.');
      return;
    }

    if (roles.includes('Estudiante') && !user.estudiante_id) {
      toastError(`El usuario ${user.nombre_usuario} no tiene estudiante vinculado; use Onboarding para asignar ese rol.`);
      return;
    }

    try {
      setSavingUserId(user.id);
      await adminService.updateUser(session!.accessToken, user.id, {
        nombreUsuario: user.nombre_usuario,
        email: user.email,
        nombreCompleto: user.nombre_completo,
        roles,
        activo: Boolean(user.activo),
      });
      await refreshUsers();
      toastSuccess('Usuario actualizado correctamente.');
    } catch {
      toastError('No se pudo actualizar el usuario. Intente nuevamente.');
    } finally {
      setSavingUserId(null);
    }
  };

  if (authLoading || !session?.accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <p className="text-slate-700 font-medium">Validando sesión...</p>
      </div>
    );
  }

  if (!session.user.roles.includes('Admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        <SectionHeader
          title="Gestión de Usuarios"
          subtitle="Administre cuentas y perfiles de acceso para el entorno administrativo."
          tone="slate"
        />

        <div className="p-8 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-cyan-900">Gestión de Usuarios</h1>
              <p className="text-sm text-slate-600">Administre cuentas y roles múltiples por usuario.</p>
            </div>
            <Link href="/admin" className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800">
              Volver al panel
            </Link>
          </div>

          <section className="rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Crear usuario (Admin / Académico)</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={form.nombreUsuario} onChange={(e) => setForm((prev) => ({ ...prev, nombreUsuario: e.target.value }))} placeholder="Usuario" required className="px-4 py-3 border rounded-xl" />
              <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" required className="px-4 py-3 border rounded-xl" />
              <input value={form.nombreCompleto} onChange={(e) => setForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))} placeholder="Nombre completo" required className="px-4 py-3 border rounded-xl md:col-span-2" />
              <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Contraseña temporal" required className="px-4 py-3 border rounded-xl" />

              <div className="md:col-span-2 rounded-xl border bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800 mb-2">Roles</p>
                <div className="flex flex-wrap gap-3">
                  {CREATE_ROLE_OPTIONS.map((role) => (
                    <label key={role} className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleFormRole(role)} />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="px-5 py-3 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700">Crear usuario</button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Usuarios registrados</h2>
            {loading ? (
              <p className="text-sm text-slate-600">Cargando usuarios...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-3 pr-4">Usuario</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Nombre</th>
                      <th className="py-3 pr-4">Roles</th>
                      <th className="py-3 pr-4">Activo</th>
                      <th className="py-3 pr-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 align-top">
                        <td className="py-3 pr-4">
                          <input
                            value={user.nombre_usuario}
                            onChange={(e) => setUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, nombre_usuario: e.target.value } : item))}
                            className="px-3 py-2 border rounded-lg min-w-36"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="email"
                            value={user.email}
                            onChange={(e) => setUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, email: e.target.value } : item))}
                            className="px-3 py-2 border rounded-lg min-w-52"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            value={user.nombre_completo}
                            onChange={(e) => setUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, nombre_completo: e.target.value } : item))}
                            className="px-3 py-2 border rounded-lg min-w-56"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-col gap-1">
                            {ROLE_OPTIONS.map((role) => (
                              <label key={role} className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={(user.roles || [user.rol]).includes(role)}
                                  onChange={() => toggleUserRole(user.id, role)}
                                  disabled={role === 'Estudiante' && !user.estudiante_id && !(user.roles || [user.rol]).includes('Estudiante')}
                                />
                                {role}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="checkbox"
                            checked={Boolean(user.activo)}
                            onChange={(e) => setUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, activo: e.target.checked } : item))}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            disabled={savingUserId === user.id}
                            onClick={() => void handleSaveUser(user)}
                            className="px-3 py-2 rounded-lg bg-slate-700 text-white font-semibold disabled:opacity-60"
                          >
                            {savingUserId === user.id ? 'Guardando...' : 'Guardar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default UserManagementView;
