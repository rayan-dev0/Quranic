import { generateStaticParams } from './generateStaticParams'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Spinner } from '@/components/ui/spinner'

// Dynamically import the client component with no SSR
const SurahPageClient = dynamic(() => import('./SurahPageClient'), { 
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen bg-[#0A1020]">
      <Spinner size="lg" />
    </div>
  )
})

export { generateStaticParams }

export default function SurahPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-[#0A1020]">
        <Spinner size="lg" />
      </div>
    }>
      <SurahPageClient />
    </Suspense>
  )
} 