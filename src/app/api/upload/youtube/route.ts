import { NextRequest, NextResponse } from 'next/server'
import { YouTubeApiUploader } from '@/services/youtube/YouTubeApiUploader'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 인증 토큰 확인
    const authToken = request.cookies.get('youtube_auth_token')?.value
    console.log(
      'YouTube 업로드 요청 - 토큰 확인:',
      authToken ? '토큰 존재' : '토큰 없음'
    )

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          error: '인증 토큰이 없습니다. 먼저 YouTube 계정을 연동해주세요.',
        },
        { status: 401 }
      )
    }

    // JWT 토큰에서 Google 토큰 추출
    const tokens = YouTubeApiUploader.extractTokensFromJWT(authToken)
    if (!tokens || !tokens.google_access_token) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 인증 토큰입니다.',
        },
        { status: 401 }
      )
    }

    // 요청 본문에서 업로드 설정 파싱
    const body = await request.json()
    const { title, description, privacy = 'private' } = body

    console.log('YouTube 업로드 설정:', {
      title: title || 'ECG 생성 영상',
      description: description || '',
      privacy,
    })

    // friends.mp4 파일 경로 (프로젝트 루트의 public 폴더)
    const videoPath = path.join(process.cwd(), 'public', 'friends.mp4')
    console.log('비디오 파일 경로:', videoPath)

    // 파일 존재 확인
    if (!fs.existsSync(videoPath)) {
      console.error('비디오 파일을 찾을 수 없음:', videoPath)
      return NextResponse.json(
        {
          success: false,
          error: '업로드할 비디오 파일을 찾을 수 없습니다.',
        },
        { status: 404 }
      )
    }

    // 파일 크기 확인
    const stats = fs.statSync(videoPath)
    const fileSizeInMB = stats.size / (1024 * 1024)
    console.log(`비디오 파일 크기: ${fileSizeInMB.toFixed(1)}MB`)

    // YouTube API 업로더 초기화
    const uploader = new YouTubeApiUploader(
      tokens.google_access_token,
      tokens.google_refresh_token,
      (progress) => {
        console.log('업로드 진행 상황:', progress)
        // 실시간 진행 상황은 추후 WebSocket이나 Server-Sent Events로 구현 가능
      }
    )

    // 실제 YouTube 업로드 실행
    console.log('YouTube 업로드 시작...')
    const uploadResult = await uploader.uploadVideo({
      title: title || 'ECG 생성 영상',
      description: description || 'ECG로 생성된 자막 영상입니다.',
      privacy,
      videoPath,
      settings: {
        title: title || 'ECG 생성 영상',
        resolution: '1080p',
        quality: '추천 품질',
        frameRate: '30fps',
        format: 'MP4',
      },
    })

    if (uploadResult.success) {
      console.log('YouTube 업로드 성공:', uploadResult.videoUrl)
      return NextResponse.json({
        success: true,
        videoUrl: uploadResult.videoUrl,
        videoId: uploadResult.videoId,
        message: 'YouTube에 성공적으로 업로드되었습니다!',
      })
    } else {
      console.error('YouTube 업로드 실패:', uploadResult.error)
      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || '업로드 중 오류가 발생했습니다.',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('YouTube 업로드 API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
