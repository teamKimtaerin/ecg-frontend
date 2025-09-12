'use client'

import React, { useState, useEffect } from 'react'
import TemplateCard, { TemplateItem } from './TemplateCard'

interface TemplateGridProps {
  onTemplateSelect?: (template: TemplateItem) => void
  onExpandTemplate?: (templateId: string, templateName: string) => void
  expandedTemplateId?: string | null
}

const TemplateGrid: React.FC<TemplateGridProps> = ({
  onTemplateSelect,
  onExpandTemplate,
  expandedTemplateId,
}) => {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)

  // Mock template data
  useEffect(() => {
    const mockTemplates: TemplateItem[] = [
      {
        id: 'template-1',
        name: 'Modern Card',
        category: 'Cards',
        type: 'free',
        preview: {
          type: 'gradient',
          value: '#667eea',
          secondary: '#764ba2',
        },
      },
      {
        id: 'template-2',
        name: 'Neon Glow',
        category: 'Effects',
        type: 'premium',
        preview: {
          type: 'gradient',
          value: '#ff6b6b',
          secondary: '#4ecdc4',
        },
      },
      {
        id: 'template-3',
        name: 'Minimal Clean',
        category: 'Basic',
        type: 'free',
        preview: {
          type: 'color',
          value: '#f8f9fa',
        },
      },
      {
        id: 'template-4',
        name: 'Dark Mode',
        category: 'Themes',
        type: 'free',
        preview: {
          type: 'color',
          value: '#2d3748',
        },
      },
      {
        id: 'template-5',
        name: 'Glassmorphism',
        category: 'Modern',
        type: 'premium',
        preview: {
          type: 'gradient',
          value: '#667eea',
          secondary: '#764ba2',
        },
      },
      {
        id: 'template-6',
        name: 'Retro Wave',
        category: 'Retro',
        type: 'premium',
        preview: {
          type: 'gradient',
          value: '#ff0080',
          secondary: '#8000ff',
        },
      },
    ]

    setTimeout(() => {
      setTemplates(mockTemplates)
      setLoading(false)
    }, 500)
  }, [])

  const handleTemplateClick = (template: TemplateItem) => {
    onTemplateSelect?.(template)
    onExpandTemplate?.(template.id, template.name)
  }

  if (loading) {
    return (
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="aspect-video bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4">
      <div className="grid grid-cols-2 gap-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={{
              ...template,
              isUsed: expandedTemplateId === template.id,
            }}
            onClick={handleTemplateClick}
          />
        ))}
      </div>
    </div>
  )
}

export default TemplateGrid
