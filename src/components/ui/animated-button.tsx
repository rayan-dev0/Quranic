'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { ButtonProps } from '@/components/ui/button'

interface AnimatedButtonProps extends Omit<ButtonProps, 'asChild'> {
  hoverScale?: number
  tapScale?: number
  glowColor?: string
  isAnimated?: boolean
  asChild?: boolean
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    children, 
    hoverScale = 1.05, 
    tapScale = 0.95,
    glowColor,
    asChild = false,
    isAnimated = true,
    ...props 
  }, ref) => {
    // Early return if not animated - just use regular button
    if (!isAnimated) {
      return (
        <Button
          className={className}
          variant={variant}
          size={size}
          ref={ref}
          {...props}
        >
          {children}
        </Button>
      )
    }

    // Animation variants
    const buttonVariants = {
      initial: { 
        scale: 1 
      },
      hover: { 
        scale: hoverScale,
        boxShadow: glowColor ? `0 0 15px 0px ${glowColor}` : undefined
      },
      tap: { 
        scale: tapScale 
      }
    }

    return (
      <motion.div
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        variants={buttonVariants}
        className={cn("inline-flex", props.disabled && "pointer-events-none opacity-50")}
      >
        <Button
          className={className}
          variant={variant}
          size={size}
          ref={ref}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

export { AnimatedButton } 