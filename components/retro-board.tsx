"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Plus, Copy, Users } from "lucide-react"
import type { RetroItem, RetroBoard as RetroBoardType } from "@/lib/redis"

interface RetroBoardProps {
  boardId: string
  onLeaveBoard: () => void
}

export function RetroBoard({ boardId, onLeaveBoard }: RetroBoardProps) {
  const { user } = useUser()
  const [board, setBoard] = useState<RetroBoardType | null>(null)
  const [items, setItems] = useState<RetroItem[]>([])
  const [newItems, setNewItems] = useState({
    glad: "",
    mad: "",
    sad: "",
  })
  const [loading, setLoading] = useState(false)

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}`)
      if (response.ok) {
        const boardData = await response.json()
        setBoard(boardData)
        setItems(boardData.items || [])
      }
    } catch (error) {
      console.error("Failed to fetch board:", error)
    }
  }

  useEffect(() => {
    fetchBoard()
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchBoard, 3000)
    return () => clearInterval(interval)
  }, [boardId])

  const addItem = async (category: "glad" | "mad" | "sad") => {
    if (!newItems[category].trim() || !user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/boards/${boardId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newItems[category],
          category,
          authorName: user.name,
        }),
      })

      if (response.ok) {
        setNewItems({ ...newItems, [category]: "" })
        fetchBoard()
      }
    } catch (error) {
      console.error("Failed to add item:", error)
    } finally {
      setLoading(false)
    }
  }

  const revealItem = async (itemId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/boards/${boardId}/items/${itemId}/reveal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.name,
        }),
      })

      if (response.ok) {
        fetchBoard()
      }
    } catch (error) {
      console.error("Failed to reveal item:", error)
    }
  }

  const copyBoardLink = () => {
    const url = `${window.location.origin}?board=${boardId}`
    navigator.clipboard.writeText(url)
    alert("Board link copied to clipboard!")
  }

  const getItemsByCategory = (category: "glad" | "mad" | "sad") => {
    return items.filter((item) => item.category === category)
  }

  const getCategoryColor = (category: "glad" | "mad" | "sad") => {
    switch (category) {
      case "glad":
        return "bg-green-50 border-green-200"
      case "mad":
        return "bg-red-50 border-red-200"
      case "sad":
        return "bg-blue-50 border-blue-200"
    }
  }

  const getCategoryTitle = (category: "glad" | "mad" | "sad") => {
    switch (category) {
      case "glad":
        return "😊 Glad"
      case "mad":
        return "😠 Mad"
      case "sad":
        return "😢 Sad"
    }
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{board.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Board ID: {boardId}</span>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{board.participants.length} participants</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyBoardLink}>
                <Copy className="w-4 h-4 mr-2" />
                Share Link
              </Button>
              <Button variant="ghost" size="sm" onClick={onLeaveBoard}>
                Leave Board
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {(["glad", "mad", "sad"] as const).map((category) => (
            <Card key={category} className={getCategoryColor(category)}>
              <CardHeader>
                <CardTitle className="text-xl">{getCategoryTitle(category)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new item */}
                <div className="space-y-2">
                  <Textarea
                    placeholder={`What made you ${category}?`}
                    value={newItems[category]}
                    onChange={(e) => setNewItems({ ...newItems, [category]: e.target.value })}
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={() => addItem(category)}
                    disabled={loading || !newItems[category].trim()}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {/* Existing items */}
                <div className="space-y-3">
                  {getItemsByCategory(category).map((item) => (
                    <Card key={item.id} className="bg-white/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {item.isRevealed || item.authorName === user?.name ? (
                              <div>
                                <p className="text-sm">{item.content}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">by {item.authorName}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                                <span className="text-sm text-muted-foreground">
                                  Hidden item from {item.authorName}
                                </span>
                              </div>
                            )}
                          </div>

                          {item.authorName === user?.name && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revealItem(item.id)}
                              disabled={item.isRevealed}
                              className="shrink-0"
                            >
                              {item.isRevealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>

                        {item.isRevealed && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Revealed
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
