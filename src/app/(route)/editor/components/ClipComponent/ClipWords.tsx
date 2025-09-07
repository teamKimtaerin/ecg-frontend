import React from 'react'
import { Word } from './types'

interface ClipWordsProps {
  clipId: string
  words: Word[]
  onWordEdit: (clipId: string, wordId: string, newText: string) => void
}

export default function ClipWords({
  clipId,
  words,
  onWordEdit,
}: ClipWordsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {words.map((word) => (
        <button
          key={word.id}
          className="bg-[#383842] border border-[#4D4D59] hover:border-[#9999A6] rounded px-2 py-1 text-sm text-[#F2F2F2] transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onWordEdit(clipId, word.id, word.text)
          }}
        >
          {word.text}
        </button>
      ))}
    </div>
  )
}
