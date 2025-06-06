"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { nanoid } from "nanoid"
import { LanguageSwitcher } from "./language-switcher"
import Image from "next/image"

export function NameEntry() {
  const [name, setName] = useState("")
  const { setUser, isLoading } = useUser()
  const { t } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      setUser({
        name: name.trim(),
        id: nanoid(),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen main-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen main-bg">
      {/* Header */}
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
            <CardTitle className="text-2xl text-primary">{t("nameEntry.welcome")}</CardTitle>
            <p className="text-muted-foreground">{t("nameEntry.enterName")}</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder={t("nameEntry.yourName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-primary/30 focus:border-primary"
                autoFocus
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={!name.trim()}>
                {t("nameEntry.continue")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
