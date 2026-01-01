"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageSquare, Phone, Clock, Shield, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { useI18n } from "@/lib/i18n-context"
import { PricingPlan } from "@/lib/products"

interface SupportContactProps {
    subscriptionPlan?: string
}

type PlanType = 'free-trial' | 'starter-monthly' | 'professional-monthly' | 'enterprise-monthly'

export function SupportContact({ subscriptionPlan = 'free-trial' }: SupportContactProps) {
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [category, setCategory] = useState("technical")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const { t } = useI18n()
    const supabase = useSupabase()


    // Type guard function
    const isValidPlan = (plan: string): plan is PlanType => {
        return ['free-trial', 'starter-monthly', 'professional-monthly', 'enterprise-monthly'].includes(plan)
    }

    const getSupportInfo = () => {
        const supportInfo = {
            'free-trial': {
                level: t("support.levels.community"),
                responseTime: t("support.descriptions.freeTrial"),
                email: "support@talenthub.com",
                available: ["email"],
                description: t("support.free.description")
            },
            'starter-monthly': {
                level: t("support.levels.email"),
                responseTime: t("support.response.48h"),
                email: "support@talenthub.com",
                available: ["email"],
                description: t("ssupport.descriptions.starter")
            },
            'professional-monthly': {
                level: t("support.levels.priority"),
                responseTime: t("support.response.24h"),
                email: "support@talenthub.com",
                available: ["email", "chat"],
                description: t("support.descriptions.professional")
            },
            'enterprise-monthly': {
                level: t("support.levels.dedicated"),
                responseTime: t("support.response.4h"),
                email: "enterprise-support@talenthub.com",
                available: ["email", "chat", "phone"],
                description: t("support.descriptions.enterprise")
            }
        }

        const planKey = isValidPlan(subscriptionPlan) ? subscriptionPlan : 'free-trial'
        return supportInfo[planKey]
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            // Store support ticket in database
            const { error } = await supabase
                .from("support_tickets")
                .insert({
                    user_id: user?.id,
                    email: user?.email,
                    subject,
                    message,
                    category,
                    plan: subscriptionPlan,
                    status: "open"
                })

            if (error) throw error

            // Send email notification (you'd need an email service)
            // await sendSupportEmail(user?.email, subject, message)

            setSubmitted(true)
            setSubject("")
            setMessage("")
        } catch (error) {
            console.error("Error submitting support request:", error)
        } finally {
            setSubmitting(false)
        }
    }

    const supportInfo = getSupportInfo()

    return (
        <div className="space-y-6">
            {/* Support Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        {t("support.yourSupport")}
                    </CardTitle>
                    <CardDescription>
                        {supportInfo.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{t("support.level")}</p>
                                    <p className="text-lg font-semibold">{supportInfo.level}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{t("support.responseTime")}</p>
                                    <p className="text-lg font-semibold">{supportInfo.responseTime}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Mail className="w-4 h-4 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{t("support.contactEmail")}</p>
                                    <p className="text-lg font-semibold">{supportInfo.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Available Channels */}
                    <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">{t("support.availableChannels")}</h4>
                        <div className="flex flex-wrap gap-2">
                            {supportInfo.available.includes("email") && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={`mailto:${supportInfo.email}`}>
                                        <Mail className="me-2 h-4 w-4" />
                                        {t("support.email")}
                                    </a>
                                </Button>
                            )}
                            {supportInfo.available.includes("chat") && (
                                <Button variant="outline" size="sm">
                                    <MessageSquare className="me-2 h-4 w-4" />
                                    {t("support.liveChat")}
                                </Button>
                            )}
                            {supportInfo.available.includes("phone") && (
                                <Button variant="outline" size="sm">
                                    <Phone className="me-2 h-4 w-4" />
                                    {t("support.phone")}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("support.contactForm")}</CardTitle>
                    <CardDescription>
                        {t("support.formDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{t("support.thankYou")}</h3>
                            <p className="text-muted-foreground mb-4">
                                {t("support.responseMessage").replace("{time}", supportInfo.responseTime)}
                            </p>
                            <Button onClick={() => setSubmitted(false)}>
                                {t("support.newRequest")}
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">{t("support.category")}</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="technical">{t("support.technical")}</SelectItem>
                                            <SelectItem value="billing">{t("support.billing")}</SelectItem>
                                            <SelectItem value="account">{t("support.account")}</SelectItem>
                                            <SelectItem value="feature">{t("support.feature")}</SelectItem>
                                            <SelectItem value="other">{t("support.other")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">{t("support.subject")}</Label>
                                    <Input
                                        id="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder={t("support.subjectPlaceholder")}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">{t("support.message")}</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={t("support.messagePlaceholder")}
                                    rows={6}
                                    required
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? t("support.sending") : t("support.submit")}
                                </Button>
                                <Button variant="outline" type="button" asChild>
                                    <a href={`mailto:${supportInfo.email}`}>
                                        {t("support.emailDirectly")}
                                    </a>
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}