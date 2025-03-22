'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AudioPlayer } from '@/components/AudioPlayer'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Verse {
  id: number
  verse_number: number
  text_uthmani: string
  text_indopak: string
  translation_eng: string
  audio_url: string
}

interface VerseViewProps {
  surahNumber: number
  verses: Verse[]
  onVerseChange: (verseNumber: number) => void
  currentVerse: number
}

export function VerseView({
  surahNumber,
  verses,
  onVerseChange,
  currentVerse
}: VerseViewProps) {
  const [mounted, setMounted] = useState(false)
  const [showTranslation, setShowTranslation] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentVerseData = verses.find(v => v.verse_number === currentVerse)

  const handlePreviousVerse = () => {
    if (currentVerse > 1) {
      onVerseChange(currentVerse - 1)
    }
  }

  const handleNextVerse = () => {
    if (currentVerse < verses.length) {
      onVerseChange(currentVerse + 1)
    }
  }

  if (!mounted || !currentVerseData) return null

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center w-full">
        <Button
          variant="outline"
          onClick={handlePreviousVerse}
          disabled={currentVerse <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Verse
        </Button>
        <span className="text-lg font-semibold">
          Verse {currentVerse} of {verses.length}
        </span>
        <Button
          variant="outline"
          onClick={handleNextVerse}
          disabled={currentVerse >= verses.length}
        >
          Next Verse
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="w-full space-y-6">
        <div className="text-right">
          <p className="text-4xl leading-loose font-arabic mb-4">
            {currentVerseData.text_uthmani}
          </p>
          {showTranslation && (
            <p className="text-lg text-muted-foreground">
              {currentVerseData.translation_eng}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setShowTranslation(!showTranslation)}
          >
            {showTranslation ? 'Hide' : 'Show'} Translation
          </Button>
          
          <AudioPlayer
            audioUrl={currentVerseData.audio_url}
            onNext={currentVerse < verses.length ? handleNextVerse : undefined}
            onPrevious={currentVerse > 1 ? handlePreviousVerse : undefined}
          />
        </div>
      </div>
    </div>
  )
} 