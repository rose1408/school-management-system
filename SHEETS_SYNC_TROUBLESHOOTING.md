# 🔧 Google Sheets Sync Troubleshooting & Setup Guide

**Issue**: Students appear in your app database but NOT in Google Sheets

## ✅ Quick Diagnostic Test

First, test if the webhook is working:

1. Open your browser and go to:
   ```
   https://discovermusic-live.vercel.app/api/check-sheets-webhook?sheetId=YOUR_GOOGLE_SHEET_ID
   ```

2. Replace `YOUR_GOOGLE_SHEET_ID` with your actual sheet ID (from the Google Sheet URL)

3. Check the response:
   - **If you see ✅ PASS**: Webhook is working → Problem is elsewhere
   - **If you see ❌ FAIL**: Webhook is not working → Follow setup steps below
   - **If you see ⚠️ PARTIAL**: Webhook reached but Apps Script has an error

---

## 🚀 Step-by-Step Setup

### **Step 1: Create/Update Google Apps Script**

1. Go to https://script.google.com/
2. Click **"Create new project"** or open existing "DMS Student Webhook" project
3. Delete all existing code
4. Copy-paste the code from: [GOOGLE_APPS_SCRIPT_STUDENTS_UPDATED.gs](GOOGLE_APPS_SCRIPT_STUDENTS_UPDATED.gs)
5. Name the project: `DMS Student Webhook`
6. Click the **"Save"** button (Ctrl+S)

### **Step 2: Deploy as Web App**

1. Click **"Deploy"** button → **"New deployment"**
2. Select the gear icon (⚙️) → choose **"Web app"**
3. Set these options:
   - **Execute as**: Your Google account email
   - **Who has access**: **Anyone** (this is required!)
4. Click **"Deploy"**
5. Copy the **Deployment URL** from the dialog
   - It looks like: `https://script.google.com/macros/s/AKfy...../exec`

### **Step 3: Update the Webhook URL in Your App**

1. Open: [src/app/api/students/route.ts](src/app/api/students/route.ts)
2. Find this line (around line 117 & 283):
   ```typescript
   const webhookUrl = `https://script.google.com/macros/s/AKfycbw_...`;
   ```
3. Replace it with your new deployment URL
4. Save the file and push to Vercel/deploy

**OR** if using environment variables (more secure):
1. Add to your `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_NEW_URL/exec
   ```
2. Update route.ts:
   ```typescript
   const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/...';
   ```

### **Step 4: Verify Google Sheet Structure**

Your Google Sheet must have:

1. **Sheet named "ENROLLMENT"** (exact name, case-sensitive)
2. **Header row with these columns** (in order):
   - A: Timestamp
   - B: Student ID
   - C: Full Name
   - D: Date of Birth
   - E: Age
   - F: Emergency Contact
   - G: Email Address
   - H: Contact Number
   - I: Social Media Consent
   - J: Status
   - K: Referral Source
   - L: Referral Details

3. **Sheet is not protected** (check: Tools → Protect sheets and ranges)
4. **Google Apps Script has EDIT permissions** to the sheet

### **Step 5: Configure Sheet ID in Your App**

1. Get your Google Sheet ID from: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
2. Go to: https://discovermusic-live.vercel.app/students
3. Click **"Configure Sheets"** button (top right)
4. Paste your Google Sheet ID
5. Click **Save**

---

## 🧪 Test the Sync

### **Test 1: Add a New Student**
1. Go to https://discovermusic-live.vercel.app/students
2. Click **"Add New Student"**
3. Fill in form and submit
4. Check your Google Sheet → should appear in ENROLLMENT tab

### **Test 2: Edit a Student**
1. Find an existing student
2. Click edit
3. Change something (e.g., phone number)
4. Save
5. Check Google Sheet → row should be updated

### **Test 3: Manual Sync**
1. Go to https://discovermusic-live.vercel.app/students
2. Click **"Sync with Google Sheets"** button
3. Wait for success message
4. Refresh your Google Sheet

---

## 🐛 Troubleshooting

### **Problem: "Failed to add student to Google Sheets"**

**Check:**
1. ✅ Is Google Apps Script deployed? 
   - Go to https://script.google.com/
   - Open your project
   - Click "Deployments" (left sidebar)
   - Do you see a recent deployment?

2. ✅ Is the deployment URL correct?
   - Get URL from "Deployments" → copy exact URL
   - Update [src/app/api/students/route.ts](src/app/api/students/route.ts)

3. ✅ Does "ENROLLMENT" sheet exist?
   - Open your Google Sheet
   - Check all sheet tabs at the bottom
   - Do you see one named "ENROLLMENT"?

4. ✅ Is the sheet unprotected?
   - Go to Sheet → Tools → "Protect sheets and ranges"
   - Remove any protections on ENROLLMENT sheet

5. ✅ Does Google Apps Script have permissions?
   - When you deployed, did you see permission prompt?
   - Grant all permissions to the Apps Script

### **Problem: Diagnostic test returns FAIL**

Run this and check the detailed error response:
```
https://discovermusic-live.vercel.app/api/check-sheets-webhook?sheetId=YOUR_SHEET_ID
```

**Common errors:**
- `Cannot access sheet XXX: Error: Invalid spreadsheet ID` → Wrong Sheet ID
- `Sheet "ENROLLMENT" not found` → Create or rename sheet to "ENROLLMENT"
- `Cannot open spreadsheet: Error: You do not have permission` → Apps Script needs permissions

### **Problem: No errors, but students still not appearing**

Check the browser console for any network issues:
1. Open DevTools (F12)
2. Go to **Console** tab
3. Add a new student
4. Look for messages starting with 📤 or ❌
5. Take a screenshot of the error

---

## 📋 Webhook URL Status

**Current webhook URL**: 
```
https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec
```

**Status**: ⚠️ May be outdated - follow setup steps to deploy new URL

---

## 🔐 Security Notes

- The webhook URL can be public (it's read-only for Sheet contents)
- Only Google Apps Script can write to your sheet
- Your Sheet ID should match what's in your Google Apps Script

## 📱 Next Steps

1. **Follow the Setup steps** (Steps 1-5 above)
2. **Run the diagnostic test**
3. **Try adding a test student**
4. **Check browser console** (F12) for any error messages
5. **Share any error messages** if still not working

---

**Need help?** Check:
- Browser console errors (F12 → Console)
- Google Apps Script execution logs (script.google.com → project → Execution)
- Server logs (if using custom domain)
