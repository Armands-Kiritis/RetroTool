"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { Plus, Users } from "lucide-react"

interface BoardSelectionProps {
  onBoardSelected: (boardId: string) => void
}

export function BoardSelection({ onBoardSelected }: BoardSelectionProps) {
  const [boardName, setBoardName] = useState("")
  const [joinBoardId, setJoinBoardId] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  const createBoard = async () => {
    if (!boardName.trim() || !user) return

    setLoading(true)
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: boardName,
          createdBy: user.name,
        }),
      })

      if (response.ok) {
        const board = await response.json()
        onBoardSelected(board.id)
      }
    } catch (error) {
      console.error("Failed to create board:", error)
    } finally {
      setLoading(false)
    }
  }

  const joinBoard = async () => {
    if (!joinBoardId.trim() || !user) return

    setLoading(true)
    try {
      // First check if board exists and join it
      const response = await fetch(`/api/boards/${joinBoardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user.name,
        }),
      })

      if (response.ok) {
        onBoardSelected(joinBoardId)
      } else {
        alert("Board not found. Please check the board ID.")
      }
    } catch (error) {
      console.error("Failed to join board:", error)
      alert("Failed to join board. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Hello, {user?.name}!</h1>
          <p className="text-muted-foreground">Create a new retrospective board or join an existing one</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Board
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Board name (e.g., Sprint 23 Retro)"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
              />
              <Button onClick={createBoard} className="w-full" disabled={loading || !boardName.trim()}>
                Create Board
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Join Existing Board
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="Board ID (e.g., abc123xy)"
                value={joinBoardId}
                onChange={(e) => setJoinBoardId(e.target.value.toUpperCase())}
              />
              <Button onClick={joinBoard} className="w-full" disabled={loading || !joinBoardId.trim()}>
                Join Board
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
