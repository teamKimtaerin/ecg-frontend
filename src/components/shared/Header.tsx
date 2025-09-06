'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '@/components/Button'

interface HeaderProps {
  isVisible?: boolean
}

export default function Header({ isVisible = true }: HeaderProps) {
  return (
    <header
      className={`fixed top-0 w-full bg-black/90 border-b border-gray-slate/20 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.svg"
              alt="ECG Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
            <h1 className="text-h3 text-white font-bold">ECG</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/transcriptions"
              className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
            >
              Dashboard
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
            <a
              href="#"
              className="text-sm text-gray-medium font-bold hover:text-white transition-colors"
            >
              Login
            </a>
            <Button variant="accent" size="medium" className="rounded-full">
              Sign up
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
