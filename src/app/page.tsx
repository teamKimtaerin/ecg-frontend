'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NewLandingPage } from '@/components/NewLandingPage'
import WelcomeModal from '@/components/WelcomeModal'

export default function Home() {
  const router = useRouter()
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const handleTryClick = () => {
    console.log('Try button clicked')
    // Add navigation logic here
  }

  const handleLoginClick = () => {
    console.log('Login button clicked')
    router.push('/auth')
  }

  const handleQuickStartClick = () => {
    console.log('Quick start button clicked')
    setShowWelcomeModal(true)
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

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onAgreeAndStart={() => {
          setShowWelcomeModal(false)
          // Navigate to editor or upload page
          window.location.href = '/editor'
        }}
        onGoBack={() => setShowWelcomeModal(false)}
      />
    </>
  )
}
