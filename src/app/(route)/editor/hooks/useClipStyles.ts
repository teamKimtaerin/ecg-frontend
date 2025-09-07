import { ClipStyleState } from '../types'

export function useClipStyles({
  isSelected,
  isChecked,
  isMultiSelected,
  isDragging = false,
}: ClipStyleState) {
  const getContainerClassName = () => {
    const baseClasses = 'bg-gray-200 rounded-lg transition-all cursor-pointer'

    const stateClasses = []

    if (isMultiSelected || isChecked) {
      // 체크박스 선택된 상태 (초록색)
      stateClasses.push('ring-2 ring-green-500 bg-green-50')
    }

    if (isSelected) {
      // 포커스 상태 (파란색 테두리, 체크박스와 독립적)
      if (isMultiSelected || isChecked) {
        stateClasses.push('ring-4 ring-blue-400') // 체크와 포커스가 함께 있을 때
      } else {
        stateClasses.push('ring-2 ring-blue-400 bg-blue-50') // 포커스만 있을 때
      }
    } else if (!isDragging && !(isMultiSelected || isChecked)) {
      stateClasses.push('hover:bg-gray-300')
    }

    return `${baseClasses} ${stateClasses.join(' ')}`
  }

  const getSidebarClassName = () => {
    return 'w-16 flex items-center justify-center bg-gray-300 rounded-l-lg border-r border-gray-400 relative'
  }

  const getContentClassName = () => {
    return 'flex-1 flex flex-col'
  }

  return {
    containerClassName: getContainerClassName(),
    sidebarClassName: getSidebarClassName(),
    contentClassName: getContentClassName(),
  }
}
