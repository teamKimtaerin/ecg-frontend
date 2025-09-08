/**
 * API Routes for specific project operations
 * GET /api/projects/[id] - Get project by ID
 * PUT /api/projects/[id] - Update project
 * DELETE /api/projects/[id] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server'
import { ProjectData } from '@/app/(route)/editor/types/project'

// In-memory storage (shared with main route.ts)
// In production, this would be a database
const projects = new Map<string, ProjectData>()

/**
 * GET /api/projects/[id]
 * Get a specific project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = projects.get(id)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error(`[API] Failed to get project:`, error)
    return NextResponse.json(
      { error: 'Failed to get project' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/projects/[id]
 * Update an existing project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectData: ProjectData = await request.json()

    // Validate that IDs match
    if (projectData.id !== id) {
      return NextResponse.json(
        { error: 'Project ID mismatch' },
        { status: 400 }
      )
    }

    // Check if project exists
    const existingProject = projects.get(id)

    // Update project
    const updatedProject = {
      ...projectData,
      serverSyncedAt: new Date(),
      syncStatus: 'synced' as const,
      changeCount: 0,
    }

    projects.set(id, updatedProject)

    console.log(`[API] Project updated: ${projectData.name} (${id})`)

    return NextResponse.json({
      success: true,
      project: {
        id: id,
        name: projectData.name,
        serverSyncedAt: updatedProject.serverSyncedAt,
      },
      isNew: !existingProject,
    })
  } catch (error) {
    console.error(`[API] Failed to update project:`, error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = projects.delete(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log(`[API] Project deleted: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error(`[API] Failed to delete project:`, error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
