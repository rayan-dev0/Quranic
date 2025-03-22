'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollAnimationOptions {
  threshold?: number
  once?: boolean
  rootMargin?: string
}

/**
 * Hook to detect when an element enters the viewport for scroll animations
 */
export function useScrollAnimation({
  threshold = 0.1,
  once = false,
  rootMargin = '0px'
}: ScrollAnimationOptions = {}) {
  const [isInView, setIsInView] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const currentRef = ref.current
    
    if (!currentRef) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        
        // Check if the element is in view
        const isVisible = entry.isIntersecting
        
        // If we only want to animate once and it's already been animated, do nothing
        if (once && hasAnimated) return
        
        setIsInView(isVisible)
        
        // If the element is in view and we only want to animate once, set hasAnimated
        if (isVisible && once) {
          setHasAnimated(true)
        }
      },
      {
        threshold,
        rootMargin
      }
    )
    
    observer.observe(currentRef)
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, rootMargin, once, hasAnimated])
  
  return { ref, isInView, hasAnimated }
} 