import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function PATCH(request: NextRequest, { params }: { params: { boardId: string; itemId: string } }) {
  try {
    const { content, authorName } = await request.json()

    const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const itemIndex = board.items.findIndex((item) => item.id === params.itemId)
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Only the author can edit their own items
    if (board.items[itemIndex].authorName !== authorName) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update the item content
    board.items[itemIndex].content = content
    await redis.set(`board:${params.boardId}`, board)

    return NextResponse.json(board.items[itemIndex])
  } catch (error) {
    console.error("Failed to update item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { boardId: string; itemId: string } }) {
  try {
    const { authorName } = await request.json()

    const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const itemIndex = board.items.findIndex((item) => item.id === params.itemId)
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Only the author can delete their own items
    if (board.items[itemIndex].authorName !== authorName) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Remove the item from the board
    board.items.splice(itemIndex, 1)
    await redis.set(`board:${params.boardId}`, board)

    return NextResponse.json({ success: true, message: "Item deleted successfully" })
  } catch (error) {
    console.error("Failed to delete item:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
