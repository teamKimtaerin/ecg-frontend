import { NextRequest, NextResponse } from 'next/server'
import { YouTubeApiUploader } from '@/services/youtube/YouTubeApiUploader'

export async function GET(request: NextRequest) {
  console.log('[VERIFY] API 호출됨')

  try {
    // 쿠키에서 인증 토큰 확인
    const authToken = request.cookies.get('youtube_auth_token')?.value
    console.log('[VERIFY] 쿠키 토큰 존재 여부:', !!authToken)
    console.log('[VERIFY] 토큰 길이:', authToken?.length || 0)

    if (!authToken) {
      console.log('[VERIFY] 토큰 없음 - 인증되지 않음')
      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        error: '인증 토큰이 없습니다.',
      })
    }

    // JWT 토큰에서 Google 토큰 추출
    console.log('[VERIFY] JWT 토큰 파싱 시도')
    const tokens = YouTubeApiUploader.extractTokensFromJWT(authToken)
    console.log('[VERIFY] 토큰 파싱 결과:', {
      success: !!tokens,
      hasAccessToken: !!tokens?.google_access_token,
      hasRefreshToken: !!tokens?.google_refresh_token,
    })

    if (!tokens || !tokens.google_access_token) {
      console.log('[VERIFY] JWT 토큰 파싱 실패 또는 액세스 토큰 없음')
      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        error: '유효하지 않은 인증 토큰입니다.',
      })
    }

    // YouTube API를 사용해 채널 정보 조회 (토큰 유효성 검증)
    console.log('[VERIFY] YouTube API 호출 시작')
    try {
      const uploader = new YouTubeApiUploader(
        tokens.google_access_token,
        tokens.google_refresh_token
      )

      const channelResult = await uploader.getChannelInfo()
      console.log('[VERIFY] 채널 정보 조회 결과:', {
        success: channelResult.success,
        hasChannel: !!channelResult.channel,
        channelTitle: channelResult.channel?.title,
        error: channelResult.error,
      })

      if (!channelResult.success) {
        console.log('[VERIFY] 채널 정보 조회 실패:', channelResult.error)
        return NextResponse.json({
          success: false,
          isAuthenticated: false,
          error: channelResult.error || 'YouTube API 인증 실패',
        })
      }

      console.log('[VERIFY] 인증 성공 - 채널 정보 반환')
      return NextResponse.json({
        success: true,
        isAuthenticated: true,
        userInfo: {
          email: null, // YouTube API에서는 이메일을 직접 제공하지 않음
          name: channelResult.channel?.title || null,
          channelId: channelResult.channel?.id || null,
        },
        channelInfo: channelResult.channel,
      })
    } catch (apiError) {
      console.error('[VERIFY] YouTube API 호출 오류:', apiError)
      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        error: 'YouTube API 인증 실패',
      })
    }
  } catch (error) {
    console.error('[VERIFY] 토큰 검증 오류:', error)
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      error: '토큰 검증 실패',
    })
  }
}
