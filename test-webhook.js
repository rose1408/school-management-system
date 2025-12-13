// Test Google Apps Script webhook directly
const webhookUrl = "https://script.google.com/macros/s/AKfycbw_2hPsHFyUvhBLoIHtuJKy6wgS9UoHOZFS7t0twrK6nHhKxKQI1Ug2NwVwp4mZu5b8kw/exec";

const testData = {
  action: 'addStudent',
  sheetId: '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4',
  data: {
    timestamp: '27/09/2025 18:44:38',
    studentId: 'DMS-00001',
    fullName: 'Doe, John',
    dateOfBirth: '2000-01-01',
    age: '25',
    emergencyContact: 'Jane Doe',
    email: 'john@example.com',
    contactNumber: '123-456-7890',
    socialMediaConsent: 'Yes',
    status: 'ACTIVE',
    referralSource: 'Social Media',
    referralDetails: 'Instagram'
  }
};

console.log('Testing Google Apps Script webhook...');
console.log('Webhook URL:', webhookUrl);
console.log('Test Data:', JSON.stringify(testData, null, 2));

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  return response.text();
})
.then(data => {
  console.log('Webhook response (as text):', data);
  try {
    const jsonData = JSON.parse(data);
    console.log('Parsed JSON response:', jsonData);
  } catch (e) {
    console.log('Response is not JSON');
  }
})
.catch((error) => {
  console.error('Webhook error:', error);
});