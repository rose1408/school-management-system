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

// POST - Create a new student and add to Google Sheets
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create student in local database (initially without student ID)
    const student = await db.student.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth || '',
        age: data.age || '',
        address: data.address || '',
        parentName: data.parentName || '',
        parentPhone: data.parentPhone || '',
        enrollmentDate: data.enrollmentDate,
        studentId: '', // Leave empty initially
        status: data.status || 'active'
      }
    });
    
    // Generate sequential student ID by checking Google Sheets data first (if available)
    let nextNumber = 1; // Default start
    
    if (data.googleSheetId) {
      try {
        // First, try to get the highest Student ID from Google Sheets
        console.log('Fetching existing Student IDs from Google Sheets to determine next number...');
        const sheetResponse = await fetch(`/api/students/google-sheets?sheetId=${data.googleSheetId}`);
        
        if (sheetResponse.ok) {
          const sheetData = await sheetResponse.json();
          if (sheetData.students && sheetData.students.length > 0) {
            // Extract all existing DMS- numbers from Google Sheets
            const sheetDMSNumbers = sheetData.students
              .map((sheetStudent: any) => {
                if (sheetStudent.studentId && sheetStudent.studentId.startsWith('DMS-')) {
                  const match = sheetStudent.studentId.match(/DMS-(\d+)/);
                  return match ? parseInt(match[1], 10) : 0;
                }
                return 0;
              })
              .filter((num: number) => num > 0);
            
            if (sheetDMSNumbers.length > 0) {
              const maxSheetNumber = Math.max(...sheetDMSNumbers);
              nextNumber = maxSheetNumber + 1;
              console.log(`Found highest Student ID in Google Sheets: DMS-${maxSheetNumber.toString().padStart(5, '0')}, next will be: DMS-${nextNumber.toString().padStart(5, '0')}`);
            }
          }
        } else {
          console.log('Could not fetch from Google Sheets, falling back to database check...');
        }
      } catch (error) {
        console.log('Error checking Google Sheets for Student IDs, falling back to database check:', error);
      }
    }
    
    // If we still have nextNumber = 1 (no Google Sheets data), check Firebase as fallback
    if (nextNumber === 1) {
      const allStudents = await db.student.findMany();
      const existingDMSStudents = allStudents.filter(student => 
        student.studentId && student.studentId.startsWith('DMS-')
      );
      
      if (existingDMSStudents.length > 0) {
        // Extract all existing numbers and find the highest
        const existingNumbers = existingDMSStudents
          .map(existingStudent => {
            if (existingStudent.studentId) {
              const match = existingStudent.studentId.match(/DMS-(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            }
            return 0;
          })
          .filter(num => num > 0);
        
        if (existingNumbers.length > 0) {
          const maxDbNumber = Math.max(...existingNumbers);
          nextNumber = maxDbNumber + 1;
          console.log(`Using database fallback - found highest: DMS-${maxDbNumber.toString().padStart(5, '0')}, next will be: DMS-${nextNumber.toString().padStart(5, '0')}`);
        }
      }
    }
    
    const formattedStudentId = `DMS-${nextNumber.toString().padStart(5, '0')}`;
    console.log(`Generated sequential Student ID: ${formattedStudentId} (sequence number: ${nextNumber})`);
    console.log(`This follows the Google Sheets sequence to maintain continuity even after database deletions`);
    
    // Update the student record with the new sequential ID
    const updatedStudent = await db.student.update({
      where: { id: student.id },
      data: { studentId: formattedStudentId }
    });
    
    // Also add to Google Sheets if sheet ID is provided
    if (data.googleSheetId) {
      try {
        // Call Google Apps Script directly instead of internal API
        const webhookUrl = `https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec`;
        
        // Format timestamp to remove comma: "27/09/2025 18:44:38"
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        
        // Prepare follow-up answer for Column L (Referral Details)
        let referralDetails = '';
        
        if (data.howFound === 'Social Media') {
          if (data.socialMediaPlatform) {
            referralDetails = data.socialMediaPlatform;
          } else if (data.referralDetails) {
            referralDetails = data.referralDetails;
          } else {
            referralDetails = 'Social Media';
          }
        } else if (data.howFound === 'Referred' || data.howFound === 'Friend Referred') {
          referralDetails = data.referralDetails || 'Referred';
        } else if (data.howFound === 'Walk-in' || data.howFound === 'Walked By') {
          referralDetails = 'Walk-in';
        } else {
          referralDetails = data.referralDetails || '';
        }
        
        const sheetData = {
          timestamp: formattedTimestamp,
          studentId: formattedStudentId,
          fullName: `${updatedStudent.lastName || ''}, ${updatedStudent.firstName || ''}`.replace(', ,', '').trim(),
          dateOfBirth: updatedStudent.dateOfBirth || '',
          age: updatedStudent.age || '',
          emergencyContact: updatedStudent.parentName || '',
          email: updatedStudent.email || '',
          contactNumber: updatedStudent.phone || '',
          socialMediaConsent: data.socialMediaConsent || '',
          status: updatedStudent.status || 'ACTIVE',
          referralSource: data.howFound || '',
          referralDetails: referralDetails
        };
        
        console.log('Sending student data to Google Sheets:', sheetData);
        
        const sheetResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'addStudent',
            sheetId: data.googleSheetId,
            data: sheetData
          })
        });
        
        if (sheetResponse.ok) {
          const sheetResult = await sheetResponse.json();
          console.log('Successfully added student to Google Sheets:', updatedStudent.firstName, updatedStudent.lastName);
          console.log('Google Sheets response:', sheetResult);
        } else {
          console.error('Error calling Google Sheets API:', await sheetResponse.text());
        }
      } catch (sheetError) {
        console.error('Error adding to Google Sheets (but student created locally):', sheetError);
        // Don't fail the entire request if Google Sheets fails
      }
    }
    
    // Return the updated student with the sequential Student ID
    return NextResponse.json({ student: updatedStudent });
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
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth || '',
        age: data.age || '',
        address: data.address || '',
        parentName: data.parentName || '',
        parentPhone: data.parentPhone || '',
        enrollmentDate: data.enrollmentDate,
        studentId: data.studentId || '',
        status: data.status || 'active'
      }
    });

    // Also sync to Google Sheets if sheet ID is provided
    const googleSheetId = data.googleSheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
    if (googleSheetId) {
      try {
        // Call Google Apps Script for student update
        const webhookUrl = `https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec`;
        
        // Format timestamp
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        
        // Prepare follow-up answer for Column L (using existing data or defaults)
        let referralDetails = '';
        if (data.howFound === 'Social Media') {
          referralDetails = data.socialMediaPlatform || data.referralDetails || 'Social Media';
        } else if (data.howFound === 'Referred' || data.howFound === 'Friend Referred') {
          referralDetails = data.referralDetails || 'Referred';
        } else if (data.howFound === 'Walk-in' || data.howFound === 'Walked By') {
          referralDetails = 'Walk-in';
        } else {
          referralDetails = data.referralDetails || '';
        }
        
        const sheetData = {
          timestamp: formattedTimestamp,
          studentId: student.studentId || '',
          fullName: `${student.lastName || ''}, ${student.firstName || ''}`.replace(', ,', '').trim(),
          dateOfBirth: student.dateOfBirth || '',
          age: student.age || '',
          emergencyContact: student.parentName || '',
          email: student.email || '',
          contactNumber: student.phone || '',
          socialMediaConsent: data.socialMediaConsent || '',
          status: student.status || 'ACTIVE',
          referralSource: data.howFound || '',
          referralDetails: referralDetails
        };
        
        console.log('Syncing updated student to Google Sheets:', sheetData);
        
        const sheetResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'updateStudent',
            sheetId: googleSheetId,
            data: sheetData
          })
        });
        
        if (sheetResponse.ok) {
          const sheetResult = await sheetResponse.json();
          console.log('Successfully updated student in Google Sheets:', student.firstName, student.lastName);
          console.log('Google Sheets response:', sheetResult);
        } else {
          console.error('Error calling Google Sheets API for update:', await sheetResponse.text());
        }
      } catch (sheetError) {
        console.error('Error updating in Google Sheets (but student updated locally):', sheetError);
        // Don't fail the entire request if Google Sheets fails
      }
    }
    
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
