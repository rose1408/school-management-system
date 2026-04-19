# Messaging Patterns Audit - DMS 1.0 Codebase

## Executive Summary
Comprehensive scan of the DMS 1.0 codebase for message listeners, handlers, WebSocket/Socket.io patterns, and asynchronous messaging. **No Chrome extension message passing patterns found (no `sendMessage`/`postMessage`).** The application uses Firestore real-time listeners, Socket.io for client-server communication, and custom DOM events.

---

## 1. Socket.io Message Listeners

### 1.1 Client-Side Socket Hook
**File:** [src/hooks/useSocket.ts](src/hooks/useSocket.ts)

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketInitializer();

    return () => {
      if (socket) {
        reconnectAttempts = 0;
        socket.disconnect();
      }
    };
  }, []);

  const socketInitializer = async () => {
    // We just call it because we don't need anything else out of it
    await fetch('/api/socketio');

    socket = io(undefined, {
      path: '/api/socketio',
      reconnection: true,
      reconnectionDelay: BASE_RECONNECT_DELAY,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      // Exponential backoff for reconnection
      randomizationFactor: 0.1
    });

    // MESSAGE LISTENERS - These are event handlers for Socket.io messages
    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      reconnectAttempts = 0; // Reset counter on successful connection
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error);
    });
  };

  return { socket, isConnected };
};

