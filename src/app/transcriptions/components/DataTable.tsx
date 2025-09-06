'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import StatusLight from '@/components/ui/StatusLight'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'

interface TableAction {
  label: string
  icon: React.ReactNode
  onClick: (id: string) => void
  variant?: 'primary' | 'secondary' | 'negative'
}

interface TableRow {
  id: string
  [key: string]: unknown
}

interface DataTableProps<T extends TableRow = TableRow> {
  title: string
  rows: T[]
  actions?: TableAction[]
  onRowClick?: (row: T) => void
}

export function DataTable<T extends TableRow = TableRow>({
  title,
  rows,
  actions,
  onRowClick,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(rows.map((row) => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows)
    if (checked) {
      newSelectedRows.add(rowId)
    } else {
      newSelectedRows.delete(rowId)
    }
    setSelectedRows(newSelectedRows)
  }

  const isAllSelected = rows.length > 0 && selectedRows.size === rows.length
  const isIndeterminate =
    selectedRows.size > 0 && selectedRows.size < rows.length

  const renderCellContent = (row: T, columnKey: string) => {
    const value = row[columnKey]

    // Handle tags specially
    if (columnKey === 'tags' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((tag, index) => (
            <Tag key={index} label={tag.label} size="small" className="mr-1" />
          ))}
        </div>
      )
    }

    // Handle status with StatusLight component
    if (columnKey === 'status') {
      return (
        <div className="flex items-center justify-center">
          <StatusLight label="Ready" variant="positive" size="small" />
        </div>
      )
    }

    return <span className="text-[#b3b3b3] text-sm">{String(value)}</span>
  }

  return (
    <div className="px-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold">{title}</h2>

        {/* Action Buttons */}
        {actions && actions.length > 0 && (
          <div className="flex items-center space-x-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={() => action.onClick('')}
                variant={action.variant === 'negative' ? 'negative' : 'primary'}
                size="medium"
                hideLabel={action.label}
                icon={action.icon}
                aria-label={action.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#2a2a2a] rounded-lg border border-[#404040] overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-[#404040] bg-[#333333]">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="custom-checkbox mr-4"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <div className="flex-1 grid grid-cols-5 gap-4">
              <div className="text-[#b3b3b3] text-sm font-medium uppercase tracking-wider">
                NAME
              </div>
              <div className="text-[#b3b3b3] text-sm font-medium uppercase tracking-wider text-center">
                DURATION
              </div>
              <div className="text-[#b3b3b3] text-sm font-medium uppercase tracking-wider text-center">
                UPLOADED
              </div>
              <div className="text-[#b3b3b3] text-sm font-medium uppercase tracking-wider text-center">
                EDITED
              </div>
              <div className="text-[#b3b3b3] text-sm font-medium uppercase tracking-wider text-center">
                STATUS
              </div>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#404040]">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                'px-6 py-4 transition-colors',
                onRowClick && 'hover:bg-[#333333] cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="custom-checkbox mr-4"
                  checked={selectedRows.has(row.id)}
                  onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                />
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div className="flex items-center">
                    <span className="text-white text-sm font-medium">
                      {String(row.name)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[#b3b3b3] text-sm">
                      {String(row.duration)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[#b3b3b3] text-sm">
                      {String(row.created)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[#b3b3b3] text-sm">
                      {String(row.edited)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    {renderCellContent(row, 'status')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
