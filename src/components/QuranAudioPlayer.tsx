'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { preloadVerseAudio } from '@/lib/quran-api'
import { cn } from '@/lib/utils'

interface QuranAudioPlayerProps {
  pageNumber: number;
  verseKey: string;
  reciterId?: string;
  onTimeUpdate?: (time: number) => void;
  onWordChange?: (wordIndex: number) => void;
  onLoadSegments?: (segments: number[][]) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  onEnded?: () => void;
  wordCount?: number;
  onNextVerse?: () => void;
}

export function QuranAudioPlayer({ 
  pageNumber, 
  verseKey, 
  reciterId = '1',
  onTimeUpdate,
  onWordChange,
  onLoadSegments,
  onPlayingChange,
  onEnded,
  wordCount = 15,
  onNextVerse
}: QuranAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [segments, setSegments] = useState<number[][]>([])
  const [currentWord, setCurrentWord] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReciterId, setSelectedReciterId] = useState(reciterId)
  const [autoScroll, setAutoScroll] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [autoContinue, setAutoContinue] = useState(true)
  const [isPreloadingNext, setIsPreloadingNext] = useState(false)
  const [preloadedVerses, setPreloadedVerses] = useState<Record<string, HTMLAudioElement>>({})
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [bufferingAudio, setBufferingAudio] = useState(false)
  const preloadCacheRef = useRef<Record<string, HTMLAudioElement>>({})

  // Update the selected reciter when the prop changes
  useEffect(() => {
    setSelectedReciterId(reciterId)
  }, [reciterId])

  // Function to get audio URLs for a verse
  const getAudioUrls = useCallback((surahNumber: string, verseNumber: string) => [
    `https://verses.quran.com/${surahNumber}/${verseNumber}.mp3`,
    `https://audio.qurancdn.com/${selectedReciterId}/${surahNumber}/${verseNumber}.mp3`,
    `https://the-quran-project.github.io/Quran-Audio/Data/${selectedReciterId}/${surahNumber}_${verseNumber}.mp3`,
  ], [selectedReciterId])

  // Function to preload a verse audio
  const preloadVerseAudio = useCallback((verseKey: string): Promise<HTMLAudioElement> => {
    return new Promise((resolve, reject) => {
      const [surahNumber, verseNumber] = verseKey.split(':')
      const urls = getAudioUrls(surahNumber, verseNumber)
      
      // Check if already cached
      if (preloadCacheRef.current[verseKey] && 
          preloadCacheRef.current[verseKey].readyState >= 2) {
        return resolve(preloadCacheRef.current[verseKey])
      }
      
      const audio = new Audio()
      audio.preload = 'auto'
      
      let currentUrlIndex = 0
      audio.src = urls[currentUrlIndex]
      
      const tryNextSource = () => {
        currentUrlIndex++
        if (currentUrlIndex < urls.length) {
          audio.src = urls[currentUrlIndex]
          audio.load()
        } else {
          reject(new Error('Failed to load audio from all sources'))
        }
      }
      
      audio.oncanplaythrough = () => {
        preloadCacheRef.current[verseKey] = audio
        resolve(audio)
      }
      
      audio.onerror = tryNextSource
      
      audio.load()
    })
  }, [getAudioUrls])

  // Aggressive preloading for the next several verses when auto-continue is enabled
  useEffect(() => {
    if (!autoContinue) return
    
    const preloadNextVerses = async () => {
      try {
        const [surahNumber, verseNumber] = verseKey.split(':')
        const currentVerseNum = parseInt(verseNumber)
        
        // Preload next 3 verses in parallel
        const preloadPromises = []
        for (let i = 1; i <= 3; i++) {
          const nextVerseNum = currentVerseNum + i
          const nextVerseKey = `${surahNumber}:${nextVerseNum}`
          
          if (nextVerseNum <= 286 && !preloadCacheRef.current[nextVerseKey]) {
            preloadPromises.push(
              preloadVerseAudio(nextVerseKey)
                .then(audio => {
                  const updatedCache = { ...preloadedVerses }
                  updatedCache[nextVerseKey] = audio
                  setPreloadedVerses(updatedCache)
                  return audio
                })
                .catch(err => console.log(`Preload failed for verse ${nextVerseKey}: ${err.message}`))
            )
          }
        }
        
        await Promise.all(preloadPromises)
      } catch (error) {
        console.error('Error in preloading:', error)
      }
    }
    
    preloadNextVerses()
  }, [verseKey, autoContinue, preloadVerseAudio, preloadedVerses])

  // Initialize current audio lazily - only when needed
  const initializeCurrentAudio = useCallback(async () => {
    if (!audioRef.current || audioInitialized) return
    
    try {
      // Check if we already have this verse preloaded
      if (preloadCacheRef.current[verseKey] && 
          preloadCacheRef.current[verseKey].readyState >= 2) {
        
        // Just copy the source from preloaded audio
        audioRef.current.src = preloadCacheRef.current[verseKey].src
        return
      }
      
      // Otherwise load it directly
      const [surahNumber, verseNumber] = verseKey.split(':')
      const urls = getAudioUrls(surahNumber, verseNumber)
      
      let currentUrlIndex = 0
      audioRef.current.src = urls[currentUrlIndex]
      
      audioRef.current.onerror = () => {
        currentUrlIndex++
        if (currentUrlIndex < urls.length) {
          audioRef.current!.src = urls[currentUrlIndex]
          audioRef.current!.load()
        } else {
          setError('Could not load audio from any source')
          setIsLoading(false)
        }
      }
      
      await audioRef.current.load()
      setAudioInitialized(true)
    } catch (error) {
      console.error('Error initializing audio:', error)
      setError('Failed to initialize audio')
      setIsLoading(false)
    }
  }, [verseKey, getAudioUrls, audioInitialized])

  // Reset audio initialization state when verse changes
  useEffect(() => {
    setAudioInitialized(false)
  }, [verseKey])

  // Handle audio events
  useEffect(() => {
    if (!audioRef.current) return
    
    const audio = audioRef.current

    const handleTimeUpdate = () => {
      const time = audio.currentTime
      setCurrentTime(time)
      
      if (onTimeUpdate) {
        onTimeUpdate(time)
      }
      
      // Find current word based on time
      const currentWordIndex = segments.findIndex((segment, index) => {
        const nextSegment = segments[index + 1];
        const time = audio.currentTime;
        return time >= segment[0] && (!nextSegment || time < nextSegment[0]);
      });

      if (currentWordIndex !== -1 && currentWordIndex !== currentWord) {
        setCurrentWord(currentWordIndex);
        if (onWordChange) {
          onWordChange(currentWordIndex);
        }
      }
      
      // Check if we need to preload next verse for auto-continue
      if (autoContinue) {
        const timeLeft = audio.duration - time
        // Start preloading when 5 seconds are left if not already preloaded
        if (timeLeft <= 5 && !isPreloadingNext) {
          setIsPreloadingNext(true)
          const [surahNumber, verseNumber] = verseKey.split(':')
          const nextVerseNumber = parseInt(verseNumber) + 1
          const nextVerseKey = `${surahNumber}:${nextVerseNumber}`
          
          if (nextVerseNumber <= 286 && !preloadCacheRef.current[nextVerseKey]) {
            preloadVerseAudio(nextVerseKey)
              .then(audio => {
                const updatedCache = { ...preloadedVerses }
                updatedCache[nextVerseKey] = audio
                setPreloadedVerses(updatedCache)
                setIsPreloadingNext(false)
              })
              .catch(() => setIsPreloadingNext(false))
          } else {
            setIsPreloadingNext(false)
          }
        }
      }
    }
    
    const handleWaiting = () => {
      setBufferingAudio(true)
    }
    
    const handleCanPlay = () => {
      setBufferingAudio(false)
    }
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setError(null)
      setIsLoading(false)
      // Generate segments with the actual duration
      const newSegments = generateMockSegments(wordCount, audio.duration)
        setSegments(newSegments)
        if (onLoadSegments) {
          onLoadSegments(newSegments)
      }
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentWord(-1)
      if (onEnded) {
        onEnded()
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [segments, currentWord, onTimeUpdate, onWordChange, onEnded, autoContinue, isPreloadingNext, verseKey, preloadVerseAudio, preloadedVerses, wordCount, onLoadSegments])

  // Recovery attempt when there's an error
  useEffect(() => {
    if (error && audioRef.current) {
      // Try a different source if there's an error
      const [surahNumber, verseNumber] = verseKey.split(':');
      const fallbackUrl = `https://the-quran-project.github.io/Quran-Audio/Data/${selectedReciterId}/${surahNumber}_${verseNumber}.mp3`;
      
      if (audioRef.current.src !== fallbackUrl) {
        audioRef.current.src = fallbackUrl;
        audioRef.current.load();
        setError('Trying alternative audio source...');
        
        // Set a timeout to clear the "trying" message if it works
        setTimeout(() => {
          if (error === 'Trying alternative audio source...') {
            setError(null);
          }
        }, 3000);
      }
    }
  }, [error, verseKey, selectedReciterId]);

  const togglePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          await audioRef.current.pause()
        } else {
          setIsLoading(true)
          
          // Initialize audio if not already done
          if (!audioInitialized) {
            await initializeCurrentAudio()
          }
          
          // Make sure the src is set before playing
          if (!audioRef.current.src || audioRef.current.src === 'about:blank') {
            const [surahNumber, verseNumber] = verseKey.split(':')
            const urls = getAudioUrls(surahNumber, verseNumber)
            audioRef.current.src = urls[0]
            await audioRef.current.load()
          }
          
          const playPromise = audioRef.current.play()
          if (playPromise !== undefined) {
            await playPromise
            setIsLoading(false)
          }
        }
        
        // Only update if successful
        setIsPlaying(!isPlaying)
        if (onPlayingChange) {
          onPlayingChange(!isPlaying)
        }
      } catch (err) {
        console.error('Error in togglePlayPause:', err)
        setError('Error playing audio')
        setIsPlaying(false)
        setIsLoading(false)
      }
    } else {
      setError('Audio player not initialized')
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
    const value = parseFloat(e.target.value);
    setVolume(value);
    setIsMuted(value === 0);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      
      // Find current word based on time
      const currentWordIndex = segments.findIndex((segment, index) => {
        const nextSegment = segments[index + 1];
        const time = audioRef.current!.currentTime;
        return time >= segment[0] && (!nextSegment || time < nextSegment[0]);
      });

      if (currentWordIndex !== -1 && currentWordIndex !== currentWord) {
        setCurrentWord(currentWordIndex);
        if (onWordChange) {
          onWordChange(currentWordIndex);
        }
      }
    }
  };

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
    
    // Initial delay and end buffer
    const initialDelay = 0.3
    const endBuffer = 0.4
    const availableDuration = totalDuration - initialDelay - endBuffer
    
    // Calculate base duration per word with variation factors
    const baseWordDuration = availableDuration / (wordCount * 1.2) // Account for stretched words
    
    let currentTime = initialDelay
    for (let i = 0; i < wordCount; i++) {
      // Add natural variations based on word position and patterns
      let stretchFactor = 1.0
      
      // Words at the end of verses often have longer duration (tarqeeq/madd)
      if (i === wordCount - 1) {
        stretchFactor = 2.0 // Much longer for final word
      } else if (i === wordCount - 2) {
        stretchFactor = 1.5 // Slightly longer for penultimate word
      } else {
        // Random variation for middle words, with higher chance of stretch
        const isStretched = Math.random() < 0.3 // 30% chance of stretched word
        stretchFactor = isStretched ? 1.5 + Math.random() * 0.5 : 0.8 + Math.random() * 0.4
      }
      
      const wordDuration = baseWordDuration * stretchFactor
      const start = currentTime
      currentTime += wordDuration
      
      segments.push([start, currentTime])
    }
    
    // Normalize segments to fit within available duration
    const totalSegmentDuration = currentTime - initialDelay
    const scaleFactor = availableDuration / totalSegmentDuration
    
    return segments.map(([start, end]) => [
      initialDelay + (start - initialDelay) * scaleFactor,
      initialDelay + (end - initialDelay) * scaleFactor
    ])
  }

  const handleReciterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newReciterId = e.target.value;
    setSelectedReciterId(newReciterId);
    // Reset state for new reciter
    setCurrentTime(0);
    setCurrentWord(-1);
    setIsPlaying(false);
    if (onPlayingChange) onPlayingChange(false);
  }

  const getReciterName = (id: string): string => {
    switch(id) {
      case '1': return 'Mishary Al-Afasy';
      case '2': return 'Abu Bakr Al-Shatri';
      case '3': return 'Nasser Al-Qatami';
      case '4': return 'Yasser Al-Dosari';
      default: return `Reciter ${id}`;
    }
  }

  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause]);

  // Modify the onEnded handler for seamless playback
  useEffect(() => {
    if (!audioRef.current) return

    const handleEnded = async () => {
      setIsPlaying(false)
      setCurrentWord(-1)

      if (autoContinue) {
        // Switch to next verse
        if (onNextVerse) {
          onNextVerse()
        }
        
        // Get the next verse key
        const [surahNumber, verseNumber] = verseKey.split(':')
        const nextVerseNumber = parseInt(verseNumber) + 1
        const nextVerseKey = `${surahNumber}:${nextVerseNumber}`
        
        // Check if we have it preloaded already
        if (nextVerseNumber <= 286) {
          setIsLoading(true)
          
          try {
            // Use preloaded audio if available
            if (preloadCacheRef.current[nextVerseKey] && 
                preloadCacheRef.current[nextVerseKey].readyState >= 2) {
              
              // Copy source from preloaded audio
              if (audioRef.current) {
                audioRef.current.src = preloadCacheRef.current[nextVerseKey].src
                
                try {
                  await audioRef.current.play()
                  setIsPlaying(true)
                  setIsLoading(false)
                  if (onPlayingChange) {
                    onPlayingChange(true)
                  }
                } catch (error) {
                  console.error('Error auto-playing next verse:', error)
                  setIsLoading(false)
                }
              }
            } else {
              // Fallback to normal loading
              const urls = getAudioUrls(surahNumber, nextVerseNumber.toString())
              if (audioRef.current) {
                audioRef.current.src = urls[0]
                await audioRef.current.load()
                
                try {
                  await audioRef.current.play()
                  setIsPlaying(true)
                  setIsLoading(false)
                  if (onPlayingChange) {
                    onPlayingChange(true)
                  }
                } catch (error) {
                  console.error('Error auto-playing next verse:', error)
                  setIsLoading(false)
                }
              }
            }
          } catch (error) {
            console.error('Error transitioning to next verse:', error)
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      } else if (onEnded) {
        onEnded()
      }
    }

    audioRef.current.addEventListener('ended', handleEnded)
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded)
      }
    }
  }, [autoContinue, onEnded, onNextVerse, onPlayingChange, verseKey, getAudioUrls])

  return (
    <div className="relative flex flex-col gap-2 min-w-0 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-700/50">
      {/* Main Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 relative rounded-full",
            isPlaying 
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300" 
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          disabled={!!error || isLoading}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isLoading || bufferingAudio ? (
            <div className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
          {isPlaying && !bufferingAudio && (
            <span className="absolute -inset-1 rounded-full animate-ping bg-green-500/20" />
          )}
        </Button>

        {/* Progress Info */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {/* Time Display */}
          <div className="flex justify-between text-xs font-medium">
            <span className="text-green-400 tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-gray-400 tabular-nums">{formatTime(duration)}</span>
          </div>
          
          {/* Progress Track with Word Markers */}
          <div className="relative h-2 group">
            {/* Background Track */}
            <div className="absolute inset-0 rounded-full bg-white/10" />
            
            {/* Buffered Track */}
            <div 
              className="absolute inset-y-0 left-0 rounded-full bg-white/20 transition-all duration-300"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            
            {/* Progress Track */}
            <div 
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
                bufferingAudio ? "bg-yellow-500" : "bg-gradient-to-r from-green-500 to-emerald-400"
              )}
              style={{ 
                width: `${(currentTime / duration) * 100}%`,
                opacity: isPlaying ? 1 : 0.7 
              }}
            />

            {/* Word Segment Markers */}
            {segments.map((segment, index) => (
              <div
                key={index}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-0.5 h-2.5 rounded-full transition-colors",
                  currentWord === index 
                    ? "bg-white" 
                    : "bg-white/30 group-hover:bg-white/40"
                )}
                style={{ left: `${(segment[0] / duration) * 100}%` }}
              />
            ))}

            {/* Hover Preview */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 rounded-full bg-white opacity-0 
                group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ 
                left: `${(currentTime / duration) * 100}%`,
                transform: 'translateX(-50%)' 
              }}
            />

            {/* Seek Input */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        
        {/* Auto-Continue Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAutoContinue(!autoContinue)}
          className={cn(
            "h-8 w-8 rounded-full",
            autoContinue 
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
              : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
          )}
          title={autoContinue ? "Auto-continue enabled" : "Auto-continue disabled"}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        {/* Volume Control */}
        <div className="hidden sm:flex items-center group relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={cn(
              "h-8 w-8 rounded-full",
              isMuted
                ? "bg-slate-700/50 text-gray-400 hover:bg-slate-700/80"
                : "bg-white/10 text-gray-200 hover:bg-white/20"
            )}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          {/* Volume Slider (shows on hover) */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <div className="h-20 w-6 relative flex items-center justify-center">
              <div className="absolute inset-x-0 top-0 bottom-0 w-1 mx-auto rounded-full bg-white/10" />
              <div 
                className="absolute inset-x-0 bottom-0 w-1 mx-auto rounded-full bg-green-500/80"
                style={{ height: `${isMuted ? 0 : volume * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="absolute h-full w-8 opacity-0 cursor-pointer"
                style={{ transform: 'rotate(180deg)' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        preload="none" 
        onPlay={() => {
          setIsPlaying(true);
          if (onPlayingChange) onPlayingChange(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          if (onPlayingChange) onPlayingChange(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentWord(-1);
          if (onEnded) onEnded();
        }}
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          setDuration(audio.duration);
          setError(null);
          setIsLoading(false);
        }}
        onTimeUpdate={handleTimeUpdate}
        onError={() => {
          console.error('Audio error occurred');
          setError('Error loading audio');
          setIsLoading(false);
        }}
        className="hidden"
      />

      {error && (
        <div className="absolute -top-8 left-0 right-0 text-xs text-center text-red-400 bg-red-500/20 py-1.5 px-3 rounded-lg backdrop-blur-md border border-red-500/30">
          {error}
        </div>
      )}
    </div>
  )
} 