'use client'

import { useEffect, useState } from 'react'

export default function DiagnosticPage() {
  const [envCheck, setEnvCheck] = useState<Record<string, string>>({})
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Checking...')

  useEffect(() => {
    // Check all environment variables
    const env = {
      'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'MISSING',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'MISSING',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'MISSING',
      'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'MISSING',
      'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID': process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'MISSING'
    }
    setEnvCheck(env)

    // Test Firebase loading
    const testFirebase = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        if (db) {
          setFirebaseStatus('✅ Firebase initialized successfully')
        } else {
          setFirebaseStatus('❌ Firebase failed to initialize')
        }
      } catch (error: any) {
        setFirebaseStatus(`❌ Firebase error: ${error.message}`)
      }
    }

    testFirebase()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Firebase Diagnostic</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Firebase Status</h2>
        <div className="bg-gray-100 p-4 rounded">
          {firebaseStatus}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <div className="bg-gray-100 p-4 rounded">
          {Object.entries(envCheck).map(([key, value]) => (
            <div key={key} className="mb-2 font-mono text-sm">
              <span className="font-semibold">{key}:</span>{' '}
              <span className={value === 'MISSING' ? 'text-red-600' : 'text-green-600'}>
                {value === 'MISSING' ? '❌ MISSING' : '✅ SET'}
              </span>
              {value !== 'MISSING' && value.length > 20 && (
                <span className="text-gray-500 ml-2">
                  ({value.substring(0, 20)}...)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Browser Console</h2>
        <div className="bg-yellow-100 p-4 rounded">
          <p>Check the browser console (F12) for detailed Firebase error messages.</p>
          <p>Look for specific error codes like "400 INVALID_ARGUMENT" or "auth/invalid-api-key"</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
        <div className="bg-blue-100 p-4 rounded">
          <ul className="list-disc list-inside space-y-2">
            <li>If environment variables are missing, they need to be set in Vercel</li>
            <li>If Firebase shows errors, the API keys may be incorrect</li>
            <li>Check Firebase console for project status</li>
            <li>Verify Firestore database is created and has proper rules</li>
          </ul>
        </div>
      </div>
    </div>
  )
}