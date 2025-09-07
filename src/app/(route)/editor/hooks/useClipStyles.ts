import { ClipStyleState } from '../types'

export function useClipStyles({
  isSelected,
  isChecked,
  isMultiSelected,
  isDragging = false,
}: ClipStyleState) {
  const getContainerClassName = () => {
    const baseClasses = 'rounded-lg transition-all cursor-pointer'

    const stateClasses = ['bg-[#F2F2F2]'] // 기본 배경색

    if (isMultiSelected || isChecked) {
      // 체크박스 선택된 상태 (시안색)
      stateClasses.push('ring-2 ring-[#33BFD9] bg-[#33BFD9]/10')
    }

    if (isSelected) {
      // 포커스 상태 (시안색 테두리, 체크박스와 독립적)
      if (isMultiSelected || isChecked) {
        stateClasses.push('ring-4 ring-[#33BFD9]') // 체크와 포커스가 함께 있을 때
      } else {
        stateClasses.push('ring-2 ring-[#33BFD9] bg-[#33BFD9]/5') // 포커스만 있을 때
      }
    } else if (!isDragging && !(isMultiSelected || isChecked)) {
      stateClasses.push('hover:bg-[#E6E6E6]')
    }

    return `${baseClasses} ${stateClasses.join(' ')}`
  }

  const getSidebarClassName = () => {
    return 'w-16 flex items-center justify-center bg-[#E6E6E6] rounded-l-lg border-r border-[#9999A6] relative'
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
