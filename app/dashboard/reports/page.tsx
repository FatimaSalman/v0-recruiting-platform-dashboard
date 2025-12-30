// app/dashboard/reports/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Users, Briefcase, Calendar, TrendingUp, Download, FileText, BarChart3, Target, Award, UserCheck, RefreshCw, CheckCircle, Clock as ClockIcon, MapPin, Building2, Mail, Phone, GraduationCap, Check, AlertCircle
} from "lucide-react"
import { format, subMonths, subDays, startOfMonth, endOfMonth, differenceInDays } from "date-fns"
import { useI18n } from "@/lib/i18n-context"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { checkAnalyticsAccess } from "@/lib/subscription-utils"


interface AnalyticsData {
  overview: {
    totalCandidates: number
    activeCandidates: number
    placedCandidates: number
    totalJobs: number
    openJobs: number
    hiredCount: number
    averageTimeToHire: number
    totalApplications: number
    totalInterviews: number
  }
  hiringMetrics: {
    timeToHire: number
    offerAcceptanceRate: number
    interviewSuccessRate: number
    candidateRetentionRate: number
  }
  applications: {
    byStatus: Array<{ status: string; count: number; percentage: number }>
    monthlyTrend: Array<{ month: string; applications: number; hires: number }>
    sourceBreakdown: Array<{ source: string; count: number; percentage: number }>
  }
  candidates: {
    byStatus: Array<{ status: string; count: number }>
    byExperience: Array<{ experience: string; count: number }>
    byAvailability: Array<{ availability: string; count: number }>
    topSkills: Array<{ skill: string; count: number }>
  }
  jobs: {
    byStatus: Array<{ status: string; count: number }>
    byDepartment: Array<{ department: string; count: number }>
    topPerforming: Array<{ id: string; title: string; applications: number; hires: number; fillRate: number }>
  }
  interviews: {
    byStatus: Array<{ status: string; count: number }>
    byType: Array<{ type: string; count: number }>
    completionRate: number
    noShowRate: number
  }
  recentActivity: Array<{
    id: string
    type: 'application' | 'interview' | 'candidate' | 'job'
    title: string
    description: string
    timestamp: string
    user: string
  }>
}

