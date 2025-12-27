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
    name: "pricing.free.trial",
    description: "pricing.free.trial.desc",
    priceInCents: 0, // Free
    currency: "usd",
    billingPeriod: "monthly",
    features: [
      "pricing.free.features1",
      "pricing.free.features2",
      "pricing.free.features3",
      "pricing.free.features4",
      "pricing.free.features5",
      "pricing.free.features6",
    ],
  }, {
    id: "starter-monthly",
    name: "pricing.starter",
    description: "pricing.starter.desc",
    priceInCents: 4900, // $49/month
    currency: "usd",
    billingPeriod: "monthly",
    features: [
      "pricing.starter.feature1",
      "pricing.starter.feature2",
      "pricing.starter.feature3",
      "pricing.starter.feature4",
      "pricing.starter.feature5",
    ],
  },
  {
    id: "professional-monthly",
    name: "pricing.professional",
    description: "pricing.professional.desc",
    priceInCents: 12900, // $129/month
    currency: "usd",
    billingPeriod: "monthly",
    popular: true,
    features: [
      "pricing.professional.feature1",
      "pricing.professional.feature2",
      "pricing.professional.feature3",
      "pricing.professional.feature4",
      "pricing.professional.feature5",
      "pricing.professional.feature6",
      "pricing.professional.feature7",
      "pricing.professional.feature8",
    ],
  },
  {
    id: "enterprise-monthly",
    name: "pricing.enterprise",
    description: "pricing.enterprise.desc",
    priceInCents: 29900, // $299/month
    currency: "usd",
    billingPeriod: "monthly",
    features: [
      "pricing.enterprise.feature1",
      "pricing.enterprise.feature2",
      "pricing.enterprise.feature3",
      "pricing.enterprise.feature4",
      "pricing.enterprise.feature5",
      "pricing.enterprise.feature6",
      "pricing.enterprise.feature7",
      "pricing.enterprise.feature8",
      "pricing.enterprise.feature9",
      "pricing.enterprise.feature10",
      "pricing.enterprise.feature11",
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

// Helper function to get translated plan (used in components)
export function getTranslatedPlan(plan: PricingPlan, t: (key: string) => string) {
  return {
    ...plan,
    name: t(plan.name),
    description: t(plan.description),
    features: plan.features.map(featureKey => t(featureKey))
  }
}

// Helper to get all translated plans
export function getTranslatedPlans(t: (key: string) => string) {
  return PRICING_PLANS.map(plan => getTranslatedPlan(plan, t))
}