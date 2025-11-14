'use client'

import { Wifi, WifiOff, Users, Clock } from 'lucide-react'
import { PresenceAvatars } from './presence-avatars'
import { PresenceUser } from '@/lib/realtime/presence'

interface CollaborationBarProps {
  isConnected: boolean
  activeUsers: PresenceUser[]
  usersInSection: PresenceUser[]
  lastSync: number | null
}

export function CollaborationBar({
  isConnected,
  activeUsers,
  usersInSection,
  lastSync,
}: CollaborationBarProps) {
  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never'

    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    if (seconds < 10) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-200">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-600">Disconnected</span>
          </>
        )}
      </div>

      {/* Active Users in Report */}
      {activeUsers.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">{activeUsers.length} online</span>
          <PresenceAvatars users={activeUsers} maxDisplay={3} />
        </div>
      )}

      {/* Users in Current Section */}
      {usersInSection.length > 0 && (
        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
          <span className="text-sm text-violet-600">{usersInSection.length} editing this section</span>
          <PresenceAvatars users={usersInSection} maxDisplay={3} />
        </div>
      )}

      {/* Last Sync Time */}
      <div className="flex items-center gap-2 ml-auto text-gray-500">
        <Clock className="w-4 h-4" />
        <span className="text-xs">Last sync: {formatLastSync(lastSync)}</span>
      </div>
    </div>
  )
}
