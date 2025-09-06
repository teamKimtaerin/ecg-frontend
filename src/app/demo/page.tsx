import VideoProcessingDemo from '@/components/VideoProcessingDemo'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ECG Video Processing Demo
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete end-to-end demonstration of video upload, processing, and
            transcription results. This demo shows the full workflow from file
            selection to emotion-analyzed subtitles.
          </p>
        </div>

        <VideoProcessingDemo />

        <div className="max-w-4xl mx-auto mt-12 grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🎬 Features Demonstrated
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Direct S3 upload with presigned URLs</li>
              <li>• Real-time processing status updates</li>
              <li>• Speaker diarization (multiple speakers)</li>
              <li>• Emotion analysis for each segment</li>
              <li>• Timestamped transcription segments</li>
              <li>• Processing metadata and statistics</li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ⚡ Technical Stack
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>
                • <strong>Frontend:</strong> Next.js + TypeScript
              </li>
              <li>
                • <strong>Backend:</strong> FastAPI + Python
              </li>
              <li>
                • <strong>Storage:</strong> AWS S3 with presigned URLs
              </li>
              <li>
                • <strong>Processing:</strong> Simulated ML pipeline
              </li>
              <li>
                • <strong>Real-time:</strong> HTTP polling for status
              </li>
              <li>
                • <strong>Demo Mode:</strong> Mock results for presentation
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
