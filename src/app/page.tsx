'use client'

import React, { useState } from 'react'
import { NewLandingPage } from '@/components/NewLandingPage'
import { LoginModal } from '@/components'

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const handleTryClick = () => {
    console.log('Try button clicked')
    // Add navigation logic here
  }

  const handleLoginClick = () => {
    console.log('Login button clicked')
    setShowLoginModal(true)
  }

  const handleQuickStartClick = () => {
    console.log('Quick start button clicked')
    // Add navigation logic here
  }

  const handleApplyDynamicSubtitleClick = () => {
    console.log('Apply dynamic subtitle button clicked')
    // Add navigation logic here
  }

  const handleCustomEditingQuickStartClick = () => {
    console.log('Custom editing quick start button clicked')
    // Add navigation logic here
  }

  const handleTryAutoSubtitleClick = () => {
    console.log('Try auto subtitle button clicked')
    // Add navigation logic here
  }

  return (
    <>
      <NewLandingPage
        onTryClick={handleTryClick}
        onLoginClick={handleLoginClick}
        onQuickStartClick={handleQuickStartClick}
        onApplyDynamicSubtitleClick={handleApplyDynamicSubtitleClick}
        onCustomEditingQuickStartClick={handleCustomEditingQuickStartClick}
        onTryAutoSubtitleClick={handleTryAutoSubtitleClick}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={(email, password, rememberMe) => {
          console.log('Login attempted:', { email, password, rememberMe })
          // Add actual login logic here
          setShowLoginModal(false)
        }}
        onGoogleLogin={() => {
          console.log('Google login clicked')
          // Add Google login logic here
        }}
        onSignup={() => {
          console.log('Signup clicked')
          window.location.href = '/signup'
        }}
        onForgotPassword={() => {
          console.log('Forgot password clicked')
          // Add forgot password logic here
        }}
        onSkip={() => {
          console.log('Skip clicked')
          setShowLoginModal(false)
        }}
      />
    </>
  )
}
