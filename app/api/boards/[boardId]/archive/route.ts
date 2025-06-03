import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function PATCH(request: NextRequest, { params }: { params: { boardId: string } }) {
  const { action, userName } = await request.json()

  const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 })
  }

  if (action === "archive") {
    board.isArchived = true
    board.archivedAt = Date.now()
    board.archivedBy = userName
  } else if (action === "unarchive") {
    board.isArchived = false
    board.archivedAt = undefined
    board.archivedBy = undefined
  }

  await redis.set(`board:${params.boardId}`, board)

  return NextResponse.json(board)
}
