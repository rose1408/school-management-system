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
import { useRealtimeStudents } from "@/hooks/useRealtimeStudents";
import { Teacher, Student } from "@/lib/db";
import { db as firestore } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        id: teacher?.id || Date.now().toString()
      });
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">
                {teacher ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Enter first name"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Enter last name"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">TIN Number</label>
                  <input
                    type="text"
                    value={formData.tinNumber}
                    onChange={(e) => setFormData({...formData, tinNumber: e.target.value})}
                    placeholder="XXX-XXX-XXX-XXX"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="teacher@example.com"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Mobile *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(09) 17-123-4567"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Street, Barangay, City, Province"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                    placeholder="1234"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Instruments Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Music className="w-4 h-4 text-white" />
                </div>
                Instruments
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select all instruments you can teach *</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Piano', 'Voice', 'Drums', 'Classical Guitar', 'Electric Guitar', 'Bass Guitar', 'Ukulele', 'Violin', 'Saxophone', 'Flute'].map((inst) => (
                    <label key={inst} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.instrument.includes(inst)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, instrument: formData.instrument ? `${formData.instrument}, ${inst}` : inst});
                          } else {
                            setFormData({...formData, instrument: formData.instrument.split(', ').filter(i => i !== inst).join(', ')});
                          }
                        }}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{inst}</span>
                    </label>
                  ))}
                </div>
                
                <div className="mt-4">
                  <input
                    type="text"
                    value={formData.instrument}
                    onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                    placeholder="Or type instruments separated by commas"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 border-2 rounded-xl font-semibold transition-all duration-200 ${
                  isSubmitting 
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center justify-center gap-2 ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  teacher ? 'Update Teacher' : 'Add Teacher'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Schedule Modal Component
interface ScheduleModalProps {
  schedule: TeacherSchedule | null;
  teachers: Teacher[];
  students: Student[];
  days: string[];
  onClose: () => void;
  onSave: (schedule: Omit<TeacherSchedule, 'id'>) => void;
}

function ScheduleModal({ schedule, teachers, students, days, onClose, onSave }: ScheduleModalProps) {

  // Initialize form data - always derive from props for editing
  const initialFormData = {
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
  };

  const [formData, setFormData] = useState<Omit<TeacherSchedule, 'id'>>(initialFormData);

  // New state for recurring schedule functionality
  const [recurringWeeks, setRecurringWeeks] = useState(3);
  const [previewSchedules, setPreviewSchedules] = useState<any[]>([]);
  
  // Initialize schedule slots - always derive from props for editing
  const initialScheduleSlots = [{
    day: schedule?.day || 'Monday',
    time: schedule?.time || '09:00',
    date: schedule?.startDate || new Date().toISOString().split('T')[0],
    lessonNumber: schedule?.currentLessonNumber || 1
  }];

  const [scheduleSlots, setScheduleSlots] = useState(initialScheduleSlots);

  // Student suggestions state
  const [studentSuggestions, setStudentSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========================================
  // SAFE MODIFICATION ZONE - Schedule Editing Fix
  // Initialize schedule slots properly when editing
  // ========================================
  // Update form and slots whenever schedule prop changes
  useEffect(() => {
    const newFormData = {
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
    };

    const newScheduleSlots = [{
      day: schedule?.day || 'Monday',
      time: schedule?.time || '09:00',
      date: schedule?.startDate || new Date().toISOString().split('T')[0],
      lessonNumber: schedule?.currentLessonNumber || 1
    }];

    setFormData(newFormData);
    setScheduleSlots(newScheduleSlots);
  }, [schedule, teachers]);

  const levels = ["Preparatory", "Primary", "Intermediate", "Advance"];
  const durations = ["30 min", "45 min", "60 min", "90 min", "120 min"];
  const instruments = ["Piano", "Voice", "Drums", "Acoustic Guitar", "Electric Guitar", "Bass Guitar", "Ukulele", "Violin"];

  // Function to handle student name search and suggestions
  const handleStudentNameChange = (value: string) => {
    setFormData({...formData, studentName: value});
    
    if (value.length > 1 && students) {
      const filtered = students.filter(student => {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        return fullName.includes(value.toLowerCase()) || 
               student.firstName.toLowerCase().includes(value.toLowerCase()) ||
               student.lastName.toLowerCase().includes(value.toLowerCase());
      });
      setStudentSuggestions(filtered.slice(0, 5)); // Show max 5 suggestions
      setShowSuggestions(true);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Function to select a student from suggestions
  const selectStudent = (student: Student) => {
    const fullName = `${student.firstName} ${student.lastName}`;
    setFormData({...formData, studentName: fullName});
    setShowSuggestions(false);
    setStudentSuggestions([]);
  };

  // Generate preview schedules when form data changes
  useEffect(() => {
    const schedules = scheduleSlots.map((slot, index) => ({
      session: slot.lessonNumber,
      date: new Date(slot.date).toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      }),
      day: slot.day,
      time: slot.time,
      duration: formData.duration
    }));
    
    setPreviewSchedules(schedules);
  }, [scheduleSlots, formData.duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Create a schedule for each slot
      let successCount = 0;
      const totalSlots = scheduleSlots.length;
      
      for (const slot of scheduleSlots) {
        const scheduleData = {
          ...formData,
          day: slot.day,
          time: slot.time,
          currentLessonNumber: slot.lessonNumber,
          startDate: slot.date
        };
        
        await onSave(scheduleData);
        successCount++;
      }
      
      // Close modal first
      onClose();
      
      // Show appropriate success message
      if (totalSlots > 1) {
        // Use a timeout to ensure modal is closed before showing the success message
        setTimeout(() => {
          // Access showModal through a parent component or use the modal system
          const event = new CustomEvent('showSuccessModal', {
            detail: {
              title: 'Multiple Schedules Created!',
              message: `Successfully created ${successCount} schedule sessions!`
            }
          });
          window.dispatchEvent(event);
        }, 100);
      } else {
        // For single schedule, show immediate success
        setTimeout(() => {
          const event = new CustomEvent('showSuccessModal', {
            detail: {
              title: 'Success',
              message: 'Schedule created successfully!'
            }
          });
          window.dispatchEvent(event);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error saving multiple schedules:', error);
      // Don't close modal on error, let user try again
      setTimeout(() => {
        const event = new CustomEvent('showErrorModal', {
          detail: {
            title: 'Error',
            message: 'Error saving some schedules. Please try again.'
          }
        });
        window.dispatchEvent(event);
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {schedule ? 'Edit Schedule' : 'Add New Schedule'}
                </h2>
                <p className="text-blue-100 text-sm">Create a new lesson schedule for your student</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-100px)]">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
              {/* Left Column - Form Fields (3/5 width) */}
              <div className="xl:col-span-3 space-y-8">
                
                {/* Basic Information Section */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Teacher</label>
                      <div className="relative">
                        <select
                          value={formData.teacherId}
                          onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200 appearance-none"
                          required
                        >
                          {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.firstName} {teacher.lastName}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Instrument</label>
                      <div className="relative">
                        <select
                          value={formData.instrument}
                          onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200 appearance-none"
                          required
                        >
                          <option value="">Select Instrument</option>
                          {instruments.map(instrument => (
                            <option key={instrument} value={instrument}>{instrument}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <Music className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Student Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.studentName}
                          onChange={(e) => handleStudentNameChange(e.target.value)}
                          onFocus={() => {
                            if (formData.studentName.length > 1) {
                              handleStudentNameChange(formData.studentName);
                            }
                          }}
                          onBlur={() => {
                            // Hide suggestions after a small delay to allow clicking on suggestions
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          placeholder="Enter student's full name"
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                          required
                          autoComplete="off"
                        />
                        
                        {/* Student Suggestions Dropdown */}
                        {showSuggestions && studentSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {studentSuggestions.map((student) => (
                              <div
                                key={student.id}
                                onClick={() => selectStudent(student)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="font-medium text-gray-800">
                                  {student.firstName} {student.lastName}
                                </div>
                                {student.email && (
                                  <div className="text-sm text-gray-500">{student.email}</div>
                                )}
                                {student.studentId && (
                                  <div className="text-xs text-blue-600">ID: {student.studentId}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Auto suggestions from student database
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Card Number</label>
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({...formData, cardNumber: e.target.value.toUpperCase()})}
                        placeholder="CARD-XXX"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Class Details Section */}
                <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    Class Details
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Level</label>
                      <div className="relative">
                        <select
                          value={formData.level}
                          onChange={(e) => setFormData({...formData, level: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-200 appearance-none"
                        >
                          {levels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Room</label>
                      <input
                        type="text"
                        value={formData.room}
                        onChange={(e) => setFormData({...formData, room: e.target.value})}
                        placeholder="Room number"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Duration</label>
                      <div className="relative">
                        <select
                          value={formData.duration}
                          onChange={(e) => setFormData({...formData, duration: e.target.value})}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-gray-900 bg-white shadow-sm transition-all duration-200 appearance-none"
                        >
                          {durations.map(duration => (
                            <option key={duration} value={duration}>{duration}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                          <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Sessions Section */}
                <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    Schedule Sessions
                  </h3>
                  
                  <div className="space-y-4">
                    {scheduleSlots.map((slot, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-purple-200 transition-all duration-200 shadow-sm">
                        <div className="grid grid-cols-4 gap-4 items-end">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Day</label>
                            <div className="relative">
                              <select
                                value={slot.day}
                                onChange={(e) => {
                                  const newSlots = [...scheduleSlots];
                                  newSlots[index].day = e.target.value;
                                  setScheduleSlots(newSlots);
                                  if (index === 0) {
                                    setFormData({...formData, day: e.target.value});
                                  }
                                }}
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-3 focus:ring-purple-500/30 focus:border-purple-500 text-gray-900 bg-white text-sm transition-all duration-200 appearance-none"
                              >
                                {days.map(day => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</label>
                            <input
                              type="time"
                              value={slot.time}
                              onChange={(e) => {
                                const newSlots = [...scheduleSlots];
                                newSlots[index].time = e.target.value;
                                setScheduleSlots(newSlots);
                                if (index === 0) {
                                  setFormData({...formData, time: e.target.value});
                                }
                              }}
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-3 focus:ring-purple-500/30 focus:border-purple-500 text-gray-900 bg-white text-sm transition-all duration-200"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</label>
                            <input
                              type="date"
                              value={slot.date}
                              onChange={(e) => {
                                const newSlots = [...scheduleSlots];
                                newSlots[index].date = e.target.value;
                                setScheduleSlots(newSlots);
                                if (index === 0) {
                                  setFormData({...formData, startDate: e.target.value});
                                }
                              }}
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-3 focus:ring-purple-500/30 focus:border-purple-500 text-gray-900 bg-white text-sm transition-all duration-200"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Lesson #</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={slot.lessonNumber}
                                onChange={(e) => {
                                  const newSlots = [...scheduleSlots];
                                  newSlots[index].lessonNumber = parseInt(e.target.value) || 1;
                                  setScheduleSlots(newSlots);
                                  if (index === 0) {
                                    setFormData({...formData, currentLessonNumber: parseInt(e.target.value) || 1});
                                  }
                                }}
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-3 focus:ring-purple-500/30 focus:border-purple-500 text-gray-900 bg-white text-sm transition-all duration-200"
                                required
                              />
                              
                              {index === scheduleSlots.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const lastLessonNumber = Math.max(...scheduleSlots.map(s => s.lessonNumber));
                                    setScheduleSlots([...scheduleSlots, { 
                                      day: 'Monday', 
                                      time: '09:00', 
                                      date: new Date().toISOString().split('T')[0],
                                      lessonNumber: lastLessonNumber + 1
                                    }]);
                                  }}
                                  className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 rounded-lg transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105"
                                  title="Add another schedule"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                              
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSlots = scheduleSlots.filter((_, i) => i !== index);
                                    setScheduleSlots(newSlots);
                                  }}
                                  className="p-2 bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 rounded-lg transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-105"
                                  title="Remove this schedule"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Schedule Preview (2/5 width) */}
              <div className="xl:col-span-2">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 sticky top-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    Schedule Preview
                  </h3>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {previewSchedules.map((preview, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white text-sm font-bold flex items-center justify-center">
                              #{preview.session}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{preview.date}</div>
                              <div className="text-gray-600 text-sm">{preview.day}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-800">{preview.time}</div>
                            <div className="text-gray-600 text-sm">{preview.duration}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {previewSchedules.length === 0 && (
                      <div className="text-center text-gray-500 py-12">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No sessions scheduled</p>
                        <p className="text-sm">Add schedule sessions to see preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl hover:from-blue-700 hover:to-purple-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                {isSubmitting ? 'Adding...' : 'Add Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const { teachers: realtimeTeachers, loading: realtimeLoading, error: realtimeError } = useRealtimeTeachers();
  const { students: realtimeStudents } = useRealtimeStudents();
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeacherSchedule | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const [modalState, setModalState] = useState<ModalState>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Google Sheets integration states
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [googleSheetId, setGoogleSheetId] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Handle client-side hydration and load Google Sheets config
  useEffect(() => {
    setIsHydrated(true);
    const savedSheetId = localStorage.getItem('googleSheetId') || "";
    console.log('Loading saved Google Sheet ID:', savedSheetId);
    setGoogleSheetId(savedSheetId);
  }, []);

  // Cleanup old schedules automatically
  const cleanupOldSchedules = async (showUserFeedback = false) => {
    try {
      const snapshot = await getDocs(collection(firestore, 'schedules'));
      const currentDate = new Date();
      const cleanupDays = 30; // You can adjust this value (30 days retention)
      const cutoffDate = new Date(currentDate.getTime() - (cleanupDays * 24 * 60 * 60 * 1000));
      
      const schedulesToDelete: string[] = [];
      let totalSchedules = 0;
      let oldSchedules = 0;
      let inactiveSchedules = 0;
      
      snapshot.docs.forEach((doc: any) => {
        totalSchedules++;
        const scheduleData = doc.data() as TeacherSchedule;
        let shouldDelete = false;
        
        // Check for old schedules by date
        if (scheduleData.startDate) {
          const scheduleDate = new Date(scheduleData.startDate);
          
          if (!isNaN(scheduleDate.getTime()) && scheduleDate < cutoffDate) {
            shouldDelete = true;
            oldSchedules++;
          }
        }
        
        // Check for explicitly inactive schedules
        if (scheduleData.isActive === false) {
          shouldDelete = true;
          inactiveSchedules++;
        }
        
        // Check for completed schedules (when current lesson equals max lessons)
        if (scheduleData.currentLessonNumber >= scheduleData.maxLessons && scheduleData.maxLessons > 0) {
          const scheduleDate = new Date(scheduleData.startDate);
          // Only delete completed schedules if they're also older than 7 days
          if (!isNaN(scheduleDate.getTime()) && scheduleDate < new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000))) {
            shouldDelete = true;
          }
        }
        
        if (shouldDelete) {
          schedulesToDelete.push(doc.id);
        }
      });

      // Delete old schedules if any found
      if (schedulesToDelete.length > 0) {
        console.log(`🗑️ Database Cleanup: Found ${schedulesToDelete.length} schedules to remove:`);
        console.log(`   • ${oldSchedules} schedules older than ${cleanupDays} days`);
        console.log(`   • ${inactiveSchedules} inactive schedules`);
        console.log(`   • Out of ${totalSchedules} total schedules`);
        
        const deletePromises = schedulesToDelete.map(scheduleId => 
          deleteDoc(doc(firestore, 'schedules', scheduleId))
        );
        
        await Promise.all(deletePromises);
        console.log(`✅ Database Cleanup Complete: Successfully removed ${schedulesToDelete.length} schedules`);
        console.log(`📊 Database Status: ${totalSchedules - schedulesToDelete.length} active schedules remaining`);
        
        // Show user feedback only if requested (manual cleanup)
        if (showUserFeedback) {
          alert(`🗑️ Database cleaned! Removed ${schedulesToDelete.length} old/inactive schedules.`);
        }
      } else {
        console.log(`📊 Database Status: ${totalSchedules} schedules found, no cleanup needed`);
        if (showUserFeedback) {
          alert(`✅ Database is clean! No old schedules found to remove.`);
        }
      }
    } catch (error) {
      console.error('❌ Database Cleanup Error:', error);
      if (showUserFeedback) {
        alert('❌ Error during database cleanup. Check console for details.');
      }
    }
  };

  // Google Sheets integration functions
  // SMART SYNC: FROM Google Sheets TO Web App - Updates existing data OR creates new teachers when database is empty
  const syncWithGoogleSheets = useCallback(async (showAlert = true) => {
    if (!googleSheetId.trim()) {
      if (showAlert) {
        showModal('warning', 'Configuration Required', 'Please configure your Google Sheet ID first.');
        setIsGoogleSheetsModalOpen(true);
      }
      return;
    }

    try {
      // Fetch data from Google Sheets
      const response = await fetch(`/api/teachers/google-sheets?sheetId=${googleSheetId}`);
      const data = await response.json();

      if (response.ok && data.teachers) {
        console.log('Fetched', data.teachers.length, 'teachers from Google Sheets');
        
        // Get the most current teachers list from the real-time hook
        const currentTeachers = realtimeTeachers || [];
        console.log('Current teachers in app:', currentTeachers.length);
        
        // SMART MODE: If database is empty, create new teachers. Otherwise, update existing ones.
        const isEmptyDatabase = currentTeachers.length === 0;
        console.log(`Database empty: ${isEmptyDatabase}, switching to ${isEmptyDatabase ? 'CREATE' : 'UPDATE'} mode`);
        
        const existingUpdates = [];
        const newTeachers = [];
        
        for (const teacherData of data.teachers) {
          // Skip if missing required fields
          if (!teacherData.firstName || !teacherData.lastName) {
            console.warn('Skipping teacher with missing required fields:', teacherData);
            continue;
          }
          
          if (isEmptyDatabase) {
            // CREATE MODE: Add all teachers from sheet
            newTeachers.push(teacherData);
          } else {
            // UPDATE MODE: Find existing teacher and update
            const existingTeacher = currentTeachers.find(t => 
              t.email === teacherData.email ||
              (t.firstName === teacherData.firstName && t.lastName === teacherData.lastName)
            );
            
            if (existingTeacher) {
              existingUpdates.push({
                id: existingTeacher.id,
                data: teacherData
              });
            } else {
              // New teacher not in database
              newTeachers.push(teacherData);
            }
          }
        }

        // Execute database operations
        let createCount = 0;
        let updateCount = 0;

        // Create new teachers
        for (const teacherData of newTeachers) {
          try {
            await addDoc(collection(firestore, 'teachers'), {
              firstName: teacherData.firstName,
              lastName: teacherData.lastName,
              email: teacherData.email,
              phone: teacherData.phone || '',
              instrument: teacherData.instrument || '',
              address: teacherData.address || '',
              dateOfBirth: teacherData.dateOfBirth || '',
              zipCode: teacherData.zipCode || '',
              tinNumber: teacherData.tinNumber || '',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            createCount++;
          } catch (error) {
            console.error('Error creating teacher:', error);
          }
        }

        // Update existing teachers
        for (const update of existingUpdates) {
          try {
            await updateDoc(doc(firestore, 'teachers', update.id!), {
              firstName: update.data.firstName,
              lastName: update.data.lastName,
              email: update.data.email,
              phone: update.data.phone || '',
              instrument: update.data.instrument || '',
              address: update.data.address || '',
              dateOfBirth: update.data.dateOfBirth || '',
              zipCode: update.data.zipCode || '',
              tinNumber: update.data.tinNumber || '',
              updatedAt: new Date()
            });
            updateCount++;
          } catch (error) {
            console.error('Error updating teacher:', error);
          }
        }

        if (showAlert) {
          showModal('success', 'Sync Complete', 
            `Successfully synced from Google Sheets!\n\n` +
            `✅ Created: ${createCount} teachers\n` +
            `🔄 Updated: ${updateCount} teachers\n\n` +
            `Mode: ${isEmptyDatabase ? 'CREATE (empty database)' : 'UPDATE (existing data)'}`
          );
        }
        
      } else {
        throw new Error(data.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error syncing with Google Sheets:', error);
      if (showAlert) {
        showModal('error', 'Sync Failed', 'Failed to sync with Google Sheets. Please check your Sheet ID and try again.');
      }
    }
  }, [googleSheetId, realtimeTeachers]);

  // Load schedules
  const loadSchedules = async () => {
    try {
      setSchedulesLoading(true);
      
      // Load current schedules
      const snapshot = await getDocs(collection(firestore, 'schedules'));
      const schedulesData = snapshot.docs.map((doc: any) => ({
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
    const initializeSchedules = async () => {
      // Check if we need to run automatic cleanup (once per day)
      const lastCleanup = localStorage.getItem('lastScheduleCleanup');
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (!lastCleanup || (now - parseInt(lastCleanup)) > oneDayInMs) {
        console.log('🧹 Running automatic database cleanup...');
        await cleanupOldSchedules();
        localStorage.setItem('lastScheduleCleanup', now.toString());
      }
      
      // Load schedules
      await loadSchedules();
    };
    
    initializeSchedules();
  }, []);

  const showModal = useCallback((type: ModalState['type'], title: string, message: string) => {
    setModalState({ show: true, type, title, message });
  }, []);

  // Event listeners for custom modal events from ScheduleModal
  useEffect(() => {
    const handleSuccessModal = (event: any) => {
      const { title, message } = event.detail;
      showModal('success', title, message);
    };

    const handleErrorModal = (event: any) => {
      const { title, message } = event.detail;
      showModal('error', title, message);
    };

    window.addEventListener('showSuccessModal', handleSuccessModal);
    window.addEventListener('showErrorModal', handleErrorModal);

    return () => {
      window.removeEventListener('showSuccessModal', handleSuccessModal);
      window.removeEventListener('showErrorModal', handleErrorModal);
    };
  }, [showModal]);

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, show: false }));
  }, []);

  const getTeacherSchedule = (teacherId: string) => {
    return schedules.filter(schedule => schedule.teacherId === teacherId);
  };

  // Pagination calculations
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSchedules = schedules.slice(startIndex, endIndex);

  // Page change handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to schedules section
    const schedulesSection = document.getElementById('schedules-overview');
    if (schedulesSection) {
      schedulesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  // Reset pagination when schedules data changes
  useEffect(() => {
    if (schedules.length > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [schedules.length, currentPage, totalPages]);

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
      await deleteDoc(doc(firestore, 'schedules', scheduleId));
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
        await updateDoc(doc(firestore, 'schedules', editingSchedule.id), scheduleData);
        showModal('success', 'Success', 'Schedule updated successfully!');
        setIsScheduleModalOpen(false);
        setEditingSchedule(null);
      } else {
        await addDoc(collection(firestore, 'schedules'), {
          ...scheduleData,
          teacherId: selectedTeacher?.id || scheduleData.teacherId
        });
      }
      
      await loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      showModal('error', 'Error', 'Failed to save schedule');
      throw error; // Re-throw to handle in the modal
    }
  };

  const incrementLessonNumber = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || schedule.currentLessonNumber >= schedule.maxLessons) return;

    try {
      await updateDoc(doc(firestore, 'schedules', scheduleId), {
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
      await updateDoc(doc(firestore, 'schedules', scheduleId), {
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
                onClick={() => syncWithGoogleSheets()}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                title="Sync teachers from Google Sheets"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Sheets
              </button>
              <button
                onClick={() => setIsGoogleSheetsModalOpen(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                title="Configure Google Sheets integration"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Setup
              </button>
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
          
          {/* Database Maintenance */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span>🗄️ Database: Auto-cleanup keeps schedules for 30 days</span>
            </div>
            <button
              onClick={async () => {
                const confirmCleanup = confirm('🗑️ This will remove schedules older than 30 days and inactive schedules. Continue?');
                if (confirmCleanup) {
                  await cleanupOldSchedules(true); // Show user feedback for manual cleanup
                  await loadSchedules(); // Reload to reflect changes
                }
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Clean up schedules older than 30 days"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clean Now
            </button>
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
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this teacher? This will also delete all their schedules.')) {
                              try {
                                // Delete teacher's schedules first
                                const teacherSchedules = getTeacherSchedule(teacher.id || '');
                                const deleteSchedulePromises = teacherSchedules.map(schedule => 
                                  deleteDoc(doc(firestore, 'schedules', schedule.id))
                                );
                                await Promise.all(deleteSchedulePromises);
                                
                                // Then delete the teacher
                                await deleteDoc(doc(firestore, 'teachers', teacher.id!));
                                showModal('success', 'Success', 'Teacher and their schedules deleted successfully!');
                              } catch (error) {
                                console.error('Error deleting teacher:', error);
                                showModal('error', 'Error', 'Failed to delete teacher. Please try again.');
                              }
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
        <div id="schedules-overview" className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
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
              {paginatedSchedules.map(schedule => {
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
            {schedules.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/50">
                <div className="text-sm text-slate-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, schedules.length)} of {schedules.length} schedules
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </div>
                {totalPages > 1 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
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
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === page
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                  : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === currentPage - 2 || page === currentPage + 2) &&
                          totalPages > 5
                        ) {
                          return (
                            <span key={page} className="px-2 text-slate-400">
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
                      className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    All schedules shown on one page
                  </div>
                )}
              </div>
            )}
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
            onSave={async (teacher) => {
              try {
                if (editingTeacher) {
                  // Update existing teacher using API (this will handle both Firebase and Google Sheets)
                  const response = await fetch('/api/teachers', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      ...teacher,
                      id: editingTeacher.id,
                      googleSheetId: googleSheetId.trim() || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4'
                    }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update teacher');
                  }

                  showModal('success', 'Success', 'Teacher updated successfully in both Firebase and Google Sheets!');
                } else {
                  // Add new teacher using API (this will handle both Firebase and Google Sheets)
                  const response = await fetch('/api/teachers', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      ...teacher,
                      googleSheetId: googleSheetId.trim() || '18N0O0vHScnDbuqpX4yYbUznttsf4wcjyYgdBjHWhQg4'
                    }),
                  });

                  if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Teacher saved successfully to both Firebase and Google Sheets:', result);
                    showModal('success', 'Success', 'Teacher added successfully to both database and Google Sheets!');
                  } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to save teacher');
                  }
                }
                setIsModalOpen(false);
                setEditingTeacher(null);
              } catch (error) {
                console.error('Error saving teacher:', error);
                showModal('error', 'Error', 'Failed to save teacher. Please try again.');
              }
            }}
          />
        )}

        {isScheduleModalOpen && (
          <ScheduleModal
            schedule={editingSchedule}
            teachers={realtimeTeachers}
            students={realtimeStudents || []}
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

        {/* Google Sheets Configuration Modal */}
        {isGoogleSheetsModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-out scale-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Google Sheets Setup</h3>
                      <p className="text-sm text-gray-600">Configure teachers data sync</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsGoogleSheetsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Google Sheet ID *
                    </label>
                    <input
                      type="text"
                      value={googleSheetId}
                      onChange={(e) => setGoogleSheetId(e.target.value)}
                      placeholder="Enter your Google Sheet ID"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Find this in your Google Sheets URL: /spreadsheets/d/<strong>SHEET_ID</strong>/edit
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-800 mb-2">📋 Sheet Requirements:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Must have a "TEACHERS" tab (will be created automatically)</li>
                      <li>• Columns: Call Name | Full Name | Date of Birth | Age | Contact | Email | Address | Zip | TIN | Instruments</li>
                      <li>• Make sheet publicly viewable</li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsGoogleSheetsModalOpen(false)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (googleSheetId.trim()) {
                          localStorage.setItem('googleSheetId', googleSheetId.trim());
                          setIsGoogleSheetsModalOpen(false);
                          showModal('success', 'Configuration Saved', 'Google Sheets integration configured successfully!');
                        } else {
                          showModal('warning', 'Invalid Input', 'Please enter a valid Google Sheet ID.');
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      Save Config
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}