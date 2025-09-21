'use client'

import ProgressModal from '@/components/ui/ProgressModal'
import { useEffect, useState } from 'react'

interface VideoExportProgressModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export default function VideoExportProgressModal({
  isOpen,
  onClose,
  onComplete,
}: VideoExportProgressModalProps) {
  const [progress, setProgress] = useState(0)

  // 진행률 시뮬레이션
  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      return
    }

    const duration = 4000 // 4초간 진행
    const intervalTime = 50 // 50ms마다 업데이트
    const increment = 100 / (duration / intervalTime)

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment
        if (newProgress >= 100) {
          clearInterval(interval)
          // 100% 완료 시 잠시 후 완료 콜백 호출
          setTimeout(() => {
            onComplete?.()
          }, 500)
          return 100
        }
        return newProgress
      })
    }, intervalTime)

    return () => {
      clearInterval(interval)
    }
  }, [isOpen, onComplete])

  // 가상의 남은 시간 계산 (진행률 기반)
  const remainingSeconds = Math.max(0, Math.floor((100 - progress) * 0.02)) // 0.02초 per %

  return (
    <ProgressModal
      isOpen={isOpen}
      onClose={onClose}
      type="export"
      status="processing"
      progress={progress}
      estimatedTimeRemaining={remainingSeconds}
      canCancel={true}
      closeOnBackdropClick={false}
      aria-label="내보내기 진행 상황"
    />
  )
}
