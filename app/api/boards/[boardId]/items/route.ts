import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroItem, type RetroBoard } from "@/lib/redis"
import { nanoid } from "nanoid"

export async function GET(request: NextRequest, { params }: { params: { boardId: string } }) {
  const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 })
  }

  return NextResponse.json(board.items || [])
}

export async function POST(request: NextRequest, { params }: { params: { boardId: string } }) {
  const { content, category, authorName } = await request.json()

  const newItem: RetroItem = {
    id: nanoid(),
    content,
    category,
    authorId: nanoid(), // Generate a unique ID for this user session
    authorName,
    isRevealed: false,
    createdAt: Date.now(),
  }

  // Get existing board
  const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 })
  }

  board.items.push(newItem)
  await redis.set(`board:${params.boardId}`, board)

  return NextResponse.json(newItem)
}
