import { NextResponse } from 'next/server';

// API endpoint to add a new student to Google Sheets ENROLLMENT tab
// This will be called after successfully creating a student in the local database
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.sheetId) {
      return NextResponse.json({ error: 'Google Sheet ID is required' }, { status: 400 });
    }
    
    // For now, we'll use a webhook/IFTTT approach or Google Apps Script
    // The most reliable way is to use Google Apps Script on the sheet side
    
    // Method 1: Using Google Apps Script webhook (now configured!)
    const webhookUrl = `https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec`;
    
    // Prepare data according to your ENROLLMENT column mapping:
    // Timestamp | Student ID | Student's Full Name | Date of Birth | Age | Person to notify in Case of Emergency | Email Address | Contact Number | Social Media Consent | Status | Referral Source | Referral Details
    
    // Format timestamp without comma: "27/09/2025 18:44:38"
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    
    // Generate sequential student ID (DMS-00XXX format)
    // Extract number from existing studentId or generate a new sequential one
    let studentNumber;
    if (data.studentId && data.studentId.includes('DMS-')) {
      // If already has DMS format, extract the number
      studentNumber = data.studentId.replace('DMS-', '');
    } else if (data.studentId && data.studentId.startsWith('STU')) {
      // If has STU format, convert to sequential number
      studentNumber = data.studentId.replace(/\D/g, '').slice(-3);
    } else {
      // Generate new sequential number based on timestamp
      const timestamp = Date.now();
      studentNumber = timestamp.toString().slice(-5); // Use last 5 digits for uniqueness
    }
    
    const formattedStudentId = `DMS-${studentNumber.padStart(5, '0')}`;
    
    // Prepare follow-up answer for Column L (Referral Details)
    let referralDetails = '';
    
    console.log('Processing follow-up data:', {
      howFound: data.howFound,
      socialMediaPlatform: data.socialMediaPlatform,
      referralDetails: data.referralDetails
    });
    
    if (data.howFound === 'Social Media') {
      if (data.socialMediaPlatform) {
        referralDetails = data.socialMediaPlatform; // This will be "Instagram", "Facebook", etc.
      } else if (data.referralDetails) {
        referralDetails = data.referralDetails; // Fallback to general referral details
      } else {
        referralDetails = 'Social Media'; // Default if no platform specified
      }
    } else if (data.howFound === 'Referred' || data.howFound === 'Friend Referred') {
      referralDetails = data.referralDetails || 'Referred'; // Name of referrer
    } else if (data.howFound === 'Walk-in' || data.howFound === 'Walked By') {
      referralDetails = 'Walk-in'; // For walk-ins
    } else {
      referralDetails = data.referralDetails || '';
    }
    
    const sheetData = {
      timestamp: formattedTimestamp,
      studentId: formattedStudentId,
      fullName: `${data.lastName || ''}, ${data.firstName || ''}`.replace(', ,', '').trim(),
      dateOfBirth: data.dateOfBirth || '', // Already in YYYY-MM-DD format from HTML date input
      age: data.age || '',
      emergencyContact: data.parentName || '',
      email: data.email || '',
      contactNumber: data.phone || '',
      socialMediaConsent: data.socialMediaConsent || '',
      status: data.status || 'ACTIVE',
      referralSource: data.howFound || '',
      referralDetails: referralDetails // Column L - follow-up answers go here
    };
    
    console.log('Sending student data to Google Sheets:', sheetData);
    
    // Send data to Google Apps Script
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addStudent',
        sheetId: data.sheetId,
        data: sheetData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Google Sheets API failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('Google Sheets response:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Student successfully added to Google Sheets ENROLLMENT tab!',
      googleResponse: result,
      data: sheetData 
    });
  } catch (error) {
    console.error('Error adding student to Google Sheets:', error);
    return NextResponse.json({ 
      error: 'Failed to add student to Google Sheets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Instructions for setting up Google Apps Script webhook:
/*
1. Go to script.google.com
2. Create a new project
3. Replace the default code with:

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'addStudent') {
      const sheet = SpreadsheetApp.openById(data.sheetId);
      const enrollmentSheet = sheet.getSheetByName('ENROLLMENT');
      
      if (!enrollmentSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({error: 'ENROLLMENT sheet not found'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Add the data as a new row
      const rowData = [
        data.data.timestamp,
        data.data.studentId,
        data.data.fullName,
        data.data.dateOfBirth,
        data.data.age,
        data.data.emergencyContact,
        data.data.email,
        data.data.contactNumber,
        data.data.socialMediaConsent,
        data.data.status,
        data.data.referralSource,
        data.data.referralDetails
      ];
      
      enrollmentSheet.appendRow(rowData);
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, row: rowData}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

4. Deploy as web app
5. Set permissions to "Anyone" for execution
6. Copy the web app URL and replace YOUR_SCRIPT_ID above
*/