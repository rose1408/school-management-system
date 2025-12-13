// Test Firebase connection in browser environment exactly like the production
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, onSnapshot } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCsALtmxjmilhge-PJVdWsY1-LnRAmWTJQ",
  authDomain: "discover-music-mnl.firebaseapp.com",
  projectId: "discover-music-mnl",
  storageBucket: "discover-music-mnl.firebasestorage.app",
  messagingSenderId: "389933742382",
  appId: "1:389933742382:web:6f08291373d8a442bfe2bf",
  measurementId: "G-QP2ZQV7CWG"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function testFirebaseInBrowser() {
  console.log('🌐 Testing Firebase in browser environment...')
  
  try {
    // Test 1: Direct getDocs
    console.log('📋 Test 1: Direct getDocs...')
    const snapshot = await getDocs(collection(db, 'teachers'))
    console.log('✅ getDocs successful, count:', snapshot.size)
    
    snapshot.forEach((doc) => {
      console.log('👤 Direct getDocs teacher:', doc.id, doc.data())
    })
    
    // Test 2: Real-time listener (same as useRealtimeTeachers)
    console.log('📡 Test 2: Real-time listener...')
    const unsubscribe = onSnapshot(
      collection(db, 'teachers'),
      (querySnapshot) => {
        console.log('🔥 Real-time snapshot received, count:', querySnapshot.size)
        const teachers = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log('👤 Real-time teacher:', doc.id, data)
          teachers.push({
            id: doc.id,
            ...data
          })
        })
        console.log('📊 Final teachers array:', teachers)
        
        // Cleanup after first result
        unsubscribe()
      },
      (error) => {
        console.error('❌ Real-time listener error:', error)
        console.error('❌ Error code:', error.code)
        console.error('❌ Error message:', error.message)
      }
    )
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error)
    console.error('❌ Error code:', error.code)
    console.error('❌ Error message:', error.message)
  }
}

// Run test when DOM is loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', testFirebaseInBrowser)
  // Also run immediately in case DOM is already loaded
  if (document.readyState === 'loading') {
    testFirebaseInBrowser()
  }
} else {
  // Node.js environment
  testFirebaseInBrowser()
}