'use client'

import React from 'react'
import Header from './Header'
import HeroSection from './HeroSection'
import AISubtitleSection from './AISubtitleSection'
import DynamicSubtitleSection from './DynamicSubtitleSection'
import CustomEditingSection from './CustomEditingSection'
import FreeAssetsSection from './FreeAssetsSection'
import Footer from './Footer'

export interface NewLandingPageProps {
  // Header event handlers
  onTryClick?: () => void
  onLoginClick?: () => void

  // Hero section event handlers
  onQuickStartClick?: () => void

  // Dynamic subtitle section event handlers
  onApplyDynamicSubtitleClick?: () => void

  // Custom editing section event handlers
  onCustomEditingQuickStartClick?: () => void

  // Free assets section event handlers
  onTryAutoSubtitleClick?: () => void
}

const NewLandingPage: React.FC<NewLandingPageProps> = ({
  onTryClick,
  onLoginClick,
  onQuickStartClick,
  onApplyDynamicSubtitleClick,
  onCustomEditingQuickStartClick,
  onTryAutoSubtitleClick,
}) => {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header onTryClick={onTryClick} onLoginClick={onLoginClick} />

      <HeroSection onQuickStartClick={onQuickStartClick} />

      <AISubtitleSection />

      <DynamicSubtitleSection
        onApplyDynamicSubtitleClick={onApplyDynamicSubtitleClick}
      />

      <CustomEditingSection
        onQuickStartClick={onCustomEditingQuickStartClick}
      />

      <FreeAssetsSection onTryAutoSubtitleClick={onTryAutoSubtitleClick} />

      <Footer />
    </div>
  )
}

export default NewLandingPage
