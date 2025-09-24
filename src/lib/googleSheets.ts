import { google } from 'googleapis';

// Google Sheets configuration
const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const RANGE = 'Students!A:L'; // Adjust range based on your sheet structure

interface StudentRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  grade: string;
  address: string;
  parentName: string;
  parentPhone: string;
  enrollmentDate: string;
  studentId: string;
}

export class GoogleSheetsService {
  private sheets;

  constructor() {
    this.sheets = google.sheets({ version: 'v4', auth: API_KEY });
  }

  async getStudents(): Promise<StudentRow[]> {
    try {
      if (!SHEET_ID || !API_KEY) {
        console.warn('Google Sheets credentials not configured');
        return [];
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values || [];
      
      // Skip header row and convert to student objects
      return rows.slice(1).map((row: any[], index: number) => ({
        id: (index + 1).toString(),
        firstName: row[0] || '',
        lastName: row[1] || '',
        email: row[2] || '',
        phone: row[3] || '',
        dateOfBirth: row[4] || '',
        grade: row[5] || '',
        address: row[6] || '',
        parentName: row[7] || '',
        parentPhone: row[8] || '',
        enrollmentDate: row[9] || '',
        studentId: row[10] || `STU${String(index + 1).padStart(3, '0')}`
      }));
    } catch (error) {
      console.error('Error fetching students from Google Sheets:', error);
      return [];
    }
  }

  async addStudent(student: Omit<StudentRow, 'id'>): Promise<boolean> {
    try {
      if (!SHEET_ID || !API_KEY) {
        console.warn('Google Sheets credentials not configured');
        return false;
      }

      const values = [[
        student.firstName,
        student.lastName,
        student.email,
        student.phone,
        student.dateOfBirth,
        student.grade,
        student.address,
        student.parentName,
        student.parentPhone,
        student.enrollmentDate,
        student.studentId
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: RANGE,
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      return true;
    } catch (error) {
      console.error('Error adding student to Google Sheets:', error);
      return false;
    }
  }

  async updateStudent(rowIndex: number, student: StudentRow): Promise<boolean> {
    try {
      if (!SHEET_ID || !API_KEY) {
        console.warn('Google Sheets credentials not configured');
        return false;
      }

      const values = [[
        student.firstName,
        student.lastName,
        student.email,
        student.phone,
        student.dateOfBirth,
        student.grade,
        student.address,
        student.parentName,
        student.parentPhone,
        student.enrollmentDate,
        student.studentId
      ]];

      const range = `Students!A${rowIndex + 2}:K${rowIndex + 2}`; // +2 because of header row and 0-based index

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      return true;
    } catch (error) {
      console.error('Error updating student in Google Sheets:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
