import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST - Create a new schedule
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const scheduleData = {
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      studentName: data.studentName,
      studentCardNumber: data.studentCardNumber,
      instrument: data.instrument,
      level: data.level,
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

    const docRef = await addDoc(collection(db, 'schedules'), scheduleData);
    
    return NextResponse.json({ 
      id: docRef.id,
      ...scheduleData 
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
