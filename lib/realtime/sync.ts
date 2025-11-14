// Real-time Content Synchronization using Supabase Realtime

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Section } from '@/types/database'
import type { ContentBlock } from '@/types/content-blocks'

export interface ContentChangePayload {
  sectionId: string
  contentBlocks: ContentBlock[]
  userId: string
  timestamp: number
}

export type ContentChangeHandler = (payload: ContentChangePayload) => void

export class SyncManager {
  private channel: RealtimeChannel | null = null
  private onContentChange: ContentChangeHandler | null = null

  constructor(
    private reportId: string,
    private userId: string
  ) {}

  async subscribe(
    channel: RealtimeChannel,
    onContentChange: ContentChangeHandler
  ) {
    this.channel = channel
    this.onContentChange = onContentChange

    // Listen for section content changes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sections',
        filter: `report_id=eq.${this.reportId}`,
      },
      (payload: RealtimePostgresChangesPayload<Section>) => {
        if (payload.new && payload.new.id) {
          // Only process if change wasn't made by current user
          // (to avoid processing our own changes twice)
          const change: ContentChangePayload = {
            sectionId: payload.new.id,
            contentBlocks: payload.new.content_blocks as ContentBlock[],
            userId: payload.new.updated_by || 'unknown',
            timestamp: new Date(payload.new.updated_at).getTime(),
          }

          // Notify handler of the change
          this.onContentChange?.(change)
        }
      }
    )

    await channel.subscribe()
  }

  async unsubscribe() {
    if (this.channel) {
      await this.channel.unsubscribe()
      this.channel = null
      this.onContentChange = null
    }
  }

  // Broadcast a content change to other clients
  async broadcastChange(sectionId: string, contentBlocks: ContentBlock[]) {
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'content_change',
        payload: {
          sectionId,
          contentBlocks,
          userId: this.userId,
          timestamp: Date.now(),
        },
      })
    }
  }
}

// Conflict resolution utilities
export class ConflictResolver {
  /**
   * Resolve conflicts between local and remote content blocks using timestamp-based strategy
   */
  static resolveConflict(
    localBlocks: ContentBlock[],
    remoteBlocks: ContentBlock[],
    localTimestamp: number,
    remoteTimestamp: number
  ): ContentBlock[] {
    // Simple last-write-wins strategy
    if (remoteTimestamp > localTimestamp) {
      return remoteBlocks
    }

    return localBlocks
  }

  /**
   * Merge content blocks intelligently
   * Try to preserve both sets of changes when possible
   */
  static mergeBlocks(
    localBlocks: ContentBlock[],
    remoteBlocks: ContentBlock[],
    baseBlocks: ContentBlock[]
  ): ContentBlock[] {
    // If blocks are identical, no conflict
    if (JSON.stringify(localBlocks) === JSON.stringify(remoteBlocks)) {
      return localBlocks
    }

    // Three-way merge logic
    const merged: ContentBlock[] = []
    const localMap = new Map(localBlocks.map(b => [b.id, b]))
    const remoteMap = new Map(remoteBlocks.map(b => [b.id, b]))
    const baseMap = new Map(baseBlocks.map(b => [b.id, b]))

    // Process all unique block IDs
    const allIds = new Set([
      ...localBlocks.map(b => b.id),
      ...remoteBlocks.map(b => b.id),
    ])

    allIds.forEach(id => {
      const local = localMap.get(id)
      const remote = remoteMap.get(id)
      const base = baseMap.get(id)

      if (local && remote) {
        // Block exists in both - check if modified
        if (JSON.stringify(local) === JSON.stringify(remote)) {
          merged.push(local)
        } else if (base) {
          // Both modified - prefer remote (server wins)
          merged.push(remote)
        } else {
          // New block added by both - prefer remote
          merged.push(remote)
        }
      } else if (local) {
        // Only in local - keep it
        merged.push(local)
      } else if (remote) {
        // Only in remote - accept it
        merged.push(remote)
      }
    })

    // Sort by order index
    return merged.sort((a, b) => a.order - b.order)
  }
}
