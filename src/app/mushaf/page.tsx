'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuranPage } from '@/components/QuranPage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Bookmark, Share2, Settings, Home, Info, BookOpen, Minus, Plus, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { QuranAudioPlayer } from '@/components/QuranAudioPlayer'
import { getVersesByPage, preloadVerseAudio, getWordByWordTranslation } from '@/lib/quran-api'

const pageTransitionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
}

export default function MushafPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('')
  const [direction, setDirection] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [pageZoom, setPageZoom] = useState(100)
  const [isScrollMode, setIsScrollMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [hideAllControls, setHideAllControls] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null)
  const [currentVerseKey, setCurrentVerseKey] = useState<string>('')
  const [wordSegments, setWordSegments] = useState<number[][]>([])
  const [reciterId, setReciterId] = useState<string>('1') // Default reciter
  const [pageVerses, setPageVerses] = useState<any[]>([])
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const [wordMap, setWordMap] = useState<{[verseKey: string]: any[]}>({})
  const [showSidebar, setShowSidebar] = useState(true)
  const [hideAudioPlayer, setHideAudioPlayer] = useState(false)
  const [continuousPlay, setContinuousPlay] = useState(false)
  
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const audioPlayerRef = useRef<HTMLDivElement>(null)

  const toggleAudio = () => {
    if (showAudioPlayer && audioPlayerRef.current) {
      // Simulate clicking the play/pause button in the audio player
      const playButton = audioPlayerRef.current.querySelector('button[title="Play"], button[title="Pause"]');
      if (playButton) {
        (playButton as HTMLButtonElement).click();
      } else {
        // Try to find the audio element directly
        const audio = audioPlayerRef.current.querySelector('audio');
        if (audio) {
          if (audio.paused) {
            audio.play().catch(e => console.error("Error playing audio:", e));
          } else {
            audio.pause();
          }
        } else {
          // If all else fails, just show the player
          setShowAudioPlayer(true);
        }
      }
    } else if (!showAudioPlayer) {
      // Show the audio player first
      setShowAudioPlayer(true);
      // After a short delay to allow audio player to mount, try to play
      setTimeout(() => toggleAudio(), 500);
    }
  };

  // Add keyboard shortcuts for media controls and verse navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't respond to key events in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ': // Space bar toggles play/pause
          e.preventDefault(); // Prevent page scroll
          toggleAudio();
          break;
        case 'ArrowUp': // Volume up
          e.preventDefault();
          // Implementation would go through the audio component
          break;
        case 'ArrowDown': // Volume down
          e.preventDefault();
          // Implementation would go through the audio component
          break;
        case 'ArrowRight': // Only catch if Ctrl is pressed (to not interfere with page navigation)
          if (e.ctrlKey) {
            e.preventDefault();
            changeVerse(1); // Next verse
          }
          break;
        case 'ArrowLeft': // Only catch if Ctrl is pressed
          if (e.ctrlKey) {
            e.preventDefault();
            changeVerse(-1); // Previous verse
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isAudioPlaying]);

  // Listen for verse navigation events from the audio player
  useEffect(() => {
    const handleVerseNavigation = (event: any) => {
      const { direction } = event.detail;
      changeVerse(direction);
    };

    // Add event listener
    window.addEventListener('verse-navigation', handleVerseNavigation);
    
    // Cleanup
    return () => {
      window.removeEventListener('verse-navigation', handleVerseNavigation);
    };
  }, [currentVerseIndex, pageVerses]); // Re-add listener when these change

  // Update the useEffect for control visibility
  useEffect(() => {
    if (hideAllControls) {
      setShowControls(false);
      setShowSidebar(false);
      return;
    }

    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!hideAllControls) {
        setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    
    // Initial timeout
    timeout = setTimeout(() => {
      if (!hideAllControls) {
      setShowControls(false);
      }
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [hideAllControls]);

  // Load bookmarked page from localStorage on mount
  useEffect(() => {
    const savedPage = localStorage.getItem('bookmarkedPage')
    if (savedPage) {
      setIsBookmarked(Number(savedPage) === currentPage)
    }

    // Load settings
    const savedZoom = localStorage.getItem('pageZoom')
    if (savedZoom) {
      setPageZoom(Number(savedZoom))
    }

    const savedScrollMode = localStorage.getItem('isScrollMode')
    if (savedScrollMode) {
      setIsScrollMode(savedScrollMode === 'true')
    }
    
    // Load preferred reciter
    const savedReciter = localStorage.getItem('reciterId')
    if (savedReciter) {
      setReciterId(savedReciter)
    }
  }, [currentPage])

  // Fetch the verses on the current page
  useEffect(() => {
    const fetchPageVerses = async () => {
      try {
        const verses = await getVersesByPage(currentPage)
        setPageVerses(verses)
        
        if (verses.length > 0) {
          // Set the first verse as default
          setCurrentVerseKey(verses[0].verse_key)
          setCurrentVerseIndex(0)
          
          // Preload the audio for this verse
          await preloadVerseAudio(verses[0].verse_key, reciterId)
          
          // Fetch word by word data for all verses on the page
          const wordMapData: {[verseKey: string]: any[]} = {}
          for (const verse of verses) {
            const words = await getWordByWordTranslation(verse.verse_key)
            wordMapData[verse.verse_key] = words
          }
          setWordMap(wordMapData)
        }
      } catch (error) {
        console.error('Error fetching page verses:', error)
      }
    }
    
    fetchPageVerses()
  }, [currentPage, reciterId])

  const handleWordChange = (wordIndex: number) => {
    setHighlightedWordIndex(wordIndex)
  }

  const handleLoadSegments = (segments: number[][]) => {
    setWordSegments(segments)
  }

  const handleAudioPlayingChange = (playing: boolean) => {
    setIsAudioPlaying(playing)
  }

  const toggleAudioPlayer = () => {
    setShowAudioPlayer(!showAudioPlayer)
  }

  const changeVerse = async (direction: number) => {
    if (pageVerses.length === 0) return
    
    const newIndex = currentVerseIndex + direction
    if (newIndex >= 0 && newIndex < pageVerses.length) {
      setCurrentVerseIndex(newIndex)
      setCurrentVerseKey(pageVerses[newIndex].verse_key)
      setHighlightedWordIndex(null) // Reset highlighting
      
      // Preload the audio for this verse
      await preloadVerseAudio(pageVerses[newIndex].verse_key, reciterId)
    } else if (direction > 0 && currentPage < 604) {
      // Move to next page, first verse
      handlePageChange(currentPage + 1)
    } else if (direction < 0 && currentPage > 1) {
      // Move to previous page, last verse
      handlePageChange(currentPage - 1)
      // We'll set the last verse of the new page after it loads
    }
  }

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
        text: `Reading Quran page ${currentPage}${currentVerseKey ? `, verse ${currentVerseKey}` : ''}`,
        url: window.location.href
      })
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback for browsers that don't support sharing
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const changeZoom = (amount: number) => {
    const newZoom = Math.min(Math.max(pageZoom + amount, 70), 150);
    setPageZoom(newZoom);
    localStorage.setItem('pageZoom', newZoom.toString());
  }

  const toggleScrollMode = () => {
    const newValue = !isScrollMode;
    setIsScrollMode(newValue);
    localStorage.setItem('isScrollMode', newValue.toString());
  }

  const changeReciter = (id: string) => {
    setReciterId(id)
    localStorage.setItem('reciterId', id)
    
    // If we have a current verse, preload its audio with the new reciter
    if (currentVerseKey) {
      preloadVerseAudio(currentVerseKey, id)
    }
  }

  // Add this function to handle continuous playback
  const handleVerseEnd = () => {
    if (continuousPlay) {
      changeVerse(1)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0A1020] overflow-hidden">
      {/* Main Content */}
      <div className="relative pt-16">
        {/* Sidebar Navigation */}
        <motion.div 
          className={`fixed top-16 right-0 h-[calc(100vh-4rem)] z-50 w-[280px] sm:w-[320px] 
            bg-[#0A1020] border-l border-gray-800 shadow-xl
            transform transition-transform duration-300 ease-in-out
            ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}
          initial={{ x: '100%' }}
          animate={{ 
            x: showSidebar ? 0 : '100%',
            transition: { duration: 0.3 }
          }}
        >
          <div className="h-full flex flex-col overflow-y-auto">
            <div className="flex-1 p-4 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-200 font-medium">
                  {currentLanguage.direction === 'rtl' ? 'المصحف الشريف' : 'Quran Mushaf'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                  className="text-gray-400 hover:text-white hover:bg-slate-800/60"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Main Controls */}
              <div className="space-y-6">
                {/* Page Navigation */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Page Navigation</label>
                  <div className="flex items-center justify-between bg-[#1E293B] rounded-lg p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                      className="text-gray-300 hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                    <span className="text-gray-200">
                    {currentPage} / 604
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= 604 || isLoading}
                      className="text-gray-300 hover:text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                
                  <form onSubmit={handlePageSubmit} className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={currentLanguage.direction === 'rtl' ? 'اذهب إلى' : 'Go to page'}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    min={1}
                    max={604}
                      className="flex-1 bg-[#1E293B] text-gray-100 border-gray-700 h-9"
                  />
                  <Button type="submit" size="sm" variant="ghost" disabled={isLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              
                {/* Quick Actions */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Quick Actions</label>
                  <div className="grid grid-cols-2 gap-2">
                <Button
                      variant="outline"
                  onClick={toggleAudioPlayer}
                  className={cn(
                        "justify-start gap-2",
                        showAudioPlayer ? "text-green-500 border-green-500/30" : "text-gray-300"
                  )}
                >
                      <Volume2 className="h-4 w-4" />
                      <span className="text-sm">Audio</span>
                </Button>
                
                <Button
                      variant="outline"
                  onClick={toggleBookmark}
                  className={cn(
                        "justify-start gap-2",
                        isBookmarked ? "text-yellow-500 border-yellow-500/30" : "text-gray-300"
                  )}
                >
                      <Bookmark className="h-4 w-4" />
                      <span className="text-sm">Bookmark</span>
                </Button>
                
                <Button
                      variant="outline"
                  onClick={handleShare}
                      className="justify-start gap-2 text-gray-300"
                >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">Share</span>
                </Button>
                
                <Button
                      variant="outline"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className="justify-start gap-2 text-gray-300"
                >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Settings</span>
                </Button>
              </div>
            </div>
            
                {/* Settings Panel */}
            {isSettingsOpen && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">
                      {currentLanguage.direction === 'rtl' ? 'حجم الصفحة' : 'Page Size'}
                      </label>
                      <div className="flex items-center gap-2 bg-[#1E293B] rounded-lg p-2">
                      <Button 
                          variant="ghost" 
                        size="icon" 
                        onClick={() => changeZoom(-10)}
                        className="h-7 w-7 text-gray-400"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-300 text-sm w-10 text-center">{pageZoom}%</div>
                      <Button 
                          variant="ghost" 
                        size="icon" 
                        onClick={() => changeZoom(10)}
                        className="h-7 w-7 text-gray-400"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">
                        {currentLanguage.direction === 'rtl' ? 'القارئ' : 'Reciter'}
                      </label>
                      <select
                        value={reciterId}
                        onChange={(e) => changeReciter(e.target.value)}
                        className="w-full bg-[#1E293B] text-gray-300 text-sm rounded-lg border-gray-700 p-2"
                      >
                        <option value="1">Mishary Rashid Al-Afasy</option>
                        <option value="2">Abu Bakr Al-Shatri</option>
                        <option value="3">Nasser Al-Qatami</option>
                        <option value="4">Yasser Al-Dosari</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="scrollMode"
                        checked={isScrollMode}
                        onChange={toggleScrollMode}
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="scrollMode" className="text-gray-300 text-sm cursor-pointer">
                        {currentLanguage.direction === 'rtl' ? 'وضع التمرير' : 'Scroll Mode'}
                      </label>
                    </div>
                  </div>
                )}
                    </div>
                  </div>
                  
            {/* Bottom Actions - Fixed at bottom */}
            <div className="p-4 border-t border-gray-800 bg-[#0A1020]">
                    <Button 
                      variant="ghost" 
                      onClick={() => router.push('/')}
                className="w-full justify-start text-gray-300 hover:text-white"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      {currentLanguage.direction === 'rtl' ? 'الرئيسية' : 'Home'}
                    </Button>
                  </div>
          </div>
        </motion.div>

        {/* Toggle Sidebar Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(true)}
          className={`fixed top-20 right-4 z-40 bg-[#1E293B]/80 backdrop-blur-sm rounded-full 
            shadow-lg transition-all duration-300 
            ${showSidebar ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <ChevronLeft className="h-5 w-5 text-gray-200" />
        </Button>

        {/* Quran Pages */}
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-2 sm:px-4 md:px-8">
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
              className={cn(
                "w-full max-w-3xl mx-auto",
                isScrollMode ? "overflow-y-auto" : ""
              )}
              style={{ 
                transform: `scale(${pageZoom / 100})`,
                transformOrigin: 'center top'
              }}
            >
              <QuranPage
                pageNumber={currentPage}
                onPageChange={handlePageChange}
                isLoading={isLoading}
                highlightedWordIndex={highlightedWordIndex}
                verses={pageVerses}
                wordMap={wordMap}
                currentVerseKey={currentVerseKey}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Audio Player */}
        {showAudioPlayer && !hideAudioPlayer && (
          <div 
            ref={audioPlayerRef}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-[#0A1020]/95 backdrop-blur-sm border-t border-gray-800",
              showSidebar ? "sm:mr-[320px]" : ""  // Add margin when sidebar is open
            )}
          >
            <div className="container max-w-5xl mx-auto px-4 py-3">
              {/* Top Row - Verse Info and Controls */}
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {currentLanguage.direction === 'rtl' ? 'الآية:' : 'Verse:'}
                  </span>
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {currentVerseKey}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContinuousPlay(!continuousPlay)}
                    className={cn(
                      "text-xs gap-1.5 hidden sm:inline-flex",
                      continuousPlay 
                        ? "text-green-500 hover:text-green-400" 
                        : "text-gray-400 hover:text-white"
                    )}
                    title={continuousPlay ? "Continuous play enabled" : "Continuous play disabled"}
                  >
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      continuousPlay ? "bg-green-500" : "bg-gray-600"
                    )} />
                    Auto-Continue
                  </Button>
                  <div className="w-px h-4 bg-gray-800 hidden sm:block" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changeVerse(-1)}
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-slate-800/60"
                    title="Previous verse"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changeVerse(1)}
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-slate-800/60"
                    title="Next verse"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-4 bg-gray-800" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHideAudioPlayer(true)}
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-slate-800/60"
                    title="Hide audio player"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Bottom Row - Audio Controls */}
              <div className="flex items-center">
                <QuranAudioPlayer
                  pageNumber={currentPage}
                  verseKey={currentVerseKey}
                  reciterId={reciterId}
                  onTimeUpdate={() => {}}
                  onWordChange={handleWordChange}
                  onLoadSegments={handleLoadSegments}
                  onPlayingChange={handleAudioPlayingChange}
                  onEnded={handleVerseEnd}
                  wordCount={wordMap[currentVerseKey]?.length || 15}
                />
              </div>
            </div>
          </div>
        )}

        {/* Show Audio Player Button - Adjust position when sidebar is open */}
        {hideAudioPlayer && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHideAudioPlayer(false)}
            className={cn(
              "fixed bottom-4 z-50 bg-[#1E293B]/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-slate-800/80 hover:text-white transition-all duration-300",
              showSidebar ? "right-[340px]" : "right-4" // Adjust position based on sidebar
            )}
            title="Show audio player"
          >
            <Volume2 className="h-5 w-5 text-gray-200" />
          </Button>
        )}

        {/* Hide All Controls Button */}
        <motion.button
          onClick={() => {
            setHideAllControls(!hideAllControls);
            if (!hideAllControls) {
              setShowSidebar(false);
            }
          }}
          className={`fixed sm:top-1/2 bottom-32 sm:bottom-auto right-4 z-50 p-2.5 sm:p-2 rounded-full 
            bg-slate-900/50 sm:bg-slate-900/30 backdrop-blur-sm shadow-lg
            hover:bg-slate-800/50 active:bg-slate-800/70 transition-all duration-300 group
            touch-manipulation sm:hover:bg-slate-800/30
            ${hideAllControls ? 'bg-slate-800/60 sm:hover:bg-slate-800' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: hideAllControls ? 1 : 0.6 }}
          whileHover={{ opacity: 1 }}
        >
          <Eye className={`h-4 w-4 text-gray-200 sm:text-gray-400 group-hover:text-white transition-colors
            ${hideAllControls ? 'opacity-100' : 'opacity-80'}`} />
        </motion.button>
      </div>
    </div>
  )
}