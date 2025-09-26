import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch all schedules
export async function GET() {
  try {
    console.log('🔍 GET /api/schedules: Starting fetch');
    
    if (!db) {
      console.error('❌ Firebase database not initialized');
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: 'Firebase not properly initialized' 
      }, { status: 500 });
    }

    const schedulesRef = collection(db, 'schedules');
    const snapshot = await getDocs(schedulesRef);
    
    const schedules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('✅ GET /api/schedules: Found', schedules.length, 'schedules');
    
    return NextResponse.json({ 
      schedules,
      count: schedules.length,
      message: 'Schedules fetched successfully'
    });
  } catch (error) {
    console.error('❌ GET /api/schedules Error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch schedules',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST - Create a new schedule
export async function POST(request: Request) {
  try {
    console.log('🔄 Schedule API: Starting request processing');
    
    // Check if Firebase is initialized
    if (!db) {
      console.error('❌ Firebase database not initialized');
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: 'Firebase not properly initialized' 
      }, { status: 500 });
    }

    const data = await request.json();
    console.log('📝 Schedule API: Received data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    const requiredFields = ['teacherId', 'teacherName', 'studentName', 'studentCardNumber', 'instrument', 'day', 'time', 'duration', 'lessonNumber', 'startDate'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json({ 
        error: 'Missing required fields',
        missingFields,
        receivedData: data
      }, { status: 400 });
    }

    const scheduleData = {
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      studentName: data.studentName,
      studentCardNumber: data.studentCardNumber,
      instrument: data.instrument,
      level: data.level || data.instrument,
      day: data.day,
      time: data.time,
      duration: data.duration,
      lessonNumber: data.lessonNumber,
      room: data.room || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      startDate: data.startDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('💾 Schedule API: Attempting to save to Firestore');
    const docRef = await addDoc(collection(db, 'schedules'), scheduleData);
    console.log('✅ Schedule API: Successfully created document with ID:', docRef.id);
    
    return NextResponse.json({ 
      id: docRef.id,
      message: 'Schedule created successfully',
      ...scheduleData 
    });
  } catch (error) {
    console.error('❌ Schedule API Error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json({ 
      error: 'Failed to create schedule',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
