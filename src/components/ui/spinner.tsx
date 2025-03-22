'use client'

import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16'
  }

  return (
    <div className="flex justify-center items-center">
      <div className={cn(
        'relative',
        sizeClasses[size],
        className
      )}>
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-4 border-t-primary animate-spin" />
      </div>
    </div>
  )
} 