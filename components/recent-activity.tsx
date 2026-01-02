"use client"

import { useState, useEffect } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"
import {
    Briefcase,
    UserPlus,
    FileText,
    Calendar,
    MessageSquare,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/lib/supabase/supabase-provider"

interface ActivityItem {
    id: string
    type: 'job_created' | 'candidate_added' | 'application_received' | 'interview_scheduled' | 'status_changed'
    title: string
    description: string
    timestamp: string
    user_name?: string
    user_email?: string
    metadata?: Record<string, any>
}

interface ApplicationWithDetails {
    id: string
    created_at: string
    updated_at: string
    candidate?: { name: string }[]
    job?: { title: string }[]
}

interface InterviewWithDetails {
    id: string
    created_at: string
    status: string
    candidate?: { name: string }[]
    job?: { title: string }[]
}

export function RecentActivity({ userId }: { userId: string }) {
    const supabase = useSupabase()
    const [showAll, setShowAll] = useState(false)
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const { t, locale } = useI18n()
    const dateLocale = locale === 'ar' ? ar : enUS

    useEffect(() => {
        fetchRecentActivity()
    }, [userId, t])

    const fetchRecentActivity = async () => {
        try {
            setLoading(true)

            // Fetch recent jobs
            const { data: jobs } = await supabase
                .from("jobs")
                .select("id, title, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(5)

            // Fetch recent candidates
            const { data: candidates } = await supabase
                .from("candidates")
                .select("id, name, email, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(5)

            // Fetch recent applications with candidate and job info
            const { data: applications } = await supabase
                .from("applications")
                .select(`
          id, 
          created_at,
          updated_at,
          candidate: candidates!inner (name),
          job: jobs!inner (title)
        `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(5) as { data: ApplicationWithDetails[] | null }

            // Fetch recent interviews with candidate and job info
            const { data: interviews } = await supabase
                .from("interviews")
                .select(`
          id, 
          created_at,
          status,
          candidate: candidates!inner (name),
          job: jobs!inner (title)
        `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(5) as { data: InterviewWithDetails[] | null }

            const allActivities: ActivityItem[] = []

            // Add job activities
            jobs?.forEach(job => {
                allActivities.push({
                    id: `job_${job.id}`,
                    type: 'job_created' as const,
                    title: t("activity.jobCreated"),
                    description: `${t("activity.desc.jobCreated")} ${job.title}`,
                    timestamp: job.created_at,
                })
            })

            // Add candidate activities
            candidates?.forEach(candidate => {
                allActivities.push({
                    id: `candidate_${candidate.id}`,
                    type: 'candidate_added' as const,
                    title: t("activity.candidateAdded"),
                    description: `${t("activity.desc.candidateAdded")} ${candidate.name || candidate.email}`,
                    timestamp: candidate.created_at,
                })
            })

            // Add application activities
            applications?.forEach((application: ApplicationWithDetails) => {
                let candidateName = t("activity.unknownCandidate")
                let jobTitle = t("activity.unknownJob")

                // Get candidate name
                if (application.candidate && application.candidate.length > 0) {
                    application.candidate.forEach(ca => {
                        candidateName = ca.name || candidateName
                    });
                }

                // Get job title
                if (application.job && application.job.length > 0) {
                    application.job.forEach(jo => {
                        jobTitle = jo.title || jobTitle
                    });
                }

                allActivities.push({
                    id: `application_${application.id}`,
                    type: 'application_received' as const,
                    title: t("activity.applicationReceived"),
                    description: `${candidateName} ${t("activity.desc.applicationReceived")} ${jobTitle}`,
                    timestamp: application.updated_at || application.created_at,
                })
            })

            // Add interview activities
            interviews?.forEach((interview: InterviewWithDetails) => {
                let candidateName = t("activity.unknownCandidate")
                let jobTitle = t("activity.unknownJob")

                // Get candidate name
                if (interview.candidate && interview.candidate.length > 0) {
                    interview.candidate.forEach(ca => {
                        candidateName = ca.name || candidateName
                    });
                }

                // Get job title
                if (interview.job && interview.job.length > 0) {
                    interview.job.forEach(jo => {
                        jobTitle = jo.title || jobTitle
                    });
                }

                allActivities.push({
                    id: `interview_${interview.id}`,
                    type: 'interview_scheduled' as const,
                    title: t("activity.interviewScheduled"),
                    description: `${t("activity.desc.interviewScheduled")} ${candidateName} ${t("activity.desc.for")} ${jobTitle}`,
                    timestamp: interview.created_at, // Use scheduled_at for interviews
                    metadata: { status: interview.status }
                })
            })

            // Sort all activities by timestamp (most recent first)
            allActivities.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )

            console.log("Fetched activities:", allActivities)
            setActivities(allActivities)
        } catch (error) {
            console.error("Error fetching recent activity:", error)
        } finally {
            setLoading(false)
        }
    }

    const initialCount = 3
    const visibleActivities = showAll ? activities : activities.slice(0, initialCount)

    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'job_created':
                return Briefcase
            case 'candidate_added':
                return UserPlus
            case 'application_received':
                return FileText
            case 'interview_scheduled':
                return Calendar
            case 'status_changed':
                return MessageSquare
            default:
                return Briefcase
        }
    }

    const getActivityColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'job_created':
                return 'bg-blue-500'
            case 'candidate_added':
                return 'bg-green-500'
            case 'application_received':
                return 'bg-purple-500'
            case 'interview_scheduled':
                return 'bg-amber-500'
            case 'status_changed':
                return 'bg-indigo-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getTimeAgo = (timestamp: string) => {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: dateLocale })
    }

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3 p-3">
                        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {visibleActivities.map((activity) => {
                    const Icon = getActivityIcon(activity.type)
                    const color = getActivityColor(activity.type)

                    return (
                        <div
                            key={activity.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                                "hover:bg-muted/50 border border-transparent hover:border-muted"
                            )}
                        >
                            <div className="relative mt-0.5">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                    `${color} bg-opacity-10 text-foreground`
                                )}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className={cn(
                                    "absolute -top-1 -end-1 w-3 h-3 rounded-full border-2 border-background",
                                    color
                                )} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium text-sm truncate">{activity.title}</p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {getTimeAgo(activity.timestamp)}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {activity.description}
                                </p>
                                {activity.metadata?.status && (
                                    <Badge
                                        variant="outline"
                                        className="mt-2 text-xs"
                                    >
                                        {t(`status.interview.${activity.metadata.status.toLowerCase()}`)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {activities.length > initialCount && (
                <div className="pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? (
                            <>
                                <ChevronUp className="me-2 h-4 w-4" />
                                {t("activity.showLess")}
                            </>
                        ) : (
                            <>
                                <ChevronDown className="me-2 h-4 w-4" />
                                {t("activity.showAll")} ({activities.length - initialCount} {t("activity.more")})
                            </>
                        )}
                    </Button>
                </div>
            )}

            {activities.length === 0 && (
                <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                        <Briefcase className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t("activity.noActivity")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t("activity.appearHere")}
                    </p>
                </div>
            )}
        </div>
    )
}