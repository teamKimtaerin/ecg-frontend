'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { mediaStorage } from '@/utils/storage/mediaStorage'
import { projectInfoManager } from '@/utils/managers/ProjectInfoManager'
import { log } from '@/utils/logger'

export interface TranscriptionData {
  files?: FileList
  url?: string
  language: string
  useDictionary: boolean
  autoSubmit: boolean
  method: 'file' | 'link'
}

export const useUploadModal = () => {
  const router = useRouter()
  const [isTranscriptionLoading, setIsTranscriptionLoading] = useState(false)

  const handleFileSelect = (files: FileList) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'Selected files:',
        Array.from(files).map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        }))
      )
    }
    // Files are now stored in the modal state, modal stays open
  }

  const handleStartTranscription = async (
    data: TranscriptionData,
    onSuccess?: () => void,
    redirectToEditor = true
  ) => {
    const handleTranscriptionResponse = async (response: Response) => {
      if (response.ok) {
        const result = await response.json()
        if (process.env.NODE_ENV === 'development') {
          console.log('Transcription started successfully: ', result)
        }
        onSuccess?.()
        if (redirectToEditor) {
          router.push('/editor')
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    }

    try {
      setIsTranscriptionLoading(true)
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting transcription with data:', data)
      }

      let response: Response
      let projectId: string | null = null
      let mediaId: string | null = null

      if (data.method === 'file' && data.files) {
        // Generate project ID
        projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Save video to IndexedDB
        const file = data.files[0] // Use first file for now
        log('useUploadModal.ts', `Saving video to IndexedDB: ${file.name}`)

        try {
          // Extract video metadata
          const metadata = await projectInfoManager.extractVideoMetadata(file)

          // Parse duration from string to number for MediaFile
          const durationNum = metadata.duration
            ? parseFloat(metadata.duration.replace(/[^0-9.]/g, ''))
            : undefined

          // Save to IndexedDB
          mediaId = await mediaStorage.saveMedia(projectId, file, {
            duration: durationNum,
            videoSize: metadata.videoSize,
          })

          // Save project media info
          await mediaStorage.saveProjectMedia({
            projectId,
            mediaId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            duration: metadata.duration
              ? parseFloat(metadata.duration.replace(/[^0-9.]/g, ''))
              : undefined,
            metadata: {
              videoSize: metadata.videoSize,
            },
          })

          log('useUploadModal.ts', `Video saved with mediaId: ${mediaId}`)
        } catch (error) {
          console.error('Failed to save video to IndexedDB:', error)
        }

        // Create FormData for file upload
        const formData = new FormData()

        // Add files to FormData
        Array.from(data.files).forEach((file, index) => {
          formData.append(`file_${index}`, file)
        })

        // Add configuration
        formData.append('language', data.language)
        formData.append('useDictionary', data.useDictionary.toString())
        formData.append('autoSubmit', data.autoSubmit.toString())
        formData.append('method', data.method)

        // API endpoint for file upload transcription
        response = await fetch('/api/transcription/upload', {
          method: 'POST',
          body: formData,
        })
      } else if (data.method === 'link' && data.url) {
        // Send URL data as JSON
        response = await fetch('/api/transcription/url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: data.url,
            language: data.language,
            useDictionary: data.useDictionary,
            autoSubmit: data.autoSubmit,
            method: data.method,
          }),
        })
      } else {
        return
      }

      // Store project ID in sessionStorage for editor page
      if (projectId) {
        sessionStorage.setItem('currentProjectId', projectId)
        if (mediaId) {
          sessionStorage.setItem('currentMediaId', mediaId)
        }
        log(
          'useUploadModal.ts',
          `Stored projectId: ${projectId}, mediaId: ${mediaId} in sessionStorage`
        )
      }

      await handleTranscriptionResponse(response)
    } catch (error) {
      console.error('Error starting transcription:', error)
      alert('Failed to start transcription. Please try again.')
    } finally {
      setIsTranscriptionLoading(false)
    }
  }

  return {
    isTranscriptionLoading,
    handleFileSelect,
    handleStartTranscription,
  }
}
