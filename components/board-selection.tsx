"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { Plus, Users, Calendar, MessageSquare, Archive, MoreVertical, LogOut, User, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "./language-switcher"

interface BoardSelectionProps {
  onBoardSelected: (boardId: string) => void
}

interface BoardSummary {
  id: string
  name: string
  createdBy: string
  createdByUserId?: string
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
  const [displayedBoards, setDisplayedBoards] = useState<BoardSummary[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showMyBoards, setShowMyBoards] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const { user, clearUser } = useUser()
  const { t } = useLanguage()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const BOARDS_PER_PAGE = 10

  const fetchExistingBoards = async () => {
    try {
      const params = new URLSearchParams({
        includeArchived: showArchived.toString(),
      })

      if (showMyBoards && user?.id) {
        params.append("userId", user.id)
      }

      const response = await fetch(`/api/boards/list?${params}`)
      if (response.ok) {
        const boards = await response.json()
        setExistingBoards(boards)
        // Reset displayed boards and show first page
        const initialBoards = boards.slice(0, BOARDS_PER_PAGE)
        setDisplayedBoards(initialBoards)
        setHasMore(boards.length > BOARDS_PER_PAGE)
      }
    } catch (error) {
      console.error("Failed to fetch boards:", error)
    } finally {
      setLoadingBoards(false)
    }
  }

  const loadMoreBoards = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentLength = displayedBoards.length
      const nextBoards = existingBoards.slice(currentLength, currentLength + BOARDS_PER_PAGE)

      if (nextBoards.length > 0) {
        setDisplayedBoards((prev) => [...prev, ...nextBoards])
        setHasMore(currentLength + nextBoards.length < existingBoards.length)
      } else {
        setHasMore(false)
      }

      setLoadingMore(false)
    }, 300)
  }, [displayedBoards.length, existingBoards, loadingMore, hasMore])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreBoards()
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loadMoreBoards])

  useEffect(() => {
    setLoadingBoards(true)
    fetchExistingBoards()
  }, [showArchived, showMyBoards, user?.id])

  const createBoard = async () => {
    if (!boardName.trim() || !user) return

    setLoading(true)
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: boardName,
          createdBy: user.username,
          createdByUserId: user.id,
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
          userName: user.username,
        }),
      })

      if (response.ok) {
        onBoardSelected(targetBoardId)
      } else {
        alert(t("common.boardNotFound"))
      }
    } catch (error) {
      console.error("Failed to join board:", error)
      alert(t("common.joinFailed"))
    } finally {
      setLoading(false)
    }
  }

  const archiveBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return

    const confirmed = window.confirm(t("common.archiveConfirm"))

    if (!confirmed) return

    try {
      const response = await fetch(`/api/boards/${boardId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          userName: user.username,
        }),
      })

      if (response.ok) {
        fetchExistingBoards()
      }
    } catch (error) {
      console.error("Failed to archive board:", error)
    }
  }

  const deleteBoard = async (boardId: string, boardName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return

    const confirmed = window.confirm(t("common.deleteConfirm", { boardName }))

    if (!confirmed) return

    try {
      const response = await fetch(`/api/boards/${boardId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user.username,
        }),
      })

      if (response.ok) {
        fetchExistingBoards()
        alert(t("common.deleteSuccess"))
      } else {
        const error = await response.json()
        alert(error.error || t("common.deleteFailed"))
      }
    } catch (error) {
      console.error("Failed to delete board:", error)
      alert(t("common.deleteFailed"))
    }
  }

  const handleLogout = () => {
    clearUser()
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
  const totalBoards = showArchived ? archivedBoards : activeBoards

  const getBoardsTitle = () => {
    if (showMyBoards) {
      return showArchived ? t("boardSelection.archivedBoards") : t("boardSelection.myBoards")
    }
    return showArchived ? t("boardSelection.archivedBoards") : t("boardSelection.recentBoards")
  }

  const getEmptyMessage = () => {
    if (showMyBoards) {
      return showArchived ? t("boardSelection.noArchivedBoards") : t("boardSelection.noMyBoards")
    }
    return showArchived ? t("boardSelection.noArchivedBoards") : t("boardSelection.noBoardsCreated")
  }

  return (
    <div className="min-h-screen main-bg">
      {/* Header */}
      <header className="menu-bg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-menu">{t("retroBoard.teamRetrospective")}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-menu hover:bg-white/20">
                  <User className="w-4 h-4 mr-2" />
                  {user?.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-white">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-primary-custom mb-2">
            {t("boardSelection.hello", { name: user?.username || "" })}
          </h2>
          <p className="text-muted-foreground">{t("boardSelection.createOrJoin")}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Create New Board */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Plus className="w-5 h-5" />
                {t("boardSelection.createNew")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input
                type="text"
                placeholder={t("boardSelection.boardName")}
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className="border-primary/30 focus:border-primary"
              />
              <Button
                onClick={createBoard}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading || !boardName.trim()}
              >
                {t("boardSelection.createBoard")}
              </Button>
            </CardContent>
          </Card>

          {/* Join by ID */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                {t("boardSelection.joinById")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input
                type="text"
                placeholder={t("boardSelection.boardIdPlaceholder")}
                value={joinBoardId}
                onChange={(e) => setJoinBoardId(e.target.value.toUpperCase())}
                className="border-primary/30 focus:border-primary"
              />
              <Button
                onClick={() => joinBoard()}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading || !joinBoardId.trim()}
              >
                {t("boardSelection.joinBoard")}
              </Button>
            </CardContent>
          </Card>

          {/* Boards List */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary">
                  {showArchived ? <Archive className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  {getBoardsTitle()}
                  {totalBoards.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({displayedBoards.length} of {totalBoards.length})
                    </span>
                  )}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMyBoards(!showMyBoards)}
                    className={`text-primary hover:bg-primary/10 ${showMyBoards ? "bg-primary/10" : ""}`}
                  >
                    {showMyBoards ? t("boardSelection.showAll") : t("boardSelection.showMy")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowArchived(!showArchived)}
                    className="text-primary hover:bg-primary/10"
                  >
                    {showArchived ? t("boardSelection.showActive") : t("boardSelection.showArchived")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingBoards ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : displayedBoards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{getEmptyMessage()}</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {displayedBoards.map((board) => (
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
                            {board.createdByUserId === user?.id && (
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
                                    {!board.isArchived && (
                                      <DropdownMenuItem
                                        onClick={(e) => archiveBoard(board.id, e)}
                                        className="cursor-pointer"
                                      >
                                        <Archive className="w-4 h-4 mr-2" />
                                        {t("common.archiveBoard")}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => deleteBoard(board.id, board.name, e)}
                                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      {t("common.deleteBoard")}
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
                            <span>
                              {t("boardSelection.by")} {board.createdBy}
                              {board.createdByUserId === user?.id && " (you)"}
                            </span>
                            <span>
                              {board.isArchived && board.archivedAt
                                ? `${t("common.archived")} ${formatDate(board.archivedAt)}`
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
                                <span>{t("common.archived")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Loading indicator for infinite scroll */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="flex items-center justify-center py-4">
                      {loadingMore && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      )}
                    </div>
                  )}

                  {/* End of list indicator */}
                  {!hasMore && displayedBoards.length > BOARDS_PER_PAGE && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      {t("boardSelection.allBoardsLoaded")}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
