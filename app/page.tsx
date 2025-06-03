"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { NameEntry } from "@/components/name-entry"
import { BoardSelection } from "@/components/board-selection"
import { RetroBoard } from "@/components/retro-board"

function HomeContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null)

  useEffect(() => {
    // Check if there's a board ID in the URL
    const boardFromUrl = searchParams.get("board")
    if (boardFromUrl) {
      setCurrentBoardId(boardFromUrl)
    }
  }, [searchParams])

  const handleBoardSelected = (boardId: string) => {
    setCurrentBoardId(boardId)
    // Update URL without page reload
    window.history.pushState({}, "", `?board=${boardId}`)
  }

  const handleLeaveBoard = () => {
    setCurrentBoardId(null)
    window.history.pushState({}, "", "/")
  }

  // Show name entry if user hasn't entered their name
  if (!user) {
    return <NameEntry />
  }

  // Show board if one is selected
  if (currentBoardId) {
    return <RetroBoard boardId={currentBoardId} onLeaveBoard={handleLeaveBoard} />
  }

  // Show board selection
  return <BoardSelection onBoardSelected={handleBoardSelected} />
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
