import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all teachers
export async function GET() {
  try {
    const teachers = await db.teacher.findMany();
    
    return NextResponse.json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

// POST - Create a new teacher
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const teacher = await db.teacher.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        subject: data.subject || '',
        currentLesson: data.currentLesson || 1,
        maxLessons: data.maxLessons || 20,
        cardNumber: data.cardNumber || '',
        lessonPlan: data.lessonPlan || '',
        notes: data.notes || ''
      }
    });
    
    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    
    // Handle duplicate email
    if (error instanceof Error && error.message && error.message.includes('email')) {
      return NextResponse.json({ 
        error: 'A teacher with this email already exists' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}

// PUT - Update a teacher
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    const teacher = await db.teacher.update({
      where: { id: data.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        subject: data.subject || '',
        currentLesson: data.currentLesson || 1,
        maxLessons: data.maxLessons || 20,
        cardNumber: data.cardNumber || '',
        lessonPlan: data.lessonPlan || '',
        notes: data.notes || ''
      }
    });
    
    return NextResponse.json({ teacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    
    if (error instanceof Error && error.message && error.message.includes('email')) {
      return NextResponse.json({ 
        error: 'A teacher with this email already exists' 
      }, { status: 400 });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

// DELETE - Delete a teacher
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }
    
    await db.teacher.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
