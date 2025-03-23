'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Book, Heart, Bookmark, Share2, ChevronDown, RotateCcw, Copy, ArrowRight, Sparkles, Check, Globe, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  getDuas,
  getAzkar,
  getCategories,
  searchDuas,
  searchAzkar,
  filterDuas,
  filterAzkar,
  toggleFavoriteDua,
  toggleFavoriteZikr,
  isFavoriteDua,
  isFavoriteZikr,
  type Dua,
  type Zikr,
  type Category,
  testCategories
} from '@/lib/db-dua-api'

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
            
            {/* Always show reference */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-700 text-blue-200">
                {dua.reference}
              </span>
            </div>
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
              
              {/* Always show reference */}
              {zikr.reference && (
                <div className="flex items-center gap-2 text-xs mt-3">
                  <span className="px-3 py-1 rounded-full bg-slate-700 text-emerald-200">
                    {zikr.reference}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {zikr.count > 1 ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-2 w-full p-3 bg-slate-800/90 hover:bg-slate-700/90 transition-colors text-sm font-medium text-emerald-200"
        >
          {isExpanded ? 'Show less' : 'Show details'}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : null}

      {/* Only render expanded content when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-4"
          >
            <div className="p-3 bg-emerald-900/20 rounded-lg">
              <p className="text-xs text-emerald-200 mb-1 font-medium">Recitation Details</p>
              <p className="text-sm text-white/80">
                This dhikr should be repeated {zikr.count} times, preferably in one sitting.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const CategoryCard = ({ category, isSelected, onClick, isAzkar }: { 
  category: Category; 
  isSelected: boolean;
  onClick: () => void;
  isAzkar: boolean;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 h-full ${
        isSelected 
          ? isAzkar 
            ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-900/20' 
            : 'ring-2 ring-blue-500 shadow-lg shadow-blue-900/20'
          : 'hover:shadow-md'
      }`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 ${
        isAzkar
          ? 'bg-gradient-to-br from-slate-800 to-emerald-900/60'
          : 'bg-gradient-to-br from-slate-800 to-blue-900/60'
      }`} />
      
      {/* Content */}
      <div className="relative p-3 h-full flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-white">{category.name}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            isAzkar
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

const DuaPage = () => {
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('duas')
  const [duas, setDuas] = useState<Dua[]>([])
  const [azkar, setAzkar] = useState<Zikr[]>([])
  const [filteredDuas, setFilteredDuas] = useState<Dua[]>([])
  const [filteredAzkar, setFilteredAzkar] = useState<Zikr[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const { currentLanguage } = useLanguage()
  const [showDebug, setShowDebug] = useState(false)

  // Debugging component
  const DebugInfo = () => {
    if (!showDebug) return null;
    
    const runTest = async () => {
      try {
        const result = await testCategories();
        console.log('Test result:', result);
      } catch (error) {
        console.error('Test error:', error);
      }
    };
    
    return (
      <div className="bg-red-800/40 p-3 rounded-lg text-white text-xs mb-4">
        <h3 className="font-bold mb-2">Debug Information</h3>
        <div className="space-y-1">
          <p>Duas loaded: {duas.length}</p>
          <p>Azkar loaded: {azkar.length}</p>
          <p>Categories: {categories.length}</p>
          <p>Filtered duas: {filteredDuas.length}</p>
          <p>Filtered azkar: {filteredAzkar.length}</p>
          <p>Selected category: {selectedCategory?.name || 'None'}</p>
          <p>Search query: "{searchQuery}"</p>
          <p>Current language: {currentLanguage.id}</p>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => console.log({ duas, azkar, categories })}
              className="px-2 py-1 bg-red-700 rounded"
            >
              Log Data
            </button>
            <button 
              onClick={runTest}
              className="px-2 py-1 bg-red-700 rounded"
            >
              Test Categories
            </button>
          </div>
        </div>
      </div>
    );
  };

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
        console.log('Fetching initial data with language:', currentLanguage.id);
        
        // Use Promise.all for parallel fetching
        const [duasData, azkarData, duaCategories, azkarCategories] = await Promise.all([
          getDuas(currentLanguage.id),
          getAzkar(),
          getCategories('duas'),
          getCategories('azkar')
        ]);
        
        // Combine categories
        const allCategories = [...duaCategories, ...azkarCategories];
        
        console.log('Data fetch complete:', {
          duasCount: duasData.length,
          azkarCount: azkarData.length,
          duaCategoriesCount: duaCategories.length,
          azkarCategoriesCount: azkarCategories.length,
          combinedCategoriesCount: allCategories.length,
          duaCategories: duaCategories.map(c => c.id),
          azkarCategories: azkarCategories.map(c => c.id),
          language: currentLanguage.id
        });
        
        // Only update state if we have valid data
        if (Array.isArray(duasData) && duasData.length > 0) {
          setDuas(duasData);
          setFilteredDuas(duasData);
        } else {
          console.error('Invalid or empty duas data from db-dua-api, trying fallback API');
          // Try the fallback API
          try {
            const fallbackDuas = await import('@/lib/dua-api').then(api => api.getDuas(currentLanguage.id));
            if (Array.isArray(fallbackDuas) && fallbackDuas.length > 0) {
              console.log('Successfully loaded duas from fallback API');
              setDuas(fallbackDuas);
              setFilteredDuas(fallbackDuas);
            } else {
              console.error('Fallback API also failed for duas');
              setDuas([]);
              setFilteredDuas([]);
            }
          } catch (fallbackError) {
            console.error('Error using fallback API for duas:', fallbackError);
            setDuas([]);
            setFilteredDuas([]);
          }
        }
        
        if (Array.isArray(azkarData) && azkarData.length > 0) {
          setAzkar(azkarData);
          setFilteredAzkar(azkarData);
        } else {
          console.error('Invalid or empty azkar data from db-dua-api, trying fallback API');
          // Try the fallback API
          try {
            const fallbackAzkar = await import('@/lib/dua-api').then(api => api.getAzkar());
            if (Array.isArray(fallbackAzkar) && fallbackAzkar.length > 0) {
              console.log('Successfully loaded azkar from fallback API');
              setAzkar(fallbackAzkar);
              setFilteredAzkar(fallbackAzkar);
            } else {
              console.error('Fallback API also failed for azkar');
              setAzkar([]);
              setFilteredAzkar([]);
            }
          } catch (fallbackError) {
            console.error('Error using fallback API for azkar:', fallbackError);
            setAzkar([]);
            setFilteredAzkar([]);
          }
        }
        
        // Set combined categories
        if (allCategories.length > 0) {
          setCategories(allCategories);
        } else {
          console.error('Invalid or empty categories data from db-dua-api, trying fallback API');
          // Try the fallback API
          try {
            const fallbackApi = await import('@/lib/dua-api');
            // We need to combine dua and azkar categories from fallback
            const fallbackCategories = await fallbackApi.getCategories(currentLanguage.id);
            setCategories(fallbackCategories);
          } catch (fallbackError) {
            console.error('Error using fallback API for categories:', fallbackError);
            setCategories([]);
          }
        }
      } catch (error) {
        console.error('Error fetching data from db-dua-api:', error);
        // Try to use the original dua-api as fallback
        try {
          console.log('Attempting to use fallback API...');
          const fallbackApi = await import('@/lib/dua-api');
          const [fallbackDuas, fallbackAzkar, fallbackCategories] = await Promise.all([
            fallbackApi.getDuas(currentLanguage.id),
            fallbackApi.getAzkar(),
            fallbackApi.getCategories(currentLanguage.id)
          ]);
          
          setDuas(fallbackDuas);
          setAzkar(fallbackAzkar);
          setCategories(fallbackCategories);
          console.log('Successfully loaded data from fallback API');
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
          // Set empty arrays to avoid null/undefined errors
          setDuas([]);
          setAzkar([]);
          setCategories([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentLanguage.id]); // Re-fetch data when language changes

  // Refresh data when language changes
  useEffect(() => {
    // Don't run on initial render
    if (!loading) {
      console.log('Language changed, refreshing data...');
      // Re-filter existing content based on new language
      if (selectedCategory) {
        handleCategorySelection(selectedCategory);
      } else if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        // Just fetch fresh data in the new language
        const fetchData = async () => {
          setLoading(true);
          try {
            const duasData = await getDuas(currentLanguage.id);
            setDuas(duasData);
          } catch (error) {
            console.error('Error refreshing data after language change:', error);
          } finally {
            setLoading(false);
          }
        };
        
        fetchData();
      }
    }
  }, [currentLanguage.id]);

  // Helper function to handle category selection
  const handleCategorySelection = async (category: Category | null) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setLoading(true);
    
    try {
      if (category) {
        if (active === 'duas') {
          // Filter the existing duas array instead of fetching new data
          const filtered = filterDuas(duas, category.id);
          setFilteredDuas(filtered);
        } else {
          // Filter the existing azkar array instead of fetching new data
          const filtered = filterAzkar(azkar, category.id);
          setFilteredAzkar(filtered);
        }
      } else {
        // Reset to all items
        setFilteredDuas(duas);
        setFilteredAzkar(azkar);
      }
    } catch (error) {
      console.error('Error in category selection:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null);
    setLoading(true);
    
    try {
      if (query.trim() !== '') {
        if (active === 'duas') {
          // Search the existing duas array instead of fetching new data
          const results = searchDuas(query, duas);
          setFilteredDuas(results);
        } else {
          // Search the existing azkar array instead of fetching new data
          const results = searchAzkar(query, azkar);
          setFilteredAzkar(results);
        }
      } else {
        // Empty search resets to all items
        setFilteredDuas(duas);
        setFilteredAzkar(azkar);
      }
    } catch (error) {
      console.error('Error in search:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter content when search or category changes
  useEffect(() => {
    // Skip if already filtering or initial data is still loading
    if (loading) return;

    let isMounted = true;
    
    const filterContent = async () => {
      setLoading(true);
      
      try {
        if (active === 'duas') {
          let filteredDuas: Dua[];
          
          if (searchQuery) {
            // Use the already loaded duas for filtering
            filteredDuas = searchDuas(searchQuery, duas);
          } else if (selectedCategory?.id) {
            // Use the already loaded duas for filtering
            filteredDuas = filterDuas(duas, selectedCategory.id);
          } else {
            // No need to fetch again
            filteredDuas = duas;
          }
          
          if (isMounted) setFilteredDuas(filteredDuas);
        } else if (active === 'azkar') {
          let filteredAzkar: Zikr[];
          
          if (searchQuery) {
            // Use the already loaded azkar for filtering
            filteredAzkar = searchAzkar(searchQuery, azkar);
          } else if (selectedCategory?.id) {
            // Use the already loaded azkar for filtering
            filteredAzkar = filterAzkar(azkar, selectedCategory.id);
          } else {
            // No need to fetch again
            filteredAzkar = azkar;
          }
          
          console.log("Filtered Azkar count:", filteredAzkar.length);
          if (isMounted) setFilteredAzkar(filteredAzkar);
        }
      } catch (error) {
        console.error('Error filtering content:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    console.log("Running filterContent with:", {
      active,
      searchQuery,
      selectedCategory,
      language: currentLanguage.id
    });
    filterContent();
    
    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedCategory, active, currentLanguage.id, duas, azkar]);
  
  // Reset selection when tab changes
  useEffect(() => {
    setSelectedCategory(null);
    setSearchQuery('');
  }, [active]);

  // Display loading state
  if (loading) {
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
    if (active === 'duas') {
      return category.id.startsWith('dua-cat-');
    } else {
      return category.id.startsWith('zikr-cat-');
    }
  });
  
  // Log render state for debugging
  console.log('Rendering with:', {
    active,
    duasCount: duas.length,
    azkarCount: azkar.length,
    categoriesCount: filteredCategories.length,
    selectedCategory,
    isFiltering: loading,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-600">
            {currentLanguage.direction === 'rtl' ? 'الأدعية والأذكار' : 'Duas & Adhkar'}
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="p-2 text-xs text-slate-400 hover:text-white"
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-900/50 hover:bg-emerald-800/50 transition-colors">
              <Globe size={16} className="text-emerald-300" />
            </div>
          </div>
        </div>
        
        <DebugInfo />

        {/* Tabs */}
        <Tabs 
          defaultValue="duas" 
          value={active}
          onValueChange={setActive}
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
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={
                  active === 'duas'
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
                  {active === 'duas' ? 'Categories' : 'Adhkar Types'}
                </h3>
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredCategories.map(category => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      isSelected={selectedCategory?.id === category.id}
                      onClick={() => handleCategorySelection(
                        selectedCategory?.id === category.id ? null : category
                      )}
                      isAzkar={category.id.startsWith('zikr-cat-')}
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
                      {selectedCategory.name}
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
                    {active === 'duas' 
                      ? `${filteredDuas.length} ${filteredDuas.length === 1 ? 'dua' : 'duas'} found`
                      : `${filteredAzkar.length} ${filteredAzkar.length === 1 ? 'dhikr' : 'adhkar'} found`
                    }
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {loading && (
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
                    {filteredDuas.length > 0 && filteredDuas.map(dua => (
                      <DuaCard 
                        key={`${dua.id}-${currentLanguage.id}`} 
                        dua={dua} 
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {filteredDuas.length === 0 && !loading && (
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
                    {filteredAzkar.length > 0 && filteredAzkar.map(zikr => (
                      <ZikrCard 
                        key={`${zikr.id}-${currentLanguage.id}`} 
                        zikr={zikr} 
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {filteredAzkar.length === 0 && !loading && (
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

        {/* Debug toggle button - small and discrete */}
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="fixed bottom-4 right-4 p-2 bg-slate-900/70 hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-400 z-50"
          aria-label="Toggle debug mode"
        >
          <Bug className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default DuaPage 