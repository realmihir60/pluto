"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react"

interface FeedbackButtonsProps {
    triageEventId?: string
    onFeedbackSubmitted?: () => void
}

export function FeedbackButtons({ triageEventId, onFeedbackSubmitted }: FeedbackButtonsProps) {
    const [rating, setRating] = useState<"helpful" | "not_helpful" | null>(null)
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (selectedRating: "helpful" | "not_helpful") => {
        if (!triageEventId) {
            console.warn("No triage event ID provided")
            return
        }

        setRating(selectedRating)
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    triage_event_id: triageEventId,
                    rating: selectedRating,
                    comment: comment
                })
            })

            if (response.ok) {
                setIsSubmitted(true)
                onFeedbackSubmitted?.()
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Thank you for your feedback!
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4 p-6 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl">
            <p className="text-sm font-medium text-foreground">Was this triage helpful?</p>

            <div className="flex gap-3">
                <Button
                    onClick={() => handleSubmit("helpful")}
                    disabled={isSubmitting}
                    variant={rating === "helpful" ? "default" : "outline"}
                    className="flex-1"
                >
                    <ThumbsUp className="size-4 mr-2" />
                    {rating === "helpful" ? "Thanks!" : "Yes"}
                </Button>
                <Button
                    onClick={() => handleSubmit("not_helpful")}
                    disabled={isSubmitting}
                    variant={rating === "not_helpful" ? "default" : "outline"}
                    className="flex-1"
                >
                    <ThumbsDown className="size-4 mr-2" />
                    {rating === "not_helpful" ? "Noted" : "No"}
                </Button>
            </div>

            {rating === "not_helpful" && !isSubmitted && (
                <Textarea
                    placeholder="How can we improve? (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="resize-none bg-white/60 dark:bg-black/40"
                    rows={3}
                />
            )}

            <p className="text-xs text-muted-foreground">
                Your feedback helps us improve the triage system
            </p>
        </div>
    )
}
