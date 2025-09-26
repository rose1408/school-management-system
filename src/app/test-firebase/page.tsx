'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';

// Simple, direct Firebase connection test
export default function ScheduleTest() {
  const [status, setStatus] = useState('Testing...');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('Connecting to Firebase...');
      console.log('🔍 Testing Firebase connection directly');
      
      // Import Firebase functions dynamically
      const { collection, getDocs } = await import('firebase/firestore');
      
      console.log('🔍 DB object:', db);
      console.log('🔍 Attempting to fetch schedules...');
      
      const snapshot = await getDocs(collection(db, 'schedules'));
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Success! Found schedules:', schedulesData);
      setSchedules(schedulesData);
      setStatus(`SUCCESS: Found ${schedulesData.length} schedules`);
      setError('');
      
    } catch (err) {
      console.error('❌ Firebase test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('FAILED');
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f8ff', border: '2px solid #0066cc', margin: '20px' }}>
      <h1 style={{ color: '#cc0000' }}>🔧 EMERGENCY FIREBASE TEST</h1>
      <p><strong>Status:</strong> {status}</p>
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      
      <button 
        onClick={testConnection}
        style={{ 
          backgroundColor: '#cc0000', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none',
          borderRadius: '5px',
          margin: '10px 0'
        }}
      >
        Test Again
      </button>
      
      <div>
        <h3>Schedules Found: {schedules.length}</h3>
        {schedules.map((schedule, index) => (
          <div key={schedule.id || index} style={{ 
            backgroundColor: 'white', 
            padding: '10px', 
            margin: '5px 0',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}>
            <p><strong>Student:</strong> {schedule.studentName}</p>
            <p><strong>Teacher:</strong> {schedule.teacherName}</p>
            <p><strong>Day:</strong> {schedule.day} at {schedule.time}</p>
            <p><strong>Instrument:</strong> {schedule.instrument}</p>
          </div>
        ))}
      </div>
    </div>
  );
}