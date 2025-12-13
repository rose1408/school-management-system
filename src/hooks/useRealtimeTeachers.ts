'use client'

import { useState, useEffect, useCallback } from 'react'
import { Teacher } from '@/lib/db'
import { db as firestore, withRetry } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export function useRealtimeTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshTeachers = useCallback(() => {
    console.log('Forcing teachers refresh...')
    setLoading(true)
    setError(null)
    setRefreshKey(prev => prev + 1)
  }, [])

  useEffect(() => {
    console.log('Setting up teachers listener, refreshKey:', refreshKey)
    setLoading(true)
    
    // Setup Firestore listener
    const setupListener = () => {
      try {
        
        // Simple collection query
        const q = collection(firestore, 'teachers')

        const unsubscribe = onSnapshot(
          q,
          (querySnapshot: any) => {
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
            setTeachers(teachersData)
            setLoading(false)
            setError(null)
          },
          (err: any) => {
            console.error('Error listening to teachers:', err)
            
            // Check if it's a network error and suggest retry
            const isNetworkError = err?.code === 'unavailable' || 
                                 err?.message?.includes('network') ||
                                 err?.message?.includes('connection') ||
                                 err?.message?.includes('timeout')
            
            if (isNetworkError) {
              setError('Network connection issue. Check your internet connection and try refreshing.')
              // Auto-retry after a delay for network errors
              setTimeout(() => {
                console.log('Auto-retrying teachers listener due to network error...')
                refreshTeachers()
              }, 5000)
            } else {
              setError(`Failed to load teachers: ${err.message}`)
            }
            setLoading(false)
          }
        )

        // Return cleanup function
        return unsubscribe
      } catch (error: any) {
        console.error('Error setting up teachers listener:', error)
        setError(`Failed to setup teachers listener: ${error.message}`)
        setLoading(false)
        return () => {} // Return empty cleanup function on error
      }
    }

    const unsubscribe = setupListener();
    
    return () => {
      if (unsubscribe) {
        console.log('Cleaning up teachers listener')
        unsubscribe()
      }
    }
  }, [refreshKey])

  return { teachers, loading, error, refreshTeachers }
}
