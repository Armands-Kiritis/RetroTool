import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function PATCH(request: NextRequest, { params }: { params: { boardId: string; itemId: string } }) {
  try {
    const { actionItem, responsiblePerson, userName } = await request.json()

    const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    // Only allow action item updates in action-planning state
    if (board.status !== "action-planning") {
      return NextResponse.json({ error: "Action items can only be updated in action planning state" }, { status: 400 })
    }

    // Only board creator can update action items
    if (board.createdBy !== userName) {
      return NextResponse.json({ error: "Only board creator can update action items" }, { status: 403 })
    }

    const itemIndex = board.items.findIndex((item) => item.id === params.itemId)
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Update the action item and responsible person
    board.items[itemIndex].actionItem = actionItem.trim() || undefined
    board.items[itemIndex].responsiblePerson = responsiblePerson || undefined
    await redis.set(`board:${params.boardId}`, board)

    return NextResponse.json(board.items[itemIndex])
  } catch (error) {
    console.error("Failed to update action item:", error)
    return NextResponse.json({ error: "Failed to update action item" }, { status: 500 })
  }
}
