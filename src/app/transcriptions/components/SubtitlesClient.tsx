'use client'

import React, { useState } from 'react'
import { Header } from './Header'
import { DataTable } from './DataTable'

interface SubtitleAsset {
  id: string
  name: string
  tags: Array<{
    label: string
    variant: 'positive' | 'informative' | 'negative' | 'notice' | 'neutral'
  }>
  created: string
  edited: string
  [key: string]: unknown
}

interface SubtitlesClientProps {
  initialSubtitles: SubtitleAsset[]
}

const tableActions = [
  {
    label: 'Move',
    icon: <span>📁</span>,
    onClick: (id: string) => console.log('Move', id),
    variant: 'secondary' as const,
  },
  {
    label: 'Rename',
    icon: <span>✏️</span>,
    onClick: (id: string) => console.log('Rename', id),
    variant: 'secondary' as const,
  },
  {
    label: 'Remove',
    icon: <span>🗑️</span>,
    onClick: (id: string) => console.log('Remove', id),
    variant: 'negative' as const,
  },
  {
    label: 'Duplicate',
    icon: <span>📄</span>,
    onClick: (id: string) => console.log('Duplicate', id),
    variant: 'secondary' as const,
  },
  {
    label: 'Export',
    icon: <span>📤</span>,
    onClick: (id: string) => console.log('Export', id),
    variant: 'primary' as const,
  },
]

export function SubtitlesClient({ initialSubtitles }: SubtitlesClientProps) {
  const [searchValue, setSearchValue] = useState('')
  const [sortValue, setSortValue] = useState('Default')

  const handleCreateNew = () => {
    console.log('Create new subtitle')
  }

  const handleRowClick = (row: SubtitleAsset) => {
    console.log('Row clicked:', row)
  }

  const filteredSubtitles = initialSubtitles.filter((subtitle) =>
    subtitle.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        title="Subtitles"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        sortValue={sortValue}
        onSortChange={setSortValue}
        actionButtonText="New Subtitle"
        onActionClick={handleCreateNew}
      />

      {/* Data Table */}
      <DataTable<SubtitleAsset>
        title="My Assets"
        rows={filteredSubtitles}
        actions={tableActions}
        onRowClick={handleRowClick}
      />
    </div>
  )
}
