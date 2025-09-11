// 화자별 고유 색상 생성을 위한 공유 유틸리티
export const SPEAKER_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#EC4899', // pink
  '#6366F1', // indigo
]

/**
 * 화자 이름을 기반으로 고유한 색상을 생성합니다.
 * 이미 설정된 색상이 있으면 우선 사용합니다.
 *
 * @param speakerName - 화자 이름
 * @param speakerColors - 이미 설정된 화자별 색상 매핑
 * @returns 화자의 색상 (hex)
 */
export const getSpeakerColor = (
  speakerName: string,
  speakerColors: Record<string, string> = {}
): string => {
  if (!speakerName) return '#6B7280' // 기본 회색

  // 이미 설정된 색상이 있으면 사용
  if (speakerColors[speakerName]) {
    return speakerColors[speakerName]
  }

  // 화자 이름을 기반으로 해시 생성하여 색상 선택
  let hash = 0
  for (let i = 0; i < speakerName.length; i++) {
    hash = speakerName.charCodeAt(i) + ((hash << 5) - hash)
  }

  return SPEAKER_COLORS[Math.abs(hash) % SPEAKER_COLORS.length]
}
