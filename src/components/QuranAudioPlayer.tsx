'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { preloadVerseAudio } from '@/lib/quran-api'

interface QuranAudioPlayerProps {
  pageNumber: number;
  verseKey: string;
  reciterId?: string;
  onTimeUpdate?: (time: number) => void;
  onWordChange?: (wordIndex: number) => void;
  onLoadSegments?: (segments: number[][]) => void;
}

export function QuranAudioPlayer({ 
  pageNumber, 
  verseKey, 
  reciterId = '1',
  onTimeUpdate,
  onWordChange,
  onLoadSegments
}: QuranAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [segments, setSegments] = useState<number[][]>([])
  const [currentWord, setCurrentWord] = useState(-1)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load audio when verse changes
  useEffect(() => {
    const loadAudio = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Preload audio for the verse
        await preloadVerseAudio(verseKey, reciterId)
        
        // This would normally come from an API
        // For demo, we'll generate mock segments
        const mockSegments = generateMockSegments(15, duration || 30)
        setSegments(mockSegments)
        if (onLoadSegments) {
          onLoadSegments(mockSegments)
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading audio:', error)
        setError('Failed to load audio')
        setIsLoading(false)
      }
    }
    
    loadAudio()
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [verseKey, reciterId])

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current

      const handleTimeUpdate = () => {
        const time = audio.currentTime
        setCurrentTime(time)
        
        if (onTimeUpdate) {
          onTimeUpdate(time)
        }
        
        // Find which word corresponds to the current time
        const wordIndex = segments.findIndex((segment, idx) => {
          const start = segment[0]
          const end = segment[1]
          return time >= start && time <= end
        })
        
        if (wordIndex !== -1 && wordIndex !== currentWord) {
          setCurrentWord(wordIndex)
          if (onWordChange) {
            onWordChange(wordIndex)
          }
        }
      }
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration)
        // Regenerate segments with correct duration
        if (segments.length > 0) {
          const newSegments = generateMockSegments(segments.length, audio.duration)
          setSegments(newSegments)
          if (onLoadSegments) {
            onLoadSegments(newSegments)
          }
        }
      }
      
      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentWord(-1)
      }
      
      const handleError = () => {
        setError('Error playing audio')
        setIsPlaying(false)
      }
      
      const handleCanPlay = () => setError(null)

      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)
      audio.addEventListener('canplay', handleCanPlay)

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('canplay', handleCanPlay)
      }
    }
  }, [segments, currentWord, onTimeUpdate, onWordChange])

  const togglePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          await audioRef.current.pause()
        } else {
          await audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
      } catch (err) {
        setError('Error playing audio')
        setIsPlaying(false)
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted
      audioRef.current.volume = newMuted ? 0 : volume
      setIsMuted(newMuted)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Helper function to generate mock timing segments for words
  const generateMockSegments = (wordCount: number, totalDuration: number): number[][] => {
    const segments: number[][] = []
    const wordDuration = totalDuration / wordCount
    
    for (let i = 0; i < wordCount; i++) {
      const start = i * wordDuration
      const end = (i + 1) * wordDuration
      segments.push([start, end])
    }
    
    return segments
  }

  return (
    <div className="container mx-auto px-4 py-3">
      <audio
        ref={audioRef}
        src={`https://verses.quran.com/${verseKey.replace(':', '/')}.mp3`}
        preload="metadata"
      />
      {error && (
        <div className="text-destructive text-sm text-center mb-2">
          {error}
        </div>
      )}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Go to previous verse logic
            }}
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            onClick={togglePlayPause}
            variant="outline"
            size="icon"
            className="h-10 w-10"
            disabled={!!error || isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Go to next verse logic
            }}
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm w-12 text-center text-gray-300">{formatTime(currentTime)}</span>
          <div className="flex-1 relative h-1.5 bg-accent rounded-full">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 -ml-1.5 h-3 w-3 rounded-full bg-primary shadow-md"
              style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          <span className="text-sm w-12 text-center text-gray-300">{formatTime(duration)}</span>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="relative w-24 h-1.5 bg-accent rounded-full">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute h-full bg-primary rounded-full"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 