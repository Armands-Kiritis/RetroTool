"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { Plus, Users, Calendar, Archive, MoreVertical, LogOut, User, Trash2, Search, Smile } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "./language-switcher"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

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
  status?: string // Add status field
}

// Predefined colors for boards
const BOARD_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
  "#14b8a6", // teal-500
  "#f43f5e", // rose-500
  "#a855f7", // purple-500
  "#64748b", // slate-500
]

// Predefined colors for author badges
const AUTHOR_COLORS = [
  { bg: "bg-red-100", text: "text-red-800", hover: "hover:bg-red-200" },
  { bg: "bg-orange-100", text: "text-orange-800", hover: "hover:bg-orange-200" },
  { bg: "bg-amber-100", text: "text-amber-800", hover: "hover:bg-amber-200" },
  { bg: "bg-yellow-100", text: "text-yellow-800", hover: "hover:bg-yellow-200" },
  { bg: "bg-lime-100", text: "text-lime-800", hover: "hover:bg-lime-200" },
  { bg: "bg-green-100", text: "text-green-800", hover: "hover:bg-green-200" },
  { bg: "bg-emerald-100", text: "text-emerald-800", hover: "hover:bg-emerald-200" },
  { bg: "bg-teal-100", text: "text-teal-800", hover: "hover:bg-teal-200" },
  { bg: "bg-cyan-100", text: "text-cyan-800", hover: "hover:bg-cyan-200" },
  { bg: "bg-sky-100", text: "text-sky-800", hover: "hover:bg-sky-200" },
  { bg: "bg-blue-100", text: "text-blue-800", hover: "hover:bg-blue-200" },
  { bg: "bg-indigo-100", text: "text-indigo-800", hover: "hover:bg-indigo-200" },
  { bg: "bg-violet-100", text: "text-violet-800", hover: "hover:bg-violet-200" },
  { bg: "bg-purple-100", text: "text-purple-800", hover: "hover:bg-purple-200" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-800", hover: "hover:bg-fuchsia-200" },
  { bg: "bg-pink-100", text: "text-pink-800", hover: "hover:bg-pink-200" },
  { bg: "bg-rose-100", text: "text-rose-800", hover: "hover:bg-rose-200" },
  { bg: "bg-slate-100", text: "text-slate-800", hover: "hover:bg-slate-200" },
]

// Function to generate consistent color based on board ID
const getBoardColor = (boardId: string): string => {
  let hash = 0
  for (let i = 0; i < boardId.length; i++) {
    const char = boardId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % BOARD_COLORS.length
  return BOARD_COLORS[index]
}

// Function to generate consistent color for authors
const getAuthorColor = (authorName: string) => {
  let hash = 0
  for (let i = 0; i < authorName.length; i++) {
    const char = authorName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % AUTHOR_COLORS.length
  return AUTHOR_COLORS[index]
}

export function BoardSelection({ onBoardSelected }: BoardSelectionProps) {
  const [boardName, setBoardName] = useState("")
  const [joinBoardId, setJoinBoardId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
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
        includeArchived: "true", // Always fetch all boards, we'll filter on frontend
      })

      if (showMyBoards && user?.id) {
        params.append("userId", user.id)
      }

      console.log("Fetching boards with params:", params.toString()) // Debug log

      const response = await fetch(`/api/boards/list?${params}`)
      if (response.ok) {
        const boards = await response.json()
        console.log("Fetched boards:", boards) // Debug log
        setExistingBoards(boards)
      } else {
        console.error("Failed to fetch boards, response:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
      }
    } catch (error) {
      console.error("Failed to fetch boards:", error)
    } finally {
      setLoadingBoards(false)
    }
  }

  // Filter boards based on search query and archive status
  const getFilteredBoards = () => {
    let filteredBoards = existingBoards

    // Filter by archive status
    if (showArchived) {
      filteredBoards = filteredBoards.filter((board) => board.isArchived)
    } else {
      filteredBoards = filteredBoards.filter((board) => !board.isArchived)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filteredBoards = filteredBoards.filter(
        (board) =>
          board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          board.createdBy.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    return filteredBoards
  }

  // Update displayed boards when filters or search changes
  useEffect(() => {
    const filteredBoards = getFilteredBoards()
    const initialBoards = filteredBoards.slice(0, BOARDS_PER_PAGE)
    setDisplayedBoards(initialBoards)
    setHasMore(filteredBoards.length > BOARDS_PER_PAGE)
  }, [existingBoards, searchQuery, showArchived])

  const loadMoreBoards = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    // Simulate loading delay for better UX
    setTimeout(() => {
      const filteredBoards = getFilteredBoards()
      const currentLength = displayedBoards.length
      const nextBoards = filteredBoards.slice(currentLength, currentLength + BOARDS_PER_PAGE)

      if (nextBoards.length > 0) {
        setDisplayedBoards((prev) => [...prev, ...nextBoards])
        setHasMore(currentLength + nextBoards.length < filteredBoards.length)
      } else {
        setHasMore(false)
      }

      setLoadingMore(false)
    }, 300)
  }, [displayedBoards.length, searchQuery, existingBoards, loadingMore, hasMore, showArchived])

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
  }, [showMyBoards, user?.id])

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

  // First, let's make sure the status is properly capitalized for display
  // Add this helper function after the formatDate function

  const formatStatus = (status?: string) => {
    if (!status) return ""
    // Capitalize first letter and replace hyphens with spaces
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ")
  }

  const getStatusBadgeProps = (status?: string) => {
    if (!status) return { variant: "secondary" as const, className: "" }

    switch (status.toLowerCase()) {
      case "registering":
        return {
          variant: "secondary" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-200",
        }
      case "voting":
        return {
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        }
      case "action-planning":
        return {
          variant: "secondary" as const,
          className: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        }
      case "closed":
        return {
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        }
      default:
        return {
          variant: "secondary" as const,
          className: "bg-orange-100 text-orange-800 hover:bg-orange-200",
        }
    }
  }

  const filteredBoards = getFilteredBoards()

  const getBoardsTitle = () => {
    if (showMyBoards) {
      return showArchived ? t("boardSelection.myArchivedBoards") : t("boardSelection.myBoards")
    }
    return showArchived ? t("boardSelection.archivedBoards") : t("boardSelection.allBoards")
  }

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return t("boardSelection.noSearchResults")
    }
    if (showMyBoards) {
      return showArchived ? t("boardSelection.noMyArchivedBoards") : t("boardSelection.noMyBoards")
    }
    return showArchived ? t("boardSelection.noArchivedBoards") : t("boardSelection.noBoardsCreated")
  }

  return (
    <div className="min-h-screen main-bg">
      {/* Header */}
      <header className="menu-bg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/team-retrospective-logo-256x256.png"
              alt="Team Retrospective Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-bold text-menu">{t("retroBoard.teamRetrospective")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-menu transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#D76500"
                    e.currentTarget.style.borderColor = "#D76500"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)"
                  }}
                >
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

        <div className="space-y-8">
          {/* Primary Actions */}
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
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
                  className="w-full text-white"
                  disabled={loading || !boardName.trim()}
                  style={{
                    backgroundColor: "#1f4e66",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#D76500"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#1f4e66"
                    }
                  }}
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
                  className="w-full text-white"
                  disabled={loading || !joinBoardId.trim()}
                  style={{
                    backgroundColor: "#1f4e66",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#D76500"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#1f4e66"
                    }
                  }}
                >
                  {t("boardSelection.joinBoard")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Boards List */}
          <div className="max-w-6xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-primary">
                      {showArchived ? <Archive className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                      {getBoardsTitle()}
                      {filteredBoards.length > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                          ({displayedBoards.length} of {filteredBoards.length})
                        </span>
                      )}
                    </CardTitle>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder={t("boardSelection.searchBoards")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-primary/30 focus:border-primary"
                      />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowMyBoards(!showMyBoards)}
                        className="transition-colors"
                        style={{
                          backgroundColor: showMyBoards ? "#1f4e66" : "transparent",
                          color: showMyBoards ? "white" : "#1f4e66",
                          border: `1px solid ${showMyBoards ? "#1f4e66" : "rgba(31, 78, 102, 0.3)"}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#D76500"
                          e.currentTarget.style.color = "white"
                          e.currentTarget.style.borderColor = "#D76500"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = showMyBoards ? "#1f4e66" : "transparent"
                          e.currentTarget.style.color = showMyBoards ? "white" : "#1f4e66"
                          e.currentTarget.style.borderColor = showMyBoards ? "#1f4e66" : "rgba(31, 78, 102, 0.3)"
                        }}
                      >
                        <Smile className="w-4 h-4 mr-1" />
                        {t("boardSelection.myBoards")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowArchived(!showArchived)}
                        className="transition-colors"
                        style={{
                          backgroundColor: showArchived ? "#1f4e66" : "transparent",
                          color: showArchived ? "white" : "#1f4e66",
                          border: `1px solid ${showArchived ? "#1f4e66" : "rgba(31, 78, 102, 0.3)"}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#D76500"
                          e.currentTarget.style.color = "white"
                          e.currentTarget.style.borderColor = "#D76500"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = showArchived ? "#1f4e66" : "transparent"
                          e.currentTarget.style.color = showArchived ? "white" : "#1f4e66"
                          e.currentTarget.style.borderColor = showArchived ? "#1f4e66" : "rgba(31, 78, 102, 0.3)"
                        }}
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        {t("boardSelection.showArchived")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingBoards ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : displayedBoards.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{getEmptyMessage()}</p>
                    {existingBoards.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Total boards in database: {existingBoards.length}
                      </p>
                    )}
                  </div>
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
                              <div className="flex items-center gap-3 flex-1" onClick={() => joinBoard(board.id)}>
                                {/* Board color circle */}
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: getBoardColor(board.id) }}
                                />
                                <h4 className="font-medium text-primary-custom truncate">{board.name}</h4>
                              </div>
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
                            </div>
                            <div
                              className="flex items-center justify-between text-xs"
                              onClick={() => joinBoard(board.id)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{t("boardSelection.by")}</span>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${getAuthorColor(board.createdBy).bg} ${
                                    getAuthorColor(board.createdBy).text
                                  } ${getAuthorColor(board.createdBy).hover}`}
                                >
                                  {board.createdBy}
                                  {board.createdByUserId === user?.id && " (you)"}
                                </Badge>
                              </div>
                              <span className="text-muted-foreground">
                                {board.isArchived && board.archivedAt
                                  ? `${t("common.archived")} ${formatDate(board.archivedAt)}`
                                  : formatDate(board.createdAt)}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap"
                              onClick={() => joinBoard(board.id)}
                            >
                              <span>Participants: {board.participantCount}</span>
                              <span>Issues: {board.itemCount}</span>
                              {board.status && (
                                <Badge
                                  {...getStatusBadgeProps(board.status)}
                                  className={`text-xs ${getStatusBadgeProps(board.status).className}`}
                                >
                                  {formatStatus(board.status)}
                                </Badge>
                              )}
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
    </div>
  )
}
