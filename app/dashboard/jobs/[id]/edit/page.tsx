import { EditJobForm } from "@/components/edit-job-form"

export default function EditJobPage({ params }: { params: { id: string } }) {
  return <EditJobForm jobId={params.id} />
}
