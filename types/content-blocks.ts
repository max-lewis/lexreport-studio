// Content Block Types for LexReport Studio
// Based on the comprehensive specification

export type ContentBlockType =
  | 'text'
  | 'heading'
  | 'list'
  | 'table'
  | 'quote'
  | 'callout'
  | 'image'
  | 'chart'
  | 'code'
  | 'divider'
  | 'footnote_ref'
  | 'exhibit_ref'

export interface BaseContentBlock {
  id: string
  type: ContentBlockType
  order: number
}

export interface TextBlock extends BaseContentBlock {
  type: 'text'
  content: string // HTML from Tiptap
  alignment?: 'left' | 'center' | 'right' | 'justify'
}

export interface HeadingBlock extends BaseContentBlock {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
  anchorId?: string // For anchor links
}

export interface ListBlock extends BaseContentBlock {
  type: 'list'
  listType: 'bullet' | 'numbered' | 'checklist'
  items: {
    text: string
    checked?: boolean // For checklist
    children?: ListBlock['items'] // Nested lists
  }[]
}

export interface TableBlock extends BaseContentBlock {
  type: 'table'
  headers: string[]
  rows: string[][]
  caption?: string
  style?: {
    bordered?: boolean
    striped?: boolean
    compact?: boolean
  }
}

export interface QuoteBlock extends BaseContentBlock {
  type: 'quote'
  text: string
  author?: string
  source?: string
  citationId?: string // Link to citations table
}

export interface CalloutBlock extends BaseContentBlock {
  type: 'callout'
  variant: 'info' | 'warning' | 'success' | 'error' | 'note'
  title?: string
  content: string
  icon?: string
}

export interface ImageBlock extends BaseContentBlock {
  type: 'image'
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
  alignment?: 'left' | 'center' | 'right' | 'full'
  assetId?: string // Link to visual_assets table
}

export interface ChartBlock extends BaseContentBlock {
  type: 'chart'
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area'
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      color?: string
    }[]
  }
  title?: string
  caption?: string
  assetId?: string // Link to visual_assets table
}

export interface CodeBlock extends BaseContentBlock {
  type: 'code'
  language: string
  code: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  filename?: string
}

export interface DividerBlock extends BaseContentBlock {
  type: 'divider'
  style?: 'solid' | 'dashed' | 'dotted' | 'thick'
}

export interface FootnoteRefBlock extends BaseContentBlock {
  type: 'footnote_ref'
  footnoteId: string // Link to citations table
  number: number
}

export interface ExhibitRefBlock extends BaseContentBlock {
  type: 'exhibit_ref'
  exhibitId: string // Link to citations table
  label: string // e.g., "Exhibit A"
}

export type ContentBlock =
  | TextBlock
  | HeadingBlock
  | ListBlock
  | TableBlock
  | QuoteBlock
  | CalloutBlock
  | ImageBlock
  | ChartBlock
  | CodeBlock
  | DividerBlock
  | FootnoteRefBlock
  | ExhibitRefBlock

// Helper type guards
export function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === 'text'
}

export function isHeadingBlock(block: ContentBlock): block is HeadingBlock {
  return block.type === 'heading'
}

export function isListBlock(block: ContentBlock): block is ListBlock {
  return block.type === 'list'
}

export function isTableBlock(block: ContentBlock): block is TableBlock {
  return block.type === 'table'
}

export function isQuoteBlock(block: ContentBlock): block is QuoteBlock {
  return block.type === 'quote'
}

export function isCalloutBlock(block: ContentBlock): block is CalloutBlock {
  return block.type === 'callout'
}

export function isImageBlock(block: ContentBlock): block is ImageBlock {
  return block.type === 'image'
}

export function isChartBlock(block: ContentBlock): block is ChartBlock {
  return block.type === 'chart'
}

export function isCodeBlock(block: ContentBlock): block is CodeBlock {
  return block.type === 'code'
}

export function isDividerBlock(block: ContentBlock): block is DividerBlock {
  return block.type === 'divider'
}

export function isFootnoteRefBlock(block: ContentBlock): block is FootnoteRefBlock {
  return block.type === 'footnote_ref'
}

export function isExhibitRefBlock(block: ContentBlock): block is ExhibitRefBlock {
  return block.type === 'exhibit_ref'
}

// Factory functions
export function createTextBlock(content: string = '', order: number = 0): TextBlock {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    content,
    order
  }
}

export function createHeadingBlock(
  level: HeadingBlock['level'] = 2,
  text: string = '',
  order: number = 0
): HeadingBlock {
  return {
    id: crypto.randomUUID(),
    type: 'heading',
    level,
    text,
    order
  }
}

export function createListBlock(
  listType: ListBlock['listType'] = 'bullet',
  order: number = 0
): ListBlock {
  return {
    id: crypto.randomUUID(),
    type: 'list',
    listType,
    items: [{ text: '' }],
    order
  }
}

export function createTableBlock(order: number = 0): TableBlock {
  return {
    id: crypto.randomUUID(),
    type: 'table',
    headers: ['Column 1', 'Column 2'],
    rows: [['', '']],
    order
  }
}

export function createQuoteBlock(text: string = '', order: number = 0): QuoteBlock {
  return {
    id: crypto.randomUUID(),
    type: 'quote',
    text,
    order
  }
}

export function createCalloutBlock(
  variant: CalloutBlock['variant'] = 'info',
  content: string = '',
  order: number = 0
): CalloutBlock {
  return {
    id: crypto.randomUUID(),
    type: 'callout',
    variant,
    content,
    order
  }
}

export function createImageBlock(url: string, alt: string, order: number = 0): ImageBlock {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    url,
    alt,
    order
  }
}

export function createChartBlock(
  chartType: ChartBlock['chartType'] = 'bar',
  order: number = 0
): ChartBlock {
  return {
    id: crypto.randomUUID(),
    type: 'chart',
    chartType,
    data: {
      labels: ['Label 1', 'Label 2'],
      datasets: [
        {
          label: 'Dataset 1',
          data: [10, 20]
        }
      ]
    },
    order
  }
}

export function createCodeBlock(
  language: string = 'javascript',
  code: string = '',
  order: number = 0
): CodeBlock {
  return {
    id: crypto.randomUUID(),
    type: 'code',
    language,
    code,
    order
  }
}

export function createDividerBlock(order: number = 0): DividerBlock {
  return {
    id: crypto.randomUUID(),
    type: 'divider',
    order
  }
}

export function createFootnoteRefBlock(
  footnoteId: string,
  number: number,
  order: number = 0
): FootnoteRefBlock {
  return {
    id: crypto.randomUUID(),
    type: 'footnote_ref',
    footnoteId,
    number,
    order
  }
}

export function createExhibitRefBlock(
  exhibitId: string,
  label: string,
  order: number = 0
): ExhibitRefBlock {
  return {
    id: crypto.randomUUID(),
    type: 'exhibit_ref',
    exhibitId,
    label,
    order
  }
}
