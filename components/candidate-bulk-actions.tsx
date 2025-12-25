"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSupabase } from "@/lib/supabase/supabase-provider"
import { Check, Tag, Mail, Trash2, UserCheck, UserMinus } from "lucide-react"

interface CandidateBulkActionsProps {
    selectedIds: string[]
    onComplete: () => void
}

export function CandidateBulkActions({ selectedIds, onComplete }: CandidateBulkActionsProps) {
    const [action, setAction] = useState<string>("")
    const [status, setStatus] = useState<string>("")
    const [tag, setTag] = useState("")
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    const supabase = useSupabase()

    const handleBulkAction = async () => {
        if (selectedIds.length === 0) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            switch (action) {
                case "update_status":
                    await supabase
                        .from("candidates")
                        .update({
                            status,
                            updated_at: new Date().toISOString()
                        })
                        .in("id", selectedIds)
                        .eq("user_id", user.id)
                    break

                case "add_tag":
                    // This is more complex - need to append to existing tags array
                    // For simplicity, we'll update a single tag field
                    await supabase
                        .from("candidates")
                        .update({
                            tags: [tag],
                            updated_at: new Date().toISOString()
                        })
                        .in("id", selectedIds)
                        .eq("user_id", user.id)
                    break

                case "delete":
                    await supabase
                        .from("candidates")
                        .delete()
                        .in("id", selectedIds)
                        .eq("user_id", user.id)
                    break
            }

            onComplete()
            setAction("")
            setShowConfirm(false)
        } catch (error) {
            console.error("Error performing bulk action:", error)
        } finally {
            setLoading(false)
        }
    }

    if (selectedIds.length === 0) return null

    return (
        <>
            <div className="flex items-center gap-2 p-4 border-t bg-muted/50">
                <div className="text-sm text-muted-foreground mr-2">
                    {selectedIds.length} selected
                </div>

                <Select value={action} onValueChange={setAction}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Bulk actions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="update_status">Update Status</SelectItem>
                        <SelectItem value="add_tag">Add Tag</SelectItem>
                        <SelectItem value="send_email">Send Email</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                </Select>

                {action === "update_status" && (
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="placed">Placed</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {action === "add_tag" && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="Enter tag"
                            className="px-3 py-2 border rounded-md text-sm"
                        />
                    </div>
                )}

                {action && (
                    <Button
                        size="sm"
                        onClick={() => setShowConfirm(true)}
                        disabled={loading}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Apply
                    </Button>
                )}
            </div>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            {action === "delete" ? (
                                `Are you sure you want to delete ${selectedIds.length} candidate(s)? This action cannot be undone.`
                            ) : (
                                `Apply ${action.replace("_", " ")} to ${selectedIds.length} candidate(s)?`
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkAction}
                            className={
                                action === "delete"
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : ""
                            }
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}