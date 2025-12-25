"use client"

import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, List, Plus, Clock, MapPin, Users, Video, Phone, UserCheck, CheckCircle  } from "lucide-react"
import Link from "next/link"
import { format, isToday, isTomorrow, isPast, isThisWeek } from "date-fns"
import { useI18n } from "@/lib/i18n-context"


const getInterviewIcon = (type: string) => {
  switch (type) {
    case "video":
      return <Video className="w-4 h-4" />
    case "phone":
      return <Phone className="w-4 h-4" />
    default:
      return <Users className="w-4 h-4" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</Badge>
    case "completed":
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
    case "cancelled":
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>
    case "rescheduled":
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Rescheduled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function InterviewScheduling() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list") // Add view mode state
  const supabase = useSupabase()
  const { t } = useI18n()

  useEffect(() => {
    fetchInterviews()
  }, [])

  async function fetchInterviews() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log("Fetching interviews for user:", user.id)

      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: true })

      if (error) throw error
      setInterviews(data || [])
    } catch (error) {
      console.error("Error fetching interviews:", error)
    } finally {
      setLoading(false)
    }
  }

  // Group interviews by date for calendar view
  const interviewsByDate = interviews.reduce((acc, interview) => {
    const date = format(new Date(interview.scheduled_at), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(interview)
    return acc
  }, {} as Record<string, any[]>)

  // Get unique dates for calendar view
  const interviewDates = Object.keys(interviewsByDate).sort()

  // Get interviews for today and upcoming
  const today = new Date()
  const todayInterviews = interviews.filter(interview =>
    isToday(new Date(interview.scheduled_at))
  )

  const upcomingInterviews = interviews.filter(interview =>
    !isPast(new Date(interview.scheduled_at)) && !isToday(new Date(interview.scheduled_at))
  )

  const pastInterviews = interviews.filter(interview =>
    isPast(new Date(interview.scheduled_at)) && !isToday(new Date(interview.scheduled_at))
  )

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    return format(date, "EEEE") // Day name
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading interviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Interviews</h1>
          <p className="text-muted-foreground">
            Schedule and manage candidate interviews
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle Buttons */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/30">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Button>
          </div>

          <Button asChild>
            <Link href="/dashboard/interviews/new">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Interview
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Interviews</p>
                <p className="text-2xl font-bold">{interviews.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todayInterviews.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingInterviews.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {interviews.filter(i => i.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Content */}
      {viewMode === "list" ? (
        // LIST VIEW
        <div className="space-y-6">
          {/* Today's Interviews */}
          {todayInterviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Today's Interviews ({todayInterviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayInterviews.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Interviews */}
          {upcomingInterviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Upcoming Interviews ({upcomingInterviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingInterviews.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Interviews */}
          {pastInterviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Past Interviews ({pastInterviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastInterviews.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {interviews.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No interviews scheduled</h3>
                <p className="text-muted-foreground mb-4">
                  Start by scheduling your first interview
                </p>
                <Button asChild>
                  <Link href="/dashboard/interviews/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Interview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // CALENDAR VIEW
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interviewDates.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No interviews scheduled</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {interviewDates.map((dateStr) => {
                    const date = new Date(dateStr)
                    const dayInterviews = interviewsByDate[dateStr]

                    return (
                      <div key={dateStr} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 text-center">
                            <div className="text-2xl font-bold text-primary">
                              {format(date, "d")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(date, "MMM")}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {getDayLabel(date)} • {format(date, "MMMM d, yyyy")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {dayInterviews.length} interview{dayInterviews.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="ml-20 space-y-3">
                          {dayInterviews.map((interview: { id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; status: string; interview_type: string; scheduled_at: string | number | Date; duration_minutes: any; location: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; candidate: { name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }; interviewer_name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; interviewer_email: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }) => (
                            <div
                              key={interview.id}
                              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold">{interview.title}</h4>
                                    {getStatusBadge(interview.status)}
                                    {getInterviewIcon(interview.interview_type)}
                                  </div>

                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-4 h-4" />
                                      <span>{format(new Date(interview.scheduled_at), "h:mm a")}</span>
                                      <span>• {interview.duration_minutes || 60} min</span>
                                    </div>

                                    {interview.location && (
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        <span>{interview.location}</span>
                                      </div>
                                    )}

                                    {interview.candidate && (
                                      <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        <span>{interview.candidate.name}</span>
                                      </div>
                                    )}
                                  </div>

                                  {interview.interviewer_name && (
                                    <div className="mt-2 text-sm">
                                      <span className="text-muted-foreground">Interviewer: </span>
                                      <span className="font-medium">{interview.interviewer_name}</span>
                                      {interview.interviewer_email && (
                                        <span className="text-muted-foreground ml-2">
                                          ({interview.interviewer_email})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/dashboard/interviews/${interview.id}`}>
                                      View
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/dashboard/interviews/${interview.id}/edit`}>
                                      Edit
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Interview Card Component for List View
function InterviewCard({ interview }: { interview: any }) {

  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="lg:w-48">
          <div className="text-sm font-medium text-primary">
            {format(new Date(interview.scheduled_at), "EEEE, MMM d")}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(interview.scheduled_at), "h:mm a")}</span>
            <span>• {interview.duration_minutes || 60} min</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{interview.title}</h4>
                {getInterviewIcon(interview.interview_type)}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {interview.candidate && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{interview.candidate.name}</span>
                    {interview.application?.job && (
                      <span>• {interview.application.job.title}</span>
                    )}
                  </div>
                )}

                {interview.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{interview.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              {getStatusBadge(interview.status)}
            </div>
          </div>

          {interview.interviewer_name && (
            <div className="text-sm">
              <span className="text-muted-foreground">Interviewer: </span>
              <span className="font-medium">{interview.interviewer_name}</span>
            </div>
          )}

          {interview.notes && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {interview.notes}
            </p>
          )}
        </div>

        <div className="flex lg:flex-col gap-2">
          <Button asChild size="sm">
            <Link href={`/dashboard/interviews/${interview.id}`}>
              View Details
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/interviews/${interview.id}/edit`}>
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}