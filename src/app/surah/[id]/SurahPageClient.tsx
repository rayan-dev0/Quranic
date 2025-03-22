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

export default function SurahPageClient() {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [surahData, versesData] = await Promise.all([
          getSurah(surahId),
          getVerses(surahId, currentLanguage?.id || 'en')
        ])
        setSurah(surahData)
        setVerses(versesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [surahId, currentLanguage?.id])

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
    <div className="min-h-screen bg-[#0A1020] pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#0F172A] rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-semibold shadow-lg">
              {surah.id}
            </div>
            
            <div className="flex-grow">
              <div className="text-5xl font-arabic text-gray-200 mb-2">
                {surah.name_arabic}
              </div>
              <h1 className="text-2xl font-semibold text-gray-100 mb-1">
                {surah.name_simple}
              </h1>
              <p className="text-lg text-gray-400 mb-4">
                {surah.translated_name.name}
              </p>
              <div className="flex items-center gap-x-6 text-sm text-gray-400">
                <p className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  {surah.verses_count} Verses
                </p>
                <p className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  {surah.revelation_place}
                </p>
              </div>
            </div>
          </div>
        </div>

        {surah.bismillah_pre && (
          <div className="text-center py-12">
            <p className="text-4xl font-arabic text-gray-200 mb-3">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="text-sm text-gray-400">In the name of Allah, the Entirely Merciful, the Especially Merciful</p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {verses.map(verse => (
            <div key={verse.id} className="bg-[#0F172A] rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 text-sm font-medium">
                  {verse.verse_number}
                </div>
                <div className="space-y-4 flex-grow">
                  <p dir="rtl" className="text-2xl font-arabic text-right leading-loose text-gray-100">
                    {verse.text_uthmani}
                  </p>
                  <p className="leading-relaxed text-gray-400">
                    {verse.translations[0]?.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 