"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, User, Mail, Phone, Calendar, BookOpen, RefreshCw, Settings } from "lucide-react";
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
  const { students: realtimeStudents } = useRealtimeStudents();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Phone number formatting function
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different Philippine phone number formats
    if (cleaned.length === 10 && cleaned.startsWith('9')) {
      // 9XX XXX XXXX -> +63 9XX XXX XXXX
      return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('09')) {
      // 09XX XXX XXXX -> +63 9XX XXX XXXX
      return `+63 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('639')) {
      // 639XX XXX XXXX -> +63 9XX XXX XXXX
      return `+63 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('63')) {
      // 639XX XXX XXXX -> +63 9XX XXX XXXX
      return `+63 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    } else if (cleaned.length >= 7) {
      // Fallback: try to format as XXX XXX XXXX for other formats
      const match = cleaned.match(/(\d{3})(\d{3})(\d{4})/);
      if (match) {
        return `${match[1]} ${match[2]} ${match[3]}`;
      }
    }
    
    // Return original if no format matches
    return phone;
  };
  
  // Modern modal states
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'confirm';
    title: string;
    message: string;
    confirmAction?: () => void;
    singleStudentId?: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Add loading state for operations
  const [operationLoading, setOperationLoading] = useState<{
    isLoading: boolean;
    message: string;
    type: 'saving' | 'updating' | 'deleting' | 'syncing' | '';
  }>({
    isLoading: false,
    message: '',
    type: ''
  });
  
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
  }, []);

  // REMOVED AUTO-SYNC - Only manual sync to prevent duplicates

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

  // Modern modal helper functions
  const showModal = useCallback((type: 'success' | 'error' | 'warning' | 'confirm', title: string, message: string, confirmAction?: () => void, singleStudentId?: string) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      confirmAction,
      singleStudentId
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleModalConfirm = useCallback(() => {
    if (modalState.confirmAction) {
      modalState.confirmAction();
    }
    closeModal();
  }, [modalState.confirmAction, closeModal]);

  // Statistics calculations with memoization
  const studentStats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === "active" || !s.status).length;
    const inactive = students.filter(s => s.status === "inactive").length;
    const filtered = filteredStudents.length;
    return { total, active, inactive, filtered };
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
    showModal(
      'confirm',
      'Delete Student',
      'Are you sure you want to delete this student record? This action cannot be undone.',
      async () => {
        try {
          setOperationLoading({
            isLoading: true,
            message: 'Removing student record...',
            type: 'deleting'
          });
          const response = await fetch(`/api/students?id=${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            // Real-time updates will automatically refresh the list
            showModal('success', 'Student Deleted', 'Student record has been successfully deleted from your database.');
          } else {
            const data = await response.json();
            showModal('error', 'Delete Failed', data.error || 'Failed to delete student. Please try again.');
          }
        } catch (error) {
          console.error('Error deleting student:', error);
          showModal('error', 'Delete Failed', 'An error occurred while deleting the student. Please try again.');
        } finally {
          setOperationLoading({
            isLoading: false,
            message: '',
            type: ''
          });
        }
      }
    );
  }, [showModal]);

  // Batch delete function with useCallback
  const handleBatchDelete = useCallback(async () => {
    if (selectedStudents.length === 0) {
      showModal('warning', 'No Selection', 'Please select students to delete first.');
      return;
    }

    setIsDeleteConfirmOpen(true);
  }, [selectedStudents, showModal]);

  // Confirm and execute batch delete with useCallback
  const confirmBatchDelete = useCallback(async () => {
    setIsDeleteConfirmOpen(false);
    
    try {
      setOperationLoading({
        isLoading: true,
        message: `Deleting ${selectedStudents.length} students...`,
        type: 'deleting'
      });
      for (const studentId of selectedStudents) {
        const response = await fetch(`/api/students?id=${studentId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.error('Failed to delete student:', studentId);
        }
      }
      
      setSelectedStudents([]);
      showModal('success', 'Batch Delete Successful', `Successfully deleted ${selectedStudents.length} students from your database!`);
    } catch (error) {
      console.error('Error deleting students:', error);
      showModal('error', 'Batch Delete Failed', 'An error occurred while deleting students. Please try again.');
    } finally {
      setOperationLoading({
        isLoading: false,
        message: '',
        type: ''
      });
    }
  }, [selectedStudents, showModal]);

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
  // SMART SYNC: FROM Google Sheets TO Web App - Updates existing data OR creates new students when database is empty
  // This function reads data from Google Sheets and either updates existing records or creates new ones if database is empty
  const syncWithGoogleSheets = useCallback(async (showAlert = true) => {
    if (!googleSheetId.trim()) {
      if (showAlert) {
        showModal('warning', 'Configuration Required', 'Please configure your Google Sheet ID first.');
        setIsGoogleSheetsModalOpen(true);
      }
      return;
    }

    const syncId = Date.now().toString();
    
    setOperationLoading({
      isLoading: true,
      message: 'Syncing from Google Sheets...',
      type: 'syncing'
    });

    setIsLoading(true);
    try {
      // Fetch data from Google Sheets
      const response = await fetch(`/api/students/google-sheets?sheetId=${googleSheetId}`);
      const data = await response.json();

      if (response.ok && data.students) {
        console.log(`[Sync ${syncId}] Fetched`, data.students.length, 'students from Google Sheets');
        
        // Get the most current students list from the real-time hook
        const currentStudents = realtimeStudents || [];
        console.log(`[Sync ${syncId}] Current students in app:`, currentStudents.length);
        
        // SMART MODE: If database is empty, create new students. Otherwise, update existing ones.
        const isEmptyDatabase = currentStudents.length === 0;
        console.log(`[Sync ${syncId}] Database empty: ${isEmptyDatabase}, switching to ${isEmptyDatabase ? 'CREATE' : 'UPDATE'} mode`);
        
        const existingUpdates = [];
        const newStudents = [];
        let skippedNewStudents = 0;
        
        for (const studentData of data.students) {
          // Skip if missing required fields (email is optional for import)
          if (!studentData.firstName || !studentData.lastName) {
            console.warn(`[Sync ${syncId}] Skipping student with missing required fields (name):`, studentData);
            continue;
          }
          
          // Give a default email if missing
          if (!studentData.email || studentData.email.trim() === '') {
            studentData.email = `${studentData.firstName.toLowerCase()}.${studentData.lastName.toLowerCase()}@placeholder.local`;
            console.log(`[Sync ${syncId}] Generated placeholder email for:`, studentData.firstName, studentData.lastName, '→', studentData.email);
          }

          if (isEmptyDatabase) {
            // DATABASE IS EMPTY - CREATE NEW STUDENTS
            newStudents.push({
              ...studentData,
              // Generate temporary ID for frontend
              id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              // Keep existing student ID from Google Sheets, or let backend generate new one
              studentId: studentData.studentId || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              // Ensure required fields have defaults
              enrollmentDate: studentData.enrollmentDate || new Date().toISOString().split('T')[0],
              status: studentData.status || 'active'
            });
            console.log(`[Sync ${syncId}] Will CREATE new student:`, studentData.firstName, studentData.lastName);
          } else {
            // DATABASE HAS DATA - UPDATE EXISTING STUDENTS ONLY
            const existingStudent = currentStudents.find(s => {
              // Primary match: email (case-insensitive, trimmed)
              if (studentData.email && s.email) {
                const emailMatch = s.email.toLowerCase().trim() === studentData.email.toLowerCase().trim();
                if (emailMatch) {
                  console.log(`[Sync ${syncId}] Email match found for update:`, s.email, '→', studentData.email);
                  return true;
                }
              }
              
              // Secondary match: studentId (exact match)
              if (studentData.studentId && s.studentId && s.studentId.trim() && studentData.studentId.trim()) {
                const idMatch = s.studentId.trim() === studentData.studentId.trim();
                if (idMatch) {
                  console.log(`[Sync ${syncId}] Student ID match found for update:`, s.studentId, '→', studentData.studentId);
                  return true;
                }
              }
              
              // Tertiary match: exact full name + phone combination (very strict)
              if (s.firstName && s.lastName && studentData.firstName && studentData.lastName) {
                const firstNameMatch = s.firstName.toLowerCase().trim() === studentData.firstName.toLowerCase().trim();
                const lastNameMatch = s.lastName.toLowerCase().trim() === studentData.lastName.toLowerCase().trim();
                const phoneMatch = s.phone && studentData.phone && s.phone.trim() === studentData.phone.trim();
                
                if (firstNameMatch && lastNameMatch && phoneMatch) {
                  console.log(`[Sync ${syncId}] Full name + phone match found for update:`, `${s.firstName} ${s.lastName}`, s.phone);
                  return true;
                }
              }
              
              return false;
            });

            if (existingStudent) {
              // Check if any data has actually changed to avoid unnecessary updates
              const hasChanges = 
                existingStudent.phone !== studentData.phone ||
                existingStudent.address !== studentData.address ||
                existingStudent.dateOfBirth !== studentData.dateOfBirth ||
                existingStudent.age !== studentData.age ||
                existingStudent.parentName !== studentData.parentName ||
                existingStudent.status !== studentData.status ||
                existingStudent.parentPhone !== studentData.parentPhone;

              if (hasChanges) {
                existingUpdates.push({
                  ...studentData,
                  id: existingStudent.id,
                  // Preserve original creation data
                  studentId: existingStudent.studentId || studentData.studentId,
                  createdAt: existingStudent.createdAt,
                  updatedAt: new Date().toISOString()
                });
                console.log(`[Sync ${syncId}] Student needs update:`, studentData.firstName, studentData.lastName);
              } else {
                console.log(`[Sync ${syncId}] Student data unchanged, skipping:`, studentData.firstName, studentData.lastName);
              }
            } else {
              // NEW STUDENT FOUND - Skip it in UPDATE mode
              skippedNewStudents++;
              console.log(`[Sync ${syncId}] SKIPPING new student (UPDATE mode):`, studentData.firstName, studentData.lastName);
            }
          }
        }
        
        console.log(`[Sync ${syncId}] Processing: ${newStudents.length} new students, ${existingUpdates.length} updates`);
        
        // Process new students (only when database is empty)
        let createdCount = 0;
        for (const studentData of newStudents) {
          try {
            const createResponse = await fetch('/api/students', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...studentData,
                googleSheetId: googleSheetId // Include sheet ID for backend processing
              })
            });
            
            if (createResponse.ok) {
              createdCount++;
              console.log(`[Sync ${syncId}] Successfully created student:`, studentData.firstName, studentData.lastName);
            } else {
              const errorData = await createResponse.text();
              console.error(`[Sync ${syncId}] Failed to create student:`, studentData.firstName, studentData.lastName, errorData);
            }
          } catch (error) {
            console.error(`[Sync ${syncId}] Error creating student:`, error);
          }
        }
        
        // Process updates (only when database has existing data)
        let updatedCount = 0;
        for (const studentData of existingUpdates) {
          try {
            const updateResponse = await fetch('/api/students', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(studentData)
            });
            
            if (updateResponse.ok) {
              updatedCount++;
              console.log(`[Sync ${syncId}] Successfully updated student:`, studentData.firstName, studentData.lastName);
            } else {
              const errorData = await updateResponse.text();
              console.error(`[Sync ${syncId}] Failed to update student:`, studentData.firstName, studentData.lastName, errorData);
            }
          } catch (error) {
            console.error(`[Sync ${syncId}] Error updating student:`, error);
          }
        }
        
        // Update sync timestamp
        const now = new Date().toISOString();
        setLastSyncTime(now);
        localStorage.setItem('lastSyncTime', now);
        
        // Show success message based on what actually happened
        if (showAlert) {
          if (isEmptyDatabase && createdCount > 0) {
            showModal('success', 'Import Completed!', 
              `Successfully imported ${createdCount} students from Google Sheets to your web app database!`);
          } else if (updatedCount > 0 && createdCount === 0) {
            showModal('success', 'Sync Completed', 
              `Successfully updated ${updatedCount} existing students. ${skippedNewStudents > 0 ? `Skipped ${skippedNewStudents} new students (update mode only).` : ''}`);
          } else if (updatedCount === 0 && createdCount === 0 && skippedNewStudents > 0) {
            showModal('success', 'Sync Completed', 
              `All existing student data is up to date. Found ${skippedNewStudents} new students in Google Sheets (not imported - update mode only).`);
          } else if (updatedCount === 0 && createdCount === 0) {
            showModal('success', 'Sync Completed', 'All student data is up to date. No changes needed.');
          } else {
            showModal('success', 'Sync Completed', `Created ${createdCount} new students, updated ${updatedCount} existing students.`);
          }
        }
        
        console.log('Google Sheets sync completed:', { createdCount, updatedCount, skippedNewStudents, isEmptyDatabase });
      } else {
        const errorMsg = data.error || 'Unknown error occurred';
        console.error('Failed to fetch from Google Sheets:', errorMsg);
        if (showAlert) {
          showModal('error', 'Sync Failed', `Failed to fetch data from Google Sheets: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      if (showAlert) {
        showModal('error', 'Sync Failed', 'Failed to sync with Google Sheets. Please check your configuration and try again.');
      }
    } finally {
      setIsLoading(false);
      setOperationLoading({
        isLoading: false,
        message: '',
        type: ''
      });
    }
  }, [googleSheetId, realtimeStudents]);

  const saveGoogleSheetId = (sheetId: string) => {
    setGoogleSheetId(sheetId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('googleSheetId', sheetId);
    }
    setIsGoogleSheetsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 relative">
      {/* Loading Overlay */}
      {operationLoading.isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {operationLoading.type === 'saving' ? 'Saving Student' : 
               operationLoading.type === 'updating' ? 'Updating Student' : 
               operationLoading.type === 'deleting' ? 'Deleting Student' : 
               operationLoading.type === 'syncing' ? 'Syncing Data' : 'Processing...'}
            </h3>
            <p className="text-gray-600">
              {operationLoading.message || 'Please wait...'}
            </p>
          </div>
        </div>
      )}
      
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
                {isLoading ? 'Updating...' : 'Update from Sheets'}
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

          {/* Data Safety Notice - Updated for smart sync */}
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">ℹ</span>
              </div>
              <div className="text-blue-100 text-sm">
                <strong className="text-white">Smart Sync:</strong> Imports all Google Sheets data when database is empty, or updates existing data when database has records.
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
                      <p className="font-medium text-gray-900 text-sm">{formatPhoneNumber(student.phone || '')}</p>
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
              {studentStats.inactive}
            </div>
            <div className="text-purple-700 font-medium">Inactive Students</div>
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
          showModal={showModal}
        />
      )}

      {/* Modal for Add/Edit Student */}
      {isModalOpen && (
        <StudentModal
          student={editingStudent}
          onClose={() => setIsModalOpen(false)}
          operationLoading={operationLoading}
          onSave={async (student) => {
            try {
              const method = editingStudent ? 'PUT' : 'POST';
              
              // Show appropriate loading message
              const loadingMessage = editingStudent ? 'Updating student information...' : 'Saving student to database...';
              const loadingType = editingStudent ? 'updating' : 'saving';
              
              setOperationLoading({
                isLoading: true,
                message: loadingMessage,
                type: loadingType
              });
              
              // Prepare the data to send, including Google Sheet ID and additional form fields
              const studentData = {
                ...student,
                googleSheetId: googleSheetId.trim() || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4', // Your specific sheet ID
                socialMediaConsent: student.socialMediaConsent || '',
                howFound: student.howFound || '',
                referralDetails: student.referralDetails || ''
              };
              
              console.log('Saving student with data:', studentData);
              
              // Update loading message for Google Sheets step
              if (!editingStudent) {
                setOperationLoading({
                  isLoading: true,
                  message: 'Recording to Google Sheets...',
                  type: 'saving'
                });
              }
              
              const response = await fetch('/api/students', {
                method: method,
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
              });
              
              // Clear loading state
              setOperationLoading({
                isLoading: false,
                message: '',
                type: ''
              });
              
              if (response.ok) {
                // Students will automatically update via real-time listener
                setIsModalOpen(false);
                
                // Show different messages for new students vs updates
                if (editingStudent) {
                  showModal('success', 'Student Updated', 'Student information updated successfully!');
                } else {
                  showModal('success', 'Student Added Successfully!', 'Student has been added to both the local database and your Google Sheets ENROLLMENT tab!');
                }
              } else {
                const data = await response.json();
                showModal('error', 'Save Failed', data.error || 'Failed to save student. Please try again.');
              }
            } catch (error) {
              // Clear loading state on error
              setOperationLoading({
                isLoading: false,
                message: '',
                type: ''
              });
              
              console.error('Error saving student:', error);
              showModal('error', 'Save Failed', 'An error occurred while saving the student. Please try again.');
            }
          }}
        />
      )}

      {/* Universal Modern Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur and fade animation */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full transform transition-all duration-300 ease-out scale-100 animate-in slide-in-from-bottom-4">
            {/* Header with gradient based on type */}
            <div className={`rounded-t-2xl p-6 text-white ${
              modalState.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              modalState.type === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
              modalState.type === 'warning' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
              'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {modalState.type === 'success' && <BookOpen className="h-6 w-6 text-white" />}
                  {modalState.type === 'error' && <Trash2 className="h-6 w-6 text-white" />}
                  {modalState.type === 'warning' && <Settings className="h-6 w-6 text-white" />}
                  {modalState.type === 'confirm' && <Trash2 className="h-6 w-6 text-white" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{modalState.title}</h3>
                  <p className={`text-sm ${
                    modalState.type === 'success' ? 'text-green-100' :
                    modalState.type === 'error' ? 'text-red-100' :
                    modalState.type === 'warning' ? 'text-orange-100' :
                    'text-blue-100'
                  }`}>
                    {modalState.type === 'confirm' ? 'This action cannot be undone' : 'Status update'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 text-base mb-4">
                {modalState.message}
              </p>
              
              {/* Data Safety Notice for delete actions */}
              {modalState.type === 'confirm' && (
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Settings className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-800 mb-1">Data Safety Notice</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        This will only remove data from your app database. Your Google Sheets data 
                        will remain completely untouched and safe.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with modern buttons */}
            <div className="px-6 pb-6 flex gap-3">
              {modalState.type === 'confirm' ? (
                <>
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-white ${
                    modalState.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
                    modalState.type === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' :
                    'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600'
                  }`}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
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
  operationLoading: {
    isLoading: boolean;
    message: string;
    type: 'saving' | 'updating' | 'deleting' | 'syncing' | '';
  };
}

