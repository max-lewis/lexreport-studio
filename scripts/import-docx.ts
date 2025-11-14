#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import mammoth from 'mammoth'
import { createClient } from '@supabase/supabase-js'
import type { ContentBlock } from '../types/content-blocks'
import { createTextBlock, createHeadingBlock } from '../types/content-blocks'

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

// Use service role key to bypass RLS for import
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ParsedSection {
  title: string
  type: string
  content: string[]
  level: number
}

async function parseDocx(filePath: string): Promise<{ title: string; sections: ParsedSection[] }> {
  console.log('📄 Reading DOCX file...')

  const buffer = fs.readFileSync(filePath)
  const result = await mammoth.convertToHtml({ buffer })

  // Parse HTML to extract sections
  const html = result.value
  const sections: ParsedSection[] = []

  // Extract title from first h1 or use filename
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/)
  const reportTitle = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
    : path.basename(filePath, '.docx')

  // Split by headings
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi
  let lastIndex = 0
  let match
  let currentSection: ParsedSection | null = null

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const title = match[2].replace(/<[^>]+>/g, '').trim()

    // Save previous section's content
    if (currentSection) {
      const content = html
        .substring(lastIndex, match.index)
        .split(/<\/p>|<br\s*\/?>/)
        .map(p => p.replace(/<[^>]+>/g, '').trim())
        .filter(p => p.length > 0)

      currentSection.content = content
      sections.push(currentSection)
    }

    // Determine section type based on title
    let sectionType = 'custom'
    const lowerTitle = title.toLowerCase()

    if (lowerTitle.includes('introduction')) sectionType = 'introduction'
    else if (lowerTitle.includes('executive summary')) sectionType = 'executive_summary'
    else if (lowerTitle.includes('background')) sectionType = 'background'
    else if (lowerTitle.includes('analysis')) sectionType = 'analysis'
    else if (lowerTitle.includes('findings')) sectionType = 'findings'
    else if (lowerTitle.includes('discussion')) sectionType = 'discussion'
    else if (lowerTitle.includes('methodology')) sectionType = 'methodology'
    else if (lowerTitle.includes('recommendations')) sectionType = 'recommendations'
    else if (lowerTitle.includes('conclusion')) sectionType = 'conclusion'
    else if (lowerTitle.includes('appendix')) sectionType = 'appendix'
    else if (lowerTitle.includes('references')) sectionType = 'references'
    else if (lowerTitle.includes('glossary')) sectionType = 'glossary'

    currentSection = { title, type: sectionType, content: [], level }
    lastIndex = headingRegex.lastIndex
  }

  // Don't forget the last section
  if (currentSection) {
    const content = html
      .substring(lastIndex)
      .split(/<\/p>|<br\s*\/?>/)
      .map(p => p.replace(/<[^>]+>/g, '').trim())
      .filter(p => p.length > 0)

    currentSection.content = content
    sections.push(currentSection)
  }

  console.log(`✅ Parsed ${sections.length} sections from document`)

  return { title: reportTitle, sections }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

async function importToSupabase(
  reportTitle: string,
  sections: ParsedSection[],
  userId?: string
): Promise<void> {
  console.log('📊 Creating report in Supabase...')

  // Create report
  const { data: report, error: reportError} = await supabase
    .from('reports')
    .insert({
      title: reportTitle,
      slug: generateSlug(reportTitle),
      created_by: userId || '00000000-0000-0000-0000-000000000000', // System user if not specified
      meta: {
        imported_from: 'docx',
        import_date: new Date().toISOString(),
      },
    })
    .select()
    .single()

  if (reportError) {
    console.error('❌ Failed to create report:', reportError)
    throw reportError
  }

  console.log(`✅ Created report: ${report.id}`)
  console.log(`📝 Importing ${sections.length} sections...`)

  // Create sections with content blocks
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]

    // Convert content to content blocks
    const contentBlocks: ContentBlock[] = []

    // Add section title as heading block
    contentBlocks.push(createHeadingBlock(section.level, section.title, 0))

    // Add content paragraphs as text blocks
    section.content.forEach((paragraph, idx) => {
      if (paragraph.trim()) {
        contentBlocks.push(createTextBlock(paragraph, contentBlocks.length))
      }
    })

    const { error: sectionError } = await supabase
      .from('sections')
      .insert({
        report_id: report.id,
        type: section.type,
        title: section.title,
        order_index: i,
        content_blocks: contentBlocks as any,
      })

    if (sectionError) {
      console.error(`❌ Failed to create section "${section.title}":`, sectionError)
    } else {
      console.log(`  ✅ Imported section ${i + 1}/${sections.length}: ${section.title}`)
    }
  }

  console.log('\n🎉 Import complete!')
  console.log(`\n📖 Report URL: http://localhost:3000/reports/${report.id}`)
}

async function getUserId(): Promise<string | null> {
  // Try to get first user from auth.users table
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })

  if (error || !data || data.users.length === 0) {
    console.log('⚠️  No users found in Supabase Auth.')
    console.log('   Please sign up at http://localhost:3000/signup first')
    return null
  }

  return data.users[0].id
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: tsx scripts/import-docx.ts <path-to-docx-file> [user-id]')
    process.exit(1)
  }

  const filePath = args[0]
  let userId = args[1]

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    process.exit(1)
  }

  // If no user ID provided, try to get one
  if (!userId) {
    userId = await getUserId() || undefined
    if (!userId) {
      process.exit(1)
    }
    console.log(`✅ Using user ID: ${userId}`)
  }

  try {
    const { title, sections } = await parseDocx(filePath)
    await importToSupabase(title, sections, userId)
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

main()
