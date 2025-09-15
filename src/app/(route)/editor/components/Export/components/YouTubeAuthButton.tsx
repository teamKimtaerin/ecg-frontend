'use client'

import React, { useState, useEffect } from 'react'
import { FaGoogle, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

interface YouTubeAuthButtonProps {
  onAuthChange?: (isAuthenticated: boolean) => void
  sessionId?: string
}

interface AuthStatus {
  isAuthenticated: boolean
  isLoading: boolean
  error?: string
  userInfo?: {
    email?: string
    name?: string
  }
}

export default function YouTubeAuthButton({
  onAuthChange,
  sessionId
}: YouTubeAuthButtonProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    isLoading: true
  })

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    checkAuthStatus()

    // URL 파라미터에서 인증 결과 확인
    const urlParams = new URLSearchParams(window.location.search)
    const authResult = urlParams.get('auth')

    if (authResult === 'success') {
      setAuthStatus(prev => ({ ...prev, isAuthenticated: true, isLoading: false }))
      onAuthChange?.(true)
      // URL 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname)
    } else if (authResult === 'error' || authResult === 'cancelled') {
      const message = urlParams.get('message') || '인증 실패'
      setAuthStatus(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: decodeURIComponent(message)
      }))
      onAuthChange?.(false)
      // URL 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [onAuthChange])

  const checkAuthStatus = async () => {
    try {
      // 쿠키에 토큰이 있는지 확인
      const hasToken = document.cookie.includes('youtube_auth_token')

      if (hasToken) {
        // 토큰이 유효한지 API로 확인
        const response = await fetch('/api/auth/youtube/verify', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          console.log('API 응답:', data)

          // success가 true이고 isAuthenticated가 true인 경우 성공으로 처리
          if (data.success && data.isAuthenticated) {
            setAuthStatus({
              isAuthenticated: true,
              isLoading: false,
              userInfo: data.userInfo
            })
            onAuthChange?.(true)
            return
          }
        }
      }

      setAuthStatus({
        isAuthenticated: false,
        isLoading: false
      })
      onAuthChange?.(false)

    } catch (error) {
      console.error('인증 상태 확인 오류:', error)
      setAuthStatus({
        isAuthenticated: false,
        isLoading: false,
        error: '인증 상태 확인 실패'
      })
      onAuthChange?.(false)
    }
  }

  const handleAuth = async () => {
    try {
      setAuthStatus(prev => ({ ...prev, isLoading: true, error: undefined }))

      // OAuth 인증 URL 요청
      const response = await fetch(`/api/auth/youtube?sessionId=${sessionId || 'default'}`)
      const data = await response.json()

      if (data.success && data.authUrl) {
        // 새 창에서 OAuth 인증 실행
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || '인증 URL 생성 실패')
      }

    } catch (error) {
      console.error('YouTube 인증 오류:', error)
      setAuthStatus(prev => ({
        ...prev,
        isLoading: false,
        error: String(error)
      }))
    }
  }

  const handleLogout = () => {
    // 쿠키 삭제
    document.cookie = 'youtube_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    setAuthStatus({
      isAuthenticated: false,
      isLoading: false
    })
    onAuthChange?.(false)
  }

  if (authStatus.isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <FaSpinner className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-600">인증 상태 확인 중...</span>
      </div>
    )
  }

  if (authStatus.isAuthenticated) {
    return (
      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="w-4 h-4 text-green-600" />
            <div>
              <span className="text-sm font-medium text-green-800">
                YouTube 계정 연동됨
              </span>
              {authStatus.userInfo?.email && (
                <p className="text-xs text-green-600 mt-1">
                  {authStatus.userInfo.email}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-green-700 hover:text-green-900 underline"
          >
            연동 해제
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
      {authStatus.error && (
        <div className="flex items-center gap-2 mb-3">
          <FaExclamationTriangle className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-800">{authStatus.error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-orange-800 mb-1">
            YouTube 계정 연동 필요
          </p>
          <p className="text-xs text-orange-600">
            업로드하려면 먼저 YouTube 계정을 연동해주세요.
          </p>
        </div>

        <button
          onClick={handleAuth}
          disabled={authStatus.isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          <FaGoogle className="w-4 h-4" />
          계정 연동
        </button>
      </div>
    </div>
  )
}