import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function POST(request: NextRequest, { params }: { params: { boardId: string } }) {
  const { durationMinutes, action } = await request.json()

  const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 })
  }

  if (action === "start") {
    board.timer = {
      startTime: Date.now(),
      durationMinutes: durationMinutes || 10,
      isActive: true,
    }
  } else if (action === "stop") {
    if (board.timer) {
      board.timer.isActive = false
    }
  }

  await redis.set(`board:${params.boardId}`, board)

  return NextResponse.json(board)
}
