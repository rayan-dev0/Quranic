'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Book, Heart, Bookmark, Share2, ChevronDown, RotateCcw } from 'lucide-react'
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(() => isFavoriteDua(dua.id))
  const { currentLanguage } = useLanguage()

  const handleFavorite = () => {
    const isNowFavorite = toggleFavoriteDua(dua.id)
    setIsFavorite(isNowFavorite)
  }

  const handleShare = async () => {
    try {
      const text = `${dua.arabic}\n\n${dua.translation}\n\n- ${dua.reference}`
      await navigator.clipboard.writeText(text)
      alert('Dua copied to clipboard!')
    } catch (error) {
      console.error('Error sharing dua:', error)
      alert('Failed to copy dua. Please try again.')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#0F172A] rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Book className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{dua.title}</h3>
            <p className="text-sm text-gray-400">{dua.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <Bookmark className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Share2 className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-2xl font-arabic text-right leading-loose text-gray-100">
          {dua.arabic}
        </p>
        
        <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
        
        <div className="space-y-2">
          <p className="text-sm text-gray-400 italic">
            {dua.transliteration}
          </p>
          <p className={`text-gray-300 ${currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'}`}>
            {dua.translation}
          </p>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-4 space-y-2"
            >
              {dua.benefits && (
                <div className="bg-blue-500/5 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Benefits</h4>
                  <p className="text-sm text-gray-300">{dua.benefits}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                <span className="px-2 py-1 rounded-full bg-gray-800">
                  {dua.reference}
                </span>
                {dua.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-gray-800">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors mt-2"
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    </motion.div>
  )
}

const ZikrCard = ({ zikr }: { zikr: Zikr }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(() => isFavoriteZikr(zikr.id))
  const { currentLanguage } = useLanguage()

  const handleFavorite = () => {
    const isNowFavorite = toggleFavoriteZikr(zikr.id)
    setIsFavorite(isNowFavorite)
  }

  const handleShare = async () => {
    try {
      const text = `${zikr.arabic}\n\n${zikr.description}\n\n- ${zikr.reference}`
      await navigator.clipboard.writeText(text)
      alert('Zikr copied to clipboard!')
    } catch (error) {
      console.error('Error sharing zikr:', error)
      alert('Failed to copy zikr. Please try again.')
    }
  }

  // Render count badges
  const renderCountBadges = () => {
    if (zikr.count <= 1) return null;
    
    return (
      <div className="flex items-center gap-1 mt-3">
        <div className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded-full">
          Repeat {zikr.count}x
        </div>
        <RotateCcw className="h-3 w-3 text-blue-400" />
      </div>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#0F172A] rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Book className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{zikr.category}</h3>
            {renderCountBadges()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Share2 className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-2xl font-arabic text-right leading-loose text-gray-100">
          {zikr.arabic}
        </p>
        
        <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
        
        {zikr.description && (
          <div className="space-y-2">
            <p className={`text-gray-300 ${currentLanguage.direction === 'rtl' ? 'text-right' : 'text-left'}`}>
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
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                {zikr.reference && (
                  <span className="px-2 py-1 rounded-full bg-gray-800">
                    {zikr.reference}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {zikr.reference && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors mt-2"
          >
            {isExpanded ? 'Show less' : 'Show more'}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>
    </motion.div>
  )
}

const CategoryCard = ({ category, isSelected, onClick }: { 
  category: Category; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-[#0F172A] rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-100">{category.name}</h3>
        <span className="text-sm text-gray-400">{category.count} items</span>
      </div>
      <p className="text-sm text-gray-400">{category.description}</p>
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

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [duasData, azkarData, categoriesData] = await Promise.all([
          getDuas(currentLanguage.id),
          getAzkar(),
          getAllCategories(currentLanguage.id)
        ])
        setDuas(duasData)
        setAzkar(azkarData)
        setCategories(categoriesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentLanguage.id])

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
            // Use getAzkarByCategory directly if it's an azkar category
            if (selectedCategory.startsWith('azkar-category-')) {
              const allAzkar = await getAzkar();
              // Get the category name directly from the azkar data, not from state
              // This avoids dependencies on the categories state
              const azkarCategories = await getAzkarCategories();
              const categoryIdMatch = selectedCategory.match(/^azkar-category-(\d+)$/);
              
              if (categoryIdMatch && azkarCategories[parseInt(categoryIdMatch[1])]) {
                const categoryName = azkarCategories[parseInt(categoryIdMatch[1])].name;
                filteredAzkar = allAzkar.filter(zikr => 
                  zikr.category.toLowerCase().trim() === categoryName.toLowerCase().trim()
                );
              } else {
                filteredAzkar = allAzkar;
              }
            } else {
              filteredAzkar = await getAzkar();
            }
          } else {
            filteredAzkar = await getAzkar();
          }
          
          if (isMounted) setAzkar(filteredAzkar);
        }
      } catch (error) {
        console.error('Error filtering content:', error);
      } finally {
        if (isMounted) setIsFiltering(false);
      }
    };

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
      <div className="flex justify-center items-center min-h-screen bg-[#0A1020]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-t-primary animate-spin" />
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

  return (
    <div className="min-h-screen bg-[#0A1020] pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-semibold text-gray-100 mb-2">
            {currentLanguage.direction === 'rtl' ? 'الأدعية والأذكار' : 'Duas & Adhkar'}
          </h1>
          <p className="text-gray-400">
            {currentLanguage.direction === 'rtl'
              ? 'مجموعة من الأدعية والأذكار المأثورة عن النبي ﷺ'
              : 'A collection of authentic duas and adhkar from the Prophet ﷺ'}
          </p>
        </div>

        <Tabs 
          defaultValue="duas" 
          className="mb-8"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex justify-center mb-6">
            <TabsList className="bg-[#0F172A]">
              <TabsTrigger 
                value="duas"
                className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400"
              >
                {currentLanguage.direction === 'rtl' ? 'الأدعية' : 'Duas'}
              </TabsTrigger>
              <TabsTrigger 
                value="azkar"
                className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
              >
                {currentLanguage.direction === 'rtl' ? 'الأذكار' : 'Adhkar'}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative mb-8">
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
              className="w-full bg-[#0F172A] text-gray-100 rounded-xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredCategories.map(category => (
              <div key={category.id}>
                <CategoryCard
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onClick={() => {
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )
                    setSearchQuery('')
                  }}
                />
              </div>
            ))}
          </div>

          {isFiltering && (
            <div className="flex justify-center my-6">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                <div className="absolute inset-1 rounded-full border-2 border-t-primary animate-spin" />
              </div>
            </div>
          )}

          <TabsContent value="duas" className="space-y-6">
            <AnimatePresence mode="popLayout">
              {duas.map(dua => (
                <DuaCard key={dua.id} dua={dua} />
              ))}
            </AnimatePresence>

            {duas.length === 0 && !isFiltering && (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {searchQuery
                    ? 'No duas found matching your search.'
                    : selectedCategory
                    ? 'No duas found in this category.'
                    : 'No duas available.'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="azkar" className="space-y-6">
            <AnimatePresence mode="popLayout">
              {azkar.map(zikr => (
                <ZikrCard key={zikr.id} zikr={zikr} />
              ))}
            </AnimatePresence>

            {azkar.length === 0 && !isFiltering && (
              <div className="text-center py-12">
                <p className="text-gray-400">
                  {searchQuery
                    ? 'No adhkar found matching your search.'
                    : selectedCategory
                    ? 'No adhkar found in this category.'
                    : 'No adhkar available.'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 