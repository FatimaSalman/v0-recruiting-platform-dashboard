import { PricingPlans } from "@/components/pricing-plans"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing - TalentHub",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PricingPlans />
    </div>
  )
}
