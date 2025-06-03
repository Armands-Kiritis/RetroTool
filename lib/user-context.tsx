"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  username: string
  name?: string // Display name for backwards compatibility
}

interface UserContextType {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load user from localStorage on mount
    try {
      const savedUser = localStorage.getItem("retro-user")
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser)
        setUserState(parsedUser)
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setUser = (user: User) => {
    // Add display name for backwards compatibility
    const userWithName = { ...user, name: user.username }
    setUserState(userWithName)
    try {
      localStorage.setItem("retro-user", JSON.stringify(userWithName))
    } catch (error) {
      console.error("Failed to save user to localStorage:", error)
    }
  }

  const clearUser = () => {
    setUserState(null)
    try {
      localStorage.removeItem("retro-user")
    } catch (error) {
      console.error("Failed to remove user from localStorage:", error)
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        clearUser,
        isLoading,
        isAuthenticated: !!user?.id,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
