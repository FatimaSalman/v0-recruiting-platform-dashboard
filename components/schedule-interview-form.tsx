"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n-context"

interface Candidate {
  id: string
  name: string
  email: string
}

interface Job {
  id: string
  title: string
}

export function ScheduleInterviewForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [formData, setFormData] = useState({
    candidate_id: "",
    job_id: "",
    title: "",
    description: "",
    interview_type: "video",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: "60",
    location: "",
    interviewer_name: "",
    interviewer_email: "",
    notes: "",
  })

  const { t } = useI18n()

  useEffect(() => {
    fetchCandidatesAndJobs()
  }, [])

  async function fetchCandidatesAndJobs() {
    const supabase = createClient()

    try {
      const [candidatesResult, jobsResult] = await Promise.all([
        supabase.from("candidates").select("id, name, email").order("name"),
        supabase.from("jobs").select("id, title").eq("status", "open").order("title"),
      ])

      if (candidatesResult.data) setCandidates(candidatesResult.data)
      if (jobsResult.data) setJobs(jobsResult.data)
    } catch (err) {
      console.error("Error fetching data:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Combine date and time
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`)

      const { error: insertError } = await supabase.from("interviews").insert({
        user_id: user.id,
        candidate_id: formData.candidate_id,
        job_id: formData.job_id || null,
        title: formData.title,
        description: formData.description || null,
        interview_type: formData.interview_type,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: Number.parseInt(formData.duration_minutes),
        location: formData.location || null,
        interviewer_name: formData.interviewer_name || null,
        interviewer_email: formData.interviewer_email || null,
        notes: formData.notes || null,
      })

      if (insertError) throw insertError

      router.push("/dashboard/interviews")
    } catch (err) {
      console.error("Error scheduling interview:", err)
      setError(err instanceof Error ? err.message : t("auth.error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("scheduleInterview.title")}</h1>
        <p className="text-muted-foreground">{t("scheduleInterview.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("scheduleInterview.detailsTitle")}</CardTitle>
          <CardDescription>{t("scheduleInterview.detailsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Candidate and Job Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidate">{t("scheduleInterview.candidate")}</Label>
                <Select
                  required
                  value={formData.candidate_id}
                  onValueChange={(value) => setFormData({ ...formData, candidate_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("scheduleInterview.selectCandidate")} />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job">{t("scheduleInterview.job")}</Label>
                <Select value={formData.job_id} onValueChange={(value) => setFormData({ ...formData, job_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("scheduleInterview.selectJob")} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Interview Details */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("scheduleInterview.interviewTitle")}</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("scheduleInterview.titlePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("scheduleInterview.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder={t("scheduleInterview.descriptionPlaceholder")}
              />
            </div>

            {/* Interview Type and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t("scheduleInterview.type")}</Label>
                <Select
                  value={formData.interview_type}
                  onValueChange={(value) => setFormData({ ...formData, interview_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">{t("scheduleInterview.type.video")}</SelectItem>
                    <SelectItem value="phone">{t("scheduleInterview.type.phone")}</SelectItem>
                    <SelectItem value="in-person">{t("scheduleInterview.type.inPerson")}</SelectItem>
                    <SelectItem value="technical">{t("scheduleInterview.type.technical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">{t("scheduleInterview.duration")}</Label>
                <Select
                  value={formData.duration_minutes}
                  onValueChange={(value) => setFormData({ ...formData, duration_minutes: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">{t("scheduleInterview.duration.30")}</SelectItem>
                    <SelectItem value="45">{t("scheduleInterview.duration.45")}</SelectItem>
                    <SelectItem value="60">{t("scheduleInterview.duration.60")}</SelectItem>
                    <SelectItem value="90">{t("scheduleInterview.duration.90")}</SelectItem>
                    <SelectItem value="120">{t("scheduleInterview.duration.120")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t("scheduleInterview.date")}</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">{t("scheduleInterview.time")}</Label>
                <Input
                  id="time"
                  type="time"
                  required
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            {/* Location/Link */}
            <div className="space-y-2">
              <Label htmlFor="location">{t("scheduleInterview.location")}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t("scheduleInterview.locationPlaceholder")}
              />
            </div>

            {/* Interviewer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewer_name">{t("scheduleInterview.interviewerName")}</Label>
                <Input
                  id="interviewer_name"
                  value={formData.interviewer_name}
                  onChange={(e) => setFormData({ ...formData, interviewer_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interviewer_email">{t("scheduleInterview.interviewerEmail")}</Label>
                <Input
                  id="interviewer_email"
                  type="email"
                  value={formData.interviewer_email}
                  onChange={(e) => setFormData({ ...formData, interviewer_email: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("scheduleInterview.notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder={t("scheduleInterview.notesPlaceholder")}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? t("scheduleInterview.scheduling") : t("scheduleInterview.submit")}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
                {t("scheduleInterview.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
