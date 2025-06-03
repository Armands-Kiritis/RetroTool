"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  EyeOff,
  Plus,
  Copy,
  Users,
  ArrowLeft,
  Archive,
  ArchiveRestore,
  AlertCircle,
  MoreVertical,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
    const interval = setInterval(fetchBoard, 3000)
    return () => clearInterval(interval)
  }, [boardId])

  const addItem = async (category: "glad" | "mad" | "sad") => {
    if (!newItems[category].trim() || !user || board?.isArchived) return

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
    if (!user || board?.isArchived) return

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

  const archiveBoard = async () => {
    if (!user) return

    const confirmed = window.confirm(
      "Are you sure you want to archive this board? It will become read-only and move to the archived section.",
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/boards/${boardId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          userName: user.name,
        }),
      })

      if (response.ok) {
        fetchBoard()
      }
    } catch (error) {
      console.error("Failed to archive board:", error)
    }
  }

  const unarchiveBoard = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/boards/${boardId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unarchive",
          userName: user.name,
        }),
      })

      if (response.ok) {
        fetchBoard()
      }
    } catch (error) {
      console.error("Failed to unarchive board:", error)
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
    const baseColors = {
      glad: "bg-green-50 border-green-300",
      mad: "bg-red-50 border-red-300",
      sad: "bg-blue-50 border-blue-300",
    }

    if (board?.isArchived) {
      return `${baseColors[category]} opacity-60`
    }

    return baseColors[category]
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
      <div className="flex items-center justify-center min-h-screen main-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isCreator = board.createdBy === user?.name

  return (
    <div className="min-h-screen main-bg">
      <header className="menu-bg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onLeaveBoard} className="text-menu hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-menu">{board.name}</h1>
                  {board.isArchived && (
                    <Badge variant="secondary" className="bg-white/20 text-menu">
                      <Archive className="w-3 h-3 mr-1" />
                      Archived
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-menu/80">
                  <span>Board ID: {boardId}</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{board.participants.length} participants</span>
                  </div>
                  {isCreator && (
                    <Badge variant="secondary" className="bg-white/10 text-menu text-xs">
                      Creator
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {board.isArchived && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={unarchiveBoard}
                  className="bg-white/10 border-white/20 text-menu hover:bg-white/20"
                >
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Unarchive
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={copyBoardLink}
                className="bg-white/10 border-white/20 text-menu hover:bg-white/20"
              >
                <Copy className="w-4 h-4 mr-2" />
                Share Link
              </Button>

              {/* Board Actions Menu - Available to all users for non-archived boards */}
              {!board.isArchived && (
                <div className="relative z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-menu hover:bg-white/20"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50">
                      <DropdownMenuItem onClick={archiveBoard} className="cursor-pointer">
                        <Archive className="w-4 h-4 mr-2" />
                        Archive Board
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {board.isArchived && (
        <div className="container mx-auto px-6 pt-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">This board is archived</p>
                  <p className="text-sm">
                    Archived on {new Date(board.archivedAt!).toLocaleDateString()} by {board.archivedBy}. You can view
                    the content but cannot make changes. Any team member can unarchive this board using the button
                    above.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {(["glad", "mad", "sad"] as const).map((category) => (
            <Card key={category} className={`${getCategoryColor(category)} border-2`}>
              <CardHeader>
                <CardTitle className="text-xl text-primary">{getCategoryTitle(category)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new item - disabled if archived */}
                {!board.isArchived && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={`What made you ${category}?`}
                      value={newItems[category]}
                      onChange={(e) => setNewItems({ ...newItems, [category]: e.target.value })}
                      className="min-h-[80px] border-primary/30 focus:border-primary"
                    />
                    <Button
                      onClick={() => addItem(category)}
                      disabled={loading || !newItems[category].trim()}
                      className="w-full bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                )}

                {/* Existing items */}
                <div className="space-y-3">
                  {getItemsByCategory(category).map((item) => (
                    <Card key={item.id} className="bg-white/70 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {item.isRevealed || item.authorName === user?.name ? (
                              <div>
                                <p className="text-sm text-primary-custom">{item.content}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">by {item.authorName}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-primary/30 rounded-full animate-pulse" />
                                <span className="text-sm text-muted-foreground">
                                  Hidden item from {item.authorName}
                                </span>
                              </div>
                            )}
                          </div>

                          {item.authorName === user?.name && !board.isArchived && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revealItem(item.id)}
                              disabled={item.isRevealed}
                              className="shrink-0 hover:bg-primary/10"
                            >
                              {item.isRevealed ? (
                                <Eye className="w-4 h-4 text-primary" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-primary" />
                              )}
                            </Button>
                          )}
                        </div>

                        {item.isRevealed && (
                          <Badge variant="secondary" className="mt-2 text-xs bg-primary/10 text-primary">
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
