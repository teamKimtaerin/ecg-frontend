'use client'

import React, { useState, useEffect } from 'react'
import { useServerVideoExport } from '../../hooks/useServerVideoExport'
import { useEditorStore } from '../../store'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { FaRocket, FaDownload, FaTimes } from 'react-icons/fa'
import { buildScenarioFromClips } from '@/app/(route)/editor/utils/scenarioBuilder'

interface ServerVideoExportModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
}

export default function ServerVideoExportModal({
  isOpen,
  onClose,
  videoUrl: propVideoUrl,
}: ServerVideoExportModalProps) {
  const { clips, videoUrl: storeVideoUrl, videoName } = useEditorStore()
  const {
    isExporting,
    progress,
    estimatedTime,
    timeRemaining,
    status,
    error,
    downloadUrl,
    selectedFileHandle,
    startExport,
    cancelExport,
    downloadFile,
    reset,
  } = useServerVideoExport()

  const [phase, setPhase] = useState<
    'ready' | 'exporting' | 'completed' | 'error'
  >('ready')

  // 비디오 URL 결정 (props > store)
  const videoUrl = propVideoUrl || storeVideoUrl

  useEffect(() => {
    if (isOpen) {
      setPhase('ready')
      reset()
    }
  }, [isOpen, reset])

  useEffect(() => {
    if (status === 'completed' && downloadUrl) {
      setPhase('completed')
    } else if (status === 'failed' || error) {
      setPhase('error')
    } else if (isExporting) {
      setPhase('exporting')
    }
  }, [status, downloadUrl, error, isExporting])

  const handleStartExport = async () => {
    if (!videoUrl) {
      console.error('비디오 URL이 없습니다')
      return
    }

    if (!clips || clips.length === 0) {
      console.error('자막 데이터가 없습니다')
      return
    }

    try {
      setPhase('exporting')

      // 시나리오 생성
      const scenario = buildScenarioFromClips(clips)

      // 파일명 생성
      const baseName = videoName?.replace(/\.[^/.]+$/, '') || 'video'
      const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const fileName = `${baseName}_GPU_${timestamp}.mp4`

      // GPU 렌더링 시작 (저장 위치 선택 포함)
      await startExport(
        videoUrl,
        scenario,
        {
          width: 1920,
          height: 1080,
          fps: 30,
          quality: 90,
          format: 'mp4',
        },
        fileName
      )
    } catch (error) {
      console.error('Export failed:', error)
      // 저장 위치 선택 취소인 경우 원래 상태로 돌아감
      if (error instanceof Error && error.message.includes('취소')) {
        setPhase('ready')
      } else {
        setPhase('error')
      }
    }
  }

  const handleDownload = async () => {
    if (downloadUrl) {
      // 파일명 제안: 비디오 이름이 있으면 사용, 없으면 프로젝트명 또는 기본값 사용
      const baseName = videoName?.replace(/\.[^/.]+$/, '') || 'video'
      const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const filename = `${baseName}_GPU_${timestamp}.mp4`

      await downloadFile(downloadUrl, filename)
    }
  }

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '계산 중...'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`
  }

  const getProgressText = (): string => {
    switch (status) {
      case 'queued':
        return '렌더링 대기 중...'
      case 'processing':
        return `처리 중... ${progress}%`
      case 'completed':
        return '렌더링 완료!'
      case 'failed':
        return '렌더링 실패'
      default:
        return '준비 중...'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdropClick={!isExporting}
      isblind={false}
    >
      <div className="p-6">
        {/* 준비 단계 */}
        {phase === 'ready' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">영상 정보:</span>
                <br />
                {videoName || '제목 없음'} ({clips?.length || 0}개 자막)
              </p>
            </div>

            <Button
              onClick={handleStartExport}
              variant="primary"
              size="large"
              className="w-full"
            >
              GPU 렌더링 시작
            </Button>
          </div>
        )}

        {/* 렌더링 진행 중 */}
        {phase === 'exporting' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="animate-spin">
                  <FaRocket className="text-blue-600 text-2xl" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {getProgressText()}
              </h3>
              {estimatedTime && (
                <p className="text-sm text-gray-600">
                  예상 완료 시간: {formatTime(estimatedTime)}
                </p>
              )}
              {timeRemaining !== null && timeRemaining > 0 && (
                <p className="text-sm text-gray-600">
                  남은 시간: {formatTime(timeRemaining)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>진행률</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                💡 브라우저를 닫아도 서버에서 렌더링이 계속됩니다. 나중에 다시
                확인하실 수 있습니다.
              </p>
            </div>

            {isExporting && (
              <Button
                onClick={cancelExport}
                variant="secondary"
                size="medium"
                className="w-full"
              >
                취소
              </Button>
            )}
          </div>
        )}

        {/* 완료 */}
        {phase === 'completed' && downloadUrl && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                렌더링 완료! 🎉
              </h3>
              <p className="text-sm text-gray-600">
                {selectedFileHandle
                  ? '선택한 위치에 자동으로 저장되었습니다'
                  : '고품질 영상이 준비되었습니다'}
              </p>
            </div>

            <div className="space-y-2">
              {!selectedFileHandle && (
                <Button
                  onClick={handleDownload}
                  variant="primary"
                  size="large"
                  className="w-full"
                >
                  <FaDownload className="mr-2" />
                  다운로드
                </Button>
              )}

              {selectedFileHandle && (
                <Button
                  onClick={handleDownload}
                  variant="secondary"
                  size="medium"
                  className="w-full"
                >
                  <FaDownload className="mr-2" />
                  다른 위치에 저장
                </Button>
              )}

              <Button
                onClick={onClose}
                variant="secondary"
                size="medium"
                className="w-full"
              >
                닫기
              </Button>
            </div>
          </div>
        )}

        {/* 오류 */}
        {phase === 'error' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                렌더링 실패
              </h3>
              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleStartExport}
                variant="primary"
                size="medium"
                className="w-full"
              >
                다시 시도
              </Button>
              <Button
                onClick={onClose}
                variant="secondary"
                size="medium"
                className="w-full"
              >
                닫기
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
