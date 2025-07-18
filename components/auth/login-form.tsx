"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "../language-switcher"
import Image from "next/image"

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { setUser } = useUser()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
      } else {
        setError(data.error || t("auth.loginFailed"))
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(t("auth.loginFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen main-bg">
      <header className="menu-bg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/team-retrospective-logo-256x256.png"
              alt="Team Retrospective Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-bold text-menu">{t("retroBoard.teamRetrospective")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex items-center justify-center flex-1 py-20">
        <Card className="w-96 border-2 border-primary/20">
          <CardHeader className="text-center bg-primary/5">
            <CardTitle className="text-2xl text-primary">{t("auth.login")}</CardTitle>
            <p className="text-muted-foreground">{t("auth.loginDescription")}</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              <div>
                <label htmlFor="username" className="text-sm font-medium text-primary-custom">
                  {t("auth.username")}
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 border-primary/30 focus:border-primary"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-primary-custom">
                  {t("auth.password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 border-primary/30 focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                className="w-full text-white"
                disabled={loading || !username.trim() || !password}
                style={{
                  backgroundColor: "#1f4e66",
                  color: "white",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#D76500"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#1f4e66"
                  }
                }}
              >
                {loading ? t("common.loading") : t("auth.login")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button onClick={onSwitchToRegister} className="text-primary hover:underline font-medium">
                  {t("auth.signUp")}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
