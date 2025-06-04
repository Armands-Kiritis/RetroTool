import { type NextRequest, NextResponse } from "next/server"
import { redis, type RetroBoard } from "@/lib/redis"

export async function DELETE(request: NextRequest, { params }: { params: { boardId: string } }) {
  try {
    const { userName } = await request.json()

    const board = await redis.get<RetroBoard>(`board:${params.boardId}`)
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    // Any user can delete the board (removed creator restriction)

    // Delete the board from Redis
    await redis.del(`board:${params.boardId}`)

    return NextResponse.json({ success: true, message: "Board deleted successfully" })
  } catch (error) {
    console.error("Failed to delete board:", error)
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 })
  }
}
