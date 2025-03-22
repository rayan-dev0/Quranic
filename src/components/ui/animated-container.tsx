'use client'

import React from 'react'
import { motion, HTMLMotionProps, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export interface AnimatedContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  triggerOnce?: boolean
  threshold?: number
  animateOnScroll?: boolean
  delay?: number
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'none'
  duration?: number
  customVariants?: Variants
}

const defaultVariants: Record<string, Variants> = {
  'fade': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  'slide-up': {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  'slide-down': {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  },
  'slide-left': {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  },
  'slide-right': {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  },
  'zoom': {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  },
  'none': {
    hidden: {},
    visible: {}
  }
}

export function AnimatedContainer({
  children,
  className,
  triggerOnce = true,
  threshold = 0.1,
  animateOnScroll = true,
  delay = 0,
  animation = 'fade',
  duration = 0.5,
  customVariants,
  ...props
}: AnimatedContainerProps) {
  // Use our scroll animation hook if animateOnScroll is true
  const { ref, isInView } = useScrollAnimation({ 
    threshold, 
    once: triggerOnce 
  })

  // Determine which variants to use (custom or default)
  const variants = customVariants || defaultVariants[animation]
  
  // Transition configuration
  const transition = {
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1]
  }
  
  // If we're not animating on scroll, just animate on mount
  if (!animateOnScroll) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={transition}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  // Otherwise, use our scroll-based animation
  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(className)}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={transition}
      {...props}
    >
      {children}
    </motion.div>
  )
} 