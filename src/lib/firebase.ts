import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase configuration with fallback values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCsALtmxjmilhge-PJVdWsY1-LnRAmWTJQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'discover-music-mnl.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'discover-music-mnl',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'discover-music-mnl.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '389933742382',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:389933742382:web:6f08291373d8a442bfe2bf'
  // Note: Removed measurementId to disable Analytics and prevent 403 errors
}

// Debug logging
console.log('Firebase environment variables check:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
  authDomain: firebaseConfig.authDomain || 'MISSING',
  projectId: firebaseConfig.projectId || 'MISSING',
  storageBucket: firebaseConfig.storageBucket || 'MISSING',
  messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : 'MISSING'
})

// Validate that all required fields are present
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])

if (missingFields.length > 0) {
  console.error('Missing required Firebase configuration fields:', missingFields)
  console.error('Current config:', JSON.stringify(firebaseConfig, null, 2))
  throw new Error(`Firebase configuration is incomplete. Missing: ${missingFields.join(', ')}`)
}

console.log('Firebase config initialized successfully with project:', firebaseConfig.projectId)

// Add global error handler for Firestore BloomFilter errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error
  console.error = (...args) => {
    // Suppress known non-critical Firestore BloomFilter errors
    const errorMessage = args.join(' ')
    if (errorMessage.includes('BloomFilter error') || 
        errorMessage.includes('BloomFilterError')) {
      // Log as warning instead of error for BloomFilter issues
      console.warn('🟡 Firestore BloomFilter warning (non-critical):', ...args)
      return
    }
    // Pass through all other errors normally
    originalConsoleError.apply(console, args)
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore with standard settings (avoiding deprecated methods)
export const db = getFirestore(app)

// Configure Firestore settings for better network handling
if (typeof window !== 'undefined') {
  try {
    // Import Firestore settings dynamically to avoid SSR issues
    import('firebase/firestore').then(({ enableNetwork, disableNetwork }) => {
      // Add network state monitoring
      window.addEventListener('online', () => {
        console.log('🟢 Network back online, enabling Firestore')
        enableNetwork(db).catch(console.warn)
      })

      window.addEventListener('offline', () => {
        console.log('🔴 Network offline, Firestore will use cache')
      })

      console.log('🟢 Firestore configured with enhanced network settings')
    }).catch(error => {
      console.warn('Firestore configuration warning:', error)
    })
  } catch (error) {
    console.warn('Firestore settings configuration failed:', error)
  }
}

// Initialize Auth
export const auth = getAuth(app)

// Network retry helper function for Firestore operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a network-related error
      const isNetworkError = error?.code === 'unavailable' || 
                           error?.message?.includes('network') ||
                           error?.message?.includes('connection') ||
                           error?.message?.includes('timeout')

      if (isNetworkError && attempt < maxRetries) {
        console.warn(`🔄 Network error on attempt ${attempt}, retrying in ${delay}ms...`, error.message)
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError!
}

export default app
