// components/settings-page-content.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/lib/i18n-context"
import { Globe, User, Bell, Shield, Save } from "lucide-react"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Input } from "@/components/ui/input"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TeamManagement } from "./team-management"
import { SupportContact } from "./support-contact"

export function SettingsPageContent() {
    const { locale, setLocale, t } = useI18n()
    const supabase = useSupabase()
    const [loading, setLoading] = useState(false)
    const [saveMessage, setSaveMessage] = useState("")
    const [subscription, setSubscription] = useState<any>(null)
    const [userProfile, setUserProfile] = useState({
        full_name: "",
        company_name: "",
        role: "",
    })

    // Add this state near other useState declarations
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    useEffect(() => {
        fetchUserProfile()
    }, [])

    async function fetchUserProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (profile) {
                setUserProfile({
                    full_name: profile.full_name || "",
                    company_name: profile.company_name || "",
                    role: profile.role || "",
                })
            }
        } catch (error) {
            console.error("Error fetching user profile:", error)
        }
    }

    async function handleSaveProfile() {
        setLoading(true)
        setSaveMessage("")

        try {
            // 1. Get the current authenticated user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")

            // 2. Prepare the data to update
            const updateData = {
                id: user.id, // Required for upsert to know which row to update
                full_name: userProfile.full_name,
                company_name: userProfile.company_name,
                role: userProfile.role,
                updated_at: new Date().toISOString(), // Manually set updated timestamp
            };

            // 3. Use upsert to either insert new or update existing profile
            const { error } = await supabase
                .from("profiles")
                .upsert(updateData, {
                    onConflict: 'id', // Specify the conflict target
                })

            if (error) throw error

            setSaveMessage(t("settings.saveSuccess"))
        } catch (error) {
            console.error("Error saving profile:", error)
            setSaveMessage(t("settings.saveError"))
        } finally {
            setLoading(false)
            setTimeout(() => setSaveMessage(""), 3000)
        }
    }

    async function handleLanguageChange(newLocale: string) {
        setLocale(newLocale as "en" | "ar")
        // You could save the language preference to the database here
        // For now, it's saved in localStorage via the I18nContext
    }

    // Add this function for deleting account
    async function handleDeleteAccount() {
        setDeleting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")

            // Option 1: Using Supabase auth API (this will trigger cascade delete if set up)
            const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

            if (authError) {
                console.error("Auth admin error:", authError)
                // If admin API fails, try to delete manually
                await deleteUserDataManually(user.id)
                await supabase.auth.signOut()
            }

            // Redirect to home page after deletion
            window.location.href = "/"

        } catch (error) {
            console.error("Error deleting account:", error)
            alert(t("settings.account.deleteErrorAlert"))
        } finally {
            setDeleting(false)
            setDeleteDialogOpen(false)
        }
    }

    // Manual deletion function
    async function deleteUserDataManually(userId: string) {
        try {
            // Delete all user data from all tables
            const tables = ['profiles', 'jobs', 'candidates', 'applications', 'interviews', 'subscriptions']

            for (const table of tables) {
                const { error } = await supabase
                    .from(table)
                    .delete()
                    .eq('user_id', userId)

                if (error && !error.message.includes('does not exist')) {
                    console.error(`Error deleting from ${table}:`, error)
                }
            }

            // Sign out the user
            await supabase.auth.signOut()

        } catch (error) {
            console.error("Error in manual deletion:", error)
            throw error
        }
    }

    return (
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{t("settings.title")}</h1>
                <p className="text-muted-foreground">{t("settings.subtitle")}</p>
            </div>

            <div className="space-y-6">
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            <CardTitle>{t("settings.profile.title")}</CardTitle>
                        </div>
                        <CardDescription>{t("settings.profile.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                                <Input
                                    id="fullName"
                                    value={userProfile.full_name}
                                    onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                                    placeholder={t("auth.fullNamePlaceholder")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company">{t("settings.company")}</Label>
                                <Input
                                    id="company"
                                    value={userProfile.company_name}
                                    onChange={(e) => setUserProfile({ ...userProfile, company_name: e.target.value })}
                                    placeholder={t("settings.companyPlaceholder")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">{t("settings.role")}</Label>
                            <Input
                                id="role"
                                value={userProfile.role}
                                onChange={(e) => setUserProfile({ ...userProfile, role: e.target.value })}
                                placeholder={t("settings.rolePlaceholder")}
                            />
                        </div>

                        {saveMessage && (
                            <div className={`p-3 rounded-lg text-sm ${saveMessage.includes("Error") ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}>
                                {saveMessage}
                            </div>
                        )}

                        <Button onClick={handleSaveProfile} disabled={loading}>
                            <Save className="me-2 h-4 w-4" />
                            {loading ? t("settings.saving") : t("settings.save")}
                        </Button>
                    </CardContent>
                </Card>

                {/* Team Settings */}
                <Card>
                    <CardContent className="space-y-4">
                        <TeamManagement />
                    </CardContent>
                </Card>

                {/* Support Contact Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("settings.support.title")}</CardTitle>
                        <CardDescription>
                            {t("settings.support.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SupportContact subscriptionPlan={subscription?.plan_id || 'free-trial'} />
                    </CardContent>
                </Card>

                {/* Language Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            <CardTitle>{t("settings.language.title")}</CardTitle>
                        </div>
                        <CardDescription>{t("settings.language.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">{t("settings.language.select")}</Label>
                            <Select value={locale} onValueChange={handleLanguageChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("settings.language.select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {t("settings.language.note")}
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            <CardTitle>{t("settings.notifications.title")}</CardTitle>
                        </div>
                        <CardDescription>{t("settings.notifications.description")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">{t("settings.notifications.email")}</Label>
                                    <p className="text-sm text-muted-foreground">{t("settings.notifications.emailDesc")}</p>
                                </div>
                                <Button variant="outline" size="sm" className="bg-transparent">
                                    {t("settings.configure")}
                                </Button>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">{t("settings.notifications.application")}</Label>
                                    <p className="text-sm text-muted-foreground">{t("settings.notifications.applicationDesc")}</p>
                                </div>
                                <Button variant="outline" size="sm" className="bg-transparent">
                                    {t("settings.configure")}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            <CardTitle>{t("settings.account.title")}</CardTitle>
                        </div>
                        <CardDescription>{t("settings.account.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-base text-destructive">{t("settings.account.delete")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.account.deleteWarning")}</p>

                            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        {deleting ? t("settings.account.deleting") : t("settings.account.deleteButton")}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t("settings.account.confirmTitle")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t("settings.account.confirmDescription")}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t("settings.account.cancel")}</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={deleting}
                                        >
                                            {deleting ? t("settings.account.deleting") : t("settings.account.confirmDelete")}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}