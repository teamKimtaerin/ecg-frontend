'use client'

import React from 'react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'

interface HeaderProps {
  title: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  sortValue?: string
  onSortChange?: (value: string) => void
  actionButtonText: string
  onActionClick: () => void
}

export function Header({
  title,
  searchValue = '',
  onSearchChange,
  sortValue = 'Default',
  onSortChange,
  actionButtonText,
  onActionClick,
}: HeaderProps) {
  return (
    <div className="px-8 py-6 border-b border-[#404040]">
      <div className="flex items-center justify-between">
        {/* Title with info icon */}
        <div className="flex items-center space-x-3">
          <h1 className="text-white text-3xl font-semibold">{title}</h1>
          <div className="w-6 h-6 bg-[#404040] rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-[#808080]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-[#2a2a2a] text-white placeholder-[#808080] pl-10 pr-4 py-2.5 rounded-lg border border-[#404040] focus:border-[#606060] focus:outline-none w-64"
            />
          </div>

          {/* Sort Dropdown */}
          <Dropdown
            value={sortValue}
            onChange={(value) => onSortChange?.(value)}
            options={[
              { value: 'Default', label: 'Default' },
              { value: 'Name', label: 'Name' },
              { value: 'Created', label: 'Created' },
              { value: 'Modified', label: 'Modified' },
            ]}
            className="dropdown-dark"
          />

          {/* Action Button */}
          <Button
            label={actionButtonText}
            onClick={onActionClick}
            variant="primary"
            size="medium"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  )
}
