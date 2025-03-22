'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSurahs, Chapter } from '@/lib/quran-api'
import { Search, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const IslamicPattern = () => (
  <svg className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 dark:stroke-gray-600/20 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]">
    <defs>
      <pattern
        id="islamic-pattern"
        x="0"
        y="0"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <path d="M.5 40V.5H40" fill="none" />
        <path d="M40 40V.5H.5" fill="none" />
        <circle cx="20" cy="20" r="16" fill="none" />
        <path d="M20 4a16 16 0 0 1 16 16M4 20a16 16 0 0 1 16-16M20 36A16 16 0 0 1 4 20m32 0a16 16 0 0 1-16 16" fill="none" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" strokeWidth="0" fill="url(#islamic-pattern)" />
  </svg>
)

export default function Home() {
  const router = useRouter()
  const [surahs, setSurahs] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const data = await getSurahs()
        setSurahs(data)
      } catch (error) {
        console.error('Error fetching surahs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSurahs()
  }, [])

  const filteredSurahs = surahs.filter(surah =>
    surah.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCardClick = (surahId: number) => {
    setSelectedId(surahId)
    // Delay navigation to allow animation to play
    setTimeout(() => {
      router.push(`/surah/${surahId}`)
    }, 300)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1020]">
      <IslamicPattern />
      
      <main className="container relative px-4">
        <div className="py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="mx-auto max-w-2xl">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative mx-auto h-24 w-24 mb-8"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-primary/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                  <Moon className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
              >
                Read, Learn, and Reflect
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg leading-8 text-muted-foreground mb-8"
              >
                Access the Holy Quran with beautiful recitations, translations, and tafsir.
                Start your spiritual journey today.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="relative max-w-md mx-auto mb-16"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search Surah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-full bg-background/95 backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-t-primary animate-spin" />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4"
            >
              <AnimatePresence>
                {filteredSurahs.map((surah, index) => (
                  <motion.div
                    key={surah.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={selectedId === surah.id ? {
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 50,
                      scale: 1.1,
                      opacity: 0,
                    } : { opacity: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.5 }}
                    layoutId={`surah-card-${surah.id}`}
                  >
                    <motion.div
                      onClick={() => handleCardClick(surah.id)}
                      className="group block relative overflow-hidden rounded-xl bg-[#0F172A] hover:bg-[#1E293B] transition-colors duration-300 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div 
                        className="absolute top-2 right-4 text-4xl font-arabic text-gray-700/20"
                        layoutId={`surah-arabic-${surah.id}`}
                      >
                        {surah.name_arabic}
                      </motion.div>
                      <div className="relative p-4">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                            layoutId={`surah-number-${surah.id}`}
                          >
                            {surah.id}
                          </motion.div>
                          <div className="min-w-0">
                            <motion.h3 
                              className="truncate text-base font-medium text-gray-100"
                              layoutId={`surah-title-${surah.id}`}
                            >
                              {surah.name_simple}
                            </motion.h3>
                            <motion.p 
                              className="truncate text-sm text-gray-400"
                              layoutId={`surah-translation-${surah.id}`}
                            >
                              {surah.translated_name.name}
                            </motion.p>
                          </div>
                        </div>
                        <motion.div 
                          className="mt-4 flex items-center gap-x-8 text-xs text-gray-400"
                          layoutId={`surah-meta-${surah.id}`}
                        >
                          <p>Verses: {surah.verses_count}</p>
                          <p>Revelation: {surah.revelation_place}</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
