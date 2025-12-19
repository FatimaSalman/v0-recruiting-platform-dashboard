"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Users, Calendar, TrendingUp, AlertCircle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { useI18n } from "@/lib/i18n-context"
import { Badge } from "@/components/ui/badge"
import { PRICING_PLANS, formatPrice } from "@/lib/products"
import { useSearchParams } from "next/navigation"
import { SubscriptionSuccess } from "@/components/subscription-success"

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  totalCandidates: number
  totalApplications: number
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

  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    totalApplications: 0,
  })

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
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

        setStats({
          totalJobs: jobsCount || 0,
          activeJobs: activeJobsCount || 0,
          totalCandidates: candidatesCount || 0,
          totalApplications: applicationsCount || 0,
        })

        // Fetch subscription
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single()

        setSubscription(subscriptionData)

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
      default: return { label: 'Inactive', color: 'bg-gray-500/10 text-gray-500' }
    }
  }


  const statCards = [
    {
      title: t("dashboard.stats.totalJobs"),
      value: stats.totalJobs,
      icon: Briefcase,
      description: `${stats.activeJobs} ${t("dashboard.stats.active")}`,
      href: "/dashboard/jobs",
    },
    {
      title: t("dashboard.stats.candidates"),
      value: stats.totalCandidates,
      icon: Users,
      description: t("dashboard.stats.pipeline"),
      href: "/dashboard/candidates",
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
      value: 0,
      icon: Calendar,
      description: t("dashboard.stats.scheduled"),
      href: "/dashboard/interviews",
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Show success message if just subscribed */}
      {sessionId && <SubscriptionSuccess />}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {t("dashboard.welcomeFull")} {user.user_metadata?.full_name || user.email}
        </h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {/* Subscription Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Status
          </CardTitle>
          <CardDescription>
            {subscription ? 'Your current subscription plan' : 'No active subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading subscription...</p>
          ) : subscription ? (
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
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
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
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/jobs/new">
                <Briefcase className="mr-2 h-4 w-4" />
                {t("jobs.postNew")}
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/candidates">
                <Users className="mr-2 h-4 w-4" />
                {t("candidates.title")}
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
              <div className="text-sm text-muted-foreground">{t("dashboard.activityComingSoon")}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
