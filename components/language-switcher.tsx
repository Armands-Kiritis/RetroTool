"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-menu hover:bg-white/20 transition-colors"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#D76500"
            e.currentTarget.style.borderColor = "#D76500"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)"
          }}
        >
          <Globe className="w-4 h-4 mr-2" />
          {t("language.select")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 bg-white">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`cursor-pointer ${language === "en" ? "bg-primary/10" : ""}`}
        >
          {t("language.en")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("lv")}
          className={`cursor-pointer ${language === "lv" ? "bg-primary/10" : ""}`}
        >
          {t("language.lv")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("lt")}
          className={`cursor-pointer ${language === "lt" ? "bg-primary/10" : ""}`}
        >
          {t("language.lt")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("no")}
          className={`cursor-pointer ${language === "no" ? "bg-primary/10" : ""}`}
        >
          {t("language.no")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
