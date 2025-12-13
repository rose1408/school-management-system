# Google Sheets Integration Setup for DMS 1.0

## Overview
Your DMS 1.0 now has a **one-way sync system**:

1. **Sync FROM Google Sheets TO Web App**: Reads data from your ENROLLMENT tab and updates the web app
2. **Add Student Form TO Google Sheets**: When someone submits the Add Student form, it gets recorded in your Google Sheet

## Your Google Sheet Information
- **Sheet ID**: `18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4`
- **Tab Name**: `ENROLLMENT`
- **Column Mapping**:
  - A: Timestamp
  - B: Student ID  
  - C: Student's Full Name
  - D: Date of Birth
  - E: Age
  - F: Person to notify in Case of Emergency
  - G: Email Address
  - H: Contact Number
  - I: Social Media Consent
  - J: Status
  - K: Referral Source
  - L: Referral Details

## Setting Up Google Apps Script (To Enable Writing to Google Sheets)

### Step 1: Create Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Replace the default code with the script below
4. Save the project (name it something like "DMS Student Registration")

### Step 2: Google Apps Script Code
```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Received data:', data);
    
    if (data.action === 'addStudent') {
      // Open your specific Google Sheet
      const sheet = SpreadsheetApp.openById('18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4');
      const enrollmentSheet = sheet.getSheetByName('ENROLLMENT');
      
      if (!enrollmentSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({error: 'ENROLLMENT sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Prepare the row data according to your column mapping
      const rowData = [
        data.data.timestamp,              // A: Timestamp
        data.data.studentId,              // B: Student ID
        data.data.fullName,               // C: Student's Full Name
        data.data.dateOfBirth,            // D: Date of Birth
        data.data.age,                    // E: Age
        data.data.emergencyContact,       // F: Person to notify in Case of Emergency
        data.data.email,                  // G: Email Address
        data.data.contactNumber,          // H: Contact Number
        data.data.socialMediaConsent,     // I: Social Media Consent
        data.data.status,                 // J: Status
        data.data.referralSource,         // K: Referral Source
        data.data.referralDetails         // L: Referral Details
      ];
      
      // Add the row to the sheet
      enrollmentSheet.appendRow(rowData);
      
      console.log('Successfully added student to ENROLLMENT sheet:', data.data.fullName);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: 'Student added to ENROLLMENT sheet',
          student: data.data.fullName,
          row: rowData.length
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        error: 'Failed to process request: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function for debugging
function testAddStudent() {
  const testData = {
    action: 'addStudent',
    data: {
      timestamp: new Date().toLocaleString(),
      studentId: 'STU001',
      fullName: 'Doe, John',
      dateOfBirth: '2000-01-01',
      age: '24',
      emergencyContact: 'Jane Doe',
      email: 'john.doe@example.com',
      contactNumber: '09XX-XXX-XXXX',
      socialMediaConsent: 'Yes, I consent',
      status: 'active',
      referralSource: 'Social Media',
      referralDetails: 'Facebook'
    }
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  return doPost(mockEvent);
}
```

### Step 3: Deploy the Script
1. Click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone" (important!)
5. Click "Deploy"
6. Copy the web app URL (it will look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### Step 4: Update Your DMS App
Once you have the web app URL, you need to update the file:
`src/app/api/students/add-to-sheet/route.ts`

Replace `YOUR_SCRIPT_ID` with your actual script ID from the URL.

## How It Works Now

### 1. Sync FROM Google Sheets (One-way)
- Click "Sync from Sheets" button in the Students page
- Reads data from your ENROLLMENT tab
- Updates/adds students in the web app database
- **Never writes back to Google Sheets**

### 2. Add New Students TO Google Sheets
- Fill out the "Add Student" form in your web app
- Data gets saved to local database AND sent to Google Sheets
- New row is automatically added to your ENROLLMENT tab
- Includes all form data: name, email, phone, social media consent, referral info, etc.

## Testing
1. After setting up the Google Apps Script, test it by adding a new student through your web app
2. Check your ENROLLMENT tab - you should see the new student added
3. The sync function will continue to work one-way (FROM Google Sheets TO app)

## Benefits
- ✅ One-way sync prevents accidental data loss
- ✅ Google Sheets remains the master source for existing data
- ✅ New registrations automatically go to Google Sheets
- ✅ Complete audit trail with timestamps
- ✅ No risk of overwriting Google Sheets data during sync