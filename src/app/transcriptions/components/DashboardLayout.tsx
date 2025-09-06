'use client'

import React from 'react'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      {/* Sidebar - Fixed width */}
      <div className="w-64 bg-[#2a2a2a] border-r border-[#404040]">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#1a1a1a]">{children}</div>
    </div>
  )
}
