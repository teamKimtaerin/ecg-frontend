import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// OAuth 2.0 스코프
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    console.log('YouTube OAuth 요청 - sessionId:', sessionId)
    console.log('환경변수 확인:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    })

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('환경변수 누락:', {
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Google OAuth 환경변수가 설정되지 않았습니다.',
        },
        { status: 500 }
      )
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
      prompt: 'consent', // 매번 동의 화면 표시 (refresh_token 확보)
    })

    console.log('OAuth URL 생성 성공:', authUrl)

    return NextResponse.json({
      success: true,
      authUrl,
      message: '인증 URL이 생성되었습니다.',
    })
  } catch (error) {
    console.error('OAuth 인증 URL 생성 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    )
  }
}
