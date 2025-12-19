export interface PricingPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  currency: string
  features: string[]
  popular?: boolean
  billingPeriod: "monthly" | "yearly"
}

// This is the source of truth for all pricing plans
// All UI to display plans should pull from this array
// IDs passed to the checkout session should be the same as IDs from this array
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free-trial",
    name: "Free Trial",
    description: "Try our platform free for 14 days",
    priceInCents: 0, // Free
    currency: "usd",
    billingPeriod: "monthly",
    features: [
      "Up to 5 active job postings",
      "10 candidate profiles",
      "Basic candidate search",
      "Email support",
      "1 team member",
      "14-day free trial period",
    ],
  },{
    id: "starter-monthly",
    name: "Starter",
    description: "Perfect for small teams getting started",
    priceInCents: 4900, // $49/month
    currency: "usd",
    billingPeriod: "monthly",
    features: [
      "Up to 10 active job postings",
      "50 candidate profiles",
      "Basic candidate search",
      "Email support",
      "2 team members",
    ],
  },
  {
    id: "professional-monthly",
    name: "Professional",
    description: "For growing teams with more hiring needs",
    priceInCents: 12900, // $129/month
    currency: "usd",
    billingPeriod: "monthly",
    popular: true,
    features: [
      "Up to 50 active job postings",
      "Unlimited candidate profiles",
      "Advanced AI-powered search",
      "Interview scheduling",
      "Priority email support",
      "10 team members",
      "Analytics dashboard",
      "Custom branding",
    ],
  },
  {
    id: "enterprise-monthly",
    name: "Enterprise",
    description: "For large organizations with custom needs",
    priceInCents: 29900, // $299/month
    currency: "usd",
    billingPeriod: "monthly",
    features: [
      "Unlimited job postings",
      "Unlimited candidate profiles",
      "AI-powered matching & search",
      "Interview scheduling",
      "24/7 priority support",
      "Unlimited team members",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
]

export function formatPrice(priceInCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(priceInCents / 100)
}
