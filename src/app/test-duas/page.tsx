'use client'

import { useState, useEffect } from 'react'
import { getDuas, getAzkar, type Dua, type Zikr } from '@/lib/db-dua-api'

export default function TestDuasPage() {
  const [duas, setDuas] = useState<Dua[]>([])
  const [azkar, setAzkar] = useState<Zikr[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const duasData = await getDuas()
        const azkarData = await getAzkar()
        
        console.log(`[TEST] Loaded ${duasData.length} duas and ${azkarData.length} azkar`)
        
        setDuas(duasData)
        setAzkar(azkarData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Display a loading message if data is still being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Duas & Adhkar...</h2>
          <p className="text-slate-400 mt-2">This might take a minute as we process the hadith database</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Database Test: Found {duas.length} Duas & {azkar.length} Adhkar
        </h1>
        
        <div className="bg-slate-800 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Debug Information</h2>
          <pre className="text-xs text-slate-300 overflow-auto max-h-40 p-2 bg-slate-900 rounded">
            {JSON.stringify({ duasCount: duas.length, azkarCount: azkar.length }, null, 2)}
          </pre>
          <button
            onClick={() => console.log({ duas, azkar })}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
          >
            Log Full Data to Console
          </button>
        </div>
        
        {/* Display the first 10 duas */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Duas Sample (First 10)</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {duas.slice(0, 10).map((dua) => (
              <div key={dua.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
                <div className="bg-emerald-900 px-4 py-3">
                  <h3 className="font-semibold text-emerald-100">{dua.title}</h3>
                  <p className="text-xs text-emerald-300">{dua.category}</p>
                </div>
                <div className="p-4">
                  <p className="text-lg text-white font-arabic mb-4 leading-loose text-right" dir="rtl">
                    {dua.arabic}
                  </p>
                  <p className="text-slate-300 mb-3">{dua.translation}</p>
                  <div className="text-xs text-slate-400">
                    <p>Reference: {dua.reference}</p>
                    <p>Tags: {dua.tags.join(', ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Display the first 10 adhkar */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Adhkar Sample (First 10)</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {azkar.slice(0, 10).map((zikr) => (
              <div key={zikr.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
                <div className="bg-blue-900 px-4 py-3">
                  <h3 className="font-semibold text-blue-100">{zikr.category}</h3>
                  <p className="text-xs text-blue-300">Repeat {zikr.count} times</p>
                </div>
                <div className="p-4">
                  <p className="text-lg text-white font-arabic mb-4 leading-loose text-right" dir="rtl">
                    {zikr.arabic}
                  </p>
                  <p className="text-slate-300 mb-3">{zikr.description}</p>
                  <div className="text-xs text-slate-400">
                    <p>Reference: {zikr.reference}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 