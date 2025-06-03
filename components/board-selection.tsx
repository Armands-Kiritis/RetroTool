"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { Plus, Users, Calendar, MessageSquare, Archive, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface BoardSelectionProps {
  onBoardSelected: (boardId: string) => void
}

interface BoardSummary {
  id: string
  name: string
  createdBy: string
  createdAt: number
  participantCount: number
  itemCount: number
  isArchived: boolean
  archivedAt?: number
  archivedBy?: string
}

export function BoardSelection({ onBoardSelected }: BoardSelectionProps) {
  const [boardName, setBoardName] = useState("")
  const [joinBoardId, setJoinBoardId] = useState("")
  const [loading, setLoading] = useState(false)
  const [existingBoards, setExistingBoards] = useState<BoardSummary[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const { user } = useUser()

  const fetchExistingBoards = async () => {
    try {
      const response = await fetch(`/api/boards/list?includeArchived=${showArchived}`)
      if (response.ok) {
        const boards = await response.json()
        setExistingBoards(boards)
      }
    } catch (error) {
      console.error("Failed to fetch boards:", error)
    } finally {
      setLoadingBoards(false)
    }
  }

  useEffect(() => {
    setLoadingBoards(true)
    fetchExistingBoards()
  }, [showArchived])

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

  const joinBoard = async (boardId?: string) => {
    const targetBoardId = boardId || joinBoardId.trim()
    if (!targetBoardId || !user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/boards/${targetBoardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user.name,
        }),
      })

      if (response.ok) {
        onBoardSelected(targetBoardId)
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

  const archiveBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
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
        fetchExistingBoards()
      }
    } catch (error) {
      console.error("Failed to archive board:", error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const activeBoards = existingBoards.filter((board) => !board.isArchived)
  const archivedBoards = existingBoards.filter((board) => board.isArchived)
  const displayBoards = showArchived ? archivedBoards : activeBoards

  return (
    <div className="min-h-screen main-bg">
      {/* Header */}
      <header className="menu-bg">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-menu">Team Retrospective</h1>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-primary-custom mb-2">Hello, {user?.name}!</h2>
          <p className="text-muted-foreground">Create a new retrospective board or join an existing one</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Create New Board */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Plus className="w-5 h-5" />
                Create New Board
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input
                type="text"
                placeholder="Board name (e.g., Sprint 23 Retro)"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className="border-primary/30 focus:border-primary"
              />
              <Button
                onClick={createBoard}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading || !boardName.trim()}
              >
                Create Board
              </Button>
            </CardContent>
          </Card>

          {/* Join by ID */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                Join by Board ID
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input
                type="text"
                placeholder="Board ID (e.g., ABC123XY)"
                value={joinBoardId}
                onChange={(e) => setJoinBoardId(e.target.value.toUpperCase())}
                className="border-primary/30 focus:border-primary"
              />
              <Button
                onClick={() => joinBoard()}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading || !joinBoardId.trim()}
              >
                Join Board
              </Button>
            </CardContent>
          </Card>

          {/* Recent Boards */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary">
                  {showArchived ? <Archive className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  {showArchived ? "Archived Boards" : "Recent Boards"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-primary hover:bg-primary/10"
                >
                  {showArchived ? "Show Active" : "Show Archived"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingBoards ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : displayBoards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {showArchived ? "No archived boards" : "No boards created yet"}
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {displayBoards.slice(0, 10).map((board) => (
                    <Card
                      key={board.id}
                      className={`relative cursor-pointer hover:bg-primary/5 transition-colors border-primary/20 ${
                        board.isArchived ? "opacity-75" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4
                              className="font-medium text-primary-custom truncate flex-1"
                              onClick={() => joinBoard(board.id)}
                            >
                              {board.name}
                            </h4>
                            {!board.isArchived && (
                              <div className="relative z-10">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-primary/10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-50 bg-white">
                                    <DropdownMenuItem
                                      onClick={(e) => archiveBoard(board.id, e)}
                                      className="cursor-pointer"
                                    >
                                      <Archive className="w-4 h-4 mr-2" />
                                      Archive Board
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                          <div
                            className="flex items-center justify-between text-xs text-muted-foreground"
                            onClick={() => joinBoard(board.id)}
                          >
                            <span>by {board.createdBy}</span>
                            <span>
                              {board.isArchived && board.archivedAt
                                ? `Archived ${formatDate(board.archivedAt)}`
                                : formatDate(board.createdAt)}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-4 text-xs text-muted-foreground"
                            onClick={() => joinBoard(board.id)}
                          >
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{board.participantCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{board.itemCount}</span>
                            </div>
                            {board.isArchived && (
                              <div className="flex items-center gap-1">
                                <Archive className="w-3 h-3" />
                                <span>Archived</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
