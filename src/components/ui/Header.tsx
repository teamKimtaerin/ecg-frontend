'use client'

import React from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import HoitLogo from '@/components/ui/HoitLogo'
import { UserProfile } from '@/components/auth'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  isVisible?: boolean
}

export default function Header({ isVisible = true }: HeaderProps) {
  const { isAuthenticated } = useAuth()

  return (
    <header
      className={`fixed top-0 w-full bg-black/90 border-b border-gray-slate/20 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <HoitLogo size="md" />
            <h1 className="text-h3 text-white font-bold">Hoit</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/transcriptions"
              className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/motiontext-demo"
              className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
            >
              MotionText Demo
            </Link>
            <a
              href="#features"
              className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#open-library"
              className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
            >
              Open Library
            </a>
            <a
              href="#vot"
              className="flex items-center space-x-1 text-sm text-gray-medium font-bold hover:text-white transition-colors"
            >
              <span>VoT</span>
            </a>

            {/* Auth Section */}
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <>
                <Link
                  href="/auth?mode=login"
                  className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link href="/auth?mode=signup">
                  <Button
                    variant="accent"
                    size="medium"
                    className="rounded-full"
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
