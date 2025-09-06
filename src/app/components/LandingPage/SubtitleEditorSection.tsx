import React from 'react'
import Button from '@/components/ui/Button'

interface SubtitleEditorSectionProps {
  subtitleRef: React.RefObject<HTMLElement | null>
}

const SubtitleEditorSection: React.FC<SubtitleEditorSectionProps> = ({
  subtitleRef,
}) => {
  return (
    <section
      ref={subtitleRef}
      className="py-24 px-6 bg-primary-opaque fade-in-section delay-2"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-h1 font-black">
              <span className="block">Subtitle Editor</span>
            </h2>
            <p className="text-h3 text-gray-medium max-w-lg">
              You can even create animated, vibrant subtitles.
              <br />
              Start creating your masterpiece right now!
            </p>
          </div>
          <Button
            variant="accent"
            size="large"
            className="bg-status-positive hover:opacity-80 rounded-full px-8 font-bold hover:scale-105"
          >
            Create Subtitles
          </Button>
        </div>

        <div className="relative">
          <div className="bg-black rounded-2xl p-6 border border-gray-slate">
            <div className="aspect-video bg-gray-slate rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-medium text-sm">
                    Waveform Editor
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-status-positive rounded-full"></div>
                    <div className="w-2 h-2 bg-status-notice rounded-full"></div>
                    <div className="w-2 h-2 bg-status-negative rounded-full"></div>
                  </div>
                </div>
                <div className="h-16 bg-gradient-to-r from-status-magenta via-status-fuchsia to-status-purple rounded opacity-60"></div>
                <div className="text-center">
                  <p className="text-white font-semibold">
                    Put that{' '}
                    <span className="text-status-fuchsia">coffee dOWn!</span>{' '}
                    Coffee&apos;s for{' '}
                    <span className="text-status-fuchsia">closers</span> only!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SubtitleEditorSection
