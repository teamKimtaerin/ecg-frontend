import { NextRequest, NextResponse } from 'next/server'
import { ProjectData } from '@/app/(route)/editor/types/project'

// Configure for static export
export const dynamic = 'force-static'
export const revalidate = false

// 메모리 저장소 (실제로는 위 save/route.ts와 동일한 저장소를 공유해야 함)
// TODO : 실제 구현에서는 데이터베이스나 외부 저장소를 사용
declare global {
  var projectsStorage: ProjectData[] | undefined
}

// 글로벌 저장소 초기화
if (!global.projectsStorage) {
  global.projectsStorage = []
}

// 특정 프로젝트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = global.projectsStorage?.find((p) => p.id === id)

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      project,
    })
  } catch (error) {
    console.error('프로젝트 조회 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 특정 프로젝트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!global.projectsStorage) {
      return NextResponse.json(
        { error: '저장소를 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    const projectIndex = global.projectsStorage.findIndex((p) => p.id === id)

    if (projectIndex === -1) {
      return NextResponse.json(
        { error: '삭제할 프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const deletedProject = global.projectsStorage.splice(projectIndex, 1)[0]

    console.log(`프로젝트 "${deletedProject.name}" 삭제됨 (ID: ${id})`)

    return NextResponse.json({
      success: true,
      message: '프로젝트가 성공적으로 삭제되었습니다.',
      deletedProject: {
        id: deletedProject.id,
        name: deletedProject.name,
      },
    })
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
