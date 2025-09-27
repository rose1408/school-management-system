"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Clock, MapPin, User, RefreshCw } from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRealtimeTeachers } from "@/hooks/useRealtimeTeachers";

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
  const [manualSchedules, setManualSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const levels = ["Preparatory", "Primary", "Intermediate", "Advance"];

  // Get instrument color function (same as teachers page)
  const getInstrumentColor = (instrument: string) => {
    const colors: { [key: string]: string } = {
      'Piano': 'bg-blue-500',
      'Guitar': 'bg-red-500',
      'Violin': 'bg-purple-500',
      'Drums': 'bg-orange-500',
      'Flute': 'bg-green-500',
      'Saxophone': 'bg-yellow-500',
      'Trumpet': 'bg-pink-500',
      'Cello': 'bg-indigo-500',
      'Clarinet': 'bg-teal-500',
      'Bass': 'bg-gray-500',
      'Primary': 'bg-green-500',
      'Intermediate': 'bg-blue-500',
      'Advance': 'bg-purple-500',
      'Preparatory': 'bg-orange-500',
    };
    return colors[instrument] || 'bg-gray-400';
  };

  // Load schedules from Firebase
  const loadSchedules = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'schedules'));
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeacherSchedule[];
      setTeacherSchedules(schedulesData);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load manual schedules from Firebase (if you have a separate collection)
  const loadManualSchedules = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'manual-schedules'));
      const manualSchedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduleItem[];
      setManualSchedules(manualSchedulesData);
    } catch (error) {
      console.error('Error loading manual schedules:', error);
      // If collection doesn't exist, continue with empty array
      setManualSchedules([]);
    }
  };

  useEffect(() => {
    loadSchedules();
    loadManualSchedules();
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

  // Get all schedules (teacher schedules + manual schedules)
  const getAllSchedules = (): ScheduleItem[] => {
    const teacherSchedulesAsClassSchedules = convertTeacherSchedulesToClassSchedules();
    return [...teacherSchedulesAsClassSchedules, ...manualSchedules];
  };

  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);

  // Update schedules when data changes
  useEffect(() => {
    if (!teachersLoading && realtimeTeachers.length > 0) {
      const teacherSchedulesAsClassSchedules = convertTeacherSchedulesToClassSchedules();
      setAllSchedules([...teacherSchedulesAsClassSchedules, ...manualSchedules]);
    }
  }, [teacherSchedules, manualSchedules, realtimeTeachers, teachersLoading]);

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule: ScheduleItem) => {
    if (schedule.isFromTeacher) {
      // For teacher schedules, we can allow rescheduling but warn the user
      const confirmed = window.confirm(
        `This is a teacher schedule for ${schedule.subject} with ${schedule.teacher}. ` +
        `Editing this will create a separate manual override. Continue?`
      );
      if (!confirmed) return;
    }
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    const schedule = allSchedules.find(s => s.id === id);
    if (schedule?.isFromTeacher) {
      const confirmed = window.confirm(
        `This is a teacher schedule. Deleting it here will only hide it from this view. ` +
        `To permanently delete, go to Teacher Schedule Management. Continue?`
      );
      if (!confirmed) return;
      // Add to a hidden list or handle differently
      return;
    }
    
    try {
      // Remove 'manual-' prefix to get the actual doc ID
      const docId = id.replace('manual-', '');
      await deleteDoc(doc(db, 'manual-schedules', docId));
      setManualSchedules(manualSchedules.filter(schedule => schedule.id !== id));
    } catch (error) {
      console.error('Error deleting manual schedule:', error);
    }
  };

  const getSchedulesByDay = (day: string) => {
    return allSchedules.filter(schedule => schedule.day === day);
  };

  const refreshSchedules = async () => {
    await loadSchedules();
    await loadManualSchedules();
  };

  // Loading state
  if (loading || teachersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Clean Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/" 
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">
                  Class Schedule Management
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Unified view of all teacher schedules synchronized from Teacher Management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={refreshSchedules}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleAddSchedule}
                className="flex items-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg font-semibold"
              >
                <Plus className="h-5 w-5" />
                Add Manual Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Clean Schedules Overview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Schedules Overview
                </h2>
                <p className="text-gray-600 mt-2">
                  {allSchedules.length} total schedules synchronized from Teacher Management
                </p>
              </div>
              <div className="bg-gray-100 rounded-xl p-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {allSchedules.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No schedules found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Add some schedules in Teacher Management to see them synchronized here.
                </p>
              </div>
            ) : (
              <>
                {/* Clean Schedule Cards Grid - Same as Teachers Page */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
                  {allSchedules.map((schedule) => {
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                              <span className="text-gray-600">{schedule.grade}</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className={`w-2 h-2 ${schedule.isFromTeacher ? 'bg-green-500' : 'bg-blue-500'} rounded-full`}></div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditSchedule(schedule)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title={schedule.isFromTeacher ? "Reschedule (creates override)" : "Edit Schedule"}
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title={schedule.isFromTeacher ? "Hide from view" : "Delete Schedule"}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {schedule.isFromTeacher && (
                              <div className="mt-2">
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Teacher Schedule
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-500 mb-2">{allSchedules.length}</div>
                <div className="text-gray-600 font-medium">Total Classes</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {allSchedules.filter(s => s.isFromTeacher).length}
                </div>
                <div className="text-gray-600 font-medium">Teacher Schedules</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-500 mb-2">
                  {manualSchedules.length}
                </div>
                <div className="text-gray-600 font-medium">Manual Schedules</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {new Set(allSchedules.map(s => s.teacher)).size}
                </div>
                <div className="text-gray-600 font-medium">Active Teachers</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit Schedule */}
      {isModalOpen && (
        <ScheduleModal
          schedule={editingSchedule}
          onClose={() => setIsModalOpen(false)}
          onSave={async (schedule) => {
            try {
              if (editingSchedule) {
                if (editingSchedule.isFromTeacher) {
                  // Create a new manual schedule as override
                  const newSchedule = {
                    ...schedule,
                    isFromTeacher: false
                  };
                  const docRef = await addDoc(collection(db, 'manual-schedules'), newSchedule);
                  setManualSchedules([...manualSchedules, { ...newSchedule, id: docRef.id }]);
                } else {
                  // Update existing manual schedule
                  const docId = editingSchedule.id.replace('manual-', '');
                  await updateDoc(doc(db, 'manual-schedules', docId), schedule);
                  setManualSchedules(manualSchedules.map(s => s.id === schedule.id ? schedule : s));
                }
              } else {
                // Add new manual schedule
                const newSchedule = {
                  ...schedule,
                  isFromTeacher: false
                };
                const docRef = await addDoc(collection(db, 'manual-schedules'), newSchedule);
                setManualSchedules([...manualSchedules, { ...newSchedule, id: docRef.id }]);
              }
              setIsModalOpen(false);
            } catch (error) {
              console.error('Error saving schedule:', error);
            }
          }}
          teachers={realtimeTeachers}
          levels={levels}
        />
      )}
    </div>
  );
}

// Modal Component
interface ScheduleModalProps {
  schedule: ScheduleItem | null;
  onClose: () => void;
  onSave: (schedule: ScheduleItem) => void;
  teachers: Array<{
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    instrument: string;
    address: string;
  }>;
  levels: string[];
}

function ScheduleModal({ schedule, onClose, onSave, teachers, levels }: ScheduleModalProps) {
  const [formData, setFormData] = useState<Omit<ScheduleItem, 'id' | 'isFromTeacher' | 'teacherId' | 'originalScheduleId'>>({
    subject: schedule?.subject || '',
    teacher: schedule?.teacher || '',
    room: schedule?.room || '',
    time: schedule?.time || '',
    day: schedule?.day || 'Monday',
    grade: schedule?.grade || 'Primary'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: schedule?.id || Date.now().toString(),
      isFromTeacher: false
    });
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const musicRooms = ["Music Room 1", "Music Room 2", "Music Room 3", "Practice Room 1", "Practice Room 2", "Studio A", "Studio B"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {schedule ? (schedule.isFromTeacher ? 'Reschedule Teacher Class' : 'Edit Manual Schedule') : 'Add Manual Schedule'}
        </h2>
        
        {schedule?.isFromTeacher && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="font-medium">Rescheduling Teacher Schedule</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              This will create a manual override. The original teacher schedule will remain unchanged.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject/Course</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              placeholder="e.g., Piano Lesson, Guitar Class"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
            <select
              value={formData.teacher}
              onChange={(e) => setFormData({...formData, teacher: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            >
              <option value="">Select a teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={`${teacher.firstName} ${teacher.lastName}`}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
              <option value="Other">Other (Custom)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
            <select
              value={formData.room}
              onChange={(e) => setFormData({...formData, room: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            >
              <option value="">Select a room</option>
              {musicRooms.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
              <option value="Other">Other (Custom)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              placeholder="e.g., 09:00 - 10:30"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
            <select
              value={formData.day}
              onChange={(e) => setFormData({...formData, day: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
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
              {schedule ? 'Update' : 'Add'} Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
