'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Book, Heart, Bookmark, Share2, ChevronDown, RotateCcw, Copy, ArrowRight, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  getDuas,
  getAzkar,
  getCategories,
  getAzkarCategories,
  getAllCategories,
  getDuasByCategory,
  getAzkarByCategory,
  searchDuas,
  searchAzkar,
  toggleFavoriteDua,
  toggleFavoriteZikr,
  isFavoriteDua,
  isFavoriteZikr,
  type Dua,
  type Zikr,
  type Category
} from '@/lib/dua-api'

const DuaCard = ({ dua }: { dua: Dua }) => {
  if (!dua || typeof dua !== 'object') {
    console.error('Invalid dua object:', dua);
    return null;
  }
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(() => isFavoriteDua(dua.id))
  const [copied, setCopied] = useState(false)
  const { currentLanguage } = useLanguage()

  const handleFavorite = () => {
    const isNowFavorite = toggleFavoriteDua(dua.id)
    setIsFavorite(isNowFavorite)
  }

  const handleShare = async () => {
    try {
      const text = `${dua.arabic}\n\n${dua.translation}\n\n- ${dua.reference}`
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error sharing dua:', error)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6 pb-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{dua.title}</h3>
              <p className="text-sm text-blue-200/70">{dua.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleFavorite}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Favorite"
            >
              <Heart
                size={18}
                className={`transition-colors ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'
                }`}
              />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-gray-400" />
              )}
              {copied && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-green-400 whitespace-nowrap bg-black/50 px-2 py-1 rounded">
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 mb-2">
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <p className="text-xl font-arabic text-right leading-loose text-white tracking-wider">
              {dua.arabic}
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm italic font-light text-blue-200/70 leading-relaxed">
              {dua.transliteration}
            </p>
            <p className={`text-white/90 leading-relaxed font-light ${currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              {dua.translation}
            </p>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-4 space-y-4"
              >
                {dua.benefits && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-blue-300 mb-2">Benefits</h4>
                    <p className="text-sm text-white/80">{dua.benefits}</p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-slate-700 text-blue-200">
                    {dua.reference}
                  </span>
                  {dua.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-slate-700 text-blue-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center gap-2 w-full p-3 bg-slate-800/90 hover:bg-slate-700/90 transition-colors text-sm font-medium text-blue-200"
      >
        {isExpanded ? 'Show less' : 'Show more'}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
    </motion.div>
  )
}

const ZikrCard = ({ zikr }: { zikr: Zikr }) => {
  if (!zikr || typeof zikr !== 'object') {
    console.error('Invalid zikr object:', zikr);
    return null;
  }
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(() => isFavoriteZikr(zikr.id))
  const [copied, setCopied] = useState(false)
  const { currentLanguage } = useLanguage()

  const handleFavorite = () => {
    const isNowFavorite = toggleFavoriteZikr(zikr.id)
    setIsFavorite(isNowFavorite)
  }

  const handleShare = async () => {
    try {
      const text = `${zikr.arabic}\n\n${zikr.description}\n\n- ${zikr.reference}`
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error sharing zikr:', error)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-slate-900 to-emerald-900/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6 pb-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Book className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{zikr.category}</h3>
              {zikr.count > 1 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs py-1 px-2 rounded-full bg-emerald-800/70 text-emerald-200">
                    Repeat {zikr.count}×
                  </span>
                  <RotateCcw className="h-3 w-3 text-emerald-400" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleFavorite}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Favorite"
            >
              <Heart
                size={18}
                className={`transition-colors ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'
                }`}
              />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-gray-400" />
              )}
              {copied && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-green-400 whitespace-nowrap bg-black/50 px-2 py-1 rounded">
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 mb-2">
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <p className="text-xl font-arabic text-right leading-loose text-white tracking-wider">
              {zikr.arabic}
            </p>
          </div>
          
          {zikr.description && (
            <div className="space-y-2">
              <p className={`text-white/90 leading-relaxed font-light ${currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                {zikr.description}
              </p>
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-4 space-y-2"
              >
                {zikr.reference && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-slate-700 text-emerald-200">
                      {zikr.reference}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {zikr.reference && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-2 w-full p-3 bg-slate-800/90 hover:bg-slate-700/90 transition-colors text-sm font-medium text-emerald-200"
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}
    </motion.div>
  )
}

const CategoryCard = ({ category, isSelected, onClick }: { 
  category: Category; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  // Determine if it's a dua or azkar category
  const isAzkarCategory = category.id.startsWith('azkar-category-');
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 h-full ${
        isSelected 
          ? isAzkarCategory 
            ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-900/20' 
            : 'ring-2 ring-blue-500 shadow-lg shadow-blue-900/20'
          : 'hover:shadow-md'
      }`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 ${
        isAzkarCategory
          ? 'bg-gradient-to-br from-slate-800 to-emerald-900/60'
          : 'bg-gradient-to-br from-slate-800 to-blue-900/60'
      }`} />
      
      {/* Content */}
      <div className="relative p-3 h-full flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-white">{category.name}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            isAzkarCategory
              ? 'bg-emerald-900/60 text-emerald-200'
              : 'bg-blue-900/60 text-blue-200'
          }`}>
            {category.count}
          </span>
        </div>
        <p className="text-xs text-gray-300/80 mt-1 line-clamp-2">{category.description}</p>
      </div>
    </motion.div>
  )
}

export default function DuaPage() {
  const [activeTab, setActiveTab] = useState('duas')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [duas, setDuas] = useState<Dua[]>([])
  const [azkar, setAzkar] = useState<Zikr[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const { currentLanguage } = useLanguage()

  // Add custom scrollbar style
  useEffect(() => {
    // Add custom scrollbar style to document
    const style = document.createElement('style')
    style.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.3);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(59, 130, 246, 0.5);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(59, 130, 246, 0.7);
      }
    `
    document.head.appendChild(style)
    
    return () => {
      // Clean up when component unmounts
      document.head.removeChild(style)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching initial data...');
        
        // Use Promise.all for parallel fetching
        const [duasData, azkarData, categoriesData] = await Promise.all([
          getDuas(currentLanguage.id),
          getAzkar(),
          getAllCategories(currentLanguage.id)
        ]);
        
        console.log('Data fetch complete:', {
          duasCount: duasData.length,
          azkarCount: azkarData.length,
          categoriesCount: categoriesData.length
        });
        
        // Only update state if we have valid data
        if (Array.isArray(duasData)) {
          setDuas(duasData);
        } else {
          console.error('Invalid duas data:', duasData);
          setDuas([]);
        }
        
        if (Array.isArray(azkarData)) {
          setAzkar(azkarData);
        } else {
          console.error('Invalid azkar data:', azkarData);
          setAzkar([]);
        }
        
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error('Invalid categories data:', categoriesData);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays to avoid null/undefined errors
        setDuas([]);
        setAzkar([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentLanguage.id]);

  // Filter content when search or category changes
  useEffect(() => {
    // Skip if already filtering or initial data is still loading
    if (isFiltering || loading) return;

    let isMounted = true;
    
    const filterContent = async () => {
      setIsFiltering(true);
      
      try {
        if (activeTab === 'duas') {
          let filteredDuas: Dua[];
          
          if (searchQuery) {
            filteredDuas = await searchDuas(searchQuery, currentLanguage.id);
          } else if (selectedCategory) {
            filteredDuas = await getDuasByCategory(selectedCategory, currentLanguage.id);
          } else {
            filteredDuas = await getDuas(currentLanguage.id);
          }
          
          if (isMounted) setDuas(filteredDuas);
        } else if (activeTab === 'azkar') {
          let filteredAzkar: Zikr[];
          
          if (searchQuery) {
            filteredAzkar = await searchAzkar(searchQuery);
          } else if (selectedCategory) {
            // Directly use getAzkarByCategory with the selected category ID
            filteredAzkar = await getAzkarByCategory(selectedCategory);
          } else {
            filteredAzkar = await getAzkar();
          }
          
          console.log("Filtered Azkar count:", filteredAzkar.length);
          if (isMounted) setAzkar(filteredAzkar);
        }
      } catch (error) {
        console.error('Error filtering content:', error);
      } finally {
        if (isMounted) setIsFiltering(false);
      }
    };

    console.log("Running filterContent with:", {
      activeTab,
      searchQuery,
      selectedCategory
    });
    filterContent();
    
    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedCategory, activeTab, currentLanguage.id, loading]);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedCategory(null);
    setSearchQuery('');
  }, [activeTab]);

  // Display loading state
  if (loading && !isFiltering) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full border-4 border-t-primary border-r-transparent animate-spin" />
        </div>
      </div>
    )
  }

  // Filter categories based on active tab
  const filteredCategories = categories.filter(category => {
    if (activeTab === 'duas') {
      return !category.id.startsWith('azkar-category-');
    } else {
      return category.id.startsWith('azkar-category-');
    }
  });
  
  // Log render state for debugging
  console.log('Rendering with:', {
    activeTab,
    duasCount: duas.length,
    azkarCount: azkar.length,
    categoriesCount: filteredCategories.length,
    selectedCategory,
    isFiltering,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3 relative inline-block">
            {currentLanguage.direction === 'rtl' ? 'الأدعية والأذكار' : 'Duas & Adhkar'}
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 rounded-full"></div>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {currentLanguage.direction === 'rtl'
              ? 'مجموعة من الأدعية والأذكار المأثورة عن النبي ﷺ'
              : 'A collection of authentic duas and adhkar from the Prophet ﷺ'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs 
          defaultValue="duas" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-800/50 p-1 rounded-xl">
              <TabsTrigger 
                value="duas"
                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white text-slate-400"
              >
                {currentLanguage.direction === 'rtl' ? 'الأدعية' : 'Duas'}
              </TabsTrigger>
              <TabsTrigger 
                value="azkar"
                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white text-slate-400"
              >
                {currentLanguage.direction === 'rtl' ? 'الأذكار' : 'Adhkar'}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search */}
          <div className="relative mb-10 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedCategory(null)
                }}
                placeholder={
                  activeTab === 'duas'
                    ? (currentLanguage.direction === 'rtl' ? 'ابحث عن دعاء...' : 'Search for a dua...')
                    : (currentLanguage.direction === 'rtl' ? 'ابحث عن ذكر...' : 'Search for a dhikr...')
                }
                className="w-full bg-slate-800/50 backdrop-blur-sm text-white rounded-xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/70 placeholder-slate-500 shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            </div>
          </div>

          {/* Side by side layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Categories sidebar */}
            <div className="lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
              <div className="bg-slate-900/60 p-4 rounded-xl">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  {activeTab === 'duas' ? 'Categories' : 'Adhkar Types'}
                </h3>
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredCategories.map(category => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      isSelected={selectedCategory === category.id}
                      onClick={() => {
                        setSelectedCategory(
                          selectedCategory === category.id ? null : category.id
                        )
                        setSearchQuery('')
                        setIsFiltering(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="lg:col-span-9">
              {/* Active filters indicator */}
              {selectedCategory && (
                <div className="mb-6 flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Filtered by:</span>
                    <span className="text-white font-medium bg-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {filteredCategories.find(c => c.id === selectedCategory)?.name}
                      <button 
                        onClick={() => setSelectedCategory(null)} 
                        className="ml-1 bg-slate-600 rounded-full p-0.5 hover:bg-slate-500 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    {activeTab === 'duas' 
                      ? `${duas.length} ${duas.length === 1 ? 'dua' : 'duas'} found`
                      : `${azkar.length} ${azkar.length === 1 ? 'dhikr' : 'adhkar'} found`
                    }
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isFiltering && (
                <div className="flex justify-center my-8">
                  <div className="relative h-10 w-10">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
                    <div className="absolute inset-1 rounded-full border-2 border-t-primary border-r-transparent animate-spin" />
                  </div>
                </div>
              )}

              {/* Duas content */}
              <TabsContent value="duas" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {duas.length > 0 && duas.map(dua => (
                      <DuaCard key={dua.id} dua={dua} />
                    ))}
                  </AnimatePresence>
                </div>

                {duas.length === 0 && !isFiltering && (
                  <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="bg-slate-800/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400">
                      {searchQuery
                        ? 'No duas found matching your search.'
                        : selectedCategory
                        ? 'No duas found in this category.'
                        : 'No duas available.'}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Azkar content */}
              <TabsContent value="azkar" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {azkar.length > 0 && azkar.map(zikr => (
                      <ZikrCard key={zikr.id} zikr={zikr} />
                    ))}
                  </AnimatePresence>
                </div>

                {azkar.length === 0 && !isFiltering && (
                  <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div className="bg-slate-800/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400">
                      {searchQuery
                        ? 'No adhkar found matching your search.'
                        : selectedCategory
                        ? 'No adhkar found in this category.'
                        : 'No adhkar available.'}
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 