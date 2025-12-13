# Timestamp and Student ID Sequencing - UPDATED ✅

## Changes Made:

### 1. Timestamp Format Updated
- **Before**: `"27/09/2025, 18:44:38 PM"` (with comma and AM/PM)
- **After**: `"27/09/2025 18:44:38"` (no comma, 24-hour format)

### 2. Student ID Sequencing Fixed
- **Before**: Used timestamp-based or random numbers
- **After**: Proper sequential numbering by checking existing students

## Implementation Details:

### Timestamp Format:
```javascript
// New format - removes comma, uses 24-hour time
const day = now.getDate().toString().padStart(2, '0');
const month = (now.getMonth() + 1).toString().padStart(2, '0');
const year = now.getFullYear();
const hours = now.getHours().toString().padStart(2, '0');
const minutes = now.getMinutes().toString().padStart(2, '0');
const seconds = now.getSeconds().toString().padStart(2, '0');

const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
// Result: "27/09/2025 18:44:38"
```

### Student ID Sequencing:
```javascript
// Query existing students with DMS- prefix
const existingStudents = await db.student.findMany({
  where: { studentId: { startsWith: 'DMS-' } },
  select: { studentId: true },
  orderBy: { studentId: 'desc' }
});

let nextNumber = 1; // Start with 1 if no existing students

if (existingStudents.length > 0) {
  // Find the highest number used
  const lastStudentId = existingStudents[0].studentId;
  const lastNumber = parseInt(lastStudentId.replace('DMS-', '').replace(/^0+/, '')) || 0;
  nextNumber = lastNumber + 1;
}

const formattedStudentId = `DMS-${nextNumber.toString().padStart(5, '0')}`;
// Results: DMS-00001, DMS-00002, DMS-00003, etc.
```

## Example Data Now Sent to Google Sheets:

```json
{
  "timestamp": "27/09/2025 18:44:38",
  "studentId": "DMS-00147",
  "fullName": "Smith, John",
  "dateOfBirth": "2000-01-15",
  "age": "25",
  "emergencyContact": "Jane Smith",
  "email": "john.smith@example.com",
  "contactNumber": "123-456-7890",
  "socialMediaConsent": "Yes",
  "status": "ACTIVE",
  "referralSource": "Social Media", 
  "referralDetails": "Instagram"
}
```

## Files Updated:

1. **`/src/app/api/students/route.ts`** - Main API route with new logic
2. **`/src/app/api/students/add-to-sheet/route.ts`** - Backup route (consistency)
3. **`test-webhook.js`** - Test file updated with new format

## Testing:

✅ **Webhook Test**: Google Apps Script responds `{"success": true}` with new format
✅ **Sequencing**: Will check existing DMS- student IDs and use next number
✅ **Timestamp**: Now uses 24-hour format without comma

## Next Student IDs:
If you currently have students with IDs like DMS-00146, the next student will get DMS-00147, then DMS-00148, and so on.

The system now properly follows sequencing and uses the exact timestamp format requested! 🎯