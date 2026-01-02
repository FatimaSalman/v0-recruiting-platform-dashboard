// components/pricing-plans.tsx - Add Free Trial plan

"use client"

import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice, getTranslatedPlans } from "@/lib/products"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { CheckoutDialog } from "./checkout-dialog"
import { useI18n } from "@/lib/i18n-context"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function PricingPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const { t } = useI18n()
  const supabase = useSupabase()
  const router = useRouter()

  const plans = getTranslatedPlans(t)

  // Update your handleFreeTrialStart function to better log the error
  const handleFreeTrialStart = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("Auth error:", authError)
        throw authError
      }

      if (!user) {
        router.push("/auth/sign-up")
        return
      }

      console.log("Starting free trial for user:", user.id)

      // Check if user already has a subscription
      const { data: existingSub, error: checkError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (checkError) {
        console.error("Check subscription error:", checkError)
        throw checkError
      }

      if (existingSub) {
        // User already has a subscription
        console.log("User already has subscription:", existingSub)
        alert(t("pricing.alert.existing"))
        router.push("/dashboard")
        return
      }

      // Create a free trial subscription
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      console.log("Creating subscription with data:", {
        user_id: user.id,
        plan_id: "free-trial",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd,
      })

      const { data: newSub, error: createError } = await supabase
        .from("subscriptions")
        .insert([
          {
            user_id: user.id,
            plan_id: "free-trial",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: trialEnd,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error("Create subscription error details:", createError)
        throw createError
      }

      console.log("Subscription created successfully:", newSub)

      // Optional: Show success message
      alert(t("pricing.alert.success"))

      router.push("/dashboard")

    } catch (error) {
      console.error("Error starting free trial:", error)
      alert(`${t("pricing.alert.error")} ${(error as any)?.message || t("reports.tryAgain")}`)
    }
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Button asChild>
        <Link href="/dashboard">
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
          {t("pricing.backToDashboard")}
        </Link>
      </Button>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("pricing.title")}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("pricing.trial.subtitle")}
        </p>
      </div>

      {/* Free Trial Banner */}
      <div className="mb-12 bg-gradient-to-r from-primary/10 to-primary/5 rtl:bg-gradient-to-l border border-primary/20 rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">{t("pricing.trial.bannerTitle")}</h3>
            <p className="text-muted-foreground">
              {t("pricing.trial.bannerDesc")}
            </p>
          </div>
          <Button size="lg" onClick={handleFreeTrialStart}>
            {t("pricing.trial.startBtn")}
          </Button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        {/* Free Trial Card */}
        {plans.filter(p => p.id == "free-trial").map((plan) =>
          <Card key={plan.id} className="p-8 relative border-2 border-primary">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">{plan.name}</Badge>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">{t("pricing.trial.duration")}</span>
              </div>
            </div>

            <Button
              className="w-full mb-6"
              variant="outline"
              onClick={handleFreeTrialStart}
            >
              {t("pricing.trial.startBtn")}
            </Button>

            <div className="space-y-3">
              {plan?.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Other plans */}
        {plans.filter(p => p.id !== "free-trial").map((plan) => (
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
              {plan.id.includes("free") ? t("pricing.getStarted") : `${(t("pricing.subscribePrefix"))} ${formatPrice(plan.priceInCents, plan.currency)}/ ${(t("pricing.month"))}`}
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
      {selectedPlan && selectedPlan !== "free-trial" && (
        <CheckoutDialog
          planId={selectedPlan}
          open={!!selectedPlan}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
        />
      )}
    </div>
  )
}