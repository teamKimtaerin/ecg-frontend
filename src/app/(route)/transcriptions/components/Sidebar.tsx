'use client'

import Badge from '@/components/ui/Badge'
import { cn } from '@/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

interface SidebarItem {
  href: string
  label: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  {
    href: '/transcriptions',
    label: 'Transcription',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    href: '/subtitles',
    label: 'Subtitle',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v12a2 2 0 002 2h6a2 2 0 002-2V7"
        />
      </svg>
    ),
  },
]

const bottomMenuItems = [
  {
    href: '/help',
    label: 'Help',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    href: '/account',
    label: 'Account',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-[#404040]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <h1 className="text-white text-xl font-bold">ECG</h1>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#404040] text-white'
                      : 'text-[#b3b3b3] hover:text-white hover:bg-[#333333]'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Additional Menu Items */}
        <div className="mt-8">
          <div className="px-3 py-2 text-xs font-medium text-[#808080] uppercase tracking-wider">
            More
          </div>
          <ul className="mt-2 space-y-1">
            <li>
              <Link
                href="/voiceover"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-[#b3b3b3] hover:text-white hover:bg-[#333333] transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <span>Voiceover</span>
              </Link>
            </li>
            <li>
              <Link
                href="/real-time"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-[#b3b3b3] hover:text-white hover:bg-[#333333] transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Real-Time</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-[#404040]">
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-[#b3b3b3] hover:text-white hover:bg-[#333333] transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Credits */}
        <div className="mt-4 px-3">
          <div className="text-xs text-[#808080] mb-2">Remaining Credits</div>
          <Badge label="0" variant="neutral" size="small" />
        </div>
      </div>
    </div>
  )
}
