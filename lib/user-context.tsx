"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  name: string
  id: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  isLoading: boolean
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
        setUserState(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setUser = (user: User) => {
    setUserState(user)
    try {
      localStorage.setItem("retro-user", JSON.stringify(user))
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

  return <UserContext.Provider value={{ user, setUser, clearUser, isLoading }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
