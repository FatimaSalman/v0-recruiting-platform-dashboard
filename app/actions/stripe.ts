"use server"

import { stripe } from "@/lib/stripe"
import { PRICING_PLANS } from "@/lib/products"
import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

const PRICE_IDS: Record<string, string> = {
  'starter-monthly': process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
  'professional-monthly': process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID!,
  'enterprise-monthly': process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
}

export async function startCheckoutSession(planId: string) {
  const supabase = await createServerClient()

  // Get the current user
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("You must be logged in to start a checkout session")
  }

  console.log('👤 Starting checkout for user:', user.id, user.email)

  // Find the plan
  const plan = PRICING_PLANS.find((p) => p.id === planId)
  if (!plan) {
    throw new Error(`Plan with id "${planId}" not found`)
  }

  const priceId = PRICE_IDS[planId]

  //Get the origin (domain)
  const origin = process.env.NEXT_PUBLIC_APP_URL

  const tempSessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`


  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}&temp_session_id=${tempSessionId}`,
    cancel_url: `${origin}/dashboard/pricing`,
    metadata: {
      user_id: user.id,
      plan_id: planId,
      user_email: user.email || "",
      plan_name: plan.name,
      plan_description: plan.description,
      plan_price: plan.priceInCents,
      plan_currency: plan.currency,
      plan_billing_period: plan.billingPeriod,  // Add this line
      price_id: priceId,
    },
  })

  console.log('✅ Checkout session created:', session.id)
  console.log('Session URL:', session.url)
  console.log('Session metadata:', session.metadata)

  // Return the checkout URL
  if (!session.url) {
    throw new Error("Failed to create checkout session")
  }

  return session.url
}

export async function getSubscriptionStatus() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Get user's subscription from database
  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()

  return subscription
}

// Add this function to handle successful subscriptions
export async function handleSubscriptionUpdate(
  subscriptionId: string,
  customerId: string,
  userId: string,
  planId: string,
  status: string,
  periodStart: Date,
  periodEnd: Date
) {

  console.log('🔄 handleSubscriptionUpdate called with:', {
    userId,
    subscriptionId,
    customerId,
    planId,
    status,
    periodStart,
    periodEnd
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← Use service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {

    console.log('Updating subscription for user:', {
      userId,
      subscriptionId,
      customerId,
      planId,
      status,
      periodStart,
      periodEnd
    })

    if (!userId) {
      throw new Error('User ID is required')
    }

    let planType = 'free-trial'
    if (planId.includes('starter-monthly')) planType = 'starter-monthly'
    else if (planId.includes('professional-monthly')) planType = 'professional-monthly'
    else if (planId.includes('enterprise-monthly')) planType = 'enterprise-monthly'

    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !userExists) {
      console.error('❌ User not found:', userError)
      throw new Error(`User ${userId} not found in profiles table`)
    }

    console.log('✅ User found:', userExists)

    const plan = PRICING_PLANS.find(p => p.id === planId) as any
    const maxTeamMembers = plan?.limits.maxTeamMembers || 1
    const hasAnalytics = plan?.limits.hasAnalytics || false
    const hasCustomBranding = plan?.limits.hasCustomBranding || false
    const hasAPI = plan?.limits.hasAPI || false
    const schedulerInterview = plan?.limits.schedulerInterview || false



    // Insert or update subscription in database
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_id: planId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        plan_type: planType,
        max_team_members: maxTeamMembers,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      }).select()


    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }
    console.log('✅ Subscription saved successfully:', data)

    return { success: true }
  } catch (error) {
    console.error('Error updating subscription:', error)
    return { success: false, error }
  }
}

