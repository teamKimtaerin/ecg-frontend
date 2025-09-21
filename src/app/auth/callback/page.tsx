'use client'

import { useAuthStore } from '@/lib/store/authStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { API_CONFIG } from '@/config/api.config'

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [message, setMessage] = useState('')
  const [isProcessed, setIsProcessed] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const authStore = useAuthStore()

  useEffect(() => {
    // 이미 처리된 경우 중복 실행 방지
    if (isProcessed) return

    const handleAuthCallback = async () => {
      setIsProcessed(true)
      try {
        // URL에서 에러 파라미터 확인
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage(`인증 오류: ${decodeURIComponent(error)}`)
          setTimeout(() => {
            router.push('/auth?mode=login')
          }, 3000)
          return
        }

        // 성공 파라미터가 있거나 에러가 없는 경우 사용자 정보 조회
        // HttpOnly 쿠키의 토큰으로 사용자 정보 가져오기
        console.log('🔍 OAuth callback - calling /api/auth/me')
        const userResponse = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // HttpOnly 쿠키 포함
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()

          // Zustand store에 사용자 정보 저장 (토큰은 쿠키에 있으므로 null)
          authStore.setAuthData(userData, null)

          console.log('✅ Google OAuth 로그인 성공:', userData.username)

          setStatus('success')
          setMessage(`환영합니다, ${userData.username}님!`)

          // 성공 시 홈페이지로 리디렉션
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          throw new Error('사용자 정보를 가져올 수 없습니다.')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('로그인 처리 중 오류가 발생했습니다.')
        setTimeout(() => {
          router.push('/auth?mode=login')
        }, 3000)
      }
    }

    handleAuthCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        )
      case 'success':
        return (
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )
      case 'error':
        return (
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return '로그인 처리 중...'
      case 'success':
        return '로그인 성공!'
      case 'error':
        return '로그인 실패'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center space-y-6">
        <div className="flex justify-center">{getStatusIcon()}</div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">{getStatusText()}</h1>

          {message && (
            <p className="text-gray-400 max-w-md mx-auto">{message}</p>
          )}
        </div>

        {status === 'loading' && (
          <div className="text-sm text-gray-500">잠시만 기다려주세요...</div>
        )}

        {status === 'success' && (
          <div className="text-sm text-gray-500">곧 홈페이지로 이동합니다.</div>
        )}

        {status === 'error' && (
          <div className="text-sm text-gray-500">
            3초 후 로그인 페이지로 이동합니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">
                로그인 처리 중...
              </h1>
              <div className="text-sm text-gray-500">
                잠시만 기다려주세요...
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
