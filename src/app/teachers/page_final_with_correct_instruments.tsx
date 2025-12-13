"use client";

/*
 * 🛡️ DESIGN PROTECTION NOTICE 🛡️
 * 
 * This file contains a BEAUTIFUL BLUE-PURPLE DESIGN that must be preserved!
 * 
 * 📖 Read DESIGN_PROTECTION_GUIDE.md before making changes
 * 
 * 🚫 DO NOT MODIFY sections marked with "PROTECTED DESIGN SECTION"
 * ✅ SAFE to modify sections marked with "SAFE MODIFICATION ZONE" 
 * 
 * 🆘 Emergency backup: page_beautiful_backup.tsx
 */

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, User, Calendar, Phone, Music, CheckCircle2, XCircle, AlertTriangle, Info, Clock, MapPin, Printer } from "lucide-react";
import { useRealtimeTeachers } from "@/hooks/useRealtimeTeachers";
import { Teacher } from "@/lib/db";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Format phone number to Philippine format
const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return `+63 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('639')) {
    return `+63 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  return phone;
};

// Types for the original advanced system
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
  startDate: string;
  isActive: boolean;
}

interface ModalState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

// Teacher Schedule View Props
interface TeacherScheduleViewProps {
  teacher: Teacher;
  schedules: TeacherSchedule[];
  onClose: () => void;
  onEdit: (schedule: TeacherSchedule) => void;
  onDelete: (scheduleId: string) => void;
  onIncrementLesson: (scheduleId: string) => void;
  onRenewCard: (scheduleId: string, newCardNumber: string) => void;
}

