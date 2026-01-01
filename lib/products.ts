import { pl } from "date-fns/locale"

export interface PricingPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  currency: string
  features: string[]
  popular?: boolean
  billingPeriod: "monthly" | "yearly"
  limits: {}
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
      "pricing.free.features7",
    ],
    limits: {
      maxCandidates: 10,
      maxJobs: 5,
      maxTeamMembers: 1,
      hasAnalytics: false,
      hasAdvancedReports: false,
      hasCustomBranding: false,
      hasAPI: false,
      schedulerInterview: false,
      maxInterviewsPerMonth: 3, // Add this
      hasUnlimitedInterviews: false,
      supportLevel: "community",
      supportResponseTime: "72h"
    }
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
      "pricing.starter.feature6",
      "pricing.starter.feature7",
    ],
    limits: {
      maxCandidates: 50,
      maxJobs: 10,
      maxTeamMembers: 2,
      hasAnalytics: true,
      hasAdvancedReports: false,
      hasCustomBranding: false,
      hasAPI: false,
      schedulerInterview: false,
      maxInterviewsPerMonth: 10, // Add this
      hasUnlimitedInterviews: false,
      supportLevel: "email",
      supportResponseTime: "48h"
    }
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
    limits: {
      maxCandidates: 99999,
      maxJobs: 50,
      maxTeamMembers: 10,
      hasAnalytics: true,
      hasAdvancedReports: true,
      hasCustomBranding: true,
      hasAPI: false,
      schedulerInterview: true,
      maxInterviewsPerMonth: 99999, // Add this
      hasUnlimitedInterviews: true,
      supportLevel: "priority-email", // ← Higher support level
      supportResponseTime: "24h" // ← Faster response time
    }
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
    limits: {
      maxCandidates: 99999,
      maxJobs: 99999,
      maxTeamMembers: 99999,
      hasAnalytics: true, 
      hasAdvancedReports: true, 
      hasExportCapabilities: true,
      hasPredictiveAnalytics: true, 
      hasCustomReports: true, 
      hasAPIIntegration: true, 
      hasDataWarehouse: true, 
      hasCustomBranding: true,
      hasAPI: true,
      schedulerInterview: true,
      maxInterviewsPerMonth: 99999, // Add this
      hasUnlimitedInterviews: true,
      supportLevel: "dedicated", // ← Highest support level
      supportResponseTime: "4h"
    }
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
    features: plan.features.map(featureKey => t(featureKey)),
    limits: plan.limits,
    maxInterviewsPerMonth: 3, // Add this
    hasUnlimitedInterviews: false
  }
}

// Helper to get all translated plans
export function getTranslatedPlans(t: (key: string) => string) {
  return PRICING_PLANS.map(plan => getTranslatedPlan(plan, t))
}