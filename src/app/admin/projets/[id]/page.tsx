import ProjectEditor from "@/components/admin/ProjectEditor";
export default async function EditProjectPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  return (
    <ProjectEditor
      projectId={id}
    />
  );
}