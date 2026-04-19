/**
 * Google Apps Script for Student Management
 * Handles both adding new students to ENROLLMENT sheet and syncing with Google Sheets
 * 
 * INSTRUCTIONS TO SET UP:
 * 1. Go to https://script.google.com/
 * 2. Create new project called "DMS Student Webhook"
 * 3. Replace all code with this script
 * 4. Click "Deploy" → "New deployment" → Select "Web app"
 * 5. Set Execute as: Your email
 * 6. Set Who has access: Anyone
 * 7. Copy the deployment URL
 * 8. Go to: src/app/api/students/route.ts
 * 9. Replace the webhookUrl with your new deployment URL
 * 10. Test at: /api/check-sheets-webhook?sheetId=YOUR_SHEET_ID
 */

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'DMS Student Webhook is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    console.log('📨 [' + new Date().toLocaleTimeString() + '] Webhook received');
    
    if (!e.postData || !e.postData.contents) {
      throw new Error('No post data received');
    }
    
    const data = JSON.parse(e.postData.contents);
    console.log('📋 Action:', data.action);
    console.log('📂 Sheet ID:', data.sheetId);
    
    if (data.action === 'addStudent') {
      return addStudentToSheet(data);
    } else if (data.action === 'updateStudent') {
      return updateStudentInSheet(data);
    } else {
      throw new Error('Unknown action: ' + data.action);
    }
    
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addStudentToSheet(data) {
  try {
    console.log('➕ Adding new student...');
    
    const sheetId = data.sheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
    
    console.log('🔓 Opening spreadsheet: ' + sheetId);
    let sheet;
    
    try {
      sheet = SpreadsheetApp.openById(sheetId);
    } catch (error) {
      console.error('❌ Cannot open spreadsheet:', error);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Cannot access sheet ' + sheetId + ': ' + error.toString(),
          hint: 'Make sure Sheet ID is correct and you have edit permissions'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the ENROLLMENT sheet
    const enrollmentSheet = sheet.getSheetByName('ENROLLMENT');
    
    if (!enrollmentSheet) {
      console.error('❌ ENROLLMENT sheet not found');
      const availableSheets = sheet.getSheets().map(s => s.getName());
      console.log('Available sheets:', availableSheets.join(', '));
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Sheet "ENROLLMENT" not found',
          availableSheets: availableSheets,
          hint: 'Please create a sheet named "ENROLLMENT" with columns: Timestamp, Student ID, Full Name, DOB, Age, Emergency Contact, Email, Phone, Social Media Consent, Status, Referral Source, Referral Details'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('📋 Found ENROLLMENT sheet');
    
    // Validate required data
    if (!data.data || !data.data.studentId) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Missing required field: studentId'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    try {
      const rowData = [
        data.data.timestamp || new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        data.data.studentId || '',
        data.data.fullName || '',
        data.data.dateOfBirth || '',
        data.data.age || '',
        data.data.emergencyContact || '',
        data.data.email || '',
        data.data.contactNumber || '',
        data.data.socialMediaConsent || '',
        data.data.status || 'ACTIVE',
        data.data.referralSource || '',
        data.data.referralDetails || ''
      ];
      
      console.log('✍️ Writing row with Student ID:', data.data.studentId);
      enrollmentSheet.appendRow(rowData);
      
      const lastRow = enrollmentSheet.getLastRow();
      console.log('✅ Student added at row', lastRow);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: 'Student ' + data.data.studentId + ' added to ENROLLMENT sheet',
          studentId: data.data.studentId,
          rowAdded: lastRow,
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } catch (writeError) {
      console.error('❌ Error writing to sheet:', writeError);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Failed to write to sheet: ' + writeError.toString(),
          hint: 'Check that ENROLLMENT sheet is not protected and you have edit permissions'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('❌ Error in addStudentToSheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStudentInSheet(data) {
  try {
    console.log('🔄 Updating student...');
    
    const sheetId = data.sheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
    
    console.log('🔓 Opening spreadsheet: ' + sheetId);
    let sheet;
    
    try {
      sheet = SpreadsheetApp.openById(sheetId);
    } catch (error) {
      console.error('❌ Cannot open spreadsheet:', error);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Cannot access sheet ' + sheetId + ': ' + error.toString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the ENROLLMENT sheet
    const enrollmentSheet = sheet.getSheetByName('ENROLLMENT');
    
    if (!enrollmentSheet) {
      console.error('❌ ENROLLMENT sheet not found');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Sheet "ENROLLMENT" not found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('📋 Found ENROLLMENT sheet');
    
    // Validate required data
    if (!data.data || !data.data.studentId) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Missing required field: studentId'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    try {
      // Find row with matching Student ID (column B)
      const allData = enrollmentSheet.getDataRange().getValues();
      let matchingRow = -1;
      
      for (let i = 0; i < allData.length; i++) {
        if (allData[i][1] === data.data.studentId) { // Column B is index 1
          matchingRow = i + 1; // Sheets are 1-indexed
          break;
        }
      }
      
      if (matchingRow === -1) {
        // If not found, add as new row
        console.log('⚠️ Student ID not found, adding as new row');
        return addStudentToSheet(data);
      }
      
      // Update the row
      const rowData = [
        data.data.timestamp || new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        data.data.studentId || '',
        data.data.fullName || '',
        data.data.dateOfBirth || '',
        data.data.age || '',
        data.data.emergencyContact || '',
        data.data.email || '',
        data.data.contactNumber || '',
        data.data.socialMediaConsent || '',
        data.data.status || 'ACTIVE',
        data.data.referralSource || '',
        data.data.referralDetails || ''
      ];
      
      console.log('🖊️ Updating row', matchingRow);
      enrollmentSheet.getRange(matchingRow, 1, 1, rowData.length).setValues([rowData]);
      
      console.log('✅ Student updated at row', matchingRow);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: 'Student ' + data.data.studentId + ' updated in ENROLLMENT sheet',
          studentId: data.data.studentId,
          rowUpdated: matchingRow,
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
      console.error('❌ Error updating sheet:', error);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Failed to update sheet: ' + error.toString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('❌ Error in updateStudentInSheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
