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
        phone: data.phone,
        instrument: data.instrument,
        address: data.address,
        dateOfBirth: data.dateOfBirth || null,
        age: data.age || null,
        zipCode: data.zipCode || null,
        tinNumber: data.tinNumber || null
      }
    });

    // Sync with Google Sheets TEACHERS tab (if configured)
    try {
      const googleSheetId = data.googleSheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
      if (googleSheetId) {
        // Prepare data for Google Sheets with correct column mapping for TEACHERS tab
        // This matches exactly what your Google Apps Script expects
        const teacherDataForSheets = {
          teacherCallName: data.firstName || '', // Teacher's Call Name (can be first name)
          fullName: `${data.firstName} ${data.lastName}`, // Full Name
          dateOfBirth: data.dateOfBirth || '', // Date of Birth
          age: data.age || '', // Age
          contactNumber: data.phone || '', // Contact Number  
          emailAddress: data.email || '', // Email Address
          address: data.address || '', // Address
          zipCode: data.zipCode || '', // Zip Code
          tinNumber: data.tinNumber || '', // TIN Number
          instruments: data.instrument || '' // Multiple instruments
        };
        
        // Log for debugging
        console.log('Syncing new teacher to Google Sheets TEACHERS tab:', teacherDataForSheets);
        
        // Google Apps Script Web App URL for Google Sheets integration
        const webhookUrl = 'https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec';
        
        console.log('Attempting to sync teacher data to Google Sheets TEACHERS tab');
        console.log('Sheet ID:', googleSheetId);
        console.log('Teacher data for sheets:', teacherDataForSheets);
        
        try {
          console.log('=== GOOGLE SHEETS SYNC START ===');
          console.log('Webhook URL:', webhookUrl);
          console.log('Sheet ID:', googleSheetId);
          console.log('Teacher data for sheets:', JSON.stringify(teacherDataForSheets, null, 2));
          
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
          console.log('Webhook response ok:', webhookResponse.ok);
          
          const responseText = await webhookResponse.text();
          console.log('Webhook response text:', responseText);
          
          if (webhookResponse.ok) {
            try {
              const webhookResult = JSON.parse(responseText);
              console.log('Google Sheets sync successful:', webhookResult);
              
              if (webhookResult.success) {
                console.log('✅ Teacher successfully added to Google Sheets row:', webhookResult.rowNumber);
              } else {
                console.error('❌ Google Apps Script returned error:', webhookResult.error);
              }
            } catch (parseError) {
              console.log('Response was successful but not JSON:', responseText);
            }
          } else {
            console.error('Google Sheets sync failed with status:', webhookResponse.status);
            console.error('Error response:', responseText);
          }
          
          console.log('=== GOOGLE SHEETS SYNC END ===');
        } catch (fetchError) {
          console.error('Error calling Google Sheets webhook:', fetchError);
          if (fetchError instanceof Error) {
            console.error('Fetch error details:', fetchError.message);
          }
        }
      }
    } catch (sheetsError) {
      console.error('Google Sheets sync error (non-blocking):', sheetsError);
      // Don't fail the teacher creation if sheets sync fails
    }
    
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
        phone: data.phone,
        instrument: data.instrument,
        address: data.address,
        dateOfBirth: data.dateOfBirth || null,
        age: data.age || null,
        zipCode: data.zipCode || null,
        tinNumber: data.tinNumber || null
      }
    });

    // Sync with Google Sheets TEACHERS tab (if configured)
    try {
      const googleSheetId = data.googleSheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
      if (googleSheetId) {
        // Prepare data for Google Sheets with correct column mapping for TEACHERS tab
        const teacherDataForSheets = {
          teacherCallName: data.firstName || '', // Teacher's Call Name (can be first name)
          fullName: `${data.firstName} ${data.lastName}`, // Full Name
          dateOfBirth: data.dateOfBirth || '', // Date of Birth
          age: data.age || '', // Age
          contactNumber: data.phone || '', // Contact Number  
          emailAddress: data.email || '', // Email Address
          address: data.address || '', // Address
          zipCode: data.zipCode || '', // Zip Code
          tinNumber: data.tinNumber || '', // TIN Number
          instruments: data.instrument || '' // Multiple instruments
        };
        
        // Log for debugging
        console.log('Syncing updated teacher to Google Sheets TEACHERS tab:', teacherDataForSheets);
        
        // Google Apps Script Web App URL for Google Sheets integration
        const webhookUrl = 'https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec';
        
        console.log('Attempting to update teacher data in Google Sheets TEACHERS tab');
        console.log('Sheet ID:', googleSheetId);
        console.log('Teacher ID:', data.id);
        console.log('Teacher data for sheets:', teacherDataForSheets);
        
        try {
          console.log('=== GOOGLE SHEETS UPDATE SYNC START ===');
          console.log('Webhook URL:', webhookUrl);
          console.log('Sheet ID:', googleSheetId);
          console.log('Teacher data for sheets:', JSON.stringify(teacherDataForSheets, null, 2));
          
          const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'updateTeacher',
              sheetId: googleSheetId,
              teacherId: data.id, // Include teacher ID for finding the row
              teacherData: teacherDataForSheets
            })
          });
          
          console.log('Webhook response status:', webhookResponse.status);
          console.log('Webhook response ok:', webhookResponse.ok);
          
          const responseText = await webhookResponse.text();
          console.log('Webhook response text:', responseText);
          
          if (webhookResponse.ok) {
            try {
              const webhookResult = JSON.parse(responseText);
              console.log('Google Sheets update sync successful:', webhookResult);
              
              if (webhookResult.success) {
                console.log('✅ Teacher successfully updated in Google Sheets row:', webhookResult.rowNumber);
              } else {
                console.error('❌ Google Apps Script returned error:', webhookResult.error);
              }
            } catch (parseError) {
              console.log('Response was successful but not JSON:', responseText);
            }
          } else {
            console.error('Google Sheets update sync failed with status:', webhookResponse.status);
            console.error('Error response:', responseText);
          }
          
          console.log('=== GOOGLE SHEETS UPDATE SYNC END ===');
        } catch (fetchError) {
          console.error('Error calling Google Sheets webhook for update:', fetchError);
          if (fetchError instanceof Error) {
            console.error('Fetch error details:', fetchError.message);
          }
        }
      }
    } catch (sheetsError) {
      console.error('Google Sheets update sync error (non-blocking):', sheetsError);
      // Don't fail the teacher update if sheets sync fails
    }
    
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
