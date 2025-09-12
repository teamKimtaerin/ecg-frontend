'use client'

import React, { useState } from 'react'
import { useEditorStore } from '../../store'

// Components
import SidebarHeader from './SidebarHeader'
import SearchBar from './SearchBar'
import UsedTemplatesStrip from './UsedTemplatesStrip'
import TabNavigation from './TabNavigation'
import TemplateGrid from './TemplateGrid'
import TemplateControlPanel from './TemplateControlPanel'
import { TemplateItem } from './TemplateCard'

interface TemplateSidebarProps {
  className?: string
  onTemplateSelect?: (template: TemplateItem) => void
  onClose?: () => void
}

const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  className,
  onTemplateSelect,
  onClose,
}) => {
  const { rightSidebarType, assetSidebarWidth } = useEditorStore()

  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(
    null
  )
  const [expandedTemplateName, setExpandedTemplateName] = useState<
    string | null
  >(null)

  if (rightSidebarType !== 'template') {
    return null
  }

  const handleTemplateSelect = (template: TemplateItem) => {
    // Here you would typically apply the template to the focused clip
    console.log('Selected template:', template)
    onTemplateSelect?.(template)

    // TODO: Implement actual template application to focused clip
    // This would integrate with the existing clip editing system
  }

  const handleExpandTemplate = (templateId: string, templateName: string) => {
    setExpandedTemplateId(templateId === expandedTemplateId ? null : templateId)
    setExpandedTemplateName(templateName)
  }

  return (
    <div
      className={`flex flex-col h-full bg-white border-l border-gray-200 ${
        className || ''
      }`}
      style={{ width: `${assetSidebarWidth}px` }}
    >
      {/* Header */}
      <SidebarHeader title="애니메이션 템플릿" onClose={onClose} />

      {/* Search
      <SearchBar placeholder="Search templates..." /> */}

      {/* Used Templates Strip */}
      <UsedTemplatesStrip />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto">
        <TemplateGrid
          onTemplateSelect={handleTemplateSelect}
          onExpandTemplate={handleExpandTemplate}
          expandedTemplateId={expandedTemplateId}
        />
      </div>

      {/* Control Panel */}
      {expandedTemplateId && (
        <TemplateControlPanel
          templateId={expandedTemplateId}
          templateName={expandedTemplateName}
          onClose={() => {
            setExpandedTemplateId(null)
            setExpandedTemplateName(null)
          }}
        />
      )}
    </div>
  )
}

export default TemplateSidebar
