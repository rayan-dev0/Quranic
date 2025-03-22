'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuranPage } from '@/components/QuranPage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Bookmark, Share2, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const pageTransitionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
}

export default function MushafPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('')
  const [direction, setDirection] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  // Load bookmarked page from localStorage on mount
  useEffect(() => {
    const savedPage = localStorage.getItem('bookmarkedPage')
    if (savedPage) {
      setIsBookmarked(Number(savedPage) === currentPage)
    }
  }, [currentPage])

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pageNumber = parseInt(pageInput)
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= 604) {
      setDirection(pageNumber > currentPage ? 1 : -1)
      setIsLoading(true)
      // Add artificial delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300))
      setCurrentPage(pageNumber)
      setPageInput('')
      setIsLoading(false)
    }
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= 604) {
      setDirection(newPage > currentPage ? 1 : -1)
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 300))
      setCurrentPage(newPage)
      setIsLoading(false)
    }
  }

  const toggleBookmark = () => {
    if (isBookmarked) {
      localStorage.removeItem('bookmarkedPage')
      setIsBookmarked(false)
    } else {
      localStorage.setItem('bookmarkedPage', currentPage.toString())
      setIsBookmarked(true)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Quran Mushaf',
        text: `Reading Quran page ${currentPage}`,
        url: window.location.href
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen py-8 bg-[#0A1020]"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-8">
          <motion.h1 
            className="text-4xl font-bold mb-6 text-gray-100"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {currentLanguage.direction === 'rtl' ? 'المصحف الشريف' : 'Quran Mushaf'}
          </motion.h1>

          <motion.div 
            className="flex flex-wrap gap-4 justify-center items-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <form onSubmit={handlePageSubmit} className="flex gap-2">
              <Input
                type="number"
                placeholder={currentLanguage.direction === 'rtl' ? 'اذهب إلى الصفحة (١-٦٠٤)' : 'Go to page (1-604)'}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                min={1}
                max={604}
                className="w-40 bg-[#1E293B] text-gray-100 border-gray-700"
              />
              <Button type="submit" disabled={isLoading}>
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= 604 || isLoading}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBookmark}
              className={cn(
                "transition-colors",
                isBookmarked ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"
              )}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
        
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={pageTransitionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            <QuranPage
              pageNumber={currentPage}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </motion.div>
        </AnimatePresence>

        <motion.div 
          className="text-center mt-4 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {currentLanguage.direction === 'rtl' ? 
            `الصفحة ${currentPage} من ٦٠٤` : 
            `Page ${currentPage} of 604`}
        </motion.div>
      </div>
    </motion.div>
  )
}