function StudentModal({ student, onClose, onSave, operationLoading }: StudentModalProps) {
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

  const [socialMediaConsent, setSocialMediaConsent] = useState('Yes');
  const [howFound, setHowFound] = useState('');
  const [referralDetails, setReferralDetails] = useState('');
  const [socialMediaPlatform, setSocialMediaPlatform] = useState('');
  
  // Separate state for full name input to prevent cursor jumping
  const [fullNameInput, setFullNameInput] = useState(() => {
    if (student && student.lastName && student.firstName) {
      return `${student.lastName}, ${student.firstName}`;
    } else if (student && (student.firstName || student.lastName)) {
      return `${student.lastName || ''} ${student.firstName || ''}`.trim();
    }
    return '';
  });

  // Sync fullNameInput when student prop changes (for editing)
  useEffect(() => {
    if (student) {
      if (student.lastName && student.firstName) {
        setFullNameInput(`${student.lastName}, ${student.firstName}`);
      } else if (student.firstName || student.lastName) {
        setFullNameInput(`${student.lastName || ''} ${student.firstName || ''}`.trim());
      } else {
        setFullNameInput('');
      }
    } else {
      setFullNameInput('');
    }
  }, [student]);

  // Calculate age when date of birth changes
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateOfBirth = e.target.value;
    const calculatedAge = calculateAge(dateOfBirth);
    setFormData({
      ...formData, 
      dateOfBirth,
      age: calculatedAge
    });
  };

  const handleHowFoundChange = (value: string) => {
    setHowFound(value);
    // Reset follow-up fields when changing selection
    if (value !== 'Referred') setReferralDetails('');
    if (value !== 'Social Media') setSocialMediaPlatform('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't generate student ID on frontend - let backend handle sequential numbering
    const studentData = {
      ...formData,
      id: student?.id || `temp_${Date.now()}`,
      // Remove frontend student ID generation - backend will generate proper sequential ID
      studentId: student?.studentId || '', // Keep existing ID for edits, empty for new students
      // Include additional form data for Google Sheets
      socialMediaConsent: socialMediaConsent,
      howFound: howFound,
      referralDetails: referralDetails,
      socialMediaPlatform: socialMediaPlatform
    };
    
    onSave(studentData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl"
        style={{
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Compact Header */}
        <div 
          className="text-white p-6 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          }}
        >
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              🎵 Discover Music School
            </h1>
            <p className="text-sm opacity-90">Student Information Form</p>
          </div>
          {/* Subtle decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute -top-2 -left-2 w-16 h-16 rounded-full bg-white"></div>
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white"></div>
          </div>
        </div>

        {/* Compact Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-150px)]" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Information - More Compact */}
            <div 
              className="p-4 rounded-lg border border-blue-100"
              style={{
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderLeft: '3px solid #007bff'
              }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-blue-600">👤</span>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name and DOB */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Student's Full Name *</label>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => {
                      const fullName = e.target.value;
                      setFullNameInput(fullName);
                      
                      // Update firstName and lastName in formData
                      if (fullName.trim() === '') {
                        setFormData({...formData, firstName: '', lastName: ''});
                      } else {
                        const trimmedName = fullName.trim();
                        
                        // Check if input contains comma (Last Name, First Name format)
                        if (trimmedName.includes(',')) {
                          const commaParts = trimmedName.split(',');
                          const lastName = commaParts[0].trim();
                          const firstName = commaParts[1] ? commaParts[1].trim() : '';
                          setFormData({...formData, firstName, lastName});
                        } else {
                          // No comma, treat as single name or space-separated
                          const spaceIndex = trimmedName.indexOf(' ');
                          
                          if (spaceIndex === -1) {
                            // No space yet, assume it's last name being typed
                            setFormData({...formData, firstName: '', lastName: trimmedName});
                          } else {
                            // Has space, assume "Last First" format
                            const lastName = trimmedName.substring(0, spaceIndex);
                            const firstName = trimmedName.substring(spaceIndex + 1);
                            setFormData({...formData, firstName, lastName});
                          }
                        }
                      }
                    }}
                    placeholder="Enter student's complete name (e.g., Doe, John or Doe John)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-all text-sm text-gray-900 placeholder-gray-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: Last Name, First Name (e.g., "Smith, John")</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleDateOfBirthChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-all text-sm text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Age (Auto-calculated)</label>
                  <input
                    type="text"
                    value={formData.age}
                    placeholder="Will be calculated from birth date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 text-sm cursor-not-allowed placeholder-gray-500"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Emergency Contact Person *</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                    placeholder="Parent or guardian name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-all text-sm text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="example@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-all text-sm text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contact Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Phone number (e.g., 09XX-XXX-XXXX)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-all text-sm text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Preferences Section - Compact */}
            <div 
              className="p-4 rounded-lg border border-green-100"
              style={{
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderLeft: '3px solid #28a745'
              }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-green-600">⚙️</span>
                Preferences & Permissions
              </h3>
              
              {/* Social Media Consent - Compact */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-3">Social Media Consent 📱</label>
                <p className="text-xs text-gray-600 mb-3">Can we feature your student's progress and achievements on our social media?</p>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="socialMediaConsent"
                      value="Yes"
                      checked={socialMediaConsent === 'Yes'}
                      onChange={(e) => setSocialMediaConsent(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-1"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      ✅ Yes, I consent
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="socialMediaConsent"
                      value="No"
                      checked={socialMediaConsent === 'No'}
                      onChange={(e) => setSocialMediaConsent(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-1"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      ❌ No, please keep private
                    </span>
                  </label>
                </div>
              </div>

              {/* How did you find us? - Compact */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">How did you find us? 🔍</label>
                <p className="text-xs text-gray-600 mb-3">Help us understand how people discover Discover Music School</p>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => handleHowFoundChange('Referred')}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                      howFound === 'Referred' 
                        ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-md' 
                        : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-lg">👥</span>
                    <span>Friend Referred</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHowFoundChange('Social Media')}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                      howFound === 'Social Media' 
                        ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-md' 
                        : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-lg">📱</span>
                    <span>Social Media</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHowFoundChange('Walk-in')}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                      howFound === 'Walk-in' 
                        ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-md' 
                        : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-lg">🚶</span>
                    <span>Walked By</span>
                  </button>
                </div>

                {/* Follow-up Questions */}
                {howFound === 'Referred' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-sm font-bold text-blue-700 mb-2">Who referred you to us? 👥</label>
                    <input
                      type="text"
                      value={referralDetails}
                      onChange={(e) => setReferralDetails(e.target.value)}
                      placeholder="Enter the name of the person or organization who referred you"
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-all text-sm bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>
                )}

                {howFound === 'Social Media' && (
                  <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                    <label className="block text-xs font-bold text-pink-700 mb-2">Which platform? �</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Facebook', 'Instagram', 'TikTok', 'YouTube'].map((platform) => (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => setSocialMediaPlatform(platform)}
                          className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            socialMediaPlatform === platform
                              ? 'bg-pink-200 text-pink-800 border border-pink-300'
                              : 'bg-white text-gray-600 border border-gray-300 hover:bg-pink-50'
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={operationLoading.isLoading}
                className="flex-1 text-white py-3 px-6 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                style={{
                  background: operationLoading.isLoading 
                    ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)' 
                    : 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                }}
              >
                {operationLoading.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>🎵 SUBMIT INFORMATION</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Google Sheets Configuration Modal Component
interface GoogleSheetsConfigModalProps {
  googleSheetId: string;
  onClose: () => void;
  onSave: (sheetId: string) => void;
  showModal: (type: 'success' | 'error' | 'warning' | 'confirm', title: string, message: string) => void;
}

function GoogleSheetsConfigModal({ googleSheetId, onClose, onSave, showModal }: GoogleSheetsConfigModalProps) {
  const [sheetId, setSheetId] = useState(googleSheetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetId.trim()) {
      showModal('warning', 'Invalid Input', 'Please enter a valid Google Sheet ID.');
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
