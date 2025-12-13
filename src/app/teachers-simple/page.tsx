'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Dynamic Firebase imports
let firestore: any = null;
let collection: any = null;
let getDocs: any = null;

async function initFirebaseIfNeeded() {
  if (!firestore) {
    const { db } = await import('@/lib/firebase');
    const firestoreModule = await import('firebase/firestore');
    
    firestore = db;
    collection = firestoreModule.collection;
    getDocs = firestoreModule.getDocs;
  }
}

export default function SimpleTeachersTest() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔍 Loading teachers and schedules...');
      
      await initFirebaseIfNeeded();
      
      // Load teachers
      const teachersSnapshot = await getDocs(collection(firestore, 'teachers'));
      const teachersData = teachersSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Load schedules  
      const schedulesSnapshot = await getDocs(collection(firestore, 'schedules'));
      const schedulesData = schedulesSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Loaded:', teachersData.length, 'teachers,', schedulesData.length, 'schedules');
      
      setTeachers(teachersData);
      setSchedules(schedulesData);
      setLoading(false);
      
    } catch (err) {
      console.error('❌ Loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  };

  const getTeacherSchedules = (teacherId: string) => {
    return schedules.filter(schedule => schedule.teacherId === teacherId);
  };

  if (loading) {
    return <div style={{ padding: '20px', fontSize: '20px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', fontSize: '20px' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#ffff00', padding: '20px', marginBottom: '20px', border: '3px solid #ff0000' }}>
        <h1 style={{ color: '#ff0000', fontSize: '24px' }}>🚨 SIMPLE TEACHERS TEST - WORKING VERSION</h1>
        <p>Teachers: {teachers.length} | Schedules: {schedules.length}</p>
        <button onClick={loadData} style={{ 
          backgroundColor: '#007bff', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none',
          borderRadius: '5px',
          marginRight: '10px'
        }}>
          Reload Data
        </button>
        <Link href="/teachers" style={{ 
          backgroundColor: '#28a745', 
          color: 'white', 
          padding: '10px 20px', 
          textDecoration: 'none',
          borderRadius: '5px'
        }}>
          Back to Teachers
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {teachers.map(teacher => {
          const teacherSchedules = getTeacherSchedules(teacher.id);
          return (
            <div key={teacher.id} style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#333', marginBottom: '10px' }}>
                {teacher.firstName} {teacher.lastName}
              </h3>
              <p><strong>Instrument:</strong> {teacher.instrument}</p>
              <p><strong>Email:</strong> {teacher.email}</p>
              <p><strong>Phone:</strong> {teacher.phone}</p>
              <p><strong>Schedules:</strong> {teacherSchedules.length}</p>
              
              {teacherSchedules.length > 0 && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <h4 style={{ color: '#007bff' }}>Schedules:</h4>
                  {teacherSchedules.map((schedule, index) => (
                    <div key={schedule.id || index} style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '10px', 
                      marginBottom: '10px',
                      borderRadius: '5px'
                    }}>
                      <p><strong>Student:</strong> {schedule.studentName}</p>
                      <p><strong>Day:</strong> {schedule.day} at {schedule.time}</p>
                      <p><strong>Room:</strong> {schedule.room}</p>
                      <p><strong>Card:</strong> {schedule.studentCardNumber}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}