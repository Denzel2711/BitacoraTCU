import StudentActivitiesView from '@/components/features/admin/StudentActivitiesView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEstudianteActividadesPage({ params }: PageProps) {
  const { id } = await params;
  return <StudentActivitiesView estudianteId={id} />;
}
