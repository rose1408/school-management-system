import { NextResponse } from 'next/server';

// Google Sheets Integration for Teachers - WRITE TO SHEETS
// This API handles both reading from and writing teacher data to Google Sheets TEACHER tab
// Column Mapping: Teacher's Call Name | Full Name | Date of Birth | Contact Number | Email Address | Address | Zip Code | Tin #

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');
    
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID is required' }, { status: 400 });
    }

    // Use the TEACHER tab export
    let csvUrl;
    
    try {
      // Try to get the TEACHER sheet specifically
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=TEACHER`;
      
      let response = await fetch(csvUrl);
      
      // If that doesn't work, try the export format with gid for TEACHER tab
      if (!response.ok) {
        // You might need to find the correct gid for TEACHER tab from the sheet URL
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=1`; // Assuming TEACHER is the second tab
        response = await fetch(csvUrl);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch TEACHER sheet data: ${response.status} ${response.statusText}`);
      }

      const csvData = await response.text();
      console.log('Raw TEACHER CSV data preview:', csvData.substring(0, 400));
      
      // Parse CSV data
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
      
      console.log('TEACHER Headers found:', headers);
      console.log('Number of columns:', headers.length);
      console.log('Processing', lines.length - 1, 'teacher data rows');
      
      const teachers = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = parseCSVLine(lines[i]);
          
          console.log(`Teacher Row ${i} parsed values (${values.length} columns):`, values);
          
          // Column mapping for TEACHER sheet (FIXED MAPPING):
          // 0: Teacher's Call Name
          // 1: Full Name  
          // 2: Date of Birth
          // 3: Contact Number
          // 4: Email Address
          // 5: Address
          // 6: Zip Code
          // 7: Tin #
          const [
            callName = '',
            fullName = '',
            dateOfBirth = '',
            contactNumber = '',
            emailAddress = '',
            address = '',
            zipCode = '',
            tinNumber = ''
          ] = values;

          console.log(`Teacher Row ${i} extracted data:`, {
            callName,
            fullName,
            dateOfBirth,
            contactNumber,
            emailAddress,
            address,
            zipCode,
            tinNumber
          });

          // Skip empty rows
          if (!fullName.trim() && !callName.trim()) continue;

          // Split full name into first and last name
          const cleanName = fullName.replace(/"/g, '').trim();
          let firstName = '';
          let lastName = '';
          
          if (cleanName.includes(',')) {
            // Format: "Last Name, First Name"
            const nameParts = cleanName.split(',');
            lastName = nameParts[0]?.trim() || '';
            firstName = nameParts[1]?.trim() || '';
          } else {
            // Format: "First Last"
            const nameParts = cleanName.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // Create teacher object with CORRECT field mapping
          const teacher = {
            id: `TCH${String(i).padStart(3, '0')}`,
            firstName: firstName,
            lastName: lastName,
            callName: callName.trim(),
            dateOfBirth: dateOfBirth.trim(),
            email: emailAddress.trim(),
            phone: contactNumber.trim(),
            address: address.trim(),
            zipCode: zipCode.trim(),
            tinNumber: tinNumber.trim(),
            subject: 'Not specified', // This would come from additional data or be set separately
            currentLesson: 1,
            maxLessons: 20
          };
          
          console.log('Final teacher object for', teacher.firstName, teacher.lastName, ':', {
            callName: teacher.callName,
            email: teacher.email,
            phone: teacher.phone,
            dateOfBirth: teacher.dateOfBirth,
            address: teacher.address,
            zipCode: teacher.zipCode,
            tinNumber: teacher.tinNumber
          });
          
          // Only add teachers with at least a name
          if (teacher.firstName || teacher.lastName || teacher.callName) {
            teachers.push(teacher);
          }
        }
      }

      console.log(`Successfully processed ${teachers.length} teachers from TEACHER sheet`);
      return NextResponse.json({ teachers });
      
    } catch (fetchError) {
      console.error('Error fetching from TEACHER sheet URL:', csvUrl, fetchError);
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Error fetching Google Sheets TEACHER data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data from Google Sheets TEACHER tab. Make sure the sheet is publicly accessible and contains a TEACHER tab.',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST - Write teacher data to Google Sheets TEACHER tab
export async function POST(request: Request) {
  try {
    const { sheetId, teacherData } = await request.json();
    
    if (!sheetId || !teacherData) {
      return NextResponse.json({ error: 'Sheet ID and teacher data are required' }, { status: 400 });
    }

    // Note: For writing to Google Sheets, you'll need to use the Google Sheets API with proper authentication
    // This is a placeholder for the write functionality
    console.log('Writing teacher data to Google Sheets:', {
      sheetId,
      teacherData: {
        callName: teacherData.callName,
        fullName: `${teacherData.firstName} ${teacherData.lastName}`,
        dateOfBirth: teacherData.dateOfBirth,
        contactNumber: teacherData.phone,
        emailAddress: teacherData.email,
        address: teacherData.address,
        zipCode: teacherData.zipCode,
        tinNumber: teacherData.tinNumber
      }
    });
    
    // TODO: Implement actual Google Sheets API write functionality
    // This would require:
    // 1. Google Service Account credentials
    // 2. Google Sheets API authentication
    // 3. Append row to TEACHER sheet with proper column mapping
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teacher data prepared for Google Sheets (write functionality pending implementation)' 
    });
    
  } catch (error) {
    console.error('Error writing to Google Sheets TEACHER tab:', error);
    return NextResponse.json({ 
      error: 'Failed to write to Google Sheets TEACHER tab',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Helper function to properly parse CSV lines with quoted fields
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map(field => field.trim());
}
