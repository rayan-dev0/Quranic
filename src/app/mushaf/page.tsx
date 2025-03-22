'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuranPage } from '@/components/QuranPage'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Bookmark, Share2, Settings, Home, Info, BookOpen, Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [showControls, setShowControls] = useState(true)

  // Hide controls when not moving mouse for a while
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    
    // Initial timeout
    timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  return (
    <div className="relative min-h-screen bg-[#0A1020] overflow-hidden">
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed top-16 ${currentLanguage.direction === 'rtl' ? 'right-0' : 'left-0'} h-full w-72 bg-[#0F172A] shadow-lg z-50 transition-transform duration-300 transform ${
          isSidebarOpen 
            ? 'translate-x-0' 
            : currentLanguage.direction === 'rtl' 
              ? 'translate-x-full' 
              : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">
            {currentLanguage.direction === 'rtl' ? 'القائمة' : 'Menu'}
          </h2>
          
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 text-gray-300 hover:text-white p-2 rounded-md hover:bg-[#1E293B] transition-colors">
              <Home className="h-5 w-5" />
              <span>{currentLanguage.direction === 'rtl' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            
            <Link href="/about" className="flex items-center gap-3 text-gray-300 hover:text-white p-2 rounded-md hover:bg-[#1E293B] transition-colors">
              <Info className="h-5 w-5" />
              <span>{currentLanguage.direction === 'rtl' ? 'حول التطبيق' : 'About'}</span>
            </Link>
            
            <Link href="/surah/1" className="flex items-center gap-3 text-gray-300 hover:text-white p-2 rounded-md hover:bg-[#1E293B] transition-colors">
              <BookOpen className="h-5 w-5" />
              <span>{currentLanguage.direction === 'rtl' ? 'قراءة مع الترجمة' : 'Read with Translation'}</span>
            </Link>
            
            <hr className="border-gray-700 my-4" />
            
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-3 text-gray-300 hover:text-white p-2 rounded-md hover:bg-[#1E293B] transition-colors w-full"
            >
              <Settings className="h-5 w-5" />
              <span>{currentLanguage.direction === 'rtl' ? 'الإعدادات' : 'Settings'}</span>
            </button>
            
            {isSettingsOpen && (
              <div className="ml-8 space-y-4 mt-2">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">
                    {currentLanguage.direction === 'rtl' ? 'حجم الصفحة' : 'Page Size'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => changeZoom(-10)}
                      className="h-8 w-8 text-gray-400"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="text-gray-300 text-sm w-12 text-center">{pageZoom}%</div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => changeZoom(10)}
                      className="h-8 w-8 text-gray-400"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
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
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative">
        {/* Top Navigation - visible on hover or tap */}
        <motion.div 
          className={`fixed top-16 left-0 right-0 z-40 bg-[#0A1020]/90 backdrop-blur-sm border-b border-gray-800 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showControls ? 1 : 0, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="text-gray-300 hover:text-white hover:bg-[#1E293B]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </Button>
                
                <span className="hidden sm:inline-block text-gray-200 font-medium">
                  {currentLanguage.direction === 'rtl' ? 'المصحف الشريف' : 'Quran Mushaf'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="text-gray-300 hover:text-white hover:bg-[#1E293B]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                  <span className="text-gray-200 px-3">
                    {currentPage} / 604
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= 604 || isLoading}
                    className="text-gray-300 hover:text-white hover:bg-[#1E293B]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                
                <form onSubmit={handlePageSubmit} className="hidden sm:flex items-center">
                  <Input
                    type="number"
                    placeholder={currentLanguage.direction === 'rtl' ? 'اذهب إلى' : 'Go to page'}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    min={1}
                    max={604}
                    className="w-20 bg-[#1E293B] text-gray-100 border-gray-700 h-8"
                  />
                  <Button type="submit" size="sm" variant="ghost" disabled={isLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleBookmark}
                  className={cn(
                    "transition-colors",
                    isBookmarked ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500 hover:bg-[#1E293B]"
                  )}
                >
                  <Bookmark className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-gray-300 hover:text-blue-500 hover:bg-[#1E293B] transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quran Pages */}
        <div className="min-h-screen flex items-center justify-center py-20 px-2 sm:px-4 md:px-8">
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
              />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Bottom Navigation - Mobile Only */}
        <motion.div 
          className={`fixed bottom-0 left-0 right-0 sm:hidden z-40 bg-[#0A1020]/90 backdrop-blur-sm border-t border-gray-800 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showControls ? 1 : 0, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-4 py-3">
            <form onSubmit={handlePageSubmit} className="flex items-center justify-between">
              <Input
                type="number"
                placeholder={currentLanguage.direction === 'rtl' ? 'اذهب إلى' : 'Go to page'}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                min={1}
                max={604}
                className="w-full bg-[#1E293B] text-gray-100 border-gray-700 h-10"
              />
              <Button type="submit" size="sm" variant="ghost" disabled={isLoading} className="ml-2">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}