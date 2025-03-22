'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Menu, Book, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Search } from './Search'

export function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  if (!mounted) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Quran App
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/mushaf"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === '/mushaf' ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              <div className="flex items-center space-x-2">
                <Book className="h-4 w-4" />
                <span>Mushaf</span>
              </div>
            </Link>
            <Link
              href="/read/1"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname.startsWith('/read') ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Read</span>
              </div>
            </Link>
          </nav>
        </div>
        <Button
          variant="ghost"
          className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 mr-2 px-0 md:hidden"
          onClick={toggleMenu}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Search />
          </div>
          <nav className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </nav>
        </div>
      </div>
      {isMenuOpen && (
        <div className="border-b bg-background md:hidden">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/mushaf"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === '/mushaf' ? 'text-foreground' : 'text-foreground/60'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <Book className="h-4 w-4" />
                  <span>Mushaf</span>
                </div>
              </Link>
              <Link
                href="/read/1"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname.startsWith('/read') ? 'text-foreground' : 'text-foreground/60'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Read</span>
                </div>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </nav>
  )
} 