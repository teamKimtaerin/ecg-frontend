import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

/**
 * GET /api/test 엔드포인트를 처리하는 함수
 * 이 엔드포인트는 간단한 테스트 용도로 사용
 *
 * @returns {NextResponse} 테스트 데이터를 포함한 JSON 응답
 */
export async function GET() {
  const testData = {
    message: 'This is a test endpoint from Next.js on Docker!',
    version: '1.0',
    data: {
      type: 'test-data',
      id: 123,
    },
  }
  return NextResponse.json(testData, { status: 200 })
}
