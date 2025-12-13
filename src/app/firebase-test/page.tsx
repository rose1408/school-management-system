'use client'

import { useEffect, useState } from 'react'

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

export default function FirebaseTest() {
  const [status, setStatus] = useState('Testing...')
  const [config, setConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check environment variables
    const envVars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    }
    setConfig(envVars)

    // Test Firestore connection
    const testFirestore = async () => {
      try {
        console.log('Testing Firestore connection...')
        await initFirebaseIfNeeded();
        const teachersRef = collection(firestore, 'teachers')
        const snapshot = await getDocs(teachersRef)
        console.log('Firestore test successful, docs:', snapshot.size)
        setStatus(`Success! Found ${snapshot.size} teachers in Firestore`)
      } catch (err: any) {
        console.error('Firestore test failed:', err)
        setError(err.message)
        setStatus('Failed to connect to Firestore')
      }
    }

    testFirestore()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Connection Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <p className={`p-2 rounded ${error ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {status}
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Error:</h2>
          <p className="bg-red-100 text-red-800 p-2 rounded">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
        <div className="bg-gray-100 p-4 rounded">
          {Object.entries(config || {}).map(([key, value]) => (
            <div key={key} className="mb-1">
              <strong>{key}:</strong> {value ? '✓ Set' : '✗ Missing'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}