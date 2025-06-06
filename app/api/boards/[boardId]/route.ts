import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function GET(request: NextRequest, { params }: { params: { boardId: string } }) {
  const board = await redis.get<RetroBoard>(`board:${params.boardId}`)

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 })
  }

  // Ensure board has a status field (for backwards compatibility with existing boards)
  if (!board.status) {
    board.status = "registering"
    await redis.set(`board:${params.boardId}`, board)
  }

  return NextResponse.json(board)
}

export async function PATCH(request: NextRequest, { params }: { params: { boardId: string } }) {
  const { userName } = await request.json()

  const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 })
  }

  // Add user to participants if not already there
  if (!board.participants.includes(userName)) {
    board.participants.push(userName)
    await redis.set(`board:${params.boardId}`, board)
  }

  return NextResponse.json(board)
}
