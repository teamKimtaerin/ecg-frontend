import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// OAuth 2.0 스코프
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Google OAuth 환경변수가 설정되지 않았습니다.'
      }, { status: 500 })
    }

    // OAuth2 클라이언트 설정
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/youtube/callback`
    )

    // 인증 URL 생성
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: sessionId || 'default', // 세션 ID를 state로 전달
      prompt: 'consent' // 매번 동의 화면 표시 (refresh_token 확보)
    })

    return NextResponse.json({
      success: true,
      authUrl,
      message: '인증 URL이 생성되었습니다.'
    })

  } catch (error) {
    console.error('OAuth 인증 URL 생성 오류:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}