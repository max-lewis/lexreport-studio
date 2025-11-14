// React Hook for Real-time Presence

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PresenceManager, PresenceUser, PresenceState } from '@/lib/realtime/presence'

interface UseRealtimePresenceOptions {
  reportId: string
  userId: string
  userName: string
  userEmail: string
  sectionId?: string | null
}

export function useRealtimePresence({
  reportId,
  userId,
  userName,
  userEmail,
  sectionId,
}: UseRealtimePresenceOptions) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const [usersInSection, setUsersInSection] = useState<PresenceUser[]>([])
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([])

  const managerRef = useRef<PresenceManager | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`report:${reportId}:presence`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    const manager = new PresenceManager(reportId, userId, userName, userEmail)
    managerRef.current = manager

    manager.join(channel, (state) => {
      setPresenceState(state)

      if (sectionId) {
        setUsersInSection(manager.getUsersInSection(sectionId, state))
      }

      setActiveUsers(manager.getActiveUsers(state))
    })

    return () => {
      manager.leave()
      channel.unsubscribe()
    }
  }, [reportId, userId, userName, userEmail])

  // Update section when it changes
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateSection(sectionId || null)

      if (sectionId) {
        setUsersInSection(
          managerRef.current.getUsersInSection(sectionId, presenceState)
        )
      } else {
        setUsersInSection([])
      }
    }
  }, [sectionId, presenceState])

  const updateCursor = (blockIndex: number, offset: number) => {
    managerRef.current?.updateCursor(blockIndex, offset)
  }

  return {
    presenceState,
    usersInSection,
    activeUsers,
    updateCursor,
  }
}
