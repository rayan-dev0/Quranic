'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Book, BookOpen, Search as SearchIcon, Home, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Search } from '@/components/Search'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function Navigation() {
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/mushaf', label: 'Mushaf View', icon: BookOpen },
    { href: '/dua', label: 'Dua & Dhikr', icon: Heart },
    { href: '/about', label: 'About', icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg> },
  ]

  const isActive = (path: string) => {
    if (path === '/') return pathname === path
    return pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A1020]/80 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-100">
                Quranic
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive(item.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Search and Language Switcher */}
          <div className="flex items-center gap-4">
            <Search />
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-800">
            <nav className="space-y-1 px-4 py-3">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground/60'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              <div className="sm:hidden px-3 py-2">
                <LanguageSwitcher />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
} 