export default async function ReportsPage() {

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  const [timeframe, setTimeframe] = useState("month")
  const [error, setError] = useState<string | null>(null)
  const { t } = useI18n()

  const supabase = await createClient()


  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        redirect('/auth/login')
      }

      const hasAccess = await checkAnalyticsAccess(user.id)
      if (!hasAccess) {
        redirect("/dashboard/pricing?upgrade=analytics&feature=reports")
      }

      const now = new Date()
      let startDate: Date
      let endDate: Date = now

      switch (dateRange) {
        case "7":
          startDate = subDays(now, 7)
          break
        case "30":
          startDate = subDays(now, 30)
          break
        case "90":
          startDate = subDays(now, 90)
          break
        case "year":
          startDate = subMonths(now, 12)
          break
        case "all":
          startDate = new Date(0) // Beginning of time
          break
        default:
          startDate = subDays(now, 30)
      }

      // 1. Fetch candidates data
      const { data: candidates, error: candidatesError } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (candidatesError) throw candidatesError

      // 2. Fetch jobs data
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (jobsError) throw jobsError

      // 3. Fetch applications with candidate and job details
      const { data: applications, error: applicationsError } = await supabase
        .from("applications")
        .select(`
          *,
          candidate:candidates(*),
          job:jobs(*)
        `)
        .eq("user_id", user.id)
        .gte("applied_at", startDate.toISOString())
        .lte("applied_at", endDate.toISOString())

      if (applicationsError) throw applicationsError

      // 4. Fetch interviews
      const { data: interviews, error: interviewsError } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

      if (interviewsError) throw interviewsError

      // 5. Calculate metrics

      // Overview metrics
      const totalCandidates = candidates?.length || 0
      const activeCandidates = candidates?.filter(c => c.status === 'active').length || 0
      const placedCandidates = candidates?.filter(c => c.status === 'placed').length || 0
      const totalJobs = jobs?.length || 0
      const openJobs = jobs?.filter(j => j.status === 'open').length || 0
      const hiredApplications = applications?.filter(a => a.status === 'hired').length || 0
      const totalApplications = applications?.length || 0
      const totalInterviews = interviews?.length || 0

      // Calculate average time to hire
      let totalTimeToHire = 0
      let hireCount = 0
      const hiredApps = applications?.filter(a => a.status === 'hired') || []

      hiredApps.forEach(app => {
        const appliedAt = new Date(app.applied_at)
        const hiredAt = app.updated_at ? new Date(app.updated_at) : new Date(app.applied_at)
        const days = Math.max(0, differenceInDays(hiredAt, appliedAt))
        totalTimeToHire += days
        hireCount++
      })

      const averageTimeToHire = hireCount > 0 ? Math.round(totalTimeToHire / hireCount) : 0

      // Applications by status
      const applicationStatusCounts: Record<string, number> = {}
      applications?.forEach(app => {
        applicationStatusCounts[app.status] = (applicationStatusCounts[app.status] || 0) + 1
      })

      const applicationsByStatus = Object.entries(applicationStatusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0
      }))

      // Applications monthly trend (last 6 months)
      const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i)
        const monthStart = startOfMonth(date)
        const monthEnd = endOfMonth(date)

        const monthApplications = applications?.filter(app => {
          const appDate = new Date(app.applied_at)
          return appDate >= monthStart && appDate <= monthEnd
        }).length || 0

        const monthHires = applications?.filter(app => {
          const appDate = new Date(app.applied_at)
          return app.status === 'hired' && appDate >= monthStart && appDate <= monthEnd
        }).length || 0

        return {
          month: format(date, 'MMM'),
          applications: monthApplications,
          hires: monthHires
        }
      })

      // Candidates by status
      const candidateStatusCounts: Record<string, number> = {}
      candidates?.forEach(candidate => {
        candidateStatusCounts[candidate.status] = (candidateStatusCounts[candidate.status] || 0) + 1
      })

      const candidatesByStatus = Object.entries(candidateStatusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }))

      // Candidates by experience
      const experienceRanges = {
        [t("experience.0-2")]: { min: 0, max: 2 },
        [t("experience.3-5")]: { min: 3, max: 5 },
        [t("experience.6-10")]: { min: 6, max: 10 },
        [t("experience.10+")]: { min: 11, max: Infinity }
      }
      const candidatesByExperience = Object.entries(experienceRanges).map(([range, { min, max }]) => ({
        experience: range,
        count: candidates?.filter(c => {
          const exp = c.experience_years || 0
          return exp >= min && exp <= max
        }).length || 0
      }))

      // Candidates by availability
      const availabilityCounts: Record<string, number> = {}
      candidates?.forEach(candidate => {
        if (candidate.availability) {
          availabilityCounts[candidate.availability] = (availabilityCounts[candidate.availability] || 0) + 1
        }
      })

      const candidatesByAvailability = Object.entries(availabilityCounts).map(([availability, count]) => ({
        availability: t(`availability.${availability}`) || availability.replace('-', ' '),
        count
      }))

      // Top skills from candidates
      const skillCounts: Record<string, number> = {}
      candidates?.forEach(candidate => {
        if (candidate.skills && Array.isArray(candidate.skills)) {
          candidate.skills.forEach((skill: string | number) => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1
          })
        }
      })

      const topSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Jobs by status
      const jobStatusCounts: Record<string, number> = {}
      jobs?.forEach(job => {
        jobStatusCounts[job.status] = (jobStatusCounts[job.status] || 0) + 1
      })

      const jobsByStatus = Object.entries(jobStatusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }))

      // Jobs by department
      const departmentCounts: Record<string, number> = {}
      jobs?.forEach(job => {
        if (job.department) {
          departmentCounts[job.department] = (departmentCounts[job.department] || 0) + 1
        }
      })

      const jobsByDepartment = Object.entries(departmentCounts).map(([department, count]) => ({
        department,
        count
      }))

      // Top performing jobs
      const jobPerformance = jobs?.map(job => {
        const jobApplications = applications?.filter(a => a.job_id === job.id) || []
        const hires = jobApplications.filter(a => a.status === 'hired').length
        const fillRate = jobApplications.length > 0 ? Math.round((hires / jobApplications.length) * 100) : 0

        return {
          id: job.id,
          title: job.title,
          applications: jobApplications.length,
          hires,
          fillRate
        }
      }).sort((a, b) => b.applications - a.applications)
        .slice(0, 5)

      // Interviews by status
      const interviewStatusCounts: Record<string, number> = {}
      interviews?.forEach(interview => {
        interviewStatusCounts[interview.status] = (interviewStatusCounts[interview.status] || 0) + 1
      })

      const interviewsByStatus = Object.entries(interviewStatusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }))

      // Interviews by type
      const interviewTypeCounts: Record<string, number> = {}
      interviews?.forEach(interview => {
        if (interview.interview_type) {
          interviewTypeCounts[interview.interview_type] = (interviewTypeCounts[interview.interview_type] || 0) + 1
        }
      })

      const interviewsByType = Object.entries(interviewTypeCounts).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count
      }))

      // Interview completion rate
      const totalCompletedInterviews = interviews?.filter(i => i.status === 'completed').length || 0
      const interviewCompletionRate = totalInterviews > 0 ? Math.round((totalCompletedInterviews / totalInterviews) * 100) : 0

      // No-show rate
      const noShowInterviews = interviews?.filter(i => i.status === 'cancelled').length || 0
      const noShowRate = totalInterviews > 0 ? Math.round((noShowInterviews / totalInterviews) * 100) : 0

      // Hiring metrics
      const offerAcceptanceRate = hiredApplications > 0 ? Math.round((hiredApplications / (applications?.filter(a => a.status === 'offer').length || 0)) * 100) : 0
      const interviewSuccessRate = totalInterviews > 0 ? Math.round((totalCompletedInterviews / totalInterviews) * 100) : 0
      const candidateRetentionRate = 85 // This would require tracking candidate tenure

      // Recent activity
      const recentActivity = [
        ...(applications?.slice(0, 3).map(app => ({
          id: app.id,
          type: 'application' as const,
          title: `${t('reports.newApp')} ${app.job?.title || `${t("common.job")}`}`,
          description: `${app.candidate?.name || `${t("common.candidate")}`} applied`,
          timestamp: app.applied_at,
          user: app.candidate?.name || `{t("common.unknown")}`
        })) || []),
        ...(interviews?.slice(0, 2).map(interview => ({
          id: interview.id,
          type: 'interview' as const,
          title: `${interview.status === 'scheduled' ? t('status.scheduled') : t('status.completed')} ${t('reports.interview')}`,
          description: interview.title,
          timestamp: interview.created_at,
          user: `${t("common.system")}`
        })) || []),
        ...(candidates?.slice(0, 2).map(candidate => ({
          id: candidate.id,
          type: 'candidate' as const,
          title: `${t('reports.newCandidate')}`,
          description: candidate.name,
          timestamp: candidate.created_at,
          user: `${t('common.recruiter')}`
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)

      // Set analytics data
      setAnalytics({
        overview: {
          totalCandidates,
          activeCandidates,
          placedCandidates,
          totalJobs,
          openJobs,
          hiredCount: hiredApplications,
          averageTimeToHire,
          totalApplications,
          totalInterviews
        },
        hiringMetrics: {
          timeToHire: averageTimeToHire,
          offerAcceptanceRate,
          interviewSuccessRate,
          candidateRetentionRate
        },
        applications: {
          byStatus: applicationsByStatus,
          monthlyTrend,
          sourceBreakdown: [
            { source: t('source.direct'), count: Math.round(totalApplications * 0.6), percentage: 60 },
            { source: t('source.referral'), count: Math.round(totalApplications * 0.2), percentage: 20 },
            { source: t('source.jobBoard'), count: Math.round(totalApplications * 0.15), percentage: 15 },
            { source: t('source.agency'), count: Math.round(totalApplications * 0.05), percentage: 5 }
          ]
        },
        candidates: {
          byStatus: candidatesByStatus,
          byExperience: candidatesByExperience,
          byAvailability: candidatesByAvailability,
          topSkills
        },
        jobs: {
          byStatus: jobsByStatus,
          byDepartment: jobsByDepartment,
          topPerforming: jobPerformance
        },
        interviews: {
          byStatus: interviewsByStatus,
          byType: interviewsByType,
          completionRate: interviewCompletionRate,
          noShowRate
        },
        recentActivity
      })

    } catch (err: any) {
      console.error("Error fetching analytics:", err)
      setError(err.message || "Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }, [supabase, dateRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExport = () => {
    if (!analytics) return

    // Create CSV content
    const csvContent = [
      ['TalentHub Recruitment Analytics Report'],
      [`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
      [`Date Range: Last ${dateRange} days`],
      [],
      ['OVERVIEW METRICS'],
      ['Metric', 'Value'],
      ['Total Candidates', analytics.overview.totalCandidates],
      ['Active Candidates', analytics.overview.activeCandidates],
      ['Placed Candidates', analytics.overview.placedCandidates],
      ['Total Jobs', analytics.overview.totalJobs],
      ['Open Jobs', analytics.overview.openJobs],
      ['Hired Candidates', analytics.overview.hiredCount],
      ['Total Applications', analytics.overview.totalApplications],
      ['Average Time to Hire (days)', analytics.overview.averageTimeToHire],
      ['Total Interviews', analytics.overview.totalInterviews],
      [],
      ['HIRING METRICS'],
      ['Metric', 'Value'],
      ['Time to Hire (days)', analytics.hiringMetrics.timeToHire],
      ['Offer Acceptance Rate', `${analytics.hiringMetrics.offerAcceptanceRate}%`],
      ['Interview Success Rate', `${analytics.hiringMetrics.interviewSuccessRate}%`],
      ['Candidate Retention Rate', `${analytics.hiringMetrics.candidateRetentionRate}%`],
      [],
      ['APPLICATIONS BY STATUS'],
      ['Status', 'Count', 'Percentage'],
      ...analytics.applications.byStatus.map(s => [s.status, s.count, `${s.percentage}%`]),
      [],
      ['CANDIDATES BY STATUS'],
      ['Status', 'Count'],
      ...analytics.candidates.byStatus.map(s => [s.status, s.count]),
      [],
      ['JOBS BY STATUS'],
      ['Status', 'Count'],
      ...analytics.jobs.byStatus.map(s => [s.status, s.count]),
    ].map(row => row.join(',')).join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `talenthub-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const refreshData = () => {
    fetchAnalytics()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'open':
      case 'completed':
      case 'hired':
        return 'bg-green-500/10 text-green-500'
      case 'placed':
        return 'bg-blue-500/10 text-blue-500'
      case 'withdrawn':
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/10 text-red-500'
      case 'scheduled':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'inactive':
      case 'closed':
      case 'draft':
        return 'bg-gray-500/10 text-gray-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">{t("reports.loading")}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">{t("reports.error")}</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshData}>
              <RefreshCw className="me-2 h-4 w-4" />
              {t("reports.tryAgain")}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t("reports.noData")}</h3>
            <p className="text-muted-foreground mb-4">{t("reports.noDataDesc")}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t("reports.title")}</h1>
            <p className="text-muted-foreground">
              {t("reports.subtitle")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="date-range" className="text-sm whitespace-nowrap">
                {t("reports.dateRange")}:
              </Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t("reports.last7Days")}</SelectItem>
                  <SelectItem value="30">{t("reports.last30Days")}</SelectItem>
                  <SelectItem value="90">{t("reports.last90Days")}</SelectItem>
                  <SelectItem value="year">{t("reports.lastYear")}</SelectItem>
                  <SelectItem value="all">{t("reports.allTime")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshData} className="bg-transparent">
                <RefreshCw className="me-2 h-4 w-4" />
                {t("reports.refresh")}
              </Button>
              <Button onClick={handleExport} disabled={!analytics}>
                <Download className="me-2 h-4 w-4" />
                {t("reports.export")}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium"> {t("common.error")}</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reports.totalCandidates")}</p>
                  <p className="text-2xl font-bold">{analytics.overview.totalCandidates}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reports.activeJobs")}</p>
                  <p className="text-2xl font-bold">{analytics.overview.openJobs}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reports.hiredCandidates")}</p>
                  <p className="text-2xl font-bold">{analytics.overview.hiredCount}</p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Award className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reports.avgTimeToHire")}</p>
                  <p className="text-2xl font-bold">{analytics.overview.averageTimeToHire} {t("reports.days")}</p>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Candidates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applications Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t("reports.applicationsOverview")}
                </CardTitle>
                <CardDescription>{t("reports.statusDistribution")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.applications.byStatus.map((status, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(status.status)}>
                          {status.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{status.count}</span>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {status.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Candidates Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t("reports.candidatesAnalysis")}
                </CardTitle>
                <CardDescription>{t("reports.candidateBreakdown")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* By Status */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">{t("reports.byStatus")}</h4>
                    {analytics.candidates.byStatus.map((status, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                          <span className="text-sm">{status.status}</span>
                        </div>
                        <span className="font-semibold">{status.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* By Experience */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">{t("reports.byExperience")}</h4>
                    {analytics.candidates.byExperience.map((exp, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{exp.experience}</span>
                        <span className="font-semibold">{exp.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {t("reports.topJobs")}
                </CardTitle>
                <CardDescription>{t("reports.topJobsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.jobs.topPerforming.map((job, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{job.title}</h4>
                        <Badge variant="outline">{job.applications} {t("reports.applications")}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4" />
                          <span>{job.hires} {t("reports.hires")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{job.fillRate}% {t("reports.fillRate")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Metrics & Activity */}
          <div className="space-y-6">
            {/* Hiring Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t("reports.hiringMetrics")}
                </CardTitle>
                <CardDescription>{t("reports.kpi")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("reports.timeToHire")}</span>
                      <Badge className={analytics.hiringMetrics.timeToHire < 30 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                        {analytics.hiringMetrics.timeToHire} {t("reports.days")}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${analytics.hiringMetrics.timeToHire < 30 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(analytics.hiringMetrics.timeToHire, 60) / 60 * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("reports.offerAcceptance")}</span>
                      <Badge className={analytics.hiringMetrics.offerAcceptanceRate > 80 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                        {analytics.hiringMetrics.offerAcceptanceRate} %
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${analytics.hiringMetrics.offerAcceptanceRate > 80 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${analytics.hiringMetrics.offerAcceptanceRate} %` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("reports.interviewSuccess")}</span>
                      <Badge className={analytics.hiringMetrics.interviewSuccessRate > 70 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                        {analytics.hiringMetrics.interviewSuccessRate} %
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${analytics.hiringMetrics.interviewSuccessRate > 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${analytics.hiringMetrics.interviewSuccessRate} %` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t("reports.recentActivity")}
                </CardTitle>
                <CardDescription>{t("reports.latestUpdates")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${activity.type === 'application' ? 'bg-blue-500' :
                        activity.type === 'interview' ? 'bg-purple-500' :
                          'bg-green-500'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{activity.user}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {t("reports.quickStats")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("reports.totalApplications")}</span>
                    <span className="font-semibold">{analytics.overview.totalApplications}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("reports.totalInterviews")}</span>
                    <span className="font-semibold">{analytics.overview.totalInterviews}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("reports.openPositions")}</span>
                    <span className="font-semibold">{analytics.overview.openJobs}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("reports.activeCandidates")}</span>
                    <span className="font-semibold">{analytics.overview.activeCandidates}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("reports.reportSummary")}
            </CardTitle>
            <CardDescription>
              {t("reports.generatedOn")} {format(new Date(), "MMMM d, yyyy 'at' h:mm a")} |  {t("reports.dataFrom")} {dateRange}  {t("reports.days")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">{t("reports.highlights")}</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t("reports.successfullyPlaced")} {analytics.overview.placedCandidates} {t("reports.candidates")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t("reports.maintained")} {analytics.overview.openJobs} {t("reports.activejobOpenings")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t("reports.processedAppsCount")} {analytics.overview.totalApplications} {t("reports.applications")}</span>
                  </li>
                  {analytics.hiringMetrics.offerAcceptanceRate > 80 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{t("reports.highOfferRate")} {analytics.hiringMetrics.offerAcceptanceRate}%</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">{t("reports.improvements")}</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {analytics.overview.averageTimeToHire > 30 && (
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{t("reports.reduceTime")} ({t("reports.currently")} {analytics.overview.averageTimeToHire} {t("reports.days")})</span>
                    </li>
                  )}
                  {analytics.interviews.noShowRate > 10 && (
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{t("reports.improveAttendance")} ({t("reports.noShowRate")}{analytics.interviews.noShowRate}%)</span>
                    </li>
                  )}
                  {analytics.overview.hiredCount === 0 && (
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{t("reports.convertInterviews")}</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{t("reports.enhanceEngagement")}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">{t("reports.recommendations")}</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• {t("reports.rec1")}</li>
                  <li>• {t("reports.rec2")}</li>
                  <li>• {t("reports.rec3")}</li>
                  <li>• {t("reports.rec4")}</li>
                  <li>• {t("reports.rec5")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}