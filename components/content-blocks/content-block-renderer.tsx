'use client'

import { useState } from 'react'
import type { ContentBlock } from '@/types/content-blocks'
import { TiptapEditor } from '../editor/tiptap-editor'
import { cn } from '@/lib/utils'

interface ContentBlockRendererProps {
  block: ContentBlock
  editable?: boolean
  onChange?: (block: ContentBlock) => void
  onDelete?: () => void
  className?: string
}

export function ContentBlockRenderer({
  block,
  editable = true,
  onChange,
  onDelete,
  className
}: ContentBlockRendererProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleChange = (updates: Partial<ContentBlock>) => {
    if (onChange) {
      onChange({ ...block, ...updates } as ContentBlock)
    }
  }

  return (
    <div
      className={cn('relative group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Block controls (shown on hover) */}
      {editable && isHovered && (
        <div className="absolute -left-8 top-0 flex flex-col gap-1">
          <button
            onClick={onDelete}
            className="p-1 rounded bg-white border border-gray-300 hover:bg-red-50 hover:border-red-500 text-red-600"
            title="Delete block"
          >
            <TrashIcon />
          </button>
        </div>
      )}

      {/* Render specific block type */}
      {block.type === 'text' && (
        <TextBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'heading' && (
        <HeadingBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'list' && (
        <ListBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'table' && (
        <TableBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'quote' && (
        <QuoteBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'callout' && (
        <CalloutBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'image' && (
        <ImageBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'chart' && (
        <ChartBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'code' && (
        <CodeBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'divider' && <DividerBlockRenderer block={block} />}
      {block.type === 'footnote_ref' && (
        <FootnoteRefBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
      {block.type === 'exhibit_ref' && (
        <ExhibitRefBlockRenderer block={block} editable={editable} onChange={handleChange} />
      )}
    </div>
  )
}

// Individual block renderers
function TextBlockRenderer({ block, editable, onChange }: any) {
  if (!editable) {
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
  }

  return (
    <TiptapEditor
      content={block.content}
      onChange={(content) => onChange({ content })}
      editable={editable}
    />
  )
}

function HeadingBlockRenderer({ block, editable, onChange }: any) {
  const Tag = `h${block.level}` as keyof JSX.IntrinsicElements

  if (!editable) {
    return <Tag className="font-bold my-2">{block.text}</Tag>
  }

  return (
    <input
      type="text"
      value={block.text}
      onChange={(e) => onChange({ text: e.target.value })}
      className={cn(
        'w-full border-none outline-none focus:ring-2 focus:ring-violet-500 rounded px-2',
        block.level === 1 && 'text-4xl font-bold',
        block.level === 2 && 'text-3xl font-bold',
        block.level === 3 && 'text-2xl font-bold',
        block.level === 4 && 'text-xl font-bold',
        block.level === 5 && 'text-lg font-bold',
        block.level === 6 && 'text-base font-bold'
      )}
      placeholder="Enter heading..."
    />
  )
}

function ListBlockRenderer({ block, editable, onChange }: any) {
  const ListTag = block.listType === 'numbered' ? 'ol' : 'ul'

  return (
    <ListTag className={cn('my-2', block.listType === 'numbered' && 'list-decimal', block.listType === 'bullet' && 'list-disc', 'ml-6')}>
      {block.items.map((item: any, index: number) => (
        <li key={index} className="my-1">
          {editable ? (
            <input
              type="text"
              value={item.text}
              onChange={(e) => {
                const newItems = [...block.items]
                newItems[index] = { ...item, text: e.target.value }
                onChange({ items: newItems })
              }}
              className="w-full border-none outline-none focus:ring-2 focus:ring-violet-500 rounded px-2"
              placeholder="List item..."
            />
          ) : (
            <span>{item.text}</span>
          )}
        </li>
      ))}
      {editable && (
        <button
          onClick={() => onChange({ items: [...block.items, { text: '' }] })}
          className="text-sm text-violet-600 hover:text-violet-700 ml-2"
        >
          + Add item
        </button>
      )}
    </ListTag>
  )
}

function TableBlockRenderer({ block, editable, onChange }: any) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {block.headers.map((header: string, index: number) => (
              <th key={index} className="border border-gray-300 px-4 py-2 text-left">
                {editable ? (
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => {
                      const newHeaders = [...block.headers]
                      newHeaders[index] = e.target.value
                      onChange({ headers: newHeaders })
                    }}
                    className="w-full border-none outline-none bg-transparent"
                  />
                ) : (
                  header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row: string[], rowIndex: number) => (
            <tr key={rowIndex}>
              {row.map((cell: string, cellIndex: number) => (
                <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                  {editable ? (
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => {
                        const newRows = [...block.rows]
                        newRows[rowIndex][cellIndex] = e.target.value
                        onChange({ rows: newRows })
                      }}
                      className="w-full border-none outline-none"
                    />
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {editable && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onChange({ rows: [...block.rows, new Array(block.headers.length).fill('')] })}
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            + Add row
          </button>
        </div>
      )}
    </div>
  )
}

function QuoteBlockRenderer({ block, editable, onChange }: any) {
  return (
    <blockquote className="border-l-4 border-violet-500 pl-4 my-4 italic text-gray-700">
      {editable ? (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="w-full border-none outline-none focus:ring-2 focus:ring-violet-500 rounded px-2 bg-transparent resize-none"
          rows={3}
          placeholder="Enter quote..."
        />
      ) : (
        <p>{block.text}</p>
      )}
      {block.author && (
        <footer className="text-sm text-gray-600 mt-2">
          {editable ? (
            <input
              type="text"
              value={block.author}
              onChange={(e) => onChange({ author: e.target.value })}
              className="border-none outline-none bg-transparent"
              placeholder="Author"
            />
          ) : (
            `— ${block.author}`
          )}
        </footer>
      )}
    </blockquote>
  )
}

function CalloutBlockRenderer({ block, editable, onChange }: any) {
  const variants: Record<string, string> = {
    info: 'bg-blue-50 border-blue-500 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    success: 'bg-green-50 border-green-500 text-green-900',
    error: 'bg-red-50 border-red-500 text-red-900',
    note: 'bg-gray-50 border-gray-500 text-gray-900'
  }

  return (
    <div className={cn('border-l-4 p-4 my-4 rounded-r', variants[block.variant] || variants.info)}>
      {block.title && (
        <div className="font-semibold mb-2">
          {editable ? (
            <input
              type="text"
              value={block.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full border-none outline-none bg-transparent"
            />
          ) : (
            block.title
          )}
        </div>
      )}
      {editable ? (
        <textarea
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          className="w-full border-none outline-none bg-transparent resize-none"
          rows={2}
        />
      ) : (
        <p>{block.content}</p>
      )}
    </div>
  )
}

function ImageBlockRenderer({ block, editable, onChange }: any) {
  return (
    <figure className="my-4">
      <img
        src={block.url}
        alt={block.alt}
        className={cn('max-w-full h-auto rounded', block.alignment === 'center' && 'mx-auto', block.alignment === 'right' && 'ml-auto')}
      />
      {block.caption && (
        <figcaption className="text-sm text-gray-600 mt-2 text-center">
          {editable ? (
            <input
              type="text"
              value={block.caption}
              onChange={(e) => onChange({ caption: e.target.value })}
              className="w-full text-center border-none outline-none"
            />
          ) : (
            block.caption
          )}
        </figcaption>
      )}
    </figure>
  )
}

function ChartBlockRenderer({ block }: any) {
  return (
    <div className="my-4 p-4 bg-gray-50 rounded border border-gray-200">
      <p className="text-sm text-gray-600">Chart: {block.chartType}</p>
      <p className="text-xs text-gray-500">(Chart rendering will be implemented with Recharts)</p>
    </div>
  )
}

function CodeBlockRenderer({ block, editable, onChange }: any) {
  return (
    <div className="my-4">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
        {editable ? (
          <textarea
            value={block.code}
            onChange={(e) => onChange({ code: e.target.value })}
            className="w-full bg-transparent border-none outline-none font-mono text-sm resize-none"
            rows={5}
          />
        ) : (
          <code className="font-mono text-sm">{block.code}</code>
        )}
      </pre>
    </div>
  )
}

function DividerBlockRenderer({ block }: any) {
  const styles: Record<string, string> = {
    solid: 'border-t border-gray-300',
    dashed: 'border-t border-dashed border-gray-300',
    dotted: 'border-t border-dotted border-gray-300',
    thick: 'border-t-2 border-gray-400'
  }

  return <hr className={cn('my-6', styles[block.style || 'solid'] || styles.solid)} />
}

function FootnoteRefBlockRenderer({ block }: any) {
  return (
    <sup className="text-violet-600 font-medium cursor-pointer hover:underline">
      [{block.number}]
    </sup>
  )
}

function ExhibitRefBlockRenderer({ block }: any) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded bg-violet-100 text-violet-700 text-sm font-medium">
      {block.label}
    </span>
  )
}

// Icon
function TrashIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}
