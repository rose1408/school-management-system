"use client";

import { useState, useEffect } from 'react';
import { Teacher } from '@/lib/db';

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

export default function DebugTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeachers() {
      try {
        console.log('🔍 Debug page: Loading teachers...');
        await initFirebaseIfNeeded();
        const snapshot = await getDocs(collection(firestore, 'teachers'));
        console.log('📊 Debug page: Snapshot size:', snapshot.size);
        
        const teachersData: Teacher[] = [];
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          console.log('👤 Debug page: Teacher data:', doc.id, data);
          teachersData.push({
            id: doc.id,
            ...data
          });
        });
        
        console.log('✅ Debug page: Final teachers:', teachersData);
        setTeachers(teachersData);
        setError(null);
      } catch (err: any) {
        console.error('❌ Debug page: Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadTeachers();
  }, []);

  if (loading) return <div className="p-8">Loading teachers...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug: Teachers Data</h1>
      <p className="mb-4">Found {teachers.length} teachers</p>
      
      {teachers.length === 0 ? (
        <div className="bg-yellow-100 p-4 rounded">
          No teachers found in database
        </div>
      ) : (
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-gray-100 p-4 rounded">
              <h3 className="font-bold">{teacher.firstName} {teacher.lastName}</h3>
              <p>Email: {teacher.email}</p>
              <p>Phone: {teacher.phone}</p>
              <p>Instrument: {teacher.instrument}</p>
              <p>ID: {teacher.id}</p>
              <details>
                <summary>Raw Data</summary>
                <pre className="mt-2 text-xs">{JSON.stringify(teacher, null, 2)}</pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}