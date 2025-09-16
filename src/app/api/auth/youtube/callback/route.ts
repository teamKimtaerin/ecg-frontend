import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // 세션 ID
    const error = searchParams.get('error')

    if (error) {
      // 사용자가 인증을 거부한 경우
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/editor?auth=cancelled`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/editor?auth=error&message=no_code`
      )
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/editor?auth=error&message=missing_config`
      )
    }

    // OAuth2 클라이언트 설정
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/youtube/callback`
    )

    // 인증 코드로 토큰 교환
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // JWT 토큰 생성 (클라이언트에서 사용할 용도)
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const accessToken = jwt.sign(
      {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date,
        sessionId: state,
      },
      jwtSecret,
      { expiresIn: '1h' }
    )

    // 브라우저 쿠키에 토큰 저장 - YouTube 업로드 모달로 복귀하도록 파라미터 추가
    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/editor?auth=success&returnTo=youtube-upload`
    )

    // 쿠키 설정 전에 로그 추가
    console.log('쿠키 설정 시도:', {
      tokenLength: accessToken.length,
      isProduction: process.env.NODE_ENV === 'production',
      path: '/',
    })

    response.cookies.set('youtube_auth_token', accessToken, {
      httpOnly: false, // 클라이언트에서 접근 가능하도록 수정
      secure: false, // localhost에서는 false로 설정
      sameSite: 'lax',
      maxAge: 3600, // 1시간
      path: '/',
    })

    console.log('쿠키 설정 완료')

    console.log('YouTube OAuth 인증 완료:', {
      sessionId: state,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresAt: tokens.expiry_date,
      jwtTokenLength: accessToken.length,
    })

    return response
  } catch (error) {
    console.error('OAuth 콜백 처리 오류:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/editor?auth=error&message=${encodeURIComponent(String(error))}`
    )
  }
}
