'use client'

import React from 'react'
import Link from 'next/link'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { type User } from '@/lib/api/auth'

export interface HeaderProps {
  onTryClick?: () => void
  onLoginClick?: () => void
  isLoggedIn?: boolean
  user?: User | null
  isLoading?: boolean
}

const Header: React.FC<HeaderProps> = ({
  onTryClick,
  onLoginClick,
  isLoggedIn = false,
  user = null,
  isLoading = false,
}) => {
  const { logout } = useAuthStatus()
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-16 bg-black rounded-lg"></div>
          <span className="text-xl font-bold text-black">Coup</span>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#"
            className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
          >
            주요 기능
          </a>
          <a
            href="#"
            className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
          >
            애님 템플릿
          </a>
          <Link
            href="/tutorial"
            className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
          >
            사용법 배우기
          </Link>
          <a
            href="#"
            className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
          >
            커뮤니티
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={onTryClick}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-black transition-colors cursor-pointer"
          >
            체험하기 →
          </button>

          {isLoading ? (
            <div className="px-4 py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
            </div>
          ) : isLoggedIn && user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-bold text-black">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-black transition-colors cursor-pointer"
              >
                로그아웃
              </button>
            </div>
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
