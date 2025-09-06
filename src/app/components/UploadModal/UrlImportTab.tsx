'use client'

import React from 'react'
import AlertBanner from '@/components/AlertBanner'

interface UrlImportTabProps {
  url: string
  setUrl: (url: string) => void
  isValidUrl: boolean
}

const UrlImportTab: React.FC<UrlImportTabProps> = ({
  url,
  setUrl,
  isValidUrl,
}) => {
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  const supportedPlatforms = [
    { name: 'YouTube', icon: '🎬', example: 'https://youtube.com/watch?v=...' },
    { name: 'Vimeo', icon: '📺', example: 'https://vimeo.com/...' },
    {
      name: 'Direct URL',
      icon: '🔗',
      example: 'https://example.com/video.mp4',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary">
            Import from URL
          </h3>
          <p className="text-text-secondary">
            Paste a video URL from supported platforms
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="url-input"
            className="block text-sm font-medium text-text-primary"
          >
            Video URL
          </label>
          <div className="relative">
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://youtube.com/watch?v=..."
              className={`
                w-full px-4 py-3 pr-10 border rounded-lg transition-colors
                ${
                  url && !isValidUrl
                    ? 'border-status-negative focus:border-status-negative focus:ring-status-negative/20'
                    : url && isValidUrl
                      ? 'border-status-positive focus:border-status-positive focus:ring-status-positive/20'
                      : 'border-border focus:border-primary focus:ring-primary/20'
                }
                focus:ring-2 focus:outline-none bg-surface text-text-primary
              `}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {url &&
                (isValidUrl ? (
                  <svg
                    className="w-5 h-5 text-status-positive"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-status-negative"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ))}
            </div>
          </div>
          {url && !isValidUrl && (
            <p className="text-sm text-status-negative">
              Please enter a valid URL
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-medium text-text-primary mb-4">
          Supported Platforms
        </h4>
        <div className="grid gap-3">
          {supportedPlatforms.map((platform, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-surface-secondary rounded-lg border border-border"
            >
              <span className="text-2xl">{platform.icon}</span>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {platform.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {platform.example}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertBanner
        variant="informative"
        text="Import Tips: Make sure the video is publicly accessible. Some platforms may require additional permissions. Processing time varies based on video length."
        isDismissible={false}
      />
    </div>
  )
}

export default UrlImportTab
