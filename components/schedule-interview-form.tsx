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
import { checkInterviewAccess, getInterviewStats } from "@/lib/interview-utils"
import { AlertCircle, Badge, Calendar, Check, Zap } from "lucide-react"


interface Candidate {
  id: string
  name: string
  email: string
}

interface Job {
  id: string
  title: string
}

interface InterviewStats {
  canSchedule: boolean
  limit: number | null
  used: number
  remaining: number | null
  hasUnlimited: boolean
  needsUpgrade: boolean
}


export function ScheduleInterviewForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [interviewStats, setInterviewStats] = useState<InterviewStats | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

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
    fetchInterviewStats()
  }, [])

  async function fetchCandidatesAndJobs() {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [candidatesResult, jobsResult] = await Promise.all([
        supabase.from("candidates").select("id, name, email").eq("user_id", user.id).order("name"),
        supabase.from("jobs").select("id, title").eq("user_id", user.id).eq("status", "open").order("title"),
      ])

      if (candidatesResult.data) setCandidates(candidatesResult.data)
      if (jobsResult.data) setJobs(jobsResult.data)
    } catch (err) {
      console.error("Error fetching data:", err)
    }
  }

  async function fetchInterviewStats() {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const stats = await getInterviewStats(user.id)
      setInterviewStats(stats)

      // Auto-show upgrade prompt if can't schedule
      if (stats.needsUpgrade) {
        setShowUpgradePrompt(true)
      }
    } catch (err) {
      console.error("Error fetching interview stats:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user can schedule interviews
    if (interviewStats?.needsUpgrade) {
      router.push("/dashboard/pricing?upgrade=interviews")
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { data: { user }, } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // DEBUG: Log before checking
      console.log('🔄 Before checking interview access for user:', user.id)
      const accessBefore = await checkInterviewAccess(user.id)
      console.log('📊 Access before insert:', accessBefore)


      // Combine date and time
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}:00Z`)

      console.log('📅 Scheduled date input:', {
        date: formData.scheduled_date,
        time: formData.scheduled_time,
        combined: scheduledAt,
        isoString: scheduledAt.toISOString()
      })


      // Check interview limit one more time
      const { canSchedule } = await checkInterviewAccess(user.id)
      if (!canSchedule) {
        throw new Error("Interview limit reached. Please upgrade your plan.")
      }

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
  // Show upgrade prompt if limit reached
  if (showUpgradePrompt) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <Card className="mb-6 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Interview Limit Reached
            </CardTitle>
            <CardDescription>
              Your current plan has reached its interview scheduling limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Usage Stats */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Interview Scheduling Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      {interviewStats?.limit ?
                        `You've scheduled ${interviewStats.used} of ${interviewStats.limit} interviews this month` :
                        "Checking your usage..."
                      }
                    </p>
                  </div>
                </div>

                {interviewStats?.limit && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Monthly Limit</span>
                      <span className="font-semibold">{interviewStats.limit} interviews</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${Math.min((interviewStats.used / interviewStats.limit) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span className="font-semibold">{interviewStats.used} / {interviewStats.limit}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Upgrade Options */}
              <div className="space-y-4">
                <h3 className="font-semibold">Upgrade for Unlimited Interviews</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Starter Plan (Current) */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle>Starter</CardTitle>
                      <CardDescription>Current Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          10 interviews/month
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          2 team members
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Basic analytics
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Professional Plan (Recommended) */}
                  <Card className="border-primary/30 border-2 relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle>Professional</CardTitle>
                      <CardDescription>Unlimited interviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <strong>Unlimited interviews</strong>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          10 team members
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Advanced analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Custom branding
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Enterprise Plan */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Enterprise</CardTitle>
                      <CardDescription>Full platform access</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Unlimited everything
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          24/7 support
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          White-label solution
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpgradePrompt(false)
                    router.push("/dashboard/interviews")
                  }}
                >
                  Back to Interviews
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push("/dashboard/pricing?upgrade=interviews")}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("scheduleInterview.title")}</h1>
        <p className="text-muted-foreground">{t("scheduleInterview.subtitle")}</p>
      </div>

      {/* Interview Usage Banner */}
      {interviewStats && !interviewStats.hasUnlimited && (
        <Card className="mb-6 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Interview Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    {interviewStats.limit ?
                      `${interviewStats.remaining} interviews remaining this month` :
                      "Checking your usage..."
                    }
                  </p>
                </div>
              </div>
              {interviewStats.limit && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{interviewStats.remaining}</div>
                    <div className="text-xs text-muted-foreground">remaining</div>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span>0</span>
                      <span>{interviewStats.limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((interviewStats.used / interviewStats.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
