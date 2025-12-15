"use client"

import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PRICING_PLANS, formatPrice } from "@/lib/products"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { CheckoutDialog } from "./checkout-dialog"
import { useI18n } from "@/lib/i18n-context"

export function PricingPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const { t } = useI18n()

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("pricing.title")}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("pricing.subtitle")}</p>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {PRICING_PLANS.map((plan) => (
          <Card key={plan.id} className={cn("p-8 relative", plan.popular && "border-primary shadow-lg scale-105")}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{t("pricing.popular")}</Badge>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{formatPrice(plan.priceInCents, plan.currency)}</span>
                <span className="text-muted-foreground">/{t("pricing.month")}</span>
              </div>
            </div>

            <Button
              className="w-full mb-6"
              variant={plan.popular ? "default" : "outline"}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {t("pricing.getStarted")}
            </Button>

            <div className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* FAQ or additional info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {t("pricing.needHelp")}{" "}
          <a href="mailto:support@talenthub.com" className="text-primary hover:underline">
            support@talenthub.com
          </a>
        </p>
      </div>

      {/* Checkout Dialog */}
      {selectedPlan && (
        <CheckoutDialog
          planId={selectedPlan}
          open={!!selectedPlan}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
        />
      )}
    </div>
  )
}
