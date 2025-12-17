import { EditJobForm } from "@/components/edit-job-form"

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditJobForm jobId={id} />
}
