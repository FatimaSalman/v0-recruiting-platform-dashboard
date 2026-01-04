"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Crown,
  Building,
  Star,
  Target,
  Award,
  FileText,
  MessageSquare,
  Settings,
  Plus,
  Eye,
  BarChart,
  Shield,
  Globe,
  Cloud,
  Cpu,
  Infinity as InfinityIcon,
  Lock,
  UserPlus
} from "lucide-react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { useI18n } from "@/lib/i18n-context"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { UpgradePrompt } from "./upgrade-prompt"
import { getSubscriptionInfo, getUsagePercentage, type SubscriptionInfo } from "@/lib/subscription-utils"
import { Progress } from "./progress"
import { verifyAndSaveSubscription } from "@/app/actions/stripe"

interface Stats {
  totalJobs: number
  activeJobs: number
  totalCandidates: number
  activeCandidates: number
  totalApplications: number
  newApplications: number
  totalInterviews: number
  upcomingInterviews: number
  averageTimeToHire: number
  interviewConversionRate: number
  offerAcceptanceRate: number
}

interface DashboardOverviewProps {
  user: any
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    activeCandidates: 0,
    totalApplications: 0,
    newApplications: 0,
    totalInterviews: 0,
    upcomingInterviews: 0,
    averageTimeToHire: 0,
    interviewConversionRate: 0,
    offerAcceptanceRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    plan_type: 'free-trial',
    is_active: true,
    limits: getSubscriptionInfo('free-trial', 'trialing').limits
  })
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const searchParams = useSearchParams()

  const { t, locale } = useI18n()
  const supabase = useSupabase()
  const router = useRouter()
  const dateLocale = locale === 'ar' ? ar : enUS


  useEffect(() => {
    checkSubscriptionSuccess()
  }, [searchParams, router])

  const checkSubscriptionSuccess = async () => {
    const sessionId = searchParams.get("session_id")
    const subscriptionSuccess = searchParams.get("subscription")
    const tempSessionId = searchParams.get("temp_session_id")

    if (subscriptionSuccess === "success" && sessionId) {
      try {
        setSubscriptionLoading(true)
        setSubscriptionError(null)

        console.log("Processing subscription success for session:", sessionId)

        // Call server action to verify and save subscription
        const result = await verifyAndSaveSubscription(sessionId, tempSessionId || undefined)

        if (result.success) {
          console.log("✅ Subscription verified and saved successfully!")

          // Remove query params from URL
          router.replace("/dashboard")

          // Refresh dashboard data
          fetchDashboardData()

          // Show success message
          alert("Subscription activated successfully! Your plan has been upgraded.")
        } else {
          const errorMessage = 'error' in result ? (result.error as string) : "Failed to activate subscription"
          console.error("❌ Failed to save subscription:", errorMessage)
          setSubscriptionError(errorMessage)
        }
      } catch (error) {
        console.error("Error processing subscription:", error)
        setSubscriptionError("An error occurred while activating your subscription")
      } finally {
        setSubscriptionLoading(false)
      }
    }
  }

  async function fetchDashboardData() {
    try {
      setLoading(true)

      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      // Fetch subscription info
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single()

      const subscriptionInfo = getSubscriptionInfo(
        subscriptionData?.plan_id,
        subscriptionData?.status
      )
      setSubscription(subscriptionInfo)

      // Fetch stats
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, status")
        .eq("user_id", user.id)

      const { data: candidates } = await supabase
        .from("candidates")
        .select("id, status")
        .eq("user_id", user.id)

      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, created_at")
        .eq("user_id", user.id)

      const { data: interviews } = await supabase
        .from("interviews")
        .select("id, status, scheduled_at")
        .eq("user_id", user.id)

      // Calculate stats
      const totalJobs = jobs?.length || 0
      const activeJobs = jobs?.filter(j => j.status === 'open').length || 0
      const totalCandidates = candidates?.length || 0
      const activeCandidates = candidates?.filter(c => c.status === 'active').length || 0
      const totalApplications = applications?.length || 0
      const newApplications = applications?.filter(a =>
        new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0
      const totalInterviews = interviews?.length || 0
      const upcomingInterviews = interviews?.filter(i =>
        i.status === 'scheduled'
        // && new Date(i.scheduled_at) > new Date()
      ).length || 0

      setStats({
        totalJobs,
        activeJobs,
        totalCandidates,
        activeCandidates,
        totalApplications,
        newApplications,
        totalInterviews,
        upcomingInterviews,
        averageTimeToHire: 14, // Example value
        interviewConversionRate: 25, // Example value
        offerAcceptanceRate: 85 // Example value
      })

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise-monthly':
        return <Crown className="w-5 h-5 text-purple-500" />
      case 'professional-monthly':
        return <Zap className="w-5 h-5 text-blue-500" />
      case 'starter-monthly':
        return <Star className="w-5 h-5 text-green-500" />
      case 'free-trial':
        return <Clock className="w-5 h-5 text-amber-500" />
      default:
        return <Building className="w-5 h-5 text-gray-500" />
    }
  }

  const getPlanName = (plan: string) => {
    const planNames: Record<string, string> = {
      'free-trial': t("plans.freeTrial"),
      'starter-monthly': t("plans.starter"),
      'professional-monthly': t("plans.professional"),
      'enterprise-monthly': t("plans.enterprise")
    }
    return planNames[plan] || t("plans.free")
  }

  const getPlanBadge = (plan: string, isActive: boolean) => {
    const badgeColors: Record<string, string> = {
      'free-trial': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      'starter-monthly': 'bg-green-500/10 text-green-500 border-green-500/20',
      'professional-monthly': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'enterprise-monthly': 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    }

    const colorClass = badgeColors[plan] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'

    return (
      <Badge className={`${colorClass} gap-1.5`}>
        {getPlanIcon(plan)}
        {getPlanName(plan)}
        {!isActive && ` (${t("common.inactive")})`}
        {plan === 'free-trial' && <Clock className="w-3 h-3" />}
      </Badge>
    )
  }

  const statCards = [
    {
      title: t("dashboard.stats.totalJobs"),
      value: stats.totalJobs,
      icon: Briefcase,
      description: `${stats.activeJobs} ${t("dashboard.stats.activeJob")}`,
      href: "/dashboard/jobs",
      limit: subscription.limits.maxJobs,
      usage: getUsagePercentage(stats.totalJobs, subscription.limits.maxJobs),
      isUnlimited: subscription.limits.maxJobs >= 99999
    },
    {
      title: t("dashboard.stats.candidates"),
      value: stats.totalCandidates,
      icon: Users,
      description: `${stats.activeCandidates} ${t("dashboard.stats.activeCandidates")}`,
      href: "/dashboard/candidates",
      limit: subscription.limits.maxCandidates,
      usage: getUsagePercentage(stats.totalCandidates, subscription.limits.maxCandidates),
      isUnlimited: subscription.limits.maxCandidates >= 99999
    },
    {
      title: t("dashboard.stats.applications"),
      value: stats.totalApplications,
      icon: TrendingUp,
      description: `${stats.newApplications} ${t("dashboard.stats.newThisWeek")}`,
      href: "/dashboard/applications",
      limit: subscription.limits.maxApplications,
      usage: getUsagePercentage(stats.totalApplications, subscription.limits.maxApplications),
      isUnlimited: subscription.limits.maxCandidates >= 99999
    },
    {
      title: t("dashboard.stats.interviews"),
      value: stats.totalInterviews,
      icon: Calendar,
      description: `${stats.upcomingInterviews} ${t("dashboard.stats.upcoming")}`,
      href: "/dashboard/interviews",
      limit: subscription.limits.maxInterview,
      usage: getUsagePercentage(stats.totalInterviews, subscription.limits.maxInterview),
      isUnlimited: subscription.limits.maxCandidates >= 99999
    },
  ]

  const quickActions = [
    {
      title: t("dashboard.actions.addJob"),
      icon: Plus,
      href: "/dashboard/jobs/new",
      color: "text-blue-500 bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      title: t("dashboard.actions.addCandidate"),
      icon: UserPlus,
      href: "/dashboard/candidates/new",
      color: "text-green-500 bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      title: t("dashboard.actions.scheduleInterview"),
      icon: Calendar,
      href: "/dashboard/interviews/new",
      color: "text-purple-500 bg-purple-500/10",
      borderColor: "border-purple-500/20",
      disabled: !subscription.limits.schedulerInterview && subscription.plan_type !== 'free-trial'
    },
    {
      title: t("dashboard.actions.viewReports"),
      icon: BarChart,
      href: "/dashboard/reports",
      color: "text-amber-500 bg-amber-500/10",
      borderColor: "border-amber-500/20",
      disabled: !subscription.limits.hasAnalytics && subscription.plan_type !== 'free-trial'
    }
  ]

  const planFeatures = [
    {
      title: t("features.teamMembers"),
      value: subscription.limits.maxTeamMembers >= 99999
        ? t("common.unlimited")
        : subscription.limits.maxTeamMembers,
      icon: Users,
      unlimited: subscription.limits.maxTeamMembers >= 99999
    },
    {
      title: t("features.analytics"),
      value: subscription.limits.hasAnalytics ? t("common.enabled") : t("common.disabled"),
      icon: BarChart,
      enabled: subscription.limits.hasAnalytics
    },
    {
      title: t("features.branding"),
      value: subscription.limits.hasCustomBranding ? t("common.enabled") : t("common.disabled"),
      icon: Globe,
      enabled: subscription.limits.hasCustomBranding
    },
    {
      title: t("features.interviewScheduler"),
      value: subscription.limits.schedulerInterview ? t("common.enabled") : t("common.disabled"),
      icon: Calendar,
      enabled: subscription.limits.schedulerInterview
    },
    {
      title: t("features.apiAccess"),
      value: subscription.limits.hasAPI ? t("common.enabled") : t("common.disabled"),
      icon: Cpu,
      enabled: subscription.limits.hasAPI
    }
  ]

  const handleLimitClick = (card: typeof statCards[0]) => {
    if (card.usage >= 80 && card.limit && !card.isUnlimited) {
      setShowUpgradePrompt(true)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with Plan Info */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("dashboard.welcome")}, {user.user_metadata?.full_name || user.email}
          </h1>
          <div className="flex items-center gap-3">
            {getPlanBadge(subscription.plan_type, subscription.is_active)}
            {subscription.plan_type === 'free-trial' && (
              <Badge variant="outline" className="gap-1.5">
                <Clock className="w-3 h-3" />
                {t("plans.trialEnds")} {formatDistanceToNow(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), {
                  addSuffix: true,
                  locale: locale === 'ar' ? ar : enUS
                })}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="bg-transparent" asChild>
            <Link href="/dashboard/settings">
              <Settings className="me-2 h-4 w-4" />
              {t("dashboard.settings")}
            </Link>
          </Button>
          {(subscription.plan_type === 'free-trial') && (
            <Button asChild>
              <Link href="/dashboard/pricing">
                <Crown className="me-2 h-4 w-4" />
                {t("dashboard.upgrade")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards with Usage Limits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <Card
            key={index}
            className={`hover:shadow-md transition-shadow cursor-pointer ${card.usage >= 80 ? 'border-amber-500/30' : ''}`}
            onClick={() => handleLimitClick(card)}
          >
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${card.icon === Briefcase ? 'bg-blue-500/10' :
                    card.icon === Users ? 'bg-green-500/10' :
                      card.icon === TrendingUp ? 'bg-purple-500/10' :
                        'bg-amber-500/10'}`}>
                    <card.icon className={`w-5 h-5 ${card.icon === Briefcase ? 'text-blue-500' :
                      card.icon === Users ? 'text-green-500' :
                        card.icon === TrendingUp ? 'text-purple-500' :
                          'text-amber-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                </div>

                {card.limit && !card.isUnlimited && (
                  <div className="text-right">
                    <Badge variant="outline" className={`text-xs ${card.usage >= 80 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}`}>
                      {card.value}/{card.limit}
                    </Badge>
                  </div>
                )}
                {card.isUnlimited && (
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs gap-1">
                      <InfinityIcon className="w-3 h-3" />
                      {t("common.unlimited")}
                    </Badge>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-2">{card.description}</p>

              {card.limit && !card.isUnlimited && (
                <>
                  <Progress
                    value={card.usage}
                    className={`h-2 ${card.usage >= 80 ? 'bg-amber-500' : ''}`}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {card.usage}% {t("common.used")}
                    </span>
                    {card.usage >= 80 && (
                      <span className="text-xs text-amber-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t("dashboard.nearLimit")}
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t("dashboard.quickActions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className={`hover:shadow-md transition-shadow ${action.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${action.color} ${action.borderColor} border`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{action.title}</h3>
                    {action.disabled && (
                      <div className="flex items-center gap-1 mt-1">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {subscription.plan_type === 'free-trial'
                            ? t("dashboard.availableInPaid")
                            : t("dashboard.upgradeRequired")}
                        </span>
                      </div>
                    )}
                  </div>
                  {!action.disabled && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild={!!action.href}
                      disabled={action.disabled}
                    >
                      <Link href={action.href!}>
                        <Plus className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Plan Features */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t("dashboard.currentPlan")}: {getPlanName(subscription.plan_type)}
          </CardTitle>
          <CardDescription>
            {subscription.is_active
              ? t("dashboard.activeSubscription")
              : t("dashboard.subscriptionInactive")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {planFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`p-3 rounded-lg inline-flex mb-2 ${feature.enabled ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                  <feature.icon className={`w-6 h-6 ${feature.enabled ? 'text-green-500' : 'text-gray-500'}`} />
                </div>
                <h4 className="font-medium mb-1">{feature.title}</h4>
                <p className={`text-sm ${feature.enabled ? 'text-green-500' :
                  feature.unlimited ? 'text-blue-500' :
                    'text-muted-foreground'}`}>
                  {feature.value}
                </p>
              </div>
            ))}
          </div>

          {(subscription.plan_type === 'free-trial') && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    {subscription.plan_type === 'free-trial'
                      ? t("dashboard.upgradeToUnlock")
                      : t("dashboard.upgradeForMore")}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {subscription.plan_type === 'free-trial'
                      ? t("dashboard.trialLimited")
                      : t("dashboard.freeLimited")}
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/pricing">
                    {t("dashboard.viewPlans")}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Prompt Dialog */}
      {showUpgradePrompt && (
        <UpgradePrompt
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          requiredFeature="dashboard_features"
          currentPlan={subscription.plan_type || 'free-trial'}
        />
      )}
    </div>
  )
}