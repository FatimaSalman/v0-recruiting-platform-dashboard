"use client"

import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, List, Plus, Clock, MapPin, Users, Video, Phone, UserCheck, CheckCircle } from "lucide-react"
import Link from "next/link"
import { format, isToday, isTomorrow, isPast } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"
import { useRouter } from "next/navigation"
import { getInterviewStats } from "@/lib/interview-utils"

const GetInterviewIcon = ({ type }: { type: string }) => {
  if (type === "video") {
    return <Video className="w-4 h-4" />
  } else if (type === "phone") {
    return <Phone className="w-4 h-4" />
  } else {
    return <Users className="w-4 h-4" />
  }
}

const GetStatusBadge = ({ status }: { status: string }) => {
  const { t } = useI18n()
  const statusKey = `status.interview.${status.toLowerCase()}`
  const statusText = t(statusKey)

  const colorMap: Record<string, string> = {
    scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    rescheduled: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  }

  return <Badge className={colorMap[status.toLowerCase()] || "outline"}>{statusText}</Badge>
}

export function InterviewScheduling() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list") // Add view mode state
  const supabase = useSupabase()
  const { t, locale } = useI18n()
  const dateLocale = locale === 'ar' ? ar : enUS
  const [interviewStats, setInterviewStats] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetchInterviews()
    fetchInterviewStats()
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

  async function fetchInterviewStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const stats = await getInterviewStats(user.id)
      setInterviewStats(stats)
    } catch (error) {
      console.error("Error fetching interview stats:", error)
    }
  }

  const handleNewInterview = () => {
    if (interviewStats?.canSchedule === false) {
      router.push("/dashboard/pricing?upgrade=interviews")
    } else {
      router.push("/dashboard/interviews/new")
    }
  }

  // Group interviews by date for calendar view
  const interviewsByDate = interviews.reduce((acc, interview) => {
    const date = format(new Date(interview.scheduled_at), 'yyyy-MM-dd', { locale: dateLocale })
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
    if (isToday(date)) return t("interviews.today")
    if (isTomorrow(date)) return t("interviews.tomorrow")
    return format(date, "EEEE", { locale: dateLocale }) // Day name
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">{t("interviews.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t("interviews.title")}</h1>
          <p className="text-muted-foreground">
            {t("interviews.subtitle")}
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
              {t("interviews.view.list")}
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {t("interviews.view.calendar")}
            </Button>
          </div>

          <Button asChild>
            <Link href="/dashboard/interviews/new">
              <Plus className="me-2 h-4 w-4" />
              {t("interviews.schedule")}
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
                <p className="text-sm text-muted-foreground">{t("reports.totalInterviews")}</p>
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
                <p className="text-sm text-muted-foreground">{t("interviews.today")}</p>
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
                <p className="text-sm text-muted-foreground">{t("interviews.upcoming")}</p>
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
                <p className="text-sm text-muted-foreground">{t("status.completed")}</p>
                <p className="text-2xl font-bold">
                  {interviews.filter(i => i.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Interview Stats Banner */}
      {interviewStats && (
        <Card className="mb-6 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Interview Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    {interviewStats.hasUnlimited ? (
                      t("interviews.stats.unlimited")
                    ) : interviewStats.limit ? (
                      `${interviewStats.remaining} ${t("interviews.stats.remainingMonth")}`
                    ) : (
                      t("interviews.stats.checking")
                    )}
                  </p>
                </div>
              </div>

              {interviewStats.limit && !interviewStats.hasUnlimited && (
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{interviewStats.used}</div>
                    <div className="text-xs text-muted-foreground">{t("interviews.stats.scheduled")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{interviewStats.limit}</div>
                    <div className="text-xs text-muted-foreground">{t("interviews.stats.monthlyLimit")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{interviewStats.remaining}</div>
                    <div className="text-xs text-muted-foreground">{t("interviews.stats.remaining")}</div>
                  </div>
                </div>
              )}

              {interviewStats.needsUpgrade && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/pricing?upgrade=interviews")}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {t("reports.upgradeForMore")}
                </Button>
              )}
            </div>

            {interviewStats.limit && !interviewStats.hasUnlimited && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
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
            )}
          </CardContent>
        </Card>
      )}

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
                  {t("interviews.todaysInterviews")} ({todayInterviews.length})
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
                  {t("interviews.upcoming")} ({upcomingInterviews.length})
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
                  {t("interviews.past")} ({pastInterviews.length})
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
                <h3 className="text-lg font-semibold mb-2">{t("interviews.noInterviews")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("interviews.startScheduling")}
                </p>
                <Button asChild>
                  <Link href="/dashboard/interviews/new">
                    <Plus className="me-2 h-4 w-4" />
                    {t("interviews.schedule")}
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
                {t("interviews.calendarView")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interviewDates.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t("interviews.noInterviews")}</p>
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
                              {format(date, "d", { locale: dateLocale })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(date, "MMM", { locale: dateLocale })}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {getDayLabel(date)} • {format(date, "MMMM d, yyyy", { locale: dateLocale })}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {dayInterviews.length} {dayInterviews.length !== 1 ? t("interviews.plural") : t("interviews.singular")}
                            </p>
                          </div>
                        </div>

                        <div className="ms-20 space-y-3">
                          {dayInterviews.map((interview: { id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; status: string; interview_type: string; scheduled_at: string | number | Date; duration_minutes: any; location: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; candidate: { name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }; interviewer_name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; interviewer_email: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }) => (
                            <div
                              key={interview.id}
                              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold">{interview.title}</h4>
                                    <GetStatusBadge status={interview.status} />
                                    <GetInterviewIcon type={interview.interview_type} />
                                  </div>

                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-4 h-4" />
                                      <span>{format(new Date(interview.scheduled_at), "h:mm a", { locale: dateLocale })}</span>
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
                                      <span className="text-muted-foreground">{t("interviews.interviewer")} </span>
                                      <span className="font-medium">{interview.interviewer_name}</span>
                                      {interview.interviewer_email && (
                                        <span className="text-muted-foreground ms-2">
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
                                      {t("common.view")}
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/dashboard/interviews/${interview.id}/edit`}>
                                      {t("common.edit")}
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
  const { t, locale } = useI18n()
  const dateLocale = locale === 'ar' ? ar : enUS

  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="lg:w-48">
          <div className="text-sm font-medium text-primary">
            {format(new Date(interview.scheduled_at), "EEEE, MMM d", { locale: dateLocale })}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(interview.scheduled_at), "h:mm a", { locale: dateLocale })}</span>
            <span>• {interview.duration_minutes || 60} min</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{interview.title}</h4>
                <GetInterviewIcon type={interview.interview_type} />
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
              <GetStatusBadge status={interview.status} />
            </div>
          </div>

          {interview.interviewer_name && (
            <div className="text-sm">
              <span className="text-muted-foreground">{t("interviews.interviewer")} </span>
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
              {t("jobs.viewDetails")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/interviews/${interview.id}/edit`}>
              {t("jobs.edit")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}