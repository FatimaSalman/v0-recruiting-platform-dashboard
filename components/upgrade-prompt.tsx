// components/upgrade-prompt.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Lock, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n-context"

interface UpgradePromptProps {
    featureName?: string
    requiredPlan?: 'basic' | 'premium' | 'enterprise'
}

export function UpgradePrompt({
    featureName = "Advanced Analytics & Reports",
    requiredPlan = "basic"
}: UpgradePromptProps) {
    const { t } = useI18n()

    const planFeatures = {
        basic: [
            "Basic analytics dashboard",
            "Monthly hiring metrics",
            "Candidate pipeline tracking",
            "Export to CSV",
            "5 report templates"
        ],
        premium: [
            "All Basic features",
            "Advanced analytics",
            "Real-time reporting",
            "Custom report builder",
            "Predictive hiring insights",
            "Team collaboration"
        ],
        enterprise: [
            "All Premium features",
            "Unlimited data retention",
            "API access",
            "White-label reports",
            "Dedicated support",
            "SLA guarantees"
        ]
    }

    const features = planFeatures[requiredPlan]

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card className="border-primary/20">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">
                        <Lock className="inline w-5 h-5 me-2 text-muted-foreground" />
                        {featureName} {t("subscription.locked")}
                    </CardTitle>
                    <CardDescription className="text-lg">
                        {t("subscription.upgradeRequired")} {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} {t("subscription.plan")}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                {t("subscription.includedInPlan")} {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}:
                            </h3>
                            <ul className="space-y-3">
                                {features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-6">
                            <h4 className="font-semibold mb-4">{t("subscription.choosePlan")}</h4>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-semibold">{t("pricing.basic")}</h5>
                                        <span className="text-lg font-bold text-primary">$29/month</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {t("pricing.basicDesc")}
                                    </p>
                                    <Button asChild className="w-full">
                                        <Link href="/dashboard/pricing?plan=basic">
                                            {t("pricing.choosePlan")} <ArrowRight className="ms-2 w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>

                                <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-semibold">{t("pricing.premium")}</h5>
                                        <span className="text-lg font-bold text-primary">$79/month</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {t("pricing.premiumDesc")}
                                    </p>
                                    <Button asChild className="w-full">
                                        <Link href="/dashboard/pricing?plan=premium">
                                            {t("pricing.choosePlan")} <ArrowRight className="ms-2 w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                            {t("subscription.currentlyOnTrial")}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button variant="outline" asChild>
                                <Link href="/dashboard">
                                    {t("common.backToDashboard")}
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/dashboard/pricing">
                                    {t("pricing.viewAllPlans")}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}