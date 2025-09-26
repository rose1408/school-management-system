'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Schedule {
  id: string;
  teacherId: string;
  teacherName: string;
  studentName: string;
  studentCardNumber: string;
  instrument: string;
  level: string;
  day: string;
  time: string;
  duration: string;
  lessonNumber: string;
  room: string;
  isActive: boolean;
  startDate: string;
  createdAt?: any;
  updatedAt?: any;
}

export function useRealtimeSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Simple query without orderBy to avoid index issues
      const schedulesRef = collection(db, 'schedules');
      
      const unsubscribe = onSnapshot(schedulesRef, 
        (snapshot) => {
          const schedulesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Schedule[];
          
          // Sort on client side by createdAt if available, then by id
          const sortedSchedules = schedulesData.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return b.createdAt.seconds - a.createdAt.seconds;
            }
            return b.id.localeCompare(a.id);
          });
          
          console.log('📅 Real-time schedules update:', sortedSchedules.length, 'schedules loaded');
          console.log('📋 Schedule data:', sortedSchedules);
          setSchedules(sortedSchedules);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error('❌ Error fetching schedules:', error);
          setError(error.message);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up schedules listener:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to schedules');
      setLoading(false);
    }
  }, []);

  return { schedules, loading, error };
}