import React from 'react'

interface ClipTextProps {
  fullText: string
}

export default function ClipText({ fullText }: ClipTextProps) {
  return (
    <div className="p-3">
      <div className="text-sm text-[#F2F2F2] text-center">{fullText}</div>
    </div>
  )
}
