import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all reports if no user, or user's reports if logged in
  let query = supabase
    .from('reports')
    .select('*')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  if (user) {
    query = query.eq('created_by', user.id)
  }

  const { data: reports, error } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Reports</h1>
        <Link href="/reports/new">
          <Button>Create Report</Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-sm text-destructive">Error loading reports: {error.message}</p>
        </div>
      )}

      {reports && reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">You haven't created any reports yet.</p>
          <Link href="/reports/new">
            <Button>Create your first report</Button>
          </Link>
        </div>
      )}

      {reports && reports.length > 0 && (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block p-6 rounded-lg border hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Updated {formatDate(report.updated_at)}
                  </p>
                </div>
                {report.published && (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Published
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
