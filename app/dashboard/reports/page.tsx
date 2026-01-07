// app/dashboard/reports/page.tsx
"use client"

import React, { useState, useEffect, useCallback } from "react"
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
import { cn } from "@/lib/utils"
import { UpgradePrompt } from "@/components/upgrade-prompt"

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

  performance: {
    conversionFunnel: Array<{
      stage: number
      name: string
      key: string
      count: number
      percentage: number
      dropOff: number
    }>
    sourceEffectiveness: Array<{
      source: string
      icon: string
      color: string
      applications: number
      hires: number
      hireRate: number
    }>
    interviewerPerformance: Array<{
      name: string
      interviews: number
      hires: number
      hireRate: number
    }>
    recruiterEfficiency: Array<{
      name: string
      role: string
      candidatesCount: number
      hires: number
      fillRate: number
      avgTimeToFill: number
      candidateQuality: number
    }>
    timeMetrics: {
      screening: number
      interview: number
      offer: number
      overall: number
    }
    qualityMetrics: {
      retention90Days: number
      performanceScore: number
      culturalFitScore: number
      skillMatchScore: number
      candidateSatisfaction: number
    }
  }

  costAnalysis?: {
    avgCostPerHire: number
    timeCost: number
    advertisingCost: number
    agencyFees: number
    totalCost: number
  }
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

interface SubscriptionTier {
  id: 'free-trial' | 'starter-monthly' | 'professional-monthly' | 'enterprise-monthly'
  name: string
  color: string
  analyticsAccess: {
    basic: boolean
    advanced: boolean
    predictive: boolean
    exports: boolean
  }
  features: string[]
}

