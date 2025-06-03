import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { UserProvider } from "@/lib/user-context"

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
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}
