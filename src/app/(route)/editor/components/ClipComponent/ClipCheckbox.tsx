import React from 'react'

interface ClipCheckboxProps {
  clipId: string
  isChecked: boolean
  isVisible?: boolean // Made optional since we'll always show it
  onCheck?: (clipId: string, checked: boolean) => void
}

export default function ClipCheckbox({
  clipId,
  isChecked,
  onCheck,
}: ClipCheckboxProps) {
  if (!onCheck) return null

  return (
    <input
      type="checkbox"
      checked={isChecked}
      onChange={(e) => {
        e.stopPropagation()
        onCheck(clipId, e.target.checked)
      }}
      onClick={(e) => e.stopPropagation()} // Prevent clip selection when clicking checkbox
      className="w-5 h-5 text-[#E6E6E6] bg-[#383842] border-[#9999A6] rounded focus:ring-[#E6E6E6] focus:ring-2 cursor-pointer accent-[#E6E6E6]"
    />
  )
}
