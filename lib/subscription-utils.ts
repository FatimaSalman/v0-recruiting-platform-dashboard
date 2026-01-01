// lib/subscription-utils.ts
import { createServerClient } from "./supabase/server"
import { PRICING_PLANS } from "./products"
import { SupabaseClient } from "@supabase/supabase-js"

export type PlanType = 'free-trial' | 'starter-monthly' | 'professional-monthly' | 'enterprise-monthly'

export interface PlanLimits {
    maxJobs: number
    maxCandidates: number
    maxTeamMembers: number
    maxInterview: number
    maxApplications: number
    hasAnalytics: boolean
    hasCustomBranding: boolean
    hasAPI: boolean
    schedulerInterview: boolean
}

export interface SubscriptionInfo {
    plan_type: PlanType
    is_active: boolean
    limits: PlanLimits
}

// Define limits for each plan
export const PLAN_LIMITS: Record<string, PlanLimits> = {
    'free-trial': {
        maxJobs: 5,
        maxCandidates: 10,
        maxTeamMembers: 1,
        maxInterview: 3,
        maxApplications: 10,
        hasAnalytics: false,
        hasCustomBranding: false,
        hasAPI: false,
        schedulerInterview: false
    },
    'starter-monthly': {
        maxJobs: 10,
        maxCandidates: 50,
        maxTeamMembers: 2,
        maxInterview: 10,
        maxApplications: 100,
        hasAnalytics: false,
        hasCustomBranding: false,
        hasAPI: false,
        schedulerInterview: false
    },
    'professional-monthly': {
        maxJobs: 50,
        maxCandidates: 500,
        maxTeamMembers: 10,
        maxInterview: 99999,
        maxApplications: 99999,
        hasAnalytics: true,
        hasCustomBranding: true,
        hasAPI: false,
        schedulerInterview: true
    },
    'enterprise-monthly': {
        maxJobs: 99999, // Unlimited
        maxCandidates: 99999, // Unlimited
        maxTeamMembers: 99999, // Unlimited
        maxInterview: 99999,
        maxApplications: 99999,
        hasAnalytics: true,
        hasCustomBranding: true,
        hasAPI: true,
        schedulerInterview: true
    }
}

export function getSubscriptionInfo(planId?: string, status?: string): SubscriptionInfo {
    const plan = planId || 'free-trial'
    const isActive = status === 'active' || status === 'trialing'

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['free-trial']

    return {
        plan_type: plan as PlanType,
        is_active: isActive,
        limits
    }
}

export function getUsagePercentage(current: number, limit: number | null): number {
    if (!limit || limit >= 99999) return 0 // Unlimited
    if (limit === 0) return 100
    return Math.round((current / limit) * 100)
}

export async function getSubscriptionTier(userId: string, supabase: SupabaseClient): Promise<PlanType> {
    try {
        // Check if user has an active subscription
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('tier, status, current_period_end')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

        if (error || !subscription) {
            // Check for trial period
            const { data: user } = await supabase
                .from('profiles')
                .select('created_at, trial_ends_at')
                .eq('id', userId)
                .single()

            if (user) {
                const now = new Date()
                const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null

                // If within trial period, user gets starter features
                if (trialEndsAt && now < trialEndsAt) {
                    return 'starter-monthly'
                }
            }

            // Default to free if no active subscription or trial
            return 'free-trial'
        }

        // Check if subscription is still active (not expired)
        const now = new Date()
        const periodEnd = new Date(subscription.current_period_end)

        if (now > periodEnd) {
            // Subscription expired, revert to free
            return 'free-trial'
        }

        // Return the tier from subscription
        return subscription.tier as PlanType

    } catch (error) {
        console.error('Error fetching subscription tier:', error)
        return 'free-trial'
    }
}

export async function checkAnalyticsAccess(userId: string, supabase: SupabaseClient) {
    if (!supabase) {
        return {
            hasAccess: true,
            features: ['basic_analytics', 'overview_tab', 'performance_tab', 'starter_limits'],
            tier: 'starter-monthly' as const,
            redirectUrl: null
        }
    }

    const tier = await getSubscriptionTier(userId, supabase)


    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single()

    const planId = subscription?.plan_id || 'free-trial'
    const plan = PRICING_PLANS.find(p => p.id === planId) as any

    const hasAccess = plan?.limits.hasAnalytics || false
    const hasAdvancedReports = plan?.limits.hasAdvancedReports || false

    const features = []
    if (hasAccess) features.push("basic_analytics")
    if (hasAdvancedReports) features.push("advanced_reports")
    if (plan?.limits.hasExportCapabilities) features.push("export")
    if (plan?.limits.hasPredictiveAnalytics) features.push("predictive")
    if (plan?.limits.hasCustomReports) features.push("custom_reports")

    if (!hasAccess) {
        return {
            hasAccess: false,
            plan: planId,
            features,
            redirectUrl: "/dashboard/pricing?upgrade=analytics&feature=reports"
        }
    }

    return {
        hasAccess: true,
        plan: planId,
        features
    }
}