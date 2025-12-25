"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Calendar,
  Pencil,
  ArrowLeft,
  Building2,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"

import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("title")
      .eq("id", id)
      .single()

    return {
      title: `${job?.title || 'Job'} - TalentHub`,
    }
  } catch {
    return {
      title: "Job - TalentHub",
    }
  }
}


interface Job {
  id: string
  title: string
  description: string | null
  department: string | null
  location: string | null
  employment_type: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  skills: string[] | null
  status: string
  created_at: string
  user_id: string
}

export default function JobDetailsPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applicationsCount, setApplicationsCount] = useState(0)
  const supabase = useSupabase()
  const router = useRouter()
  const params = useParams()
  const { t } = useI18n()
  const jobId = params.id as string

  useEffect(() => {
    fetchJobDetails()
    fetchApplicationsCount()
  }, [jobId])

  async function fetchJobDetails() {
    try {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single()

      if (error) throw error

      setJob(data)
    } catch (error) {
      console.error("Error fetching job details:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchApplicationsCount() {
    try {
      const { count, error } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", jobId)

      if (error) throw error

      setApplicationsCount(count || 0)
    } catch (error) {
      console.error("Error fetching applications count:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-primary/10 text-primary"
      case "closed":
        return "bg-red-500/10 text-red-500"
      case "draft":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getEmploymentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      "full-time": t("jobs.details.fullTime"),
      "part-time": t("jobs.details.partTime"),
      contract: t("jobs.details.contract"),
      temporary: t("jobs.details.temporary"),
      internship: t("jobs.details.internship"),
    }
    return types[type] || type
  }

  const getExperienceLevelLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      entry: t("jobs.details.entry"),
      mid: t("jobs.details.mid"),
      senior: t("jobs.details.senior"),
      lead: t("jobs.details.lead"),
      executive: t("jobs.details.executive"),
    }
    return levels[level] || level
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("jobs.loading")}</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("jobs.details.notFound")}</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("jobs.details.backToJobs")}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("jobs.details.backToJobs")}
          </Link>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              <Badge className={getStatusColor(job.status)} variant="secondary">
                {t(`jobs.status.${job.status}`)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              {job.department && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{job.department}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {t("jobs.details.posted")} {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/jobs/${job.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("jobs.edit")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t("jobs.details.description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {job.description || t("jobs.details.noDescription")}
              </p>
            </CardContent>
          </Card>

          {/* Skills Required */}
          {job.skills && job.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("jobs.details.skillsRequired")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t("jobs.details.overview")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{t("jobs.details.applications")}</span>
                </div>
                <span className="font-semibold">{applicationsCount}</span>
              </div>

              {job.employment_type && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{t("jobs.details.employmentType")}</span>
                    </div>
                    <span className="font-medium">{getEmploymentTypeLabel(job.employment_type)}</span>
                  </div>
                </>
              )}

              {job.experience_level && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm">{t("jobs.details.experienceLevel")}</span>
                    </div>
                    <span className="font-medium">{getExperienceLevelLabel(job.experience_level)}</span>
                  </div>
                </>
              )}

              {job.salary_min && job.salary_max && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">{t("jobs.details.salaryRange")}</span>
                    </div>
                    <span className="font-medium">
                      ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("jobs.details.actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/dashboard/jobs/${job.id}/candidates`}>
                  <Users className="mr-2 h-4 w-4" />
                  {t("jobs.viewCandidates")}
                </Link>
              </Button>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/dashboard/candidates/new">
                  <Briefcase className="mr-2 h-4 w-4" />
                  {t("jobs.details.addCandidate")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
