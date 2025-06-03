import { type NextRequest, NextResponse } from "next/server"
import { redis, type User } from "@/lib/redis"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Get user
    const user = await redis.get<User>(`user:${username.toLowerCase()}`)
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Return user without password hash
    const { passwordHash: _, ...userResponse } = user
    return NextResponse.json({ user: userResponse })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
