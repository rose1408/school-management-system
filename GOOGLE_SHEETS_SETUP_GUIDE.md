# Google Sheets Integration Setup Guide

## Step 1: Create Google Apps Script
1. Go to https://script.google.com/
2. Click "New Project"
3. Delete existing code
4. Copy and paste code from `WORKING_GOOGLE_APPS_SCRIPT.gs`
5. Rename project to "Teacher Management Script"
6. Save the project (Ctrl+S)

## Step 2: Deploy as Web App
1. Click "Deploy" → "New deployment"
2. Click gear icon → Select "Web app"
3. Set Description: "Teacher Management API"
4. Set Execute as: "Me"
5. Set Who has access: "Anyone"
6. Click "Deploy"
7. **IMPORTANT**: Copy the Web App URL (starts with https://script.google.com/macros/s/...)

## Step 3: Update Your App
1. Open `src/app/api/teachers/route.ts`
2. Find line with `WEBHOOK_URL`
3. Replace with your Web App URL from Step 2
4. Save the file

## Step 4: Test
1. Add a new teacher in your app
2. Check your Google Sheet for the new record
3. If it doesn't work, check the script logs at https://script.google.com/

## Troubleshooting
- If you get permission errors, make sure the script is deployed with "Anyone" access
- If data doesn't appear, check the Google Apps Script execution logs
- Make sure your Google Sheet ID is correct: `18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4`

## Google Sheet Setup
The script will automatically:
- Create a "TEACHERS" tab if it doesn't exist
- Add headers with proper formatting
- Add teacher data to new rows
- Auto-resize columns for better visibility

## Current Webhook URL to Replace
Replace this line in `src/app/api/teachers/route.ts`:
```typescript
const WEBHOOK_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```