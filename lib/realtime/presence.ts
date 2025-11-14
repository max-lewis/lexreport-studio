// Real-time Presence Management using Supabase Realtime

import { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceUser {
  userId: string
  userName: string
  userEmail: string
  sectionId: string | null
  cursorPosition?: {
    blockIndex: number
    offset: number
  }
  color: string // Assigned color for this user's cursor/highlight
  lastSeen: number
}

export interface PresenceState {
  [userId: string]: PresenceUser[]
}

// Generate a consistent color for a user based on their ID
export function getUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
  ]

  // Use hash of userId to consistently assign color
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

export class PresenceManager {
  private channel: RealtimeChannel | null = null
  private currentUser: PresenceUser | null = null
  private onPresenceChange: ((state: PresenceState) => void) | null = null

  constructor(
    private reportId: string,
    private userId: string,
    private userName: string,
    private userEmail: string
  ) {}

  async join(channel: RealtimeChannel, onPresenceChange: (state: PresenceState) => void) {
    this.channel = channel
    this.onPresenceChange = onPresenceChange

    this.currentUser = {
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
      sectionId: null,
      color: getUserColor(this.userId),
      lastSeen: Date.now(),
    }

    // Track presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>()
        this.onPresenceChange?.(state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })

    // Track our presence
    await channel.track(this.currentUser)
  }

  async updateSection(sectionId: string | null) {
    if (this.currentUser && this.channel) {
      this.currentUser.sectionId = sectionId
      this.currentUser.lastSeen = Date.now()
      await this.channel.track(this.currentUser)
    }
  }

  async updateCursor(blockIndex: number, offset: number) {
    if (this.currentUser && this.channel) {
      this.currentUser.cursorPosition = { blockIndex, offset }
      this.currentUser.lastSeen = Date.now()
      await this.channel.track(this.currentUser)
    }
  }

  async leave() {
    if (this.channel) {
      await this.channel.untrack()
      this.channel = null
      this.currentUser = null
    }
  }

  getUsersInSection(sectionId: string, presenceState: PresenceState): PresenceUser[] {
    const users: PresenceUser[] = []

    Object.values(presenceState).forEach(presences => {
      presences.forEach(presence => {
        if (presence.sectionId === sectionId && presence.userId !== this.userId) {
          users.push(presence)
        }
      })
    })

    return users
  }

  getActiveUsers(presenceState: PresenceState): PresenceUser[] {
    const users: PresenceUser[] = []
    const now = Date.now()
    const ACTIVE_THRESHOLD = 30000 // 30 seconds

    Object.values(presenceState).forEach(presences => {
      presences.forEach(presence => {
        if (
          presence.userId !== this.userId &&
          now - presence.lastSeen < ACTIVE_THRESHOLD
        ) {
          users.push(presence)
        }
      })
    })

    return users
  }
}
