import {
  RenderRequest,
  RenderJob,
  RenderStatus,
  CreateRenderResponse,
  StatusResponse,
  RenderHistory,
  BackendCreateRenderResponse,
  BackendStatusResponse,
  BackendCancelResponse,
  BackendErrorResponse,
  RenderErrorCode,
} from './types/render.types'
import { useAuthStore } from '@/lib/store/authStore'

const GPU_RENDER_API_BASE =
  process.env.NEXT_PUBLIC_GPU_RENDER_API_URL || '/api/render'

class RenderService {
  private abortControllers = new Map<string, AbortController>()

  /**
   * 인증 헤더 가져오기
   */
  private getAuthHeaders(): Record<string, string> {
    const token = useAuthStore.getState().token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * GPU 서버 렌더링 작업 생성
   */
  async createRenderJob(request: RenderRequest): Promise<CreateRenderResponse> {
    try {
      const response = await fetch(`${GPU_RENDER_API_BASE}/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          videoUrl: request.videoUrl,
          scenario: request.scenario,
          options: {
            width: 1920,
            height: 1080,
            fps: 30,
            quality: 90,
            format: 'mp4',
            ...request.options,
          },
        }),
      })

      if (!response.ok) {
        // 백엔드 에러 응답 처리
        const errorData: BackendErrorResponse = await response.json()
        const errorMessage =
          errorData.detail?.message || '렌더링 작업 생성 실패'
        const errorCode = errorData.detail?.code || 'UNKNOWN_ERROR'

        // 에러 타입에 따른 세부 처리
        if (response.status === 401 || response.status === 403) {
          throw new Error(`인증 오류: ${errorMessage}`)
        } else if (response.status === 429) {
          throw new Error(`rate:${errorMessage}`)
        } else if (errorCode.includes('QUOTA')) {
          throw new Error(`quota:${errorMessage}`)
        } else if (errorCode.includes('INVALID')) {
          throw new Error(`invalid:${errorMessage}`)
        } else if (errorCode.includes('GPU')) {
          throw new Error(`GPU:${errorMessage}`)
        }

        throw new Error(errorMessage)
      }

      // 백엔드 직접 응답 타입으로 받기
      const backendData: BackendCreateRenderResponse = await response.json()

      // 프론트엔드 타입으로 변환
      const renderJob: RenderJob = {
        jobId: backendData.jobId,
        estimatedTime: backendData.estimatedTime,
        createdAt: backendData.createdAt,
      }

      return {
        success: true,
        data: renderJob,
      }
    } catch (error) {
      console.error('Failed to create render job:', error)

      // 에러 코드 분류
      let errorCode = RenderErrorCode.CREATE_JOB_ERROR
      let errorMessage =
        error instanceof Error ? error.message : '렌더링 작업 생성 실패'

      if (error instanceof Error) {
        if (error.message.includes('GPU')) {
          errorCode = RenderErrorCode.GPU_SERVER_ERROR
        } else if (error.message.includes('timeout')) {
          errorCode = RenderErrorCode.TIMEOUT_ERROR
        } else if (error.message.includes('network')) {
          errorCode = RenderErrorCode.CONNECTION_ERROR
        } else if (
          error.message.includes('quota:') ||
          error.message.includes('할당량')
        ) {
          errorCode = RenderErrorCode.RENDER_QUOTA_DAILY_EXCEEDED
          errorMessage =
            error.message.replace('quota:', '') ||
            '일일 렌더링 할당량을 초과했습니다. 내일 다시 시도해주세요.'
        } else if (
          error.message.includes('rate:') ||
          error.message.includes('속도 제한')
        ) {
          errorCode = RenderErrorCode.RENDER_RATE_LIMIT_EXCEEDED
          errorMessage =
            error.message.replace('rate:', '') ||
            '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
        } else if (
          error.message.includes('invalid:') ||
          error.message.includes('잘못된')
        ) {
          errorCode = RenderErrorCode.RENDER_INVALID_INPUT
          errorMessage =
            error.message.replace('invalid:', '') ||
            '입력 데이터가 올바르지 않습니다. 비디오와 자막을 확인해주세요.'
        } else if (error.message.includes('인증 오류:')) {
          errorCode = RenderErrorCode.RENDER_AUTH_ERROR
          errorMessage =
            error.message || '인증에 실패했습니다. 다시 로그인해주세요.'
        }
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      }
    }
  }

  /**
   * 렌더링 작업 상태 확인
   */
  async getJobStatus(jobId: string): Promise<StatusResponse> {
    try {
      const controller = new AbortController()
      this.abortControllers.set(jobId, controller)

      const response = await fetch(`${GPU_RENDER_API_BASE}/${jobId}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('렌더링 작업을 찾을 수 없습니다')
        }
        const errorData: BackendErrorResponse = await response.json()
        const errorMessage = errorData.detail?.message || '상태 확인 실패'
        throw new Error(errorMessage)
      }

      // 백엔드 직접 응답 타입으로 받기
      const backendData: BackendStatusResponse = await response.json()

      // 프론트엔드 타입으로 변환
      const renderStatus: RenderStatus = {
        jobId: backendData.jobId,
        status: backendData.status,
        progress: backendData.progress,
        downloadUrl: backendData.downloadUrl,
        error: backendData.error,
        startedAt: backendData.startedAt,
        completedAt: backendData.completedAt,
        estimatedTimeRemaining: backendData.estimatedTimeRemaining,
      }

      return {
        success: true,
        data: renderStatus,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: RenderErrorCode.ABORTED,
            message: '상태 확인이 취소되었습니다',
          },
        }
      }

