import React from 'react'
import Button from '@/components/ui/Button'

interface EditTranscriptionSectionProps {
  editRef: React.RefObject<HTMLElement | null>
}

const EditTranscriptionSection: React.FC<EditTranscriptionSectionProps> = ({
  editRef,
}) => {
  return (
    <section ref={editRef} className="py-24 px-6 fade-in-section delay-1">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 relative">
          <div className="bg-black rounded-2xl p-6 border border-gray-slate">
            <div className="aspect-[4/3] bg-gray-slate rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-medium text-sm ml-4">편집기</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-primary rounded w-3/4"></div>
                  <div className="h-2 bg-primary rounded w-full"></div>
                  <div className="h-2 bg-primary rounded w-2/3"></div>
                </div>
                <div className="bg-primary rounded p-3">
                  <p className="text-white text-sm">자막 편집 인터페이스</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-h1 font-black">
              <span className="block">Edit</span>
              <span className="block">Transcription</span>
            </h2>
            <p className="text-h3 text-gray-medium max-w-lg">
              Create more refined and detailed subtitles with Edit Mode!
              <br />
              you&apos;ll love the perfect results!
            </p>
          </div>
          <Button
            variant="accent"
            size="large"
            className="bg-status-positive hover:opacity-80 rounded-full px-8 font-bold hover:scale-105"
          >
            Edit Transcription
          </Button>
        </div>
      </div>
    </section>
  )
}

export default EditTranscriptionSection
