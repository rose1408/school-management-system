import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all students
export async function GET() {
  try {
    const students = await db.student.findMany();
    
    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// POST - Create a new student
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const student = await db.student.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        age: data.age || '',
        enrollmentDate: data.enrollmentDate,
        status: data.status || 'active'
      }
    });
    
    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error creating student:', error);
    
    // Handle duplicate email
    if (error instanceof Error && error.message && error.message.includes('email')) {
      return NextResponse.json({ 
        error: 'A student with this email already exists' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}

// PUT - Update a student
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    const student = await db.student.update({
      where: { id: data.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        age: data.age || '',
        enrollmentDate: data.enrollmentDate,
        status: data.status || 'active'
      }
    });
    
    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error updating student:', error);
    
    if (error instanceof Error && error.message && error.message.includes('email')) {
      return NextResponse.json({ 
        error: 'A student with this email already exists' 
      }, { status: 400 });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

// DELETE - Delete a student
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }
    
    await db.student.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
