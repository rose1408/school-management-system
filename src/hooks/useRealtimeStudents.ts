'use client'

import { useState, useEffect, useRef } from 'react'
import { Student } from '@/lib/db'
import { db as firestore, withRetry } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

export function useRealtimeStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const unsubscribeRef = useRef<(() => void) | undefined>()
  const connectionTimeoutRef = useRef<NodeJS.Timeout | undefined>()

  useEffect(() => {
    isMountedRef.current = true
    let isSetupComplete = false
    
    const setupListener = () => {
      try {
        const q = query(
          collection(firestore, 'students'),
          orderBy('createdAt', 'desc')
        )

        // Clear any existing timeout and set up new one
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
        }
        
        connectionTimeoutRef.current = setTimeout(() => {
          if (unsubscribeRef.current && isMountedRef.current && loading) {
            console.warn('⚠️ Students listener timed out after 30s, cleaning up...')
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
            
            const studentsData: Student[] = []
            querySnapshot.forEach((doc: any) => {
              const data = doc.data()
              studentsData.push({
                id: doc.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth,
                age: data.age,
                address: data.address,
                parentName: data.parentName,
                parentPhone: data.parentPhone,
                enrollmentDate: data.enrollmentDate,
                studentId: data.studentId,
                status: data.status,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              })
            })
            
            if (isMountedRef.current) {
              setStudents(studentsData)
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
            
            console.error('Error listening to students:', err)
            
            if (!isMountedRef.current) return
            
            // Check if it's a network error and suggest retry
            const isNetworkError = err?.code === 'unavailable' || 
                                 err?.message?.includes('network') ||
                                 err?.message?.includes('connection') ||
                                 err?.message?.includes('timeout')
            
            if (isNetworkError) {
              setError('Network connection issue. Check your internet connection.')
            } else {
              setError('Failed to load students')
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
        
        console.error('Error setting up students listener:', error)
        if (isMountedRef.current) {
          setError(`Failed to setup students listener: ${error.message}`)
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
          unsubscribeRef.current()
        } catch (err) {
          console.warn('Error during students listener cleanup:', err)
        }
        unsubscribeRef.current = undefined
      }
    }
  }, [])

  return { students, loading, error }
}
