'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
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
      const q = query(collection(db, 'schedules'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const schedulesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Schedule[];
          
          console.log('📅 Real-time schedules update:', schedulesData.length, 'schedules loaded');
          setSchedules(schedulesData);
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