import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { UserProvider } from "@/lib/user-context"
import { LanguageProvider } from "@/lib/language-context"

export const metadata: Metadata = {
  title: "Team Retrospective Tool",
  description: "A collaborative retrospective tool for development teams",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <LanguageProvider>
          <UserProvider>{children}</UserProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
