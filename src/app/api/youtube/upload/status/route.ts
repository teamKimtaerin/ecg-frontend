import { NextRequest, NextResponse } from 'next/server'
import uploadSessionStore, { deleteUploadSession } from '@/lib/uploadSessions'

// Note: This API route is not available in static export mode (production)

// 개발 환경에서는 실제 처리 가능, 프로덕션에서는 안내 메시지
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
        error: 'sessionId 파라미터가 필요합니다',
      },
      { status: 400 }
    )
  }

  const session = uploadSessionStore.getSession(sessionId)

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error:
          '해당 업로드 세션을 찾을 수 없습니다. 세션이 만료되었거나 존재하지 않습니다.',
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
    createdAt: session.createdAt,
    lastUpdated: session.lastUpdated,
    timestamp: Date.now(),
  })
}

// DELETE 요청으로 세션 정리
export async function DELETE(request: NextRequest) {
  // Static export 환경(프로덕션)에서는 API 라우트가 지원되지 않음
  if (process.env.STATIC_EXPORT === 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'YouTube 업로드 세션 삭제는 개발 환경에서만 지원됩니다.',
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
        error: 'sessionId 파라미터가 필요합니다',
      },
      { status: 400 }
    )
  }

  const existed = uploadSessionStore.hasSession(sessionId)
  const deleted = deleteUploadSession(sessionId)

  return NextResponse.json({
    success: true,
    message: existed ? '세션이 삭제되었습니다' : '세션이 존재하지 않았습니다',
    existed,
    deleted,
  })
}
