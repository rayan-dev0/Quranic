'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

type PageTransitionContextType = {
  isAnimating: boolean
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  isAnimating: false
})

export const usePageTransition = () => useContext(PageTransitionContext)

interface PageTransitionProviderProps {
  children: React.ReactNode
}

export const PageTransitionProvider = ({ children }: PageTransitionProviderProps) => {
  const pathname = usePathname()
  const [isAnimating, setIsAnimating] = useState(false)

  // Default page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  // Track page transitions
  useEffect(() => {
    setIsAnimating(true)
    const timeout = setTimeout(() => {
      setIsAnimating(false)
    }, 600) // Slightly longer than animation duration
    return () => clearTimeout(timeout)
  }, [pathname])

  // Make sure we're running client-side
  if (typeof window === 'undefined') {
    return <>{children}</>
  }

  return (
    <PageTransitionContext.Provider value={{ isAnimating }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{
            type: "tween",
            ease: [0.22, 1, 0.36, 1],
            duration: 0.5
          }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PageTransitionContext.Provider>
  )
} 