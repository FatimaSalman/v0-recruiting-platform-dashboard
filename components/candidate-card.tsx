"use client"

import { Mail, MapPin, Briefcase, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  name: string
  title: string
  experience: string
  location: string
  skills: string[]
  matchScore: number
  avatar: string
  email: string
}

interface CandidateCardProps {
  candidate: Candidate
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-primary"
    if (score >= 80) return "text-primary/80"
    return "text-primary/60"
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-primary/10"
    if (score >= 80) return "bg-primary/8"
    return "bg-primary/5"
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avatar and match score */}
        <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-3">
          <img
            src={candidate.avatar || "/placeholder.svg"}
            alt={candidate.name}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div
            className={cn(
              "flex flex-col items-center justify-center px-4 py-2 rounded-lg",
              getScoreBg(candidate.matchScore),
            )}
          >
            <div className="flex items-center gap-1">
              <Star className={cn("w-4 h-4", getScoreColor(candidate.matchScore))} />
              <span className={cn("text-2xl font-bold", getScoreColor(candidate.matchScore))}>
                {candidate.matchScore}
              </span>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">Match Score</span>
          </div>
        </div>

        {/* Candidate info */}
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <h3 className="text-xl font-semibold mb-1">{candidate.name}</h3>
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
          </div>

          {/* Skills */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex lg:flex-col gap-2 lg:justify-start">
          <Button className="flex-1 lg:flex-none">View Profile</Button>
          <Button variant="outline" className="flex-1 lg:flex-none bg-transparent">
            Contact
          </Button>
        </div>
      </div>
    </Card>
  )
}
