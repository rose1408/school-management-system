"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Clock, MapPin, User, RefreshCw } from "lucide-react";

interface ScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  day: string;
  grade: string;
  isFromTeacher?: boolean; // Flag to identify schedules from teacher management
  teacherId?: string;
  originalScheduleId?: string;
}

// Teacher interfaces (copied from teachers page)
interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  instruments: string[];
  employeeId: string;
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
  // Teacher data (would typically come from a shared state or API)
  const [teachers] = useState<Teacher[]>([
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@school.com",
      phone: "(555) 123-4567",
      instruments: ["Piano", "Guitar", "Violin"],
      employeeId: "TCH001"
    },
    {
      id: "2",
      name: "Ms. Emily Chen",
      email: "emily.chen@school.com",
      phone: "(555) 234-5678",
      instruments: ["Flute", "Saxophone", "Clarinet"],
      employeeId: "TCH002"
    },
    {
      id: "3",
      name: "Dr. Michael Brown",
      email: "michael.brown@school.com",
      phone: "(555) 345-6789",
      instruments: ["Drums", "Bass Guitar", "Percussion"],
      employeeId: "TCH003"
    }
  ]);

  // Teacher schedules (would typically come from a shared state or API)
  const [teacherSchedules] = useState<TeacherSchedule[]>([
    {
      id: "1",
      teacherId: "1",
      studentName: "Emma Johnson",
      instrument: "Piano",
      level: "Intermediate",
      room: "Music Room 1",
      time: "09:00",
      day: "Monday",
      duration: "60 min",
      cardNumber: "CARD-001",
      currentLessonNumber: 3,
      maxLessons: 10,
      startDate: "2025-09-01",
      isActive: true
    },
    {
      id: "2",
      teacherId: "1",
      studentName: "Alex Smith",
      instrument: "Guitar",
      level: "Advance",
      room: "Music Room 2",
      time: "11:00",
      day: "Monday",
      duration: "60 min",
      cardNumber: "CARD-002",
      currentLessonNumber: 7,
      maxLessons: 10,
      startDate: "2025-09-15",
      isActive: true
    },
    {
      id: "3",
      teacherId: "2",
      studentName: "Sophie Chen",
      instrument: "Flute",
      level: "Primary",
      room: "Music Room 3",
      time: "10:00",
      day: "Tuesday",
      duration: "45 min",
      cardNumber: "CARD-003",
      currentLessonNumber: 1,
      maxLessons: 10,
      startDate: "2025-09-20",
      isActive: true
    },
    {
      id: "4",
      teacherId: "2",
      studentName: "Michael Brown",
      instrument: "Saxophone",
      level: "Intermediate",
      room: "Music Room 1",
      time: "14:00",
      day: "Wednesday",
      duration: "60 min",
      cardNumber: "CARD-004",
      currentLessonNumber: 9,
      maxLessons: 10,
      startDate: "2025-08-10",
      isActive: true
    },
    {
      id: "5",
      teacherId: "3",
      studentName: "Oliver Davis",
      instrument: "Drums",
      level: "Advance",
      room: "Practice Room 1",
      time: "16:00",
      day: "Thursday",
      duration: "60 min",
      cardNumber: "CARD-005",
      currentLessonNumber: 5,
      maxLessons: 10,
      startDate: "2025-09-05",
      isActive: true
    },
    {
      id: "6",
      teacherId: "1",
      studentName: "Lily Wilson",
      instrument: "Violin",
      level: "Primary",
      room: "Music Room 2",
      time: "13:00",
      day: "Friday",
      duration: "45 min",
      cardNumber: "CARD-006",
      currentLessonNumber: 2,
      maxLessons: 10,
      startDate: "2025-09-18",
      isActive: true
    },
    {
      id: "7",
      teacherId: "3",
      studentName: "James Garcia",
      instrument: "Bass Guitar",
      level: "Intermediate",
      room: "Practice Room 2",
      time: "10:00",
      day: "Saturday",
      duration: "60 min",
      cardNumber: "CARD-007",
      currentLessonNumber: 8,
      maxLessons: 10,
      startDate: "2025-08-25",
      isActive: true
    },
    {
      id: "8",
      teacherId: "2",
      studentName: "Isabella Martinez",
      instrument: "Clarinet",
      level: "Advance",
      room: "Music Room 3",
      time: "15:00",
      day: "Sunday",
      duration: "45 min",
      cardNumber: "CARD-008",
      currentLessonNumber: 6,
      maxLessons: 10,
      startDate: "2025-09-08",
      isActive: true
    }
  ]);

  const [manualSchedules, setManualSchedules] = useState<ScheduleItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const levels = ["Preparatory", "Primary", "Intermediate", "Advance"];

  // Convert teacher schedules to class schedule format
  const convertTeacherSchedulesToClassSchedules = (): ScheduleItem[] => {
    return teacherSchedules.map(schedule => {
      const teacher = teachers.find(t => t.id === schedule.teacherId);
      const endTime = calculateEndTime(schedule.time, schedule.duration);
      
      return {
        id: `teacher-${schedule.id}`,
        subject: `${schedule.instrument} - ${schedule.studentName}`,
        teacher: teacher?.name || 'Unknown Teacher',
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

  // Update schedules when component mounts or teacher schedules change
  useEffect(() => {
    const teacherSchedulesAsClassSchedules = convertTeacherSchedulesToClassSchedules();
    setAllSchedules([...teacherSchedulesAsClassSchedules, ...manualSchedules]);
  }, [teacherSchedules, manualSchedules, teachers]);

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

  const handleDeleteSchedule = (id: string) => {
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
    setManualSchedules(manualSchedules.filter(schedule => schedule.id !== id));
  };

  const getSchedulesByDay = (day: string) => {
    return allSchedules.filter(schedule => schedule.day === day);
  };

  const refreshSchedules = () => {
    setAllSchedules(getAllSchedules());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6 text-blue-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Class Schedule Management</h1>
              <p className="text-gray-600">Unified view of all teacher schedules and class timings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshSchedules}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={handleAddSchedule}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Manual Schedule
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Auto-Synchronized Schedule</h3>
              <p className="text-blue-700 text-sm">
                This view automatically displays all teacher schedules from the Teacher Management system. 
                You can reschedule classes or add additional manual schedules as needed.
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {days.map(day => (
            <div key={day} className="bg-white rounded-xl shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center border-b pb-2">
                {day}
              </h2>
              <div className="space-y-3">
                {getSchedulesByDay(day)
                  .sort((a, b) => {
                    const timeA = a.time.split(' - ')[0];
                    const timeB = b.time.split(' - ')[0];
                    return timeA.localeCompare(timeB);
                  })
                  .map(schedule => (
                  <div 
                    key={schedule.id} 
                    className={`rounded-lg p-3 border ${
                      schedule.isFromTeacher 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm">{schedule.subject}</h3>
                        {schedule.isFromTeacher && (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                            Teacher Schedule
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditSchedule(schedule)}
                          className="p-1 hover:bg-blue-100 rounded"
                          title={schedule.isFromTeacher ? "Reschedule (creates override)" : "Edit schedule"}
                        >
                          <Edit className="h-3 w-3 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title={schedule.isFromTeacher ? "Hide from view" : "Delete schedule"}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{schedule.teacher}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{schedule.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{schedule.room}</span>
                      </div>
                      <div className={`font-medium text-xs ${
                        schedule.isFromTeacher ? 'text-green-700' : 'text-blue-600'
                      }`}>
                        {schedule.grade}
                      </div>
                    </div>
                  </div>
                ))}
                {getSchedulesByDay(day).length === 0 && (
                  <div className="text-gray-400 text-center py-8 text-sm">
                    No classes scheduled
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{allSchedules.length}</div>
            <div className="text-gray-600">Total Classes</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {allSchedules.filter(s => s.isFromTeacher).length}
            </div>
            <div className="text-gray-600">Teacher Schedules</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {manualSchedules.length}
            </div>
            <div className="text-gray-600">Manual Schedules</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {new Set(allSchedules.map(s => s.teacher)).size}
            </div>
            <div className="text-gray-600">Active Teachers</div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit Schedule */}
      {isModalOpen && (
        <ScheduleModal
          schedule={editingSchedule}
          onClose={() => setIsModalOpen(false)}
          onSave={(schedule) => {
            if (editingSchedule) {
              if (editingSchedule.isFromTeacher) {
                // Create a new manual schedule as override
                const newSchedule = {
                  ...schedule,
                  id: `manual-${Date.now()}`,
                  isFromTeacher: false
                };
                setManualSchedules([...manualSchedules, newSchedule]);
              } else {
                // Update existing manual schedule
                setManualSchedules(manualSchedules.map(s => s.id === schedule.id ? schedule : s));
              }
            } else {
              // Add new manual schedule
              const newSchedule = {
                ...schedule,
                id: `manual-${Date.now()}`,
                isFromTeacher: false
              };
              setManualSchedules([...manualSchedules, newSchedule]);
            }
            setIsModalOpen(false);
          }}
          teachers={teachers}
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
  teachers: Teacher[];
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
                <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
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
