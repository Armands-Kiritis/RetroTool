import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard, type BoardStatus } from "@/lib/redis"

export async function PATCH(request: NextRequest, { params }: { params: { boardId: string } }) {
  try {
    const { status, userName } = await request.json()

    // Validate status
    const validStatuses: BoardStatus[] = ["registering", "voting", "action-planning", "closed"]
    if (!validStatuses.includes(status as BoardStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    // Special handling when transitioning to voting state
    if (status === "voting" && board.status === "registering") {
      // Reveal all items
      board.items.forEach((item) => {
        item.isRevealed = true
        // Initialize votes array if it doesn't exist
        if (!item.votes) {
          item.votes = []
        }
      })
    }

    // Update board status
    board.status = status as BoardStatus
    await redis.set(`board:${params.boardId}`, board)

    return NextResponse.json(board)
  } catch (error) {
    console.error("Failed to update board status:", error)
    return NextResponse.json({ error: "Failed to update board status" }, { status: 500 })
  }
}
