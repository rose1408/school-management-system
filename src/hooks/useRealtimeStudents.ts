'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Student } from '@/lib/db'

export function useRealtimeStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'students'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const studentsData: Student[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          studentsData.push({
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            age: data.age,
            enrollmentDate: data.enrollmentDate,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          })
        })
        setStudents(studentsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error listening to students:', err)
        setError('Failed to load students')
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  return { students, loading, error }
}
