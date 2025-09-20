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
import API_CONFIG from '@/config/api.config'
import { useProgressStore } from '@/lib/store/progressStore'

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

  // Progress store integration
  const { addTask, updateTask, removeTask } = useProgressStore()

  const [state, setState] = useState<UploadModalState>({
    isOpen: false,
    step: 'select',
    uploadProgress: 0,
    processingProgress: 0,
  })

  const [currentJobId, setCurrentJobId] = useState<string>()
  const [currentProgressTaskId, setCurrentProgressTaskId] = useState<number>()
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

    // Progress store task 제거 (진행 중인 경우만)
    if (currentProgressTaskId) {
      removeTask(currentProgressTaskId)
      setCurrentProgressTaskId(undefined)
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
  }, [updateState, currentProgressTaskId, removeTask])

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
        console.log('[VIDEO DEBUG] File info:', {
          name: data.file.name,
          type: data.file.type,
          size: data.file.size,
          blobUrl: blobUrl,
        })

        // 즉시 비디오 플레이어 업데이트 - 업로드 전에 바로 재생 가능!
        setMediaInfo({
          videoUrl: blobUrl, // S3 대신 로컬 Blob URL 사용
          videoName: data.file.name,
          videoType: data.file.type,
          videoDuration: 0, // Duration은 비디오 로드 후 자동 설정
        })
        console.log('[VIDEO DEBUG] Media info set:', {
          videoUrl: blobUrl,
          videoName: data.file.name,
          videoType: data.file.type,
        })

        // State에도 Blob URL 저장 (S3 업로드 중에도 계속 사용)
        updateState({
          step: 'uploading',
          uploadProgress: 0,
          error: undefined,
          videoUrl: blobUrl, // 로컬 Blob URL 저장
          fileName: data.file.name,
        })

        // Progress store에 업로드 작업 추가
        const progressTaskId = addTask({
          filename: data.file.name,
          progress: 0,
          status: 'uploading',
          type: 'upload',
        })
        setCurrentProgressTaskId(progressTaskId)

        // 백업용으로 sessionStorage에도 저장
        sessionStorage.setItem('currentVideoUrl', blobUrl)
        console.log('[VIDEO DEBUG] Saved videoUrl to sessionStorage:', blobUrl)

        // MOCK DATA MODE: 서버 업로드/처리 플로우를 생략하고 로컬 friends_result.json 사용
        if (API_CONFIG.USE_MOCK_DATA) {
          log(
            'useUploadModal',
            '🐞 USE_MOCK_DATA enabled: using local friends_result.json'
          )
          // 간단한 진행률 시뮬레이션 + 상태 업데이트
          updateState({ step: 'processing', processingProgress: 0 })

          // Progress store 업데이트
          if (progressTaskId) {
            updateTask(progressTaskId, {
              status: 'processing',
              progress: 0,
              currentStage: 'Mock: 시작',
            })
          }

          try {
            // 약간의 딜레이로 진행률 업데이트
            await new Promise((r) => setTimeout(r, 300))
            updateState({
              processingProgress: 25,
              currentStage: 'Mock: 초기화',
            })
            if (progressTaskId) {
              updateTask(progressTaskId, {
                progress: 25,
                currentStage: 'Mock: 초기화',
              })
            }

            await new Promise((r) => setTimeout(r, 400))
            updateState({
              processingProgress: 50,
              currentStage: 'Mock: 음성 세그먼트 추출',
            })
            if (progressTaskId) {
              updateTask(progressTaskId, {
                progress: 50,
                currentStage: 'Mock: 음성 세그먼트 추출',
              })
            }

            await new Promise((r) => setTimeout(r, 500))
            updateState({
              processingProgress: 75,
              currentStage: 'Mock: 자막 생성',
            })
            if (progressTaskId) {
              updateTask(progressTaskId, {
                progress: 75,
                currentStage: 'Mock: 자막 생성',
              })
            }

            // friends_result.json 로드
            const res = await fetch(API_CONFIG.MOCK_TRANSCRIPTION_PATH)
            if (!res.ok) {
              throw new Error(
                `Failed to fetch mock file: ${res.status} ${res.statusText}`
              )
            }
            const json = await res.json()

            // friends_result.json -> SegmentData[] 매핑
            interface MockSegment {
              id?: number
              start_time?: number
              start?: number
              end_time?: number
              end?: number
              text?: string
              speaker_id?: string
              speaker?: string | { speaker_id: string }
              confidence?: number
              words?: MockWord[]
            }

            interface MockWord {
              word?: string
              start_time?: number
              start?: number
              end_time?: number
              end?: number
              confidence?: number
            }

            const segments = (json.segments || []).map(
              (seg: MockSegment, idx: number) => {
                const words = (seg.words || []).map((w: MockWord) => ({
                  word: String(w.word ?? ''),
                  start: Number(w.start_time ?? w.start ?? 0),
                  end: Number(w.end_time ?? w.end ?? 0),
                  confidence: Number(w.confidence ?? 0.9),
                }))

                return {
                  id: seg.id ?? idx,
                  start: Number(seg.start_time ?? seg.start ?? 0),
                  end: Number(seg.end_time ?? seg.end ?? 0),
                  text: String(seg.text ?? ''),
                  speaker:
                    seg.speaker_id != null
                      ? String(seg.speaker_id)
                      : seg.speaker && typeof seg.speaker === 'object'
                        ? seg.speaker
                        : String(seg.speaker ?? 'Unknown'),
                  confidence: Number(seg.confidence ?? 0.9),
                  words,
                } as SegmentData
              }
            ) as SegmentData[]

            // ProcessingResult 형태로 포장해서 기존 완료 핸들러 재사용
            const mockResult: ProcessingResult = {
              job_id: 'debug_job_local',
              status: 'completed',
              result: {
                segments,
                metadata: {
                  duration: Number(json?.metadata?.duration ?? 0),
                  language: String(json?.metadata?.language ?? 'en'),
                  model: String(json?.metadata?.unified_model ?? 'mock'),
                  processing_time: Number(json?.metadata?.processing_time ?? 0),
                },
              },
            }

            updateState({ processingProgress: 100, currentStage: '완료' })
            if (progressTaskId) {
              updateTask(progressTaskId, {
                progress: 100,
                currentStage: '완료',
                status: 'completed',
              })
            }
            handleProcessingComplete(mockResult)
            return // ⛔️ 실제 업로드/ML 처리로 진행하지 않음
          } catch (e) {
            log('useUploadModal', `💥 DEBUG mock flow failed: ${e}`)
            if (progressTaskId) {
              updateTask(progressTaskId, {
                status: 'failed',
              })
            }
            updateState({
              step: 'failed',
              error:
                e instanceof Error
                  ? e.message
                  : 'Mock 데이터 로드 중 오류가 발생했습니다.',
            })
            return
          }
        }

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
          (progress) => {
            updateState({ uploadProgress: progress })
            if (progressTaskId) {
              updateTask(progressTaskId, { progress })
            }
          }
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
        if (progressTaskId) {
          updateTask(progressTaskId, {
            status: 'processing',
            progress: 0,
            currentStage: 'ML 처리 시작',
          })
        }
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
        console.log('[useUploadModal] About to start polling for job:', job_id)

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
            // Progress store 업데이트
            if (progressTaskId) {
              updateTask(progressTaskId, {
                progress: status.progress,
                currentStage: status.current_stage,
                estimatedTimeRemaining: status.estimated_time_remaining,
              })
            }
          },
          (result: ProcessingResult) => {
            log('useUploadModal', '🎉 Processing completed successfully')
            if (progressTaskId) {
              updateTask(progressTaskId, {
                status: 'completed',
                progress: 100,
              })
            }
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
              if (progressTaskId) {
                updateTask(progressTaskId, {
                  status: 'completed',
                  progress: 100,
                })
              }
              updateState({ step: 'completed' })
              setTimeout(() => {
                goToEditor()
              }, 1000)
              return
            }

            if (progressTaskId) {
              updateTask(progressTaskId, {
                status: 'failed',
              })
            }
            updateState({
              step: 'failed',
              error: errorMessage,
            })
          }
        )

        console.log(
          '[useUploadModal] Polling started, stopPolling function:',
          stopPolling
        )
        stopPollingRef.current = stopPolling
      } catch (error) {
        log('useUploadModal', `💥 Upload process failed: ${error}`)
        if (currentProgressTaskId) {
          updateTask(currentProgressTaskId, {
            status: 'failed',
          })
        }
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
    [updateState, setMediaInfo, clearMedia, setClips, state]
  )

  // 처리 완료 핸들러
  const handleProcessingComplete = useCallback(
    (result: ProcessingResult) => {
      try {
        log('useUploadModal', '🔄 Converting segments to clips')

        // 🔥 중요: videoUrl 안정적 해결
        const resolvedVideoUrl =
          state.videoUrl ||
          useEditorStore.getState().videoUrl ||
          sessionStorage.getItem('currentVideoUrl') ||
          undefined

        console.log(
          '[VIDEO DEBUG] handleProcessingComplete - state.videoUrl:',
          state.videoUrl
        )
        console.log(
          '[VIDEO DEBUG] handleProcessingComplete - store.videoUrl:',
          useEditorStore.getState().videoUrl
        )
        console.log(
          '[VIDEO DEBUG] handleProcessingComplete - sessionStorage.videoUrl:',
          sessionStorage.getItem('currentVideoUrl')
        )
        console.log(
          '[VIDEO DEBUG] handleProcessingComplete - resolved.videoUrl:',
          resolvedVideoUrl
        )
        console.log(
          '[VIDEO DEBUG] handleProcessingComplete - state.fileName:',
          state.fileName
        )

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

          // 메타데이터는 기본값으로 설정 (중요: videoUrl은 유지!)
          setMediaInfo({
            videoDuration: result?.result?.metadata?.duration || 0,
            videoUrl: resolvedVideoUrl, // ✅ 안정적으로 해결된 URL 사용!
            videoName: state.fileName,
            videoType: 'video/mp4',
          })

          // 빈 프로젝트도 생성 및 저장 (중요: videoUrl 포함!)
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
            videoUrl: resolvedVideoUrl, // ✅ 안정적으로 해결된 URL 저장!
            videoName: state.fileName,
          }

          setCurrentProject(emptyProject)

          // sessionStorage 업데이트 (새로고침 시 이 프로젝트를 로드하도록)
          sessionStorage.setItem('currentProjectId', projectId)
          sessionStorage.setItem('lastUploadProjectId', projectId)

          log('useUploadModal', `💾 Created empty project: ${projectId}`)

          // 조기 완료 처리 제거 - 실제 처리가 완료될 때까지 기다림
          // updateState({ step: 'completed' })
          // 조기 에디터 이동 제거 - 폴링이 완료될 때까지 기다림
          // setTimeout(() => {
          //   goToEditor()
          // }, 1000)
          // return 제거 - 아래 정상 처리로 진행
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

          videoUrl: resolvedVideoUrl, // ✅ 안정적으로 해결된 URL 사용!
          videoName: state.fileName,
          videoType: 'video/mp4', // 타입 명시
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
          videoUrl: resolvedVideoUrl, // ✅ 안정적으로 해결된 URL 저장!
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
    [
      setMediaInfo,
      setClips,
      setCurrentProject,
      updateState,
      state.fileName,
      state.videoUrl,
    ]
  )

  // 세그먼트 → 클립 변환 함수
  const convertSegmentsToClips = useCallback(
    (segments: SegmentData[]): ClipItem[] => {
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
          stickers: [],
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

    // Progress store에서 작업 제거
    if (currentProgressTaskId) {
      removeTask(currentProgressTaskId)
      setCurrentProgressTaskId(undefined)
    }

    closeModal()
  }, [currentJobId, currentProgressTaskId, removeTask, closeModal])

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
