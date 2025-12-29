// components/candidate-card.tsx
"use client"

import { Mail, MapPin, Briefcase, Star, UserCheck, XCircle, Clock, Award, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"

interface Candidate {
  id: string
  name: string
  title: string | null
  experience: string
  location: string | null
  skills: string[] | null
  matchScore: number
  avatar: string
  email: string
  status?: 'active' | 'inactive' | 'placed' | 'withdrawn' // Make optional
  availability?: string // Make optional
  lastContacted?: string | null // Make optional
  phone?: string | null
  linkedin_url?: string | null
  portfolio_url?: string | null
  applications?: Array<{
    id: string
    status: string
    applied_at?: string
    updated_at?: string
    jobs?: {
      title: string
    }
  }>
  isHired?: boolean
}

interface CandidateCardProps {
  candidate: Candidate
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const { t, locale } = useI18n()

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    if (candidate.isHired) {
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Award className="w-3 h-3 me-1" /> {t("status.placed")}
        </Badge>
      )
    } else
      switch (status) {
        case 'active':
          return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <UserCheck className="w-3 h-3 me-1" /> {t("status.active")}
          </Badge>
        case 'inactive':
          return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            <Clock className="w-3 h-3 me-1" /> {t("status.inactive")}
          </Badge>
        case 'placed':
          return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Award className="w-3 h-3 me-1" /> {t("status.placed")}
          </Badge>
        case 'withdrawn':
          return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="w-3 h-3 me-1" /> {t("status.withdrawn")}
          </Badge>
        default:
          return null
      }
  }

  const getAvailabilityBadge = (availability?: string) => {
    if (!availability) return null

    const availabilityMap: Record<string, { label: string, color: string }> = {
      'immediate': { label: t("availability.immediate"), color: 'bg-green-500/10 text-green-500' },
      '2-weeks': { label: t("availability.2-weeks"), color: 'bg-blue-500/10 text-blue-500' },
      '1-month': { label: t("availability.1-month"), color: 'bg-yellow-500/10 text-yellow-500' },
      '3-months': { label: t("availability.3-month"), color: 'bg-orange-500/10 text-orange-500' },
      'not-available': { label: t("availability.not-available"), color: 'bg-red-500/10 text-red-500' },
    }

    const info = availabilityMap[availability] || { label: availability, color: 'bg-gray-500/10 text-gray-500' }
    return <Badge className={`text-xs ${info.color}`}>{info.label}</Badge>
  }

  const formatLastContacted = (lastContacted?: string | null) => {
    if (!lastContacted) return null
    try {
      return formatDistanceToNow(new Date(lastContacted), { addSuffix: true, locale: locale === 'ar' ? ar : enUS })
    } catch {
      return null
    }
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avatar and match score */}
        <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-3">
          <Link href={`/dashboard/candidates/${candidate.id}`} className="relative">
            {/* {candidate.avatar ? (
              <img
                src={candidate.avatar || "/placeholder.svg"}
                alt={candidate.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : ( */}
              <div className="w-16 h-16 rounded-full bg-gray-500/10 flex items-center justify-center">
                <span className="text-2xl font-semibold text-primary">
                  {candidate.name.charAt(0).toUpperCase()}
                </span>
              </div>
            {/* )} */}
            <div className="absolute -top-1 -right-1">

              {getStatusBadge(candidate.status)}
            </div>
          </Link>

          <div
            className={cn(
              "flex flex-col items-center justify-center px-4 py-2 rounded-lg",
              candidate.matchScore >= 90 ? "bg-primary/10" :
                candidate.matchScore >= 80 ? "bg-primary/8" : "bg-primary/5"
            )}
          >
            <div className="flex items-center gap-1">
              <Star className={cn(
                "w-4 h-4",
                candidate.matchScore >= 90 ? "text-primary" :
                  candidate.matchScore >= 80 ? "text-primary/80" : "text-primary/60"
              )} />
              <span className={cn(
                "text-2xl font-bold",
                candidate.matchScore >= 90 ? "text-primary" :
                  candidate.matchScore >= 80 ? "text-primary/80" : "text-primary/60"
              )}>
                {candidate.matchScore}
              </span>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t("candidate.match")}</span>
          </div>
        </div>

        {/* Candidate info */}
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/dashboard/candidates/${candidate.id}`}>
                <h3 className="text-xl font-semibold hover:text-primary hover:underline">
                  {candidate.name}
                </h3>
              </Link>
              {getAvailabilityBadge(candidate.availability)}
              {(candidate.status === 'placed' || candidate.isHired) && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <Award className="w-3 h-3 me-1" />
                  {t("status.hired")}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{candidate.title}</p>
          </div>

          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              <span>{candidate.experience}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{candidate.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{candidate.email}</span>
            </div>
            {candidate.lastContacted && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{t("candidate.contacted")} {formatLastContacted(candidate.lastContacted)}</span>
              </div>
            )}

            {candidate.status === 'placed' && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 ml-2">
                <Award className="w-3 h-3 me-1" />
                {t("status.hired")}
              </Badge>
            )}
          </div>

          {/* Skills */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {candidate.skills?.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {candidate.skills && candidate.skills.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.skills.length - 5} {t("candidate.moreSkills")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex lg:flex-col gap-2 lg:justify-start">
          <Button asChild className="flex-1 lg:flex-none">
            <Link href={`/dashboard/candidates/${candidate.id}`}>
              {t("candidate.view")}
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 lg:flex-none bg-transparent" asChild>
            <Link href={`mailto:${candidate.email}?subject=${t("candidate.emailSubject")}`}>
              {t("candidate.contact")}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}