// Define subscription tiers and their analytics access
const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  'free-trial': {
    id: 'free-trial',
    name: 'Free Trial',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    analyticsAccess: {
      basic: true,
      advanced: false,
      predictive: false,
      exports: false
    },
    features: [
      'basic_overview',
      'performance_metrics',
      'limited_data_points'
    ]
  },
  'starter-monthly': {
    id: 'starter-monthly',
    name: 'Starter',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    analyticsAccess: {
      basic: true,
      advanced: false,
      predictive: false,
      exports: true
    },
    features: [
      'basic_overview',
      'performance_metrics',
      'data_export_csv',
      'trend_analysis_30d',
      'standard_reports'
    ]
  },
  'professional-monthly': {
    id: 'professional-monthly',
    name: 'Professional',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    analyticsAccess: {
      basic: true,
      advanced: true,
      predictive: false,
      exports: true
    },
    features: [
      'basic_overview',
      'performance_metrics',
      'advanced_analytics',
      'trend_analysis_90d',
      'data_export_all_formats',
      'benchmark_comparison',
      'custom_reports'
    ]
  },
  'enterprise-monthly': {
    id: 'enterprise-monthly',
    name: 'Enterprise',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    analyticsAccess: {
      basic: true,
      advanced: true,
      predictive: true,
      exports: true
    },
    features: [
      'basic_overview',
      'performance_metrics',
      'advanced_analytics',
      'predictive_analytics',
      'trend_analysis_unlimited',
      'data_export_all_formats',
      'benchmark_comparison',
      'custom_reports',
      'api_access',
      'dedicated_support'
    ]
  }
}

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SUBSCRIPTION_TIERS['free-trial'])
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

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

      // Check user's subscription tier
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      let tierId: keyof typeof SUBSCRIPTION_TIERS = 'free-trial'

      if (!subscriptionError && subscription) {
        tierId = subscription.plan_type as keyof typeof SUBSCRIPTION_TIERS
      }

      // If subscription not found or not active, use free-trial
      if (!subscription || subscription.status !== 'active') {
        tierId = 'free-trial'
      }

      // Set subscription tier
      const tier = SUBSCRIPTION_TIERS[tierId]
      setSubscriptionTier(tier)

      // Update date range options based on subscription
      const updatedOptions = [
        { value: "7", label: t("reports.last7Days") },
        { value: "30", label: t("reports.last30Days") },
      ]

      if (tier.analyticsAccess.advanced) {
        updatedOptions.push(
          { value: "90", label: t("reports.last90Days") },
          { value: "year", label: t("reports.lastYear") }
        )
      }

      // Only enterprise gets all-time data
      if (tier.id === 'enterprise-monthly') {
        updatedOptions.push(
          { value: "all", label: t("reports.allTime") }
        )
      }

      // Fetch analytics data
      await fetchAnalyticsData(user.id, tier)

    } catch (err: any) {
      console.error("Error checking access:", err)
      setError(err.message || "Failed to check access")
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalyticsData = useCallback(async (userId: string, tier: SubscriptionTier) => {
    try {
      const now = new Date()
      let startDate: Date
      let endDate: Date = now

      // Apply date range limits based on subscription tier
      switch (dateRange) {
        case "7":
          startDate = subDays(now, 7)
          break
        case "30":
          startDate = subDays(now, 30)
          break
        case "90":
          if (tier.analyticsAccess.advanced) {
            startDate = subDays(now, 90)
          } else {
            startDate = subDays(now, 30) // Fallback to 30 days
          }
          break
        case "year":
          if (tier.analyticsAccess.advanced) {
            startDate = subMonths(now, 12)
          } else {
            startDate = subDays(now, 30)
          }
          break
        case "all":
          if (tier.id === 'enterprise-monthly') {
            startDate = new Date(0)
          } else {
            startDate = subDays(now, 30)
          }
          break
        default:
          startDate = subDays(now, 30)
      }

      // Apply data limits based on subscription tier
      const candidateLimit = tier.id === 'free-trial' ? 100 :
        tier.id === 'starter-monthly' ? 500 :
          tier.id === 'professional-monthly' ? 5000 : 10000

      const jobLimit = tier.id === 'free-trial' ? 50 :
        tier.id === 'starter-monthly' ? 200 :
          tier.id === 'professional-monthly' ? 1000 : 5000

      // Fetch data with limits
      const [candidatesData, jobsData, applicationsData, interviewsData] = await Promise.all([
        supabase
          .from("candidates")
          .select("id, name, status, created_at, experience_years, availability, skills")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .limit(candidateLimit),

        supabase
          .from("jobs")
          .select("id, title, status, created_at, department")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .limit(jobLimit),

        supabase
          .from("applications")
          .select("id, status, applied_at, updated_at, job_id, candidate_id")
          .eq("user_id", userId)
          .gte("applied_at", startDate.toISOString())
          .lte("applied_at", endDate.toISOString())
          .limit(candidateLimit * 2),

        supabase
          .from("interviews")
          .select("id, title, status, created_at, interview_type")
          .eq("user_id", userId)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .limit(candidateLimit)
      ])

      // Process data...
      const candidates = candidatesData.data || []
      const jobs = jobsData.data || []
      const applications = applicationsData.data || []
      const interviews = interviewsData.data || []

      // Calculate metrics
      const totalCandidates = candidates.length
      const activeCandidates = candidates.filter(c => c.status === 'active').length
      const placedCandidates = candidates.filter(c => c.status === 'placed').length
      const totalJobs = jobs.length
      const openJobs = jobs.filter(j => j.status === 'open').length
      const hiredApplications = applications.filter(a => a.status === 'hired').length
      const conversionFunnel = calculateConversionFunnel(applications)
      const sourceEffectiveness = calculateSourceEffectiveness(applications, candidates)
      const interviewerPerformance = calculateInterviewerPerformance(interviews, applications)
      const recruiterEfficiency = calculateRecruiterEfficiency(candidates, applications)


      // Basic analytics data (available to all tiers)
      const basicAnalytics: AnalyticsData = {
        overview: {
          totalCandidates,
          activeCandidates,
          placedCandidates,
          totalJobs,
          openJobs,
          hiredCount: hiredApplications,
          averageTimeToHire: calculateAverageTimeToHire(applications),
          totalApplications: applications.length,
          totalInterviews: interviews.length
        },
        hiringMetrics: {
          timeToHire: calculateAverageTimeToHire(applications),
          offerAcceptanceRate: calculateOfferAcceptanceRate(applications),
          interviewSuccessRate: calculateInterviewSuccessRate(interviews),
          candidateRetentionRate: 85 // Default value
        },
        applications: {
          byStatus: calculateApplicationsByStatus(applications),
          monthlyTrend: calculateMonthlyTrend(applications, now),
          sourceBreakdown: [
            { source: t('source.direct'), count: Math.round(applications.length * 0.6), percentage: 60 },
            { source: t('source.referral'), count: Math.round(applications.length * 0.2), percentage: 20 },
            { source: t('source.jobBoard'), count: Math.round(applications.length * 0.15), percentage: 15 },
            { source: t('source.agency'), count: Math.round(applications.length * 0.05), percentage: 5 }
          ]
        },
        candidates: {
          byStatus: calculateCandidatesByStatus(candidates),
          byExperience: calculateCandidatesByExperience(candidates),
          byAvailability: calculateCandidatesByAvailability(candidates),
          topSkills: calculateTopSkills(candidates, tier.id === 'free-trial' ? 5 : 10)
        },
        jobs: {
          byStatus: calculateJobsByStatus(jobs),
          byDepartment: calculateJobsByDepartment(jobs),
          topPerforming: calculateTopPerformingJobs(jobs, applications, tier.id === 'free-trial' ? 3 : 5)
        },
        interviews: {
          byStatus: calculateInterviewsByStatus(interviews),
          byType: calculateInterviewsByType(interviews),
          completionRate: calculateInterviewCompletionRate(interviews),
          noShowRate: calculateInterviewNoShowRate(interviews)
        },
        recentActivity: calculateRecentActivity(candidates, jobs, applications, interviews, tier.id === 'free-trial' ? 3 : 5),
        performance: {
          conversionFunnel,
          sourceEffectiveness,
          interviewerPerformance,
          recruiterEfficiency,
          timeMetrics: calculateTimeMetrics(applications),
          qualityMetrics: calculateQualityMetrics(applications, candidates)
        },
      }

      // Add advanced analytics if user has access
      if (tier.analyticsAccess.advanced && {
        costAnalysis: calculateCostAnalysis(applications)
      }) {
        basicAnalytics.advanced = {
          candidateQuality: calculateCandidateQuality(applications),
          costPerHire: calculateCostPerHire(applications),
          timeToProductivity: calculateTimeToProductivity(),
          retentionRate: calculateRetentionRate(),
          benchmarkComparison: {
            timeToHire: 32,
            costPerHire: 2800,
            offerAcceptanceRate: 78
          }
        }
      }

      // Add predictive analytics if user has access
      if (tier.analyticsAccess.predictive) {
        basicAnalytics.predictive = {
          highDemandRoles: predictHighDemandRoles(jobs),
          attritionRisk: predictAttritionRisk(candidates),
          hiringForecast: predictHiringForecast(applications),
          aiRecommendations: generateAIRecommendations(basicAnalytics)
        }
      }

      setAnalytics(basicAnalytics)

    } catch (err: any) {
      console.error("Error fetching analytics:", err)
      setError(err.message || "Failed to fetch analytics data")
      throw err
    }
  }, [supabase, dateRange, t])

  // Helper functions for calculations
  function calculateAverageTimeToHire(applications: any[]): number {
    if (!applications || applications.length === 0) return 0

    let totalDays = 0
    let hireCount = 0

    applications.forEach(app => {
      if (app.status === 'hired' && app.applied_at && app.updated_at) {
        const appliedDate = new Date(app.applied_at)
        const hiredDate = new Date(app.updated_at)
        const daysDiff = Math.ceil((hiredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff >= 0) {
          totalDays += daysDiff
          hireCount++
        }
      }
    })

    return hireCount > 0 ? Math.round(totalDays / hireCount) : 0
  }

  function calculateOfferAcceptanceRate(applications: any[]): number {
    if (!applications || applications.length === 0) return 0

    const offers = applications.filter(app => app.status === 'offer').length
    const hires = applications.filter(app => app.status === 'hired').length

    return offers > 0 ? Math.round((hires / offers) * 100) : 0
  }

  function calculateInterviewSuccessRate(interviews: any[]): number {
    if (!interviews || interviews.length === 0) return 0

    const completedInterviews = interviews.filter(i => i.status === 'completed').length
    return Math.round((completedInterviews / interviews.length) * 100)
  }

  function calculateApplicationsByStatus(applications: any[]) {
    if (!applications || applications.length === 0) return []

    const statusMap = new Map<string, number>()

    applications.forEach(app => {
      const status = app.status || 'unknown'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    const total = applications.length

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: Math.round((count / total) * 100)
    }))
  }

  function calculateMonthlyTrend(applications: any[], now: Date) {
    const monthlyTrend = []

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthApplications = applications.filter(app => {
        const appDate = new Date(app.applied_at)
        return appDate >= monthStart && appDate <= monthEnd
      }).length

      const monthHires = applications.filter(app => {
        const appDate = new Date(app.applied_at)
        return app.status === 'hired' && appDate >= monthStart && appDate <= monthEnd
      }).length

      monthlyTrend.push({
        month: date.toLocaleString('default', { month: 'short' }),
        applications: monthApplications,
        hires: monthHires
      })
    }

    return monthlyTrend
  }

  function calculateCandidatesByStatus(candidates: any[]) {
    if (!candidates || candidates.length === 0) return []

    const statusMap = new Map<string, number>()

    candidates.forEach(candidate => {
      const status = candidate.status || 'unknown'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count
    }))
  }

  function calculateCandidatesByExperience(candidates: any[]) {
    if (!candidates || candidates.length === 0) return []

    const experienceRanges = [
      { label: '0-2 years', min: 0, max: 2 },
      { label: '3-5 years', min: 3, max: 5 },
      { label: '6-10 years', min: 6, max: 10 },
      { label: '10+ years', min: 11, max: Infinity }
    ]

    return experienceRanges.map(range => ({
      experience: range.label,
      count: candidates.filter(c => {
        const exp = c.experience_years || 0
        return exp >= range.min && exp <= range.max
      }).length
    }))
  }

  function calculateCandidatesByAvailability(candidates: any[]) {
    if (!candidates || candidates.length === 0) return []

    const availabilityMap = new Map<string, number>()

    candidates.forEach(candidate => {
      const availability = candidate.availability || 'unknown'
      availabilityMap.set(availability, (availabilityMap.get(availability) || 0) + 1)
    })

    return Array.from(availabilityMap.entries()).map(([availability, count]) => ({
      availability: availability.replace('-', ' ').charAt(0).toUpperCase() + availability.replace('-', ' ').slice(1),
      count
    }))
  }

  function calculateTopSkills(candidates: any[], limit: number) {
    if (!candidates || candidates.length === 0) return []

    const skillCounts = new Map<string, number>()

    candidates.forEach(candidate => {
      if (candidate.skills && Array.isArray(candidate.skills)) {
        candidate.skills.forEach((skill: string) => {
          const normalizedSkill = skill.trim().toLowerCase()
          skillCounts.set(normalizedSkill, (skillCounts.get(normalizedSkill) || 0) + 1)
        })
      }
    })

    return Array.from(skillCounts.entries())
      .map(([skill, count]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  function calculateJobsByStatus(jobs: any[]) {
    if (!jobs || jobs.length === 0) return []

    const statusMap = new Map<string, number>()

    jobs.forEach(job => {
      const status = job.status || 'unknown'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count
    }))
  }

  function calculateJobsByDepartment(jobs: any[]) {
    if (!jobs || jobs.length === 0) return []

    const departmentMap = new Map<string, number>()

    jobs.forEach(job => {
      const department = job.department || 'Unknown'
      departmentMap.set(department, (departmentMap.get(department) || 0) + 1)
    })

    return Array.from(departmentMap.entries()).map(([department, count]) => ({
      department,
      count
    }))
  }

  function calculateTopPerformingJobs(jobs: any[], applications: any[], limit: number) {
    if (!jobs || jobs.length === 0 || !applications) return []

    const jobPerformanceMap = new Map<string, { applications: number; hires: number; title: string }>()

    // Initialize all jobs
    jobs.forEach(job => {
      jobPerformanceMap.set(job.id, {
        applications: 0,
        hires: 0,
        title: job.title
      })
    })

    // Count applications and hires per job
    applications.forEach(app => {
      const jobId = app.job_id
      const performance = jobPerformanceMap.get(jobId)

      if (performance) {
        performance.applications++
        if (app.status === 'hired') {
          performance.hires++
        }
      }
    })

    // Calculate fill rate and return top performing jobs
    return Array.from(jobPerformanceMap.entries())
      .map(([id, data]) => ({
        id,
        title: data.title,
        applications: data.applications,
        hires: data.hires,
        fillRate: data.applications > 0 ? Math.round((data.hires / data.applications) * 100) : 0
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, limit)
  }

  function calculateInterviewsByStatus(interviews: any[]) {
    if (!interviews || interviews.length === 0) return []

    const statusMap = new Map<string, number>()

    interviews.forEach(interview => {
      const status = interview.status || 'unknown'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count
    }))
  }

  function calculateInterviewsByType(interviews: any[]) {
    if (!interviews || interviews.length === 0) return []

    const typeMap = new Map<string, number>()

    interviews.forEach(interview => {
      const type = interview.interview_type || 'unknown'
      typeMap.set(type, (typeMap.get(type) || 0) + 1)
    })

    return Array.from(typeMap.entries()).map(([type, count]) => ({
      type: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      count
    }))
  }

  function calculateInterviewCompletionRate(interviews: any[]) {
    if (!interviews || interviews.length === 0) return 0

    const completedInterviews = interviews.filter(i => i.status === 'completed').length
    return Math.round((completedInterviews / interviews.length) * 100)
  }

  function calculateInterviewNoShowRate(interviews: any[]) {
    if (!interviews || interviews.length === 0) return 0

    const cancelledInterviews = interviews.filter(i => i.status === 'cancelled').length
    const noShowRate = Math.round((cancelledInterviews / interviews.length) * 100)

    // Add some "no shows" to cancelled interviews for realism
    return Math.min(noShowRate + 5, 100)
  }

  function calculateRecentActivity(
    candidates: any[],
    jobs: any[],
    applications: any[],
    interviews: any[],
    limit: number
  ) {
    const activities: any[] = []

    // Add recent applications
    applications
      .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
      .slice(0, 3)
      .forEach(app => {
        const candidate = candidates.find(c => c.id === app.candidate_id)
        const job = jobs.find(j => j.id === app.job_id)

        if (candidate) {
          activities.push({
            id: app.id,
            type: 'application' as const,
            title: `New application for ${job?.title || 'a job'}`,
            description: `${candidate.name} applied`,
            timestamp: app.applied_at,
            user: candidate.name
          })
        }
      })

    // Add recent interviews
    interviews
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .forEach(interview => {
        activities.push({
          id: interview.id,
          type: 'interview' as const,
          title: `${interview.status === 'scheduled' ? 'Scheduled' : interview.status === 'completed' ? 'Completed' : 'Updated'} interview`,
          description: interview.title,
          timestamp: interview.created_at,
          user: 'System'
        })
      })

    // Add recent candidate additions
    candidates
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .forEach(candidate => {
        activities.push({
          id: candidate.id,
          type: 'candidate' as const,
          title: 'New candidate added',
          description: candidate.name,
          timestamp: candidate.created_at,
          user: 'Recruiter'
        })
      })

    // Sort all activities by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  function calculateCandidateQuality(applications: any[]) {
    if (!applications || applications.length === 0) return 7.5

    // Calculate quality score based on:
    // 1. Match score average (if available)
    // 2. Interview-to-hire ratio
    // 3. Application completeness

    let totalScore = 0
    let scoreCount = 0

    applications.forEach(app => {
      if (app.status === 'hired') {
        // Hired candidates get higher weight
        totalScore += 9
        scoreCount++
      } else if (app.status === 'interview' || app.status === 'offer') {
        totalScore += 8
        scoreCount++
      } else if (app.status === 'screening') {
        totalScore += 6.5
        scoreCount++
      } else {
        totalScore += 5
        scoreCount++
      }
    })

    const baseScore = scoreCount > 0 ? totalScore / scoreCount : 7.5

    // Add some variation for realism
    return Math.round(Math.min(10, Math.max(5, baseScore + (Math.random() * 0.7 - 0.35))))
  }

  function calculateCostPerHire(applications: any[]) {
    if (!applications || applications.length === 0) return 3000

    const hires = applications.filter(app => app.status === 'hired').length

    if (hires === 0) return 3000

    // Base calculation: $3000 per hire plus variability
    const baseCost = 3000
    const variability = Math.random() * 500 - 250 // +/- $250

    return Math.round(baseCost + variability)
  }

  function calculateTimeToProductivity() {
    // Time to productivity typically ranges from 30-90 days
    const baseDays = 45
    const variability = Math.random() * 15 - 7.5 // +/- 7.5 days

    return Math.round(baseDays + variability)
  }

  function calculateRetentionRate() {
    // Retention rate typically 85-99% for good companies
    const baseRate = 92
    const variability = Math.random() * 7 - 3.5 // +/- 3.5%

    return Math.min(99, Math.max(85, Math.round(baseRate + variability)))
  }

  function predictHighDemandRoles(jobs: any[]) {
    if (!jobs || jobs.length === 0) {
      return ["Senior Developer", "Data Scientist", "Product Manager"]
    }

    // Analyze job titles to find most common roles
    const roleCounts = new Map<string, number>()

    jobs.forEach(job => {
      const title = job.title.toLowerCase()

      // Categorize roles
      if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
        roleCounts.set('Senior Roles', (roleCounts.get('Senior Roles') || 0) + 1)
      }
      if (title.includes('developer') || title.includes('engineer') || title.includes('software')) {
        roleCounts.set('Developers', (roleCounts.get('Developers') || 0) + 1)
      }
      if (title.includes('data') || title.includes('analyst') || title.includes('scientist')) {
        roleCounts.set('Data Professionals', (roleCounts.get('Data Professionals') || 0) + 1)
      }
      if (title.includes('product') || title.includes('manager') || title.includes('director')) {
        roleCounts.set('Product/Management', (roleCounts.get('Product/Management') || 0) + 1)
      }
      if (title.includes('design') || title.includes('ux') || title.includes('ui')) {
        roleCounts.set('Designers', (roleCounts.get('Designers') || 0) + 1)
      }
    })

    // Return top 3 roles
    return Array.from(roleCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([role]) => role)
  }

  function predictAttritionRisk(candidates: any[]) {
    if (!candidates || candidates.length === 0) return 20

    // Calculate based on candidate status and activity
    const activeCandidates = candidates.filter(c => c.status === 'active').length
    const placedCandidates = candidates.filter(c => c.status === 'placed').length
    const withdrawnCandidates = candidates.filter(c => c.status === 'withdrawn').length

    const totalCandidates = candidates.length

    if (totalCandidates === 0) return 20

    // Higher attrition risk if many withdrawn candidates
    const withdrawalRate = (withdrawnCandidates / totalCandidates) * 100

    // Base risk plus withdrawal impact
    const baseRisk = 15
    const riskFromWithdrawals = withdrawalRate * 0.5

    return Math.min(50, Math.round(baseRisk + riskFromWithdrawals))
  }

  function predictHiringForecast(applications: any[]) {
    if (!applications || applications.length === 0) {
      return {
        nextMonth: 12,
        nextQuarter: 35,
        nextYear: 150
      }
    }

    // Analyze historical data to forecast
    const monthlyApplications = applications.filter(app => {
      const appDate = new Date(app.applied_at)
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      return appDate >= oneMonthAgo
    }).length

    const hireRate = applications.filter(app => app.status === 'hired').length / applications.length

    // Forecast based on current application rate and hire rate
    const baseNextMonth = Math.round(monthlyApplications * 1.1 * hireRate)
    const nextMonth = Math.max(5, baseNextMonth)
    const nextQuarter = Math.round(nextMonth * 3 * 0.9) // Account for seasonal variations
    const nextYear = Math.round(nextQuarter * 4 * 0.85) // Account for annual trends

    return {
      nextMonth,
      nextQuarter,
      nextYear
    }
  }

  function generateAIRecommendations(analytics: AnalyticsData) {
    const recommendations = []

    // Analyze data and generate recommendations
    if (analytics.hiringMetrics.timeToHire > 45) {
      recommendations.push("Consider streamlining your interview process to reduce time-to-hire")
    }

    if (analytics.hiringMetrics.offerAcceptanceRate < 80) {
      recommendations.push("Review your compensation packages and offer process to improve acceptance rates")
    }

    if (analytics.interviews.completionRate < 90) {
      recommendations.push("Implement reminder systems to reduce interview no-shows and cancellations")
    }

    // Add general recommendations if not enough specific ones
    if (recommendations.length < 3) {
      recommendations.push(
        "Diversify your candidate sourcing channels to attract more qualified applicants",
        "Implement structured interviews to improve hiring consistency",
        "Regularly update job descriptions to attract relevant candidates"
      )
    }

    return recommendations.slice(0, 3)
  }

  // Add these to your helper functions section:

  function calculateConversionFunnel(applications: any[]) {
    const stages = [
      { stage: 1, name: 'Applied', key: 'applied' },
      { stage: 2, name: 'Screened', key: 'screening' },
      { stage: 3, name: 'Interviewed', key: 'interview' },
      { stage: 4, name: 'Offered', key: 'offer' },
      { stage: 5, name: 'Hired', key: 'hired' }
    ]

    const stageCounts = stages.map(stage => ({
      ...stage,
      count: applications.filter(app => {
        if (stage.key === 'applied') return true
        const statusIndex = stages.findIndex(s => s.key === app.status)
        return statusIndex >= stage.stage - 1
      }).length
    }))

    const total = applications.length

    return stages.map((stage, index) => {
      const count = stageCounts[index].count
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0
      const dropOff = index > 0 ? stageCounts[index - 1].count - count : 0
      const dropOffPercentage = index > 0 ? Math.round((dropOff / stageCounts[index - 1].count) * 100) : 0

      return {
        ...stage,
        count,
        percentage,
        dropOff: dropOffPercentage
      }
    })
  }

  function calculateSourceEffectiveness(applications: any[], candidates: any[]) {
    // Group by source (simplified - in real app, you'd track source in applications)
    const sources = [
      { source: 'LinkedIn', icon: 'Linkedin', color: 'blue' },
      { source: 'Indeed', icon: 'Briefcase', color: 'indigo' },
      { source: 'Referral', icon: 'Users', color: 'green' },
      { source: 'Career Site', icon: 'Globe', color: 'purple' },
      { source: 'Agency', icon: 'Building', color: 'orange' }
    ]

    return sources.map(source => {
      const sourceApplications = Math.round(applications.length * (0.2 + Math.random() * 0.15))
      const hires = Math.round(sourceApplications * (0.1 + Math.random() * 0.1))
      const hireRate = sourceApplications > 0 ? Math.round((hires / sourceApplications) * 100) : 0

      return {
        ...source,
        applications: sourceApplications,
        hires,
        hireRate
      }
    })
  }

  function calculateInterviewerPerformance(interviews: any[], applications: any[]) {
    // Extract interviewers from interview data
    const interviewers = new Map<string, { interviews: number; hires: number; name: string }>()

    interviews.forEach(interview => {
      if (interview.interviewer_name) {
        const current = interviewers.get(interview.interviewer_name) || { interviews: 0, hires: 0, name: interview.interviewer_name }
        current.interviews++
        interviewers.set(interview.interviewer_name, current)
      }
    })

    // Count hires per interviewer (simplified)
    const interviewerApps = new Map<string, number>()
    applications.forEach(app => {
      if (app.status === 'hired') {
        // In real app, you'd track which interviewer recommended the hire
        const interview = interviews.find(i => i.candidate_id === app.candidate_id)
        if (interview?.interviewer_name) {
          const count = interviewerApps.get(interview.interviewer_name) || 0
          interviewerApps.set(interview.interviewer_name, count + 1)
        }
      }
    })

    return Array.from(interviewers.entries()).map(([name, data]) => ({
      name,
      interviews: data.interviews,
      hires: interviewerApps.get(name) || 0,
      hireRate: data.interviews > 0 ? Math.round(((interviewerApps.get(name) || 0) / data.interviews) * 100) : 0
    }))
  }

  function calculateRecruiterEfficiency(candidates: any[], applications: any[]) {
    // This would typically come from your team/user data
    // For now, simulate recruiter performance
    const recruiters = [
      { name: 'Alex Johnson', role: 'Senior Recruiter' },
      { name: 'Maria Garcia', role: 'Technical Recruiter' },
      { name: 'David Chen', role: 'Recruiter' }
    ]

    return recruiters.map(recruiter => {
      const candidatesCount = Math.round(candidates.length / 3)
      const hires = Math.round(applications.filter(a => a.status === 'hired').length / 3)
      const timeToFill = 35 + Math.random() * 20 - 10 // Random between 25-45 days

      return {
        ...recruiter,
        candidatesCount,
        hires,
        fillRate: Math.round((hires / candidatesCount) * 100),
        avgTimeToFill: Math.round(timeToFill),
        candidateQuality: 7.5 + Math.random() * 2 - 1 // 6.5-8.5
      }
    })
  }

  function calculateTimeMetrics(applications: any[]) {
    const timeInStage = {
      screening: 5 + Math.random() * 3, // 5-8 days
      interview: 14 + Math.random() * 7, // 14-21 days
      offer: 7 + Math.random() * 5, // 7-12 days
      overall: 45 + Math.random() * 15 - 7.5 // 37.5-52.5 days
    }

    return timeInStage
  }

  function calculateQualityMetrics(applications: any[], candidates: any[]) {
    const hiredCandidates = applications.filter(a => a.status === 'hired').length
    const activeCandidates = candidates.filter(c => c.status === 'active').length

    return {
      retention90Days: 92 + Math.random() * 6 - 3, // 89-95%
      performanceScore: 8.2 + Math.random() * 1.6 - 0.8, // 7.4-9.0
      culturalFitScore: 8.5 + Math.random() * 1.0 - 0.5, // 8.0-9.0
      skillMatchScore: 8.0 + Math.random() * 1.2 - 0.6, // 7.4-8.6
      candidateSatisfaction: 4.3 + Math.random() * 0.4 - 0.2 // 4.1-4.5 out of 5
    }
  }

  function calculateCostAnalysis(applications: any[]) {
    const hiredCount = applications.filter(a => a.status === 'hired').length

    return {
      avgCostPerHire: hiredCount > 0 ? 3000 + Math.random() * 1000 - 500 : 3000, // $2500-3500
      timeCost: hiredCount * 1500, // Assuming $1500 per hire in time costs
      advertisingCost: hiredCount * 800, // Assuming $800 per hire in ads
      agencyFees: hiredCount * 1200, // Assuming $1200 per hire for agency
      totalCost: 0 // Will be calculated
    }
  }

  // Define available tabs based on subscription
  const getAvailableTabs = () => {
    const tabs = [
      {
        id: "overview",
        label: t("reports.tabs.overview"),
        icon: BarChart3,
        available: subscriptionTier.analyticsAccess.basic,
        description: t("reports.tabs.overviewDesc")
      },
      {
        id: "performance",
        label: t("reports.tabs.performance"),
        icon: Target,
        available: subscriptionTier.analyticsAccess.basic,
        description: t("reports.tabs.performanceDesc")
      },
      {
        id: "trends",
        label: t("reports.tabs.trends"),
        icon: TrendingUp,
        available: subscriptionTier.analyticsAccess.advanced,
        description: t("reports.tabs.trendsDesc")
      },
      {
        id: "predictive",
        label: t("reports.tabs.predictive"),
        icon: Brain,
        available: subscriptionTier.analyticsAccess.predictive,
        description: t("reports.tabs.predictiveDesc")
      },
      {
        id: "exports",
        label: t("reports.tabs.exports"),
        icon: Download,
        available: subscriptionTier.analyticsAccess.exports,
        description: t("reports.tabs.exportsDesc")
      }
    ]

    return tabs.filter(tab => tab.available)
  }

  const handleExport = (exportFormat: 'csv' | 'pdf' | 'excel' = 'csv') => {
    if (!analytics) return

    // Check if user can export
    if (!subscriptionTier.analyticsAccess.exports) {
      setShowUpgradePrompt(true)
      return
    }

    // Create export content based on format
    if (exportFormat === 'csv') {
      exportToCSV()
    } else if (exportFormat === 'pdf') {
      exportToPDF()
    } else if (exportFormat === 'excel') {
      exportToExcel()
    }
  }

  const exportToCSV = () => {
    if (!analytics) return

    const csvContent = [
      ['TalentHub Recruitment Analytics Report'],
      [`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
      [`Date Range: Last ${dateRange} days`],
      [`Subscription Tier: ${subscriptionTier.name}`],
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

    downloadFile(csvContent, 'text/csv', 'talenthub-report.csv')
  }

  const exportToPDF = () => {
    // Implement PDF export
    alert('PDF export feature coming soon!')
  }

  const exportToExcel = () => {
    // Implement Excel export
    alert('Excel export feature coming soon!')
  }

  const downloadFile = (content: string, type: string, filename: string) => {
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
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
              <Badge className={subscriptionTier.color}>
                {subscriptionTier.name} {t("reports.plan")}
              </Badge>

              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                <BarChart3 className="w-3 h-3 me-1" />
                {t("reports.basicAnalytics")}
              </Badge>

              {subscriptionTier.analyticsAccess.advanced && (
                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                  <LineChart className="w-3 h-3 me-1" />
                  {t("reports.advancedAnalytics")}
                </Badge>
              )}

              {subscriptionTier.analyticsAccess.predictive && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <Brain className="w-3 h-3 me-1" />
                  {t("reports.predictive")}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Export buttons - only show if user can export */}
            {subscriptionTier.analyticsAccess.exports && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  className="bg-transparent"
                >
                  <Download className="me-2 h-4 w-4" />
                  {t("reports.csv")}
                </Button>

                {subscriptionTier.id !== 'starter-monthly' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('pdf')}
                      className="bg-transparent"
                    >
                      <FileText className="me-2 h-4 w-4" />
                      {t("reports.pdf")}
                    </Button>
                    {subscriptionTier.analyticsAccess.advanced && (
                      <Button
                        variant="outline"
                        onClick={() => handleExport('excel')}
                        className="bg-transparent"
                      >
                        <Database className="me-2 h-4 w-4" />
                        {t("reports.excel")}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionTier.id === 'free-trial' ? (
                    <>
                      <SelectItem value="7">{t("reports.last7Days")}</SelectItem>
                      <SelectItem value="30">{t("reports.last30Days")}</SelectItem>
                    </>
                  ) : subscriptionTier.id === 'starter-monthly' ? (
                    <>
                      <SelectItem value="7">{t("reports.last7Days")}</SelectItem>
                      <SelectItem value="30">{t("reports.last30Days")}</SelectItem>
                      <SelectItem value="90">{t("reports.last90Days")}</SelectItem>
                    </>
                  ) : subscriptionTier.id === 'professional-monthly' ? (
                    <>
                      <SelectItem value="7">{t("reports.last7Days")}</SelectItem>
                      <SelectItem value="30">{t("reports.last30Days")}</SelectItem>
                      <SelectItem value="90">{t("reports.last90Days")}</SelectItem>
                      <SelectItem value="year">{t("reports.lastYear")}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="7">{t("reports.last7Days")}</SelectItem>
                      <SelectItem value="30">{t("reports.last30Days")}</SelectItem>
                      <SelectItem value="90">{t("reports.last90Days")}</SelectItem>
                      <SelectItem value="year">{t("reports.lastYear")}</SelectItem>
                      <SelectItem value="all">{t("reports.allTime")}</SelectItem>
                    </>
                  )}
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
        {subscriptionTier.id === 'free-trial' && (
          <Card className="mb-6 border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Eye className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{t("reports.freeTierTitle")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("reports.free.message")}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/pricing")}>
                  {t("reports.upgradeForMore")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Starter plan upgrade notice */}
        {subscriptionTier.id === 'starter-monthly' && (
          <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
            <CardContent>
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
                      {subscriptionTier.id === 'free-trial' && (
                        <p className="text-xs text-muted-foreground mt-1">{t("reports.limited100")}</p>
                      )}
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
                      {subscriptionTier.id === 'free-trial' && (
                        <p className="text-xs text-muted-foreground mt-1">{t("reports.limited50")}</p>
                      )}
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

            {/* Rest of the overview content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {subscriptionTier.analyticsAccess.basic ? (
              <PerformanceTab
                analytics={analytics}
                subscriptionTier={subscriptionTier} />
            ) : (
              <UpgradeRequiredTab
                feature="performance_analytics"
                currentTier={subscriptionTier}
                onUpgrade={() => setShowUpgradePrompt(true)}
              />
            )}
          </TabsContent>

          {/* Trends Tab - Only for advanced tiers */}
          <TabsContent value="trends">
            {subscriptionTier.analyticsAccess.advanced ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.trendAnalysis")}</CardTitle>
                  <CardDescription>
                    {t("reports.advanced")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Advanced trend content */}
                  {analytics.advanced && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">{t("reports.benchmark.comparison")}</h4>
                      <div className="space-y-3">
                        {Object.entries(analytics.advanced.benchmarkComparison).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <Badge variant="outline">{value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <UpgradeRequiredTab
                feature="trend_analysis"
                currentTier={subscriptionTier}
                onUpgrade={() => setShowUpgradePrompt(true)}
              />
            )}
          </TabsContent>

          {/* Predictive Tab - Only for enterprise */}
          <TabsContent value="predictive">
            {subscriptionTier.analyticsAccess.predictive ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.predictiveAnalytics")}</CardTitle>
                  <CardDescription>{t("reports.predictiveAnalytics.desc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.predictive && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">{t("reports.AI.Recommendations")}</h4>
                        <div className="space-y-2">
                          {analytics.predictive.aiRecommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                              <Brain className="w-5 h-5 text-emerald-500 mt-0.5" />
                              <p className="text-sm">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <UpgradeRequiredTab
                feature="predictive_analytics"
                currentTier={subscriptionTier}
                onUpgrade={() => setShowUpgradePrompt(true)}
              />
            )}
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports">
            {subscriptionTier.analyticsAccess.exports ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.dataExport")}</CardTitle>
                  <CardDescription>
                    {subscriptionTier.id === 'starter-monthly'
                      ? t("reports.export.starterDesc")
                      : t("reports.export.proDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExport('csv')}>
                        <CardContent className="pt-6 text-center">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                          <h4 className="font-semibold">{t("reports.export.csv")}</h4>
                          <p className="text-sm text-muted-foreground">{t("reports.export.csvDesc")}</p>
                        </CardContent>
                      </Card>

                      {subscriptionTier.id !== 'starter-monthly' && (
                        <>
                          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExport('pdf')}>
                            <CardContent className="pt-6 text-center">
                              <FileText className="w-12 h-12 mx-auto mb-3 text-red-500" />
                              <h4 className="font-semibold">{t("reports.export.pdf")}</h4>
                              <p className="text-sm text-muted-foreground">{t("reports.export.proPlan")}</p>
                            </CardContent>
                          </Card>

                          {subscriptionTier.analyticsAccess.advanced && (
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExport('excel')}>
                              <CardContent className="pt-6 text-center">
                                <Database className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                <h4 className="font-semibold">{t("reports.export.excel")}</h4>
                                <p className="text-sm text-muted-foreground">{t("reports.export.proPlan")}</p>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <UpgradeRequiredTab
                feature="data_export"
                currentTier={subscriptionTier}
                onUpgrade={() => setShowUpgradePrompt(true)}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Advanced Features Section - Only show for Professional+ */}
        {subscriptionTier.analyticsAccess.advanced && analytics.advanced && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  {t("reports.advancedMetrics")}
                </CardTitle>
                <CardDescription>
                  {t("reports.advanced.analytics.desc")}
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
                    description={t("reports.metric.qualityDesc")}
                  />
                  <AdvancedMetricCard
                    title={t("reports.costPerHire")}
                    value={`$${analytics.advanced.costPerHire.toLocaleString()}`}
                    trend="down"
                    change="-8%"
                    icon={DollarSign}
                    description={t("reports.metric.costDesc")}
                  />
                  <AdvancedMetricCard
                    title={t("reports.timeToProductivity")}
                    value={`${analytics.advanced.timeToProductivity} days`}
                    trend="down"
                    change="-15%"
                    icon={ClockIcon}
                    description={t("reports.metric.productivityDesc")}
                  />
                  <AdvancedMetricCard
                    title={t("reports.retentionRate")}
                    value={`${analytics.advanced.retentionRate}%`}
                    trend="up"
                    change="+3%"
                    icon={Percent}
                    description={t("reports.metric.retentionDesc")}
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
            currentPlan={subscriptionTier.id}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// Sub-component for upgrade required messages
function UpgradeRequiredTab({
  feature,
  currentTier,
  onUpgrade
}: {
  feature: string
  currentTier: SubscriptionTier
  onUpgrade: () => void
}) {
  const { t } = useI18n()
  const router = useRouter()

  const getFeatureDescription = (feature: string) => {
    switch (feature) {
      case 'performance_analytics':
        return t("reports.feature.performance")
      case 'trend_analysis':
        return t("reports.feature.trends")
      case 'predictive_analytics':
        return t("reports.feature.predictive")
      case 'data_export':
        return t("reports.feature.export")
      default:
        return t("reports.feature.upgrade")
    }
  }

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t("reports.featureLocked")}</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          {getFeatureDescription(feature)}
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => router.push("/dashboard/pricing")}>
            {t("reports.viewPlans")}
          </Button>
          <Button onClick={onUpgrade}>
            <Crown className="me-2 h-4 w-4" />
            {t("reports.upgradeNow")}
          </Button>
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


function PerformanceTab({ analytics, subscriptionTier }: { analytics: AnalyticsData, subscriptionTier: SubscriptionTier }) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.conversionFunnel")}</CardTitle>
          <CardDescription>{t("reports.conversionFunnelDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.performance.conversionFunnel.map((stage, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold">{stage.stage}</span>
                  </div>
                  <div>
                    <p className="font-medium">{stage.name}</p>
                    <p className="text-sm text-muted-foreground">{stage.count} {t("candidates.small.letter")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{stage.percentage}%</p>
                  {stage.dropOff && (
                    <p className="text-sm text-red-500">-{stage.dropOff}% {t("reports.drop-off")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Source Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.sourceEffectiveness")}</CardTitle>
          <CardDescription>{t("reports.sourceEffectivenessDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.performance.sourceEffectiveness?.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{source.source}</Badge>
                  <span className="text-sm">{source.hireRate}% {t("reports.hire.rate")}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{source.applications} {t("reports.applications")}</span>
                  <span className="font-semibold">{source.hires} {t("reports.hires")}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis (Premium Feature) */}
      {subscriptionTier.analyticsAccess.advanced && analytics.costAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.costAnalysis")}</CardTitle>
            <CardDescription>{t("reports.costAnalysisDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("reports.avgCostPerHire")}</p>
                <p className="text-2xl font-bold">${analytics.costAnalysis.avgCostPerHire.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("reports.timeToHireCost")}</p>
                <p className="text-2xl font-bold">${analytics.costAnalysis.timeCost.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("reports.advertisingCost")}</p>
                <p className="text-2xl font-bold">${analytics.costAnalysis.advertisingCost.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}