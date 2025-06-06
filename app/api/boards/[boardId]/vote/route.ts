import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function POST(request: NextRequest, { params }: { params: { boardId: string } }) {
  try {
    const { itemId, userName, action } = await request.json()

    const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    // Only allow voting in voting state
    if (board.status !== "voting") {
      return NextResponse.json({ error: "Voting is not allowed in current board state" }, { status: 400 })
    }

    const itemIndex = board.items.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const item = board.items[itemIndex]

    // Initialize votes array if it doesn't exist (for backwards compatibility)
    if (!item.votes) {
      item.votes = []
    }

    // Count current votes by this user across all items
    const currentUserVotes = board.items.reduce((total, boardItem) => {
      if (!boardItem.votes) boardItem.votes = []
      return total + boardItem.votes.filter((vote) => vote === userName).length
    }, 0)

    const hasVotedForThisItem = item.votes.includes(userName)

    if (action === "vote") {
      // Check if user has votes remaining (max 5 votes per user)
      if (!hasVotedForThisItem && currentUserVotes >= 5) {
        return NextResponse.json({ error: "You have used all your votes" }, { status: 400 })
      }

      // Add vote if not already voted for this item
      if (!hasVotedForThisItem) {
        item.votes.push(userName)
      }
    } else if (action === "unvote") {
      // Remove vote if user has voted for this item
      if (hasVotedForThisItem) {
        const voteIndex = item.votes.indexOf(userName)
        if (voteIndex > -1) {
          item.votes.splice(voteIndex, 1)
        }
      }
    }

    await redis.set(`board:${params.boardId}`, board)

    return NextResponse.json({
      item: board.items[itemIndex],
      userVotesRemaining:
        5 -
        board.items.reduce((total, boardItem) => {
          if (!boardItem.votes) boardItem.votes = []
          return total + boardItem.votes.filter((vote) => vote === userName).length
        }, 0),
    })
  } catch (error) {
    console.error("Failed to process vote:", error)
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 })
  }
}
