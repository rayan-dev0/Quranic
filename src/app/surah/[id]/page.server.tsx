import { Suspense } from 'react'
import SurahPage from './SurahPageClient'
import { generateStaticParams } from './generateStaticParams'

export { generateStaticParams }

export default function SurahPageServer() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-[#0A1020]">Loading...</div>}>
      <SurahPage />
    </Suspense>
  )
} 