      console.error('Failed to get job status:', error)
      return {
        success: false,
        error: {
          code: RenderErrorCode.STATUS_CHECK_ERROR,
          message: error instanceof Error ? error.message : '상태 확인 실패',
        },
      }
    } finally {
      this.abortControllers.delete(jobId)
    }
  }

  /**
   * 렌더링 작업 취소
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      // 진행 중인 상태 확인 취소
      const controller = this.abortControllers.get(jobId)
      if (controller) {
        controller.abort()
        this.abortControllers.delete(jobId)
      }

      // 서버에 취소 요청
      const response = await fetch(`${GPU_RENDER_API_BASE}/${jobId}/cancel`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        return false
      }

      // 백엔드 취소 응답 처리
      const cancelData: BackendCancelResponse = await response.json()
      return cancelData.success
    } catch (error) {
      console.error('Failed to cancel job:', error)
      return false
    }
  }

  /**
   * 렌더링 작업 상태 폴링
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: (status: RenderStatus) => void,
    intervalMs: number = 5000,
    maxAttempts: number = 300 // 25분
  ): Promise<RenderStatus> {
    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await this.getJobStatus(jobId)

      if (!response.success || !response.data) {
        attempts++
        if (attempts > 3) {
          throw new Error(response.error?.message || '상태 확인 실패')
        }
        await this.delay(intervalMs)
        continue
      }

      const status = response.data

      // 진행 상황 콜백 호출
      if (onProgress) {
        onProgress(status)
      }

      // 완료 또는 실패 시 폴링 종료
      if (status.status === 'completed') {
        if (!status.downloadUrl) {
          throw new Error('다운로드 URL이 없습니다')
        }
        return status
      }

      if (status.status === 'failed') {
        throw new Error(status.error || '렌더링 실패')
      }

      // 대기 후 재시도
      await this.delay(intervalMs)
      attempts++
    }

    throw new Error('렌더링 타임아웃 (25분 초과)')
  }

  /**
   * 렌더링 이력 조회
   */
  async getRenderHistory(limit: number = 10): Promise<RenderHistory[]> {
    try {
      const response = await fetch(
        `${GPU_RENDER_API_BASE}/history?limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error('이력 조회 실패')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get render history:', error)
      return []
    }
  }

  /**
   * 예상 처리 시간 계산 (초)
   */
  private calculateEstimatedTime(scenario: {
    cues?: Array<{ hintTime?: { end?: number } }>
  }): number {
    try {
      // 시나리오의 큐 개수와 전체 시간으로 예상 시간 계산
      const cues = scenario.cues || []
      if (cues.length === 0) return 30 // 기본값

      // 마지막 큐의 종료 시간으로 영상 길이 계산
      let maxEndTime = 0
      cues.forEach((cue) => {
        if (cue.hintTime?.end) {
          maxEndTime = Math.max(maxEndTime, cue.hintTime.end)
        }
      })

      // 경험적 공식: 1분 영상 = 20초 처리
      const durationMinutes = maxEndTime / 60
      const estimatedSeconds = Math.max(15, Math.round(durationMinutes * 20))

      return estimatedSeconds
    } catch (error) {
      console.error('Failed to calculate estimated time:', error)
      return 30 // 기본값
    }
  }

  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 파일 다운로드 (File System Access API 지원)
   */
  async downloadFile(url: string, filename?: string): Promise<void> {
    const suggestedName = filename || `ecg-rendered-${Date.now()}.mp4`

    // File System Access API 지원 확인 (Chrome 86+, Edge 86+, Opera 72+)
    if ('showSaveFilePicker' in window && window.showSaveFilePicker) {
      try {
        // 저장 대화상자 표시
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [
            {
              description: 'MP4 Video File',
              accept: {
                'video/mp4': ['.mp4'],
              },
            },
          ],
        })

        // URL에서 파일 데이터 가져오기
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch video')
        }

        const blob = await response.blob()

        // 파일 쓰기
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()

        console.log('File saved successfully with File System Access API')
        return
      } catch (error) {
        // 사용자가 취소한 경우 에러를 무시
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('User cancelled the save dialog')
          return
        }
        console.error(
          'File System Access API failed, falling back to traditional download:',
          error
        )
        // 폴백으로 진행
      }
    }

    // 폴백: 전통적인 다운로드 방식
    // 브라우저 설정에 따라 저장 대화상자가 표시될 수 있음
    const link = document.createElement('a')
    link.href = url
    link.download = suggestedName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    // 약간의 지연 후 DOM에서 제거
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)
  }
}

export const renderService = new RenderService()
