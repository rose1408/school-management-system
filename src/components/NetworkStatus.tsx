'use client'

import { useState, useEffect } from 'react'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
      console.log('🟢 Network connection restored')
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      console.log('🔴 Network connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-hide offline message after going back online
  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showOfflineMessage])

  if (!showOfflineMessage && isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!isOnline ? (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            You're offline. Some features may not work until connection is restored.
          </div>
        </div>
      ) : showOfflineMessage ? (
        <div className="bg-green-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Connection restored! You're back online.
          </div>
        </div>
      ) : null}
    </div>
  )
}