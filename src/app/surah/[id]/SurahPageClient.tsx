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
  getWordByWordTranslation,
  Chapter, 
  Verse, 
  Juz, 
  RECITERS, 
  Reciter 
} from '@/lib/quran-api'
import { ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, BookOpen, Share2, Download, Copy, X, Facebook, Twitter, Linkedin, Image, Link } from 'lucide-react'
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

// Add this type before the component definition
type RefCallback = (element: HTMLDivElement | null) => void;

export default function SurahPageClient() {
  const router = useRouter()
  const params = useParams()
  const surahId = Number(params.id)
  const { currentLanguage } = useLanguage()
  const [surah, setSurah] = useState<Chapter | null>(null)
  const [verses, setVerses] = useState<Verse[]>([])
  const [wordByWordData, setWordByWordData] = useState<Record<string, any[]>>({})
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
  const [wordByWordLoading, setWordByWordLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareResult, setShareResult] = useState<{success: boolean, message: string} | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedVerseForShare, setSelectedVerseForShare] = useState<Verse | null>(null)
  const [isCapturingImage, setIsCapturingImage] = useState(false)
  
  // Fix the ref type
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({})
  
  // Create a memoized ref callback
  const setVerseRef = useCallback((verseKey: string): RefCallback => {
    return (element: HTMLDivElement | null) => {
      verseRefs.current[verseKey] = element;
    };
  }, [])

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

  // Helper functions for playback, sharing, and copying
  
  // Play a verse with a given key
  const playVerse = async (verseKey: string) => {
    try {
      setIsAudioLoading(true);
      
      // Find index of the verse to set active verse
      const verseIndex = verses.findIndex(v => v.verse_key === verseKey);
      if (verseIndex !== -1) {
        setActiveVerse(verseIndex);
      }
      
      // Preload and play the audio
      await preloadVerseAudio(verseKey, selectedReciter.id);
      const audio = getCachedAudio(verseKey, selectedReciter.id);
      
      if (audioRef.current && audio) {
        audioRef.current.src = audio.src;
        audioRef.current.volume = volume;
        audioRef.current.muted = isMuted;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing verse:', error);
    } finally {
      setIsAudioLoading(false);
    }
  };
  
  // Function to capture verse as image
  const captureVerseAsImage = async (verse: Verse) => {
    try {
      setIsCapturingImage(true);
      
      const verseElement = verseRefs.current[verse.verse_key];
      if (!verseElement) {
        throw new Error('Verse element not found');
      }
      
      // Create a temporary clone of the verse element to modify for image capture
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = verseElement.outerHTML;
      const tempElement = tempContainer.firstChild as HTMLElement;
      
      // Apply styling for better image capture - QuranJS inspired styling
      tempElement.style.backgroundColor = '#0F172A';
      tempElement.style.padding = '2rem';
      tempElement.style.borderRadius = '0.75rem';
      tempElement.style.width = '600px';
      tempElement.style.margin = '0 auto';
      tempElement.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
      tempElement.style.border = '1px solid rgba(59, 130, 246, 0.2)';
      
      // Find and enhance the verse number
      const verseNumberElement = tempElement.querySelector('.flex.h-8.w-8');
      if (verseNumberElement) {
        (verseNumberElement as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        (verseNumberElement as HTMLElement).style.color = '#3b82f6';
        (verseNumberElement as HTMLElement).style.fontWeight = 'bold';
      }
      
      // Enhance Arabic text
      const arabicTextElement = tempElement.querySelector('[dir="rtl"]');
      if (arabicTextElement) {
        (arabicTextElement as HTMLElement).style.fontSize = '2.5rem';
        (arabicTextElement as HTMLElement).style.lineHeight = '2';
        (arabicTextElement as HTMLElement).style.color = '#f8fafc';
        (arabicTextElement as HTMLElement).style.fontFamily = 'traditional-arabic, serif';
      }
      
      // Enhance translation text
      const translationElement = tempElement.querySelector('.space-y-4.flex-grow > p:nth-child(2)');
      if (translationElement) {
        (translationElement as HTMLElement).style.fontSize = '1.125rem';
        (translationElement as HTMLElement).style.color = '#94a3b8';
        (translationElement as HTMLElement).style.lineHeight = '1.7';
        (translationElement as HTMLElement).style.paddingTop = '1rem';
      }
      
      // Remove action buttons
      const actionsToolbar = tempElement.querySelector('.flex.items-center.justify-end');
      if (actionsToolbar) {
        actionsToolbar.remove();
      }
      
      // Remove any feedback messages
      const feedbackMessage = tempElement.querySelector('motion.div');
      if (feedbackMessage) {
        feedbackMessage.remove();
      }
      
      // Add watermark
      const watermark = document.createElement('div');
      watermark.innerHTML = `
        <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid rgba(59, 130, 246, 0.2); padding-top: 1rem;">
          <div style="color: #64748b; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>Shared from Noble Quran App</span>
          </div>
        </div>
      `;
      tempElement.appendChild(watermark);
      
      // Add Surah info at the top
      const surahInfo = document.createElement('div');
      surahInfo.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 1rem;">
          <div style="font-size: 1.875rem; color: #f8fafc; margin-bottom: 0.25rem;">${surah?.name_simple}</div>
          <div style="color: #94a3b8; font-size: 0.875rem;">Verse ${verse.verse_number}</div>
        </div>
      `;
      tempElement.insertBefore(surahInfo, tempElement.firstChild);
      
      // Add to the document temporarily
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      document.body.appendChild(tempElement);
      
      // Capture the image
      const canvas = await html2canvas(tempElement, {
        backgroundColor: '#0F172A',
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true
      });
      
      // Get the data URL and remove the temp element
      const imageUrl = canvas.toDataURL('image/png');
      document.body.removeChild(tempElement);
      
      setCapturedImage(imageUrl);
      setSelectedVerseForShare(verse);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error capturing verse as image:', error);
      alert('Failed to capture verse image');
    } finally {
      setIsCapturingImage(false);
    }
  };
  
  // Updated share function to open the modal
  const shareVerse = async (verse: Verse) => {
    setShareLoading(true);
    
    try {
      await captureVerseAsImage(verse);
    } catch (error) {
      console.error('Error preparing verse for share:', error);
      setShareResult({
        success: false,
        message: 'Failed to prepare verse for sharing'
      });
      setTimeout(() => setShareResult(null), 3000);
    } finally {
      setShareLoading(false);
    }
  };
  
  // Share the verse image/text via platform
  const shareViaOption = async (option: 'facebook' | 'twitter' | 'linkedin' | 'copyimage' | 'copylink' | 'copytext' | 'download') => {
    if (!selectedVerseForShare || !capturedImage) return;
    
    const verse = selectedVerseForShare;
    const text = `Surah ${surah?.name_simple}, Verse ${verse.verse_number}: ${verse.translations[0]?.text}`;
    const url = `${window.location.origin}/surah/${surah?.id}#verse-${verse.verse_number}`;
    
    try {
      switch (option) {
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
          break;
          
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
          break;
          
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
          break;
          
        case 'copyimage':
          // For browsers that support the Clipboard API with images
          try {
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setShareResult({
              success: true,
              message: 'Image copied to clipboard!'
            });
          } catch (clipErr) {
            // Fallback - download instead
            console.error('Failed to copy image:', clipErr);
            const link = document.createElement('a');
            link.href = capturedImage;
            link.download = `verse-${verse.verse_key}.png`;
            link.click();
            setShareResult({
              success: true,
              message: 'Image downloaded (copy not supported in this browser)'
            });
          }
          break;
          
        case 'copylink':
          await navigator.clipboard.writeText(url);
          setShareResult({
            success: true,
            message: 'Link copied to clipboard!'
          });
          break;
          
        case 'copytext':
          await navigator.clipboard.writeText(`${verse.text_uthmani}\n\n${verse.translations[0]?.text}\n\nSurah ${surah?.name_simple}, Verse ${verse.verse_number}`);
          setShareResult({
            success: true,
            message: 'Text copied to clipboard!'
          });
          break;
          
        case 'download':
          const link = document.createElement('a');
          link.href = capturedImage;
          link.download = `verse-${verse.verse_key}.png`;
          link.click();
          setShareResult({
            success: true,
            message: 'Image downloaded!'
          });
          break;
      }
      
      // Auto close modal for some options
      if (['copyimage', 'copylink', 'copytext', 'download'].includes(option)) {
        setTimeout(() => {
          setShowShareModal(false);
          setShareResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sharing via option:', error);
      setShareResult({
        success: false,
        message: 'Failed to share verse'
      });
      setTimeout(() => setShareResult(null), 3000);
    }
  };
  
  // Updated copy function to use the share modal
  const copyVerseToClipboard = (verse: Verse) => {
    shareVerse(verse);
  };
  
  // Function to fetch word-by-word data with actual mapping to displayed words
  const fetchWordByWordData = async (verseKey: string) => {
    if (wordByWordData[verseKey]) return; // Already loaded
    
    try {
      setWordByWordLoading(true);
      
      // Get the verse text
      const verse = verses.find(v => v.verse_key === verseKey);
      if (!verse) {
        throw new Error('Verse not found');
      }
      
      // Get translations from QuranJS API
      const translations = await getWordByWordTranslation(verseKey);
      
      // Log response to debug
      console.log('QuranJS translation data for verse', verseKey, ':', translations);
      
      // Get the displayed words
      const displayedWords = verse.text_uthmani.split(' ');
      console.log('Displayed words:', displayedWords.length, 'Translation words:', translations.length);
      
      // Ensure we have the correct mapping between displayed words and translations
      let mappedTranslations = [];
      
      // In most cases, the API should now return the correct number of words
      // But we'll add handling for cases where counts don't match
      if (translations.length === displayedWords.length) {
        // Perfect match - use as is
        mappedTranslations = translations;
      } else if (translations.length > displayedWords.length) {
        // More translations than words - take what we need
        mappedTranslations = translations.slice(0, displayedWords.length);
      } else {
        // Fewer translations than words - pad with placeholders
        mappedTranslations = [
          ...translations,
          ...Array(displayedWords.length - translations.length).fill(0).map((_, i) => ({
            id: translations.length + i + 1,
            position: translations.length + i + 1,
            text: displayedWords[translations.length + i],
            translation: `Word ${translations.length + i + 1}`,
            transliteration: displayedWords[translations.length + i],
            part_of_speech: "NOUN"
          }))
        ];
      }
      
      // Final check to ensure the Arabic text matches exactly what's displayed
      mappedTranslations = mappedTranslations.map((trans, idx) => ({
        ...trans,
        text: displayedWords[idx] // Always use the text as displayed for consistency
      }));
      
      setWordByWordData(prev => ({
        ...prev,
        [verseKey]: mappedTranslations
      }));
    } catch (error) {
      console.error('Error fetching word-by-word data:', error);
    } finally {
      setWordByWordLoading(false);
    }
  };

  if (loading || !surah) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0A1020]">
        <motion.div 
          className="relative h-16 w-16"
          animate={{ 
            rotate: 360, 
            scale: [1, 1.1, 1] 
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 2, ease: "linear" },
            scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-t-primary animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#0A1020] pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="container mx-auto px-4 py-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.1, 
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1] 
        }}
      >
        <motion.div 
          className="bg-[#0F172A] rounded-xl shadow-lg p-6"
          whileHover={{ 
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            y: -2,
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-start gap-6">
            <motion.div 
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-semibold shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ rotate: -5, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {surah.id}
            </motion.div>
            
            <div className="flex-grow">
              <motion.div 
                className="text-5xl font-arabic text-gray-200 mb-2"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {surah.name_arabic}
              </motion.div>
              <motion.h1 
                className="text-2xl font-semibold text-gray-100 mb-1"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {surah.name_simple}
              </motion.h1>
              <motion.p 
                className="text-lg text-gray-400 mb-4"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {surah.translated_name.name}
              </motion.p>
              <motion.div 
                className="flex items-center gap-x-6 text-sm text-gray-400"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <p className="flex items-center">
                  <motion.span 
                    className="w-2 h-2 rounded-full bg-blue-500 mr-2"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      backgroundColor: ["rgb(59, 130, 246)", "rgb(79, 150, 255)", "rgb(59, 130, 246)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {surah.verses_count} Verses
                </p>
                <p className="flex items-center">
                  <motion.span 
                    className="w-2 h-2 rounded-full bg-blue-500 mr-2"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      backgroundColor: ["rgb(59, 130, 246)", "rgb(79, 150, 255)", "rgb(59, 130, 246)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  {surah.revelation_place}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {surah.bismillah_pre && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.3, 
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <motion.p 
              className="text-4xl font-arabic text-gray-200 mb-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </motion.p>
            <p className="text-sm text-gray-400">In the name of Allah, the Entirely Merciful, the Especially Merciful</p>
          </motion.div>
        )}

        <div className="mt-8 space-y-6 mb-24">
          {verses.map((verse, index) => (
            <motion.div 
              key={verse.id} 
              className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#0D1423] rounded-2xl p-1 shadow-xl group"
              id={`verse-${verse.verse_number}`}
              ref={setVerseRef(verse.verse_key)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ 
                scale: 1.01,
                transition: { duration: 0.2 }
              }}
            >
              <div className="absolute inset-0 bg-[url('/islamic-pattern-light.svg')] opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all duration-500"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full group-hover:bg-indigo-600/20 transition-all duration-500"></div>
              
              <div className="relative p-6 z-10">
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-blue-600/20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {verse.verse_number}
                  </motion.div>
                  <div className="space-y-6 flex-grow">
                    <motion.div 
                      dir="rtl" 
                      className="text-right"
                      onMouseEnter={() => fetchWordByWordData(verse.verse_key)}
                      initial={{ opacity: 0.9 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-3xl font-arabic leading-loose text-gray-100 tracking-wide">
                        {verse.text_uthmani.split(' ').map((word, wordIndex) => (
                          <HoverCard.Root key={`word-${wordIndex}`}>
                            <HoverCard.Trigger asChild>
                              <span 
                                className="inline-block px-1 py-0.5 mx-0.5 hover:bg-blue-500/20 hover:text-white rounded cursor-help transition-all duration-200 ease-in-out"
                              >
                                {word}{' '}
                              </span>
                            </HoverCard.Trigger>
                            <HoverCard.Portal>
                              <HoverCard.Content
                                className="w-80 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-blue-500/30 z-50 overflow-hidden backdrop-blur-lg"
                                sideOffset={5}
                                align="center"
                              >
                                {wordByWordLoading ? (
                                  <div className="flex flex-col items-center justify-center p-8">
                                    <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3" />
                                    <p className="text-gray-300 text-sm">Loading translation...</p>
                                  </div>
                                ) : wordByWordData[verse.verse_key] && wordByWordData[verse.verse_key][wordIndex] ? (
                                  <div>
                                    {/* Header with Arabic Word */}
                                    <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 p-6 text-center">
                                      <div className="font-arabic text-5xl text-white mb-2 leading-relaxed">
                                        {wordByWordData[verse.verse_key][wordIndex].text}
                                      </div>
                                      <div className="text-blue-200 font-medium tracking-wide text-sm">
                                        {wordByWordData[verse.verse_key][wordIndex].transliteration}
                                      </div>
                                    </div>
                                    
                                    {/* Content section */}
                                    <div className="p-5">
                                      {/* Part of speech pill */}
                                      <div className="flex justify-center -mt-8 mb-4">
                                        <span className="px-3 py-1 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white rounded-full text-xs font-medium backdrop-blur-sm border border-blue-500/30 shadow-lg">
                                          {wordByWordData[verse.verse_key][wordIndex].part_of_speech}
                                        </span>
                                      </div>
                                      
                                      {/* Translation box */}
                                      <div className="bg-white/5 rounded-lg p-4 mb-3 backdrop-blur-sm">
                                        <h3 className="text-xs uppercase text-blue-400/80 font-semibold mb-1 tracking-wider">Translation</h3>
                                        <p className="text-gray-100 font-medium text-base">
                                          {wordByWordData[verse.verse_key][wordIndex].translation}
                                        </p>
                                      </div>
                                      
                                      {/* Verse reference with icon */}
                                      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                        </svg>
                                        <span>
                                          Surah {surah?.name_simple} • Verse {verse.verse_number}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-6 px-5">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                      </svg>
                                    </div>
                                    <p className="text-gray-200 font-medium">Translation not available</p>
                                    <p className="text-xs text-gray-500 mt-1">Try reloading the page</p>
                                  </div>
                                )}
                                <HoverCard.Arrow className="fill-slate-800" />
                              </HoverCard.Content>
                            </HoverCard.Portal>
                          </HoverCard.Root>
                        ))}
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-4 transition-all duration-300"
                      initial={{ opacity: 0.8, y: 5 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        transition: { duration: 0.2 }
                      }}
                    >
                      <p className="leading-relaxed text-gray-300">
                        {verse.translations[0]?.text}
                      </p>
                    </motion.div>
                    
                    {/* Verse actions toolbar */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 font-medium">
                        {surah?.name_arabic} • آية {verse.verse_number}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <HoverCard.Root>
                          <HoverCard.Trigger asChild>
                            <div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "text-gray-400 hover:text-green-500 hover:bg-white/5 transition-all rounded-full",
                                  activeVerse === index && isPlaying && "text-green-500 bg-green-500/10"
                                )}
                                onClick={() => {
                                  if (activeVerse === index && isPlaying) {
                                    setIsPlaying(false);
                                    audioRef.current?.pause();
                                  } else {
                                    setActiveVerse(index);
                                    playVerse(verse.verse_key);
                                  }
                                }}
                              >
                                {isAudioLoading && activeVerse === index ? (
                                  <div className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                                ) : activeVerse === index && isPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </HoverCard.Trigger>
                          <HoverCard.Portal>
                            <HoverCard.Content
                              className="w-64 rounded-md bg-[#1E293B] p-3 shadow-md z-50"
                              sideOffset={5}
                            >
                              <div className="text-sm text-gray-200">
                                <p className="font-medium mb-1">Play Audio</p>
                                <p className="text-gray-400 text-xs">
                                  Listen to this verse recited by {selectedReciter.name}
                                </p>
                              </div>
                              <HoverCard.Arrow className="fill-[#1E293B]" />
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                        
                        <HoverCard.Root>
                          <HoverCard.Trigger asChild>
                            <div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "text-gray-400 hover:text-blue-500 hover:bg-white/5 transition-all rounded-full",
                                  (shareLoading || isCapturingImage) && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={() => shareVerse(verse)}
                                disabled={shareLoading || isCapturingImage}
                              >
                                {shareLoading || isCapturingImage ? (
                                  <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                ) : (
                                  <Share2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </HoverCard.Trigger>
                          <HoverCard.Portal>
                            <HoverCard.Content
                              className="w-64 rounded-md bg-[#1E293B] p-3 shadow-md z-50"
                              sideOffset={5}
                            >
                              <div className="text-sm text-gray-200">
                                <p className="font-medium mb-1">Share Verse</p>
                                <p className="text-gray-400 text-xs">
                                  Share this verse as an image or text
                                </p>
                              </div>
                              <HoverCard.Arrow className="fill-[#1E293B]" />
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                        
                        <HoverCard.Root>
                          <HoverCard.Trigger asChild>
                            <div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-yellow-500 hover:bg-white/5 transition-all rounded-full"
                                onClick={() => copyVerseToClipboard(verse)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </HoverCard.Trigger>
                          <HoverCard.Portal>
                            <HoverCard.Content
                              className="w-64 rounded-md bg-[#1E293B] p-3 shadow-md z-50"
                              sideOffset={5}
                            >
                              <div className="text-sm text-gray-200">
                                <p className="font-medium mb-1">Copy Verse</p>
                                <p className="text-gray-400 text-xs">
                                  Copy the verse as text or image
                                </p>
                              </div>
                              <HoverCard.Arrow className="fill-[#1E293B]" />
                            </HoverCard.Content>
                          </HoverCard.Portal>
                        </HoverCard.Root>
                      </div>
                    </div>
                    
                    {/* Share result message */}
                    {shareResult && index === verses.findIndex(v => v.verse_key === verse.verse_key) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "mt-2 text-sm py-1 px-2 rounded text-center",
                          shareResult.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {shareResult.message}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Share Modal */}
      <Dialog.Root open={showShareModal} onOpenChange={setShowShareModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" />
          <Dialog.Content 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-[90vw] bg-gradient-to-br from-[#0F172A] to-[#0D1423] rounded-xl border border-blue-900/30 p-6 shadow-xl z-50 max-h-[90vh] overflow-y-auto"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-semibold text-gray-100">
                  Share Verse
                </Dialog.Title>
                <Dialog.Close asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-200">
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </Dialog.Close>
              </div>
              
              {capturedImage && (
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-center mb-2 text-sm text-gray-400">Verse Image</div>
                  <motion.div 
                    className="rounded-lg overflow-hidden border border-gray-700"
                    whileHover={{ 
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                      scale: 1.02
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <img src={capturedImage} alt="Captured verse" className="w-full h-auto" />
                  </motion.div>
                </motion.div>
              )}
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {['facebook', 'twitter', 'linkedin'].map((platform, i) => (
                  <motion.div
                    key={platform}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                  >
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center gap-2 py-4 bg-[#1E293B]/50 hover:bg-[#1E293B] border-gray-700 w-full h-full"
                      onClick={() => shareViaOption(platform as any)}
                      asChild
                    >
                      <motion.div
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ y: 1, scale: 0.98 }}
                      >
                        {platform === 'facebook' && <Facebook className="h-5 w-5 text-blue-500" />}
                        {platform === 'twitter' && <Twitter className="h-5 w-5 text-blue-400" />}
                        {platform === 'linkedin' && <Linkedin className="h-5 w-5 text-blue-600" />}
                        <span className="text-xs text-gray-300 capitalize">{platform}</span>
                      </motion.div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            
              <div className="space-y-3">
                {['copyimage', 'copylink', 'copytext', 'download'].map((action, i) => (
                  <motion.div
                    key={action}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (i * 0.05) }}
                  >
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 bg-[#1E293B]/50 hover:bg-[#1E293B] border-gray-700"
                      onClick={() => shareViaOption(action as any)}
                      asChild
                    >
                      <motion.div 
                        className="w-full flex items-center gap-3 px-4 py-2"
                        whileHover={{ x: 2 }}
                        whileTap={{ x: 0 }}
                      >
                        {action === 'copyimage' && <Image className="h-4 w-4 text-green-500" />}
                        {action === 'copylink' && <Link className="h-4 w-4 text-blue-500" />}
                        {action === 'copytext' && <Copy className="h-4 w-4 text-yellow-500" />}
                        {action === 'download' && <Download className="h-4 w-4 text-purple-500" />}
                        <span className="text-gray-200">
                          {action === 'copyimage' && 'Copy Image'}
                          {action === 'copylink' && 'Copy Link'}
                          {action === 'copytext' && 'Copy Text'} 
                          {action === 'download' && 'Download Image'}
                        </span>
                      </motion.div>
                    </Button>
                  </motion.div>
                ))}
              </div>
              
              {shareResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "mt-4 text-sm py-2 px-3 rounded text-center",
                    shareResult.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  )}
                >
                  {shareResult.message}
                </motion.div>
              )}
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      
      {/* Audio Player - position as a fixed element at the bottom of the screen */}
      <AnimatePresence>
        {activeVerse !== null && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200 
            }}
            className="fixed bottom-4 left-0 right-0 mx-auto max-w-4xl bg-gradient-to-r from-[#0F172A]/95 to-[#0D1423]/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-xl z-40 w-[95%]"
          >
            <motion.div 
              className="px-4 py-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <audio
                ref={audioRef}
                preload="none"
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime);
                  }
                }}
                onDurationChange={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration);
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  // Auto-play next verse option could be added here
                }}
              />
              
              <div className="flex items-center gap-4">
                <motion.div 
                  className="hidden sm:flex items-center gap-3 text-gray-300 text-sm min-w-48"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-gray-400">Now playing:</p>
                  <span>Surah {surah.name_simple}</span>
                  <span>•</span>
                  <span>Verse {activeVerse !== null && verses[activeVerse]?.verse_number}</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        if (activeVerse !== null && activeVerse > 0) {
                          setActiveVerse(activeVerse - 1);
                          playVerse(verses[activeVerse - 1].verse_key);
                        }
                      }}
                      disabled={activeVerse === null || activeVerse === 0}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                    animate={isPlaying ? { 
                      boxShadow: ["0 0 0 0 rgba(34, 197, 94, 0)", "0 0 0 10px rgba(34, 197, 94, 0)"],
                      transition: { 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut" 
                      }
                    } : {}}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-8 w-8 text-white",
                        isPlaying && "bg-green-500/20 text-green-400 border-green-500/50"
                      )}
                      onClick={() => {
                        if (isPlaying) {
                          audioRef.current?.pause();
                        } else {
                          audioRef.current?.play();
                        }
                        setIsPlaying(!isPlaying);
                      }}
                      disabled={isAudioLoading}
                    >
                      {isAudioLoading ? (
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        if (activeVerse !== null && activeVerse < verses.length - 1) {
                          setActiveVerse(activeVerse + 1);
                          playVerse(verses[activeVerse + 1].verse_key);
                        }
                      }}
                      disabled={activeVerse === null || activeVerse === verses.length - 1}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  className="flex-1 max-w-md"
                  initial={{ opacity: 0, scaleX: 0.9 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                    <motion.input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setCurrentTime(value);
                        if (audioRef.current) {
                          audioRef.current.currentTime = value;
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <motion.div
                      className="absolute h-full bg-blue-500 rounded-full"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                      animate={isPlaying ? {
                        boxShadow: ["0 0 10px 0px rgba(59, 130, 246, 0.3)", "0 0 20px 0px rgba(59, 130, 246, 0.6)", "0 0 10px 0px rgba(59, 130, 246, 0.3)"]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
                
                <motion.div 
                  className="hidden sm:flex items-center gap-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        setIsMuted(!isMuted);
                        if (audioRef.current) {
                          audioRef.current.muted = !isMuted;
                        }
                      }}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                  
                  <motion.input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setVolume(value);
                      if (audioRef.current) {
                        audioRef.current.volume = value;
                      }
                      setIsMuted(value === 0);
                    }}
                    className="w-20 accent-blue-500"
                    whileHover={{ scale: 1.05 }}
                  />
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => {
                      setActiveVerse(null);
                      setIsPlaying(false);
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.src = '';
                      }
                    }}
                  >
                    Close
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 