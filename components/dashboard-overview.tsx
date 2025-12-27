"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Users, Calendar, TrendingUp, AlertCircle, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { useI18n } from "@/lib/i18n-context"
import { Badge } from "@/components/ui/badge"
import { PRICING_PLANS, formatPrice } from "@/lib/products"
import { useSearchParams } from "next/navigation"
import { SubscriptionSuccess } from "@/components/subscription-success"
import { useRouter } from "next/navigation"
import { RecentActivity } from "@/components/recent-activity"

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  totalCandidates: number
  totalApplications: number
  totalInterviews: number
}

interface Subscription {
  id: string
  plan_id: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
}

export function DashboardOverview({ user }: { user: User }) {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [showTrialBanner, setShowTrialBanner] = useState(true)
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    totalApplications: 0,
    totalInterviews: 0
  })

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0)
  const [trialUsage, setTrialUsage] = useState({
    jobs: { current: 0, limit: 5 },
    candidates: { current: 0, limit: 10 }
  })
  const supabase = useSupabase()
  const { t } = useI18n()

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch jobs count
        const { count: jobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch active jobs count
        const { count: activeJobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "open")

        // Fetch candidates count
        const { count: candidatesCount } = await supabase
          .from("candidates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch applications count
        const { count: applicationsCount } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        const { count: interviewsCount } = await supabase
          .from("interviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        setStats({
          totalJobs: jobsCount || 0,
          activeJobs: activeJobsCount || 0,
          totalCandidates: candidatesCount || 0,
          totalApplications: applicationsCount || 0,
          totalInterviews: interviewsCount || 0,
        })

        // Set trial usage
        setTrialUsage({
          jobs: { current: jobsCount || 0, limit: 5 },
          candidates: { current: candidatesCount || 0, limit: 10 }
        })

        //Check if user has an active subscription
        if (user) {
          const { data: subscriptionData } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user?.id)
            .eq("status", "active")
            .single()
          setSubscription(subscriptionData)

          // Only show banner if user doesn't have a paid subscription
          setShowTrialBanner(!subscriptionData || subscriptionData.plan_id === "free-trial") // Hide trial banner after fetching subscription

          // Calculate trial days remaining if on free trial
          if (subscriptionData?.plan_id === "free-trial" && subscriptionData.current_period_end) {
            const endDate = new Date(subscriptionData.current_period_end)
            const now = new Date()
            const diffTime = endDate.getTime() - now.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            setTrialDaysRemaining(diffDays > 0 ? diffDays : 0)
          }
        }

      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user.id, supabase])

  const getPlanName = (planId: string) => {
    const plan = PRICING_PLANS.find(p => p.id === planId)
    return plan ? plan.name : 'Unknown Plan'
  }

  const getPlanPrice = (planId: string) => {
    const plan = PRICING_PLANS.find(p => p.id === planId)
    return plan ? formatPrice(plan.priceInCents, plan.currency) : ''
  }

  const getSubscriptionStatus = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Active', color: 'bg-green-500/10 text-green-500' }
      case 'cancelled': return { label: 'Cancelled', color: 'bg-red-500/10 text-red-500' }
      case 'past_due': return { label: 'Past Due', color: 'bg-yellow-500/10 text-yellow-500' }
      case 'trialing': return { label: 'Trialing', color: 'bg-blue-500/10 text-blue-500' }
      default: return { label: 'Inactive', color: 'bg-gray-500/10 text-gray-500' }
    }
  }

  const isOnFreeTrial = () => {
    return subscription?.plan_id === "free-trial" || (!subscription && trialDaysRemaining === 0)
  }

  const handleStartFreeTrial = async () => {
    try {
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: user.id,
        plan_id: "free-trial",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      })

      if (error) throw error

      // Refresh subscription data
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single()

      setSubscription(subscriptionData)

      // Calculate trial days remaining
      if (subscriptionData?.current_period_end) {
        const endDate = new Date(subscriptionData.current_period_end)
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setTrialDaysRemaining(diffDays > 0 ? diffDays : 0)
      }

    } catch (error) {
      console.error("Error starting free trial:", error)
    }
  }

  const statCards = [
    {
      title: t("dashboard.stats.totalJobs"),
      value: stats.totalJobs,
      icon: Briefcase,
      description: `${stats.activeJobs} ${t("dashboard.stats.active")}`,
      href: "/dashboard/jobs",
      limit: isOnFreeTrial() ? 5 : null
    },
    {
      title: t("dashboard.stats.candidates"),
      value: stats.totalCandidates,
      icon: Users,
      description: t("dashboard.stats.pipeline"),
      href: "/dashboard/candidates",
      limit: isOnFreeTrial() ? 10 : null
    },
    {
      title: t("dashboard.stats.applications"),
      value: stats.totalApplications,
      icon: TrendingUp,
      description: t("dashboard.stats.received"),
      href: "/dashboard/applications",
    },
    {
      title: t("dashboard.stats.interviews"),
      value: stats.totalInterviews,
      icon: Calendar,
      description: t("dashboard.stats.scheduled"),
      href: "/dashboard/interviews",
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Show success message if just subscribed */}
      {sessionId && <SubscriptionSuccess />}

      {/* Free Trial Banner */}
      {showTrialBanner && !subscription && (
        <div className=" mb-6 z-50 top-0 bg-primary text-primary-foreground py-2 p-4 d-lg rounded z-50">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">✨ {t("dashboard.banner.title")}</span>
              <span className="text-sm opacity-90">
                {t("dashboard.banner.message")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => router.push("/dashboard/pricing")}
              >
                {t("dashboard.upgrade.now")}
              </Button>
              <button
                onClick={() => setShowTrialBanner(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {t("dashboard.welcomeFull")} {user.user_metadata?.full_name || user.email}
        </h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {/* Free Trial Promo Banner */}
      {!subscription && (
        <Card className="mb-6 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t("pricing.trial.bannerTitle")}</h3>
                    <p className="text-muted-foreground">
                      {t("pricing.trial.bannerDesc")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 max-w-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{t("pricing.starter.feature1")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{t("pricing.starter.feature2")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{t("pricing.starter.feature3")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{t("pricing.starter.feature4")}</span>
                  </div>
                </div>
              </div>
              <Button size="lg" onClick={handleStartFreeTrial} className="whitespace-nowrap">
                {t("pricing.trial.startBtn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t("dashboard.subscriptonStatus.desc")}
          </CardTitle>
          <CardDescription>
            {subscription ?
              subscription.plan_id === "free-trial"
                ? t("dashboard.free.trial.active")
                : t("dashboard.your.current.plan")
              : t("dashboard.noActiveSubscription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{t("dashboard.loading.subscription")}</p>
          ) : subscription ? (
            subscription.plan_id === "free-trial" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t("pricing.free.trial")}</h3>
                    <p className="text-sm text-muted-foreground">{t("dashboard.days.free.access")}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    {t("dashboard.active.trial")}
                  </Badge>
                </div>

                {/* Trial Progress */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t("dashboard.time.remaining")}</span>
                      <span className="font-medium">
                        {trialDaysRemaining} {trialDaysRemaining !== 1 ? `${t("reports.days")}` : `${t("dashboard.day")}`}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, ((14 - trialDaysRemaining) / 14) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Usage Limits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("dashboard.jobs.used")}</span>
                        <span className="font-medium">
                          {trialUsage.jobs.current}/{trialUsage.jobs.limit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${trialUsage.jobs.current >= trialUsage.jobs.limit ? 'bg-red-500' : 'bg-primary'} transition-all duration-300`}
                          style={{ width: `${Math.min(100, (trialUsage.jobs.current / trialUsage.jobs.limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("dashboard.candidatesUsed")}</span>
                        <span className="font-medium">
                          {trialUsage.candidates.current}/{trialUsage.candidates.limit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${trialUsage.candidates.current >= trialUsage.candidates.limit ? 'bg-red-500' : 'bg-primary'} transition-all duration-300`}
                          style={{ width: `${Math.min(100, (trialUsage.candidates.current / trialUsage.candidates.limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {subscription.current_period_end && (
                  <div className="text-sm bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">
                      {t("dashboard.trial.ends")} <span className="font-medium">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href="/dashboard/pricing">
                      <CreditCard className="mr-2 w-4 h-4" />
                      {t("dashboard.upgrade.plan")}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/pricing">
                      {t("dashboard.viewPlans")}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{getPlanName(subscription.plan_id)}</h3>
                    <p className="text-sm text-muted-foreground">{getPlanPrice(subscription.plan_id)}/month</p>
                  </div>
                  <Badge className={getSubscriptionStatus(subscription.status).color}>
                    {getSubscriptionStatus(subscription.status).label}
                  </Badge>
                </div>

                {subscription.current_period_end && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      Renews on: {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/pricing">Change Plan</Link>
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">You're currently on the free trial. Upgrade to unlock all features.</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/pricing">
                  <CreditCard className="mr-2 w-4 h-4" />
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {stat.limit && (
                    <Badge variant="outline" className="text-xs">
                      {stat.value}/{stat.limit}
                    </Badge>
                  )}
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                {stat.limit && stat.value >= stat.limit && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                    <XCircle className="w-3 h-3" />
                    <span>Limit reached</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
            <CardDescription>{t("dashboard.quickActions.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              asChild
              disabled={isOnFreeTrial() && trialUsage.jobs.current >= trialUsage.jobs.limit}
            >
              <Link href="/dashboard/jobs/new">
                <Briefcase className="mr-2 h-4 w-4" />
                {t("jobs.postNew")}
                {isOnFreeTrial() && trialUsage.jobs.current >= trialUsage.jobs.limit && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Limit Reached
                  </Badge>
                )}
              </Link>
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              asChild
              disabled={isOnFreeTrial() && trialUsage.candidates.current >= trialUsage.candidates.limit}
            >
              <Link href="/dashboard/candidates/new">
                <Users className="mr-2 h-4 w-4" />
                {t("candidates.addCandidate")}
                {isOnFreeTrial() && trialUsage.candidates.current >= trialUsage.candidates.limit && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Limit Reached
                  </Badge>
                )}
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/interviews">
                <Calendar className="mr-2 h-4 w-4" />
                {t("interviews.schedule")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.activity")}</CardTitle>
            <CardDescription>{t("dashboard.activity.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.totalJobs === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                <p className="mb-4">{t("dashboard.noActivity")}</p>
                <Button asChild>
                  <Link href="/dashboard/jobs/new">{t("jobs.postNew")}</Link>
                </Button>
              </div>
            ) : (
              <RecentActivity userId={user.id} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}