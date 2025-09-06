'use client'

import React, { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const AuthPageContent: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const provider = searchParams.get('provider')
  const emailFromUrl = searchParams.get('email') || ''

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [formData, setFormData] = useState({
    email: emailFromUrl, // URL에서 받은 이메일로 초기화
    password: '',
    confirmPassword: '',
    username: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const { login, signup, getGoogleLoginUrl } = useAuth()

  const handleGoogleLogin = useCallback(async () => {
    try {
      const googleUrl = await getGoogleLoginUrl()
      // 현재 창에서 Google OAuth로 이동
      window.location.href = googleUrl
    } catch (error) {
      console.error('Google OAuth 오류:', error)
      setErrors({ general: 'Google 로그인을 시작할 수 없습니다.' })
    }
  }, [getGoogleLoginUrl])

  // Google OAuth 자동 리디렉션
  React.useEffect(() => {
    if (provider === 'google') {
      handleGoogleLogin()
    }
  }, [provider, handleGoogleLogin])

  const handleInputChange =
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }))
      }
    }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.'
    }

    if (mode === 'signup') {
      if (!formData.username) {
        newErrors.username = '사용자명을 입력해주세요.'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (mode === 'login') {
        await login({
          email: formData.email,
          password: formData.password,
        })
      } else {
        await signup({
          email: formData.email,
          password: formData.password,
          username: formData.username,
        })
      }

      router.push('/')
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : '오류가 발생했습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      {/* Animated Background - same as landing page */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-40">
          <div className="absolute bottom-1/4 left-3/11 w-86 h-86 bg-primary rounded-full filter blur-3xl bg-blob animate-blob animation-delay-0"></div>
          <div className="absolute top-1/3 left-4/7 w-72 h-72 bg-primary-light rounded-full filter blur-3xl bg-blob animate-blob animation-delay-1000"></div>
          <div className="absolute bottom-1/7 left-6/11 w-64 h-64 bg-amber-300 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-2500"></div>
          <div className="absolute bottom-2/4 left-4/11 w-86 h-86 bg-red-500 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-1/9 left-1/11 w-56 h-56 bg-green-500 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-5000"></div>
          <div className="absolute bottom-1/3 left-5/11 w-56 h-56 bg-white rounded-full filter blur-3xl bg-blob animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-6/11 left-9/11 w-56 h-56 bg-fuchsia-600 rounded-full filter blur-3xl bg-blob animate-blob animation-delay-3000"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gray-slate/30 rounded-2xl p-8 border border-gray-slate/30">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2">
              <span className="text-primary">ECG</span>
            </h1>
            <p className="text-gray-medium">
              {mode === 'login'
                ? '로그인하여 계속하기'
                : '계정을 생성하여 시작하기'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {errors.general}
              </div>
            )}

            <div className="space-y-4">
              {mode === 'signup' && (
                <div className="w-full">
                  <input
                    id="username"
                    type="text"
                    placeholder="사용자명"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange('username')(e.target.value)
                    }
                    className="w-full px-4 py-3 bg-black/50 border border-gray-slate/50 rounded-full text-white placeholder-gray-medium focus:outline-none focus:border-primary transition-colors"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1 px-4">
                      {errors.username}
                    </p>
                  )}
                </div>
              )}

              <div className="w-full">
                <input
                  id="email"
                  type="email"
                  placeholder="이메일 주소"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email')(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-slate/50 rounded-full text-white placeholder-gray-medium focus:outline-none focus:border-primary transition-colors"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 px-4">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="w-full">
                <input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password')(e.target.value)
                  }
                  className="w-full px-4 py-3 bg-black/50 border border-gray-slate/50 rounded-full text-white placeholder-gray-medium focus:outline-none focus:border-primary transition-colors"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 px-4">
                    {errors.password}
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="w-full">
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호 확인"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange('confirmPassword')(e.target.value)
                    }
                    className="w-full px-4 py-3 bg-black/50 border border-gray-slate/50 rounded-full text-white placeholder-gray-medium focus:outline-none focus:border-primary transition-colors"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1 px-4">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="accent"
              size="large"
              className="w-full font-bold bg-status-positive hover:bg-status-positive hover:opacity-70 hover:scale-105 rounded-full"
              isDisabled={isLoading}
            >
              {isLoading
                ? mode === 'login'
                  ? '로그인 중...'
                  : '계정 생성 중...'
                : mode === 'login'
                  ? '로그인'
                  : '계정 생성'}
            </Button>

            {/* Divider */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 h-px bg-gray-slate/30"></div>
              <span className="text-gray-medium text-sm">또는</span>
              <div className="flex-1 h-px bg-gray-slate/30"></div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="secondary"
              style="outline"
              size="large"
              className="w-full rounded-full border-gray-slate/50 text-white hover:border-white"
              onClick={handleGoogleLogin}
            >
              <span className="flex items-center justify-center space-x-2">
                <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-black font-bold text-xs">
                  G
                </span>
                <span>Google로 {mode === 'login' ? '로그인' : '가입'}</span>
              </span>
            </Button>
          </form>

          {/* Mode Switch */}
          <div className="text-center mt-6">
            <p className="text-gray-medium">
              {mode === 'login'
                ? '계정이 없으신가요?'
                : '이미 계정이 있으신가요?'}{' '}
              <button
                type="button"
                onClick={() => {
                  const newMode = mode === 'login' ? 'signup' : 'login'
                  setMode(newMode)
                  // URL도 함께 업데이트 (이메일 파라미터 유지)
                  const currentUrl = new URL(window.location.href)
                  currentUrl.searchParams.set('mode', newMode)
                  window.history.replaceState({}, '', currentUrl.toString())
                }}
                className="text-primary hover:underline font-medium"
              >
                {mode === 'login' ? '회원가입' : '로그인'}
              </button>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-gray-medium hover:text-white text-sm"
            >
              ← 홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AuthPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-medium">로딩 중...</p>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  )
}

export default AuthPage
