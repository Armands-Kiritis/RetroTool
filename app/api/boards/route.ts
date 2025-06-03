import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  const { name, createdBy } = await request.json()

  const boardId = nanoid(8) // Short, shareable ID
  const newBoard: RetroBoard = {
    id: boardId,
    name,
    createdBy,
    createdAt: Date.now(),
    items: [],
    participants: [createdBy],
    isArchived: false,
  }

  await redis.set(`board:${boardId}`, newBoard)

  return NextResponse.json(newBoard)
}
