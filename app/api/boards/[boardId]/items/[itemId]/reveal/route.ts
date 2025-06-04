import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function PATCH(request: NextRequest, { params }: { params: { boardId: string; itemId: string } }) {
  const { authorName, action } = await request.json()

  const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 })
  }

  const itemIndex = board.items.findIndex((item) => item.id === params.itemId)
  if (itemIndex === -1) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  // Only the author can reveal or hide their own items
  if (board.items[itemIndex].authorName !== authorName) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Set isRevealed based on the action (reveal or hide)
  board.items[itemIndex].isRevealed = action === "reveal"
  await redis.set(`board:${params.boardId}`, board)

  return NextResponse.json(board.items[itemIndex])
}
