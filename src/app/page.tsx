'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSurahs, Chapter } from '@/lib/quran-api'
import { Search, Book, BookOpen, Bookmark, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Add these Aceternity-inspired components
interface TextGradientProps {
  children: React.ReactNode;
  className?: string;
}

const TextGradient = ({ children, className }: TextGradientProps) => (
  <span className={cn("bg-gradient-to-r from-primary via-blue-400 to-primary/80 bg-clip-text text-transparent", className)}>
    {children}
  </span>
)

interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
}

const BackgroundGradient = ({ children, className }: BackgroundGradientProps) => (
  <div className={cn("relative group", className)}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-primary rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-300"></div>
    {children}
  </div>
)

// Feature card component with hover effects
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <motion.div 
    className="relative overflow-hidden rounded-xl bg-[#111827]/60 backdrop-blur-md border border-white/5 p-8"
    whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }}
    transition={{ duration: 0.3 }}
  >
    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
    <div className="relative z-10">
      <div className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        {icon}
      </div>
      <h3 className="text-2xl font-medium text-white mb-3">{title}</h3>
      <p className="text-lg text-gray-400">{description}</p>
    </div>
  </motion.div>
)

const IslamicPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full opacity-40">
    <div className="absolute inset-0 bg-gradient-to-b from-[#0A1020] via-[#0A1020]/90 to-[#0A1020] z-10"></div>
    <svg className="absolute inset-0 -z-10 h-full w-full stroke-blue-500/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]">
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
    
    {/* Aceternity-style animated blobs */}
    <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
    <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
    <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
  </div>
)

// Shimmering divider
const ShimmeringDivider = () => (
  <div className="w-20 h-px mx-auto my-8 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-75 animate-shimmer"></div>
  </div>
);

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
        <motion.div 
          className="py-16 sm:py-24 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
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
                transition={{ 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="relative mx-auto h-28 w-28 mb-8"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/30 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary to-blue-500/80 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-blue-500 animate-spin-slow opacity-70 blur-sm"></div>
                  <BookOpen className="h-12 w-12 text-white relative z-10" />
                </div>
                <div className="absolute -inset-3 rounded-full border border-primary/20 animate-ping-slow"></div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-4xl font-bold tracking-tight sm:text-6xl mb-6"
              >
                <TextGradient className="">Enlighten Your Spirit</TextGradient>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg leading-8 text-gray-300/80 mb-8"
              >
                Immerse yourself in the divine words of the Quran with our beautifully crafted 
                reading experience. Discover deep insights through translations and reflections.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="relative max-w-md mx-auto mb-16"
              >
                <BackgroundGradient className="">
                  <div className="relative bg-[#111827]/80 backdrop-blur-md rounded-xl p-1.5">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-primary/80" />
                    <input
                      type="text"
                      placeholder="Search Surah..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-transparent border-none rounded-lg focus:outline-none focus:ring-0 text-gray-100 placeholder-gray-400 text-lg"
                    />
                  </div>
                </BackgroundGradient>
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-4"
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
                    transition={{ 
                      delay: 0.05 * index, 
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200,
                      damping: 25
                    }}
                    layoutId={`surah-card-${surah.id}`}
                    className="min-h-[220px] flex"
                  >
                    <BackgroundGradient className="flex-1">
                      <motion.div
                        onClick={() => handleCardClick(surah.id)}
                        className="group relative overflow-hidden rounded-xl bg-[#111827]/90 backdrop-blur-md hover:bg-[#1E293B]/90 transition-colors duration-300 cursor-pointer p-3 h-full flex flex-col"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div 
                          className="absolute top-3 right-5 text-5xl font-arabic text-primary/10 group-hover:text-primary/20 transition-colors duration-300"
                          layoutId={`surah-arabic-${surah.id}`}
                        >
                          {surah.name_arabic}
                        </motion.div>
                        <div className="relative p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-5">
                            <motion.div 
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 text-lg font-medium group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors duration-300"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                              layoutId={`surah-number-${surah.id}`}
                            >
                              {surah.id}
                            </motion.div>
                            <div className="min-w-0">
                              <motion.h3 
                                className="truncate text-2xl font-medium text-gray-100"
                                layoutId={`surah-title-${surah.id}`}
                              >
                                {surah.name_simple}
                              </motion.h3>
                              <motion.p 
                                className="truncate text-lg text-primary/70 group-hover:text-primary/90 transition-colors duration-300"
                                layoutId={`surah-translation-${surah.id}`}
                              >
                                {surah.translated_name.name}
                              </motion.p>
                            </div>
                          </div>
                          <motion.div 
                            className="mt-auto pt-6 flex items-center gap-x-6 text-sm text-gray-400"
                            layoutId={`surah-meta-${surah.id}`}
                          >
                            <div className="px-4 py-2 rounded-full bg-blue-900/20 text-blue-300">
                              Verses: {surah.verses_count}
                            </div>
                            <div className="px-4 py-2 rounded-full bg-indigo-900/20 text-indigo-300">
                              {surah.revelation_place}
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    </BackgroundGradient>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        <ShimmeringDivider />
      </main>
    </div>
  )
}
