'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 토큰 파라미터 확인
        const token = searchParams.get('token')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage(`인증 오류: ${decodeURIComponent(error)}`)
          setTimeout(() => {
            router.push('/auth?mode=login')
          }, 3000)
          return
        }

        if (!token) {
          setStatus('error')
          setMessage('토큰이 없습니다. 다시 로그인해주세요.')
          setTimeout(() => {
            router.push('/auth?mode=login')
          }, 3000)
          return
        }

        // 토큰을 localStorage에 저장
        localStorage.setItem('access_token', token)

        // 사용자 정보 가져오기
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (userResponse.ok) {
          const userData = await userResponse.json()
          // 필요하다면 사용자 정보도 저장
          localStorage.setItem('user', JSON.stringify(userData))

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
