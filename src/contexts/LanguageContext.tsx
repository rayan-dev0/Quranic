'use client'

import { createContext, useState, useContext, ReactNode } from 'react'

interface Language {
  id: string
  name: string
  direction: 'ltr' | 'rtl'
}

interface LanguageContextType {
  currentLanguage: Language
  setLanguage: (languageId: string) => void
  availableLanguages: Language[]
}

const languages: Language[] = [
  { id: 'en', name: 'English', direction: 'ltr' },
  { id: 'ar', name: 'العربية', direction: 'rtl' }
]

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0])

  const setLanguage = (languageId: string) => {
    const language = languages.find(lang => lang.id === languageId)
    if (language) {
      setCurrentLanguage(language)
      document.documentElement.dir = language.direction
      document.documentElement.lang = language.id
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        availableLanguages: languages
      }}
    >
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