'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Teacher } from '@/lib/db'

export function useRealtimeTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'teachers'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const teachersData: Teacher[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          teachersData.push({
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            currentLesson: data.currentLesson,
            maxLessons: data.maxLessons,
            cardNumber: data.cardNumber,
            lessonPlan: data.lessonPlan,
            notes: data.notes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          })
        })
        setTeachers(teachersData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error listening to teachers:', err)
        setError('Failed to load teachers')
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  return { teachers, loading, error }
}
