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
      console.error("[v0] Error fetching data:", err)
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
      console.error("[v0] Error scheduling interview:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Schedule Interview</h1>
        <p className="text-muted-foreground">Schedule a new interview with a candidate</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
          <CardDescription>Enter the interview information below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Candidate and Job Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidate">Candidate *</Label>
                <Select
                  required
                  value={formData.candidate_id}
                  onValueChange={(value) => setFormData({ ...formData, candidate_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a candidate" />
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
                <Label htmlFor="job">Job Position (Optional)</Label>
                <Select value={formData.job_id} onValueChange={(value) => setFormData({ ...formData, job_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job" />
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
              <Label htmlFor="title">Interview Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Technical Interview - Round 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the interview..."
              />
            </div>

            {/* Interview Type and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Interview Type *</Label>
                <Select
                  value={formData.interview_type}
                  onValueChange={(value) => setFormData({ ...formData, interview_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="technical">Technical Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Select
                  value={formData.duration_minutes}
                  onValueChange={(value) => setFormData({ ...formData, duration_minutes: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
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
              <Label htmlFor="location">Location / Meeting Link</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Zoom link, Google Meet, or office address"
              />
            </div>

            {/* Interviewer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewer_name">Interviewer Name</Label>
                <Input
                  id="interviewer_name"
                  value={formData.interviewer_name}
                  onChange={(e) => setFormData({ ...formData, interviewer_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interviewer_email">Interviewer Email</Label>
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes or preparation instructions..."
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Scheduling..." : "Schedule Interview"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
