/**
 * Google Apps Script for Teacher Management - WORKING VERSION
 * 
 * INSTRUCTIONS:
 * 1. Go to https://script.google.com/
 * 2. Create new project
 * 3. Paste this code
 * 4. Deploy as web app with "Anyone" access
 * 5. Copy the web app URL and update the teacher API
 */

function doGet(e) {
  return ContentService
    .createTextOutput("Teacher Management Script is running!")
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
    
    console.log('Sheet ID:', sheetId);
    console.log('Teacher data received:', JSON.stringify(teacherData, null, 2));
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    console.log('Opened spreadsheet:', spreadsheet.getName());
    
    // Get or create TEACHERS_TAB
    let sheet = spreadsheet.getSheetByName('TEACHERS_TAB');
    if (!sheet) {
      console.log('TEACHERS_TAB not found, creating new sheet');
      sheet = spreadsheet.insertSheet('TEACHERS_TAB');
      
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
        'Added Time'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#2563eb');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      
      console.log('Headers added to new TEACHERS_TAB sheet');
    } else {
      console.log('Found existing TEACHERS_TAB sheet');
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
      now.toTimeString()
    ];
    
    console.log('Row data to add:', JSON.stringify(rowData, null, 2));
    
    // Add to next row
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    console.log('Last row:', lastRow, 'New row will be:', newRow);
    
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    
    console.log('Successfully added teacher to row:', newRow);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, rowData.length);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Teacher added successfully to TEACHERS_TAB',
        rowNumber: newRow,
        sheetName: 'TEACHERS_TAB',
        timestamp: new Date().toISOString(),
        dataAdded: rowData
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in addTeacherToSheet:', error);
    console.error('Error stack:', error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function - you can run this in Google Apps Script to test
function testTeacher() {
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
  
  console.log('Running test with data:', JSON.stringify(testData, null, 2));
  const result = addTeacherToSheet(testData);
  console.log('Test result:', result.getContent());
  return result.getContent();
}