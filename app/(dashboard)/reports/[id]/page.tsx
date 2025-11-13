import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !report) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/(dashboard)/reports"
            className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block"
          >
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold">{report.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Created {formatDate(report.created_at)}
            {report.updated_at !== report.created_at &&
              ` • Updated ${formatDate(report.updated_at)}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export PDF</Button>
          {!report.published && <Button>Publish</Button>}
        </div>
      </div>

      <div className="rounded-lg border p-8">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">This report is ready for content</p>
          <p className="text-sm">
            Section editor and AI assistance will be available in the next update
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
          <p className="text-lg">{report.published ? 'Published' : 'Draft'}</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Sections</h3>
          <p className="text-lg">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Citations</h3>
          <p className="text-lg">0</p>
        </div>
      </div>
    </div>
  )
}
