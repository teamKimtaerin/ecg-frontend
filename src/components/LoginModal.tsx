'use client'

import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Checkbox from '@/components/ui/Checkbox'
import GoogleLoginButton from './auth/GoogleLoginButton'
import { GoogleUserInfo } from '@/types/google-auth'
import { useAuth } from '@/hooks/useAuth'

export interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
  onSuccess?: () => void
  onForgotPassword?: () => void
  onSkip?: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  onForgotPassword,
  onSkip,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const { login, signup } = useAuth()

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

      onSuccess?.()
      onClose()
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : '오류가 발생했습니다.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLoginSuccess = (userInfo: GoogleUserInfo) => {
    console.log('Google login success:', userInfo)
    onSuccess?.()
    onClose()
  }

  const handleGoogleLoginError = () => {
    console.log('Google login failed')
    setErrors({ general: 'Google 로그인에 실패했습니다.' })
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    onForgotPassword?.()
  }

  const handleSkip = () => {
    onSkip?.()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdropClick={true}
      closeOnEsc={true}
      scrollable={false}
      className="w-[450px] max-w-[90vw]"
    >
      <div className="p-10 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h1>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Google Login Button */}
        <GoogleLoginButton
          onSuccess={handleGoogleLoginSuccess}
          onError={handleGoogleLoginError}
        />

        {/* Divider */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 px-2">
            {mode === 'login'
              ? '혹은 이메일로 로그인'
              : '혹은 이메일로 회원가입'}
          </span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                사용자명
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange('username')(e.target.value)
                  }
                  placeholder="사용자명 입력"
                  className={`w-full h-[50px] px-4 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.username ? 'border-red-300' : 'border-gray-200'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-600">{errors.username}</p>
              )}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">이메일</label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email')(e.target.value)}
                placeholder="이메일 주소 입력"
                className={`w-full h-[50px] px-4 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-200'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                value={formData.password}
                onChange={(e) => handleInputChange('password')(e.target.value)}
                placeholder="비밀번호 입력"
                className={`w-full h-[50px] px-4 pr-12 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-gray-200'
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-xl flex items-center justify-center"
              >
                <span className="text-base">👁</span>
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange('confirmPassword')(e.target.value)
                  }
                  placeholder="비밀번호 다시 입력"
                  className={`w-full h-[50px] px-4 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword
                      ? 'border-red-300'
                      : 'border-gray-200'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Remember Me and Forgot Password (Login mode only) */}
          {mode === 'login' && (
            <div className="flex items-center justify-between">
              <Checkbox
                checked={rememberMe}
                onChange={setRememberMe}
                label="로그인 상태 유지"
              />
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                disabled={isLoading}
              >
                비밀번호 찾기
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-[50px] rounded-3xl font-bold text-base transition-colors cursor-pointer ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isLoading
              ? '처리 중...'
              : mode === 'login'
                ? '로그인'
                : '회원가입'}
          </button>
        </form>

        {/* Footer */}
        <div className="space-y-4 text-center">
          <p className="text-xs text-gray-500">
            Coup과 함께 멋진 영상을 만들어보세요!
          </p>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            {mode === 'login' ? '회원가입' : '로그인으로 돌아가기'}
          </button>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default LoginModal
