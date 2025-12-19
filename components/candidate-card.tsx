// components/candidate-card.tsx
"use client"

import { Mail, MapPin, Briefcase, Star, UserCheck, XCircle, Clock, Award, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

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
}

interface CandidateCardProps {
  candidate: Candidate
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <UserCheck className="w-3 h-3 mr-1" /> Active
        </Badge>
      case 'inactive':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          <Clock className="w-3 h-3 mr-1" /> Inactive
        </Badge>
      case 'placed':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Award className="w-3 h-3 mr-1" /> Placed
        </Badge>
      case 'withdrawn':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
          <XCircle className="w-3 h-3 mr-1" /> Withdrawn
        </Badge>
      default:
        return null
    }
  }

  const getAvailabilityBadge = (availability?: string) => {
    if (!availability) return null
    
    const availabilityMap: Record<string, { label: string, color: string }> = {
      'immediate': { label: 'Immediate', color: 'bg-green-500/10 text-green-500' },
      '2-weeks': { label: '2 Weeks', color: 'bg-blue-500/10 text-blue-500' },
      '1-month': { label: '1 Month', color: 'bg-yellow-500/10 text-yellow-500' },
      '3-months': { label: '3 Months', color: 'bg-orange-500/10 text-orange-500' },
      'not-available': { label: 'Not Available', color: 'bg-red-500/10 text-red-500' },
    }
    
    const info = availabilityMap[availability] || { label: availability, color: 'bg-gray-500/10 text-gray-500' }
    return <Badge className={`text-xs ${info.color}`}>{info.label}</Badge>
  }

  const formatLastContacted = (lastContacted?: string | null) => {
    if (!lastContacted) return null
    try {
      return formatDistanceToNow(new Date(lastContacted), { addSuffix: true })
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
            <img
              src={candidate.avatar || "/placeholder.svg"}
              alt={candidate.name}
              className="w-20 h-20 rounded-full object-cover"
            />
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
            <span className="text-xs text-muted-foreground whitespace-nowrap">Match Score</span>
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
                <span>Contacted {formatLastContacted(candidate.lastContacted)}</span>
              </div>
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
                  +{candidate.skills.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex lg:flex-col gap-2 lg:justify-start">
          <Button asChild className="flex-1 lg:flex-none">
            <Link href={`/dashboard/candidates/${candidate.id}`}>
              View Profile
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 lg:flex-none bg-transparent" asChild>
            <Link href={`mailto:${candidate.email}?subject=Regarding your application`}>
              Contact
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}