// React Hook for Real-time Content Synchronization

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SyncManager, ContentChangePayload, ConflictResolver } from '@/lib/realtime/sync'
import type { ContentBlock } from '@/types/content-blocks'

interface UseRealtimeSyncOptions {
  reportId: string
  userId: string
  sectionId: string | null
  onRemoteChange: (sectionId: string, contentBlocks: ContentBlock[]) => void
}

export function useRealtimeSync({
  reportId,
  userId,
  sectionId,
  onRemoteChange,
}: UseRealtimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)

  const managerRef = useRef<SyncManager | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`report:${reportId}:sync`)

    const manager = new SyncManager(reportId, userId)
    managerRef.current = manager

    manager.subscribe(channel, (payload: ContentChangePayload) => {
      // Ignore our own changes
      if (payload.userId === userId) {
        return
      }

      // Only process changes for current section or notify about others
      if (!sectionId || payload.sectionId === sectionId) {
        onRemoteChange(payload.sectionId, payload.contentBlocks)
        setLastSync(payload.timestamp)
      }
    })

    setIsConnected(true)

    return () => {
      manager.unsubscribe()
      channel.unsubscribe()
      setIsConnected(false)
    }
  }, [reportId, userId, sectionId, onRemoteChange])

  const broadcastChange = async (sectionId: string, contentBlocks: ContentBlock[]) => {
    if (managerRef.current) {
      await managerRef.current.broadcastChange(sectionId, contentBlocks)
    }
  }

  return {
    isConnected,
    lastSync,
    broadcastChange,
    ConflictResolver,
  }
}
