// components/contact-candidate-dialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, Linkedin, MessageSquare, Copy, Check, Calendar } from "lucide-react"

interface ContactCandidateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    candidate: {
        id: string
        name: string
        email: string
        phone?: string
        linkedin_url?: string
    }
}

export function ContactCandidateDialog({ open, onOpenChange, candidate }: ContactCandidateDialogProps) {
    const [method, setMethod] = useState<'email' | 'phone' | 'linkedin' | 'template'>('email')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [copied, setCopied] = useState(false)

    const emailTemplates = [
        { id: 'initial', name: 'Initial Contact', template: `Hi ${candidate.name},\n\nI came across your profile and was impressed with your experience. Would you be open to discussing potential opportunities?\n\nBest regards,\n[Your Name]` },
        { id: 'interview', name: 'Interview Invitation', template: `Hi ${candidate.name},\n\nWe'd like to invite you for an interview for the [Position] role. Are you available for a call on [Date] at [Time]?\n\nBest regards,\n[Your Name]` },
        { id: 'followup', name: 'Follow-up', template: `Hi ${candidate.name},\n\nJust following up on our previous conversation. Let me know if you have any questions.\n\nBest regards,\n[Your Name]` },
    ]

    const handleContact = () => {
        switch (method) {
            case 'email':
                const emailBody = encodeURIComponent(message)
                window.location.href = `mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${emailBody}`
                break
            case 'phone':
                if (candidate.phone) {
                    window.location.href = `tel:${candidate.phone}`
                }
                break
            case 'linkedin':
                if (candidate.linkedin_url) {
                    window.open(candidate.linkedin_url, '_blank')
                }
                break
        }
        onOpenChange(false)
    }

    const copyContactInfo = (info: string) => {
        navigator.clipboard.writeText(info)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Contact {candidate.name}</DialogTitle>
                    <DialogDescription>
                        Choose how you'd like to contact this candidate
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Contact Method Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                            variant={method === 'email' ? 'default' : 'outline'}
                            onClick={() => setMethod('email')}
                            className="h-auto py-4 flex flex-col gap-2"
                        >
                            <Mail className="h-6 w-6" />
                            <span>Email</span>
                        </Button>

                        {candidate.phone && (
                            <Button
                                variant={method === 'phone' ? 'default' : 'outline'}
                                onClick={() => setMethod('phone')}
                                className="h-auto py-4 flex flex-col gap-2"
                            >
                                <Phone className="h-6 w-6" />
                                <span>Phone</span>
                            </Button>
                        )}

                        {candidate.linkedin_url && (
                            <Button
                                variant={method === 'linkedin' ? 'default' : 'outline'}
                                onClick={() => setMethod('linkedin')}
                                className="h-auto py-4 flex flex-col gap-2"
                            >
                                <Linkedin className="h-6 w-6" />
                                <span>LinkedIn</span>
                            </Button>
                        )}

                        <Button
                            variant={method === 'template' ? 'default' : 'outline'}
                            onClick={() => setMethod('template')}
                            className="h-auto py-4 flex flex-col gap-2"
                        >
                            <MessageSquare className="h-6 w-6" />
                            <span>Template</span>
                        </Button>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="flex items-center gap-2">
                                <Input value={candidate.email} readOnly />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => copyContactInfo(candidate.email)}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {candidate.phone && (
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={candidate.phone} readOnly />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => copyContactInfo(candidate.phone!)}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Email/Template Content */}
                    {(method === 'email' || method === 'template') && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="Email subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="message">Message</Label>
                                    {method === 'template' && (
                                        <Select onValueChange={(value) => {
                                            const template = emailTemplates.find(t => t.id === value)
                                            if (template) {
                                                setMessage(template.template)
                                            }
                                        }}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="Select template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {emailTemplates.map((template) => (
                                                    <SelectItem key={template.id} value={template.id}>
                                                        {template.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <Textarea
                                    id="message"
                                    rows={8}
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleContact}>
                            {method === 'email' && <Mail className="mr-2 h-4 w-4" />}
                            {method === 'phone' && <Phone className="mr-2 h-4 w-4" />}
                            {method === 'linkedin' && <Linkedin className="mr-2 h-4 w-4" />}
                            {method === 'template' && <MessageSquare className="mr-2 h-4 w-4" />}
                            {method === 'email' && 'Send Email'}
                            {method === 'phone' && 'Make Call'}
                            {method === 'linkedin' && 'Open LinkedIn'}
                            {method === 'template' && 'Send Email'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}