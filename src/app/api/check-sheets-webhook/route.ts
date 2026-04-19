import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to test if the Google Apps Script webhook is working
 * Usage: GET /api/check-sheets-webhook?sheetId=YOUR_SHEET_ID
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheetId = searchParams.get('sheetId');

  if (!sheetId) {
    return NextResponse.json({
      success: false,
      error: 'Missing sheetId parameter',
      usage: '/api/check-sheets-webhook?sheetId=YOUR_GOOGLE_SHEET_ID'
    }, { status: 400 });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    sheetId: sheetId,
    webhookUrl: 'https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec',
    tests: [] as any[]
  };

  try {
    // Test 1: Check if webhook is reachable with test data
    console.log('🔍 Test 1: Testing webhook connectivity...');
    const testPayload = {
      action: 'addStudent',
      sheetId: sheetId,
      data: {
        timestamp: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        studentId: 'TEST-DIAG-001',
        fullName: 'Test Diagnostic Student',
        dateOfBirth: '2010-01-01',
        age: '14',
        emergencyContact: 'Test Parent',
        email: 'test@diagnostic.com',
        contactNumber: '+63-9XX-XXX-XXXX',
        socialMediaConsent: 'No',
        status: 'TEST',
        referralSource: 'Diagnostic Test',
        referralDetails: 'This is a diagnostic test, please ignore'
      }
    };

    const webhookResponse = await fetch(
      'https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      }
    );

    const webhookText = await webhookResponse.text();
    let webhookJson = null;

    try {
      webhookJson = JSON.parse(webhookText);
    } catch {
      webhookJson = { raw: webhookText };
    }

    diagnostics.tests.push({
      name: 'Webhook Connectivity',
      status: webhookResponse.ok ? '✅ PASS' : '❌ FAIL',
      httpStatus: webhookResponse.status,
      statusText: webhookResponse.statusText,
      response: webhookJson,
      payload: testPayload
    });

    if (webhookResponse.ok && webhookJson?.success === false) {
      diagnostics.tests[0].status = '⚠️ PARTIAL - Webhook reached but failed to write';
    }

  } catch (error) {
    diagnostics.tests.push({
      name: 'Webhook Connectivity',
      status: '❌ FAIL',
      error: error instanceof Error ? error.message : String(error),
      hint: 'The webhook URL might be invalid, expired, or the Apps Script is not deployed'
    });
  }

  // Provide recommendations based on test results
  const failedTests = diagnostics.tests.filter(t => t.status.includes('FAIL') || t.status.includes('PARTIAL'));

  if (failedTests.length > 0) {
    diagnostics.tests.push({
      name: 'Troubleshooting Steps',
      recommendations: [
        '1. Go to https://script.google.com/',
        '2. Check if the "DMS Student Webhook" project exists',
        '3. Deploy it as a Web App with "Anyone" access',
        '4. Copy the new deployment URL from: Manage deployments → Latest version',
        '5. Update the webhook URL in: src/app/api/students/route.ts',
        '6. Try again'
      ]
    });
  } else {
    diagnostics.tests.push({
      name: '✅ All Systems Working',
      message: 'The webhook is functioning correctly. If data still isnt appearing, check:',
      recommendations: [
        '1. That the Google Sheet ID is correct',
        '2. That the "ENROLLMENT" sheet exists in your Google Sheet',
        '3. That your Google account has edit access to the sheet',
        '4. Check browser console for any error messages'
      ]
    });
  }

  return NextResponse.json(diagnostics);
}
