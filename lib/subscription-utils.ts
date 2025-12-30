// lib/subscription-utils.ts
import { createClient } from '@supabase/supabase-js'

export type PlanType = 'free-trial' | 'starter-monthly' | 'professional-monthly' | 'enterprise-monthly'

export interface SubscriptionInfo {
    plan_type: PlanType
    status: 'active' | 'canceled' | 'past_due' | 'trialing'
    current_period_end: string | null
    is_active: boolean
    has_access_to_analytics: boolean
}

export async function getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    try {
        // First check subscription table
        const { data: subscription, error } = await (await supabase)
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error || !subscription) {
            // User might be on free trial (no subscription record yet)
            return {
                plan_type: 'free-trial',
                status: 'trialing',
                current_period_end: null,
                is_active: false,
                has_access_to_analytics: false
            }
        }

        // Determine plan type from subscription data
        let planType: PlanType = 'free-trial'
        if (subscription.plan_id) {
            // Map Stripe plan IDs to your plan types
            if (subscription.plan_id.includes('basic')) planType = 'starter-monthly'
            else if (subscription.plan_id.includes('premium')) planType = 'professional-monthly'
            else if (subscription.plan_id.includes('enterprise')) planType = 'enterprise-monthly'
        }

        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        const hasAccessToAnalytics = ['starter-monthly', 'professional-monthly', 'enterprise-monthly'].includes(planType)

        return {
            plan_type: planType,
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            is_active: isActive,
            has_access_to_analytics: hasAccessToAnalytics
        }
    } catch (error) {
        console.error('Error fetching subscription:', error)
        return null
    }
}

export async function checkAnalyticsAccess(userId: string): Promise<boolean> {
    const subscription = await getUserSubscription(userId)
    if (!subscription) return false

    return subscription.has_access_to_analytics
}