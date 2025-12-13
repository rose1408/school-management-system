import { NextResponse } from 'next/server'

export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'missing',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'missing',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'missing',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'missing',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'missing',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'missing',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'missing'
  }

  const allPresent = Object.values(firebaseConfig).every(value => value !== 'missing' && value !== '')
  
  return NextResponse.json({
    status: allPresent ? 'All environment variables present' : 'Some environment variables missing',
    config: Object.fromEntries(
      Object.entries(firebaseConfig).map(([key, value]) => [
        key, 
        value === 'missing' ? 'MISSING' : 
        value === '' ? 'EMPTY' : 
        `${value.substring(0, 10)}...`
      ])
    ),
    timestamp: new Date().toISOString()
  })
}