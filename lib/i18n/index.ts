import { en } from "./en"
import { lv } from "./lv"

export type Language = "en" | "lv"

export const translations = {
  en,
  lv,
}

export type TranslationKey = keyof typeof en

export function getTranslation(lang: Language, key: string): any {
  const keys = key.split(".")
  let translation: any = translations[lang]

  for (const k of keys) {
    if (!translation[k]) return key
    translation = translation[k]
  }

  return translation
}

export function formatMessage(message: string, values: Record<string, string> = {}): string {
  return message.replace(/{(\w+)}/g, (_, key) => values[key] || `{${key}}`)
}
