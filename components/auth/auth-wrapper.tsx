"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading, isAuthenticated } = useUser()
  const [showRegister, setShowRegister] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen main-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
    )
  }

  return <>{children}</>
}
