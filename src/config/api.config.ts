/**
 * API Configuration
 * Centralized configuration for API endpoints and feature flags
 */

export const API_CONFIG = {
  // Feature flags
  // Global debug mode: for general debugging purposes
  DEBUG_MODE:
    (typeof process !== 'undefined' &&
      process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') ||
    false,

  // Mock data flag: independently controlled from DEBUG_MODE
  USE_MOCK_DATA:
    (typeof process !== 'undefined' &&
      process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') ||
    false, // Toggle between mock and real API

  // API Base URL (환경변수에서 가져오기)
  FASTAPI_BASE_URL: process.env.NEXT_PUBLIC_API_URL!,

  // S3 Configuration
  S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET || 'ecg-videos',

  // API Endpoints
  endpoints: {
    // Authentication
    auth: {
      signup: '/api/auth/signup',
      login: '/api/auth/login',
      me: '/api/auth/me',
      googleLogin: '/api/auth/google/login',
      googleCallback: '/api/auth/google/callback',
    },
    // Video upload endpoints
    uploadVideo: {
      generateUrl: '/api/upload-video/generate-url',
      requestProcess: '/api/upload-video/request-process',
      status: '/api/upload-video/status',
    },
    // Project management
    projects: {
      list: '/api/projects',
      create: '/api/projects',
      update: '/api/projects',
      delete: '/api/projects',
    },
    // GPU Rendering
    render: {
      create: '/api/render/create',
      status: '/api/render',
      cancel: '/api/render',
      history: '/api/render/history',
    },
    // Legacy endpoints (deprecated)
    processingStatus: '/api/processing/status',
    getResults: '/api/results',
  },

  // Timeouts
  UPLOAD_TIMEOUT: 300000, // 5 minutes
  PROCESSING_TIMEOUT: 600000, // 10 minutes

  // Polling intervals
  STATUS_POLL_INTERVAL: 2000, // 2 seconds

  // Mock data paths
  MOCK_VIDEO_PATH: '/friends.mp4',
  MOCK_TRANSCRIPTION_PATH:
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
      ? '/friends_result.json'
      : '/real.json',
}

export default API_CONFIG
