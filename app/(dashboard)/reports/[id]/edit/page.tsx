'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Report, Section } from '@/types/database'
import type { ContentBlock, ContentBlockType } from '@/types/content-blocks'
import { SectionSidebar } from '@/components/sections/section-sidebar'
import { ContentBlockRenderer } from '@/components/content-blocks/content-block-renderer'
import { BlockSelector } from '@/components/content-blocks/block-selector'
import {
  createTextBlock,
  createHeadingBlock,
  createListBlock,
  createTableBlock,
  createQuoteBlock,
  createCalloutBlock,
  createImageBlock,
  createChartBlock,
  createCodeBlock,
  createDividerBlock,
  createFootnoteRefBlock,
  createExhibitRefBlock
} from '@/types/content-blocks'
import { cn } from '@/lib/utils'

export default function ReportEditorPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState<Section | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showBlockSelector, setShowBlockSelector] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Load report and sections
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)

        // Load report
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single()

        if (reportError) throw reportError
        setReport(reportData)

        // Load sections
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select('*')
          .eq('report_id', reportId)
          .order('order_index', { ascending: true })

        if (sectionsError) throw sectionsError
        setSections(sectionsData || [])

        // Set first section as current if exists
        if (sectionsData && sectionsData.length > 0) {
          setCurrentSectionId(sectionsData[0].id)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [reportId])

  // Load current section's content blocks
  useEffect(() => {
    if (currentSectionId) {
      const section = sections.find((s) => s.id === currentSectionId)
      if (section) {
        setCurrentSection(section)
        const blocks = section.content_blocks as any
        setContentBlocks(Array.isArray(blocks) ? blocks : [])
      }
    }
  }, [currentSectionId, sections])

  // Create section
  const handleSectionCreate = async (type: string, parentId?: string) => {
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, type, parentId })
      })

      if (!response.ok) throw new Error('Failed to create section')

      const { section } = await response.json()
      setSections([...sections, section])
      setCurrentSectionId(section.id)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  // Delete section
  const handleSectionDelete = async (sectionId: string) => {
    if (!confirm('Delete this section?')) return

    try {
      const response = await fetch(`/api/sections?id=${sectionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete section')

      setSections(sections.filter((s) => s.id !== sectionId))
      if (currentSectionId === sectionId) {
        setCurrentSectionId(sections[0]?.id || null)
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  // Reorder sections
  const handleSectionReorder = async (reorderedSections: Section[]) => {
    try {
      const sectionOrders = reorderedSections.map((s) => ({
        id: s.id,
        orderIndex: s.order_index
      }))

      const response = await fetch('/api/sections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, sectionOrders })
      })

      if (!response.ok) throw new Error('Failed to reorder sections')

      setSections(reorderedSections)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  // Save section content
  const handleSaveSection = async () => {
    if (!currentSectionId) return

    try {
      setIsSaving(true)

      const response = await fetch('/api/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSectionId,
          contentBlocks: contentBlocks
        })
      })

      if (!response.ok) throw new Error('Failed to save section')

      // Update local state
      setSections(
        sections.map((s) => (s.id === currentSectionId ? { ...s, content_blocks: contentBlocks as any } : s))
      )
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Add content block
  const handleAddBlock = (type: ContentBlockType) => {
    let newBlock: ContentBlock

    switch (type) {
      case 'text':
        newBlock = createTextBlock('', contentBlocks.length)
        break
      case 'heading':
        newBlock = createHeadingBlock(2, '', contentBlocks.length)
        break
      case 'list':
        newBlock = createListBlock('bullet', contentBlocks.length)
        break
      case 'table':
        newBlock = createTableBlock(contentBlocks.length)
        break
      case 'quote':
        newBlock = createQuoteBlock('', contentBlocks.length)
        break
      case 'callout':
        newBlock = createCalloutBlock('info', '', contentBlocks.length)
        break
      case 'image':
        newBlock = createImageBlock('https://via.placeholder.com/800x400', 'Placeholder', contentBlocks.length)
        break
      case 'chart':
        newBlock = createChartBlock('bar', contentBlocks.length)
        break
      case 'code':
        newBlock = createCodeBlock('javascript', '', contentBlocks.length)
        break
      case 'divider':
        newBlock = createDividerBlock(contentBlocks.length)
        break
      case 'footnote_ref':
        newBlock = createFootnoteRefBlock('temp-id', contentBlocks.length + 1, contentBlocks.length)
        break
      case 'exhibit_ref':
        newBlock = createExhibitRefBlock('temp-id', `Exhibit ${String.fromCharCode(65 + contentBlocks.length)}`, contentBlocks.length)
        break
      default:
        return
    }

    setContentBlocks([...contentBlocks, newBlock])
    setShowBlockSelector(false)
  }

  // Update content block
  const handleBlockChange = (index: number, updatedBlock: ContentBlock) => {
    const newBlocks = [...contentBlocks]
    newBlocks[index] = updatedBlock
    setContentBlocks(newBlocks)
  }

  // Delete content block
  const handleBlockDelete = (index: number) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Report not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Section Sidebar */}
      <SectionSidebar
        sections={sections}
        currentSectionId={currentSectionId || undefined}
        onSectionSelect={setCurrentSectionId}
        onSectionCreate={handleSectionCreate}
        onSectionDelete={handleSectionDelete}
        onSectionReorder={handleSectionReorder}
        className="w-80 flex-shrink-0"
      />

      {/* Main Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            {currentSection && (
              <p className="text-sm text-gray-600 mt-1">
                Editing: {currentSection.title || currentSection.type}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveSection}
              disabled={isSaving}
              className={cn(
                'px-4 py-2 rounded font-medium transition-colors',
                isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-violet-600 text-white hover:bg-violet-700'
              )}
            >
              {isSaving ? 'Saving...' : 'Save Section'}
            </button>
            <button
              onClick={() => router.push(`/reports/${reportId}`)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Close Editor
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {!currentSection ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Select a section to start editing</p>
              <p className="text-sm text-gray-400 mt-2">
                Or create a new section using the sidebar
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Section Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <input
                  type="text"
                  value={currentSection.title || ''}
                  onChange={async (e) => {
                    const newTitle = e.target.value
                    setCurrentSection({ ...currentSection, title: newTitle })

                    // Auto-save title
                    try {
                      await fetch('/api/sections', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: currentSectionId,
                          title: newTitle
                        })
                      })
                      setSections(sections.map((s) => (s.id === currentSectionId ? { ...s, title: newTitle } : s)))
                    } catch (err) {
                      console.error('Failed to save title:', err)
                    }
                  }}
                  placeholder={`Enter ${currentSection.type} title...`}
                  className="text-3xl font-bold w-full border-none outline-none focus:ring-2 focus:ring-violet-500 rounded px-2"
                />
              </div>

              {/* Content Blocks */}
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 relative">
                {contentBlocks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No content blocks yet</p>
                    <button
                      onClick={() => setShowBlockSelector(true)}
                      className="px-6 py-3 bg-violet-600 text-white rounded hover:bg-violet-700"
                    >
                      + Add Your First Block
                    </button>
                  </div>
                ) : (
                  <>
                    {contentBlocks.map((block, index) => (
                      <div key={block.id} className="relative">
                        <ContentBlockRenderer
                          block={block}
                          editable={true}
                          onChange={(updatedBlock) => handleBlockChange(index, updatedBlock)}
                          onDelete={() => handleBlockDelete(index)}
                        />
                      </div>
                    ))}

                    {/* Add Block Button */}
                    <div className="relative">
                      {!showBlockSelector ? (
                        <button
                          onClick={() => setShowBlockSelector(true)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded hover:border-violet-500 hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors"
                        >
                          + Add Block
                        </button>
                      ) : (
                        <div className="flex justify-center">
                          <BlockSelector
                            onSelect={handleAddBlock}
                            onCancel={() => setShowBlockSelector(false)}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
