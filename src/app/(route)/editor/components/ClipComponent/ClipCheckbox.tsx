import React from 'react'
import { EDITOR_COLORS } from '../../constants/colors'

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
      className={`w-5 h-5 text-[${EDITOR_COLORS.clip.accent}] bg-[${EDITOR_COLORS.clip.divider}] border-[${EDITOR_COLORS.clip.textSecondary}] rounded focus:ring-[${EDITOR_COLORS.clip.accent}] focus:ring-2 cursor-pointer accent-[${EDITOR_COLORS.clip.accent}]`}
    />
  )
}
