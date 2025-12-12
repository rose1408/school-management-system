"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Calendar } from "lucide-react";
import { useRealtimeTeachers } from "@/hooks/useRealtimeTeachers";

// Dynamic Firebase imports
let firestore: any = null;
let collection: any = null;
let getDocs: any = null;

async function initFirebaseIfNeeded() {
  if (!firestore) {
    const { db } = await import('@/lib/firebase');
    const firestoreModule = await import('firebase/firestore');
    
    firestore = db;
    collection = firestoreModule.collection;
    getDocs = firestoreModule.getDocs;
  }
}

interface ScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  day: string;
  grade: string;
  isFromTeacher?: boolean;
  teacherId?: string;
  originalScheduleId?: string;
}

interface TeacherSchedule {
  id: string;
  teacherId: string;
  studentName: string;
  instrument: string;
  level: string;
  room: string;
  time: string;
  day: string;
  duration: string;
  cardNumber: string;
  currentLessonNumber: number;
  maxLessons: number;
  startDate?: string;
  isActive: boolean;
}

export default function SchedulePage() {
  // Use real teacher data from Firebase
  const { teachers: realtimeTeachers, loading: teachersLoading } = useRealtimeTeachers();
  
  // Real schedules from Firebase
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const levels = ["Preparatory", "Primary", "Intermediate", "Advance"];

  // Get instrument color function (same as teachers page)
  const getInstrumentColor = (instrument: string) => {
    const colors: { [key: string]: string } = {
      'Piano': 'bg-blue-500',
      'Guitar': 'bg-green-500',
      'Violin': 'bg-purple-500',
      'Drums': 'bg-red-500',
      'Flute': 'bg-yellow-500',
      'Voice': 'bg-pink-500',
      'Saxophone': 'bg-indigo-500',
      'Trumpet': 'bg-orange-500',
      'Preparatory': 'bg-green-500',
      'Primary': 'bg-blue-500',
      'Intermediate': 'bg-orange-500',
      'Advance': 'bg-purple-500'
    };
    return colors[instrument] || 'bg-gray-500';
  };

  const loadSchedules = async () => {
    try {
      setLoading(true);
      await initFirebaseIfNeeded();
      const snapshot = await getDocs(collection(firestore, 'schedules'));
      const schedulesData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as TeacherSchedule[];
      
      // Filter only active schedules
      const activeSchedules = schedulesData.filter(schedule => schedule.isActive !== false);
      setTeacherSchedules(activeSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // Convert teacher schedules to class schedule format
  const convertTeacherSchedulesToClassSchedules = (): ScheduleItem[] => {
    return teacherSchedules.map(schedule => {
      const teacher = realtimeTeachers.find(t => t.id === schedule.teacherId);
      const endTime = calculateEndTime(schedule.time, schedule.duration);
      
      return {
        id: `teacher-${schedule.id}`,
        subject: `${schedule.instrument} - ${schedule.studentName}`,
        teacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher',
        room: schedule.room,
        time: `${schedule.time} - ${endTime}`,
        day: schedule.day,
        grade: schedule.level,
        isFromTeacher: true,
        teacherId: schedule.teacherId,
        originalScheduleId: schedule.id
      };
    });
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMinutes = parseInt(duration.replace(' min', ''));
    
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // Get all schedules (only teacher schedules now)
  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);

  // Update schedules when data changes
  useEffect(() => {
    if (!teachersLoading && realtimeTeachers.length > 0) {
      const teacherSchedulesAsClassSchedules = convertTeacherSchedulesToClassSchedules();
      setAllSchedules(teacherSchedulesAsClassSchedules);
    }
  }, [teacherSchedules, realtimeTeachers, teachersLoading]);

  // Pagination calculations
  const totalPages = Math.ceil(allSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSchedules = allSchedules.slice(startIndex, endIndex);

  // Page change handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const refreshSchedules = async () => {
    await loadSchedules();
  };

  // Loading state
  if (loading || teachersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

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
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Class Schedule Management</h1>
                <p className="text-blue-100 text-lg mt-1">Read-only view of all teacher schedules synchronized from Teacher Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={refreshSchedules}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Clean Schedules Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Schedules Overview</h2>
              <p className="text-gray-600 mt-1">
                {allSchedules.length} of {allSchedules.length} schedules
              </p>
            </div>
            <div className="bg-gray-100 rounded-xl p-3">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold mb-2">
                {allSchedules.length}
              </div>
              <div className="text-blue-100">Total Schedules</div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold mb-2">
                {[...new Set(allSchedules.map(s => s.teacher))].length}
              </div>
              <div className="text-green-100">Active Teachers</div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold mb-2">
                {[...new Set(allSchedules.map(s => s.room))].length}
              </div>
              <div className="text-purple-100">Rooms in Use</div>
            </div>
          </div>
          
          {allSchedules.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules available</h3>
              <p className="text-gray-500 mb-4">Teacher schedules will appear here when available.</p>
              <Link 
                href="/teachers" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Teacher Management
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-6">
                {paginatedSchedules.map((schedule) => {
                  const instrumentColor = getInstrumentColor(schedule.grade);
                  return (
                    <div 
                      key={schedule.id} 
                      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      {/* Card Content */}
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 ${instrumentColor} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                            {schedule.day.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-800">
                              {schedule.day}
                            </div>
                            <div className="text-xs text-gray-600">
                              {schedule.time}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-800">
                            {schedule.subject}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-gray-600">{schedule.teacher}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-gray-600">{schedule.room}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="text-gray-600">{schedule.grade}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className={`w-2 h-2 ${schedule.isFromTeacher ? 'bg-green-500' : 'bg-blue-500'} rounded-full`}></div>
                            <div className="text-xs text-gray-500">
                              {schedule.isFromTeacher ? 'Teacher Schedule' : 'Manual Schedule'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, allSchedules.length)} of {allSchedules.length} schedules
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        // Show first, last, current, and adjacent pages
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                                currentPage === page
                                  ? 'bg-purple-600 text-white shadow-lg'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="w-10 h-10 flex items-center justify-center text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}