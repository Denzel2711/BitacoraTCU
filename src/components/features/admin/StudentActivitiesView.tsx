'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/layout/SectionHeader';
import { useAuthSession, useToast } from '@/hooks';
import { adminService, type AdminActivity } from '@/services/admin';

type EvidenceItem = {
  id: number;
  tipo_evidencia: string;
  descripcion_texto: string | null;
  nombre_archivo: string | null;
  ruta_archivo: string | null;
};

interface StudentActivitiesViewProps {
  estudianteId: string;
}

interface GroupedActivities {
  [period: string]: {
    periodo: string;
    estado: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    actividades: AdminActivity[];
  };
}

const StudentActivitiesView = ({ estudianteId }: StudentActivitiesViewProps) => {
  const router = useRouter();
  const { session, loading: authLoading, isAuthenticated } = useAuthSession();
  const { error: toastError } = useToast();
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [evidenceMap, setEvidenceMap] = useState<Record<number, EvidenceItem[]>>({});
  const [loading, setLoading] = useState(false);

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
        const rows = await adminService.getStudentActivities(session.accessToken, estudianteId);
        setActivities(rows);

        const evidenceEntries = await Promise.all(
          rows.map(async (activity) => {
            const evidence = await adminService.getActivityEvidence(session.accessToken, activity.id);
            return [activity.id, evidence as EvidenceItem[]] as const;
          })
        );

        setEvidenceMap(Object.fromEntries(evidenceEntries));
      } catch {
        toastError('No fue posible cargar actividades. Intente nuevamente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [session, estudianteId]);

  // Agrupar actividades por período de matrícula
  const groupedActivities: GroupedActivities = activities.reduce((acc, activity) => {
    const periodo = activity.periodo || 'Sin período';
    if (!acc[periodo]) {
      acc[periodo] = {
        periodo: activity.periodo || 'N/A',
        estado: (activity as any).matriculacion_estado || 'Desconocido',
        fecha_inicio: (activity as any).fecha_inicio || null,
        fecha_fin: (activity as any).fecha_fin || null,
        actividades: [],
      };
    }
    acc[periodo].actividades.push(activity);
    return acc;
  }, {} as GroupedActivities);

  const sortedPeriods = Object.keys(groupedActivities).sort().reverse();

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activa':
        return 'bg-green-100 text-green-800';
      case 'Completada':
        return 'bg-blue-100 text-blue-800';
      case 'Suspendida':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
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
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        <SectionHeader
          title="Actividades del Estudiante"
          subtitle="Consulte el historial de actividades y evidencias organizadas por período."
          tone="cyan"
        />

        <div className="p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-cyan-900">Actividades y Evidencias del Estudiante</h1>
              <p className="text-sm text-slate-600">Estudiante ID: {estudianteId}</p>
              <p className="text-xs text-slate-500 mt-1">Visualiza actividades de todos los períodos de matrícula</p>
            </div>
            <Link href="/admin/estudiantes" className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800">
              Volver a estudiantes
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">Cargando actividades...</p>
          ) : sortedPeriods.length === 0 ? (
            <p className="text-sm text-slate-600">No hay actividades registradas para este estudiante.</p>
          ) : (
            <div className="space-y-8">
              {sortedPeriods.map((periodo) => {
                const group = groupedActivities[periodo];
                return (
                  <section key={periodo} className="border-l-4 border-cyan-500 pl-6">
                    {/* Encabezado de período */}
                    <div className="mb-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <h2 className="text-2xl font-bold text-cyan-900">
                            Período: {group.periodo || 'Sin asignar'}
                          </h2>
                          {group.fecha_inicio && (
                            <p className="text-sm text-slate-600 mt-1">
                              Inicio: {new Date(group.fecha_inicio).toLocaleDateString('es-ES')}
                              {group.fecha_fin && ` · Fin: ${new Date(group.fecha_fin).toLocaleDateString('es-ES')}`}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full font-semibold text-sm ${getEstadoColor(group.estado)}`}>
                          {group.estado}
                        </span>
                      </div>
                      
                      {/* Estadísticas del período */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-600">Total Actividades</p>
                          <p className="text-2xl font-bold text-slate-900">{group.actividades.length}</p>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3">
                          <p className="text-xs text-slate-600">Aprobadas</p>
                          <p className="text-2xl font-bold text-green-700">
                            {group.actividades.filter(a => (a as any).estado === 'Aprobada').length}
                          </p>
                        </div>
                        <div className="rounded-lg bg-yellow-50 p-3">
                          <p className="text-xs text-slate-600">Pendientes</p>
                          <p className="text-2xl font-bold text-yellow-700">
                            {group.actividades.filter(a => (a as any).estado === 'Pendiente').length}
                          </p>
                        </div>
                        <div className="rounded-lg bg-orange-50 p-3">
                          <p className="text-xs text-slate-600">Horas Totales</p>
                          <p className="text-2xl font-bold text-orange-700">
                            {group.actividades.reduce((sum, a) => sum + (Number((a as any).horas_trabajadas) || 0), 0).toFixed(1)}h
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Listado de actividades */}
                    <div className="space-y-4">
                      {group.actividades.map((activity) => (
                        <article key={activity.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-slate-100 transition">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {new Date(activity.fecha_actividad).toLocaleDateString('es-ES', { timeZone: 'UTC' })} · {activity.tipo_actividad}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">{(activity as any).subtipo_actividad}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-800 font-medium">
                                {(activity as any).estado}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {Number((activity as any).horas_trabajadas).toFixed(2)}h
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-700 mb-3">{(activity as any).descripcion_actividad}</p>

                          {/* Evidencias */}
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-sm font-semibold text-slate-800 mb-2">Evidencias</p>
                            {(evidenceMap[activity.id] || []).length === 0 ? (
                              <p className="text-xs text-slate-500">Sin evidencias asociadas.</p>
                            ) : (
                              <ul className="space-y-2">
                                {(evidenceMap[activity.id] || []).map((evidence) => (
                                  <li key={evidence.id} className="text-sm text-slate-700 border border-slate-100 rounded-lg p-2 bg-slate-50">
                                    <p><strong>Tipo:</strong> {evidence.tipo_evidencia}</p>
                                    {evidence.descripcion_texto ? <p className="text-xs mt-1"><strong>Descripción:</strong> {evidence.descripcion_texto}</p> : null}
                                    {evidence.nombre_archivo ? <p className="text-xs mt-1"><strong>Archivo:</strong> {evidence.nombre_archivo}</p> : null}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentActivitiesView;
