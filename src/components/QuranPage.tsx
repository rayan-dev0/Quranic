'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  Moon,
  Maximize2,
  Minimize2,
  Book,
  Type
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface QuranPageProps {
  pageNumber: number
  onPageChange: (newPage: number) => void
  isLoading?: boolean
}

interface QuranPage {
  number: number
  verses: Array<{
    id: number
    verse_key: string
    text_uthmani: string
    page_number: number
    line_number: number
  }>
}

export const QuranPage: React.FC<QuranPageProps> = ({
  pageNumber,
  onPageChange,
  isLoading = false
}) => {
  const [mounted, setMounted] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [leftPageData, setLeftPageData] = useState<QuranPage | null>(null)
  const [rightPageData, setRightPageData] = useState<QuranPage | null>(null)
  const [fontScale, setFontScale] = useState(1.5)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate page numbers for left and right pages
  const totalPages = 604
  const currentLeftPage = pageNumber % 2 === 0 ? pageNumber - 1 : pageNumber
  const currentRightPage = pageNumber % 2 === 0 ? pageNumber : pageNumber + 1

  useEffect(() => {
    setMounted(true)
    fetchBothPages()
  }, [pageNumber])

  const fetchBothPages = async () => {
    try {
      // Fetch both pages in parallel
      const [leftResponse, rightResponse] = await Promise.all([
        fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${currentLeftPage}`),
        fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${currentRightPage}`)
      ])

      const [leftData, rightData] = await Promise.all([
        leftResponse.json(),
        rightResponse.json()
      ])

      setLeftPageData({
        number: currentLeftPage,
        verses: leftData.verses
      })
      setRightPageData({
        number: currentRightPage,
        verses: rightData.verses
      })
    } catch (error) {
      console.error('Error fetching page data:', error)
    }
  }

  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      onPageChange(pageNumber - 2)
    }
  }

  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      onPageChange(pageNumber + 2)
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleFontIncrease = () => {
    setFontScale(prev => Math.min(prev + 0.1, 2))
  }

  const handleFontDecrease = () => {
    setFontScale(prev => Math.max(prev - 0.1, 0.5))
  }

  const handleBrightnessChange = (value: number) => {
    setBrightness(value)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  if (!mounted) return null

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full max-w-7xl mx-auto p-4">
      <div className="flex flex-wrap justify-between items-center w-full mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <span className="text-lg font-semibold text-gray-200">
            Page {currentLeftPage} - {currentRightPage}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={pageNumber >= totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="text-gray-400 hover:text-white"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400 w-16 text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="text-gray-400 hover:text-white"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFontDecrease}
              disabled={fontScale <= 0.5}
              className="text-gray-400 hover:text-white"
              aria-label="Decrease font size"
            >
              <Type className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400 w-16 text-center">
              {Math.round(fontScale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFontIncrease}
              disabled={fontScale >= 2}
              className="text-gray-400 hover:text-white"
              aria-label="Increase font size"
            >
              <Type className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-gray-400" />
            <Slider
              value={[brightness]}
              onValueChange={([value]) => handleBrightnessChange(value)}
              min={50}
              max={150}
              step={5}
              className="w-24"
              aria-label="Adjust brightness"
            />
            <Sun className="h-4 w-4 text-gray-400" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div 
        className={cn(
          "flex flex-col md:flex-row w-full transition-all duration-300",
          isFullscreen ? "h-[calc(100vh-8rem)]" : "h-[calc(100vh-10rem)]"
        )}
        style={{
          filter: `brightness(${brightness}%)`
        }}
      >
        {/* Book container */}
        <div className="relative w-full flex h-full">
          <div 
            className={cn(
              "flex flex-row w-full h-full rounded-lg overflow-hidden",
              "bg-[#0f1117] shadow-2xl transition-all duration-300",
              "before:absolute before:inset-0 before:bg-gradient-to-r before:from-black/20 before:via-transparent before:to-black/20"
            )}
          >
            {/* Right Page (Arabic reads right-to-left) */}
            <motion.div 
              className={cn(
                "relative w-1/2 h-full bg-[#1a1a1a] transition-all duration-300",
                "border-r border-[#2a2a2a]/20",
                "transform-gpu"
              )}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'right center'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {currentRightPage > 0 && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div 
                    className="absolute inset-0 px-12 py-16 overflow-y-auto"
                    style={{
                      direction: 'rtl',
                      fontSize: `${1.2 * fontScale}rem`,
                      lineHeight: 2.5,
                      letterSpacing: '0.01em',
                      textAlign: 'justify',
                      textJustify: 'inter-word'
                    }}
                  >
                    {rightPageData?.verses.map(verse => (
                      <span 
                        key={verse.id}
                        className="font-arabic text-right leading-relaxed inline-block"
                        style={{ wordSpacing: '0.1em' }}
                      >
                        {verse.text_uthmani}{' '}
                        <span className="inline-block mx-1 text-[0.85em] text-gray-500 font-normal">
                          ﴿{verse.verse_key}﴾
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Left Page */}
            <motion.div 
              className={cn(
                "relative w-1/2 h-full bg-[#1a1a1a] transition-all duration-300",
                "border-l border-[#2a2a2a]/20",
                "transform-gpu"
              )}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'left center'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {currentLeftPage > 0 && currentLeftPage <= totalPages && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div 
                    className="absolute inset-0 px-12 py-16 overflow-y-auto"
                    style={{
                      direction: 'rtl',
                      fontSize: `${1.2 * fontScale}rem`,
                      lineHeight: 2.5,
                      letterSpacing: '0.01em',
                      textAlign: 'justify',
                      textJustify: 'inter-word'
                    }}
                  >
                    {leftPageData?.verses.map(verse => (
                      <span 
                        key={verse.id}
                        className="font-arabic text-right leading-relaxed inline-block"
                        style={{ wordSpacing: '0.1em' }}
                      >
                        {verse.text_uthmani}{' '}
                        <span className="inline-block mx-1 text-[0.85em] text-gray-500 font-normal">
                          ﴿{verse.verse_key}﴾
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Book spine shadow effect */}
            <div className="absolute inset-y-0 left-1/2 w-[2px] bg-gradient-to-r from-black/20 to-transparent transform -translate-x-1/2" />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Keyboard navigation hint */}
      <div className="mt-4 text-sm text-gray-400 text-center">
        Use arrow keys (←/→) for navigation, (+/-) for zoom, and (F) for fullscreen
      </div>
    </div>
  )
}

// Add keyboard navigation
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return // Don't handle if typing in an input

    switch (e.key) {
      case 'ArrowLeft': {
        const button = document.querySelector('[aria-label="Previous page"]') as HTMLButtonElement
        button?.click()
        break
      }
      case 'ArrowRight': {
        const button = document.querySelector('[aria-label="Next page"]') as HTMLButtonElement
        button?.click()
        break
      }
      case '+':
      case '=': {
        const button = document.querySelector('[aria-label="Zoom in"]') as HTMLButtonElement
        button?.click()
        break
      }
      case '-':
      case '_': {
        const button = document.querySelector('[aria-label="Zoom out"]') as HTMLButtonElement
        button?.click()
        break
      }
      case 'f':
      case 'F': {
        const button = document.querySelector('[aria-label="Toggle fullscreen"]') as HTMLButtonElement
        button?.click()
        break
      }
    }
  })
} 