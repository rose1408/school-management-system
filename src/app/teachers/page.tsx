"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Clock, MapPin, User, BookOpen, Calendar, Filter, Printer } from "lucide-react";

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

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([
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

  const [schedules, setSchedules] = useState<TeacherSchedule[]>([
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

  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [viewingTeacherSchedule, setViewingTeacherSchedule] = useState<string | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<TeacherSchedule | null>(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : "Unknown Teacher";
  };

  const getTeacherSchedule = (teacherId: string, day?: string) => {
    return schedules.filter(schedule => {
      const matchesTeacher = teacherId === "all" || schedule.teacherId === teacherId;
      const matchesDay = !day || day === "all" || schedule.day === day;
      return matchesTeacher && matchesDay;
    });
  };

  const filteredSchedules = getTeacherSchedule(selectedTeacher, selectedDay);

  // Function to increment lesson number and handle card completion
  const incrementLessonNumber = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === scheduleId) {
        const newLessonNumber = schedule.currentLessonNumber + 1;
        
        if (newLessonNumber > schedule.maxLessons) {
          // Mark schedule as inactive when lessons are completed
          return { ...schedule, isActive: false };
        }
        
        return { ...schedule, currentLessonNumber: newLessonNumber };
      }
      return schedule;
    }));
  };

  // Function to renew card with new card number
  const renewCard = (scheduleId: string, newCardNumber: string) => {
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === scheduleId) {
        return {
          ...schedule,
          cardNumber: newCardNumber,
          currentLessonNumber: 1,
          isActive: true,
          startDate: new Date().toISOString().split('T')[0]
        };
      }
      return schedule;
    }));
  };

  // Function to get active schedules only
  const getActiveSchedules = () => {
    return schedules.filter(schedule => schedule.isActive);
  };

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setIsTeacherModalOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsTeacherModalOpen(true);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("Are you sure you want to delete this teacher? This will also remove all their schedules.")) {
      setTeachers(teachers.filter(teacher => teacher.id !== id));
      setSchedules(schedules.filter(schedule => schedule.teacherId !== id));
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (schedule: TeacherSchedule) => {
    setEditingSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm("Are you sure you want to delete this schedule entry?")) {
      setSchedules(schedules.filter(schedule => schedule.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6 text-orange-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Teachers Schedule Management</h1>
              <p className="text-gray-600">Manage teacher profiles and their individual schedules</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddTeacher}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Teacher
            </button>
            <button
              onClick={handleAddSchedule}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Add Schedule
            </button>
          </div>
        </div>

        {/* Teachers Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {teachers.map(teacher => (
            <div key={teacher.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.employeeId}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditTeacher(teacher)}
                    className="p-1 hover:bg-orange-100 rounded"
                  >
                    <Edit className="h-4 w-4 text-orange-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(teacher.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium text-orange-600">Music Teacher</span>
                </div>
                <div className="text-xs text-gray-500">
                  Instruments: {teacher.instruments.join(", ")}
                </div>
                <div className="text-xs text-gray-500">
                  Classes: {getTeacherSchedule(teacher.id).length} scheduled
                </div>
              </div>

              <button
                onClick={() => setViewingTeacherSchedule(teacher.id)}
                className="w-full px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
              >
                View Schedule
              </button>
            </div>
          ))}
        </div>

        {/* Schedule Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Teacher:</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Teachers</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Day:</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Days</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {(selectedTeacher !== "all" || selectedDay !== "all") && (
              <button
                onClick={() => {
                  setSelectedTeacher("all");
                  setSelectedDay("all");
                }}
                className="text-sm text-orange-600 hover:text-orange-700 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Schedule Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {selectedTeacher === "all" 
              ? "All Teachers Schedule" 
              : `${getTeacherName(selectedTeacher)}'s Schedule`}
          </h2>

          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500">No schedules found for the selected filters</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchedules.map(schedule => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{schedule.instrument}</h3>
                      <p className="text-sm text-orange-600">{getTeacherName(schedule.teacherId)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="p-1 hover:bg-blue-100 rounded"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{schedule.day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{schedule.time} ({schedule.duration})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{schedule.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{schedule.level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">{teachers.length}</div>
            <div className="text-gray-600">Total Teachers</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{schedules.length}</div>
            <div className="text-gray-600">Total Classes</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {new Set(schedules.map(s => s.day)).size}
            </div>
            <div className="text-gray-600">Active Days</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {new Set(teachers.flatMap(t => t.instruments)).size}
            </div>
            <div className="text-gray-600">Total Instruments</div>
          </div>
        </div>
      </div>

      {/* Detailed Teacher Schedule View */}
      {viewingTeacherSchedule && (
        <TeacherScheduleView
          teacher={teachers.find(t => t.id === viewingTeacherSchedule)!}
          schedules={schedules.filter(s => s.teacherId === viewingTeacherSchedule)}
          onClose={() => setViewingTeacherSchedule(null)}
          onEdit={handleEditSchedule}
          onDelete={handleDeleteSchedule}
        />
      )}

      {/* Teacher Modal */}
      {isTeacherModalOpen && (
        <TeacherModal
          teacher={editingTeacher}
          onClose={() => setIsTeacherModalOpen(false)}
          onSave={(teacher) => {
            if (editingTeacher) {
              setTeachers(teachers.map(t => t.id === teacher.id ? teacher : t));
            } else {
              const newTeacher = {
                ...teacher,
                id: Date.now().toString(),
                employeeId: `TCH${String(teachers.length + 1).padStart(3, '0')}`
              };
              setTeachers([...teachers, newTeacher]);
            }
            setIsTeacherModalOpen(false);
          }}
        />
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <ScheduleModal
          schedule={editingSchedule}
          teachers={teachers}
          days={days}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={(schedule) => {
            if (editingSchedule) {
              setSchedules(schedules.map(s => s.id === schedule.id ? schedule : s));
            } else {
              const newSchedule = {
                ...schedule,
                id: Date.now().toString()
              };
              setSchedules([...schedules, newSchedule]);
            }
            setIsScheduleModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Teacher Schedule View Component
interface TeacherScheduleViewProps {
  teacher: Teacher;
  schedules: TeacherSchedule[];
  onClose: () => void;
  onEdit: (schedule: TeacherSchedule) => void;
  onDelete: (id: string) => void;
}

function TeacherScheduleView({ teacher, schedules, onClose, onEdit, onDelete }: TeacherScheduleViewProps) {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDateFrom, setPrintDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [printDateTo, setPrintDateTo] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [selectedDaysForPrint, setSelectedDaysForPrint] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", 
    "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", 
    "7:00 PM", "8:00 PM"
  ];

  const getScheduleForTimeSlot = (day: string, timeSlot: string) => {
    return schedules.find(schedule => {
      const scheduleTime = schedule.time;
      const formattedTime = formatTimeSlot(scheduleTime);
      return schedule.day === day && formattedTime === timeSlot;
    });
  };

  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:00 ${ampm}`;
  };

  const getInstrumentColor = (instrument: string) => {
    const colors = {
      'Piano': 'bg-purple-500',
      'Guitar': 'bg-orange-500',
      'Violin': 'bg-red-500',
      'Flute': 'bg-blue-500',
      'Saxophone': 'bg-green-500',
      'Clarinet': 'bg-yellow-500',
      'Drums': 'bg-pink-500',
      'Bass Guitar': 'bg-indigo-500',
      'Percussion': 'bg-teal-500'
    };
    return colors[instrument as keyof typeof colors] || 'bg-gray-500';
  };

  const handleDayToggle = (day: string) => {
    setSelectedDaysForPrint(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const getFilteredSchedulesForPrint = () => {
    return schedules.filter(schedule => 
      selectedDaysForPrint.includes(schedule.day)
    );
  };

  const generatePrintContent = () => {
    const filteredSchedules = getFilteredSchedulesForPrint();
    const sortedSchedules = filteredSchedules.sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayComparison = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayComparison !== 0) return dayComparison;
      
      return a.time.localeCompare(b.time);
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${teacher.name}'s Schedule</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #000;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 10px;
          }
          .date-range {
            text-align: center;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          th, td { 
            border: 1px solid #333; 
            padding: 8px; 
            text-align: left;
            vertical-align: top;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
            text-align: center;
          }
          .day-header {
            background-color: #e0e0e0;
            font-weight: bold;
            text-align: center;
          }
          .time-cell {
            width: 80px;
            font-weight: bold;
            text-align: center;
          }
          .student-name {
            font-weight: bold;
          }
          .instrument {
            font-style: italic;
            color: #666;
          }
          .level {
            font-size: 12px;
            color: #888;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${teacher.name}'s Schedule</h1>
          <div>Music Teacher Schedule</div>
        </div>
        <div class="date-range">
          Schedule Period: ${new Date(printDateFrom).toLocaleDateString()} - ${new Date(printDateTo).toLocaleDateString()}
        </div>
        <table>
          <thead>
            <tr>
              <th>TIME</th>
              <th>NAME OF STUDENT</th>
              <th>COURSE</th>
              <th>CARD NUMBER</th>
              <th>LESSON #</th>
              <th>STUDENT'S SIGNATURE</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${selectedDaysForPrint.map(day => {
              const daySchedules = sortedSchedules.filter(s => s.day === day);
              if (daySchedules.length === 0) return '';
              
              return `
                <tr>
                  <td colspan="7" class="day-header">${day.toUpperCase()} - ${new Date(printDateFrom).toLocaleDateString()}</td>
                </tr>
                ${daySchedules.map(schedule => `
                  <tr>
                    <td class="time-cell">${formatTimeForPrint(schedule.time)}</td>
                    <td class="student-name">${schedule.studentName}</td>
                    <td class="instrument">${schedule.instrument} - ${schedule.level}</td>
                    <td>${schedule.cardNumber}</td>
                    <td>${schedule.currentLessonNumber}/${schedule.maxLessons}</td>
                    <td></td>
                    <td></td>
                  </tr>
                `).join('')}
              `;
            }).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
          <p>Levels: Preparatory, Primary, Intermediate, Advance</p>
          <p>Printed on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const formatTimeForPrint = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'pm' : 'am';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{teacher.name}&apos;s Schedule</h2>
              <p className="text-gray-600">Weekly music lesson schedule</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print Schedule
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Individual Schedule Cards at Top */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Scheduled Lessons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map(schedule => (
              <div key={schedule.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{schedule.studentName}</h4>
                    <p className="text-sm text-blue-600">{schedule.instrument} - {schedule.level}</p>
                  </div>
                  <div className="flex gap-1">
                    {/* TODO: Implement lesson completion functionality
                    <button
                      onClick={() => incrementLessonNumber(schedule.id)}
                      className="p-1 hover:bg-green-100 rounded"
                      title="Mark lesson as completed"
                      disabled={!schedule.isActive}
                    >
                      <Plus className="h-4 w-4 text-green-600" />
                    </button>
                    */}
                    <button
                      onClick={() => onEdit(schedule)}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => onDelete(schedule.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{schedule.day}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{schedule.time} ({schedule.duration})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{schedule.room}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Card: {schedule.cardNumber}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      schedule.currentLessonNumber >= schedule.maxLessons 
                        ? 'bg-red-100 text-red-800' 
                        : schedule.currentLessonNumber >= schedule.maxLessons - 2
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      Lesson {schedule.currentLessonNumber}/{schedule.maxLessons}
                    </div>
                  </div>
                  {!schedule.isActive && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>Card Expired!</strong> Please renew to continue lessons.
                      {/* TODO: Implement card renewal functionality
                      <button
                        onClick={() => {
                          const newCardNumber = prompt('Enter new card number:');
                          if (newCardNumber) {
                            renewCard(schedule.id, newCardNumber.toUpperCase());
                          }
                        }}
                        className="ml-2 text-red-800 underline"
                      >
                        Renew Card
                      </button>
                      */}
                    </div>
                  )}
                  <div className="text-orange-600 font-medium">
                    {schedule.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Calendar Grid */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Calendar View</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="p-3 bg-gray-600 text-white text-center font-medium rounded">
                  Time
                </div>
                {days.map(day => (
                  <div key={day} className="p-3 bg-gray-600 text-white text-center font-medium rounded">
                    {day.toUpperCase()}
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {timeSlots.map(timeSlot => (
                <div key={timeSlot} className="grid grid-cols-8 gap-1 mb-1">
                  <div className="p-3 bg-gray-700 text-white text-center font-medium text-sm">
                    {timeSlot}
                  </div>
                  {days.map(day => {
                    const schedule = getScheduleForTimeSlot(day, timeSlot);
                    return (
                      <div key={`${day}-${timeSlot}`} className="min-h-[60px] bg-gray-100 rounded">
                        {schedule && (
                          <div className={`${getInstrumentColor(schedule.instrument)} text-white p-2 rounded text-xs h-full flex flex-col justify-center`}>
                            <div className="font-semibold">{schedule.instrument}</div>
                            <div className="text-xs opacity-90">{schedule.level}</div>
                            <div className="text-xs opacity-90">{schedule.room}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Instrument Colors:</h4>
          <div className="flex flex-wrap gap-3 text-xs">
            {teacher.instruments.map(instrument => (
              <div key={instrument} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getInstrumentColor(instrument)}`}></div>
                <span className="text-gray-600">{instrument}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Print Options Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Print Schedule Options</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={printDateFrom}
                    onChange={(e) => setPrintDateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={printDateTo}
                    onChange={(e) => setPrintDateTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Days to Print</label>
                  <div className="grid grid-cols-2 gap-2">
                    {days.map(day => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedDaysForPrint.includes(day)}
                          onChange={() => handleDayToggle(day)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected lessons:</strong> {getFilteredSchedulesForPrint().length} lessons
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    The printed schedule will include time slots, student signature areas, and remarks columns.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    generatePrintContent();
                    setShowPrintModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={selectedDaysForPrint.length === 0}
                >
                  Print Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Teacher Modal Component
interface TeacherModalProps {
  teacher: Teacher | null;
  onClose: () => void;
  onSave: (teacher: Teacher) => void;
}

function TeacherModal({ teacher, onClose, onSave }: TeacherModalProps) {
  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>({
    name: teacher?.name || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    instruments: teacher?.instruments || [],
    employeeId: teacher?.employeeId || ''
  });

  const [newInstrument, setNewInstrument] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: teacher?.id || Date.now().toString()
    });
  };

  const addInstrument = () => {
    if (newInstrument.trim() && !formData.instruments.includes(newInstrument.trim())) {
      setFormData({
        ...formData,
        instruments: [...formData.instruments, newInstrument.trim()]
      });
      setNewInstrument('');
    }
  };

  const removeInstrument = (instrument: string) => {
    setFormData({
      ...formData,
      instruments: formData.instruments.filter(s => s !== instrument)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {teacher ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instruments</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newInstrument}
                onChange={(e) => setNewInstrument(e.target.value)}
                placeholder="Add an instrument"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
              />
              <button
                type="button"
                onClick={addInstrument}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.instruments.map(instrument => (
                <span
                  key={instrument}
                  className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm"
                >
                  {instrument}
                  <button
                    type="button"
                    onClick={() => removeInstrument(instrument)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              ))}
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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              {teacher ? 'Update' : 'Add'} Teacher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Schedule Modal Component
interface ScheduleModalProps {
  schedule: TeacherSchedule | null;
  teachers: Teacher[];
  days: string[];
  onClose: () => void;
  onSave: (schedule: TeacherSchedule) => void;
}

function ScheduleModal({ schedule, teachers, days, onClose, onSave }: ScheduleModalProps) {
  const [formData, setFormData] = useState<Omit<TeacherSchedule, 'id'>>({
    teacherId: schedule?.teacherId || (teachers[0]?.id || ''),
    studentName: schedule?.studentName || '',
    instrument: schedule?.instrument || '',
    level: schedule?.level || 'Preparatory',
    room: schedule?.room || '',
    time: schedule?.time || '09:00',
    day: schedule?.day || 'Monday',
    duration: schedule?.duration || '60 min',
    cardNumber: schedule?.cardNumber || '',
    currentLessonNumber: schedule?.currentLessonNumber || 1,
    maxLessons: schedule?.maxLessons || 10,
    startDate: schedule?.startDate || new Date().toISOString().split('T')[0],
    isActive: schedule?.isActive ?? true
  });

  const levels = ["Preparatory", "Primary", "Intermediate", "Advance"];
  const durations = ["30 min", "45 min", "60 min", "90 min", "120 min"];

  const selectedTeacher = teachers.find(t => t.id === formData.teacherId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: schedule?.id || Date.now().toString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {schedule ? 'Edit Schedule' : 'Add New Schedule'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrument</label>
              <select
                value={formData.instrument}
                onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="">Select Instrument</option>
                {selectedTeacher?.instruments.map(instrument => (
                  <option key={instrument} value={instrument}>{instrument}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                placeholder="Enter student's full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value.toUpperCase()})}
                placeholder="CARD-XXX"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {durations.map(duration => (
                <option key={duration} value={duration}>{duration}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Lesson #</label>
              <input
                type="number"
                min="1"
                max={formData.maxLessons}
                value={formData.currentLessonNumber}
                onChange={(e) => setFormData({...formData, currentLessonNumber: parseInt(e.target.value) || 1})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Lessons</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.maxLessons}
                onChange={(e) => setFormData({...formData, maxLessons: parseInt(e.target.value) || 10})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          {schedule && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-800">Lesson Progress</h4>
                  <p className="text-sm text-blue-600">
                    Progress: {formData.currentLessonNumber}/{formData.maxLessons} lessons completed
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                    formData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.isActive ? 'Active' : 'Expired'}
                  </div>
                </div>
              </div>
            </div>
          )}

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
