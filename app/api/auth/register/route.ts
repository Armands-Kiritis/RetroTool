import { type NextRequest, NextResponse } from "next/server"
import { redis, type User } from "@/lib/redis"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters long" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await redis.get<User>(`user:${username.toLowerCase()}`)
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const userId = nanoid()
    const user: User = {
      id: userId,
      username: username.toLowerCase(),
      passwordHash,
      createdAt: Date.now(),
    }

    await redis.set(`user:${username.toLowerCase()}`, user)
    await redis.set(`userId:${userId}`, user)

    // Return user without password hash
    const { passwordHash: _, ...userResponse } = user
    return NextResponse.json({ user: userResponse })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
