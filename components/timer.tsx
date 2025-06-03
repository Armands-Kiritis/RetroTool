"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Play, Square } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface TimerProps {
  boardId: string
  timer?: {
    startTime: number
    durationMinutes: number
    isActive: boolean
  }
  isArchived: boolean
}

export function Timer({ boardId, timer, isArchived }: TimerProps) {
  const [minutes, setMinutes] = useState(10)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const alertShownRef = useRef<string | null>(null) // Track which timer session has shown the alert

  // Calculate time left when timer prop changes
  useEffect(() => {
    if (timer && timer.isActive) {
      const endTime = timer.startTime + timer.durationMinutes * 60 * 1000
      const remaining = Math.max(0, endTime - Date.now())
      setTimeLeft(remaining)

      // Reset alert tracking for new timer sessions
      const timerKey = `${timer.startTime}-${timer.durationMinutes}`
      if (alertShownRef.current !== timerKey) {
        alertShownRef.current = null
      }
    } else {
      setTimeLeft(null)
    }
  }, [timer])

  // Update countdown every second
  useEffect(() => {
    if (timeLeft === null) return

    const interval = setInterval(() => {
      if (timer && timer.isActive) {
        const endTime = timer.startTime + timer.durationMinutes * 60 * 1000
        const remaining = Math.max(0, endTime - Date.now())
        setTimeLeft(remaining)

        // Show end dialog when timer reaches 0, but only once per timer session
        if (remaining === 0) {
          const timerKey = `${timer.startTime}-${timer.durationMinutes}`
          if (alertShownRef.current !== timerKey) {
            setShowEndDialog(true)
            alertShownRef.current = timerKey
          }
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, timer])

  const startTimer = async () => {
    try {
      await fetch(`/api/boards/${boardId}/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes: minutes,
          action: "start",
        }),
      })
      setDialogOpen(false)
      // Reset alert tracking when starting a new timer
      alertShownRef.current = null
    } catch (error) {
      console.error("Failed to start timer:", error)
    }
  }

  const stopTimer = async () => {
    try {
      await fetch(`/api/boards/${boardId}/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stop",
        }),
      })
      // Reset alert tracking when stopping timer
      alertShownRef.current = null
    } catch (error) {
      console.error("Failed to stop timer:", error)
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // If timer is active, show countdown
  if (timer && timer.isActive && timeLeft !== null) {
    return (
      <>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-md">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-mono font-medium text-primary">{formatTime(timeLeft)}</span>
          {!isArchived && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stopTimer}
              className="h-6 w-6 p-0 rounded-full hover:bg-primary/20"
            >
              <Square className="w-3 h-3 text-primary" />
            </Button>
          )}
        </div>

        {/* Timer ended dialog */}
        <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-center text-primary">Time's Up!</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="text-center py-4">
              <p className="mb-4 text-primary-custom">The time for adding items to the board has ended.</p>
              <p className="text-muted-foreground">You can now proceed with discussing the items.</p>
            </div>
            <div className="flex justify-center pt-4">
              <Button onClick={() => setShowEndDialog(false)} className="bg-primary hover:bg-primary/90">
                OK
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // If no active timer and board is not archived, show start timer button
  if (!isArchived) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 hover:bg-primary/10">
            <Clock className="w-4 h-4 mr-2" />
            Set Timer
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-primary">Set Timer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Set a timer for team members to add items to the board. When the timer ends, everyone will be notified.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label htmlFor="minutes" className="text-sm font-medium text-primary-custom">
                  Minutes
                </label>
                <Input
                  id="minutes"
                  type="number"
                  min="1"
                  max="60"
                  value={minutes}
                  onChange={(e) => setMinutes(Number.parseInt(e.target.value) || 10)}
                  className="mt-1 border-primary/30 focus:border-primary"
                />
              </div>
              <Button onClick={startTimer} className="bg-primary hover:bg-primary/90 mt-6">
                <Play className="w-4 h-4 mr-2" />
                Start Timer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // If board is archived and no active timer, show nothing
  return null
}
