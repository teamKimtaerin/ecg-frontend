/**
 * API Configuration
 * Centralized configuration for API endpoints and feature flags
 */

export const API_CONFIG = {
  // Feature flags
  USE_MOCK_DATA: true, // Toggle between mock and real API

  // API Base URLs
  FASTAPI_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  MODEL_SERVER_URL:
    process.env.NEXT_PUBLIC_MODEL_SERVER_URL || 'http://localhost:8001',

  // S3 Configuration
  S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET || 'ecg-videos',

  // API Endpoints
  endpoints: {
    // Video upload endpoints
    uploadVideo: {
      generateUrl: '/api/upload-video/generate-url',
      requestProcess: '/api/upload-video/request-process',
    },
    // Processing status
    processingStatus: '/api/processing/status',
    // Results
    getResults: '/api/results',
  },

  // Timeouts
  UPLOAD_TIMEOUT: 300000, // 5 minutes
  PROCESSING_TIMEOUT: 600000, // 10 minutes

  // Polling intervals
  STATUS_POLL_INTERVAL: 2000, // 2 seconds

  // Mock data paths
  MOCK_VIDEO_PATH: '/friends.mp4',
  MOCK_TRANSCRIPTION_PATH: '/real.json',
}

export default API_CONFIG
