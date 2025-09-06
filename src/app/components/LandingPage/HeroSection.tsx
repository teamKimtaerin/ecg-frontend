'use client'

import React, { useState } from 'react'
import Button from '@/components/ui/Button'

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLElement | null>
}

const HeroSection: React.FC<HeroSectionProps> = ({ heroRef }) => {
  const [email, setEmail] = useState('')

  return (
    <section
      ref={heroRef}
      className="min-h-screen flex items-center justify-center px-6 pt-20 fade-in-section"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-h1 font-black leading-tight">
              <span className="block">Expressive</span>
              <span className="block">Caption</span>
              <span className="block text-primary">Generator</span>
              <span className="block">platform</span>
            </h1>
          </div>
          <div className="flex space-x-4">
            <Button
              variant="accent"
              size="large"
              className="font-bold bg-status-positive hover:bg-status-positive hover:opacity-70 hover:scale-105 rounded-full px-8"
            >
              Easy Start
            </Button>
            <Button
              variant="secondary"
              style="outline"
              size="large"
              className="font-bold rounded-full px-8 text-gray-medium hover:bg-gray-slate"
            >
              Explore Results
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="bg-gray-slate/30 rounded-2xl p-8 border border-gray-slate/30">
            <div className="text-center space-y-6">
              <h3 className="text-h3 text-white">
                Elevate your content quality with vibrant,
                <br />
                emotion-driven subtitles.
              </h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter your email here"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 bg-black/50 border border-gray-slate/50 rounded-full text-white placeholder-gray-medium focus:outline-none focus:border-primary"
                  />
                  <Button
                    variant="accent"
                    size="medium"
                    className="font-bold bg-status-positive hover:bg-status-positive hover:opacity-70 hover:scale-105 rounded-full px-8 "
                  >
                    Sign up
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-px bg-gray-slate/30"></div>
                  <span className="text-gray-medium text-sm">or</span>
                  <div className="flex-1 h-px bg-gray-slate/30"></div>
                </div>
                <Button
                  variant="secondary"
                  style="outline"
                  size="medium"
                  className="w-full rounded-full border-gray-slate/50 text-white hover:border-white"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span className=" w-5 h-5 bg-white rounded-full flex items-center justify-center text-black font-bold text-xs">
                      G
                    </span>
                    <span>Sign Up with Google</span>
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
