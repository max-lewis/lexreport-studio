'use client'

import { PresenceUser } from '@/lib/realtime/presence'

interface PresenceAvatarsProps {
  users: PresenceUser[]
  maxDisplay?: number
}

export function PresenceAvatars({ users, maxDisplay = 5 }: PresenceAvatarsProps) {
  const displayUsers = users.slice(0, maxDisplay)
  const overflow = users.length - maxDisplay

  if (users.length === 0) {
    return null
  }

  return (
    <div className="flex items-center -space-x-2">
      {displayUsers.map((user) => (
        <div
          key={user.userId}
          className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: user.color }}
          title={`${user.userName} (${user.userEmail})`}
        >
          <span className="text-xs font-medium text-white">
            {user.userName.substring(0, 2).toUpperCase()}
          </span>

          {/* Active indicator */}
          <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white" />
        </div>
      ))}

      {overflow > 0 && (
        <div className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm">
          <span className="text-xs font-medium text-gray-600">+{overflow}</span>
        </div>
      )}
    </div>
  )
}
