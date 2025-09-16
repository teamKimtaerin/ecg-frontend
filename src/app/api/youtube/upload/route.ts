import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { YouTubeApiUploader } from '@/services/youtube/YouTubeApiUploader'
import {
  YouTubeUploadRequest,
  UploadProgress,
} from '@/app/(route)/editor/components/Export/ExportTypes'
import uploadSessionStore, {
  createUploadSession,
  updateUploadSession,
} from '@/lib/uploadSessions'

// Note: This API route is not available in static export mode (production)

// YouTube Data API를 사용한 업로드
export async function POST(request: NextRequest) {
  // Static export 환경(프로덕션)에서는 API 라우트가 지원되지 않음
  if (process.env.STATIC_EXPORT === 'true') {
    return NextResponse.json(
      {
        success: false,
        error:
          'YouTube 업로드는 개발 환경에서만 지원됩니다. 프로덕션 환경에서는 사용할 수 없습니다.',
      },
      { status: 501 }
    )
  }

  try {
    const body = (await request.json()) as YouTubeUploadRequest & {
      sessionId?: string
    }

    // 인증 토큰 확인
    const authToken = request.cookies.get('youtube_auth_token')?.value
    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'YouTube 계정 인증이 필요합니다. 먼저 계정을 연동해주세요.',
          requireAuth: true,
        },
        { status: 401 }
      )
    }

    // JWT 토큰에서 Google 토큰 추출
    const tokens = YouTubeApiUploader.extractTokensFromJWT(authToken)
    if (!tokens) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 인증 토큰입니다. 다시 로그인해주세요.',
          requireAuth: true,
        },
        { status: 401 }
      )
    }

    // 세션 ID 생성 (클라이언트에서 진행 상황 추적용)
    const sessionId =
      body.sessionId ||
      `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 비디오 파일 경로 검증
    const videoPath = path.resolve(process.cwd(), body.videoPath)

    // 파일 존재 확인
    try {
      const fs = await import('fs')
      if (!fs.existsSync(videoPath)) {
        return NextResponse.json(
          {
            success: false,
            error: `비디오 파일을 찾을 수 없습니다: ${body.videoPath}`,
          },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `파일 접근 오류: ${error}`,
        },
        { status: 400 }
      )
    }

    // 초기 세션 생성
    createUploadSession(sessionId, {
      status: 'initializing',
      progress: 0,
      message: 'YouTube API 업로드 준비 중...',
    })

    // 진행 상황 콜백 함수
    const progressCallback = (progress: UploadProgress) => {
      updateUploadSession(sessionId, progress)
      console.log(
        `[${sessionId}] ${progress.status}: ${progress.progress}% - ${progress.message}`
      )
    }

    // 백그라운드에서 업로드 실행
    executeUpload(body, videoPath, tokens, progressCallback)

    // 즉시 응답 반환 (클라이언트는 sessionId로 진행 상황 조회)
    return NextResponse.json({
      success: true,
      sessionId,
      message:
        'YouTube API 업로드가 시작되었습니다. 진행 상황을 확인하려면 /api/youtube/upload/status를 호출하세요.',
    })
  } catch (error) {
    console.error('YouTube 업로드 API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: `서버 오류: ${error}`,
      },
      { status: 500 }
    )
  }
}

async function executeUpload(
  request: YouTubeUploadRequest,
  videoPath: string,
  tokens: { google_access_token: string; google_refresh_token?: string },
  progressCallback: (progress: UploadProgress) => void
) {
  const uploader = new YouTubeApiUploader(
    tokens.google_access_token,
    tokens.google_refresh_token,
    progressCallback
  )

  try {
    const result = await uploader.uploadVideo({
      ...request,
      videoPath,
    })

    // 최종 결과 저장
    if (result.success) {
      progressCallback({
        status: 'completed',
        progress: 100,
        message: `YouTube API 업로드 완료! 비디오 URL: ${result.videoUrl}`,
      })
    } else {
      progressCallback({
        status: 'error',
        progress: 0,
        message: result.error || '알 수 없는 오류',
        error: result.error,
      })
    }

    return result
  } catch (error) {
    progressCallback({
      status: 'error',
      progress: 0,
      message: `YouTube API 업로드 실패: ${error}`,
      error: String(error),
    })
    throw error
  }
}

// 업로드 진행 상황 조회를 위한 GET 엔드포인트
export async function GET(request: NextRequest) {
  // Static export 환경(프로덕션)에서는 API 라우트가 지원되지 않음
  if (process.env.STATIC_EXPORT === 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'YouTube 업로드 상태 조회는 개발 환경에서만 지원됩니다.',
      },
      { status: 501 }
    )
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: 'sessionId가 필요합니다',
      },
      { status: 400 }
    )
  }

  const session = uploadSessionStore.getSession(sessionId)

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: '해당 세션을 찾을 수 없습니다',
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    sessionId,
    progress: session.progress,
    videoUrl: session.videoUrl,
    error: session.error,
    isCompleted: session.isCompleted,
    timestamp: session.lastUpdated,
  })
}
