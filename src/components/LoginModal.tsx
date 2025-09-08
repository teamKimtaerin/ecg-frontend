'use client'

import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Checkbox from '@/components/ui/Checkbox'
import GoogleLoginButton from './auth/GoogleLoginButton'
import { GoogleUserInfo } from '@/types/google-auth'

export interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin?: (email: string, password: string, rememberMe: boolean) => void
  onGoogleLogin?: () => void
  onSignup?: () => void
  onForgotPassword?: () => void
  onSkip?: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onGoogleLogin,
  onSignup,
  onForgotPassword,
  onSkip,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = () => {
    onLogin?.(email, password, rememberMe)
  }

  const handleGoogleLogin = (userInfo: GoogleUserInfo) => {
    console.log('Google login success:', userInfo)
    // TODO: Handle Google login (store token, redirect, etc.)
    alert(`Google 로그인 성공! 환영합니다, ${userInfo.name}님!`)
    onGoogleLogin?.()
  }

  const handleGoogleLoginError = () => {
    console.log('Google login failed')
    // TODO: Show error message
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    onForgotPassword?.()
  }

  const handleSignup = () => {
    onSignup?.()
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
        </div>

        {/* Google Login Button */}
        <GoogleLoginButton
          onSuccess={handleGoogleLogin}
          onError={handleGoogleLoginError}
        />

        {/* Divider */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 px-2">
            혹은 이메일로 로그인
          </span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">이메일</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소 입력"
              className="w-full h-[50px] px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">비밀번호</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full h-[50px] px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-xl flex items-center justify-center"
            >
              <span className="text-base">👁</span>
            </button>
          </div>
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <Checkbox
            checked={rememberMe}
            onChange={setRememberMe}
            label="로그인 상태 유지"
          />
          <button
            onClick={handleForgotPassword}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            비밀번호 찾기
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full h-[50px] bg-gray-900 text-white rounded-3xl font-bold text-base hover:bg-gray-800 transition-colors"
        >
          로그인
        </button>

        {/* Footer */}
        <div className="space-y-4 text-center">
          <p className="text-xs text-gray-500">
            Coup과 함께 멋진 영상을 만들어보세요!
          </p>

          <button
            onClick={handleSignup}
            className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
          >
            회원가입
          </button>

          <div className="flex justify-end">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
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
