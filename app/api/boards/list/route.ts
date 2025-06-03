import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const includeArchived = url.searchParams.get("includeArchived") === "true"
    const userId = url.searchParams.get("userId")

    // Get all board keys
    const keys = await redis.keys("board:*")

    if (keys.length === 0) {
      return NextResponse.json([])
    }

    // Get all boards
    const boards = await redis.mget<RetroBoard[]>(...keys)

    // Filter out null values and apply filters
    const validBoards = boards
      .filter((board): board is RetroBoard => board !== null)
      .filter((board) => includeArchived || !board.isArchived)
      .filter((board) => !userId || board.createdByUserId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((board) => ({
        id: board.id,
        name: board.name,
        createdBy: board.createdBy,
        createdByUserId: board.createdByUserId,
        createdAt: board.createdAt,
        participantCount: board.participants.length,
        itemCount: board.items.length,
        isArchived: board.isArchived || false,
        archivedAt: board.archivedAt,
        archivedBy: board.archivedBy,
      }))

    return NextResponse.json(validBoards)
  } catch (error) {
    console.error("Failed to fetch boards:", error)
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 })
  }
}
