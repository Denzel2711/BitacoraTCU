'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/layout/SectionHeader';
import { useAuthSession, useToast } from '@/hooks';

interface EvidenciaItem {
  id: number;
  tipo_evidencia: string;
  contenido_texto: string | null;
  ruta_archivo: string | null;
  nombre_archivo: string | null;
}

interface ActividadItem {
  id: number;
  fecha_actividad: string;
  tipo_actividad: string;
  subtipo_actividad: string;
  descripcion_actividad: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  horas_trabajadas: number;
  periodo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  matriculacion_estado: 'Activa' | 'Completada' | 'Suspendida' | null;
  evidencias: EvidenciaItem[];
}

const StudentMyActivitiesView = () => {
  const router = useRouter();
  const { session, loading: authLoading, isAuthenticated } = useAuthSession();
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActividadItem[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (!authLoading && isAuthenticated && session?.user.requiereCambioPassword) {
      router.replace('/auth');
      return;
    }

    const roles = session?.user.roles || [];
    const isStudent = roles.includes('Estudiante') && Boolean(session?.user.estudianteId);
    if (!authLoading && isAuthenticated && !isStudent) {
      router.replace('/admin');
    }
  }, [authLoading, isAuthenticated, session, router]);

  useEffect(() => {
    const load = async () => {
      if (!session?.accessToken) {
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/actividades/mis-actividades', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          credentials: 'include',
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || payload?.message || 'No fue posible cargar las actividades');
        }

        setActivities(payload.data as ActividadItem[]);
      } catch {
        toastError('No fue posible cargar tus actividades del período activo.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [session?.accessToken]);

  const summary = useMemo(() => {
    const totalHoras = activities.reduce((sum, item) => sum + (Number(item.horas_trabajadas) || 0), 0);
    const aprobadas = activities.filter((item) => item.estado === 'Aprobada').length;
    const pendientes = activities.filter((item) => item.estado === 'Pendiente').length;
    const rechazadas = activities.filter((item) => item.estado === 'Rechazada').length;

    return {
      totalActividades: activities.length,
      totalHoras,
      aprobadas,
      pendientes,
      rechazadas,
      periodo: activities[0]?.periodo || 'Período activo',
    };
  }, [activities]);

  if (authLoading || !session?.accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <p className="text-slate-700 font-medium">Validando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 py-12 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        <SectionHeader
          title="Mis Actividades"
          subtitle="Consulta tus actividades, evidencias y horas registradas del período activo."
          tone="cyan"
        />

        <div className="p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-cyan-900">Resumen del Período Activo</h1>
              <p className="text-sm text-slate-600">Período: {summary.periodo}</p>
            </div>
            <Link href="/" className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800">
              Volver al formulario
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Actividades</p>
              <p className="text-2xl font-bold text-slate-900">{summary.totalActividades}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3">
              <p className="text-xs text-slate-600">Horas Totales</p>
              <p className="text-2xl font-bold text-orange-700">{summary.totalHoras.toFixed(1)}h</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-slate-600">Aprobadas</p>
              <p className="text-2xl font-bold text-green-700">{summary.aprobadas}</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-xs text-slate-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-700">{summary.pendientes}</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3">
              <p className="text-xs text-slate-600">Rechazadas</p>
              <p className="text-2xl font-bold text-rose-700">{summary.rechazadas}</p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">Cargando actividades...</p>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              No hay actividades registradas en tu período activo.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <article key={activity.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                    <p className="font-semibold text-slate-900">
                        {new Date(activity.fecha_actividad).toLocaleDateString('es-ES', { timeZone: 'UTC' })} · {activity.tipo_actividad}
                    </p>
                      <p className="text-xs text-slate-500 mt-1">{activity.subtipo_actividad}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-800 font-medium">
                        {activity.estado}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {Number(activity.horas_trabajadas).toFixed(2)}h
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 mb-3">{activity.descripcion_actividad}</p>

                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800 mb-2">Evidencias</p>
                    {activity.evidencias.length === 0 ? (
                      <p className="text-xs text-slate-500">Sin evidencias asociadas.</p>
                    ) : (
                      <ul className="space-y-2">
                        {activity.evidencias.map((evidence) => (
                          <li key={evidence.id} className="text-sm text-slate-700 border border-slate-100 rounded-lg p-2 bg-slate-50">
                            <p><strong>Tipo:</strong> {evidence.tipo_evidencia}</p>
                            {evidence.contenido_texto ? <p className="text-xs mt-1"><strong>Descripción:</strong> {evidence.contenido_texto}</p> : null}
                            {evidence.nombre_archivo ? (
                              <p className="text-xs mt-1">
                                <strong>Archivo:</strong>{' '}
                                {evidence.ruta_archivo ? (
                                  <a href={evidence.ruta_archivo} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">
                                    {evidence.nombre_archivo}
                                  </a>
                                ) : evidence.nombre_archivo}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMyActivitiesView;
