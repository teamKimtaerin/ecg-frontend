'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { type User } from '@/lib/api/auth'
import HoitLogo from '@/components/ui/HoitLogo'
import DocumentModal from '@/components/ui/DocumentModal'
import UserDropdown from '@/components/ui/UserDropdown'

export interface HeaderProps {
  onTryClick?: () => void
  onLoginClick?: () => void
  isLoggedIn?: boolean
  user?: User | null
  isLoading?: boolean
}

const Header: React.FC<HeaderProps> = ({
  // onTryClick,
  onLoginClick,
  isLoggedIn = false,
  user = null,
  isLoading = false,
}) => {
  const {} = useAuthStatus()
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // TODO 데이터를 실제 서버에서 받은 데이터로 받은 진행도 + 사용자가 정한 프로젝트 이름으로 바꾸면 될듯.
  // Mock data for demonstration
  const exportTasks = [
    {
      id: 1,
      filename: 'video_project_1.mp4',
      progress: 75,
      status: 'processing' as const,
    },
    {
      id: 2,
      filename: 'video_project_2.mp4',
      progress: 100,
      status: 'completed' as const,
      completedAt: '2025-01-11 14:30',
    },
    {
      id: 3,
      filename: 'video_project_3.mp4',
      progress: 100,
      status: 'completed' as const,
      completedAt: '2025-01-11 12:15',
    },
  ]

  const uploadTasks = [
    {
      id: 1,
      filename: 'video_raw_1.mp4',
      progress: 45,
      status: 'uploading' as const,
    },
    {
      id: 2,
      filename: 'video_raw_2.mp4',
      progress: 100,
      status: 'completed' as const,
      completedAt: '2025-01-11 13:45',
    },
    {
      id: 3,
      filename: 'video_raw_3.mp4',
      progress: 0,
      status: 'failed' as const,
      completedAt: '2025-01-11 11:20',
    },
    {
      id: 4,
      filename: 'video_raw_4.mp4',
      progress: 100,
      status: 'completed' as const,
      completedAt: '2025-01-11 10:15',
    },
  ]
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <HoitLogo size="md" />
            <span className="text-xl font-bold text-black">Hoit</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {/* <a
              href="#"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              주요 기능
            </a> */}
            <Link
              href="/asset-store"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              에셋 스토어
            </Link>
            <Link
              href="/tutorial"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              사용법 배우기
            </Link>
            {/* <a
              href="#"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              커뮤니티
            </a> */}
            <Link
              href="/motiontext-demo"
              className="relative text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
            >
              베타
              <span className="absolute -top-2 left-full ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                βeta
              </span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsDocumentModalOpen(!isDocumentModalOpen)}
              className="p-2 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors cursor-pointer rounded-lg"
              title="문서함"
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm16 0V6a2 2 0 00-2-2H7a2 2 0 00-2 2v1m14 0H3"
                />
              </svg>
            </button>

            <DocumentModal
              isOpen={isDocumentModalOpen}
              onClose={() => setIsDocumentModalOpen(false)}
              buttonRef={buttonRef}
              exportTasks={exportTasks}
              uploadTasks={uploadTasks}
            />
          </div>

          {isLoading ? (
            <div className="px-4 py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
            </div>
          ) : isLoggedIn && user ? (
            <UserDropdown />
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
            >
              로그인 / 회원가입
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
