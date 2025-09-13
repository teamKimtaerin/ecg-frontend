export interface RenderProgressModalProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  progress: number
  analysisTime: string
  userName?: string
}

export interface ProgressInfo {
  percentage: number
  timeElapsed: string
  estimatedTimeRemaining?: string
}

export interface VideoPlayerProps {
  fileName: string
  isStatic?: boolean
}