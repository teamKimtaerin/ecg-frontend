import { NextRequest, NextResponse } from 'next/server'

// 파일 업로드 크기 제한 설정
export const maxDuration = 60 // 60초 타임아웃
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // FormData에서 파일들과 설정 추출
    const files: File[] = []
    const config: Record<string, string> = {}

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value)
      } else if (typeof value === 'string') {
        config[key] = value
      }
    }

    console.log(
      'Received files:',
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    )
    console.log('Received config:', config)

    // File processing logic would be implemented here
    // This would include: uploading files to storage, calling transcription service, etc.

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      files: files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      config,
    })
  } catch (error) {
    console.error('Error processing file upload:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process file upload',
      },
      { status: 500 }
    )
  }
}
