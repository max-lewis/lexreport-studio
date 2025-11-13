import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, sectionOrders } = body

    if (!reportId || !Array.isArray(sectionOrders)) {
      return NextResponse.json(
        { error: 'reportId and sectionOrders array are required' },
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

    // Update each section's order_index
    // sectionOrders format: [{ id: 'uuid', orderIndex: 0 }, ...]
    const updates = sectionOrders.map(({ id, orderIndex }) =>
      supabase
        .from('sections')
        .update({ order_index: orderIndex })
        .eq('id', id)
        .eq('report_id', reportId) // Additional safety check
    )

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Failed to reorder some sections', details: errors },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/sections/reorder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
