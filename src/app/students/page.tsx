"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, User, Mail, Phone, Calendar, MapPin, BookOpen, Download, RefreshCw, Settings } from "lucide-react";
import { useRealtimeStudents } from "@/hooks/useRealtimeStudents";
import { Student } from "@/lib/db";

export default function StudentsPage() {
  // Use Firebase real-time hook
  const { students: realtimeStudents, loading: realtimeLoading, error: realtimeError } = useRealtimeStudents();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Google Sheets integration states
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [googleSheetId, setGoogleSheetId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Update students when real-time data changes
  useEffect(() => {
    if (realtimeStudents) {
      setStudents(realtimeStudents);
    }
  }, [realtimeStudents]);

  // Handle client-side hydration and load Google Sheets config
  useEffect(() => {
    setIsClient(true);
    const savedSheetId = localStorage.getItem('googleSheetId') || "";
    const savedSyncTime = localStorage.getItem('lastSyncTime');
    setGoogleSheetId(savedSheetId);
    setLastSyncTime(savedSyncTime);
    
    // Set up auto-sync if Google Sheets is configured
    const autoSyncInterval = setInterval(() => {
      if (savedSheetId.trim()) {
        console.log('Auto-syncing with Google Sheets...');
        syncWithGoogleSheets(false); // Don't show alert for auto-sync
      }
    }, 5 * 60 * 1000); // Auto-sync every 5 minutes
    
    // Cleanup intervals on component unmount
    return () => {
      clearInterval(autoSyncInterval);
    };
  }, []);

  // Remove the old loadStudents function since we're using real-time data
  
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleAddStudent = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student record?\n\nNote: This will only remove the student from your app database. Your Google Sheets data will remain completely untouched and safe.")) {
      try {
        const response = await fetch(`/api/students?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Real-time updates will automatically refresh the list
          console.log('Student deleted successfully');
        } else {
          const data = await response.json();
          alert('Failed to delete student: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student');
      }
    }
  };

  // Batch delete function
  const handleBatchDelete = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select students to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStudents.length} selected students?\n\nNote: This will only remove the students from your app database. Your Google Sheets data will remain completely untouched and safe.`)) {
      return;
    }

    try {
      for (const studentId of selectedStudents) {
        const response = await fetch(`/api/students?id=${studentId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.error('Failed to delete student:', studentId);
        }
      }
      
      setSelectedStudents([]);
      alert(`Successfully deleted ${selectedStudents.length} students!`);
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Failed to delete students');
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students
  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  // Google Sheets integration functions
  const syncWithGoogleSheets = async (showAlert = true) => {
    if (!googleSheetId.trim()) {
      if (showAlert) {
        alert('Please configure your Google Sheet ID first');
        setIsGoogleSheetsModalOpen(true);
      }
      return;
    }

    setIsLoading(true);
    try {
      // Fetch data from Google Sheets
      const response = await fetch(`/api/students/google-sheets?sheetId=${googleSheetId}`);
      const data = await response.json();

      if (response.ok && data.students) {
        // Save/update each student in database
        let savedCount = 0;
        let updatedCount = 0;
        
        for (const studentData of data.students) {
          try {
            // First, check if student exists by email or studentId
            const existingStudent = students.find(s => 
              s.email === studentData.email || 
              s.studentId === studentData.studentId ||
              (s.firstName === studentData.firstName && s.lastName === studentData.lastName)
            );
            
            if (existingStudent) {
              // Update existing student
              const updateResponse = await fetch('/api/students', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  ...studentData,
                  id: existingStudent.id
                })
              });
              
              if (updateResponse.ok) {
                updatedCount++;
              }
            } else {
              // Create new student
              const saveResponse = await fetch('/api/students', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
              });
              
              if (saveResponse.ok) {
                savedCount++;
              }
            }
          } catch (error) {
            console.error('Error saving/updating student:', studentData.firstName, studentData.lastName, error);
          }
        }
        
        // Students will automatically update via real-time listener
        
        const syncTime = new Date().toLocaleString();
        setLastSyncTime(syncTime);
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastSyncTime', syncTime);
        }
        alert(`Successfully synced - Added: ${savedCount}, Updated: ${updatedCount} students from Google Sheets!`);
      } else {
        throw new Error(data.error || 'Failed to sync with Google Sheets');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync with Google Sheets. Please check your Sheet ID and make sure the sheet is publicly accessible.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveGoogleSheetId = (sheetId: string) => {
    setGoogleSheetId(sheetId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('googleSheetId', sheetId);
    }
    setIsGoogleSheetsModalOpen(false);
  };

  const exportToCSV = () => {
    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 
      'Age', 'Address', 'Emergency Contact', 'Contact Number', 'Enrollment Date', 'Student ID', 'Status'
    ];
    
    const csvContent = [
      headers.join(','),
      ...students.map(student => [
        student.firstName, student.lastName, student.email, student.phone,
        student.dateOfBirth, student.age, student.address, student.parentName,
        student.parentPhone, student.enrollmentDate, student.studentId, student.status
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6 text-green-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Student Information System</h1>
              <p className="text-gray-600">Manage student records and sync with Google Sheets</p>
              {isClient && lastSyncTime && (
                <p className="text-sm text-green-600">Last synced: {lastSyncTime}</p>
              )}
            </div>
          </div>

          {/* Data Safety Notice */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-sm text-blue-800">
                <strong>Data Safety:</strong> Any delete operations only affect your app database. 
                Your Google Sheets data remains completely safe and untouched.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configure Sheets
            </button>
            <button
              onClick={() => syncWithGoogleSheets(true)}
              disabled={isLoading}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isLoading ? 'Syncing...' : 'Sync from Sheets'}
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleAddStudent}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Student
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, student ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Select All Option */}
        {filteredStudents.length > 0 && (
          <div className="mb-4">
            <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudents.length === filteredStudents.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="font-medium">
                Select All ({filteredStudents.length} students)
              </span>
            </label>
          </div>
        )}

        {/* Batch Actions */}
        {selectedStudents.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBatchDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredStudents.map(student => (
            <div key={student.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleStudentSelection(student.id)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-700">{student.studentId}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditStudent(student)}
                    className="p-1 hover:bg-green-100 rounded"
                  >
                    <Edit className="h-4 w-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-green-600">Age: {student.age || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-800">{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-800">{student.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-800">Date of Birth: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-800">Emergency Contact: {student.parentName || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-600">
                  Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 text-lg mb-2">No students found</div>
            <p className="text-gray-700">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">{students.length}</div>
            <div className="text-gray-600">Total Students</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {students.filter(s => s.status === "active").length}
            </div>
            <div className="text-gray-600">Active Students</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {students.filter(s => s.status === "inactive").length}
            </div>
            <div className="text-gray-600">Inactive Students</div>
          </div>
        </div>
      </div>

      {/* Google Sheets Configuration Modal */}
      {isGoogleSheetsModalOpen && (
        <GoogleSheetsConfigModal
          googleSheetId={googleSheetId}
          onClose={() => setIsGoogleSheetsModalOpen(false)}
          onSave={saveGoogleSheetId}
        />
      )}

      {/* Modal for Add/Edit Student */}
      {isModalOpen && (
        <StudentModal
          student={editingStudent}
          onClose={() => setIsModalOpen(false)}
          onSave={async (student) => {
            try {
              const method = editingStudent ? 'PUT' : 'POST';
              const response = await fetch('/api/students', {
                method: method,
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(student)
              });
              
              if (response.ok) {
                // Students will automatically update via real-time listener
                setIsModalOpen(false);
              } else {
                const data = await response.json();
                alert('Failed to save student: ' + (data.error || 'Unknown error'));
              }
            } catch (error) {
              console.error('Error saving student:', error);
              alert('Failed to save student');
            }
          }}
        />
      )}
    </div>
  );
}

// Modal Component
interface StudentModalProps {
  student: Student | null;
  onClose: () => void;
  onSave: (student: Student) => void;
}

function StudentModal({ student, onClose, onSave }: StudentModalProps) {
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    phone: student?.phone || '',
    dateOfBirth: student?.dateOfBirth || '',
    age: student?.age || '',
    address: student?.address || '',
    parentName: student?.parentName || '',
    parentPhone: student?.parentPhone || '',
    enrollmentDate: student?.enrollmentDate || new Date().toISOString().split('T')[0],
    studentId: student?.studentId || '',
    status: student?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate student ID if creating new student
    const studentData = {
      ...formData,
      id: student?.id || `temp_${Date.now()}`, // Temporary ID for new students
      studentId: formData.studentId || `STU${String(Date.now()).slice(-6)}`
    };
    
    onSave(studentData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {student ? 'Edit Student' : 'Add New Student'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="e.g. 18, 22, 25"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Emergency Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Emergency Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Enrollment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Enrollment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Date</label>
                <input
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => setFormData({...formData, enrollmentDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {student ? 'Update' : 'Add'} Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Google Sheets Configuration Modal Component
interface GoogleSheetsConfigModalProps {
  googleSheetId: string;
  onClose: () => void;
  onSave: (sheetId: string) => void;
}

function GoogleSheetsConfigModal({ googleSheetId, onClose, onSave }: GoogleSheetsConfigModalProps) {
  const [sheetId, setSheetId] = useState(googleSheetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetId.trim()) {
      alert('Please enter a valid Google Sheet ID');
      return;
    }
    onSave(sheetId.trim());
  };

  const extractSheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleUrlChange = (value: string) => {
    const extractedId = extractSheetId(value);
    setSheetId(extractedId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Configure Google Sheets Integration</h2>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2">
            <li>Open your Google Sheets with student enrollment data</li>
            <li>Make sure your sheet is publicly accessible (Share → Anyone with the link can view)</li>
            <li>Your sheet must have an <strong>ENROLLMENT</strong> tab with the correct column structure</li>
            <li>Copy the Sheet URL or ID below</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheet URL or ID
            </label>
            <input
              type="text"
              value={sheetId}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste full URL or just the Sheet ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Required ENROLLMENT Tab Structure:</h4>
            <div className="text-xs text-yellow-700 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-yellow-100">
                    <th className="border border-yellow-300 px-2 py-1">A</th>
                    <th className="border border-yellow-300 px-2 py-1">B</th>
                    <th className="border border-yellow-300 px-2 py-1">C</th>
                    <th className="border border-yellow-300 px-2 py-1">D</th>
                    <th className="border border-yellow-300 px-2 py-1">E</th>
                    <th className="border border-yellow-300 px-2 py-1">F</th>
                    <th className="border border-yellow-300 px-2 py-1">G</th>
                    <th className="border border-yellow-300 px-2 py-1">H</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-yellow-300 px-2 py-1 text-xs">Timestamp</td>
                    <td className="border border-yellow-300 px-2 py-1 text-xs">Student ID</td>
                    <td className="border border-yellow-300 px-2 py-1 text-xs">Student&apos;s Full Name</td>
                    <td className="border border-yellow-300 px-2 py-1 text-xs">Date of Birth</td>
                    <td className="border border-yellow-300 px-2 py-1 text-xs">Age</td>
                    <td className="border border-yellow-300 px-2 py-1 text-xs">Emergency Contact</td>
                    <td className="border border-yellow-300 px-2 py-1 text-xs">Email Address</td>
                    <td className="border border-yellow-300 px-2 py-1 text-xs">Contact Number</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2">
                <p className="text-xs font-medium text-yellow-800">Additional columns (I-L):</p>
                <p className="text-xs text-yellow-600">Social Media Consent, Status, Referral Source, Referral Details</p>
              </div>
              <p className="mt-2 text-xs text-yellow-600"><strong>Important:</strong> The data must be in the <strong>ENROLLMENT</strong> tab of your Google Sheet.</p>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
