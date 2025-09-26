'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
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
    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        console.log('🔄 Setting up schedules listener...');
        
        // First try to get schedules once to test connection
        const schedulesRef = collection(db, 'schedules');
        const snapshot = await getDocs(schedulesRef);
        
        const initialSchedules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Schedule[];
        
        console.log('✅ Initial schedules fetch successful:', initialSchedules.length, 'schedules');
        setSchedules(initialSchedules);
        setLoading(false);
        
        // Now set up real-time listener
        unsubscribe = onSnapshot(schedulesRef, 
          (snapshot) => {
            const schedulesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Schedule[];
            
            console.log('📅 Real-time schedules update:', schedulesData.length, 'schedules');
            setSchedules(schedulesData);
            setError(null);
          },
          (error) => {
            console.error('❌ Real-time listener error:', error);
            setError(error.message);
          }
        );
        
      } catch (error) {
        console.error('❌ Error setting up schedules:', error);
        setError(error instanceof Error ? error.message : 'Failed to load schedules');
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { schedules, loading, error };
}