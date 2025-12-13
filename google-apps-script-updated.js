/**
 * Google Apps Script for Teacher and Student Management - COMPLETE VERSION
 * 
 * INSTRUCTIONS:
 * 1. Go to https://script.google.com/
 * 2. Open your existing project or create new one
 * 3. Replace ALL code with this updated version
 * 4. Deploy as web app with "Anyone" access
 * 5. Make sure the web app URL is correct in your APIs
 */

function doGet(e) {
  return ContentService
    .createTextOutput("Teacher and Student Management Script is running with UPDATE support!")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    console.log('Received POST request');
    console.log('Post data:', e.postData);
    
    if (!e.postData || !e.postData.contents) {
      throw new Error('No post data received');
    }
    
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed data:', data);
    
    if (data.action === 'addTeacher') {
      return addTeacherToSheet(data);
    } else if (data.action === 'updateTeacher') {
      return updateTeacherInSheet(data);
    } else if (data.action === 'addStudent') {
      return addStudentToSheet(data);
    } else if (data.action === 'updateStudent') {
      return updateStudentInSheet(data);
    }
    
    throw new Error('Unknown action: ' + data.action);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addTeacherToSheet(data) {
  try {
    const sheetId = data.sheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
    const teacherData = data.teacherData;
    
    console.log('Adding teacher - Sheet ID:', sheetId);
    console.log('Adding teacher - Teacher data:', teacherData);
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    console.log('Opened spreadsheet:', spreadsheet.getName());
    
    // Get or create TEACHERS tab
    let sheet = spreadsheet.getSheetByName('TEACHERS');
    if (!sheet) {
      console.log('Creating new TEACHERS sheet');
      sheet = spreadsheet.insertSheet('TEACHERS');
      
      // Add headers
      const headers = [
        'Call Name',
        'Full Name', 
        'Date of Birth',
        'Age',
        'Contact Number',
        'Email',
        'Address',
        'ZIP Code',
        'TIN Number',
        'Instruments',
        'Added Date',
        'Last Updated'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#2563eb');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
    }
    
    // Prepare row data
    const now = new Date();
    const rowData = [
      teacherData.teacherCallName || '',
      teacherData.fullName || '',
      teacherData.dateOfBirth || '',
      teacherData.age || '',
      teacherData.contactNumber || '',
      teacherData.emailAddress || '',
      teacherData.address || '',
      teacherData.zipCode || '',
      teacherData.tinNumber || '',
      teacherData.instruments || '',
      now.toDateString(),
      now.toLocaleString()
    ];
    
    console.log('Row data to add:', rowData);
    
    // Add to next row
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('Added teacher to row:', newRow);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, rowData.length);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Teacher added successfully',
        rowNumber: newRow,
        sheetName: 'TEACHERS',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in addTeacherToSheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateTeacherInSheet(data) {
  try {
    const sheetId = data.sheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
    const teacherData = data.teacherData;
    
    console.log('Updating teacher - Sheet ID:', sheetId);
    console.log('Updating teacher - Teacher data:', teacherData);
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    console.log('Opened spreadsheet for update:', spreadsheet.getName());
    
    // Get TEACHERS sheet
    const sheet = spreadsheet.getSheetByName('TEACHERS');
    if (!sheet) {
      throw new Error('TEACHERS sheet not found');
    }
    
    // Get all data to search for the teacher
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    console.log('Total rows in sheet:', values.length);
    
    // Find teacher by email (most reliable identifier)
    let targetRow = -1;
    const emailColumn = 5; // Email is in column F (index 5, 0-based)
    
    for (let i = 1; i < values.length; i++) { // Start from row 1 (skip header)
      const rowEmail = values[i][emailColumn];
      console.log(`Row ${i + 1} email: "${rowEmail}" vs search email: "${teacherData.emailAddress}"`);
      
      if (rowEmail && rowEmail.toString().trim().toLowerCase() === teacherData.emailAddress.trim().toLowerCase()) {
        targetRow = i + 1; // Convert to 1-based row number
        console.log('Found teacher by email at row:', targetRow);
        break;
      }
    }
    
    // If not found by email, try by full name
    if (targetRow === -1) {
      console.log('Teacher not found by email, searching by full name...');
      const fullNameColumn = 1; // Full Name is in column B (index 1)
      
      for (let i = 1; i < values.length; i++) {
        const rowFullName = values[i][fullNameColumn];
        console.log(`Row ${i + 1} name: "${rowFullName}" vs search name: "${teacherData.fullName}"`);
        
        if (rowFullName && rowFullName.toString().trim().toLowerCase() === teacherData.fullName.trim().toLowerCase()) {
          targetRow = i + 1;
          console.log('Found teacher by full name at row:', targetRow);
          break;
        }
      }
    }
    
    if (targetRow === -1) {
      console.log('Teacher not found. Available emails in sheet:');
      for (let i = 1; i < values.length; i++) {
        console.log(`Row ${i + 1}: ${values[i][emailColumn]}`);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Teacher not found in spreadsheet',
          searchedEmail: teacherData.emailAddress,
          searchedName: teacherData.fullName,
          availableEmails: values.slice(1).map(row => row[emailColumn]).filter(email => email),
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Prepare updated row data
    const now = new Date();
    const updatedRowData = [
      teacherData.teacherCallName || '',
      teacherData.fullName || '',
      teacherData.dateOfBirth || '',
      teacherData.age || '',
      teacherData.contactNumber || '',
      teacherData.emailAddress || '',
      teacherData.address || '',
      teacherData.zipCode || '',
      teacherData.tinNumber || '',
      teacherData.instruments || '',
      values[targetRow - 1][10] || now.toDateString(), // Keep original added date
      now.toLocaleString() // Update the last updated timestamp
    ];
    
    console.log('Updated row data:', updatedRowData);
    
    // Update the row
    sheet.getRange(targetRow, 1, 1, updatedRowData.length).setValues([updatedRowData]);
    
    console.log('Successfully updated teacher at row:', targetRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Teacher updated successfully',
        rowNumber: targetRow,
        sheetName: 'TEACHERS',
        updatedData: teacherData,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in updateTeacherInSheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test functions
function testAddTeacher() {
  const testData = {
    action: 'addTeacher',
    sheetId: '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4',
    teacherData: {
      teacherCallName: 'Test Teacher',
      fullName: 'Test Teacher Name',
      dateOfBirth: '1990-01-01',
      age: '34',
      contactNumber: '+63 917 123 4567',
      emailAddress: 'test@example.com',
      address: '123 Test Street',
      zipCode: '1000',
      tinNumber: '123-456-789',
      instruments: 'Piano, Guitar'
    }
  };
  
  const result = addTeacherToSheet(testData);
  console.log('Add test result:', result.getContent());
}

function testUpdateTeacher() {
  const testData = {
    action: 'updateTeacher',
    sheetId: '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4',
    teacherData: {
      teacherCallName: 'Updated Test Teacher',
      fullName: 'Test Teacher Name', // Keep same name to find the record
      dateOfBirth: '1990-01-01',
      age: '34',
      contactNumber: '+63 917 999 8888', // Updated phone
      emailAddress: 'test@example.com', // Keep same email to find the record
      address: '456 Updated Street', // Updated address
      zipCode: '2000', // Updated zip
      tinNumber: '987-654-321', // Updated TIN
      instruments: 'Piano, Guitar, Violin' // Updated instruments
    }
  };
  
  const result = updateTeacherInSheet(testData);
  console.log('Update test result:', result.getContent());
}

// STUDENT MANAGEMENT FUNCTIONS

function addStudentToSheet(data) {
  try {
    const sheetId = data.sheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
    const studentData = data.data; // Note: student data is nested under 'data' key
    
    console.log('Adding student - Sheet ID:', sheetId);
    console.log('Adding student - Student data:', studentData);
    console.log('Full received data:', JSON.stringify(data, null, 2));
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    console.log('Opened spreadsheet:', spreadsheet.getName());
    
    // Get or create ENROLLMENT tab
    let sheet = spreadsheet.getSheetByName('ENROLLMENT');
    if (!sheet) {
      console.log('Creating new ENROLLMENT sheet');
      sheet = spreadsheet.insertSheet('ENROLLMENT');
      
      // Add headers to match your Google Sheets format
      const headers = [
        'Timestamp',           // A
        'Student ID',          // B  
        'Student Full Name',   // C
        'Date of Birth',       // D
        'Age',                 // E
        'Person to notify in case of emergency', // F
        'Email Address',       // G
        'Contact Number',      // H
        'Social Media Consent', // I
        'Status',              // J
        'How did you know about us?', // K
        'Follow-up answer'     // L
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#2563eb');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
    }
    
    // Prepare row data according to your format with fallback extraction
    const rowData = [
      studentData.timestamp || new Date().toLocaleString(),                              // A: Timestamp
      studentData.studentId || '',                                                      // B: Student ID
      studentData.fullName || `${studentData.lastName || ''}, ${studentData.firstName || ''}`.replace(', ,', '').trim() || '',  // C: Student Full Name (Last, First)
      studentData.dateOfBirth || '',                                                    // D: Date of Birth
      studentData.age || '',                                                            // E: Age
      studentData.emergencyContact || studentData.parentName || '',                     // F: Person to notify in case of emergency
      studentData.email || '',                                                          // G: Email Address
      studentData.contactNumber || studentData.phone || '',                            // H: Contact Number
      studentData.socialMediaConsent || '',                                             // I: Social Media Consent
      studentData.status || 'ACTIVE',                                                   // J: Status
      studentData.referralSource || studentData.howFound || '',                         // K: How did you know about us?
      studentData.referralDetails || ''                                                 // L: Follow-up answer
    ];
    
    console.log('Student row data to add:', rowData);
    console.log('Individual field values:');
    console.log('- timestamp:', studentData.timestamp);
    console.log('- studentId:', studentData.studentId);
    console.log('- fullName:', studentData.fullName);
    console.log('- dateOfBirth:', studentData.dateOfBirth);
    console.log('- age:', studentData.age);
    console.log('- emergencyContact:', studentData.emergencyContact);
    console.log('- email:', studentData.email);
    console.log('- contactNumber:', studentData.contactNumber);
    console.log('- socialMediaConsent:', studentData.socialMediaConsent);
    console.log('- status:', studentData.status);
    console.log('- referralSource:', studentData.referralSource);
    console.log('- referralDetails:', studentData.referralDetails);
    
    // Add to next row
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('Added student to row:', newRow);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, rowData.length);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Student added successfully',
        rowNumber: newRow,
        sheetName: 'ENROLLMENT',
        studentData: studentData,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in addStudentToSheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStudentInSheet(data) {
  try {
    const sheetId = data.sheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
    const studentData = data.data;
    
    console.log('Updating student - Sheet ID:', sheetId);
    console.log('Updating student - Student data:', studentData);
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    console.log('Opened spreadsheet for student update:', spreadsheet.getName());
    
    // Get ENROLLMENT sheet
    const sheet = spreadsheet.getSheetByName('ENROLLMENT');
    if (!sheet) {
      throw new Error('ENROLLMENT sheet not found');
    }
    
    // Get all data to search for the student
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    console.log('Total rows in enrollment sheet:', values.length);
    
    // Find student by email or student ID
    let targetRow = -1;
    const emailColumn = 6;     // Email is in column G (index 6, 0-based)
    const studentIdColumn = 1; // Student ID is in column B (index 1, 0-based)
    
    for (let i = 1; i < values.length; i++) { // Start from row 1 (skip header)
      const rowEmail = values[i][emailColumn];
      const rowStudentId = values[i][studentIdColumn];
      
      // Try to match by student ID first, then by email
      if ((studentData.studentId && rowStudentId && rowStudentId.toString().trim() === studentData.studentId.trim()) ||
          (studentData.email && rowEmail && rowEmail.toString().trim().toLowerCase() === studentData.email.trim().toLowerCase())) {
        targetRow = i + 1; // Convert to 1-based row number
        console.log('Found student at row:', targetRow);
        break;
      }
    }
    
    if (targetRow === -1) {
      console.log('Student not found for update');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Student not found in spreadsheet',
          searchedEmail: studentData.email,
          searchedStudentId: studentData.studentId,
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Prepare updated row data
    const updatedRowData = [
      values[targetRow - 1][0] || new Date().toLocaleString(),  // A: Keep original timestamp
      studentData.studentId || '',                             // B: Student ID
      studentData.fullName || '',                              // C: Student Full Name
      studentData.dateOfBirth || '',                           // D: Date of Birth
      studentData.age || '',                                   // E: Age
      studentData.emergencyContact || '',                      // F: Person to notify in case of emergency
      studentData.email || '',                                 // G: Email Address
      studentData.contactNumber || '',                         // H: Contact Number
      studentData.socialMediaConsent || '',                    // I: Social Media Consent
      studentData.status || 'ACTIVE',                          // J: Status
      studentData.referralSource || '',                        // K: How did you know about us?
      studentData.referralDetails || ''                        // L: Follow-up answer
    ];
    
    console.log('Updated student row data:', updatedRowData);
    
    // Update the row
    sheet.getRange(targetRow, 1, 1, updatedRowData.length).setValues([updatedRowData]);
    
    console.log('Successfully updated student at row:', targetRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Student updated successfully',
        rowNumber: targetRow,
        sheetName: 'ENROLLMENT',
        updatedData: studentData,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in updateStudentInSheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test functions for students
function testAddStudent() {
  const testData = {
    action: 'addStudent',
    sheetId: '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4',
    data: {
      timestamp: new Date().toLocaleString(),
      studentId: 'DMS-00001',
      fullName: 'Smith, John',
      dateOfBirth: '2005-03-15',
      age: '18',
      emergencyContact: 'Jane Smith (Mother)',
      email: 'john.smith@email.com',
      contactNumber: '+63 917 123 4567',
      socialMediaConsent: 'Yes',
      status: 'ACTIVE',
      referralSource: 'Social Media',
      referralDetails: 'Facebook'
    }
  };
  
  const result = addStudentToSheet(testData);
  console.log('Add student test result:', result.getContent());
}

function testUpdateStudent() {
  const testData = {
    action: 'updateStudent',
    sheetId: '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4',
    data: {
      studentId: 'DMS-00001',
      fullName: 'Smith, John Michael', // Updated name
      dateOfBirth: '2005-03-15',
      age: '18',
      emergencyContact: 'Jane Smith (Mother)',
      email: 'john.smith@email.com',
      contactNumber: '+63 917 999 8888', // Updated contact
      socialMediaConsent: 'Yes',
      status: 'ACTIVE',
      referralSource: 'Social Media',
      referralDetails: 'Facebook'
    }
  };
  
  const result = updateStudentInSheet(testData);
  console.log('Update student test result:', result.getContent());
}