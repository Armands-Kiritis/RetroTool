import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  const { name, createdBy, createdByUserId } = await request.json()

  const boardId = nanoid(8) // Short, shareable ID
  const newBoard: RetroBoard = {
    id: boardId,
    name,
    createdBy,
    createdByUserId,
    createdAt: Date.now(),
    items: [],
    participants: [createdBy],
    isArchived: false,
    status: "registering", // Set default status
  }

  await redis.set(`board:${boardId}`, newBoard)

  return NextResponse.json(newBoard)
}