// Update the webhook handler to save subscription
export async function handleStripeWebhook(request: Request) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()

  console.log('=== WEBHOOK DEBUG ===')
  console.log('Body received:', body.substring(0, 500) + '...')
  console.log('Signature header:', sig?.substring(0, 50) + '...')
  console.log('STRIPE_WEBHOOK_SECRET configured:', !!process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET)

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET!
    )

    console.log('✅ Webhook verified successfully!')
    console.log('Event type:', event.type)
    console.log('Event ID:', event.id)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      console.log('=== CHECKOUT SESSION COMPLETED DEBUG ===')
      console.log('Full session object:', JSON.stringify(session, null, 2))
      console.log('Metadata:', session.metadata)
      console.log('Subscription ID:', session.subscription)


      // CRITICAL: Check if metadata has user_id
      if (!session.metadata?.user_id) {
        console.error('❌ ERROR: No user_id in metadata!')
        console.log('Available metadata:', Object.keys(session.metadata || {}))
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      if (!session.subscription) {
        console.error('❌ ERROR: No subscription in session!')
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      console.log('✅ Metadata contains user_id:', session.metadata.user_id)

      try {
        // Get subscription details with type assertion
        const subscription = await stripe.subscriptions.retrieve(session.subscription) as any

        console.log('==== Subscription details:====', {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          customer: subscription.customer
        })

        // Handle potential null/undefined dates
        const periodStart = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : new Date()

        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days

        console.log('Period start (converted):', periodStart)
        console.log('Period end (converted):', periodEnd)

        // Call handleSubscriptionUpdate
        console.log('=== CALLING handleSubscriptionUpdate ===')
        const result = await handleSubscriptionUpdate(
          subscription.id,
          subscription.customer as string,
          session.metadata.user_id,
          session.metadata.plan_id || '',
          subscription.status,
          periodStart,
          periodEnd
        )

        console.log('handleSubscriptionUpdate result:', result)

        if (result.success) {
          console.log('✅ Subscription saved to database successfully!')
        } else {
          console.error('❌ Failed to save subscription:', result.error)
        }
      } catch (subError) {
        console.error('❌ Error retrieving subscription:', subError)
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any
      console.log('Subscription updated:', subscription.id)

      // Handle potential null/undefined dates
      const periodStart = subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : new Date()

      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Update subscription in database
      await updateSubscriptionInDatabase(
        subscription.id,
        subscription.status,
        periodStart,
        periodEnd
      )
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      console.log('Subscription deleted:', subscription.id)

      // Mark subscription as cancelled
      await markSubscriptionCancelled(subscription.id)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err: any) {
    console.error('❌ WEBHOOK ERROR:', err.message)
    console.error('Full error:', err)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
}

// Update subscription in database   
async function updateSubscriptionInDatabase(
  subscriptionId: string,
  status: string,
  periodStart: Date,
  periodEnd: Date
) {
  const supabase = await createServerClient()

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating subscription:', error)
    return { success: false, error }
  }
}

// Mark subscription as cancelled
async function markSubscriptionCancelled(subscriptionId: string) {
  const supabase = await createServerClient()

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error marking subscription as cancelled:', error)
    return { success: false, error }
  }
}

export async function verifyAndSaveSubscription(sessionId: string, tempSessionId?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // First, check if subscription already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', sessionId)
      .single()

    if (existingSub) {
      console.log('✅ Subscription already exists in database')
      return { success: true, subscription: existingSub }
    }

    // If not, retrieve from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    if (!session.subscription) {
      throw new Error('No subscription found for this session')
    }

    const subscription = await stripe.subscriptions.retrieve(
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id
    ) as any

    const userId = session.metadata?.user_id || session.customer_details?.email
    if (!userId) {
      throw new Error('Could not determine user ID from session')
    }

    // Get plan details
    const planId = session.metadata?.plan_id || 'starter-monthly'
    const plan = PRICING_PLANS.find(p => p.id === planId)

    const periodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : new Date()

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Handle subscription creation
    const result = await handleSubscriptionUpdate(
      subscription.id,
      subscription.customer as string,
      userId,
      planId,
      subscription.status,
      periodStart,
      periodEnd
    )

    return result

  } catch (error) {
    console.error('Error verifying subscription:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}