'use client';

import { useState, useEffect, useRef } from 'react';
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
  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    isMountedRef.current = true;
    let isSetupComplete = false;

    const setupListener = async () => {
      try {
        console.log('🔄 Setting up schedules listener...');
        
        if (!isMountedRef.current) return;
        
        // First try to get schedules once to test connection
        const schedulesRef = collection(db, 'schedules');
        const snapshot = await getDocs(schedulesRef);
        
        if (!isMountedRef.current) return;
        
        const initialSchedules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Schedule[];
        
        console.log('✅ Initial schedules fetch successful:', initialSchedules.length, 'schedules');
        setSchedules(initialSchedules);
        setLoading(false);
        
        // Now set up real-time listener
        const unsubscribe_temp = onSnapshot(schedulesRef, 
          (snapshot) => {
            if (!isMountedRef.current) return;
            
            const schedulesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Schedule[];
            
            console.log('📅 Real-time schedules update:', schedulesData.length, 'schedules');
            setSchedules(schedulesData);
            setError(null);
          },
          (error) => {
            if (!isMountedRef.current) return;
            
            console.error('❌ Real-time listener error:', error);
            setError(error.message);
          }
        );
        
        unsubscribeRef.current = unsubscribe_temp;
        isSetupComplete = true;
        
      } catch (error) {
        if (!isMountedRef.current) return;
        
        console.error('❌ Error setting up schedules:', error);
        setError(error instanceof Error ? error.message : 'Failed to load schedules');
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      isMountedRef.current = false;
      // Clean up listener (only once)
      if (unsubscribeRef.current && isSetupComplete) {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.warn('Error during schedules listener cleanup:', err);
        }
        unsubscribeRef.current = undefined;
      }
    };
  }, []);

  return { schedules, loading, error };
}