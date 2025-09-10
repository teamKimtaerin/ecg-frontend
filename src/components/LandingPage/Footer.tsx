import React from 'react'
import HoitLogo from '@/components/ui/HoitLogo'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-slate/10 border-t border-gray-slate/20 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <HoitLogo size="sm" />
              <h3 className="text-h3 text-white font-bold">Hoit</h3>
            </div>
            <p className="text-gray-medium">
              Expressive Caption Generator platform for creating vibrant,
              emotion-driven subtitles.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold">Features</h4>
            <div className="space-y-2">
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                Fast Transcription
              </a>
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                Edit Transcription
              </a>
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                Subtitle Editor
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold">Discover</h4>
            <div className="space-y-2">
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                VoT (Videos of Today)
              </a>
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                Open Library
              </a>
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                Trending
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-semibold">Support</h4>
            <div className="space-y-2">
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                Documentation
              </a>
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                Help Center
              </a>
              <a
                href="#"
                className="block text-gray-medium hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-slate/20 mt-12 pt-8 text-center">
          <p className="text-gray-medium">
            © 2024 ECG Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
