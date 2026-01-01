import { handleStripeWebhook } from '@/app/actions/stripe'

export async function POST(request: Request) {
    console.log('🔄 Webhook endpoint called')
    console.log('Webhook secret exists:', !!process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET)
    console.log('Webhook secret length:', process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET?.length)

    return handleStripeWebhook(request)
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This ensures that the webhook route is always treated as dynamic and not cached.     
// It also prevents Next.js from attempting to statically generate this route.
// This is important for webhook routes since they need to process incoming requests in real-time.
// By setting revalidate to 0, we ensure that the route is not cached and always processes requests as they come in.

