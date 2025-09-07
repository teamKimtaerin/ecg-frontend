import { NextResponse } from 'next/server'

// Configure for static export
export const dynamic = 'force-static'
export const revalidate = false

/**
 * GET /api/health 엔드포인트를 처리하는 함수
 * 이 엔드포인트는 컨테이너의 헬스체크에 사용
 *
 * @returns {NextResponse} 서비스의 상태를 나타내는 JSON 응답
 */
export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      service: 'frontend',
      timestamp: new Date().toISOString(),
      // 'DOCKER' 환경변수를 사용하여 Docker에서 실행 중인지 확인
      environment: process.env.DOCKER === 'true' ? 'docker' : 'local',
    }

    // 정상적인 상태 코드로 응답을 보냄
    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    // 에러 발생 시 500 상태 코드와 함께 에러 메시지를 보냄
    console.error('Health check failed:', error)
    return NextResponse.json(
      { status: 'unhealthy', error: 'Service is not running' },
      { status: 500 }
    )
  }
}
