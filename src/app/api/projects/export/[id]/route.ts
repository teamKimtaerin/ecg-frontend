import { NextRequest, NextResponse } from 'next/server'
import { ProjectData } from '@/app/(route)/editor/types/project'

// Configure for static export
export const dynamic = 'force-static'
export const revalidate = false

declare global {
  var projectsStorage: ProjectData[] | undefined
}

// 글로벌 저장소 초기화
if (!global.projectsStorage) {
  global.projectsStorage = []
}

// 프로젝트를 자막 파일로 내보내기
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'srt'

    if (!['srt', 'vtt', 'ass'].includes(format)) {
      return NextResponse.json(
        {
          error:
            '지원하지 않는 형식입니다. srt, vtt, ass 중 하나를 선택하세요.',
        },
        { status: 400 }
      )
    }

    const project = global.projectsStorage?.find((p) => p.id === id)

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const subtitleContent = convertToSubtitleFormat(
      project,
      format as 'srt' | 'vtt' | 'ass'
    )
    const filename = `${project.name}.${format}`

    return new NextResponse(subtitleContent, {
      headers: {
        'Content-Type': `text/${format === 'srt' ? 'plain' : format}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('프로젝트 내보내기 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 내보내기에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 자막 포맷 변환 함수들
function convertToSubtitleFormat(
  project: ProjectData,
  format: 'srt' | 'vtt' | 'ass'
): string {
  switch (format) {
    case 'srt':
      return convertToSRT(project)
    case 'vtt':
      return convertToVTT(project)
    case 'ass':
      return convertToASS(project)
    default:
      throw new Error('지원하지 않는 형식입니다.')
  }
}

function convertToSRT(project: ProjectData): string {
  let srt = ''
  project.clips.forEach((clip, index) => {
    const startTime = formatSRTTime(clip.words[0]?.start || 0)
    const endTime = formatSRTTime(clip.words[clip.words.length - 1]?.end || 0)

    srt += `${index + 1}\n`
    srt += `${startTime} --> ${endTime}\n`
    srt += `${clip.fullText}\n\n`
  })
  return srt
}

function convertToVTT(project: ProjectData): string {
  let vtt = 'WEBVTT\n\n'
  project.clips.forEach((clip) => {
    const startTime = formatVTTTime(clip.words[0]?.start || 0)
    const endTime = formatVTTTime(clip.words[clip.words.length - 1]?.end || 0)

    vtt += `${startTime} --> ${endTime}\n`
    vtt += `${clip.fullText}\n\n`
  })
  return vtt
}

function convertToASS(project: ProjectData): string {
  let ass = '[Script Info]\nTitle: ' + project.name + '\nScriptType: v4.00+\n\n'
  ass +=
    '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'
  ass +=
    'Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n'
  ass +=
    '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'

  project.clips.forEach((clip) => {
    const startTime = formatASSTime(clip.words[0]?.start || 0)
    const endTime = formatASSTime(clip.words[clip.words.length - 1]?.end || 0)

    ass += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${clip.fullText}\n`
  })
  return ass
}

// 시간 포맷팅 유틸리티
function formatSRTTime(seconds: number): string {
  const date = new Date(seconds * 1000)
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const secs = date.getUTCSeconds().toString().padStart(2, '0')
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${secs},${ms}`
}

function formatVTTTime(seconds: number): string {
  const date = new Date(seconds * 1000)
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const secs = date.getUTCSeconds().toString().padStart(2, '0')
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${secs}.${ms}`
}

function formatASSTime(seconds: number): string {
  const date = new Date(seconds * 1000)
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(1, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const secs = date.getUTCSeconds().toString().padStart(2, '0')
  const centiseconds = Math.floor(date.getUTCMilliseconds() / 10)
    .toString()
    .padStart(2, '0')
  return `${hours}:${minutes}:${secs}.${centiseconds}`
}
