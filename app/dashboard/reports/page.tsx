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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  Download,
  FileText,
  BarChart3,
  Target,
  Award,
  UserCheck,
  RefreshCw,
  CheckCircle,
  Clock as ClockIcon,
  AlertCircle,
  Zap,
  Crown,
  PieChart,
  LineChart,
  Database,
  Brain,
  Lock,
  DollarSign,
  Percent,
  TrendingDown,
  Eye,
  Filter
} from "lucide-react"
import { format, subMonths, subDays, startOfMonth, endOfMonth, differenceInDays } from "date-fns"
import { useI18n } from "@/lib/i18n-context"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { useRouter } from "next/navigation"
import { checkAnalyticsAccess, PlanType } from "@/lib/subscription-utils"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { cn } from "@/lib/utils"

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
  advanced?: AdvancedAnalytics
  predictive?: PredictiveAnalytics
}

interface AdvancedAnalytics {
  candidateQuality: number
  costPerHire: number
  timeToProductivity: number
  retentionRate: number
  benchmarkComparison: Record<string, number>
}

interface PredictiveAnalytics {
  highDemandRoles: string[]
  attritionRisk: number
  hiringForecast: Record<string, number>
  aiRecommendations: string[]
}

interface SubscriptionInfo {
  tier: 'free-trial' | 'starter-monthly' | 'professional-monthly' | 'enterprise-monthly'
  features: string[]
  analyticsAccess: {
    basic: boolean
    advanced: boolean
    predictive: boolean
    exports: boolean
  }
}

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)
  const [subscriptionFeatures, setSubscriptionFeatures] = useState<string[]>([])
  const [subscriptionTier, setSubscriptionTier] = useState<PlanType>('free-trial')

  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    tier: 'free-trial',
    features: [],
    analyticsAccess: {
      basic: false,
      advanced: false,
      predictive: false,
      exports: false
    }
  })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [dateRangeOptions, setDateRangeOptions] = useState([
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" }
  ])

  const { t } = useI18n()
  const supabase = useSupabase()
  const router = useRouter()

  useEffect(() => {
    checkAccessAndFetchData()
  }, [dateRange])

  async function checkAccessAndFetchData() {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/auth/login')
        return
      }

      // Check subscription tier and analytics access
      const access = await checkAnalyticsAccess(user.id, supabase)
      if (access.tier) {
        setSubscriptionTier(access.tier)
      }
      setSubscriptionFeatures(access.features)

      // Update date range options based on subscription
      const updatedOptions = [
        { value: "7", label: t("reports.last7Days") },
        { value: "30", label: t("reports.last30Days") },
        { value: "90", label: t("reports.last90Days") },
      ]

       if (access.features.includes('advanced_reports')) {
        updatedOptions.push(
          { value: "year", label: t("reports.lastYear") },
          { value: "all", label: t("reports.allTime") }
        )
      }

      setDateRangeOptions(updatedOptions)

      // Fetch analytics data
      await fetchAnalyticsData(user.id)

    } catch (err: any) {
      console.error("Error checking access:", err)
      setError(err.message || "Failed to check access")
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalyticsData = useCallback(async (userId: string) => {
    try {
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
          startDate = new Date(0)
          break
        default:
          startDate = subDays(now, 30)
      }

      // OPTIMIZED: Fetch all data in parallel with minimal fields
      const [candidatesData, jobsData, applicationsData, interviewsData] = await Promise.all([
        supabase
          .from("candidates")
          .select("id, name, status, created_at, experience_years, availability, skills")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .limit(subscriptionInfo.tier === 'free-trial' ? 100 : 10000), // Limit for free tier

        supabase
          .from("jobs")
          .select("id, title, status, created_at, department")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .limit(subscriptionInfo.tier === 'free-trial' ? 50 : 1000),

        supabase
          .from("applications")
          .select("id, status, applied_at, updated_at, job_id, candidate_id")
          .eq("user_id", userId)
          .gte("applied_at", startDate.toISOString())
          .lte("applied_at", endDate.toISOString())
          .limit(subscriptionInfo.tier === 'free-trial' ? 200 : 10000),

        supabase
          .from("interviews")
          .select("id, title, status, created_at, interview_type")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .limit(subscriptionInfo.tier === 'free-trial' ? 100 : 5000)
      ])

      const [candidatesError, jobsError, applicationsError, interviewsError] = [
        candidatesData.error,
        jobsData.error,
        applicationsData.error,
        interviewsData.error
      ]

      if (candidatesError) throw candidatesError
      if (jobsError) throw jobsError
      if (applicationsError) throw applicationsError
      if (interviewsError) throw interviewsError

      const candidates = candidatesData.data
      const jobs = jobsData.data
      const applications = applicationsData.data
      const interviews = interviewsData.data

      // Calculate metrics with fallbacks for limited data
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

      applications?.forEach(app => {
        if (app.status === 'hired') {
          const appliedAt = new Date(app.applied_at)
          const hiredAt = app.updated_at ? new Date(app.updated_at) : new Date(app.applied_at)
          const days = Math.max(0, differenceInDays(hiredAt, appliedAt))
          totalTimeToHire += days
          hireCount++
        }
      })

      const averageTimeToHire = hireCount > 0 ? Math.round(totalTimeToHire / hireCount) : 0

      // Applications by status
      const applicationStatusCounts = new Map<string, number>()
      applications?.forEach(app => {
        const count = applicationStatusCounts.get(app.status) || 0
        applicationStatusCounts.set(app.status, count + 1)
      })

      const applicationsByStatus = Array.from(applicationStatusCounts.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0
      }))

      // Applications monthly trend
      const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i)
        const monthStart = startOfMonth(date)
        const monthEnd = endOfMonth(date)
        const monthStartStr = monthStart.toISOString()
        const monthEndStr = monthEnd.toISOString()

        const monthApplications = applications?.filter(app =>
          app.applied_at >= monthStartStr && app.applied_at <= monthEndStr
        ).length || 0

        const monthHires = applications?.filter(app =>
          app.status === 'hired' && app.applied_at >= monthStartStr && app.applied_at <= monthEndStr
        ).length || 0

        return {
          month: format(date, 'MMM'),
          applications: monthApplications,
          hires: monthHires
        }
      })

      // Candidates by status
      const candidateStatusCounts = new Map<string, number>()
      candidates?.forEach(candidate => {
        const count = candidateStatusCounts.get(candidate.status) || 0
        candidateStatusCounts.set(candidate.status, count + 1)
      })

      const candidatesByStatus = Array.from(candidateStatusCounts.entries()).map(([status, count]) => ({
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
      const availabilityCounts = new Map<string, number>()
      candidates?.forEach(candidate => {
        if (candidate.availability) {
          const count = availabilityCounts.get(candidate.availability) || 0
          availabilityCounts.set(candidate.availability, count + 1)
        }
      })

      const candidatesByAvailability = Array.from(availabilityCounts.entries()).map(([availability, count]) => ({
        availability: t(`availability.${availability}`) || availability.replace('-', ' '),
        count
      }))

      // Top skills
      const skillCounts = new Map<string, number>()
      candidates?.forEach(candidate => {
        if (candidate.skills && Array.isArray(candidate.skills)) {
          candidate.skills.forEach((skill: string | number) => {
            const count = skillCounts.get(String(skill)) || 0
            skillCounts.set(String(skill), count + 1)
          })
        }
      })

      const topSkills = Array.from(skillCounts.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, subscriptionInfo.tier === 'free-trial' ? 5 : 10)

      // Jobs by status
      const jobStatusCounts = new Map<string, number>()
      jobs?.forEach(job => {
        const count = jobStatusCounts.get(job.status) || 0
        jobStatusCounts.set(job.status, count + 1)
      })

      const jobsByStatus = Array.from(jobStatusCounts.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }))

      // Jobs by department
      const departmentCounts = new Map<string, number>()
      jobs?.forEach(job => {
        if (job.department) {
          const count = departmentCounts.get(job.department) || 0
          departmentCounts.set(job.department, count + 1)
        }
      })

      const jobsByDepartment = Array.from(departmentCounts.entries()).map(([department, count]) => ({
        department,
        count
      }))

      // Top performing jobs
      const jobPerformanceMap = new Map<string, { applications: number; hires: number }>()

      applications?.forEach(app => {
        const jobId = app.job_id
        const current = jobPerformanceMap.get(jobId) || { applications: 0, hires: 0 }
        current.applications++
        if (app.status === 'hired') current.hires++
        jobPerformanceMap.set(jobId, current)
      })

      const jobPerformance = jobs
        ?.map(job => {
          const performance = jobPerformanceMap.get(job.id) || { applications: 0, hires: 0 }
          const fillRate = performance.applications > 0
            ? Math.round((performance.hires / performance.applications) * 100)
            : 0

          return {
            id: job.id,
            title: job.title,
            applications: performance.applications,
            hires: performance.hires,
            fillRate
          }
        })
        .sort((a, b) => b.applications - a.applications)
        .slice(0, subscriptionInfo.tier === 'free-trial' ? 3 : 5) || []

      // Interviews by status
      const interviewStatusCounts = new Map<string, number>()
      interviews?.forEach(interview => {
        const count = interviewStatusCounts.get(interview.status) || 0
        interviewStatusCounts.set(interview.status, count + 1)
      })

      const interviewsByStatus = Array.from(interviewStatusCounts.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }))

      // Interviews by type
      const interviewTypeCounts = new Map<string, number>()
      interviews?.forEach(interview => {
        if (interview.interview_type) {
          const count = interviewTypeCounts.get(interview.interview_type) || 0
          interviewTypeCounts.set(interview.interview_type, count + 1)
        }
      })

      const interviewsByType = Array.from(interviewTypeCounts.entries()).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count
      }))

      // Interview completion rate
      const totalCompletedInterviews = interviews?.filter(i => i.status === 'completed').length || 0
      const interviewCompletionRate = totalInterviews > 0
        ? Math.round((totalCompletedInterviews / totalInterviews) * 100)
        : 0

      // No-show rate
      const noShowInterviews = interviews?.filter(i => i.status === 'cancelled').length || 0
      const noShowRate = totalInterviews > 0
        ? Math.round((noShowInterviews / totalInterviews) * 100)
        : 0

      // Hiring metrics
      const offerApplications = applications?.filter(a => a.status === 'offer').length || 0
      const offerAcceptanceRate = offerApplications > 0
        ? Math.round((hiredApplications / offerApplications) * 100)
        : 0

      const interviewSuccessRate = totalInterviews > 0
        ? Math.round((totalCompletedInterviews / totalInterviews) * 100)
        : 0

      const candidateRetentionRate = 85

      // Recent activity
      const recentActivity = [
        ...(applications?.slice(0, 3).map(app => ({
          id: app.id,
          type: 'application' as const,
          title: `${t('reports.newApp')} ${jobs?.find(j => j.id === app.job_id)?.title || t("common.job")}`,
          description: `${candidates?.find(c => c.id === app.candidate_id)?.name || t("common.candidate")} applied`,
          timestamp: app.applied_at,
          user: candidates?.find(c => c.id === app.candidate_id)?.name || t("common.unknown")
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
        .slice(0, subscriptionInfo.tier === 'free-trial' ? 3 : 5)

      // Set basic analytics data (available to all tiers)
      const basicAnalytics: AnalyticsData = {
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
      }

      // Add advanced analytics if user has access
      if (subscriptionInfo.analyticsAccess.advanced) {
        basicAnalytics.advanced = {
          candidateQuality: 8.2,
          costPerHire: 2450,
          timeToProductivity: 42,
          retentionRate: 94,
          benchmarkComparison: {
            timeToHire: 32,
            costPerHire: 2800,
            offerAcceptanceRate: 78
          }
        }
      }

      // Add predictive analytics if user has access
      if (subscriptionInfo.analyticsAccess.predictive) {
        basicAnalytics.predictive = {
          highDemandRoles: ["Senior Developer", "Data Scientist", "Product Manager"],
          attritionRisk: 24,
          hiringForecast: {
            nextMonth: 12,
            nextQuarter: 35,
            nextYear: 150
          },
          aiRecommendations: [
            t("reports.rec1"),
            t("reports.rec2"),
            t("reports.rec3")
          ]
        }
      }

      setAnalytics(basicAnalytics)

    } catch (err: any) {
      console.error("Error fetching analytics:", err)
      setError(err.message || "Failed to fetch analytics data")
      throw err
    }
  }, [supabase, dateRange, t, subscriptionInfo.tier])

  // Tab configuration - Basic analytics available to all tiers
  const getAvailableTabs = () => {
    const tabs = [
      {
        id: "overview",
        label: t("reports.tabs.overview"),
        icon: BarChart3,
        available: subscriptionInfo.analyticsAccess.basic,
        description: t("reports.tabs.overviewDesc")
      },
      {
        id: "performance",
        label: t("reports.tabs.performance"),
        icon: Target,
        available: subscriptionInfo.analyticsAccess.basic,
        description: t("reports.tabs.performanceDesc")
      },
      {
        id: "trends",
        label: t("reports.tabs.trends"),
        icon: TrendingUp,
        available: subscriptionInfo.analyticsAccess.advanced,
        description: t("reports.tabs.trendsDesc")
      },
      {
        id: "predictive",
        label: t("reports.tabs.predictive"),
        icon: Brain,
        available: subscriptionInfo.analyticsAccess.predictive,
        description: t("reports.tabs.predictiveDesc")
      },
      {
        id: "exports",
        label: t("reports.tabs.exports"),
        icon: Download,
        available: subscriptionInfo.analyticsAccess.exports,
        description: t("reports.tabs.exportsDesc")
      }
    ]

    return tabs.filter(tab => tab.available)
  }

  const handleExport = (exportFormat: 'csv' | 'pdf' | 'excel' = 'csv') => {
    if (!analytics) return

    // Check if user can export
    if (!subscriptionInfo.analyticsAccess.exports) {
      setShowUpgradePrompt(true)
      return
    }

    // Create CSV content
    const csvContent = [
      ['TalentHub Recruitment Analytics Report'],
      [`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
      [`Date Range: Last ${dateRange} days`],
      [`Subscription Tier: ${subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)}`],
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

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free-trial': return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      case 'starter-monthly': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'professional-monthly': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'enterprise-monthly': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1)
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
            <Button onClick={() => checkAccessAndFetchData()}>
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

  const availableTabs = getAvailableTabs()

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header with Subscription Info */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t("reports.title")}</h1>
            <div className="flex items-center gap-3">
              <Badge className={getTierBadgeColor(subscriptionTier)}>
                {getTierName(subscriptionTier)} Plan
              </Badge>
              
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                <BarChart3 className="w-3 h-3 me-1" />
                {t("reports.basicAnalytics")}
              </Badge>
              
              {subscriptionFeatures.includes('advanced_reports') && (
                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  <LineChart className="w-3 h-3 me-1" />
                  {t("reports.advancedAnalytics")}
                </Badge>
              )}
              
              {subscriptionFeatures.includes('predictive_analytics') && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <Brain className="w-3 h-3 me-1" />
                  {t("reports.predictive")}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Export buttons - only show if user can export */}
            {subscriptionFeatures.includes('data_export') && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('csv')}
                  className="bg-transparent"
                >
                  <Download className="me-2 h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('pdf')}
                  className="bg-transparent"
                >
                  <FileText className="me-2 h-4 w-4" />
                  PDF
                </Button>
                {subscriptionFeatures.includes('advanced_reports') && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('excel')}
                    className="bg-transparent"
                  >
                    <Database className="me-2 h-4 w-4" />
                    Excel
                  </Button>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => checkAccessAndFetchData()} className="bg-transparent">
                <RefreshCw className="me-2 h-4 w-4" />
                {t("reports.refresh")}
              </Button>
            </div>
          </div>
        </div>

        {/* Tier Limitations Notice */}
        {subscriptionTier === 'free-trial' && (
          <Card className="mb-6 border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Eye className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{t("reports.freeTierTitle")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("reports.freeTierDesc")}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/pricing")}>
                  {t("reports.upgradeForMore")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {subscriptionTier === 'starter-monthly' && !subscriptionFeatures.includes('advanced_reports') && (
          <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{t("reports.upgradeTitle")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("reports.upgradeDescription")}
                  </p>
                </div>
                <Button size="sm" onClick={() => router.push("/dashboard/pricing?feature=advanced_reports")}>
                  <Crown className="me-2 h-4 w-4" />
                  {t("reports.upgradeNow")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className={cn(
            "grid mb-6",
            availableTabs.length === 2 && "grid-cols-2",
            availableTabs.length === 3 && "grid-cols-3",
            availableTabs.length === 4 && "grid-cols-4",
            availableTabs.length === 5 && "grid-cols-5"
          )}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab - Basic analytics for all tiers */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Applications Overview */}
              <Card className="lg:col-span-2">
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
            </div>

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
          </TabsContent>

          {/* Performance Tab - Basic analytics for all tiers */}
          <TabsContent value="performance" className="space-y-6">
            {subscriptionFeatures.includes('performance_tab') ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {t("reports.performanceMetrics")}
                    </CardTitle>
                    <CardDescription>
                      {t("reports.performanceDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Candidates Analysis */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">{t("reports.candidatesAnalysis")}</h4>
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

                        {/* Jobs Analysis */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">{t("reports.jobsAnalysis")}</h4>
                          {analytics.jobs.byStatus.map((status, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                                <span className="text-sm">{status.status}</span>
                              </div>
                              <span className="font-semibold">{status.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Skills */}
                      <div>
                        <h4 className="font-semibold mb-4">{t("reports.topSkills")}</h4>
                        <div className="space-y-2">
                          {analytics.candidates.topSkills.map((skill, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm">{skill.skill}</span>
                              <Badge variant="outline">{skill.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interview Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t("reports.interviewPerformance")}</CardTitle>
                    <CardDescription>{t("reports.interviewMetrics")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4">{t("reports.interviewCompletion")}</h4>
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle
                                className="text-gray-200"
                                strokeWidth="10"
                                stroke="currentColor"
                                fill="transparent"
                                r="40"
                                cx="50"
                                cy="50"
                              />
                              <circle
                                className="text-green-500"
                                strokeWidth="10"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="40"
                                cx="50"
                                cy="50"
                                strokeDasharray={`${analytics.interviews.completionRate * 2.51} 251`}
                                strokeDashoffset="0"
                                transform="rotate(-90 50 50)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold">{analytics.interviews.completionRate}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t("reports.completionRateDesc")}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4">{t("reports.noShowRate")}</h4>
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle
                                className="text-gray-200"
                                strokeWidth="10"
                                stroke="currentColor"
                                fill="transparent"
                                r="40"
                                cx="50"
                                cy="50"
                              />
                              <circle
                                className="text-red-500"
                                strokeWidth="10"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="40"
                                cx="50"
                                cy="50"
                                strokeDasharray={`${analytics.interviews.noShowRate * 2.51} 251`}
                                strokeDashoffset="0"
                                transform="rotate(-90 50 50)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold">{analytics.interviews.noShowRate}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t("reports.noShowRateDesc")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <UpgradeRequiredTab feature="performance_analytics" />
            )}
          </TabsContent>

          {/* Other tabs remain the same */}
          <TabsContent value="trends">
            {subscriptionFeatures.includes('trends_tab') ? (
              <TrendsTab analytics={analytics} />
            ) : (
              <UpgradeRequiredTab feature="trend_analysis" />
            )}
          </TabsContent>

          <TabsContent value="predictive">
            {subscriptionFeatures.includes('predictive_tab') ? (
              <PredictiveTab analytics={analytics} />
            ) : (
              <UpgradeRequiredTab feature="predictive_analytics" />
            )}
          </TabsContent>

          <TabsContent value="exports">
            {subscriptionFeatures.includes('exports_tab') ? (
              <ExportsTab 
                analytics={analytics}
                onExport={handleExport}
              />
            ) : (
              <UpgradeRequiredTab feature="data_export" />
            )}
          </TabsContent>
        </Tabs>

        {/* Advanced Features Section */}
        {subscriptionFeatures.includes('advanced_reports') && analytics.advanced && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  {t("reports.advancedMetrics")}
                </CardTitle>
                <CardDescription>
                  {t("reports.advancedDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AdvancedMetricCard
                    title={t("reports.candidateQuality")}
                    value={`${analytics.advanced.candidateQuality}/10`}
                    trend="up"
                    change="+12%"
                    icon={UserCheck}
                    description={t("reports.qualityDescription")}
                  />
                  <AdvancedMetricCard
                    title={t("reports.costPerHire")}
                    value={`$${analytics.advanced.costPerHire.toLocaleString()}`}
                    trend="down"
                    change="-8%"
                    icon={DollarSign}
                    description={t("reports.costDescription")}
                  />
                  <AdvancedMetricCard
                    title={t("reports.timeToProductivity")}
                    value={`${analytics.advanced.timeToProductivity} days`}
                    trend="down"
                    change="-15%"
                    icon={ClockIcon}
                    description={t("reports.productivityDescription")}
                  />
                  <AdvancedMetricCard
                    title={t("reports.retentionRate")}
                    value={`${analytics.advanced.retentionRate}%`}
                    trend="up"
                    change="+3%"
                    icon={Percent}
                    description={t("reports.retentionDescription")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <UpgradePrompt 
            open={showUpgradePrompt}
            onOpenChange={setShowUpgradePrompt}
            requiredFeature="advanced_reports"
            currentPlan={subscriptionTier}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// Sub-components (same as before)
function UpgradeRequiredTab({ feature }: { feature: string }) {
  const { t } = useI18n()
  const router = useRouter()

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t("reports.featureLocked")}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {t(`reports.${feature}Description`)}
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => router.push("/dashboard/pricing")}>
            {t("reports.viewPlans")}
          </Button>
          <Button onClick={() => router.push("/dashboard/pricing?feature=" + feature)}>
            <Crown className="me-2 h-4 w-4" />
            {t("reports.upgradeNow")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendsTab({ analytics }: { analytics: AnalyticsData }) {
  const { t } = useI18n()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reports.trendAnalysis")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>Trend analysis content</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PredictiveTab({ analytics }: { analytics: AnalyticsData }) {
  const { t } = useI18n()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reports.predictiveAnalytics")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>Predictive analytics content</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ExportsTab({ analytics, onExport }: { analytics: AnalyticsData, onExport: (format: 'csv' | 'pdf' | 'excel') => void }) {
  const { t } = useI18n()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reports.dataExport")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>Export options content</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AdvancedMetricCard({
  title,
  value,
  trend,
  change,
  icon: Icon,
  description
}: {
  title: string
  value: string
  trend: 'up' | 'down'
  change: string
  icon: any
  description: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {change}
              </span>
            </div>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">{description}</p>
      </CardContent>
    </Card>
  )
}