export { socket };
```

**Key Patterns:**
- ✅ `socket.on('connect')` - Connection listener
- ✅ `socket.on('disconnect')` - Disconnection listener with reason parameter
- ✅ `socket.on('connect_error')` - Error handling listener
- These do NOT return true (handlers use state updates instead)

---

### 1.2 Server-Side Socket Handler
**File:** [src/pages/api/socketio.ts](src/pages/api/socketio.ts)

```typescript
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponse & { socket: { server: NetServer & { io?: ServerIO } } }) => {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    
    const io = new ServerIO(res.socket.server, {
      path: '/api/socketio',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Handle connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Join student management room
      socket.join('students');
      
      // MESSAGE LISTENER - Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  
  res.end();
};

export default ioHandler;
```

**Key Patterns:**
- ✅ `io.on('connection')` - Server-side connection listener
- ✅ `socket.join('students')` - Room subscription for broadcasts
- ✅ `socket.on('disconnect')` - Server-side disconnection listener
- These are message event handlers (don't return true)

---

## 2. Custom DOM Events with Async Response

### 2.1 Custom Event Dispatcher (Async Messaging Pattern)
**File:** [src/app/teachers/page.tsx](src/app/teachers/page.tsx#L910-L950)

```typescript
// CUSTOM EVENT CREATION WITH DETAIL DATA (Async pattern)
setTimeout(() => {
  // Access showModal through a parent component or use the modal system
  const event = new CustomEvent('showSuccessModal', {
    detail: {
      title: 'Multiple Schedules Created!',
      message: `Successfully created ${successCount} schedule sessions!`
    }
  });
  window.dispatchEvent(event);
}, 100);

// Error event with detail
setTimeout(() => {
  const event = new CustomEvent('showErrorModal', {
    detail: {
      title: 'Error',
      message: 'Error saving some schedules. Please try again.'
    }
  });
  window.dispatchEvent(event);
}, 100);
```

**Key Patterns:**
- ✅ `new CustomEvent()` - Creates custom DOM events with data
- ✅ `window.dispatchEvent()` - Dispatches event to window listeners
- ✅ `detail` property - Carries message payload (async pattern)
- ⚠️ `setTimeout()` wrapper - Simulates async messaging with delay

---

### 2.2 Custom Event Listeners (Receiving Async Messages)
**File:** [src/app/teachers/page.tsx](src/app/teachers/page.tsx#L1670-L1690)

```typescript
useEffect(() => {
  const handleSuccessModal = (event: any) => {
    const { title, message } = event.detail;
    showModal('success', title, message);
  };

  const handleErrorModal = (event: any) => {
    const { title, message } = event.detail;
    showModal('error', title, message);
  };

  // EVENT LISTENERS - These listen for custom events (Async pattern)
  window.addEventListener('showSuccessModal', handleSuccessModal);
  window.addEventListener('showErrorModal', handleErrorModal);

  return () => {
    window.removeEventListener('showSuccessModal', handleSuccessModal);
    window.removeEventListener('showErrorModal', handleErrorModal);
  };
}, [showModal]);
```

**Key Patterns:**
- ✅ `window.addEventListener()` - Listens for custom events
- ✅ `event.detail` - Receives message payload
- ✅ Cleanup in return - Proper event listener management
- These are NOT Chrome extension messages (no `return true` needed)

---

## 3. Network Status Listeners

### 3.1 Firebase Network Handler
**File:** [src/lib/firebase.ts](src/lib/firebase.ts#L65-L82)

```typescript
// Add network state monitoring
if (typeof window !== 'undefined') {
  try {
    // Import Firestore settings dynamically to avoid SSR issues
    import('firebase/firestore').then(({ enableNetwork, disableNetwork }) => {
      // NETWORK EVENT LISTENERS
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
```

**Key Patterns:**
- ✅ `window.addEventListener('online')` - Network restoration listener
- ✅ `window.addEventListener('offline')` - Network loss listener
- ✅ Calls `enableNetwork()`/`disableNetwork()` on state change
- Browser native events (not custom messaging)

---

### 3.2 React Component Network Status
**File:** [src/components/NetworkStatus.tsx](src/components/NetworkStatus.tsx#L1-L60)

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
      console.log('🟢 Network connection restored')
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      console.log('🔴 Network connection lost')
    }

    // NETWORK EVENT LISTENERS
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-hide offline message after going back online
  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showOfflineMessage])

  if (!showOfflineMessage && isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!isOnline ? (
        // Offline indicator UI
      ) : null}
    </div>
  )
}
```

**Key Patterns:**
- ✅ `window.addEventListener('online'/'offline')` - Network state monitoring
- ✅ State updates on network changes
- ✅ UI display toggling based on connection
- No async response pattern needed

---

## 4. Firestore Real-Time Message Listeners (onSnapshot)

### 4.1 Real-Time Students Listener
**File:** [src/hooks/useRealtimeStudents.ts](src/hooks/useRealtimeStudents.ts)

```typescript
export function useRealtimeStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let connectionTimeout: NodeJS.Timeout | undefined
    
    const setupListener = () => {
      try {
        const q = query(
          collection(firestore, 'students'),
          orderBy('createdAt', 'desc')
        )

        // Set up a timeout to detect stalled connections (30 seconds)
        connectionTimeout = setTimeout(() => {
          if (unsubscribe && loading) {
            console.warn('⚠️ Students listener timed out after 30s, cleaning up...')
            unsubscribe()
            unsubscribe = undefined
            setError('Connection timeout. Please refresh to retry.')
            setLoading(false)
          }
        }, 30000)

        // FIRESTORE MESSAGE LISTENER - Real-time updates
        const unsubscribe_temp = onSnapshot(
          q,
          (querySnapshot: any) => {
            // Clear timeout on successful data
            if (connectionTimeout) {
              clearTimeout(connectionTimeout)
              connectionTimeout = undefined
            }
            
            const studentsData: Student[] = []
            querySnapshot.forEach((doc: any) => {
              const data = doc.data()
              studentsData.push({
                id: doc.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth,
                age: data.age,
                address: data.address,
                parentName: data.parentName,
                parentPhone: data.parentPhone,
                enrollmentDate: data.enrollmentDate,
                studentId: data.studentId,
                status: data.status,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              })
            })
            setStudents(studentsData)
            setLoading(false)
            setError(null)
          },
          (err: any) => {
            // Clear timeout on error
            if (connectionTimeout) {
              clearTimeout(connectionTimeout)
              connectionTimeout = undefined
            }
            
            console.error('Error listening to students:', err)
            
            // Check if it's a network error and suggest retry
            const isNetworkError = err?.code === 'unavailable' || 
                                 err?.message?.includes('network') ||
                                 err?.message?.includes('connection') ||
                                 err?.message?.includes('timeout')
            
            if (isNetworkError) {
              setError('Network connection issue. Check your internet connection.')
            } else {
              setError('Failed to load students')
            }
            setLoading(false)
          }
        )

        unsubscribe = unsubscribe_temp
        return unsubscribe
      } catch (error: any) {
        // Error handling...
      }
    };

    // Setup and cleanup
    const cleanup = setupListener()
    return () => {
      if (connectionTimeout) clearTimeout(connectionTimeout)
      if (cleanup) cleanup()
    }
  }, [])

  return { students, loading, error }
}
```

**Key Patterns:**
- ✅ `onSnapshot()` - Real-time message listener for Firestore
- ✅ **Returns unsubscribe function** - Used for cleanup (async cleanup pattern)
- ✅ Three callbacks: success, error handlers
- ✅ Connection timeout detection (30 seconds)
- ✅ Network error detection with retry guidance
- This is **NOT** a "return true" async pattern, but uses callback-based async

---

### 4.2 Real-Time Teachers Listener
**File:** [src/hooks/useRealtimeTeachers.ts](src/hooks/useRealtimeTeachers.ts)

```typescript
export function useRealtimeTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshTeachers = useCallback(() => {
    console.log('Forcing teachers refresh...')
    setLoading(true)
    setError(null)
    setRefreshKey(prev => prev + 1)
  }, [])

  useEffect(() => {
    console.log('Setting up teachers listener, refreshKey:', refreshKey)
    setLoading(true)
    
    let unsubscribe: (() => void) | undefined
    let connectionTimeout: NodeJS.Timeout | undefined
    
    const setupListener = () => {
      try {
        const q = collection(firestore, 'teachers')

        // Set up a timeout to detect stalled connections (30 seconds)
        connectionTimeout = setTimeout(() => {
          if (unsubscribe && loading) {
            console.warn('⚠️ Teachers listener timed out after 30s, cleaning up...')
            unsubscribe()
            unsubscribe = undefined
            setError('Connection timeout. Please refresh to retry.')
            setLoading(false)
          }
        }, 30000)

        // FIRESTORE MESSAGE LISTENER - Real-time teacher updates
        const unsubscribe_temp = onSnapshot(
          q,
          (querySnapshot: any) => {
            // Clear timeout on successful data
            if (connectionTimeout) {
              clearTimeout(connectionTimeout)
              connectionTimeout = undefined
            }
            
            console.log('Teachers snapshot received, count:', querySnapshot.size)
            const teachersData: Teacher[] = []
            querySnapshot.forEach((doc: any) => {
              const data = doc.data()
              console.log('Processing teacher doc:', doc.id, data)
              teachersData.push({
                id: doc.id,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                phone: data.phone || '',
                instrument: data.instrument || '',
                address: data.address || '',
                dateOfBirth: data.dateOfBirth || '',
                age: data.age || '',
                zipCode: data.zipCode || '',
                tinNumber: data.tinNumber || '',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              })
            })
            
            // Simple sort by name
            teachersData.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''))
            
            console.log('Final processed teachers:', teachersData)
            setTeachers(teachersData)
            setLoading(false)
            setError(null)
          },
          (err: any) => {
            // Error handling and cleanup...
          }
        )

        unsubscribe = unsubscribe_temp
        return unsubscribe
      } catch (error: any) {
        // Error handling...
      }
    };

    const cleanup = setupListener()
    return () => {
      if (connectionTimeout) clearTimeout(connectionTimeout)
      if (cleanup) cleanup()
    }
  }, [refreshKey])

  return { teachers, loading, error, refreshTeachers }
}
```

**Key Patterns:**
- ✅ `onSnapshot()` - Real-time message listener
- ✅ Returns unsubscribe function for cleanup
- ✅ Refresh mechanism via `refreshKey` state
- ✅ Network error handling

---

## 5. Data Synchronization Patterns (No Direct Message Return True)

### 5.1 Google Sheets Webhook - Teachers API
**File:** [src/app/api/teachers/route.ts](src/app/api/teachers/route.ts#L40-L100)

```typescript
// Sync with Google Sheets TEACHERS tab (if configured)
try {
  const googleSheetId = data.googleSheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
  if (googleSheetId) {
    // Prepare data for Google Sheets with correct column mapping for TEACHERS tab
    const teacherDataForSheets = {
      teacherCallName: data.firstName || '', 
      fullName: `${data.firstName} ${data.lastName}`, 
      dateOfBirth: data.dateOfBirth || '', 
      age: data.age || '', 
      contactNumber: data.phone || '', 
      emailAddress: data.email || '', 
      address: data.address || '', 
      zipCode: data.zipCode || '', 
      tinNumber: data.tinNumber || '', 
      instruments: data.instrument || '' 
    };
    
    console.log('Syncing new teacher to Google Sheets TEACHERS tab:', teacherDataForSheets);
    
    // Google Apps Script Web App URL for Google Sheets integration
    const webhookUrl = 'https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec';
    
    // FETCH WEBHOOK CALL - Sends message to Google Apps Script (async, but no return true)
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addTeacher',
        sheetId: googleSheetId,
        teacherData: teacherDataForSheets
      })
    });
    
    console.log('Webhook response status:', webhookResponse.status);
    const responseText = await webhookResponse.text();
    
    if (webhookResponse.ok) {
      try {
        const webhookResult = JSON.parse(responseText);
        console.log('Google Sheets sync successful:', webhookResult);
        
        if (webhookResult.success) {
          console.log('✅ Teacher successfully added to Google Sheets row:', webhookResult.rowNumber);
        }
      } catch (parseError) {
        console.log('Response was successful but not JSON:', responseText);
      }
    }
  }
} catch (sheetsError) {
  console.error('Google Sheets sync error (non-blocking):', sheetsError);
  // Don't fail the teacher creation if sheets sync fails
}
```

**Key Patterns:**
- ✅ `fetch()` - Async HTTP request to webhook
- ✅ JSON payload in request body
- ✅ Response parsing and error handling
- ⚠️ **NOT** a "return true" pattern - uses async/await instead
- This is a one-way async message, not a bidirectional handler

---

## 6. "Return True" Pattern - Filter Predicates (NOT Message Handlers)

### 6.1 Student Matching Logic in Sync
**File:** [src/app/students/page.tsx](src/app/students/page.tsx#L375-L410)

```typescript
// This is NOT a message handler - it's a filter predicate
const existingStudent = currentStudents.find(s => {
  // Primary match: email (most reliable)
  if (s.email && studentData.email) {
    const emailMatch = s.email.toLowerCase().trim() === studentData.email.toLowerCase().trim();
    if (emailMatch) {
      console.log(`[Sync ${syncId}] Email match found for update:`, s.email, '→', studentData.email);
      return true;  // ← FILTER PREDICATE RETURN, NOT MESSAGE HANDLER
    }
  }
  
  // Secondary match: studentId (exact match)
  if (studentData.studentId && s.studentId && s.studentId.trim() && studentData.studentId.trim()) {
    const idMatch = s.studentId.trim() === studentData.studentId.trim();
    if (idMatch) {
      console.log(`[Sync ${syncId}] Student ID match found for update:`, s.studentId, '→', studentData.studentId);
      return true;  // ← FILTER PREDICATE RETURN, NOT MESSAGE HANDLER
    }
  }
  
  // Tertiary match: exact full name + phone combination (very strict)
  if (s.firstName && s.lastName && studentData.firstName && studentData.lastName) {
    const firstNameMatch = s.firstName.toLowerCase().trim() === studentData.firstName.toLowerCase().trim();
    const lastNameMatch = s.lastName.toLowerCase().trim() === studentData.lastName.toLowerCase().trim();
    const phoneMatch = s.phone && studentData.phone && s.phone.trim() === studentData.phone.trim();
    
    if (firstNameMatch && lastNameMatch && phoneMatch) {
      console.log(`[Sync ${syncId}] Full name + phone match found for update:`, `${s.firstName} ${s.lastName}`, s.phone);
      return true;  // ← FILTER PREDICATE RETURN, NOT MESSAGE HANDLER
    }
  }
  
  return false;
});
```

**Key Patterns:**
- ⚠️ These `return true` statements are **NOT** message handler responses
- They are **filter predicates** in `Array.find()` callback
- Used for data matching logic, not async messaging
- No Chrome extension pattern here

---

## 7. DOM Content Loaded Event
**File:** [public/test-firebase-browser.js](public/test-firebase-browser.js#L65-L75)

```typescript
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
```

**Key Patterns:**
- ✅ `document.addEventListener('DOMContentLoaded')` - Page load event
- Browser native event, not messaging

---

## 8. Summary Table - All Message Patterns Found

| Pattern Type | File | Async Method | Returns True? | Notes |
|---|---|---|---|---|
| Socket.io Client | `src/hooks/useSocket.ts` | `socket.on()` | ❌ | Event listeners for connect/disconnect/error |
| Socket.io Server | `src/pages/api/socketio.ts` | `io.on()`, `socket.on()` | ❌ | Server-side event handlers |
| Custom DOM Events (Send) | `src/app/teachers/page.tsx` | `dispatchEvent()` | ❌ | Uses `setTimeout()` to simulate async |
| Custom DOM Events (Listen) | `src/app/teachers/page.tsx` | `addEventListener()` | ❌ | Extracts data from `event.detail` |
| Network Status | `src/lib/firebase.ts`, `src/components/NetworkStatus.tsx` | `addEventListener('online'/'offline')` | ❌ | Browser native events |
| Firestore Real-Time | `src/hooks/useRealtimeStudents.ts`, `src/hooks/useRealtimeTeachers.ts` | `onSnapshot()` | ❌ | Returns unsubscribe function |
| Google Sheets Sync | `src/app/api/teachers/route.ts`, `src/app/api/students/route.ts` | `fetch()` | ❌ | Async/await pattern |
| Filter Predicates | `src/app/students/page.tsx` | `Array.find()` callback | ✅ | **NOT** message handlers - data matching |

---

## 9. Critical Findings

### ✅ Message Listener Pattern Found (But NOT Chrome Extension Style)
- **Socket.io listeners**: Use `socket.on()` for event-driven messaging
- **Firestore listeners**: Use `onSnapshot()` for real-time database updates
- **Custom DOM events**: Use `addEventListener()` with custom event names
- **Browser events**: Network status listeners (`online`/`offline`)

### ❌ No "Return True" Async Message Pattern
- **NOT FOUND**: No Chrome extension `chrome.runtime.onMessage()` listeners that `return true`
- **NOT FOUND**: No `sendMessage()` or `postMessage()` calls
- **NOT FOUND**: No service worker message passing
- The `return true` found is only in **filter predicates**, not message handlers

### 📊 Messaging Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Firestore Real-Time Listeners (onSnapshot)             │ │
│  │ └─ useRealtimeStudents.ts                              │ │
│  │ └─ useRealtimeTeachers.ts                              │ │
│  │ └─ Updates state on DB changes                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Socket.io Client (useSocket.ts)                        │ │
│  │ └─ Connects to /api/socketio                           │ │
│  │ └─ Listens to: connect, disconnect, connect_error     │ │
│  │ └─ Joins 'students' room                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Custom DOM Events (Intra-page messaging)              │ │
│  │ └─ window.addEventListener('showSuccessModal')        │ │
│  │ └─ window.addEventListener('showErrorModal')          │ │
│  │ └─ Dispatched with setTimeout() for async behavior    │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Network Status Listeners                              │ │
│  │ └─ window.addEventListener('online'/'offline')       │ │
│  │ └─ Triggers Firestore enable/disable                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
    │  Firestore  │  │  Socket.io  │  │  Google    │
    │  Database   │  │  Server     │  │  Sheets    │
    │             │  │             │  │  Webhook   │
    └─────────────┘  └─────────────┘  └────────────┘
```

---

## 10. Recommendations

1. **Socket.io Setup**: Currently initialized but no custom event handlers configured
   - Consider emitting custom events for real-time data updates
   - Add `socket.emit()` calls to send data to server

2. **Firestore Listeners**: Well-implemented with error handling and timeouts
   - Connection timeouts at 30 seconds (good practice)
   - Network error detection is robust

3. **Custom Events**: Consider using a more formal event bus pattern
   - Current `setTimeout()` wrapper is fragile
   - Consider using `mitt` or `EventEmitter` library for consistency

4. **Message Return Pattern**: 
   - No need to implement "return true" pattern
   - Codebase uses modern async/await and callbacks instead
   - Keep current patterns for consistency

---

## Files Summary

| File | Message Type | Handler Count |
|---|---|---|
| [src/hooks/useSocket.ts](src/hooks/useSocket.ts) | Socket.io events | 3 (connect, disconnect, error) |
| [src/pages/api/socketio.ts](src/pages/api/socketio.ts) | Socket.io server | 2 (connection, disconnect) |
| [src/app/teachers/page.tsx](src/app/teachers/page.tsx) | Custom DOM events | 5 (2 dispatch + 3 listeners) |
| [src/lib/firebase.ts](src/lib/firebase.ts) | Network events | 2 (online, offline) |
| [src/components/NetworkStatus.tsx](src/components/NetworkStatus.tsx) | Network events | 2 (online, offline) |
| [src/hooks/useRealtimeStudents.ts](src/hooks/useRealtimeStudents.ts) | Firestore listener | 1 onSnapshot |
| [src/hooks/useRealtimeTeachers.ts](src/hooks/useRealtimeTeachers.ts) | Firestore listener | 1 onSnapshot |
| [src/app/api/students/route.ts](src/app/api/students/route.ts) | HTTP fetch | 1 webhook call |
| [src/app/api/teachers/route.ts](src/app/api/teachers/route.ts) | HTTP fetch | 1 webhook call |
| [public/test-firebase-browser.js](public/test-firebase-browser.js) | DOM event | 1 (DOMContentLoaded) |

---

**Generated:** 2026-04-19
**Audit Scope:** Complete messaging pattern analysis
**Patterns Found:** ✅ Socket.io, ✅ Firestore, ✅ Custom DOM Events, ✅ Network Events
**Chrome Extension Patterns:** ❌ NONE FOUND (No return true handlers or sendMessage)
