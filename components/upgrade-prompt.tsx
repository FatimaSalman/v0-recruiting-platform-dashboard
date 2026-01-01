"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertCircle,
    CheckCircle,
    Crown,
    Zap,
    Star,
    X,
    Brain,
    Download,
    BarChart3,
    LineChart
} from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n-context"

interface UpgradePromptProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    requiredFeature: string
    currentPlan: string
}

export function UpgradePrompt({
    open,
    onOpenChange,
    requiredFeature,
    currentPlan
}: UpgradePromptProps) {
    const { t } = useI18n()

    const getFeatureInfo = () => {
        const features = {
            advanced_reports: {
                title: t("upgrade.features.advancedReports.title"),
                description: t("upgrade.features.advancedReports.description"),
                icon: BarChart3,
                availableIn: ["professional", "enterprise"],
                recommendedPlan: "professional-monthly"
            },
            predictive_analytics: {
                title: t("upgrade.features.predictiveAnalytics.title"),
                description: t("upgrade.features.predictiveAnalytics.description"),
                icon: Brain,
                availableIn: ["enterprise"],
                recommendedPlan: "enterprise-monthly"
            },
            data_export: {
                title: t("upgrade.features.dataExport.title"),
                description: t("upgrade.features.dataExport.description"),
                icon: Download,
                availableIn: ["professional", "enterprise"],
                recommendedPlan: "professional-monthly"
            },
            trend_analysis: {
                title: t("upgrade.features.trendAnalysis.title"),
                description: t("upgrade.features.trendAnalysis.description"),
                icon: LineChart,
                availableIn: ["professional", "enterprise"],
                recommendedPlan: "professional-monthly"
            }
        }

        return features[requiredFeature as keyof typeof features] || features.advanced_reports
    }

    const featureInfo = getFeatureInfo()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        {t("upgrade.title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("upgrade.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Feature Info */}
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/10 rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <featureInfo.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold mb-1">{featureInfo.title}</h4>
                            <p className="text-sm text-muted-foreground">{featureInfo.description}</p>
                            <div className="flex items-center gap-2 mt-3">
                                {featureInfo.availableIn.map(plan => (
                                    <Badge key={plan} variant="outline" className="text-xs">
                                        {plan === "enterprise" ? (
                                            <Crown className="w-3 h-3 me-1" />
                                        ) : (
                                            <Zap className="w-3 h-3 me-1" />
                                        )}
                                        {t(`plans.${plan}`)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">{t("upgrade.benefitsTitle")}</h4>
                        <ul className="space-y-2">
                            {[
                                t("upgrade.benefits.realTimeData"),
                                t("upgrade.benefits.customReports"),
                                t("upgrade.benefits.exportOptions"),
                                t("upgrade.benefits.predictiveInsights"),
                                t("upgrade.benefits.teamCollaboration")
                            ].map((benefit, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            {t("common.later")}
                        </Button>
                        <Button className="flex-1" asChild>
                            <Link href={`/dashboard/pricing?feature=${requiredFeature}&recommended=${featureInfo.recommendedPlan}`}>
                                <Crown className="me-2 h-4 w-4" />
                                {t("upgrade.viewPlans")}
                            </Link>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}