import { NextRequest, NextResponse } from 'next/server'
import { ProjectData } from '@/app/(route)/editor/types/project'

// Configure for static export
export const dynamic = 'force-static'
export const revalidate = false

// 전역 저장소 선언
declare global {
  var projectsStorage: ProjectData[] | undefined
}

// 썌얘 : 메모리 저장소 초기화 (실제 운영에서는 데이터베이스 사용)
if (!global.projectsStorage) {
  global.projectsStorage = []
}

export async function POST(request: NextRequest) {
  try {
    const projectData: ProjectData = await request.json()

    // 기본 검증
    if (
      !projectData.id ||
      !projectData.name ||
      !Array.isArray(projectData.clips)
    ) {
      return NextResponse.json(
        { error: '필수 프로젝트 데이터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 프로젝트 업데이트 또는 새 프로젝트 추가
    const existingIndex = global.projectsStorage!.findIndex(
      (p) => p.id === projectData.id
    )

    if (existingIndex >= 0) {
      // 기존 프로젝트 업데이트
      global.projectsStorage![existingIndex] = {
        ...projectData,
        updatedAt: new Date(),
      }
    } else {
      // 새 프로젝트 추가
      global.projectsStorage!.push({
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    console.log(`프로젝트 "${projectData.name}" 저장됨 (ID: ${projectData.id})`)

    return NextResponse.json({
      success: true,
      message: '프로젝트가 성공적으로 저장되었습니다.',
      project: projectData,
    })
  } catch (error) {
    console.error('프로젝트 저장 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 저장된 프로젝트 목록 조회
export async function GET() {
  try {
    if (!global.projectsStorage) {
      global.projectsStorage = []
    }

    const projectList = global.projectsStorage
      .map((project) => ({
        id: project.id,
        name: project.name,
        lastModified: project.updatedAt,
        size: JSON.stringify(project).length,
        clipCount: project.clips.length,
      }))
      .sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
      )

    return NextResponse.json({
      success: true,
      projects: projectList,
    })
  } catch (error) {
    console.error('프로젝트 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
