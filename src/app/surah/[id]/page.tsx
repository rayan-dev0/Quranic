import { generateStaticParams } from './generateStaticParams'
import dynamic from 'next/dynamic'

// Dynamically import the client component with no SSR
const SurahPageClient = dynamic(() => import('./SurahPageClient'), { 
  ssr: false,
  loading: () => (
      <div className="flex justify-center items-center min-h-screen bg-[#0A1020]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-t-primary animate-spin" />
        </div>
      </div>
    )
})

export { generateStaticParams }

export default function SurahPage() {
  return <SurahPageClient />
} 