"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Video, Phone, User, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Interview {
  id: string
  candidate_id: string
  job_id: string | null
  title: string
  description: string | null
  interview_type: string | null
  status: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  interviewer_name: string | null
  interviewer_email: string | null
  notes: string | null
  candidates: {
    name: string
    email: string
  }
}

export function InterviewScheduling() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list")

  useEffect(() => {
    fetchInterviews()
  }, [])

  async function fetchInterviews() {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("interviews")
        .select(
          `
          *,
          candidates (
            name,
            email
          )
        `,
        )
        .order("scheduled_at", { ascending: true })

      if (error) throw error

      setInterviews(data || [])
    } catch (error) {
      console.error("[v0] Error fetching interviews:", error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteInterview(id: string) {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("interviews").delete().eq("id", id)

      if (error) throw error

      setInterviews(interviews.filter((interview) => interview.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting interview:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-primary/10 text-primary"
      case "completed":
        return "bg-green-500/10 text-green-500"
      case "cancelled":
        return "bg-red-500/10 text-red-500"
      case "rescheduled":
        return "bg-yellow-500/10 text-yellow-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case "video":
        return Video
      case "phone":
        return Phone
      case "in-person":
        return MapPin
      default:
        return User
    }
  }

  const upcomingInterviews = interviews.filter(
    (interview) => new Date(interview.scheduled_at) >= new Date() && interview.status === "scheduled",
  )

  const pastInterviews = interviews.filter(
    (interview) => new Date(interview.scheduled_at) < new Date() || interview.status !== "scheduled",
  )

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Interview Scheduling</h1>
          <p className="text-muted-foreground">Manage and schedule candidate interviews</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
            className="bg-transparent"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {viewMode === "list" ? "Calendar View" : "List View"}
          </Button>
          <Button asChild>
            <Link href="/dashboard/interviews/new">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Interview
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No interviews scheduled</h3>
            <p className="text-muted-foreground mb-4">Start scheduling interviews with your candidates</p>
            <Button asChild>
              <Link href="/dashboard/interviews/new">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Your First Interview
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Interviews ({upcomingInterviews.length})</h2>
            {upcomingInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No upcoming interviews</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingInterviews.map((interview) => {
                  const TypeIcon = getTypeIcon(interview.interview_type)
                  return (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{interview.title}</CardTitle>
                              <Badge className={getStatusColor(interview.status)} variant="secondary">
                                {interview.status}
                              </Badge>
                              {interview.interview_type && (
                                <Badge variant="outline" className="gap-1">
                                  <TypeIcon className="w-3 h-3" />
                                  {interview.interview_type}
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-base">
                              with {interview.candidates?.name || "Unknown Candidate"}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/interviews/${interview.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteInterview(interview.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{format(parseISO(interview.scheduled_at), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(parseISO(interview.scheduled_at), "h:mm a")} ({interview.duration_minutes} min)
                            </span>
                          </div>
                          {interview.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate max-w-xs">{interview.location}</span>
                            </div>
                          )}
                          {interview.interviewer_name && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              <span>{interview.interviewer_name}</span>
                            </div>
                          )}
                        </div>
                        {interview.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{interview.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Past Interviews */}
          {pastInterviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Interviews ({pastInterviews.length})</h2>
              <div className="grid gap-4">
                {pastInterviews.slice(0, 5).map((interview) => {
                  const TypeIcon = getTypeIcon(interview.interview_type)
                  return (
                    <Card key={interview.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{interview.title}</CardTitle>
                              <Badge className={getStatusColor(interview.status)} variant="secondary">
                                {interview.status}
                              </Badge>
                            </div>
                            <CardDescription>with {interview.candidates?.name || "Unknown Candidate"}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{format(parseISO(interview.scheduled_at), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{format(parseISO(interview.scheduled_at), "h:mm a")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
