"use client"

import { useCallback, useState } from "react"
// import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
// import { loadStripe } from "@stripe/stripe-js"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { startCheckoutSession } from "@/app/actions/stripe"
import { PRICING_PLANS, formatPrice, getTranslatedPlans } from "@/lib/products"
import { Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { useI18n } from "@/lib/i18n-context"

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutDialogProps {
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutDialog({ planId, open, onOpenChange }: CheckoutDialogProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const plan = getTranslatedPlans(t).find(p => p.id === planId)
  // const plan = PRICING_PLANS.find((p) => p.id === planId)
  console.log(`selected plan ${planId}`)

  const startCheckoutSessionForPlan = useCallback(() => startCheckoutSession(planId), [planId])

  const handleCheckout = async () => {
    if (!plan) return

    setLoading(true);
    setError(null);

    try {
      const sessionUrl = await startCheckoutSession(planId);
      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        throw new Error(t("checkout.error.createSession"))
      }
    } catch (err: any) {
      setError(err.message || t("checkout.error.start"))
      setLoading(false)
    }
  }

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("pricing.subscribeTo")} {plan.name}</DialogTitle>
          <DialogDescription>{formatPrice(plan.priceInCents, plan.currency)}/{t("pricing.month")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">{t("pricing.planIncludes")}</h4>
            <ul className="space-y-1 text-sm">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("pricing.processing")}
                </>
              ) : (
                `${t("pricing.subscribePrefix")} ${formatPrice(plan.priceInCents, plan.currency)}/${t("pricing.month")}`
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("pricing.cancel")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t("pricing.message")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
{/* <div id="checkout">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret: startCheckoutSessionForPlan }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </DialogContent> */}