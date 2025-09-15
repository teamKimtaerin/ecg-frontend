import { NextRequest, NextResponse } from 'next/server'
import { YouTubeApiUploader } from '@/services/youtube/YouTubeApiUploader'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 인증 토큰 확인
    const authToken = request.cookies.get('youtube_auth_token')?.value
    console.log('인증 토큰 확인:', authToken ? '토큰 존재' : '토큰 없음')

    if (!authToken) {
      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        error: '인증 토큰이 없습니다.'
      }, { status: 401 })
    }

    // JWT 토큰에서 Google 토큰 추출
    const tokens = YouTubeApiUploader.extractTokensFromJWT(authToken)
    console.log('추출된 토큰 정보:', {
      hasAccessToken: !!tokens?.google_access_token,
      hasRefreshToken: !!tokens?.google_refresh_token,
      sessionId: tokens?.sessionId,
      expiresAt: tokens?.expires_at
    })

    if (!tokens) {
      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        error: '유효하지 않은 토큰입니다.'
      }, { status: 401 })
    }

    if (!tokens.google_access_token) {
      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        error: 'Google 액세스 토큰이 없습니다.'
      }, { status: 401 })
    }

    // Google OAuth2 클라이언트로 토큰 유효성 검증
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/youtube/callback`
    )

    console.log('Google OAuth2 설정:', {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/youtube/callback`
    })

    oauth2Client.setCredentials({
      access_token: tokens.google_access_token,
      refresh_token: tokens.google_refresh_token,
      expiry_date: tokens.expires_at
    })

    console.log('OAuth2 클라이언트 토큰 설정 완료')

    try {
      // 사용자 정보 조회로 토큰 유효성 확인
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
      })

      const userInfo = await oauth2.userinfo.get()

      return NextResponse.json({
        success: true,
        isAuthenticated: true,
        userInfo: {
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture
        },
        tokenInfo: {
          sessionId: tokens.sessionId,
          expiresAt: tokens.expires_at
        }
      })

    } catch (tokenError) {
      console.error('토큰 검증 실패:', tokenError)

      // 토큰이 만료된 경우 리프레시 시도
      if (tokens.google_refresh_token) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken()

          // 새로운 토큰으로 JWT 재생성
          const jwt = require('jsonwebtoken')
          const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret'

          const newAccessToken = jwt.sign(
            {
              google_access_token: credentials.access_token,
              google_refresh_token: credentials.refresh_token || tokens.google_refresh_token,
              expires_at: credentials.expiry_date,
              sessionId: tokens.sessionId
            },
            jwtSecret,
            { expiresIn: '1h' }
          )

          // 새 토큰을 쿠키에 설정
          const response = NextResponse.json({
            success: true,
            isAuthenticated: true,
            refreshed: true,
            message: '토큰이 갱신되었습니다.'
          })

          response.cookies.set('youtube_auth_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600,
            path: '/'
          })

          return response

        } catch (refreshError) {
          console.error('토큰 갱신 실패:', refreshError)
          return NextResponse.json({
            success: false,
            isAuthenticated: false,
            error: '토큰이 만료되었으며 갱신에 실패했습니다. 다시 로그인해주세요.'
          }, { status: 401 })
        }
      }

      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        error: '토큰이 유효하지 않습니다. 다시 로그인해주세요.'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      error: '인증 확인 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}