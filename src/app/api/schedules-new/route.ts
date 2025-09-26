import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  console.log('🔍 Schedules API GET called');
  
  try {
    if (!db) {
      console.log('❌ No database connection');
      return NextResponse.json({ error: 'No database' }, { status: 500 });
    }

    console.log('📊 Fetching schedules from Firestore...');
    const snapshot = await getDocs(collection(db, 'schedules'));
    
    const schedules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('✅ Found schedules:', schedules.length);
    
    return NextResponse.json({
      success: true,
      count: schedules.length,
      schedules: schedules
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('📝 Schedules API POST called');
  
  try {
    if (!db) {
      return NextResponse.json({ error: 'No database' }, { status: 500 });
    }

    const data = await request.json();
    console.log('📝 Data received:', data);

    const scheduleData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'schedules'), scheduleData);
    console.log('✅ Created schedule with ID:', docRef.id);
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Schedule created'
    });
    
  } catch (error) {
    console.error('❌ POST Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}