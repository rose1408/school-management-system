"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle2, XCircle, AlertTriangle, Info, Printer } from "lucide-react";
import { useRealtimeTeachers } from "@/hooks/useRealtimeTeachers";
import { Teacher } from "@/lib/db";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types for the advanced system
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
    address: teacher?.address || ''
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

  const levels = ["Preparatory", "Primary", "Intermediate", "Advance"];
  const durations = ["30 min", "45 min", "60 min", "90 min", "120 min"];

  const selectedTeacher = teachers.find(t => t.id === formData.teacherId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
                  <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrument</label>
              <input
                type="text"
                value={formData.instrument}
                onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                placeholder="Enter instrument"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
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
  const [teacherFilter, setTeacherFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const schedulesPerPage = 12;

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
    };
    return colors[instrument] || 'bg-gray-400';
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Simple phone formatting - you can enhance this as needed
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  // Filter teachers based on search
  const filteredTeachers = realtimeTeachers.filter(teacher => 
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(teacherFilter.toLowerCase()) ||
    teacher.instrument.toLowerCase().includes(teacherFilter.toLowerCase())
  );

  // Get all schedules with teacher info for the schedules section
  const schedulesWithTeacherInfo = schedules.map(schedule => {
    const teacher = realtimeTeachers.find(t => t.id === schedule.teacherId);
    return {
      ...schedule,
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher',
      teacherInstrument: teacher?.instrument || 'Unknown'
    };
  });

  // Filter schedules based on search
  const filteredSchedules = schedulesWithTeacherInfo.filter(schedule => 
    schedule.studentName.toLowerCase().includes(teacherFilter.toLowerCase()) ||
    schedule.teacherName.toLowerCase().includes(teacherFilter.toLowerCase()) ||
    schedule.teacherInstrument.toLowerCase().includes(teacherFilter.toLowerCase()) ||
    schedule.day.toLowerCase().includes(teacherFilter.toLowerCase())
  );

  // Pagination for schedules
  const totalPages = Math.ceil(filteredSchedules.length / schedulesPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * schedulesPerPage,
    currentPage * schedulesPerPage
  );

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
                  Teachers Management
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Comprehensive teacher and schedule management system
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setEditingTeacher(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-3 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add New Teacher
            </button>
          </div>
        </div>

        {/* Clean Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {realtimeTeachers.length}
                </div>
                <div className="text-gray-600 font-medium">Total Teachers</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {realtimeTeachers.filter(t => getTeacherSchedule(t.id || '').length > 0).length}
                </div>
                <div className="text-gray-600 font-medium">Active Teachers</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {schedules.length}
                </div>
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
                <div className="text-3xl font-bold text-purple-500 mb-2">
                  {[...new Set(realtimeTeachers.map(t => t.instrument))].length}
                </div>
                <div className="text-gray-600 font-medium">Instruments</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Teachers Directory */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="p-8 border-b border-slate-200/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Teachers Directory
            </h2>
            <p className="text-slate-600 mt-2">Manage and view all registered music teachers</p>
          </div>
          
          <div className="p-8">
            {realtimeTeachers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.197m3-2.197a4 4 0 105-5.592M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.197m3-2.197a4 4 0 105-5.592" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first teacher.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Add First Teacher
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher) => {
                  const instrumentColor = getInstrumentColor(teacher.instrument);
                  const teacherSchedule = getTeacherSchedule(teacher.id || '');
                  const hasActiveSchedule = teacherSchedule.length > 0;
                  
                  return (
                    <div 
                      key={teacher.id} 
                      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      {/* Clean Card Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 ${instrumentColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                            {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {teacher.firstName} {teacher.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {teacher.instrument} Instructor
                            </p>
                          </div>
                        </div>

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
                            <span className="text-gray-700">
                              {hasActiveSchedule ? `${teacherSchedule.length} scheduled` : '0 scheduled'}
                            </span>
                          </div>
                        </div>

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
                        
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Clean Search Filter */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Search Schedules
                </label>
                <p className="text-xs text-gray-500">Filter by student, teacher, instrument, or day</p>
              </div>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search schedules, teachers, students..."
                value={teacherFilter}
                onChange={(e) => {
                  setTeacherFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 font-medium shadow-sm"
              />
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
                  {filteredSchedules.length} of {schedulesWithTeacherInfo.length} schedules 
                  {teacherFilter && ` matching "${teacherFilter}"`}
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
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  {teacherFilter ? 'No schedules match your search' : 'No schedules found'}
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  {teacherFilter 
                    ? 'Try adjusting your search terms or clear the filter to see all schedules.' 
                    : 'Add some schedules to see them displayed here with pagination.'
                  }
                </p>
                {teacherFilter && (
                  <button
                    onClick={() => setTeacherFilter('')}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Clean Schedule Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
                  {paginatedSchedules.map((schedule) => {
                    const instrumentColor = getInstrumentColor(schedule.teacherInstrument);
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
                              {schedule.studentName}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs">
                              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-gray-600">{schedule.teacherName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs">
                              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l6 6V5" />
                              </svg>
                              <span className="text-gray-600">{schedule.teacherInstrument}</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    // Find the full schedule object from schedules array
                                    const fullSchedule = schedules.find(s => s.id === schedule.id);
                                    if (fullSchedule) {
                                      setEditingSchedule(fullSchedule);
                                      setIsScheduleModalOpen(true);
                                    }
                                  }}
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

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/50">
                    <div className="text-sm text-slate-600">
                      Showing {((currentPage - 1) * schedulesPerPage) + 1} to {Math.min(currentPage * schedulesPerPage, filteredSchedules.length)} of {filteredSchedules.length} schedules
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let page;
                          if (totalPages <= 7) {
                            page = i + 1;
                          } else if (currentPage <= 4) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            page = totalPages - 6 + i;
                          } else {
                            page = currentPage - 3 + i;
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === page 
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                                  : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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