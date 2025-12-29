"use client"

import { ArrowRight, Search, Target, Calendar, TrendingUp, Users, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LanguageToggle } from "@/components/language-toggle"
import { useI18n } from "@/lib/i18n-context"
import Link from "next/link"

interface LandingStats {
  totalJobs: number
  totalCandidates: number
  successRate: number
}

interface LandingPageProps {
  initialStats?: LandingStats
}


export function LandingPage({ initialStats }: LandingPageProps) {
  const { t } = useI18n()

  // Use initial stats if provided, otherwise use defaults
  const stats: LandingStats = initialStats || {
    totalJobs: 10234,
    totalCandidates: 523678,
    successRate: 95 //default value,
  }

  const features = [
    {
      icon: Search,
      title: t("landing.features.search"),
      description: t("landing.features.search.desc"),
    },
    {
      icon: Target,
      title: t("landing.features.match"),
      description: t("landing.features.match.desc"),
    },
    {
      icon: Calendar,
      title: t("landing.features.schedule"),
      description: t("landing.features.schedule.desc"),
    },
  ]

  const statsDisplay = [
    { label: t("landing.stats.jobs"), value: `${stats.totalJobs.toLocaleString()}+`, icon: Building2 },
    { label: t("landing.stats.candidates"), value: `${stats.totalCandidates.toLocaleString()}+`, icon: Users },
    { label: t("landing.stats.success"), value: `${stats.successRate}%`, icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-xl">TalentHub</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("landing.nav.features")}
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("landing.nav.pricing")}
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("landing.nav.about")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">{t("auth.signin")}</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">{t("auth.signup")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span>✨</span>
              <span>{t("landing.free.message")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">{t("landing.title")}</h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">{t("landing.subtitle")} {t("landing.start.free")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base" asChild>
                <Link href="/auth/sign-up">
                  {t("pricing.trial.startBtn")}
                  <ArrowRight className="ms-2 w-5 h-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base bg-transparent" asChild>
                <Link href="#features">{t("landing.cta.secondary")}</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {t("landing.no.credit.cancel")}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20">
            {statsDisplay.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.features.title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("pricing.section.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("pricing.section.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t("pricing.starter")}</CardTitle>
                <CardDescription>{t("pricing.starter.desc")}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t("pricing.starter.price")}</span>
                  <span className="text-muted-foreground">/{t("pricing.month")}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.starter.feature1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.starter.feature2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.starter.feature3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.starter.feature4")}</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/auth/sign-up">{t("pricing.getStarted")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-primary shadow-lg relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                  {t("pricing.popular")}
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{t("pricing.professional")}</CardTitle>
                <CardDescription>{t("pricing.professional.desc")}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t("pricing.professional.price")}</span>
                  <span className="text-muted-foreground">/{t("pricing.month")}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.professional.feature1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.professional.feature2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.professional.feature3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.professional.feature4")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.professional.feature5")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.professional.feature6")}</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/auth/sign-up">{t("pricing.getStarted")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t("pricing.enterprise")}</CardTitle>
                <CardDescription>{t("pricing.enterprise.desc")}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t("pricing.enterprise.price")}</span>
                  <span className="text-muted-foreground">/{t("pricing.month")}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.enterprise.feature1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.enterprise.feature2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.enterprise.feature3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.enterprise.feature4")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.enterprise.feature5")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm">{t("pricing.enterprise.feature6")}</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/auth/sign-up">{t("pricing.getStarted")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("about.section.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("about.section.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t("about.mission.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{t("about.mission.desc")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t("about.vision.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{t("about.vision.desc")}</p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">{t("about.values.title")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{t("about.values.innovation")}</h4>
                  <p className="text-sm text-muted-foreground">{t("about.values.innovation.desc")}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{t("about.values.transparency")}</h4>
                  <p className="text-sm text-muted-foreground">{t("about.values.transparency.desc")}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{t("about.values.equality")}</h4>
                  <p className="text-sm text-muted-foreground">{t("about.values.equality.desc")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("landing.cta.transform")}</h2>
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">{t("landing.cta.join")}</p>
              <Button size="lg" variant="secondary" className="text-base" asChild>
                <Link href="/auth/sign-up">
                  {t("landing.cta.primary")}
                  <ArrowRight className="ms-2 w-5 h-5 rtl:rotate-180" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Search className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">TalentHub</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("landing.footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
