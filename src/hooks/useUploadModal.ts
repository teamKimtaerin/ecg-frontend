'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadService } from '@/services/api/uploadService'
import { useEditorStore } from '@/app/(route)/editor/store'
import {
  UploadFormData,
  UploadStep,
  ProcessingStatus,
  ProcessingResult,
  SegmentData,
} from '@/services/api/types/upload.types'
import { ClipItem, Word } from '@/app/(route)/editor/types'
import { ProjectData } from '@/app/(route)/editor/types/project'
import { projectStorage } from '@/utils/storage/projectStorage'
import { log } from '@/utils/logger'

export interface UploadModalState {
  isOpen: boolean
  step: UploadStep
  uploadProgress: number
  processingProgress: number
  currentStage?: string
  estimatedTimeRemaining?: number
  fileName?: string
  videoUrl?: string // S3 업로드된 비디오 URL 저장
  error?: string
}

export const useUploadModal = () => {
  const router = useRouter()
  const { setMediaInfo, setClips, clearMedia, setCurrentProject } =
    useEditorStore()

  const [state, setState] = useState<UploadModalState>({
    isOpen: false,
    step: 'select',
    uploadProgress: 0,
    processingProgress: 0,
  })

  const [currentJobId, setCurrentJobId] = useState<string>()
  const stopPollingRef = useRef<(() => void) | null>(null)

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updates: Partial<UploadModalState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  // 모달 열기
  const openModal = useCallback(() => {
    updateState({ isOpen: true, step: 'select' })
  }, [updateState])

  // 모달 닫기
  const closeModal = useCallback(() => {
    // 진행 중인 폴링 중단
    if (stopPollingRef.current) {
      stopPollingRef.current()
      stopPollingRef.current = null
    }

    updateState({
      isOpen: false,
      step: 'select',
      uploadProgress: 0,
      processingProgress: 0,
      currentStage: undefined,
      estimatedTimeRemaining: undefined,
      fileName: undefined,
      error: undefined,
    })
    setCurrentJobId(undefined)
  }, [updateState])

  // 파일 선택 처리
  const handleFileSelect = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        updateState({ fileName: files[0].name })
      }
    },
    [updateState]
  )

  // 메인 업로드 및 처리 플로우
  const handleStartTranscription = useCallback(
    async (data: UploadFormData) => {
      try {
        log('useUploadModal', '🚀 Starting upload and transcription process')

        // 기존 데이터 초기화
        clearMedia() // 이전 영상 정보 제거
        setClips([]) // 이전 클립 제거

        // localStorage에서 이전 프로젝트 완전 제거
        projectStorage.clearCurrentProject()

        // sessionStorage 초기화 (이전 프로젝트 정보 제거)
        sessionStorage.removeItem('currentProjectId')
        sessionStorage.removeItem('currentMediaId')
        sessionStorage.removeItem('lastUploadProjectId')

        // 🔥 핵심 변경: 즉시 로컬 Blob URL 생성하여 비디오 플레이어에서 사용
        const blobUrl = URL.createObjectURL(data.file)
        log(
          'useUploadModal',
          `🎬 Created local Blob URL for immediate playback: ${blobUrl}`
        )

        // 즉시 비디오 플레이어 업데이트 - 업로드 전에 바로 재생 가능!
        setMediaInfo({
          videoUrl: blobUrl, // S3 대신 로컬 Blob URL 사용
          videoName: data.file.name,
          videoType: data.file.type,
          videoDuration: 0, // Duration은 비디오 로드 후 자동 설정
        })

        // State에도 Blob URL 저장 (S3 업로드 중에도 계속 사용)
        updateState({
          step: 'uploading',
          uploadProgress: 0,
          error: undefined,
          videoUrl: blobUrl, // 로컬 Blob URL 저장
          fileName: data.file.name,
        })

        // 1. Presigned URL 요청 (백그라운드 처리)
        log('useUploadModal', '📝 Requesting presigned URL')
        const presignedResponse = await uploadService.getPresignedUrl(
          data.file.name,
          data.file.type
        )

        if (!presignedResponse.success || !presignedResponse.data) {
          throw new Error(
            presignedResponse.error?.message || 'Presigned URL 요청 실패'
          )
        }

        const { presigned_url, file_key } = presignedResponse.data

        // 2. S3 업로드 (진행률 추적) - 백그라운드로 진행
        log('useUploadModal', '⬆️ Starting S3 upload')
        const uploadResponse = await uploadService.uploadToS3(
          data.file,
          presigned_url,
          (progress) => updateState({ uploadProgress: progress })
        )

        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error(uploadResponse.error?.message || 'S3 업로드 실패')
        }

        const s3Url = uploadResponse.data
        log('useUploadModal', `✅ S3 upload completed: ${s3Url}`)

        // S3 URL은 서버 처리용으로 별도 저장 (하지만 플레이어는 계속 Blob URL 사용)
        // state의 videoUrl은 이미 blobUrl로 설정되어 있으므로 유지
        log(
          'useUploadModal',
          `💾 S3 URL saved for server processing: ${s3Url}, but keeping Blob URL for playback`
        )

        // 4. ML 처리 요청
        updateState({ step: 'processing', processingProgress: 0 })
        log('useUploadModal', '🤖 Requesting ML processing')

        const mlResponse = await uploadService.requestMLProcessing(
          file_key,
          data.language
        )

        if (!mlResponse.success || !mlResponse.data) {
          throw new Error(mlResponse.error?.message || 'ML 처리 요청 실패')
        }

        const { job_id, estimated_time } = mlResponse.data
        setCurrentJobId(job_id)
        updateState({ estimatedTimeRemaining: estimated_time || 180 })

        log('useUploadModal', `🔄 Starting polling for job: ${job_id}`)

        // 5. 상태 폴링 시작
        const stopPolling = uploadService.startPolling(
          job_id,
          (status: ProcessingStatus) => {
            log(
              'useUploadModal',
              `📊 Status update: ${status.status} (${status.progress}%)`
            )
            updateState({
              processingProgress: status.progress,
              currentStage: status.current_stage,
              estimatedTimeRemaining: status.estimated_time_remaining,
            })
          },
          (result: ProcessingResult) => {
            log('useUploadModal', '🎉 Processing completed successfully')
            handleProcessingComplete(result)
          },
          (error) => {
            const errorMessage =
              error?.message || error?.error || 'Unknown error'
            log('useUploadModal', `❌ Processing failed: ${errorMessage}`)

            // 422 에러이고 이미 처리 완료된 경우 무시하고 완료 처리
            if (
              error?.error === 'RESULT_FETCH_ERROR' &&
              state.processingProgress === 100
            ) {
              log(
                'useUploadModal',
                '⚠️ Ignoring 422 error after completion - proceeding to editor'
              )
              updateState({ step: 'completed' })
              setTimeout(() => {
                goToEditor()
              }, 1000)
              return
            }

            updateState({
              step: 'failed',
              error: errorMessage,
            })
          }
        )

        stopPollingRef.current = stopPolling
      } catch (error) {
        log('useUploadModal', `💥 Upload process failed: ${error}`)
        updateState({
          step: 'failed',
          error:
            error instanceof Error
              ? error.message
              : '업로드 중 오류가 발생했습니다.',
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateState, setMediaInfo, clearMedia, setClips]
  )

  // 처리 완료 핸들러
  const handleProcessingComplete = useCallback(
    (result: ProcessingResult) => {
      try {
        log('useUploadModal', '🔄 Converting segments to clips')

        // 새 프로젝트 생성 (이전 프로젝트 대체)
        const projectId = `project-${Date.now()}`
        const projectName = state.fileName
          ? state.fileName.replace(/\.[^/.]+$/, '') // 확장자 제거
          : '새 프로젝트'

        // 결과가 없거나 세그먼트가 없으면 빈 클립으로 처리
        if (
          !result ||
          !result.result?.segments ||
          result.result.segments.length === 0
        ) {
          log(
            'useUploadModal',
            '⚠️ No segments found, creating empty clips list'
          )
          setClips([])

          // 메타데이터는 기본값으로 설정
          setMediaInfo({
            videoDuration: result?.result?.metadata?.duration || 0,
          })

          // 빈 프로젝트도 생성 및 저장
          const emptyProject: ProjectData = {
            id: projectId,
            name: projectName,
            clips: [],
            settings: {
              autoSaveEnabled: true,
              autoSaveInterval: 30,
              defaultSpeaker: '화자1',
              exportFormat: 'srt',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            videoDuration: result?.result?.metadata?.duration || 0,
          }

          setCurrentProject(emptyProject)

          // sessionStorage 업데이트 (새로고침 시 이 프로젝트를 로드하도록)
          sessionStorage.setItem('currentProjectId', projectId)
          sessionStorage.setItem('lastUploadProjectId', projectId)

          log('useUploadModal', `💾 Created empty project: ${projectId}`)

          updateState({ step: 'completed' })

          // 1초 후 에디터로 이동 (빈 프로젝트)
          setTimeout(() => {
            goToEditor()
          }, 1000)
          return
        }

        // 정상적인 결과 처리
        // 세그먼트를 클립으로 변환
        const clips = convertSegmentsToClips(result.result.segments)

        // duration 계산 (metadata에 없으면 segments에서 계산)
        let videoDuration = result.result.metadata?.duration
        if (!videoDuration && result.result.segments?.length > 0) {
          // segments의 마지막 end 시간을 duration으로 사용
          const lastSegment =
            result.result.segments[result.result.segments.length - 1]
          videoDuration = lastSegment.end || 0

          // 모든 세그먼트의 타이밍이 0이면 세그먼트 개수 기반으로 추정
          if (videoDuration === 0) {
            videoDuration = result.result.segments.length * 1.0 // 각 세그먼트당 1초
            log(
              'useUploadModal',
              `⚠️ All timings are 0, estimated duration: ${videoDuration}s based on ${result.result.segments.length} segments`
            )
          } else {
            log(
              'useUploadModal',
              `⚠️ Using last segment end as duration: ${videoDuration}`
            )
          }
        }

        // 메타데이터 업데이트 (Blob URL 유지!)
        setMediaInfo({
          videoDuration: videoDuration || 0,
          videoUrl: state.videoUrl, // 이미 Blob URL이 저장되어 있음
          videoName: state.fileName,
        })
        setClips(clips)

        // 프로젝트 생성 및 저장 (Blob URL 포함)
        const newProject: ProjectData = {
          id: projectId,
          name: projectName,
          clips: clips,
          settings: {
            autoSaveEnabled: true,
            autoSaveInterval: 30,
            defaultSpeaker: '화자1',
            exportFormat: 'srt',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          videoDuration: videoDuration || 0,
          videoUrl: state.videoUrl, // Blob URL 저장 (로컬에서 즉시 재생 가능)
          videoName: state.fileName,
        }

        // 프로젝트를 localStorage에 저장
        projectStorage.saveProject(newProject).catch((error) => {
          log('useUploadModal', `⚠️ Failed to save project: ${error}`)
        })
        projectStorage.saveCurrentProject(newProject) // 현재 프로젝트로 설정

        setCurrentProject(newProject)

        // sessionStorage 업데이트 (새로고침 시 이 프로젝트를 로드하도록)
        sessionStorage.setItem('currentProjectId', projectId)
        sessionStorage.setItem('lastUploadProjectId', projectId)

        log(
          'useUploadModal',
          `💾 Created project: ${projectId} with ${clips.length} clips`
        )

        updateState({ step: 'completed' })

        // 3초 후 자동으로 에디터로 이동
        setTimeout(() => {
          goToEditor()
        }, 3000)
      } catch (error) {
        log('useUploadModal', `❌ Failed to process result: ${error}`)
        log('useUploadModal', '⚠️ Proceeding to editor despite error')

        // 에러가 발생해도 완료 처리하고 에디터로 이동
        updateState({ step: 'completed' })
        setTimeout(() => {
          goToEditor()
        }, 1000)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setMediaInfo, setClips, setCurrentProject, updateState, state.fileName]
  )

  // 세그먼트 → 클립 변환 함수
  const convertSegmentsToClips = useCallback(
    (segments: SegmentData[]): ClipItem[] => {
      // 모든 세그먼트의 타이밍이 0인지 확인
      const allTimingsZero = segments.every(
        (seg) => (!seg.start || seg.start === 0) && (!seg.end || seg.end === 0)
      )

      return segments.map((segment, index) => {
        // segment.id가 없으면 index 사용
        const segmentId = segment.id || index

        // speaker 처리: 객체인 경우 speaker_id 추출
        let speakerValue = 'Unknown'
        if (segment.speaker) {
          if (
            typeof segment.speaker === 'object' &&
            'speaker_id' in segment.speaker
          ) {
            speakerValue = segment.speaker.speaker_id || 'Unknown'
          } else if (typeof segment.speaker === 'string') {
            speakerValue = segment.speaker
          }
        }

        // 세그먼트 타이밍 계산 (ML이 0을 반환한 경우 자동 생성)
        let segmentStart = segment.start || 0
        let segmentEnd = segment.end || 0

        // 타이밍 유효성 검증만 수행 (1초 단위 생성 제거)
        if (!isFinite(segmentStart) || segmentStart < 0) {
          segmentStart = 0
        }
        if (!isFinite(segmentEnd) || segmentEnd < 0) {
          segmentEnd = 0
        }

        // start와 end가 같거나 잘못된 경우에만 최소값 보장
        if (segmentEnd <= segmentStart) {
          // 최소 0.001초 차이만 보장 (MotionText 검증 통과용)
          segmentEnd = segmentStart + 0.001
        }

        // 단어 데이터 변환 (타이밍 검증 포함)
        const words: Word[] =
          segment.words?.map((word, wordIndex) => {
            // 타이밍 검증 및 수정
            let wordStart = word.start || 0
            let wordEnd = word.end || 0

            // 유효성 검증
            if (!isFinite(wordStart) || wordStart < 0) {
              wordStart = 0
            }
            if (!isFinite(wordEnd) || wordEnd < 0) {
              wordEnd = 0
            }

            // end가 start보다 작거나 같으면 최소값 보장
            if (wordEnd <= wordStart) {
              wordEnd = wordStart + 0.001
            }

            return {
              id: `word-${segmentId}-${wordIndex}`,
              text: word.word,
              start: wordStart,
              end: wordEnd,
              isEditable: true,
              confidence: word.confidence,
            }
          }) || []

        // 단어가 없으면 전체 텍스트를 하나의 단어로 처리
        if (words.length === 0 && segment.text) {
          words.push({
            id: `word-${segmentId}-0`,
            text: segment.text,
            start: segmentStart,
            end: segmentEnd,
            isEditable: true,
            confidence: segment.confidence,
          })
        }

        return {
          id: `clip-${segmentId}`,
          timeline: `${formatTime(segmentStart)} - ${formatTime(segmentEnd)}`,
          speaker: speakerValue,
          subtitle: segment.text,
          fullText: segment.text,
          duration: formatDuration(segmentEnd - segmentStart),
          thumbnail: '', // 썸네일은 추후 구현
          words,
        }
      })
    },
    []
  )

  // 시간 포맷팅 헬퍼
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  // 에디터로 이동
  const goToEditor = useCallback(() => {
    log('useUploadModal', '🚀 Navigating to editor')
    closeModal()
    router.push('/editor')
  }, [closeModal, router])

  // 처리 취소
  const cancelProcessing = useCallback(async () => {
    if (currentJobId) {
      log('useUploadModal', `🛑 Cancelling job: ${currentJobId}`)
      await uploadService.cancelProcessing(currentJobId)
    }

    if (stopPollingRef.current) {
      stopPollingRef.current()
      stopPollingRef.current = null
    }

    closeModal()
  }, [currentJobId, closeModal])

  // 재시도
  const retryUpload = useCallback(() => {
    updateState({
      step: 'select',
      uploadProgress: 0,
      processingProgress: 0,
      error: undefined,
    })
  }, [updateState])

  return {
    // 상태
    isTranscriptionLoading:
      state.step === 'uploading' || state.step === 'processing',
    ...state,

    // 액션
    openModal,
    closeModal,
    handleFileSelect,
    handleStartTranscription,
    goToEditor,
    cancelProcessing,
    retryUpload,
  }
}
