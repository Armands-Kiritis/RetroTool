import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface RetroItem {
  id: string
  content: string
  category: "glad" | "mad" | "sad"
  authorId: string
  authorName: string
  isRevealed: boolean
  createdAt: number
  votes: string[] // Array of usernames who voted for this item
  actionItem?: string // Action item for this retrospective item
  responsiblePerson?: string // Username of the person responsible for the action item
}

export type BoardStatus = "registering" | "voting" | "action-planning" | "closed"

export interface RetroBoard {
  id: string
  name: string
  createdBy: string
  createdByUserId?: string // Add user ID for filtering
  createdAt: number
  items: RetroItem[]
  participants: string[]
  isArchived: boolean
  archivedAt?: number
  archivedBy?: string
  status: BoardStatus // New field for board status
  timer?: {
    startTime: number
    durationMinutes: number
    isActive: boolean
  }
}

export interface User {
  id: string
  username: string
  passwordHash: string
  createdAt: number
}
