import React from 'react'
import Button from '@/components/ui/Button'

interface OpenLibrarySectionProps {
  libraryRef: React.RefObject<HTMLElement | null>
}

const OpenLibrarySection: React.FC<OpenLibrarySectionProps> = ({
  libraryRef,
}) => {
  return (
    <section
      ref={libraryRef}
      id="open-library"
      className="py-24 px-6 bg-primary-opaque fade-in-section delay-2"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-h1 font-black">
              <span className="block">Open Library</span>
            </h2>
            <p className="text-h3 text-gray-medium max-w-lg">
              Discover a world of customized subtitle assets!
              <br />
              Upload your designs for others to use,
              <br />
              or find exactly what your video needs!
            </p>
          </div>
          <Button
            variant="accent"
            size="large"
            className="bg-status-positive hover:opacity-80 rounded-full px-8 font-bold hover:scale-105"
          >
            Explore Subtitles
          </Button>
        </div>

        <div className="relative">
          <div className="bg-black rounded-2xl p-6 border border-gray-slate/30">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="bg-status-purple rounded-lg p-3 aspect-square flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    Mauvelous sparkle
                  </span>
                </div>
                <div className="bg-status-notice rounded-lg p-3 aspect-square flex items-center justify-center">
                  <span className="text-black font-bold text-sm">गायत्री</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-status-informative rounded-lg p-3 aspect-square flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    Universal Theme
                  </span>
                </div>
                <div className="bg-gradient-to-br from-status-celery to-status-chartreuse rounded-lg p-3 aspect-square flex items-center justify-center">
                  <span className="text-black font-bold text-sm">Nature</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-status-fuchsia rounded-lg p-3 aspect-square flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BC Ludva</span>
                </div>
                <div className="bg-status-cyan rounded-lg p-3 aspect-square flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BAUBOT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OpenLibrarySection
