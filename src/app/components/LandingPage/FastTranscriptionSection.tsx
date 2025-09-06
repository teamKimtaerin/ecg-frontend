'use client'

import React from 'react'
import Button from '@/components/ui/Button'

interface FastTranscriptionSectionProps {
  featuresRef: React.RefObject<HTMLElement | null>
  onTranscriptionClick: () => void
}

const FastTranscriptionSection: React.FC<FastTranscriptionSectionProps> = ({
  featuresRef,
  onTranscriptionClick,
}) => {
  return (
    <section
      ref={featuresRef}
      id="features"
      className="py-24 px-6 bg-primary-opaque fade-in-section"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-h1 font-black">
              <span className="block">Fast</span>
              <span className="block">Transcription</span>
            </h2>
            <p className="text-h3 text-gray-medium max-w-lg">
              Make quick and easy vibrant subtitles!
              <br />
              Enrich your amazing videos like never before!
            </p>
          </div>
          <Button
            variant="accent"
            size="large"
            className="bg-status-positive hover:opacity-70 hover:scale-105 rounded-full px-8 font-bold"
            onClick={onTranscriptionClick}
          >
            Fast Transcription
          </Button>
        </div>

        <div className="relative">
          <div className="bg-black rounded-2xl p-4 border border-gray-slate/30">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <span className="inline-block w-2 h-2 bg-status-positive rounded-full"></span>
                <span className="inline-block w-2 h-2 bg-status-notice rounded-full"></span>
                <span className="inline-block w-2 h-2 bg-status-negative rounded-full"></span>
                <span className="text-xs text-gray-medium ml-2">
                  Style Options
                </span>
              </div>
              <div className="aspect-video bg-gray-slate opacity-80 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-primary opacity-30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-primary text-2xl">▶</span>
                  </div>
                  <p className="text-gray-medium text-sm">Video Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FastTranscriptionSection
