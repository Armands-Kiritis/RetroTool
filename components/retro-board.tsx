"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
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
  LogOut,
  Trash2,
  Edit3,
  Check,
  X,
  Globe,
  ChevronRight,
  ChevronDown,
  PlayCircle,
  ArrowLeftCircle,
  CheckCircle,
  LockIcon,
  ClipboardList,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Timer } from "@/components/timer"
import type { RetroItem, RetroBoard as RetroBoardType, BoardStatus } from "@/lib/redis"
import Image from "next/image"

interface RetroBoardProps {
  boardId: string
  onLeaveBoard: () => void
}

export function RetroBoard({ boardId, onLeaveBoard }: RetroBoardProps) {
  const { user, clearUser } = useUser()
  const { t, language, setLanguage } = useLanguage()
  const [board, setBoard] = useState<RetroBoardType | null>(null)
  const [items, setItems] = useState<RetroItem[]>([])
  const [newItems, setNewItems] = useState({
    glad: "",
    mad: "",
    sad: "",
  })
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [collapsedAuthors, setCollapsedAuthors] = useState<Record<string, boolean>>({})
  const [updatingStatus, setUpdatingStatus] = useState(false)

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
          authorName: user.username || user.name,
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

  const toggleItemVisibility = async (itemId: string, currentlyRevealed: boolean) => {
    if (!user || board?.isArchived) return

    try {
      const response = await fetch(`/api/boards/${boardId}/items/${itemId}/reveal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.username || user.name,
          action: currentlyRevealed ? "hide" : "reveal",
        }),
      })

      if (response.ok) {
        fetchBoard()
      }
    } catch (error) {
      console.error(`Failed to ${currentlyRevealed ? "hide" : "reveal"} item:`, error)
    }
  }

  const startEditItem = (item: RetroItem) => {
    setEditingItem(item.id)
    setEditContent(item.content)
  }

  const cancelEditItem = () => {
    setEditingItem(null)
    setEditContent("")
  }

  const saveEditItem = async (itemId: string) => {
    if (!editContent.trim() || !user) return

    try {
      const response = await fetch(`/api/boards/${boardId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          authorName: user.username || user.name,
        }),
      })

      if (response.ok) {
        setEditingItem(null)
        setEditContent("")
        fetchBoard()
      } else {
        const error = await response.json()
        alert(error.error || t("retroBoard.editFailed"))
      }
    } catch (error) {
      console.error("Failed to edit item:", error)
      alert(t("retroBoard.editFailed"))
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!user) return

    const confirmed = window.confirm(t("retroBoard.deleteItemConfirm"))
    if (!confirmed) return

    try {
      const response = await fetch(`/api/boards/${boardId}/items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: user.username || user.name,
        }),
      })

      if (response.ok) {
        fetchBoard()
      } else {
        const error = await response.json()
        alert(error.error || t("retroBoard.deleteFailed"))
      }
    } catch (error) {
      console.error("Failed to delete item:", error)
      alert(t("retroBoard.deleteFailed"))
    }
  }

  const updateBoardStatus = async (status: BoardStatus) => {
    if (!user || board?.isArchived) return

    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/boards/${boardId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          userName: user.username || user.name,
        }),
      })

      if (response.ok) {
        fetchBoard()
      }
    } catch (error) {
      console.error("Failed to update board status:", error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const archiveBoard = async () => {
    if (!user) return

    const confirmed = window.confirm(t("common.archiveConfirm"))

    if (!confirmed) return

    try {
      const response = await fetch(`/api/boards/${boardId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          userName: user.username || user.name,
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
          userName: user.username || user.name,
        }),
      })

      if (response.ok) {
        fetchBoard()
      }
    } catch (error) {
      console.error("Failed to unarchive board:", error)
    }
  }

  const deleteBoard = async () => {
    if (!user || !board) return

    const confirmed = window.confirm(t("common.deleteConfirm", { boardName: board.name }))

    if (!confirmed) return

    try {
      const response = await fetch(`/api/boards/${boardId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user.username || user.name,
        }),
      })

      if (response.ok) {
        alert(t("common.deleteSuccess"))
        onLeaveBoard() // Navigate back to board selection
      } else {
        const error = await response.json()
        alert(error.error || t("common.deleteFailed"))
      }
    } catch (error) {
      console.error("Failed to delete board:", error)
      alert(t("common.deleteFailed"))
    }
  }

  const copyBoardLink = () => {
    const url = `${window.location.origin}?board=${boardId}`
    navigator.clipboard.writeText(url)
    alert(t("common.copySuccess"))
  }

  const handleLogout = () => {
    clearUser()
  }

  const toggleAuthorCollapse = (category: string, authorName: string) => {
    const key = `${category}-${authorName}`
    setCollapsedAuthors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const isAuthorCollapsed = (category: string, authorName: string) => {
    const key = `${category}-${authorName}`
    return collapsedAuthors[key] || false
  }

  const getItemsByCategory = (category: "glad" | "mad" | "sad") => {
    const categoryItems = items.filter((item) => item.category === category)

    // Group items by author
    const groupedByAuthor = categoryItems.reduce(
      (groups, item) => {
        const authorName = item.authorName
        if (!groups[authorName]) {
          groups[authorName] = []
        }
        groups[authorName].push(item)
        return groups
      },
      {} as Record<string, RetroItem[]>,
    )

    // Sort authors alphabetically and return grouped items
    const sortedAuthors = Object.keys(groupedByAuthor).sort()

    return sortedAuthors.map((authorName) => ({
      authorName,
      items: groupedByAuthor[authorName].sort((a, b) => a.createdAt - b.createdAt), // Sort items within group by creation time
    }))
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
    return t(`retroBoard.${category}`)
  }

  const getEmotionPlaceholder = (category: "glad" | "mad" | "sad") => {
    const emotions = {
      glad: "glad",
      mad: "mad",
      sad: "sad",
    }
    return t("retroBoard.whatMadeYou", { emotion: emotions[category] })
  }

  const getStatusBadgeColor = (status: BoardStatus) => {
    switch (status) {
      case "registering":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "voting":
        return "bg-amber-100 text-amber-800 border-amber-300"
      case "action-planning":
        return "bg-green-100 text-green-800 border-green-300"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: BoardStatus) => {
    switch (status) {
      case "registering":
        return <ClipboardList className="w-3 h-3 mr-1" />
      case "voting":
        return <PlayCircle className="w-3 h-3 mr-1" />
      case "action-planning":
        return <CheckCircle className="w-3 h-3 mr-1" />
      case "closed":
        return <LockIcon className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: BoardStatus) => {
    switch (status) {
      case "registering":
        return "Registering"
      case "voting":
        return "Voting"
      case "action-planning":
        return "Action Planning"
      case "closed":
        return "Closed"
      default:
        return status
    }
  }

  // Status transition buttons
  const StatusButtons = () => {
    if (!board || board.isArchived) return null

    const buttonStyle = {
      backgroundColor: "#1f4e66",
      color: "white",
    }

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.backgroundColor = "#D76500"
      }
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.disabled) {
        e.currentTarget.style.backgroundColor = "#1f4e66"
      }
    }

    // Ensure we have a valid status
    const status = board.status || "registering"

    switch (status) {
      case "registering":
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateBoardStatus("voting")}
            disabled={updatingStatus}
            className="text-white transition-colors"
            style={buttonStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Start Voting
          </Button>
        )
      case "voting":
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBoardStatus("registering")}
              disabled={updatingStatus}
              className="text-white transition-colors"
              style={buttonStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <ArrowLeftCircle className="w-4 h-4 mr-2" />
              Back to Registering
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBoardStatus("action-planning")}
              disabled={updatingStatus}
              className="text-white transition-colors"
              style={buttonStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Start Action Planning
            </Button>
          </>
        )
      case "action-planning":
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBoardStatus("voting")}
              disabled={updatingStatus}
              className="text-white transition-colors"
              style={buttonStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <ArrowLeftCircle className="w-4 h-4 mr-2" />
              Back to Voting
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBoardStatus("closed")}
              disabled={updatingStatus}
              className="text-white transition-colors"
              style={buttonStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <LockIcon className="w-4 h-4 mr-2" />
              Close Retrospection
            </Button>
          </>
        )
      case "closed":
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBoardStatus("action-planning")}
              disabled={updatingStatus}
              className="text-white transition-colors"
              style={buttonStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <ArrowLeftCircle className="w-4 h-4 mr-2" />
              Back to Action Planning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={archiveBoard}
              disabled={updatingStatus}
              className="text-white transition-colors"
              style={buttonStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </>
        )
      default:
        return null
    }
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen main-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Handle boards created before status field was added
  const boardStatus = board.status || "registering"
  const isCreator = board.createdBy === (user?.username || user?.name)

  return (
    <div className="min-h-screen main-bg">
      {/* Top Panel - Product Header */}
      <header className="menu-bg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onLeaveBoard}
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
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>

            {/* Center - Product name and logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/images/team-retrospective-logo-256x256.png"
                alt="Team Retrospective Logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <h1 className="text-xl font-semibold text-menu">{t("retroBoard.teamRetrospective")}</h1>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2">
              {/* Main Menu with Board Actions, Language, and Logout */}
              <div className="relative z-10">
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
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-white">
                    {/* Language Selection Submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        <Globe className="w-4 h-4 mr-2" />
                        {t("language.select")}
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-white">
                        <DropdownMenuItem
                          onClick={() => setLanguage("en")}
                          className={`cursor-pointer ${language === "en" ? "bg-primary/10" : ""}`}
                        >
                          {t("language.en")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage("lv")}
                          className={`cursor-pointer ${language === "lv" ? "bg-primary/10" : ""}`}
                        >
                          {t("language.lv")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage("lt")}
                          className={`cursor-pointer ${language === "lt" ? "bg-primary/10" : ""}`}
                        >
                          {t("language.lt")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage("no")}
                          className={`cursor-pointer ${language === "no" ? "bg-primary/10" : ""}`}
                        >
                          {t("language.no")}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />

                    {/* Board Actions - only for non-archived boards */}
                    {!board.isArchived && boardStatus !== "closed" && (
                      <>
                        <DropdownMenuItem onClick={archiveBoard} className="cursor-pointer">
                          <Archive className="w-4 h-4 mr-2" />
                          {t("common.archiveBoard")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Delete Board - available for all boards */}
                    <DropdownMenuItem
                      onClick={deleteBoard}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("common.deleteBoard")}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Logout */}
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("common.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Board Information Area */}
      <div className="bg-white border-b border-primary/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-primary-custom">{board.name}</h2>
                  {/* Board Status Badge */}
                  <Badge className={`border ${getStatusBadgeColor(boardStatus as BoardStatus)} flex items-center`}>
                    {getStatusIcon(boardStatus as BoardStatus)}
                    {getStatusLabel(boardStatus as BoardStatus)}
                  </Badge>
                  {board.isArchived && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Archive className="w-3 h-3 mr-1" />
                      {t("common.archived")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>
                    {t("common.boardId")}: {boardId}
                  </span>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>
                      {board.participants.length} {t("common.participants")}
                    </span>
                  </div>
                  {isCreator && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      {t("common.creator")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Status transition buttons and other actions */}
            <div className="flex items-center gap-2">
              {/* Status transition buttons - place them next to Timer */}
              {!board.isArchived && <StatusButtons />}

              {/* Add larger gap before Timer */}
              <div className="w-6"></div>

              {/* Timer Component */}
              <Timer boardId={boardId} timer={board.timer} isArchived={board.isArchived} />

              {board.isArchived && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={unarchiveBoard}
                  className="text-white transition-colors"
                  style={{
                    backgroundColor: "#1f4e66",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#D76500"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f4e66"
                  }}
                >
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  {t("common.unarchive")}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={copyBoardLink}
                className="text-white transition-colors"
                style={{
                  backgroundColor: "#1f4e66",
                  color: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#D76500"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1f4e66"
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                {t("common.shareLink")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {board.isArchived && (
        <div className="container mx-auto px-6 pt-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">{t("retroBoard.archivedMessage")}</p>
                  <p className="text-sm">
                    {t("retroBoard.archivedDescription", {
                      date: new Date(board.archivedAt!).toLocaleDateString(),
                      name: board.archivedBy || "",
                    })}
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
                {/* Add new item - disabled if archived or not in registering/voting phase */}
                {!board.isArchived && (boardStatus === "registering" || boardStatus === "voting") && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={getEmotionPlaceholder(category)}
                      value={newItems[category]}
                      onChange={(e) => setNewItems({ ...newItems, [category]: e.target.value })}
                      className="min-h-[80px] border-primary/30 focus:border-primary bg-white/70"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => addItem(category)}
                        disabled={loading || !newItems[category].trim()}
                        size="sm"
                        className="transition-colors"
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
                        onBlur={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = "#1f4e66"
                          }
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("retroBoard.addItem")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Existing items */}
                <div className="space-y-4">
                  {getItemsByCategory(category).map((authorGroup) => (
                    <div key={authorGroup.authorName} className="space-y-2">
                      {/* Author header with collapse/expand button */}
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-primary/5 rounded-md p-1 -m-1 transition-colors"
                        onClick={() => toggleAuthorCollapse(category, authorGroup.authorName)}
                      >
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/10">
                          {isAuthorCollapsed(category, authorGroup.authorName) ? (
                            <ChevronRight className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary" />
                          )}
                        </Button>
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium text-primary-custom">
                          {authorGroup.authorName}
                          {authorGroup.authorName === (user?.username || user?.name) && " (you)"}
                        </span>
                        <div className="flex-1 h-px bg-primary/20"></div>
                        <span className="text-xs text-muted-foreground">
                          {authorGroup.items.length} {authorGroup.items.length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      {/* Author's items - only show if not collapsed */}
                      {!isAuthorCollapsed(category, authorGroup.authorName) && (
                        <div className="space-y-2 ml-6">
                          {authorGroup.items.map((item) => (
                            <Card key={item.id} className="bg-white/70 border-primary/20">
                              <CardContent className="px-4 py-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    {item.isRevealed || item.authorName === (user?.username || user?.name) ? (
                                      <div>
                                        {editingItem === item.id ? (
                                          <div className="space-y-2">
                                            <Textarea
                                              value={editContent}
                                              onChange={(e) => setEditContent(e.target.value)}
                                              className="min-h-[60px] border-primary/30 focus:border-primary text-sm p-0"
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={() => saveEditItem(item.id)}
                                                disabled={!editContent.trim()}
                                                className="bg-primary hover:bg-primary/90"
                                              >
                                                <Check className="w-3 h-3 mr-1" />
                                                {t("retroBoard.save")}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={cancelEditItem}
                                                className="border-primary/30"
                                              >
                                                <X className="w-3 h-3 mr-1" />
                                                {t("retroBoard.cancel")}
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-primary-custom">{item.content}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 pl-0">
                                        <span className="text-sm text-muted-foreground">
                                          {t("retroBoard.hiddenItem", { name: item.authorName })}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {item.authorName === (user?.username || user?.name) &&
                                    !board.isArchived &&
                                    (boardStatus === "registering" || boardStatus === "voting") && (
                                      <div className="flex gap-1">
                                        {editingItem !== item.id && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleItemVisibility(item.id, item.isRevealed)}
                                              className="shrink-0 hover:bg-primary/10 h-8 w-8 p-0"
                                              title={
                                                item.isRevealed ? t("retroBoard.hideItem") : t("retroBoard.revealItem")
                                              }
                                            >
                                              {item.isRevealed ? (
                                                <EyeOff className="w-4 h-4 text-primary" />
                                              ) : (
                                                <Eye className="w-4 h-4 text-primary" />
                                              )}
                                            </Button>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="shrink-0 hover:bg-primary/10 h-8 w-8 p-0"
                                                >
                                                  <MoreVertical className="w-4 h-4 text-primary" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="z-50 bg-white">
                                                <DropdownMenuItem
                                                  onClick={() => startEditItem(item)}
                                                  className="cursor-pointer"
                                                >
                                                  <Edit3 className="w-4 h-4 mr-2" />
                                                  {t("retroBoard.editItem")}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={() => deleteItem(item.id)}
                                                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                  <Trash2 className="w-4 h-4 mr-2" />
                                                  {t("retroBoard.deleteItem")}
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </>
                                        )}
                                      </div>
                                    )}
                                </div>

                                {item.isRevealed && editingItem !== item.id && (
                                  <div className="mt-2 pl-0">
                                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                      {t("retroBoard.revealed")}
                                    </Badge>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
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
