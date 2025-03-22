'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface QuranPageProps {
  pageNumber: number
  onPageChange: (newPage: number) => void
  isLoading?: boolean
  highlightedWordIndex?: number | null
}

interface VerseData {
  id: number
  verse_key: string
  text_uthmani: string
  page_number: number
  line_number: number
}

export const QuranPage: React.FC<QuranPageProps> = ({
  pageNumber,
  onPageChange,
  isLoading = false,
  highlightedWordIndex = null
}) => {
  const [mounted, setMounted] = useState(false)
  const [pageData, setPageData] = useState<VerseData[]>([])
  const [verseWords, setVerseWords] = useState<string[][]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onPageChange(pageNumber + 1) // Next page (since Arabic reads right-to-left)
      } else if (e.key === 'ArrowRight') {
        onPageChange(pageNumber - 1) // Previous page
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pageNumber, onPageChange])

  useEffect(() => {
    setMounted(true)
    fetchPageData()
  }, [pageNumber])

  const fetchPageData = async () => {
    try {
      const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${pageNumber}`)
      const data = await response.json()
      setPageData(data.verses)

      // Split text into words for highlighting
      const words = data.verses.map((verse: VerseData) => 
        verse.text_uthmani.split(' ').filter((word: string) => word.trim().length > 0)
      )
      setVerseWords(words)
    } catch (error) {
      console.error('Error fetching page data:', error)
    }
  }

  // Handle swipe gestures
  useEffect(() => {
    if (!containerRef.current) return
    
    let startX: number
    let startY: number
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return
      
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      
      const diffX = startX - endX
      const diffY = startY - endY
      
      // Only handle horizontal swipes (ignore vertical scrolling)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe left
          onPageChange(pageNumber + 1)
        } else {
          // Swipe right
          onPageChange(pageNumber - 1)
        }
      }
    }
    
    const element = containerRef.current
    element.addEventListener('touchstart', handleTouchStart)
    element.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pageNumber, onPageChange])

  if (!mounted) {
    return null
  }

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      {/* Page Content */}
      <div className="relative rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a]">
        <div className="absolute top-2 right-2 rounded-full bg-[#0A1020]/70 backdrop-blur-sm text-white text-xs px-2 py-1">
          {pageNumber}
        </div>
        
        {/* Page Frame with subtle shadow */}
        <div className="px-4 pt-8 pb-6 sm:px-8 sm:pt-12 sm:pb-10 relative">
          {/* Decorative header */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-100/10 to-transparent" />
          
          {/* Quran text */}
          <div 
            className="text-center"
            style={{
              direction: 'rtl'
            }}
          >
            {pageData.length === 0 ? (
              // Loading skeleton
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="h-7 bg-gray-300 dark:bg-gray-700 rounded w-full" />
                ))}
              </div>
            ) : (
              verseWords.map((words, verseIndex) => (
                <div key={`verse-${pageData[verseIndex].id}`} className="mb-2">
                  {words.map((word, wordIndex) => {
                    // Calculate global word index (simplified for demo)
                    // In a real implementation, you would get actual word indices from the API
                    const globalWordIndex = verseIndex * 20 + wordIndex; // Assuming average 20 words per verse
                    
                    return (
                      <span 
                        key={`word-${verseIndex}-${wordIndex}`}
                        className={`font-arabic text-right inline leading-[2.7] text-[22px] sm:text-[26px] md:text-[28px] ${
                          highlightedWordIndex === globalWordIndex
                            ? 'text-primary bg-primary/10 rounded px-1'
                            : 'text-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {word}{' '}
                      </span>
                    );
                  })}
                  <span className="inline-block mx-1 text-[0.7em] text-gray-500 font-normal align-top">
                    ﴿{pageData[verseIndex].verse_key.split(':')[1]}﴾
                  </span>
                </div>
              ))
            )}
          </div>
          
          {/* Decorative footer */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-100/10 to-transparent" />
        </div>

        {/* Page curl effect */}
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-br from-transparent to-black/5 rounded-tl-lg" />
      </div>

      {/* Additional page navigation for accessibility on desktop */}
      <div className="hidden sm:flex justify-between mt-6">
        <Button
          variant="ghost"
          onClick={() => onPageChange(pageNumber - 1)}
          className="text-gray-400 hover:text-white hover:bg-[#1E293B]"
          aria-label="Previous page"
        >
          <ChevronRight className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="ghost"
          onClick={() => onPageChange(pageNumber + 1)}
          className="text-gray-400 hover:text-white hover:bg-[#1E293B]"
          aria-label="Next page"
        >
          Next
          <ChevronLeft className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A1020]/50 backdrop-blur-sm">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-t-primary animate-spin" />
          </div>
        </div>
      )}
    </div>
  )
} 