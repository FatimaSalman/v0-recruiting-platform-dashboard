"use client"

import { useCallback, useState } from "react"
// import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
// import { loadStripe } from "@stripe/stripe-js"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { startCheckoutSession } from "@/app/actions/stripe"
import { PRICING_PLANS, formatPrice } from "@/lib/products"
import { Loader2 } from "lucide-react"
import { Button } from "./ui/button"
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutDialogProps {
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutDialog({ planId, open, onOpenChange }: CheckoutDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const plan = PRICING_PLANS.find((p) => p.id === planId)
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
        throw new Error("Failed to create checkout session")
      }
    } catch (err: any) {
      setError(err.message || "Falied to start checkout")
      setLoading(false)
    }
  }

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscribe to {plan.name}</DialogTitle>
          <DialogDescription>{formatPrice(plan.priceInCents, plan.currency)}/month</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Plan includes:</h4>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Subscribe for ${formatPrice(plan.priceInCents, plan.currency)}/month`
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You'll be redirected to Stripe to complete your payment
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