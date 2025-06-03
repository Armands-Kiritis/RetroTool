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
}

export interface RetroBoard {
  id: string
  name: string
  createdBy: string
  createdAt: number
  items: RetroItem[]
  participants: string[]
  isArchived: boolean
  archivedAt?: number
  archivedBy?: string
}
