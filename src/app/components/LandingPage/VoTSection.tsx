import React from 'react'
import Button from '@/components/ui/Button'

interface VoTSectionProps {
  votRef: React.RefObject<HTMLElement | null>
}

const VoTSection: React.FC<VoTSectionProps> = ({ votRef }) => {
  return (
    <section
      ref={votRef}
      id="vot"
      className="py-24 px-6 fade-in-section delay-1"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 relative">
          <div className="bg-gray-slate/30 rounded-2xl p-6 border border-gray-slate/30">
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg p-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      LIVE
                    </div>
                    <span className="text-white text-sm">Breaking News</span>
                  </div>
                  <div className="bg-red-600/20 rounded p-2">
                    <p className="text-white text-sm">BREAKING NEWS</p>
                  </div>
                  <div className="bg-gray-slate rounded p-3">
                    <p className="text-gray-medium text-xs">
                      Latest trending video content...
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-black rounded-lg p-3">
                <p className="text-white text-sm">
                  Revolutionize your design process with NX immersive
                  designer...
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-h1 font-black">
              <span className="block text-gray-medium text-h1">VoT</span>
              <span className="block text-gray-medium text-h2">
                (Videos of Today)
              </span>
            </h2>
            <p className="text-h3 text-gray-medium max-w-lg">
              Curious about what others are creating?
              <br />
              Visit VoT!
              <br />
              Discover today&apos;s trending videos instantly!
            </p>
          </div>
          <Button
            variant="accent"
            size="large"
            className="bg-status-positive hover:opacity-80 rounded-full px-8 font-bold hover:scale-105"
          >
            Explore Videos
          </Button>
        </div>
      </div>
    </section>
  )
}

export default VoTSection
