'use client'

import { useEffect } from 'react'
import { useProgressStore } from '@/lib/store/progressStore'

// Common interfaces for components
export interface ExportTask {
  id: number
  filename: string
  progress: number
  status: 'processing' | 'completed' | 'failed'
  completedAt?: string
  currentStage?: string
  estimatedTimeRemaining?: number
  isTimeout?: boolean
}

export interface UploadTask {
  id: number
  filename: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  completedAt?: string
  currentStage?: string
  estimatedTimeRemaining?: number
  isTimeout?: boolean
}

/**
 * Hook that provides formatted progress tasks for UI components
 * Transforms the global progress store data into component-friendly formats
 */
export const useProgressTasks = () => {
  const {
    getActiveUploadTasks,
    getActiveExportTasks,
    getCompletedTasks,
    getAllActiveTasks,
    expireOldTasks,
    clearCompletedTasksByType
  } = useProgressStore()

  // Set up automatic timeout checking every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      expireOldTasks()
    }, 30000) // 30초마다 체크

    return () => clearInterval(interval)
  }, [expireOldTasks])

  // Get raw data from store
  const activeUploadTasks = getActiveUploadTasks()
  const activeExportTasks = getActiveExportTasks()
  const completedTasks = getCompletedTasks()
  const allActiveTasks = getAllActiveTasks()

  // Transform for Export Tasks (includes both processing exports and completed exports)
  const exportTasks: ExportTask[] = [
    // Active export tasks (currently processing)
    ...activeExportTasks
      .filter(task => task.type === 'export')
      .map(task => ({
        id: task.id,
        filename: task.filename,
        progress: task.progress,
        status: 'processing' as const,
        completedAt: task.completedAt,
        currentStage: task.currentStage,
        estimatedTimeRemaining: task.estimatedTimeRemaining,
      })),
    // Completed export tasks
    ...completedTasks
      .filter(task => task.type === 'export' && (task.status === 'completed' || task.status === 'failed'))
      .map(task => ({
        id: task.id,
        filename: task.filename,
        progress: task.progress,
        status: task.status as 'completed' | 'failed',
        completedAt: task.completedAt,
        currentStage: task.currentStage,
        estimatedTimeRemaining: task.estimatedTimeRemaining,
        isTimeout: task.isTimeout,
      }))
  ]

  // Transform for Upload Tasks (includes uploading, processing, completed, and failed)
  const uploadTasks: UploadTask[] = [
    // Active upload tasks (uploading or processing)
    ...activeUploadTasks
      .filter(task => task.type === 'upload')
      .map(task => ({
        id: task.id,
        filename: task.filename,
        progress: task.progress,
        status: task.status as 'uploading' | 'processing',
        completedAt: task.completedAt,
        currentStage: task.currentStage,
        estimatedTimeRemaining: task.estimatedTimeRemaining,
        isTimeout: task.isTimeout,
      })),
    // Completed and failed upload tasks
    ...completedTasks
      .filter(task => task.type === 'upload')
      .map(task => ({
        id: task.id,
        filename: task.filename,
        progress: task.progress,
        status: task.status as 'completed' | 'failed',
        completedAt: task.completedAt,
        currentStage: task.currentStage,
        estimatedTimeRemaining: task.estimatedTimeRemaining,
        isTimeout: task.isTimeout,
      }))
  ]

  // Helper functions for common queries
  const getActiveExportTasksCount = () =>
    exportTasks.filter(task => task.status === 'processing').length

  const getActiveUploadTasksCount = () =>
    uploadTasks.filter(task => task.status === 'uploading' || task.status === 'processing').length

  const getCompletedExportTasksCount = () =>
    exportTasks.filter(task => task.status === 'completed').length

  const getCompletedUploadTasksCount = () =>
    uploadTasks.filter(task => task.status === 'completed').length

  const getTotalActiveTasksCount = () =>
    allActiveTasks.length

  const hasAnyActiveTasks = () =>
    allActiveTasks.length > 0

  const hasActiveUploads = () =>
    getActiveUploadTasksCount() > 0

  const hasActiveExports = () =>
    getActiveExportTasksCount() > 0

  return {
    // Formatted tasks for UI
    exportTasks,
    uploadTasks,

    // Raw data access if needed
    raw: {
      activeUploadTasks,
      activeExportTasks,
      completedTasks,
      allActiveTasks,
    },

    // Helper functions
    counts: {
      activeExports: getActiveExportTasksCount(),
      activeUploads: getActiveUploadTasksCount(),
      completedExports: getCompletedExportTasksCount(),
      completedUploads: getCompletedUploadTasksCount(),
      totalActive: getTotalActiveTasksCount(),
    },

    // Boolean helpers
    hasAnyActiveTasks: hasAnyActiveTasks(),
    hasActiveUploads: hasActiveUploads(),
    hasActiveExports: hasActiveExports(),

    // Utility functions
    expireOldTasks,
    clearCompletedTasksByType,
  }
}