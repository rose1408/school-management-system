# Google Sheets Integration Fix

## Problems Found

### ❌ Issue 1: Hardcoded Sheet ID
Your AppScript has a hardcoded sheet ID that never changes, but your Next.js API is sending different `sheetId` values.
```javascript
// OLD - Always uses the same sheet
const sheet = SpreadsheetApp.openById('18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4');
```

### ❌ Issue 2: No Sheet Validation
The script doesn't check if the 'ENROLLMENT' sheet exists, so it fails silently.

### ❌ Issue 3: Missing Error Details
If something fails, you get no useful error message to debug.

### ❌ Issue 4: No Logging
You can't see if the webhook was even called.

---

## ✅ How to Fix

### Step 1: Replace the AppScript
1. Open your Google Apps Script editor
2. Replace the entire `doPost` function with the code from `GOOGLE_APPS_SCRIPT_FIXED.gs`
3. Save and deploy

### Step 2: Verify Your Sheet
Make sure you have a sheet named exactly **"ENROLLMENT"** with these column headers:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Student ID | Full Name | DOB | Age | Emergency Contact | Email | Contact # | Social Media Consent | Status | Referral Source | Referral Details |

### Step 3: Check the Logs
1. In Google Apps Script: **View** → **Logs**
2. When you add a student from your app, you should see entries like:
   ```
   📨 Webhook received: {"action":"addStudent",...}
   📂 Opening sheet: [sheetId]
   📋 Found ENROLLMENT sheet
   📝 Writing row: [timestamp, studentId, ...]
   ✅ Student added successfully: DMS-00001
   ```

### Step 4: Monitor Browser Console
In your Vercel app, open DevTools Console and look for:
- **Success**: `Successfully added student to Google Sheets`
- **Failure**: `Google Sheets API Error` with details

---

## Debugging Checklist

- [ ] Sheet ID in Vercel matches your Google Sheet URL
- [ ] 'ENROLLMENT' sheet exists with correct name (case-sensitive)
- [ ] Column headers are correct
- [ ] AppScript permissions allow Sheets API access
- [ ] AppScript deployment is still active (redeploy if needed)
- [ ] Check AppScript logs for error messages
- [ ] Check browser console for webhook response

---

## If Still Not Working

### Check 1: Is the webhook being called?
Add this to browser console while creating a student:
```javascript
fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
  method: 'POST',
  body: JSON.stringify({
    action: 'addStudent',
    sheetId: 'YOUR_SHEET_ID',
    data: {
      timestamp: new Date().toLocaleString(),
      studentId: 'TEST-00001',
      fullName: 'Test Student',
      email: 'test@example.com'
    }
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
```

### Check 2: Verify Webhook URL is correct
Find your webhook URL in [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) or re-deploy the AppScript.

### Check 3: Sheet Permissions
Make sure the sheet is not restricted and allows the AppScript to write.

---

## Key Changes Made

✅ Uses `data.sheetId` from request instead of hardcoded ID  
✅ Validates 'ENROLLMENT' sheet exists  
✅ Lists available sheets if 'ENROLLMENT' not found  
✅ Adds comprehensive logging with emojis for clarity  
✅ Returns detailed error messages  
✅ Validates required fields before writing  
✅ Shows the row number that was added  
