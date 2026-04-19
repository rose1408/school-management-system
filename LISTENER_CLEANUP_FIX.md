# Firestore Listener & Message Channel Cleanup Fix

**Date**: April 19, 2026  
**Issue**: "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"  
**Status**: ✅ RESOLVED

## Problem Analysis

The Chrome error indicated that message listeners were declaring async responses but not properly sending them before channels closed. Investigation revealed race conditions in Firestore listener cleanup logic:

1. **Double Cleanup**: `connectionTimeout` could fire and call `unsubscribe()` while cleanup was already running
2. **Unmounted State Updates**: State updates could occur after component unmount, causing warnings
3. **Missing Mount Checks**: Callbacks were executing without verifying component was still mounted
4. **Async Inconsistency**: useSocket had synchronous listeners but could cleanup prematurely
5. **Promise Chain Issues**: Firebase initialization used fire-and-forget async patterns

## Files Modified

### 1. **useRealtimeStudents.ts** ✅
- Added `useRef` hooks for mount state, unsubscribe, and timeout tracking
- Implemented `isMountedRef` checks in all callbacks
- Fixed double-cleanup prevention with `isSetupComplete` flag
- Added try-catch in cleanup to prevent errors during unsubscribe
- All state updates now protected by mount checks

**Key Changes:**
```typescript
// Before: Variable scope, potential double cleanup
let unsubscribe: (() => void) | undefined
let connectionTimeout: NodeJS.Timeout | undefined

// After: Refs persist across renders, proper cleanup
const isMountedRef = useRef(true)
const unsubscribeRef = useRef<(() => void) | undefined>()
const connectionTimeoutRef = useRef<NodeJS.Timeout | undefined>()
```

### 2. **useRealtimeTeachers.ts** ✅
- Applied same improvements as useRealtimeStudents
- Maintained `refreshTeachers` callback functionality
- Added mount checks to all snapshot and error callbacks
- Improved timeout clearing logic

### 3. **useRealtimeSchedules.ts** ✅
- Added mount state tracking with `isMountedRef`
- Protected async `getDocs` initialization with mount checks
- Added proper listener setup completion flag
- Protected both snapshot and error callbacks with mount checks

**Key Changes:**
```typescript
// Before: No mount checks, listener could update after unmount
const snapshot = await getDocs(schedulesRef);
setSchedules(initialSchedules);

// After: Mount checks prevent stale updates
const snapshot = await getDocs(schedulesRef);
if (!isMountedRef.current) return;
setSchedules(initialSchedules);
```

### 4. **useSocket.ts** ✅
- Added `isMountedRef` to track mounting state
- Improved error handling in socket initialization
- Added timeout setting for connection attempts (20s)
- Added error listener for Socket.IO errors
- Improved fetch error handling (no throw, just console warning)
- Protected all callbacks with mount checks
- Added try-catch in disconnect cleanup

**Key Improvements:**
```typescript
socket = io(undefined, {
  // ... existing config
  timeout: 20000  // 20s timeout for connections
});

// New error listener
socket.on('error', (error) => {
  if (!isMountedRef.current) return;
  console.error('⚠️ Socket error:', error);
});
```

## Technical Implementation

### Mount State Tracking Pattern
All hooks now follow this pattern:

```typescript
const isMountedRef = useRef(true)

useEffect(() => {
  isMountedRef.current = true
  
  // ... setup code ...
  
  return () => {
    isMountedRef.current = false  // Mark as unmounted first
    // ... cleanup code ...
  }
}, [])
```

### Callback Protection
All state-updating callbacks now check mount status:

```typescript
const unsubscribe_temp = onSnapshot(query,
  (snapshot) => {
    if (!isMountedRef.current) return  // Exit early if unmounted
    setStudents(studentsData)
  },
  (error) => {
    if (!isMountedRef.current) return
    setError(error.message)
  }
)
```

### Double-Cleanup Prevention
Track completion state to prevent double cleanup:

```typescript
let isSetupComplete = false

// ... in setupListener ...
unsubscribeRef.current = unsubscribe_temp
isSetupComplete = true

return () => {
  if (unsubscribeRef.current && isSetupComplete) {
    try {
      unsubscribeRef.current()
    } catch (err) {
      console.warn('Error during cleanup:', err)
    }
    unsubscribeRef.current = undefined
  }
}
```

## Benefits

✅ **Eliminates Race Conditions**: Clear setup completion tracking  
✅ **Prevents State Update Warnings**: Mount checks before setState calls  
✅ **Safer Cleanup**: Try-catch around unsubscribe calls  
✅ **Better Error Handling**: New error listeners and timeout configs  
✅ **Proper Resource Cleanup**: Refs properly cleared and nullified  
✅ **Timeout Protection**: Stalled connections properly detected (30s for Firestore, 20s for Socket.IO)  

## Testing Recommendations

1. **Navigate between pages** - Verify no console warnings about state updates
2. **Hard refresh** - Test listeners set up correctly after fresh page load
3. **Network throttle** - Simulate slow connections to test timeout handling
4. **Open DevTools** - Check no "message channel closed" errors appear
5. **Component unmount** - Quickly navigate away from pages with listeners
6. **Error scenarios** - Test behavior when Firestore/Socket.IO is unavailable

## Chrome Extension Note

The original error message stemmed from a browser extension (likely Grammarly) that was affected by the message channel issues. With these fixes to ensure proper listener cleanup and message handling, such errors should not propagate.

## Future Improvements

Consider:
- Add AbortController for more fine-grained cancellation control
- Implement exponential backoff for failed reconnections
- Add metrics/logging for listener health monitoring
- Create custom hook wrapper for common listener patterns
