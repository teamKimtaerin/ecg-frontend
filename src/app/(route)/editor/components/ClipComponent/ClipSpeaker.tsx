import React from 'react'
import Dropdown from '@/components/ui/Dropdown'

interface ClipSpeakerProps {
  clipId: string
  speaker: string
  speakers: string[]
  onSpeakerChange?: (clipId: string, newSpeaker: string) => void
}

export default function ClipSpeaker({
  clipId,
  speaker,
  speakers,
  onSpeakerChange,
}: ClipSpeakerProps) {
  const handleChange = (value: string) => {
    if (!onSpeakerChange) return

    if (value === 'add_new') {
      const newSpeaker = prompt('새 Speaker 이름을 입력하세요:')
      if (newSpeaker && newSpeaker.trim()) {
        onSpeakerChange(clipId, newSpeaker.trim())
      }
    } else {
      onSpeakerChange(clipId, value)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* 화자 앞의 동그라미 표시 */}
      <div className="w-2 h-2 rounded-full bg-[#E6E6E6] flex-shrink-0" />


      <Dropdown
        value={speaker}
        options={[
          ...speakers.map((s) => ({ value: s, label: s })),
          { value: 'add_new', label: '+ 새 Speaker 추가' },
        ]}
        size="small"
        className="text-sm flex-shrink-0"
        onChange={handleChange}
      />
    </div>
  )
}
