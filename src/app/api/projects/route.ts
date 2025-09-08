/**
 * API Routes for project management
 * POST /api/projects - Create new project
 * GET /api/projects - List all projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { ProjectData } from '@/app/(route)/editor/types/project'

// In-memory storage for now (replace with database later)
const projects = new Map<string, ProjectData>()

/**
 * POST /api/projects
 * Create a new project or update existing one
 */
export async function POST(request: NextRequest) {
  try {
    const project: ProjectData = await request.json()

    // Validate project data
    if (!project.id || !project.name) {
      return NextResponse.json(
        { error: 'Invalid project data' },
        { status: 400 }
      )
    }

    // Store project (in-memory for now)
    projects.set(project.id, {
      ...project,
      serverSyncedAt: new Date(),
      syncStatus: 'synced',
    })

    console.log(`[API] Project saved: ${project.name} (${project.id})`)

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        serverSyncedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[API] Failed to save project:', error)
    return NextResponse.json(
      { error: 'Failed to save project' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/projects
 * List all projects
 */
export async function GET() {
  try {
    const projectList = Array.from(projects.values()).map((project) => ({
      id: project.id,
      name: project.name,
      lastModified: project.updatedAt,
      serverSyncedAt: project.serverSyncedAt,
      syncStatus: project.syncStatus,
    }))

    return NextResponse.json({
      projects: projectList,
    })
  } catch (error) {
    console.error('[API] Failed to list projects:', error)
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    )
  }
}
