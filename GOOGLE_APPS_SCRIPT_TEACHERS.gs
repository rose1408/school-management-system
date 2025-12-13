/**
 * Google Apps Script for Teacher Management Integration
 * This script handles adding teacher data to Google Sheets TEACHERS tab
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com/
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Deploy as web app with execute permissions: "Anyone"
 * 5. Copy the deployment URL and update it in the API route
 */

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    console.log('Received teacher data:', data);
    
    if (data.action === 'addTeacher') {
      return addTeacherToSheet(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Unknown action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addTeacherToSheet(data) {
  try {
    const sheetId = data.sheetId;
    const teacherData = data.teacherData;
    
    console.log('Adding teacher to sheet:', sheetId);
    console.log('Teacher data:', teacherData);
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    
    // Try to get the TEACHERS tab, create if it doesn't exist
    let sheet = spreadsheet.getSheetByName('TEACHERS');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('TEACHERS');
      
      // Add headers if it's a new sheet
      const headers = [
        'Teacher Call Name',
        'Full Name', 
        'Date of Birth',
        'Age',
        'Contact Number',
        'Email Address',
        'Address',
        'Zip Code',
        'TIN Number',
        'Instruments',
        'Date Added'
      ];
      
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
    }
    
    // Prepare the row data
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
      new Date().toISOString().split('T')[0] // Date Added
    ];
    
    console.log('Adding row data:', rowData);
    
    // Add the data to the next available row
    const lastRow = sheet.getLastRow();
    const newRowIndex = lastRow + 1;
    
    sheet.getRange(newRowIndex, 1, 1, rowData.length).setValues([rowData]);
    
    // Auto-resize columns for better visibility
    sheet.autoResizeColumns(1, rowData.length);
    
    console.log('Successfully added teacher to row:', newRowIndex);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Teacher added successfully to TEACHERS tab',
        rowIndex: newRowIndex,
        sheetName: 'TEACHERS'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error adding teacher to sheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Failed to add teacher: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function - you can run this to test the script
function testAddTeacher() {
  const testData = {
    action: 'addTeacher',
    sheetId: '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4',
    teacherData: {
      teacherCallName: 'John',
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      age: '34',
      contactNumber: '+63 917 123 4567',
      emailAddress: 'john.doe@example.com',
      address: '123 Music Street, Manila',
      zipCode: '1000',
      tinNumber: '123-456-789-000',
      instruments: 'Piano, Guitar'
    }
  };
  
  console.log('Test result:', addTeacherToSheet(testData));
}