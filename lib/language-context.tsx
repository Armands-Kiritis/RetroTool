"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type Language, getTranslation, formatMessage } from "./i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, values?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    // Load language from localStorage on mount
    try {
      const savedLanguage = localStorage.getItem("retro-language") as Language
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "lv")) {
        setLanguageState(savedLanguage)
      }
    } catch (error) {
      console.error("Failed to load language from localStorage:", error)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem("retro-language", lang)
    } catch (error) {
      console.error("Failed to save language to localStorage:", error)
    }
  }

  const t = (key: string, values?: Record<string, string>) => {
    const translation = getTranslation(language, key)
    return typeof translation === "string" ? formatMessage(translation, values) : key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
