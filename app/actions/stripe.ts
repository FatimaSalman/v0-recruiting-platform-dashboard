"use server"

import { stripe } from "@/lib/stripe"
import { PRICING_PLANS } from "@/lib/products"
import { createServerClient } from "@/lib/supabase/server"

export async function startCheckoutSession(planId: string) {
  const supabase = await createServerClient()

  // Get the current user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("You must be logged in to start a checkout session")
  }

  // Find the plan
  const plan = PRICING_PLANS.find((p) => p.id === planId)
  if (!plan) {
    throw new Error(`Plan with id "${planId}" not found`)
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: {
      user_id: user.id,
      plan_id: planId,
    },
  })

  return session.client_secret
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

// Add to stripe.ts
export async function handleStripeWebhook(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Update user subscription in database
    }
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Webhook Error', { status: 400 });
  }
}