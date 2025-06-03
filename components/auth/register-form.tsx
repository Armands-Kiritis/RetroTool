"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "../language-switcher"

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { setUser } = useUser()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password || !confirmPassword) return

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"))
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
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
        setError(data.error || t("auth.registrationFailed"))
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError(t("auth.registrationFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen main-bg">
      <header className="menu-bg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-menu">{t("retroBoard.teamRetrospective")}</h1>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex items-center justify-center flex-1 py-20">
        <Card className="w-96 border-2 border-primary/20">
          <CardHeader className="text-center bg-primary/5">
            <CardTitle className="text-2xl text-primary">{t("auth.signUp")}</CardTitle>
            <p className="text-muted-foreground">{t("auth.signUpDescription")}</p>
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
                <p className="text-xs text-muted-foreground mt-1">{t("auth.usernameRequirement")}</p>
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
                <p className="text-xs text-muted-foreground mt-1">{t("auth.passwordRequirement")}</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-primary-custom">
                  {t("auth.confirmPassword")}
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 border-primary/30 focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading || !username.trim() || !password || !confirmPassword}
              >
                {loading ? t("common.loading") : t("auth.signUp")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t("auth.haveAccount")}{" "}
                <button onClick={onSwitchToLogin} className="text-primary hover:underline font-medium">
                  {t("auth.login")}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