function TeacherScheduleView({ teacher, schedules, onClose, onEdit, onDelete, onIncrementLesson, onRenewCard }: TeacherScheduleViewProps) {
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
        <title>${teacher.firstName} ${teacher.lastName}'s Schedule</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .date-range { text-align: center; margin-bottom: 20px; font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; vertical-align: top; }
          th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
          .day-header { background-color: #e0e0e0; font-weight: bold; text-align: center; }
          .time-cell { width: 80px; font-weight: bold; text-align: center; }
          .student-name { font-weight: bold; }
          .instrument { font-style: italic; color: #666; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${teacher.firstName} ${teacher.lastName}'s Schedule</h1>
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
              <h2 className="text-2xl font-bold text-gray-800">{teacher.firstName} {teacher.lastName}'s Schedule</h2>
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
                    <button
                      onClick={() => onIncrementLesson(schedule.id)}
                      className="p-1 hover:bg-green-100 rounded"
                      title="Mark lesson as completed"
                      disabled={!schedule.isActive || schedule.currentLessonNumber >= schedule.maxLessons}
                    >
                      <Plus className="h-4 w-4 text-green-600" />
                    </button>
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
                      <button
                        onClick={() => {
                          const newCardNumber = prompt('Enter new card number:');
                          if (newCardNumber) {
                            onRenewCard(schedule.id, newCardNumber.toUpperCase());
                          }
                        }}
                        className="ml-2 text-red-800 underline"
                      >
                        Renew Card
                      </button>
                    </div>
                  )}
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
                            <div className="font-semibold">{schedule.studentName}</div>
                            <div className="text-xs opacity-90">{schedule.instrument}</div>
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
            {['Piano', 'Guitar', 'Violin', 'Flute', 'Saxophone', 'Clarinet', 'Drums', 'Bass Guitar', 'Percussion'].map(instrument => (
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
    firstName: teacher?.firstName || '',
    lastName: teacher?.lastName || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    instrument: teacher?.instrument || '',
    address: teacher?.address || '',
    dateOfBirth: teacher?.dateOfBirth || '',
    zipCode: teacher?.zipCode || '',
    tinNumber: teacher?.tinNumber || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: teacher?.id || Date.now().toString()
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
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrument</label>
              <input
                type="text"
                value={formData.instrument}
                onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                required
              />
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
  onSave: (schedule: Omit<TeacherSchedule, 'id'>) => void;
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

  // New state for recurring schedule functionality
  const [recurringWeeks, setRecurringWeeks] = useState(3);
  const [previewSchedules, setPreviewSchedules] = useState<any[]>([]);

  const levels = ["Preparatory", "Primary", "Intermediate", "Advance"];
  const durations = ["30 min", "45 min", "60 min", "90 min", "120 min"];
  const instruments = ["Piano", "Voice", "Drums", "Acoustic Guitar", "Electric Guitar", "Bass Guitar", "Ukulele", "Violin"];

  // Generate preview schedules when form data changes
  useEffect(() => {
    if (formData.startDate && formData.day && formData.time) {
      const startDate = new Date(formData.startDate);
      const dayIndex = days.indexOf(formData.day);
      const schedules = [];

      for (let week = 0; week < recurringWeeks; week++) {
        const scheduleDate = new Date(startDate);
        scheduleDate.setDate(startDate.getDate() + (week * 7));
        
        schedules.push({
          week: week + 1,
          date: scheduleDate.toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
          }),
          day: formData.day,
          time: formData.time,
          duration: formData.duration
        });
      }
      setPreviewSchedules(schedules);
    }
  }, [formData.startDate, formData.day, formData.time, formData.duration, recurringWeeks, days]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {schedule ? 'Edit Schedule' : 'Add New Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              {/* Teacher & Instrument Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  >
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instrument</label>
                  <select
                    value={formData.instrument}
                    onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="">Select Instrument</option>
                    {instruments.map(instrument => (
                      <option key={instrument} value={instrument}>{instrument}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Name & Card Number Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                    placeholder="Enter student's full name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto suggestions from student database</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({...formData, cardNumber: e.target.value.toUpperCase()})}
                    placeholder="CARD-XXX"
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Level, Room, Duration Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
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
                    placeholder="Room number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    {durations.map(duration => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day, Time, Dates, Recurring Row */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      required
                    />
                    <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dates</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      required
                    />
                    <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recurring #</label>
                  <select
                    value={recurringWeeks}
                    onChange={(e) => setRecurringWeeks(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">(Example: 3 = 3x per week)</p>
                </div>
              </div>

              {/* Lesson Numbers Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Number</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.currentLessonNumber}
                    onChange={(e) => setFormData({...formData, currentLessonNumber: parseInt(e.target.value) || 1})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Lessons</label>
                  <select
                    value={formData.maxLessons}
                    onChange={(e) => setFormData({...formData, maxLessons: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    {[4, 5, 6, 8, 10, 12, 16, 20].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Maximum 20 lessons per card</p>
                </div>
              </div>
            </div>

            {/* Right Column - Schedule Preview */}
            <div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule Preview</h3>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {previewSchedules.map((preview, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-blue-100 rounded text-blue-600 text-xs font-semibold flex items-center justify-center">
                            Week {preview.week}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">{preview.date}</div>
                            <div className="text-gray-600">{preview.day}</div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium text-gray-800">{preview.time}</div>
                          <div className="text-gray-600">{preview.duration}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Add Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const { teachers: realtimeTeachers, loading: realtimeLoading, error: realtimeError } = useRealtimeTeachers();
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeacherSchedule | null>(null);
  const [modalState, setModalState] = useState<ModalState>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Load schedules
  const loadSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const snapshot = await getDocs(collection(db, 'schedules'));
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeacherSchedule[];
      setSchedules(schedulesData);
      setSchedulesError(null);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedulesError(error instanceof Error ? error.message : 'Failed to load schedules');
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const showModal = useCallback((type: ModalState['type'], title: string, message: string) => {
    setModalState({ show: true, type, title, message });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, show: false }));
  }, []);

  const getTeacherSchedule = (teacherId: string) => {
    return schedules.filter(schedule => schedule.teacherId === teacherId);
  };

  const handleViewSchedule = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowScheduleView(true);
  };

  const handleAddSchedule = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditingSchedule(null);
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (schedule: TeacherSchedule) => {
    setEditingSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
      await loadSchedules();
      showModal('success', 'Success', 'Schedule deleted successfully!');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showModal('error', 'Error', 'Failed to delete schedule');
    }
  };

  const handleSaveSchedule = async (scheduleData: Omit<TeacherSchedule, 'id'>) => {
    try {
      if (editingSchedule) {
        await updateDoc(doc(db, 'schedules', editingSchedule.id), scheduleData);
        showModal('success', 'Success', 'Schedule updated successfully!');
      } else {
        await addDoc(collection(db, 'schedules'), {
          ...scheduleData,
          teacherId: selectedTeacher?.id || scheduleData.teacherId
        });
        showModal('success', 'Success', 'Schedule created successfully!');
      }
      
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      await loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      showModal('error', 'Error', 'Failed to save schedule');
    }
  };

  const incrementLessonNumber = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || schedule.currentLessonNumber >= schedule.maxLessons) return;

    try {
      await updateDoc(doc(db, 'schedules', scheduleId), {
        currentLessonNumber: schedule.currentLessonNumber + 1
      });
      await loadSchedules();
      showModal('success', 'Success', 'Lesson marked as completed!');
    } catch (error) {
      console.error('Error updating lesson number:', error);
      showModal('error', 'Error', 'Failed to update lesson');
    }
  };

  const renewCard = async (scheduleId: string, newCardNumber: string) => {
    try {
      await updateDoc(doc(db, 'schedules', scheduleId), {
        cardNumber: newCardNumber,
        isActive: true,
        currentLessonNumber: 1
      });
      await loadSchedules();
      showModal('success', 'Success', 'Card renewed successfully!');
    } catch (error) {
      console.error('Error renewing card:', error);
      showModal('error', 'Error', 'Failed to renew card');
    }
  };

  // Loading and error states
  if (realtimeLoading || schedulesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teachers and schedules...</p>
        </div>
      </div>
    );
  }

  if (realtimeError || schedulesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <XCircle className="h-12 w-12 mx-auto mb-4" />
          <p>Error: {realtimeError || schedulesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        
        {/* ========================================= */}
        {/* PROTECTED DESIGN SECTION - DO NOT MODIFY */}
        {/* Beautiful Header with Blue-Purple Gradient */}
        {/* ========================================= */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 rounded-2xl shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200">
                <ArrowLeft className="h-6 w-6 text-white" />
              </Link>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Teachers Management</h1>
                <p className="text-blue-100 text-lg mt-1">Comprehensive teacher and schedule management system</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Add New Teacher
              </button>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* PROTECTED DESIGN SECTION - DO NOT MODIFY */}
        {/* Beautiful Stats Cards with Gradients */}
        {/* ========================================= */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold mb-2">{realtimeTeachers.length}</div>
              <div className="text-orange-100">Total Teachers</div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold mb-2">
                {realtimeTeachers.filter(t => getTeacherSchedule(t.id || '').length > 0).length}
              </div>
              <div className="text-green-100">Active Teachers</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold mb-2">{schedules.length}</div>
              <div className="text-blue-100">Total Classes</div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl font-bold mb-2">
                {[...new Set(realtimeTeachers.map(t => t.instrument))].length}
              </div>
              <div className="text-purple-100">Instruments</div>
            </div>
          </div>
        </div>
        {/* ========================================= */}
        {/* END PROTECTED DESIGN SECTION */}
        {/* ========================================= */}

        {/* ========================================= */}
        {/* PROTECTED DESIGN SECTION - DO NOT MODIFY */}
        {/* Beautiful Teachers Directory */}
        {/* ========================================= */}
        {/* Teachers Directory Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="p-8 border-b border-slate-200/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Teachers Directory
            </h2>
            <p className="text-slate-600 mt-2">Manage and view all registered music teachers</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {realtimeTeachers.map(teacher => {
                const teacherSchedules = getTeacherSchedule(teacher.id || '');
                const initials = `${teacher.firstName?.charAt(0) || ''}${teacher.lastName?.charAt(0) || ''}`.toUpperCase();
                
                return (
                  <div key={teacher.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="p-6 relative">
                      {/* Action buttons */}
                      <div className="absolute top-4 right-4 flex gap-1">
                        <button
                          onClick={() => {
                            setEditingTeacher(teacher);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Teacher"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this teacher?')) {
                              // Handle delete logic here
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Teacher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Teacher info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {teacher.firstName} {teacher.lastName}
                          </h3>
                          <div className="text-sm text-gray-600">
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {teacher.instrument}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-gray-700">{teacher.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-700">{formatPhoneNumber(teacher.phone || '')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-700">{teacherSchedules.length} scheduled</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleViewSchedule(teacher)}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                          View Schedule
                        </button>
                        <button
                          onClick={() => handleAddSchedule(teacher)}
                          className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                          Add Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* ========================================= */}
        {/* END PROTECTED DESIGN SECTION */}
        {/* ========================================= */}

        {/* ========================================= */}
        {/* PROTECTED DESIGN SECTION - DO NOT MODIFY */}
        {/* Beautiful Search and Overview Sections */}
        {/* ========================================= */}

        {/* Search Schedules Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-800">Search Schedules</label>
                <p className="text-xs text-gray-500">Filter by student, teacher, instrument, or day</p>
              </div>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <input
                placeholder="Search schedules, teachers, students..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 font-medium shadow-sm"
                type="text"
                defaultValue=""
              />
            </div>
          </div>
        </div>

        {/* Schedules Overview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Schedules Overview</h2>
                <p className="text-gray-600 mt-2">{schedules.length} of {schedules.length} schedules</p>
              </div>
              <div className="bg-gray-100 rounded-xl p-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
              {schedules.slice(0, 12).map(schedule => {
                const teacher = realtimeTeachers.find(t => t.id === schedule.teacherId);
                const dayInitial = schedule.day.charAt(0).toUpperCase();
                
                return (
                  <div key={schedule.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {dayInitial}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800">{schedule.day}</div>
                          <div className="text-xs text-gray-600">{schedule.time}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-800">{schedule.studentName}</div>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-600">{teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l6 6V5" />
                          </svg>
                          <span className="text-gray-600">{schedule.instrument}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditSchedule(schedule)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Schedule"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Schedule"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/50">
              <div className="text-sm text-slate-600">
                Showing 1 to {Math.min(12, schedules.length)} of {schedules.length} schedules
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  <button className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
                    1
                  </button>
                  {schedules.length > 12 && (
                    <>
                      <button className="px-3 py-2 text-sm font-medium rounded-lg transition-colors text-slate-600 bg-white border border-slate-300 hover:bg-slate-50">
                        2
                      </button>
                      <button className="px-3 py-2 text-sm font-medium rounded-lg transition-colors text-slate-600 bg-white border border-slate-300 hover:bg-slate-50">
                        3
                      </button>
                    </>
                  )}
                </div>
                <button
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={schedules.length <= 12}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* ========================================= */}
        {/* END PROTECTED DESIGN SECTION */}
        {/* ========================================= */}

        {/* ========================================= */}
        {/* SAFE MODIFICATION ZONE - MODALS & FORMS */}
        {/* You can safely modify the modals below */}
        {/* without affecting the main page design */}
        {/* ========================================= */}
        
        {/* Modals */}
        {isModalOpen && (
          <TeacherModal
            teacher={editingTeacher}
            onClose={() => setIsModalOpen(false)}
            onSave={(teacher) => {
              // Handle save logic here
              setIsModalOpen(false);
              showModal('success', 'Success', 'Teacher saved successfully!');
            }}
          />
        )}

        {isScheduleModalOpen && (
          <ScheduleModal
            schedule={editingSchedule}
            teachers={realtimeTeachers}
            days={days}
            onClose={() => setIsScheduleModalOpen(false)}
            onSave={handleSaveSchedule}
          />
        )}

        {showScheduleView && selectedTeacher && (
          <TeacherScheduleView
            teacher={selectedTeacher}
            schedules={getTeacherSchedule(selectedTeacher.id || '')}
            onClose={() => {
              setShowScheduleView(false);
              setSelectedTeacher(null);
            }}
            onEdit={handleEditSchedule}
            onDelete={handleDeleteSchedule}
            onIncrementLesson={incrementLessonNumber}
            onRenewCard={renewCard}
          />
        )}

        {/* Modern Modal System */}
        {modalState.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-out scale-100">
              <div className="p-6 text-center">
                {/* Icon based on type */}
                <div className="mb-4">
                  {modalState.type === 'success' && <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />}
                  {modalState.type === 'error' && <XCircle className="h-16 w-16 text-red-500 mx-auto" />}
                  {modalState.type === 'warning' && <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />}
                  {modalState.type === 'info' && <Info className="h-16 w-16 text-blue-500 mx-auto" />}
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-2">{modalState.title}</h3>
                <p className="text-gray-600 mb-6">{modalState.message}</p>

                <button
                  onClick={hideModal}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors w-full ${
                    modalState.type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                    modalState.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                    modalState.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                    'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}