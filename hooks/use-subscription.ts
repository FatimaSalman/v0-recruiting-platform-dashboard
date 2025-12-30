// hooks/use-subscription.ts
"use client"

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase/supabase-provider'
import type { SubscriptionInfo } from '@/lib/subscription-utils'

export function useSubscription() {
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = useSupabase()

    useEffect(() => {
        async function fetchSubscription() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setSubscription(null)
                    return
                }

                // You might want to create an API endpoint for this
                const response = await fetch(`/api/user/subscription?userId=${user.id}`)
                const data = await response.json()

                setSubscription(data)
            } catch (error) {
                console.error('Error fetching subscription:', error)
                setSubscription(null)
            } finally {
                setLoading(false)
            }
        }

        fetchSubscription()
    }, [supabase])

    return { subscription, loading }
}