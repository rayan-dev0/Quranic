'use client'

import { useState, useEffect } from 'react'
import { getDuas, getAzkar, getCategories, searchDuas, searchAzkar, filterDuas, filterAzkar, type Dua, type Zikr, type Category } from '@/lib/db-dua-api'
import { Search, Book, Heart } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SimpleDuaPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('duas')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Original data from API
  const [duas, setDuas] = useState<Dua[]>([])
  const [azkar, setAzkar] = useState<Zikr[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  // Filtered data for display
  const [filteredDuas, setFilteredDuas] = useState<Dua[]>([])
  const [filteredAzkar, setFilteredAzkar] = useState<Zikr[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  
  // Stats for debugging
  const [stats, setStats] = useState({ 
    totalDuas: 0, 
    filteredDuasCount: 0,
    totalAzkar: 0,
    filteredAzkarCount: 0,
    categories: 0 
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      try {
        // Load all data first
        const duasData = await getDuas()
        const azkarData = await getAzkar()
        const duaCategories = await getCategories('duas')
        const azkarCategories = await getCategories('azkar')
        
        // Combine categories
        const allCategories = [...duaCategories, ...azkarCategories]
        
        // Set state
        setDuas(duasData)
        setAzkar(azkarData)
        setCategories(allCategories)
        
        // Initialize filtered data with all data
        setFilteredDuas(duasData)
        setFilteredAzkar(azkarData)
        
        // Set stats
        setStats({
          totalDuas: duasData.length,
          filteredDuasCount: duasData.length,
          totalAzkar: azkarData.length,
          filteredAzkarCount: azkarData.length,
          categories: allCategories.length
        })
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Handle category selection
  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category)
    setSearchQuery('')
    
    if (!category) {
      // Reset to show all
      setFilteredDuas(duas)
      setFilteredAzkar(azkar)
      return
    }
    
    // Filter based on active tab
    if (activeTab === 'duas' && category.id.startsWith('dua-cat-')) {
      const filtered = filterDuas(duas, category.id)
      setFilteredDuas(filtered)
      setStats(prev => ({ ...prev, filteredDuasCount: filtered.length }))
    } else if (activeTab === 'azkar' && category.id.startsWith('zikr-cat-')) {
      const filtered = filterAzkar(azkar, category.id)
      setFilteredAzkar(filtered)
      setStats(prev => ({ ...prev, filteredAzkarCount: filtered.length }))
    }
  }
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      // Empty search shows all items
      setFilteredDuas(duas)
      setFilteredAzkar(azkar)
      setStats(prev => ({ 
        ...prev, 
        filteredDuasCount: duas.length,
        filteredAzkarCount: azkar.length
      }))
      return
    }
    
    // Filter based on active tab
    if (activeTab === 'duas') {
      const filtered = searchDuas(query, duas)
      setFilteredDuas(filtered)
      setStats(prev => ({ ...prev, filteredDuasCount: filtered.length }))
    } else {
      const filtered = searchAzkar(query, azkar)
      setFilteredAzkar(filtered)
      setStats(prev => ({ ...prev, filteredAzkarCount: filtered.length }))
    }
  }
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSelectedCategory(null)
    setSearchQuery('')
    
    // Reset filtered data
    if (tab === 'duas') {
      setFilteredDuas(duas)
    } else {
      setFilteredAzkar(azkar)
    }
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Loading duas and adhkar...</h2>
          <p className="text-slate-400 text-sm mt-2">This might take a moment as we process all hadiths</p>
        </div>
      </div>
    )
  }
  
  // Get categories for the current tab
  const currentCategories = categories.filter(category => 
    activeTab === 'duas' 
      ? category.id.startsWith('dua-cat-')
      : category.id.startsWith('zikr-cat-')
  )
  
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Duas & Adhkar <span className="text-blue-500">Database</span>
          </h1>
          <p className="text-slate-400 mt-2">
            {`Found ${stats.totalDuas} duas and ${stats.totalAzkar} adhkar from the hadith database`}
          </p>
        </div>
        
        {/* Debug Stats */}
        <div className="mb-6 p-4 bg-slate-900 rounded-lg text-xs">
          <h3 className="font-bold mb-2 text-blue-400">Debug Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-slate-800 p-2 rounded">
              <span className="block text-slate-400">Total Duas:</span>
              <span className="text-white font-bold">{stats.totalDuas}</span>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <span className="block text-slate-400">Filtered Duas:</span>
              <span className="text-white font-bold">{stats.filteredDuasCount}</span>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <span className="block text-slate-400">Total Adhkar:</span>
              <span className="text-white font-bold">{stats.totalAzkar}</span>
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <span className="block text-slate-400">Filtered Adhkar:</span>
              <span className="text-white font-bold">{stats.filteredAzkarCount}</span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="duas" value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <div className="flex justify-center">
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="duas">Duas ({stats.totalDuas})</TabsTrigger>
              <TabsTrigger value="azkar">Adhkar ({stats.totalAzkar})</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Search Box */}
          <div className="my-6 max-w-lg mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={`Search ${activeTab === 'duas' ? 'duas' : 'adhkar'}...`}
                className="w-full bg-slate-800 rounded-lg px-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </div>
          
          {/* Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div className="bg-slate-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Book className="h-4 w-4" />
                <span>Categories</span>
              </h3>
              
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full text-left p-2 rounded text-sm ${
                    !selectedCategory 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  All Categories
                </button>
                
                {currentCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full text-left p-2 rounded text-sm flex justify-between items-center ${
                      selectedCategory?.id === category.id 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="truncate">{category.name}</span>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="lg:col-span-3">
              <TabsContent value="duas">
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Duas</h2>
                    <span className="text-sm text-slate-400">
                      Showing {filteredDuas.length} of {stats.totalDuas} duas
                    </span>
                  </div>
                  
                  {filteredDuas.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No duas found matching your criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDuas.slice(0, 10).map(dua => (
                        <div key={dua.id} className="bg-slate-800 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-blue-400">{dua.title}</h3>
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">
                              {dua.category}
                            </span>
                          </div>
                          <p className="text-right mb-3 font-arabic text-lg" dir="rtl">
                            {dua.arabic}
                          </p>
                          <p className="text-slate-300 text-sm mb-2">{dua.translation}</p>
                          <div className="text-xs text-slate-400 flex items-center justify-between">
                            <div>{dua.reference}</div>
                            <div className="flex gap-1">
                              {dua.tags.map(tag => (
                                <span key={tag} className="bg-slate-700 px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {filteredDuas.length > 10 && (
                        <div className="text-center py-4">
                          <p className="text-slate-400">
                            {`Showing 10 of ${filteredDuas.length} duas...`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="azkar">
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Adhkar</h2>
                    <span className="text-sm text-slate-400">
                      Showing {filteredAzkar.length} of {stats.totalAzkar} adhkar
                    </span>
                  </div>
                  
                  {filteredAzkar.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No adhkar found matching your criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAzkar.slice(0, 10).map(zikr => (
                        <div key={zikr.id} className="bg-slate-800 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-emerald-400">{zikr.category}</h3>
                            {zikr.count > 1 && (
                              <span className="text-xs bg-slate-700 px-2 py-1 rounded-full flex items-center">
                                Repeat {zikr.count}×
                              </span>
                            )}
                          </div>
                          <p className="text-right mb-3 font-arabic text-lg" dir="rtl">
                            {zikr.arabic}
                          </p>
                          <p className="text-slate-300 text-sm mb-2">{zikr.description}</p>
                          <div className="text-xs text-slate-400">
                            {zikr.reference}
                          </div>
                        </div>
                      ))}
                      
                      {filteredAzkar.length > 10 && (
                        <div className="text-center py-4">
                          <p className="text-slate-400">
                            {`Showing 10 of ${filteredAzkar.length} adhkar...`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 