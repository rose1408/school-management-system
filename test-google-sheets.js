// Quick test to verify Google Sheets integration
const testStudent = {
  firstName: "Test",
  lastName: "Student", 
  email: "test@example.com",
  phone: "123-456-7890",
  dateOfBirth: "2000-01-01",
  age: "24",
  parentName: "Test Parent",
  parentPhone: "123-456-7891",
  enrollmentDate: "2025-09-27",
  googleSheetId: "18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4", // Your Google Sheet ID
  socialMediaConsent: "Yes",
  howFound: "Social Media",
  socialMediaPlatform: "Instagram",
  referralDetails: "Instagram"
};

fetch('http://localhost:3004/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testStudent)
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch((error) => {
  console.error('Error:', error);
});