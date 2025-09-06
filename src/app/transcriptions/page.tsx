'use client'

import React, { useState } from 'react'
import { DashboardLayout } from './components/DashboardLayout'
import { Header } from './components/Header'
import { DataTable } from './components/DataTable'

interface TranscriptionFile {
  id: string
  name: string
  duration: string
  created: string
  edited: string
  status: string
  [key: string]: unknown
}

const sampleTranscriptions: TranscriptionFile[] = [
  {
    id: '1',
    name: 'videoplayback',
    duration: '0:01:00',
    created: 'Aug 26, 25',
    edited: 'Aug 26, 25',
    status: 'ready',
  },
  {
    id: '2',
    name: 'Welcome to Maestra',
    duration: '0:01:44',
    created: 'Jan 1, 25',
    edited: 'Jan 1, 25',
    status: 'ready',
  },
]

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
    icon: <span>Export</span>,
    onClick: (id: string) => console.log('Export', id),
    variant: 'primary' as const,
  },
]

export default function TranscriptionsPage() {
  const [searchValue, setSearchValue] = useState('')
  const [sortValue, setSortValue] = useState('Default')

  const handleCreateNew = () => {
    console.log('Create new transcription')
  }

  const handleRowClick = (row: TranscriptionFile) => {
    console.log('Row clicked:', row)
  }

  const filteredTranscriptions = sampleTranscriptions.filter((transcription) =>
    transcription.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Header
          title="Transcriptions"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          sortValue={sortValue}
          onSortChange={setSortValue}
          actionButtonText="Create"
          onActionClick={handleCreateNew}
        />

        {/* Data Table */}
        <DataTable<TranscriptionFile>
          title="My Files"
          rows={filteredTranscriptions}
          actions={tableActions}
          onRowClick={handleRowClick}
        />
      </div>
    </DashboardLayout>
  )
}
