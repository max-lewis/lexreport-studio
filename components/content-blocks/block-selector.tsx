'use client'

import { useState } from 'react'
import type { ContentBlockType } from '@/types/content-blocks'
import { cn } from '@/lib/utils'

interface BlockSelectorProps {
  onSelect: (type: ContentBlockType) => void
  onCancel: () => void
  className?: string
}

export function BlockSelector({ onSelect, onCancel, className }: BlockSelectorProps) {
  const blocks: { type: ContentBlockType; label: string; icon: string; description: string }[] = [
    { type: 'text', label: 'Text', icon: '¶', description: 'Rich text paragraph' },
    { type: 'heading', label: 'Heading', icon: 'H', description: 'Section heading' },
    { type: 'list', label: 'List', icon: '•', description: 'Bullet or numbered list' },
    { type: 'table', label: 'Table', icon: '⊞', description: 'Data table' },
    { type: 'quote', label: 'Quote', icon: '"', description: 'Block quote' },
    { type: 'callout', label: 'Callout', icon: '!', description: 'Info, warning, or note' },
    { type: 'image', label: 'Image', icon: '🖼', description: 'Image with caption' },
    { type: 'chart', label: 'Chart', icon: '📊', description: 'Data visualization' },
    { type: 'code', label: 'Code', icon: '<>', description: 'Code block' },
    { type: 'divider', label: 'Divider', icon: '―', description: 'Horizontal line' },
    { type: 'footnote_ref', label: 'Footnote', icon: '¹', description: 'Footnote reference' },
    { type: 'exhibit_ref', label: 'Exhibit', icon: 'EX', description: 'Exhibit reference' }
  ]

  return (
    <div className={cn('bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-80', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Add Content Block</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          title="Close"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
        {blocks.map((block) => (
          <button
            key={block.type}
            onClick={() => onSelect(block.type)}
            className="flex flex-col items-start p-3 border border-gray-200 rounded hover:border-violet-500 hover:bg-violet-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{block.icon}</span>
              <span className="text-sm font-medium">{block.label}</span>
            </div>
            <span className="text-xs text-gray-500">{block.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}
