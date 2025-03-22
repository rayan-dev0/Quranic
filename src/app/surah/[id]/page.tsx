'use client'

import { useEffect, useState, useRef, useCallback, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { 
  getSurah, 
  getVerses, 
  getCurrentJuz, 
  getJuzData, 
  getVerseAudio,
  preloadVerseAudio,
  getCachedAudio,
  cleanupAudioCache,
  Chapter, 
  Verse, 
  Juz, 
  RECITERS, 
  Reciter 
} from '@/lib/quran-api'
import { ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, BookOpen, Share2, Download, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInView } from 'react-intersection-observer'
import * as HoverCard from '@radix-ui/react-hover-card'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import html2canvas from 'html2canvas'
import { useLanguage } from '@/contexts/LanguageContext'

const IslamicPattern = () => (
  <svg className="absolute inset-0 -z-10 h-full w-full stroke-gray-200/5 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]">
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

const VERSES_PER_PAGE = 10

const ArabicWord = ({ 
  text, 
  translation,
  className 
}: { 
  text: string
  translation: string
  className?: string
}) => {
  const { currentLanguage } = useLanguage()

  return (
    <HoverCard.Root openDelay={100} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <span className={cn(
          "inline-block px-1 rounded transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400 cursor-help relative",
          "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500/0 hover:after:bg-blue-500/50 after:transition-all after:duration-200",
          className
        )}>
          {text}
        </span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="z-50 data-[side=bottom]:animate-slideUpAndFade data-[side=right]:animate-slideLeftAndFade data-[side=left]:animate-slideRightAndFade data-[side=top]:animate-slideDownAndFade w-[300px] rounded-xl bg-[#1E293B] p-5 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] data-[state=open]:transition-all"
          side="bottom"
          align="center"
          sideOffset={5}
        >
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="text-lg font-arabic text-blue-400">{text}</div>
              <div className="bg-blue-500/10 rounded-full px-2 py-0.5 text-xs text-blue-400">
                {currentLanguage.id === 'ar' ? 'كلمة قرآنية' : 
                 currentLanguage.id === 'ur' ? 'قرآنی لفظ' :
                 'Arabic Word'}
              </div>
            </div>
            <div className="space-y-2">
              <div className={cn(
                "text-sm text-gray-300 leading-relaxed",
                currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'
              )}>
                {translation}
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-2" />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BookOpen className="h-3 w-3" />
                <span>
                  {currentLanguage.id === 'ar' ? 'انقر على الآية للاستماع' :
                   currentLanguage.id === 'ur' ? 'سننے کے لیے آیت پر کلک کریں' :
                   currentLanguage.id === 'fr' ? 'Cliquez sur le verset pour écouter' :
                   currentLanguage.id === 'id' ? 'Klik ayat untuk mendengarkan' :
                   currentLanguage.id === 'tr' ? 'Dinlemek için ayete tıklayın' :
                   'Click verse to play audio'}
                </span>
              </div>
            </div>
          </div>
          <HoverCard.Arrow className="fill-[#1E293B]" width={12} height={6} />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

const ShareCard = forwardRef<HTMLDivElement, {
  verse: Verse
  surahName: string
  surahNumber: number
  onClose: () => void
}>(({ verse, surahName, surahNumber, onClose }, ref) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const { currentLanguage } = useLanguage()

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return
    setIsDownloading(true)
    
    try {
      // Create a container with fixed width and padding
      const container = document.createElement('div')
      container.style.width = '600px' // Fixed width for consistent output
      container.style.padding = '32px'
      container.style.background = '#0A1020'
      container.style.boxSizing = 'border-box'
      
      // Clone the card content
      const cardClone = cardRef.current.cloneNode(true) as HTMLElement
      cardClone.style.width = '100%'
      cardClone.style.maxWidth = '100%'
      container.appendChild(cardClone)
      
      // Add container to body temporarily
      document.body.appendChild(container)

      const canvas = await html2canvas(container, {
        backgroundColor: '#0A1020',
        scale: 2,
        onclone: (document, element) => {
          // Ensure Arabic text is rendered correctly
          const arabicElements = element.getElementsByClassName('arabic-text')
          Array.from(arabicElements).forEach(el => {
            const htmlEl = el as HTMLElement
            htmlEl.setAttribute('dir', 'rtl')
            // Increase Arabic text size
            htmlEl.style.fontSize = '2rem'
            htmlEl.style.lineHeight = '2'
          })
          
          // Add extra styling to the cloned element
          const cardElement = element.firstChild as HTMLElement
          if (cardElement) {
            cardElement.style.borderRadius = '16px'
            cardElement.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            cardElement.style.width = '100%'
            cardElement.style.maxWidth = '100%'
            
            // Adjust padding and spacing
            cardElement.style.padding = '24px'
            const contentDivs = cardElement.getElementsByTagName('div')
            Array.from(contentDivs).forEach(div => {
              const htmlDiv = div as HTMLElement
              if (htmlDiv.classList.contains('space-y-4')) {
                htmlDiv.style.marginTop = '24px'
                htmlDiv.style.marginBottom = '24px'
              }
            })
          }
        }
      })
      
      // Remove the temporary container
      document.body.removeChild(container)
      
      const link = document.createElement('a')
      link.download = `${surahName}-verse-${verse.verse_number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyText = async () => {
    if (isCopying) return
    setIsCopying(true)
    
    try {
      const text = `${verse.text_uthmani}\n\n${verse.translations[0]?.text}\n\n- Surah ${surahName} (${surahNumber}:${verse.verse_number})`
      await navigator.clipboard.writeText(text)
      alert('Verse copied to clipboard!')
    } catch (error) {
      console.error('Error copying text:', error)
      alert('Failed to copy text. Please try again.')
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="p-2 rounded-full hover:bg-blue-500/10 transition-colors">
          <Share2 className="h-4 w-4 text-blue-500" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 z-50">
          <div className="bg-[#1E293B] rounded-xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div ref={cardRef} className="bg-[#0F172A] rounded-xl p-6 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="text-blue-500 font-semibold">{verse.verse_number}</span>
                    </div>
                    <div>
                      <h3 className={cn(
                        "text-gray-200 font-semibold",
                        currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'
                      )}>
                        {currentLanguage.direction === 'rtl' ? `سورة ${surahName}` : `Surah ${surahName}`}
                      </h3>
                      <p className={cn(
                        "text-gray-400 text-sm",
                        currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'
                      )}>
                        {currentLanguage.direction === 'rtl' ? `آية ${verse.verse_number}` : `Verse ${verse.verse_number}`}
                      </p>
                    </div>
                  </div>
                  <div className="h-8 w-8">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="space-y-6">
                  <p dir="rtl" className="arabic-text text-3xl font-arabic text-right leading-loose text-gray-100 mt-4">
                    {verse.text_uthmani}
                  </p>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                  <p className={cn(
                    "leading-relaxed text-gray-300 text-lg",
                    currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'
                  )} dir={currentLanguage.direction}>
                    {verse.translations[0]?.text}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {currentLanguage.direction === 'rtl' ? 'تحميل' : 'Download'}
                  </button>
                  <button
                    onClick={handleCopyText}
                    disabled={isCopying}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    {isCopying ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {currentLanguage.direction === 'rtl' ? 'نسخ' : 'Copy Text'}
                  </button>
                </div>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-300">
                    {currentLanguage.direction === 'rtl' ? 'إغلاق' : 'Close'}
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

const ReadingSettings = ({
  textSize,
  onTextSizeChange,
  showTranslation,
  onShowTranslationChange,
  showWordByWord,
  onShowWordByWordChange
}: {
  textSize: number
  onTextSizeChange: (size: number) => void
  showTranslation: boolean
  onShowTranslationChange: (show: boolean) => void
  showWordByWord: boolean
  onShowWordByWordChange: (show: boolean) => void
}) => {
  return (
    <div className="bg-[#0F172A] rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTextSizeChange(Math.max(0.8, textSize - 0.1))}
              className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
              aria-label="Decrease text size"
            >
              <span className="text-lg">A-</span>
            </Button>
            <div className="w-24 h-1 bg-gray-800/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                style={{ width: `${((textSize - 0.8) / 1.2) * 100}%` }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTextSizeChange(Math.min(2, textSize + 0.1))}
              className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
              aria-label="Increase text size"
            >
              <span className="text-lg">A+</span>
            </Button>
          </div>
          <span className="text-sm text-gray-400">
            {Math.round(textSize * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button
            variant="ghost"
            onClick={() => onShowTranslationChange(!showTranslation)}
            className={cn(
              "px-4 rounded-full text-sm",
              showTranslation 
                ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            Translation
          </Button>
          <Button
            variant="ghost"
            onClick={() => onShowWordByWordChange(!showWordByWord)}
            className={cn(
              "px-4 rounded-full text-sm",
              showWordByWord 
                ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            Word by Word
          </Button>
        </div>
      </div>
    </div>
  )
}

const VerseCard = forwardRef<HTMLDivElement, { 
  verse: Verse
  isActive: boolean
  index: number
  onPlay: () => void
  surahName: string
  surahNumber: number
  textSize: number
  showTranslation: boolean
  showWordByWord: boolean
}>(({ 
  verse, 
  isActive, 
  index, 
  onPlay, 
  surahName, 
  surahNumber,
  textSize,
  showTranslation,
  showWordByWord
}, ref) => {
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })
  const { currentLanguage } = useLanguage()

  // Split Arabic text into words and get their positions
  const arabicWords = verse.text_uthmani.split(' ')
  const translation = verse.translations[0]?.text || ''
  
  // Create word-by-word translations by splitting the translation
  // into roughly proportional segments based on Arabic word count
  const translationWords = translation.split(/\s+/)
  const wordTranslations = arabicWords.map((_, index) => {
    const totalWords = arabicWords.length
    const translationLength = translationWords.length
    
    // Calculate start and end indices for this word's translation
    const startIndex = Math.floor((index / totalWords) * translationLength)
    const endIndex = Math.floor(((index + 1) / totalWords) * translationLength)
    
    // Join the words for this segment
    return {
      translation: translationWords.slice(startIndex, endIndex).join(' ')
    }
  })

  // Merge the refs
  const mergeRefs = (element: HTMLDivElement) => {
    if (typeof ref === 'function') {
      ref(element)
    } else if (ref) {
      ref.current = element
    }
    inViewRef(element)
  }

  return (
    <motion.div
      ref={mergeRefs}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className={`group relative bg-[#0F172A] rounded-xl p-6 shadow-lg transition-all duration-300 hover:bg-[#1a2234] ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 text-sm font-medium">
            {verse.verse_number}
          </div>
          <div className="flex-grow space-y-4">
            <div className="flex items-start justify-between">
              <p 
                dir="rtl" 
                className="text-2xl font-arabic text-right leading-loose text-gray-100 flex-grow"
                style={{ fontSize: `${2 * textSize}rem` }}
              >
                {showWordByWord ? (
                  arabicWords.map((word, index) => (
                    <ArabicWord
                      key={index}
                      text={word}
                      translation={wordTranslations[index].translation}
                      className="mx-1"
                    />
                  ))
                ) : (
                  verse.text_uthmani
                )}
              </p>
              <div className="flex items-center gap-2 ml-4">
                <ShareCard
                  verse={verse}
                  surahName={surahName}
                  surahNumber={surahNumber}
                  onClose={() => {}}
                />
                <button onClick={onPlay} className="p-2 rounded-full hover:bg-blue-500/10 transition-colors">
                  <Play className="h-4 w-4 text-blue-500" />
                </button>
              </div>
            </div>
            {showTranslation && (
              <p 
                className={cn(
                  "leading-relaxed text-gray-400",
                  currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'
                )}
                style={{ fontSize: `${1 * textSize}rem` }}
              >
                {verse.translations[0]?.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

const AudioPlayer = ({ 
  verse, 
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  currentTime,
  duration,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  isLoading,
  reciterName
}: {
  verse: Verse | null
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrevious: () => void
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  volume: number
  isMuted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  isLoading: boolean
  reciterName: string
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A1020] to-[#0F172A]/95 backdrop-blur-lg border-t border-gray-800/50 transition-all duration-300">
      {/* Mobile Design */}
      <div className="md:hidden">
        {/* Progress Bar */}
        <div className="relative h-1 bg-gray-800/50">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek time"
          />
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        <div className="px-4 pt-3 pb-6">
          {/* Time and Verse Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-lg font-medium text-gray-200">
                Verse {verse?.verse_number}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                {reciterName}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-400 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              className="h-14 w-14 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
              aria-label="Previous verse"
            >
              <SkipBack className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={isPlaying ? onPause : onPlay}
              disabled={isLoading}
              className={cn(
                "h-20 w-20 rounded-full",
                "bg-gradient-to-br from-blue-500 to-blue-600",
                "hover:from-blue-400 hover:to-blue-500",
                "disabled:opacity-50 shadow-lg shadow-blue-500/20",
                "ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#0A1020]"
              )}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <div className="h-10 w-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-10 w-10 text-white" />
              ) : (
                <Play className="h-10 w-10 text-white translate-x-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              className="h-14 w-14 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
              aria-label="Next verse"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Design */}
      <div className="hidden md:block">
        <div className="container mx-auto max-w-7xl">
          {/* Progress Bar */}
          <div className="relative h-1 bg-gray-800/50">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek time"
            />
            <div
              className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-8">
              {/* Left Section: Verse Info */}
              <div className="flex items-center gap-6 min-w-[200px]">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-200">
                    Verse {verse?.verse_number}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    {reciterName}
                  </span>
                </div>
              </div>

              {/* Center Section: Main Controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrevious}
                  className="h-10 w-10 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
                  aria-label="Previous verse"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isPlaying ? onPause : onPlay}
                  disabled={isLoading}
                  className={cn(
                    "h-14 w-14 rounded-full",
                    "bg-gradient-to-br from-blue-500 to-blue-600",
                    "hover:from-blue-400 hover:to-blue-500",
                    "disabled:opacity-50 shadow-lg shadow-blue-500/20",
                    "ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#0A1020]"
                  )}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading ? (
                    <div className="h-7 w-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-7 w-7 text-white" />
                  ) : (
                    <Play className="h-7 w-7 text-white translate-x-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                  className="h-10 w-10 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
                  aria-label="Next verse"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Right Section: Volume & Time */}
              <div className="flex items-center gap-6 min-w-[200px] justify-end">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleMute}
                    className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="relative w-24 h-1 bg-gray-800/50 rounded-full">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onVolumeChange(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Adjust volume"
                    />
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-400 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SurahPage() {
  const router = useRouter()
  const params = useParams()
  const surahId = Number(params.id)
  const { currentLanguage } = useLanguage()
  const [surah, setSurah] = useState<Chapter | null>(null)
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [activeVerse, setActiveVerse] = useState<number | null>(null)
  const [currentJuz, setCurrentJuz] = useState<number | null>(null)
  const [juzData, setJuzData] = useState<Juz | null>(null)
  const [displayedVerses, setDisplayedVerses] = useState<Verse[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0])
  const [textSize, setTextSize] = useState(1)
  const [showTranslation, setShowTranslation] = useState(true)
  const [showWordByWord, setShowWordByWord] = useState(true)

  // Intersection observer for infinite scroll
  const { ref: scrollRef, inView } = useInView({
    threshold: 0,
  })

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [surahData, versesData] = await Promise.all([
          getSurah(surahId),
          getVerses(surahId, currentLanguage.id)
        ])
        setSurah(surahData)
        setVerses(versesData)
        setDisplayedVerses(versesData.slice(0, VERSES_PER_PAGE))
        setHasMore(versesData.length > VERSES_PER_PAGE)
        setPage(1)
        setCurrentVerseIndex(0)
        setIsPlaying(false)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }

        const juzNumber = await getCurrentJuz(surahId, 1)
        setCurrentJuz(juzNumber)
        const juzInfo = await getJuzData(juzNumber)
        setJuzData(juzInfo)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [surahId])

  // Refetch verses when language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setLoading(true)
        const versesData = await getVerses(surahId, currentLanguage.id)
        setVerses(versesData)
        setDisplayedVerses(versesData.slice(0, page * VERSES_PER_PAGE))
        setHasMore(versesData.length > page * VERSES_PER_PAGE)
      } catch (error) {
        console.error('Error fetching translations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (surahId) {
      fetchTranslations()
    }
  }, [currentLanguage.id, surahId, page])

  const loadMoreVerses = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    const nextPage = page + 1
    const start = (nextPage - 1) * VERSES_PER_PAGE
    const end = start + VERSES_PER_PAGE
    const newVerses = verses.slice(start, end)

    setDisplayedVerses(prev => [...prev, ...newVerses])
    setPage(nextPage)
    setHasMore(end < verses.length)
    setIsLoadingMore(false)
  }, [page, verses, hasMore, isLoadingMore])

  useEffect(() => {
    if (inView && hasMore) {
      loadMoreVerses()
    }
  }, [inView, loadMoreVerses, hasMore])

  const audioManager = useCallback(async (verseIndex: number) => {
    if (isAudioLoading || !verses[verseIndex]) return

    try {
      setIsAudioLoading(true)
      setCurrentVerseIndex(verseIndex)
      
      // Stop current playback before loading new audio
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        } catch (error) {
          console.warn('Error stopping current playback:', error)
        }
      }
      
      const verse = verses[verseIndex]
      const verseKey = `${surahId}:${verse.verse_number}`
      
      // Check if we have a cached audio element first
      let audio = getCachedAudio(verseKey, selectedReciter.id)
      
      if (!audio) {
        // If no cached audio, get the URL and create a new audio element
        const audioUrl = await getVerseAudio(verseKey, selectedReciter.id)
        
        if (!audioRef.current) return
        
        audio = audioRef.current
        audio.src = audioUrl
        audio.volume = isMuted ? 0 : volume
        audio.crossOrigin = 'anonymous'
        
        // Create a promise that resolves when the audio is ready
        await new Promise<void>((resolve, reject) => {
          let retryCount = 0
          const maxRetries = 3
          let isAborted = false
          
          const loadHandler = () => {
            if (isAborted) return
            audio!.removeEventListener('loadeddata', loadHandler)
            audio!.removeEventListener('error', errorHandler)
            resolve()
          }
          
          const errorHandler = async (error: Event) => {
            if (isAborted) return
            console.error('Audio loading error:', error)
            if (retryCount < maxRetries) {
              retryCount++
              console.log(`Retrying audio load (attempt ${retryCount}/${maxRetries})...`)
              
              try {
                // Try to get a new URL on retry
                const newAudioUrl = await getVerseAudio(verseKey, selectedReciter.id)
                if (!isAborted) {
                  audio!.src = newAudioUrl
                  audio!.load()
                  await new Promise(r => setTimeout(r, 1000)) // Small delay before retry
                }
              } catch (urlError) {
                if (!isAborted) {
                  console.error('Failed to get new audio URL:', urlError)
                  audio!.removeEventListener('loadeddata', loadHandler)
                  audio!.removeEventListener('error', errorHandler)
                  reject(new Error('Failed to load audio from all available sources'))
                }
              }
            } else {
              if (!isAborted) {
                audio!.removeEventListener('loadeddata', loadHandler)
                audio!.removeEventListener('error', errorHandler)
                reject(new Error('Failed to load audio after multiple attempts'))
              }
            }
          }
          
          audio!.addEventListener('loadeddata', loadHandler)
          audio!.addEventListener('error', errorHandler)
          
          // Cleanup function
          return () => {
            isAborted = true
            audio!.removeEventListener('loadeddata', loadHandler)
            audio!.removeEventListener('error', errorHandler)
          }
        })
      } else {
        // Use the cached audio element
        if (!audioRef.current) return
        audioRef.current.src = audio.src
        audioRef.current.volume = isMuted ? 0 : volume
        audioRef.current.currentTime = 0
        audioRef.current.crossOrigin = 'anonymous'
        
        // Wait for the audio to be ready
        await new Promise<void>((resolve) => {
          const audio = audioRef.current
          if (!audio) {
            resolve()
            return
          }
          const loadHandler = () => {
            audio.removeEventListener('canplaythrough', loadHandler)
            resolve()
          }
          audio.addEventListener('canplaythrough', loadHandler, { once: true })
          audio.load()
        })
      }

      // Start playback
      try {
        const playPromise = audioRef.current?.play()
        if (playPromise !== undefined) {
          await playPromise
          setIsPlaying(true)
          setActiveVerse(verse.verse_number)
          
          // Preload next verse
          if (verseIndex < verses.length - 1) {
            const nextVerse = verses[verseIndex + 1]
            const nextVerseKey = `${surahId}:${nextVerse.verse_number}`
            preloadVerseAudio(nextVerseKey, selectedReciter.id).catch(console.error)
          }
          
          // Clean up old cached audio elements
          cleanupAudioCache(10)
        }
      } catch (playError: unknown) {
        if (playError instanceof Error && playError.name === 'AbortError') {
          console.warn('Playback aborted, likely due to user interaction or navigation')
        } else {
          console.error('Playback error:', playError)
          throw new Error('Failed to play audio')
        }
      }
    } catch (error: any) {
      console.error('Error playing verse:', error)
      setIsPlaying(false)
      alert(`Error playing audio: ${error.message || 'Unknown error'}. Please try again or select a different reciter.`)
    } finally {
      setIsAudioLoading(false)
    }
  }, [verses, surahId, selectedReciter.id, volume, isMuted])

  // Handle cleanup when component unmounts or surah changes
  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.src = ''
        audio.load()
      }
      cleanupAudioCache(0)
    }
  }, [surahId])

  // Handle Juz navigation with continuous playback
  const handleJuzNavigation = useCallback(async (direction: 'prev' | 'next') => {
    if (!currentJuz) return
    
    const targetJuz = direction === 'next' 
      ? Math.min(currentJuz + 1, 30)
      : Math.max(currentJuz - 1, 1)

    if (targetJuz === currentJuz) return

    try {
      // Stop current playback before navigation
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }

      const juzInfo = await getJuzData(targetJuz)
      // Get the first surah and verse in the target Juz
      const firstSurahNumber = Number(Object.keys(juzInfo.verse_mapping)[0])
      
      // Store the intent to play in sessionStorage
      sessionStorage.setItem('autoPlayAfterNavigation', 'true')
      
      // Navigate to the new surah
      router.push(`/surah/${firstSurahNumber}`)
    } catch (error) {
      console.error('Error navigating to Juz:', error)
    }
  }, [currentJuz, router])

  // Handle auto-play after navigation
  useEffect(() => {
    const shouldAutoPlay = sessionStorage.getItem('autoPlayAfterNavigation') === 'true'
    if (shouldAutoPlay && !loading && verses.length > 0) {
      // Clear the auto-play flag
      sessionStorage.removeItem('autoPlayAfterNavigation')
      // Start playback from the first verse
      audioManager(0).catch(console.error)
    }
  }, [loading, verses, audioManager])

  // Update the audio ended handler to handle transitions between surahs
  const handleNextVerse = useCallback(async () => {
    if (currentVerseIndex < verses.length - 1) {
      // Small delay before starting next verse to prevent interruption
      await new Promise(resolve => setTimeout(resolve, 100))
      await audioManager(currentVerseIndex + 1)
    } else if (surahId < 114) {
      // Store the intent to continue playing
      sessionStorage.setItem('autoPlayAfterNavigation', 'true')
      // Navigate to next surah
      router.push(`/surah/${surahId + 1}`)
    }
  }, [currentVerseIndex, verses.length, surahId, router, audioManager])

  const handlePreviousVerse = useCallback(async () => {
    if (currentVerseIndex > 0) {
      await audioManager(currentVerseIndex - 1)
    } else if (surahId > 1) {
      // Store the intent to continue playing
      sessionStorage.setItem('autoPlayAfterNavigation', 'true')
      // Get the previous surah's verses to start from the last one
      const prevSurahVerses = await getVerses(surahId - 1)
      sessionStorage.setItem('startFromVerse', String(prevSurahVerses.length - 1))
      // Navigate to previous surah
      router.push(`/surah/${surahId - 1}`)
    }
  }, [currentVerseIndex, surahId, router, audioManager])

  // Handle starting from specific verse after navigation
  useEffect(() => {
    const startFromVerse = sessionStorage.getItem('startFromVerse')
    const shouldAutoPlay = sessionStorage.getItem('autoPlayAfterNavigation') === 'true'
    
    if (!loading && verses.length > 0 && shouldAutoPlay) {
      // Clear the flags
      sessionStorage.removeItem('autoPlayAfterNavigation')
      sessionStorage.removeItem('startFromVerse')
      
      // Start playback from the specified verse or the first verse
      const verseIndex = startFromVerse ? parseInt(startFromVerse, 10) : 0
      audioManager(verseIndex).catch(console.error)
    }
  }, [loading, verses, audioManager])

  // Clean up navigation flags when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('autoPlayAfterNavigation')
      sessionStorage.removeItem('startFromVerse')
    }
  }, [])

  // Update the cleanup when changing reciters
  const handleReciterChange = useCallback((reciterId: string) => {
    const reciter = RECITERS.find(r => r.id === reciterId)
    if (reciter) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlaying(false)
      }
      setSelectedReciter(reciter)
      // Clear both URL and audio element caches when changing reciters
      cleanupAudioCache(0)
      setActiveVerse(null)
    }
  }, [])

  const handlePlay = useCallback(() => {
    if (!audioRef.current || isAudioLoading) return
    audioManager(currentVerseIndex)
  }, [audioManager, currentVerseIndex, isAudioLoading])

  const handlePause = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!audioRef.current) return
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return
    const newMuted = !isMuted
    audioRef.current.volume = newMuted ? 0 : volume
    setIsMuted(newMuted)
  }, [isMuted, volume])

  // Set up audio event listeners
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      handleNextVerse()
    }
    const handleError = () => {
      console.error('Audio error:', audio.error)
      setIsPlaying(false)
      setIsAudioLoading(false)
    }
    const handleCanPlay = () => setIsAudioLoading(false)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [handleNextVerse])

  // Preload next verse
  useEffect(() => {
    if (verses.length === 0 || currentVerseIndex >= verses.length - 1) return
    const nextVerse = verses[currentVerseIndex + 1]
    const nextVerseKey = `${surahId}:${nextVerse.verse_number}`
    preloadVerseAudio(nextVerseKey, selectedReciter.id)
  }, [currentVerseIndex, verses, surahId, selectedReciter.id])

  if (loading || !surah) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0A1020]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-t-primary animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0A1020] pb-32"
    >
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        onError={(e) => {
          const error = (e.target as HTMLAudioElement).error
          console.error('Audio error:', error)
          setIsAudioLoading(false)
          setIsPlaying(false)
          if (error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            alert('This audio format is not supported by your browser. Please try a different reciter.')
          } else if (error?.code === MediaError.MEDIA_ERR_NETWORK) {
            alert('Network error while loading audio. Please check your connection and try again.')
          } else {
            alert(`Error loading audio: ${error?.message || 'Unknown error'}. Please try again or select a different reciter.`)
          }
        }}
        onCanPlay={() => {
          setIsAudioLoading(false)
        }}
        onWaiting={() => {
          setIsAudioLoading(true)
        }}
        onPlaying={() => {
          setIsAudioLoading(false)
          setIsPlaying(true)
        }}
        onPause={() => {
          setIsPlaying(false)
        }}
        onEnded={() => {
          setIsPlaying(false)
          handleNextVerse()
        }}
      />
      
      <IslamicPattern />
      
      <div className="container mx-auto px-4">
        <div className="py-8">
          <ReadingSettings
            textSize={textSize}
            onTextSizeChange={setTextSize}
            showTranslation={showTranslation}
            onShowTranslationChange={setShowTranslation}
            showWordByWord={showWordByWord}
            onShowWordByWordChange={setShowWordByWord}
          />

          <motion.div
            layoutId={`surah-card-${surahId}`}
            className="relative overflow-hidden rounded-2xl bg-[#0F172A] shadow-xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full" />
            
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handlePreviousVerse()}
                    disabled={surahId === 1}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Previous Surah
                  </Button>
                  {currentJuz && (
                    <Button
                      variant="ghost"
                      onClick={() => handleJuzNavigation('prev')}
                      disabled={currentJuz === 1}
                      className="text-gray-400 hover:text-white"
                    >
                      <BookOpen className="h-5 w-5 mr-2" />
                      Previous Juz
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {currentJuz && (
                    <Button
                      variant="ghost"
                      onClick={() => handleJuzNavigation('next')}
                      disabled={currentJuz === 30}
                      className="text-gray-400 hover:text-white"
                    >
                      Next Juz
                      <BookOpen className="h-5 w-5 ml-2" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => handleNextVerse()}
                    disabled={surahId === 114}
                    className="text-gray-400 hover:text-white"
                  >
                    Next Surah
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <motion.div
                  layoutId={`surah-number-${surahId}`}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-semibold shadow-lg"
                >
                  {surah.id}
                </motion.div>
                
                <div className="flex-grow">
                  <motion.div
                    layoutId={`surah-arabic-${surahId}`}
                    className="text-5xl font-arabic text-gray-200 mb-2"
                  >
                    {surah.name_arabic}
                  </motion.div>
                  <motion.h1
                    layoutId={`surah-title-${surahId}`}
                    className="text-2xl font-semibold text-gray-100 mb-1"
                  >
                    {surah.name_simple}
                  </motion.h1>
                  <motion.p
                    layoutId={`surah-translation-${surahId}`}
                    className="text-lg text-gray-400 mb-4"
                  >
                    {surah.translated_name.name}
                  </motion.p>
                  <motion.div
                    layoutId={`surah-meta-${surahId}`}
                    className="flex items-center gap-x-6 text-sm text-gray-400"
                  >
                    <p className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      {surah.verses_count} Verses
                    </p>
                    <p className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      {surah.revelation_place}
                    </p>
                    {currentJuz && (
                      <p className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                        Juz {currentJuz}
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {surah.bismillah_pre && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <p className="text-4xl font-arabic text-gray-200 mb-3">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              <p className="text-sm text-gray-400">In the name of Allah, the Entirely Merciful, the Especially Merciful</p>
            </motion.div>
          )}

          <div className="container mx-auto px-4 mb-8">
            <div className="flex items-center gap-4 bg-[#0F172A] p-4 rounded-xl">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2">Select Reciter</label>
                <select
                  value={selectedReciter.id}
                  onChange={(e) => handleReciterChange(e.target.value)}
                  className="w-full bg-[#1a2234] text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {RECITERS.map(reciter => (
                    <option key={reciter.id} value={reciter.id}>
                      {reciter.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6 mt-8">
            <AnimatePresence mode="popLayout">
              {displayedVerses.map((verse, index) => (
                <VerseCard
                  key={verse.id}
                  verse={verse}
                  isActive={activeVerse === verse.verse_number}
                  index={index}
                  onPlay={() => audioManager(verses.findIndex(v => v.id === verse.id))}
                  surahName={surah.name_simple}
                  surahNumber={surah.id}
                  textSize={textSize}
                  showTranslation={showTranslation}
                  showWordByWord={showWordByWord}
                />
              ))}
            </AnimatePresence>

            {hasMore && (
              <div
                ref={scrollRef}
                className="flex justify-center py-8"
              >
                <div className="relative h-8 w-8">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
                  <div className="absolute inset-1 rounded-full border-2 border-t-blue-500 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AudioPlayer
        verse={verses[currentVerseIndex] || null}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNextVerse}
        onPrevious={handlePreviousVerse}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
        isLoading={isAudioLoading}
        reciterName={selectedReciter.name}
      />
    </motion.div>
  )
} 