import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // S3 정적 호스팅을 위한 설정 - 개발 환경에서는 비활성화
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export', // 정적 파일로 빌드 (프로덕션만)
  }),
  trailingSlash: true, // S3용 URL 형식


  // ES Module 패키지 transpile 설정
  transpilePackages: ['motiontext-renderer'],

  // 이미지 최적화 비활성화 (정적 export용)
  images: {
    unoptimized: true, // S3에서는 이미지 최적화 불가
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      // CloudFront 도메인 추가
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
    ],
  },

  // 환경변수 설정
  env: {
    // 개발 환경에서는 YouTube 업로드를 위해 STATIC_EXPORT를 false로 설정
    STATIC_EXPORT: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  },

  // rewrites, headers는 정적 export에서 작동 안함 - CloudFront가 처리
  // // CORS 및 API 설정 (백엔드와 통신용)
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/backend/:path*',
  //       destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/:path*`,
  //     },
  //   ]
  // },

  // // 보안 헤더 설정
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'DENY',
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff',
  //         },
  //         {
  //           key: 'Referrer-Policy',
  //           value: 'origin-when-cross-origin',
  //         },
  //       ],
  //     },
  //   ]
  // },

  // 웹팩 설정 최적화
  webpack: (config, { isServer, dev }) => {
    // 프로덕션 빌드 최적화
    if (!dev && isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        bufferutil: 'commonjs bufferutil',
      })
    }

    return config
  },
}

export default nextConfig
