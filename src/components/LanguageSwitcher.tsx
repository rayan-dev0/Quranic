'use client'

import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E293B] text-gray-200 hover:bg-[#2D3B4F] transition-colors">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage.name}</span>
        </button>
      </DropdownMenu.Trigger>

      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-56 rounded-xl bg-[#1E293B] shadow-xl ring-1 ring-gray-700/5"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="p-2">
                  {availableLanguages.map((language) => (
                    <DropdownMenu.Item
                      key={language.id}
                      onSelect={() => {
                        setLanguage(language.id)
                        setOpen(false)
                      }}
                      className={`
                        flex items-center gap-3 px-3 py-2 text-sm rounded-lg outline-none cursor-pointer
                        ${language.id === currentLanguage.id
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'text-gray-200 hover:bg-[#2D3B4F]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium">{language.name}</span>
                        <span className="text-xs text-gray-400">
                          ({language.direction === 'rtl' ? 'RTL' : 'LTR'})
                        </span>
                      </div>
                      {language.id === currentLanguage.id && (
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </DropdownMenu.Item>
                  ))}
                </div>
              </motion.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  )
} 