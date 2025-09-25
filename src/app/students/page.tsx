"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, User, Mail, Phone, Calendar, MapPin, BookOpen, Download, RefreshCw, Settings } from "lucide-react";
import { useRealtimeStudents } from "@/hooks/useRealtimeStudents";
import { Student } from "@/lib/db";

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function StudentsPage() {
  // Use Firebase real-time hook
  const { students: realtimeStudents, loading: realtimeLoading, error: realtimeError } = useRealtimeStudents();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Pagination states for performance
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 students per page
  
  // Debounced search term to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
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

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

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
  
  // Optimized filtering with memoization and debouncing
  const filteredStudents = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return students;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return students.filter(student => {
      return (
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        (student.phone && student.phone.includes(debouncedSearchTerm)) ||
        (student.age && student.age.toString().includes(debouncedSearchTerm))
      );
    });
  }, [students, debouncedSearchTerm]);

  // Paginated students for better performance
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Statistics calculations with memoization
  const studentStats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === "active" || !s.status).length;
    const filtered = filteredStudents.length;
    return { total, active, filtered };
  }, [students, filteredStudents]);

  // Optimized callback functions with useCallback
  const handleAddStudent = useCallback(() => {
    setEditingStudent(null);
    setIsModalOpen(true);
  }, []);

  const handleEditStudent = useCallback((student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  }, []);

  const handleDeleteStudent = useCallback(async (id: string) => {
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
  }, []);

  // Batch delete function with useCallback
  const handleBatchDelete = useCallback(async () => {
    if (selectedStudents.length === 0) {
      alert('Please select students to delete');
      return;
    }

    setIsDeleteConfirmOpen(true);
  }, [selectedStudents]);

  // Confirm and execute batch delete with useCallback
  const confirmBatchDelete = useCallback(async () => {
    setIsDeleteConfirmOpen(false);
    
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
  }, [selectedStudents]);

  // Toggle student selection with useCallback
  const toggleStudentSelection = useCallback((studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  // Select all students with useCallback  
  const toggleSelectAll = useCallback(() => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  }, [selectedStudents.length, filteredStudents]);

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
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 rounded-2xl shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200">
                <ArrowLeft className="h-6 w-6 text-white" />
              </Link>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Student Information System</h1>
                <p className="text-blue-100 text-lg mt-1">Manage student records and sync with Google Sheets</p>
                {isClient && lastSyncTime && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-200 text-sm">Last synced: {lastSyncTime}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsGoogleSheetsModalOpen(true)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 text-sm"
              >
                <Settings className="h-4 w-4" />
                Configure Sheets
              </button>
              <button
                onClick={() => syncWithGoogleSheets(true)}
                disabled={isLoading}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={handleAddStudent}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </button>
            </div>
          </div>

          {/* Data Safety Notice - More compact */}
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">ℹ</span>
              </div>
              <div className="text-blue-100 text-sm">
                <strong className="text-white">Data Safety:</strong> Delete operations only affect your app database. Google Sheets data remains safe.
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, student ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            {/* Statistics */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Total: {students.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Filtered: {studentStats.filtered}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Select All and Batch Actions */}
        {filteredStudents.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 text-gray-700 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
                  />
                  <span className="font-medium group-hover:text-blue-600 transition-colors">
                    Select All ({filteredStudents.length} students)
                  </span>
                </label>
                {selectedStudents.length > 0 && (
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {selectedStudents.length} selected
                  </div>
                )}
              </div>
              
              {selectedStudents.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete Selected ({selectedStudents.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Students Grid - Using Paginated Students for Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {paginatedStudents.map(student => (
            <div key={student.id} className="group bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
              {/* Card Header with Checkbox */}
              <div className="p-4 pb-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors mt-1"
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-600 font-medium">ID: {student.studentId}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          student.status === 'active' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleEditStudent(student)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Student"
                    >
                      <Edit className="h-3.5 w-3.5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Student"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Student Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-3 w-3 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">Age:</span>
                      <p className="font-semibold text-gray-900 text-sm">{student.age || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-500 text-xs">Email:</span>
                      <p className="font-medium text-gray-900 text-sm truncate">{student.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Phone:</span>
                      <p className="font-medium text-gray-900 text-sm">{student.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">DOB:</span>
                      <p className="font-medium text-gray-900 text-sm">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                      <User className="h-3 w-3 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-500 text-xs">Emergency:</span>
                      <p className="font-medium text-gray-900 text-sm truncate">{student.parentName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer - More compact */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  const pageNum = currentPage <= 3 
                    ? index + 1 
                    : currentPage + index - 2;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No students found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or add new students</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Add First Student
            </button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{studentStats.total}</div>
            <div className="text-blue-700 font-medium">Total Students</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center border border-green-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {studentStats.active}
            </div>
            <div className="text-green-700 font-medium">Active Students</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {studentStats.filtered}
            </div>
            <div className="text-purple-700 font-medium">Filtered Results</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center border border-orange-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {filteredStudents.length}
            </div>
            <div className="text-orange-700 font-medium">Filtered Results</div>
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

      {/* Modern Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur and fade animation */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full transform transition-all duration-300 ease-out scale-100 animate-in slide-in-from-bottom-4">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-t-2xl p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Delete Students</h3>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 text-base mb-4">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-red-600">
                  {selectedStudents.length}
                </span>{' '}
                selected {selectedStudents.length === 1 ? 'student' : 'students'}?
              </p>
              
              {/* Safety Notice with modern design */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Settings className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-800 mb-1">Data Safety Notice</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      This will only remove students from your app database. Your Google Sheets data 
                      will remain completely untouched and safe.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with modern buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={confirmBatchDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
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
