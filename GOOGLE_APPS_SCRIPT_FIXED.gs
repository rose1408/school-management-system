function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    console.log('📨 Webhook received:', JSON.stringify(data));
    
    if (data.action === 'addStudent') {
      // Use sheetId from request, fallback to hardcoded if not provided
      const sheetId = data.sheetId || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4';
      
      console.log('📂 Opening sheet:', sheetId);
      let sheet;
      
      try {
        sheet = SpreadsheetApp.openById(sheetId);
      } catch (error) {
        console.error('❌ Failed to open spreadsheet:', error);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false, 
            error: `Cannot access sheet ${sheetId}: ${error.toString()}`
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Get the ENROLLMENT sheet
      const enrollmentSheet = sheet.getSheetByName('ENROLLMENT');
      
      if (!enrollmentSheet) {
        console.error('❌ Sheet "ENROLLMENT" not found');
        const availableSheets = sheet.getSheets().map(s => s.getName());
        console.log('Available sheets:', availableSheets);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false, 
            error: `Sheet "ENROLLMENT" not found. Available sheets: ${availableSheets.join(', ')}`
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      console.log('📋 Found ENROLLMENT sheet');
      
      // Validate required data
      if (!data.data || !data.data.studentId) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false, 
            error: 'Missing required fields: studentId'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const rowData = [
          data.data.timestamp || '',
          data.data.studentId || '',
          data.data.fullName || '',
          data.data.dateOfBirth || '',
          data.data.age || '',
          data.data.emergencyContact || '',
          data.data.email || '',
          data.data.contactNumber || '',
          data.data.socialMediaConsent || '',
          data.data.status || '',
          data.data.referralSource || '',
          data.data.referralDetails || ''
        ];
        
        console.log('📝 Writing row:', rowData);
        enrollmentSheet.appendRow(rowData);
        
        console.log('✅ Student added successfully:', data.data.studentId);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true, 
            message: `Student ${data.data.studentId} added to ENROLLMENT sheet`,
            rowAdded: enrollmentSheet.getLastRow()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (writeError) {
        console.error('❌ Error writing to sheet:', writeError);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false, 
            error: `Failed to write to sheet: ${writeError.toString()}`
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      console.warn('⚠️ Unknown action:', data.action);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: `Unknown action: ${data.action}`
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('❌ Fatal error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
