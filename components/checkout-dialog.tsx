"use client"

import { useCallback } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { startCheckoutSession } from "@/app/actions/stripe"
import { PRICING_PLANS, formatPrice } from "@/lib/products"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutDialogProps {
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutDialog({ planId, open, onOpenChange }: CheckoutDialogProps) {
  const plan = PRICING_PLANS.find((p) => p.id === planId)
  const startCheckoutSessionForPlan = useCallback(() => startCheckoutSession(planId), [planId])

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscribe to {plan.name}</DialogTitle>
          <DialogDescription>{formatPrice(plan.priceInCents, plan.currency)}/month</DialogDescription>
        </DialogHeader>

        <div id="checkout">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret: startCheckoutSessionForPlan }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </DialogContent>
    </Dialog>
  )
}
