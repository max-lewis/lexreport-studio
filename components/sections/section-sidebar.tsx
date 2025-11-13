'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { Section, SectionType } from '@/types/database'

interface SectionSidebarProps {
  sections: Section[]
  currentSectionId?: string
  onSectionSelect: (sectionId: string) => void
  onSectionCreate: (type: SectionType, parentId?: string) => Promise<void>
  onSectionDelete: (sectionId: string) => Promise<void>
  onSectionReorder: (sections: Section[]) => Promise<void>
  className?: string
}

export function SectionSidebar({
  sections,
  currentSectionId,
  onSectionSelect,
  onSectionCreate,
  onSectionDelete,
  onSectionReorder,
  className
}: SectionSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Get top-level sections (no parent)
  const topLevelSections = sections.filter((s) => !s.parent_id)

  // Get children of a section
  const getChildren = (parentId: string) => {
    return sections.filter((s) => s.parent_id === parentId)
  }

  const toggleExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = topLevelSections.findIndex((s) => s.id === active.id)
    const newIndex = topLevelSections.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const reorderedSections = arrayMove(topLevelSections, oldIndex, newIndex)
    const updatedSections = reorderedSections.map((section, index) => ({
      ...section,
      order_index: index
    }))

    // Combine with child sections (keep their order)
    const childSections = sections.filter((s) => s.parent_id)
    const allSections = [...updatedSections, ...childSections]

    await onSectionReorder(allSections)
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-50 border-r border-gray-200', className)}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg mb-2">Sections</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="w-full px-3 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
        >
          + Add Section
        </button>
      </div>

      {isCreating && (
        <div className="p-4 bg-white border-b border-gray-200">
          <SectionTypeSelector
            onSelect={async (type) => {
              await onSectionCreate(type)
              setIsCreating(false)
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={topLevelSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {topLevelSections.map((section) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                children={getChildren(section.id)}
                isActive={section.id === currentSectionId}
                isExpanded={expandedSections.has(section.id)}
                currentSectionId={currentSectionId}
                onToggleExpand={() => toggleExpanded(section.id)}
                onSelect={() => onSectionSelect(section.id)}
                onDelete={() => onSectionDelete(section.id)}
                onAddChild={(type) => onSectionCreate(type, section.id)}
                onSectionSelect={onSectionSelect}
                onSectionDelete={onSectionDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

interface SortableSectionItemProps {
  section: Section
  children: Section[]
  isActive: boolean
  isExpanded: boolean
  currentSectionId?: string
  onToggleExpand: () => void
  onSelect: () => void
  onDelete: () => void
  onAddChild: (type: SectionType) => void
  onSectionSelect: (sectionId: string) => void
  onSectionDelete: (sectionId: string) => Promise<void>
}

function SortableSectionItem({
  section,
  children,
  isActive,
  isExpanded,
  currentSectionId,
  onToggleExpand,
  onSelect,
  onDelete,
  onAddChild,
  onSectionSelect,
  onSectionDelete
}: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const [showChildSelector, setShowChildSelector] = useState(false)

  return (
    <div ref={setNodeRef} style={style} className={cn('mb-1', isDragging && 'opacity-50')}>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded hover:bg-white transition-colors group',
          isActive && 'bg-violet-100 border border-violet-300',
          !isActive && 'hover:bg-gray-100'
        )}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <DragHandleIcon />
        </button>

        {/* Expand/collapse for sections with children */}
        {children.length > 0 ? (
          <button onClick={onToggleExpand} className="text-gray-500 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Section info */}
        <button onClick={onSelect} className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium truncate">{section.title || getSectionTypeLabel(section.type)}</div>
          {section.title && (
            <div className="text-xs text-gray-500">{getSectionTypeLabel(section.type)}</div>
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowChildSelector(!showChildSelector)}
            className="p-1 rounded hover:bg-gray-200"
            title="Add subsection"
          >
            <PlusIcon />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-100 text-red-600"
            title="Delete section"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Child selector */}
      {showChildSelector && (
        <div className="ml-8 mt-1 p-2 bg-white rounded border border-gray-200">
          <SectionTypeSelector
            onSelect={(type) => {
              onAddChild(type)
              setShowChildSelector(false)
            }}
            onCancel={() => setShowChildSelector(false)}
            compact
          />
        </div>
      )}

      {/* Child sections */}
      {isExpanded && children.length > 0 && (
        <div className="ml-6 mt-1">
          {children.map((child) => (
            <div key={child.id} className="mb-1">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded hover:bg-white transition-colors',
                  child.id === currentSectionId && 'bg-violet-100 border border-violet-300'
                )}
              >
                <div className="w-4" />
                <button onClick={() => onSectionSelect(child.id)} className="flex-1 text-left min-w-0">
                  <div className="text-sm truncate">
                    {child.title || getSectionTypeLabel(child.type)}
                  </div>
                </button>
                <button
                  onClick={() => onSectionDelete(child.id)}
                  className="p-1 rounded hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface SectionTypeSelectorProps {
  onSelect: (type: SectionType) => void
  onCancel: () => void
  compact?: boolean
}

function SectionTypeSelector({ onSelect, onCancel, compact = false }: SectionTypeSelectorProps) {
  const sectionTypes: SectionType[] = [
    'title_page',
    'executive_summary',
    'table_of_contents',
    'introduction',
    'background',
    'analysis',
    'findings',
    'discussion',
    'methodology',
    'recommendations',
    'conclusion',
    'appendix',
    'exhibit',
    'references',
    'glossary',
    'acknowledgments',
    'custom'
  ]

  if (compact) {
    return (
      <div className="space-y-1">
        <select
          onChange={(e) => {
            if (e.target.value) {
              onSelect(e.target.value as SectionType)
            }
          }}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">Select type...</option>
          {sectionTypes.map((type) => (
            <option key={type} value={type}>
              {getSectionTypeLabel(type)}
            </option>
          ))}
        </select>
        <button
          onClick={onCancel}
          className="w-full px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-2">Select Section Type</h3>
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {sectionTypes.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="px-3 py-2 text-sm text-left border border-gray-300 rounded hover:border-violet-500 hover:bg-violet-50 transition-colors"
          >
            {getSectionTypeLabel(type)}
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
      >
        Cancel
      </button>
    </div>
  )
}

function getSectionTypeLabel(type: SectionType): string {
  const labels: Record<SectionType, string> = {
    title_page: 'Title Page',
    executive_summary: 'Executive Summary',
    table_of_contents: 'Table of Contents',
    introduction: 'Introduction',
    background: 'Background',
    analysis: 'Analysis',
    findings: 'Findings',
    discussion: 'Discussion',
    methodology: 'Methodology',
    recommendations: 'Recommendations',
    conclusion: 'Conclusion',
    appendix: 'Appendix',
    exhibit: 'Exhibit',
    references: 'References',
    glossary: 'Glossary',
    acknowledgments: 'Acknowledgments',
    custom: 'Custom Section'
  }
  return labels[type] || type
}

// Icon components
function DragHandleIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H7zM7 12a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H7zM11 4a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V4zM11 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}
