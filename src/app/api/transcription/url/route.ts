import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-static'

interface TranscriptionUrlRequest {
  url: string
  language: string
  useDictionary: boolean
  autoSubmit: boolean
  method: 'link'
}

export async function POST(request: NextRequest) {
  try {
    const data: TranscriptionUrlRequest = await request.json()

    // 입력값 검증
    if (!data.url || !data.url.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required',
        },
        { status: 400 }
      )
    }

    // URL 형식 검증
    try {
      new URL(data.url)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format',
        },
        { status: 400 }
      )
    }

    console.log('Received URL transcription request:', data)

    // URL processing logic would be implemented here
    // This would include: downloading from YouTube/Vimeo URLs, calling transcription service, etc.

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: 'URL transcription started successfully',
      data,
    })
  } catch (error) {
    console.error('Error processing URL transcription:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process URL transcription',
      },
      { status: 500 }
    )
  }
}
