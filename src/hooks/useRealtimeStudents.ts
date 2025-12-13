'use client'

import { useState, useEffect } from 'react'
import { Student } from '@/lib/db'
import { db as firestore, withRetry } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

export function useRealtimeStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const setupListener = () => {
      try {
        const q = query(
          collection(firestore, 'students'),
          orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(
          q,
          (querySnapshot: any) => {
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
            setStudents(studentsData)
            setLoading(false)
            setError(null)
          },
          (err: any) => {
            console.error('Error listening to students:', err)
            
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

        return unsubscribe
      } catch (error: any) {
        console.error('Error setting up students listener:', error)
        setError(`Failed to setup students listener: ${error.message}`)
        setLoading(false)
        return () => {} // Return empty cleanup function on error
      }
    }

    const unsubscribe = setupListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, [])

  return { students, loading, error }
}
