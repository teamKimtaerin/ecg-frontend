'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

      if (data.method === 'file' && data.files) {
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
