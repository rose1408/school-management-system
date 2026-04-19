'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Teacher } from '@/lib/db'
import { db as firestore, withRetry } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export function useRealtimeTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const isMountedRef = useRef(true)
  const unsubscribeRef = useRef<(() => void) | undefined>()
  const connectionTimeoutRef = useRef<NodeJS.Timeout | undefined>()

  const refreshTeachers = useCallback(() => {
    console.log('Forcing teachers refresh...')
    setLoading(true)
    setError(null)
    setRefreshKey(prev => prev + 1)
  }, [])

  useEffect(() => {
    console.log('Setting up teachers listener, refreshKey:', refreshKey)
    isMountedRef.current = true
    let isSetupComplete = false
    
    setLoading(true)
    
    // Setup Firestore listener
    const setupListener = () => {
      try {
        // Simple collection query
        const q = collection(firestore, 'teachers')

        // Clear any existing timeout and set up new one
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
        }
        
        connectionTimeoutRef.current = setTimeout(() => {
          if (unsubscribeRef.current && isMountedRef.current && loading) {
            console.warn('⚠️ Teachers listener timed out after 30s, cleaning up...')
            unsubscribeRef.current()
            unsubscribeRef.current = undefined
            if (isMountedRef.current) {
              setError('Connection timeout. Please refresh to retry.')
              setLoading(false)
            }
          }
        }, 30000)

        const unsubscribe_temp = onSnapshot(
          q,
          (querySnapshot: any) => {
            // Clear timeout on successful data
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current)
              connectionTimeoutRef.current = undefined
            }
            
            if (!isMountedRef.current) return
            
            console.log('Teachers snapshot received, count:', querySnapshot.size)
            const teachersData: Teacher[] = []
            querySnapshot.forEach((doc: any) => {
              const data = doc.data()
              console.log('Processing teacher doc:', doc.id, data)
              teachersData.push({
                id: doc.id,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                phone: data.phone || '',
                instrument: data.instrument || '',
                address: data.address || '',
                dateOfBirth: data.dateOfBirth || '',
                age: data.age || '',
                zipCode: data.zipCode || '',
                tinNumber: data.tinNumber || '',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              })
            })
            
            // Simple sort by name
            teachersData.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''))
            
            console.log('Final processed teachers:', teachersData)
            if (isMountedRef.current) {
              setTeachers(teachersData)
              setLoading(false)
              setError(null)
            }
          },
          (err: any) => {
            // Clear timeout on error
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current)
              connectionTimeoutRef.current = undefined
            }
            
            console.error('Error listening to teachers:', err)
            
            if (!isMountedRef.current) return
            
            // Check if it's a network error and suggest retry
            const isNetworkError = err?.code === 'unavailable' || 
                                 err?.message?.includes('network') ||
                                 err?.message?.includes('connection') ||
                                 err?.message?.includes('timeout')
            
            if (isNetworkError) {
              setError('Network connection issue. Check your internet connection and try refreshing.')
            } else {
              setError(`Failed to load teachers: ${err.message}`)
            }
            setLoading(false)
          }
        )
        
        unsubscribeRef.current = unsubscribe_temp
        isSetupComplete = true
      } catch (error: any) {
        // Clear timeout on error
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = undefined
        }
        
        console.error('Error setting up teachers listener:', error)
        if (isMountedRef.current) {
          setError(`Failed to setup teachers listener: ${error.message}`)
          setLoading(false)
        }
      }
    }

    setupListener();
    
    return () => {
      isMountedRef.current = false
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = undefined
      }
      
      // Clean up listener (only once)
      if (unsubscribeRef.current && isSetupComplete) {
        try {
          console.log('Cleaning up teachers listener')
          unsubscribeRef.current()
        } catch (err) {
          console.warn('Error during teachers listener cleanup:', err)
        }
        unsubscribeRef.current = undefined
      }
    }
  }, [refreshKey])

  return { teachers, loading, error, refreshTeachers }
}
