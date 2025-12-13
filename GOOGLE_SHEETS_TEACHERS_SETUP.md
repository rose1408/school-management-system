# Google Sheets Integration Setup for Teachers

## 📋 Step-by-Step Setup Instructions

### 1. Create Google Apps Script

1. **Go to Google Apps Script**: https://script.google.com/
2. **Click "New Project"**
3. **Replace the default code** with the contents of `GOOGLE_APPS_SCRIPT_TEACHERS.gs`
4. **Save the project** (name it "Teacher Management Integration")

### 2. Deploy the Script

1. **Click "Deploy" button** in the top right
2. **Choose "New deployment"**
3. **Set Type**: Web app
4. **Execute as**: Me (your email)
5. **Who has access**: Anyone
6. **Click "Deploy"**
7. **Copy the Web App URL** (it will look like: https://script.google.com/macros/s/...)

### 3. Update the API Route

Update the webhook URL in `/src/app/api/teachers/route.ts` line ~60:

```typescript
const webhookUrl = 'YOUR_COPIED_WEBHOOK_URL_HERE';
```

### 4. Test the Integration

1. **Run the test function** in Google Apps Script:
   - In the script editor, select `testAddTeacher` function
   - Click the "Run" button
   - Check your Google Sheet - it should create a TEACHERS tab with test data

2. **Test from your app**:
   - Add a new teacher through your web application
   - Check the TEACHERS tab in your Google Sheet
   - Data should appear automatically

## 📊 Google Sheet Structure

The script will automatically create a **TEACHERS** tab with these columns:

| Column | Description |
|--------|-------------|
| Teacher Call Name | First name or preferred name |
| Full Name | Complete name (First Last) |
| Date of Birth | Birth date |
| Age | Auto-calculated age |
| Contact Number | Phone number (formatted) |
| Email Address | Email contact |
| Address | Full address |
| Zip Code | Postal code |
| TIN Number | Tax identification number |
| Instruments | Comma-separated list of instruments |
| Date Added | When the record was created |

## 🔧 Your Sheet Details

- **Sheet ID**: `18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4`
- **Tab Name**: `TEACHERS` (will be created automatically)
- **Integration**: Real-time sync when adding teachers

## ✅ Features

- ✅ **Auto-creates TEACHERS tab** if it doesn't exist
- ✅ **Formats headers** with blue background
- ✅ **Auto-resizes columns** for better readability
- ✅ **Multiple instruments support** (comma-separated)
- ✅ **Philippine phone formatting** (+63 format)
- ✅ **Error handling** with detailed logging
- ✅ **Non-blocking sync** (won't break teacher creation if sheets fail)

## 🚀 Quick Start

1. Copy the Google Apps Script code
2. Deploy as web app
3. Update the webhook URL in your API
4. Add a teacher - it will automatically appear in Google Sheets!

## 🐛 Troubleshooting

**If teachers aren't appearing in Google Sheets:**

1. Check Google Apps Script logs for errors
2. Verify the webhook URL is correct
3. Ensure the sheet ID is accurate
4. Check that the script has proper permissions

**Permission Issues:**
- Make sure the script is deployed with "Anyone" access
- Grant necessary permissions when prompted
- The script needs access to Google Sheets

**Sheet Not Found:**
- Verify your sheet ID: `18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4`
- Make sure the sheet is accessible by the script