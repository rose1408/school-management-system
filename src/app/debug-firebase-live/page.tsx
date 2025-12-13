'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function DebugFirebaseLive() {
  const [status, setStatus] = useState('Initializing...');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      setStatus('🔍 Testing Firebase connection...');
      
      // Check environment variables
      const env = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ? '✅ Set' : '❌ Missing'
      };
      setEnvVars(env);
      
      setStatus('🔥 Initializing Firebase...');
      
      setStatus('📚 Testing Firestore connection...');
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const teachersData = teachersSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTeachers(teachersData);
      setStatus(`✅ Success! Found ${teachersData.length} teachers`);
      setError(null);
      
    } catch (err: any) {
      console.error('❌ Firebase test failed:', err);
      setError(err.message || 'Unknown error');
      setStatus('❌ Firebase connection failed');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🐛 Firebase Live Debug Page</h1>
      
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>📊 Status</h2>
        <p><strong>Current Status:</strong> {status}</p>
        {error && (
          <div style={{ color: 'red', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '5px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <h2>🔧 Environment Variables</h2>
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '5px' }}>
            <strong>{key}:</strong> {String(value)}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f0f8f0', borderRadius: '5px' }}>
        <h2>👥 Teachers Data</h2>
        <p><strong>Found {teachers.length} teachers</strong></p>
        {teachers.length > 0 ? (
          <div>
            {teachers.slice(0, 3).map((teacher, index) => (
              <div key={teacher.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '3px' }}>
                <strong>Teacher {index + 1}:</strong> {teacher.firstName} {teacher.lastName} ({teacher.id})
              </div>
            ))}
            {teachers.length > 3 && <p>... and {teachers.length - 3} more</p>}
          </div>
        ) : (
          <p>No teachers found in database</p>
        )}
      </div>

      <button 
        onClick={testFirebaseConnection}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007cba', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 Retry Connection Test
      </button>
    </div>
  );
}