export type ExportFormat =
  | 'mp4'
  | 'srt'
  | 'txt'
  | 'mp3'
  | 'wav'
  | 'png'
  | 'gif'
  | 'mov'
  | 'premiere'
  | 'finalcut'
  | 'davinci'
  | 'hoit'

export interface ExportOption {
  id: ExportFormat
  label: string
  description: string
  icon: string
  category: 'video' | 'subtitle' | 'audio' | 'image' | 'project'
  isRecentlyUsed?: boolean
}

export interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (format: ExportFormat) => void
}
