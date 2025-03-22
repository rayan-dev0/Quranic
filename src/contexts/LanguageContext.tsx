'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = {
  id: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
}

export const LANGUAGES: Language[] = [
  { id: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { id: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl' },
  { id: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { id: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
  { id: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr' },
]

type LanguageContextType = {
  currentLanguage: Language
  setLanguage: (language: Language) => void
  languages: Language[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Try to get the language from localStorage, fallback to English
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('selectedLanguage')
      if (savedLanguage) {
        const language = LANGUAGES.find(lang => lang.id === savedLanguage)
        if (language) return language
      }
    }
    return LANGUAGES[0]
  })

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('selectedLanguage', currentLanguage.id)
    // Update document direction
    document.documentElement.dir = currentLanguage.direction
    // Add language class to document for potential CSS overrides
    document.documentElement.lang = currentLanguage.id
  }, [currentLanguage])

  const value = {
    currentLanguage,
    setLanguage: setCurrentLanguage,
    languages: LANGUAGES,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 