import { NextResponse } from 'next/server';

// For a simpler approach, we'll use the public CSV export feature
// This works with any public Google Sheet
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');
    
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID is required' }, { status: 400 });
    }

    // Use the ENROLLMENT tab (gid needs to be found or we can use the tab name in the URL)
    // For ENROLLMENT tab, we'll try to get the correct gid or use a different approach
    let csvUrl;
    
    // Try the ENROLLMENT tab export - we'll need to find the correct gid
    // For now, let's try a different approach using the sheet name
    try {
      // First try to get the ENROLLMENT sheet specifically
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=ENROLLMENT`;
      
      let response = await fetch(csvUrl);
      
      // If that doesn't work, try the export format with gid=0 (but this might not be the ENROLLMENT tab)
      if (!response.ok) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
        response = await fetch(csvUrl);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`);
      }

      const csvData = await response.text();
      console.log('Raw CSV data preview:', csvData.substring(0, 200));
      
      // Parse CSV data
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
      
      console.log('Headers found:', headers);
      console.log('Processing', lines.length - 1, 'data rows');
      
      const students = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = parseCSVLine(lines[i]);
          
          // Your ENROLLMENT sheet columns: Timestamp, Student ID, Student's Full Name, Date of Birth, Age, Person to notify in Case of Emergency, Email Address, Contact Number, Social Media Consent, Status, Referral Source, Referral Details
          const [
            timestamp = '',
            studentId = '',
            fullName = '',
            dateOfBirth = '',
            // age = '', // Not used
            emergencyContact = '',
            emailAddress = '',
            contactNumber = '',
            // socialMediaConsent = '', // Not used
            status = '',
            referralSource = '',
            referralDetails = ''
          ] = values;

          // Skip empty rows
          if (!fullName.trim() && !studentId.trim()) continue;

          // Split full name into first and last name (expecting "Last Name, First Name" format)
          const cleanName = fullName.replace(/"/g, '').trim();
          let firstName = '';
          let lastName = '';
          
          if (cleanName.includes(',')) {
            // Format: "Last Name, First Name"
            const nameParts = cleanName.split(',');
            lastName = nameParts[0]?.trim() || '';
            firstName = nameParts[1]?.trim() || '';
          } else {
            // Fallback: treat as "First Last" if no comma
            const nameParts = cleanName.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // Parse enrollment date from timestamp
          let enrollmentDate = new Date().toISOString().split('T')[0];
          if (timestamp.trim()) {
            try {
              const parsedDate = new Date(timestamp.trim());
              if (!isNaN(parsedDate.getTime())) {
                enrollmentDate = parsedDate.toISOString().split('T')[0];
              }
            } catch (e) {
              console.log('Date parsing error for timestamp:', timestamp, e);
            }
          }

          // Determine student status - default to active unless specifically marked inactive
          const normalizedStatus = status.trim().toLowerCase();
          const studentStatus = (normalizedStatus === 'inactive' || normalizedStatus === 'suspended' || normalizedStatus === 'withdrawn') ? 'inactive' : 'active';
          
          // Create student object
          const student = {
            id: studentId.trim() || `STU${String(i).padStart(3, '0')}`,
            firstName: firstName,
            lastName: lastName,
            email: emailAddress.trim(),
            phone: contactNumber.trim(),
            dateOfBirth: dateOfBirth.trim(),
            grade: 'Not specified', // Remove age-based grade assignment
            address: [referralSource.trim(), referralDetails.trim()].filter(Boolean).join(' - ') || 'Not specified',
            parentName: emergencyContact.trim(),
            parentPhone: '', // Not available as separate field
            enrollmentDate: enrollmentDate,
            studentId: studentId.trim() || `STU${String(i).padStart(3, '0')}`,
            status: studentStatus
          };
          
          console.log('Processed student:', student.firstName, student.lastName, 'Status:', student.status);
          
          // Only add students with at least a name
          if (student.firstName || student.lastName) {
            students.push(student);
          }
        }
      }

      console.log(`Successfully processed ${students.length} students from ENROLLMENT sheet`);
      return NextResponse.json({ students });
      
    } catch (fetchError) {
      console.error('Error fetching from specific URL:', csvUrl, fetchError);
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data from Google Sheets ENROLLMENT tab. Make sure the sheet is publicly accessible and contains an ENROLLMENT tab.',
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
