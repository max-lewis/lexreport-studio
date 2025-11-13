import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    // Verify user has access to this report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, created_by, published')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.created_by !== user.id && !report.published) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get sections for this report
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('report_id', reportId)
      .order('order_index', { ascending: true })

    if (sectionsError) {
      return NextResponse.json({ error: sectionsError.message }, { status: 500 })
    }

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('GET /api/sections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, type, title, parentId, orderIndex } = body

    if (!reportId || !type) {
      return NextResponse.json(
        { error: 'reportId and type are required' },
        { status: 400 }
      )
    }

    // Verify user owns this report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, created_by')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If orderIndex not provided, append to end
    let finalOrderIndex = orderIndex
    if (typeof finalOrderIndex !== 'number') {
      const { data: lastSection } = await supabase
        .from('sections')
        .select('order_index')
        .eq('report_id', reportId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      finalOrderIndex = lastSection ? lastSection.order_index + 1 : 0
    }

    // Create section
    const { data: section, error: insertError } = await supabase
      .from('sections')
      .insert({
        report_id: reportId,
        type,
        title,
        parent_id: parentId || null,
        order_index: finalOrderIndex,
        content_blocks: []
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ section }, { status: 201 })
  } catch (error) {
    console.error('POST /api/sections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, type, contentBlocks, styleOverrides, interactionHints, locked } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify user owns the report this section belongs to
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('id, report_id, reports!inner(created_by)')
      .eq('id', id)
      .single()

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    const report = (section as any).reports
    if (report.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update section
    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (type !== undefined) updates.type = type
    if (contentBlocks !== undefined) updates.content_blocks = contentBlocks
    if (styleOverrides !== undefined) updates.style_overrides = styleOverrides
    if (interactionHints !== undefined) updates.interaction_hints = interactionHints
    if (locked !== undefined) updates.locked = locked

    const { data: updatedSection, error: updateError } = await supabase
      .from('sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ section: updatedSection })
  } catch (error) {
    console.error('PUT /api/sections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify user owns the report this section belongs to
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('id, report_id, reports!inner(created_by)')
      .eq('id', id)
      .single()

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    const report = (section as any).reports
    if (report.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete section (cascade will handle child sections)
    const { error: deleteError } = await supabase
      .from('sections')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/sections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
