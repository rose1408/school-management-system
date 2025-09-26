"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, User, Calendar, Phone, Music, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { useRealtimeTeachers } from "@/hooks/useRealtimeTeachers";
import { useRealtimeSchedules } from "@/hooks/useRealtimeSchedules";
import { Teacher } from "@/lib/db";

// Format phone number to Philippine format
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different Philippine number formats
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    // Mobile: 09XX XXX XXXX
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
    // Mobile without 0: 9XX XXX XXXX -> +63 9XX XXX XXXX
    return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('63')) {
    // International format: 639XXXXXXXXX -> +63 9XX XXX XXXX
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  } else if (cleaned.length === 7) {
    // Landline: XXX XXXX
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  } else if (cleaned.length === 8) {
    // Metro Manila landline: XXXX XXXX
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  } else {
    // Return as is if format is unrecognized
    return phone;
  }
};

// Format phone number input in real-time (for form input)
const formatPhoneNumberInput = (value: string): string => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 11 digits for Philippine mobile numbers
  const limited = cleaned.slice(0, 11);
  
  // Format as user types
  if (limited.length >= 4) {
    if (limited.startsWith('09')) {
      // Format as: 09XX XXX XXXX
      if (limited.length <= 4) {
        return limited;
      } else if (limited.length <= 7) {
        return `${limited.slice(0, 4)} ${limited.slice(4)}`;
      } else {
        return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`;
      }
    }
  }
  
  // For other patterns, return the cleaned number
  return limited;
};

export default function TeachersPage() {
  const { teachers: realtimeTeachers, loading: realtimeLoading, error: realtimeError } = useRealtimeTeachers();
  const { schedules, loading: schedulesLoading, error: schedulesError } = useRealtimeSchedules();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const schedulesPerPage = 15;
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Reset pagination when teacher selection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeacher]);

  // Mock modal system
  const [modalState, setModalState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showModal = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
    setModalState({ show: true, type, title, message, onConfirm });
  }, []);

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setIsModalOpen(true);
  };

  const handleAddSchedule = () => {
    setIsScheduleModalOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDeleteTeacher = useCallback((id: string) => {
    showModal(
      'warning',
      'Delete Teacher',
      'Are you sure you want to delete this teacher? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`/api/teachers?id=${id}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete teacher');
          }
        } catch (error) {
          console.error('Error deleting teacher:', error);
          showModal('error', 'Delete Failed', 'An error occurred while deleting the teacher. Please try again.');
        }
      }
    );
  }, [showModal]);

  const getTeacherSchedule = (teacherId: string) => {
    return schedules.filter(schedule => schedule.teacherId === teacherId);
  };

  // Loading and error states
  if (realtimeLoading || schedulesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading {realtimeLoading ? 'teachers' : ''}
            {realtimeLoading && schedulesLoading ? ' and ' : ''}
            {schedulesLoading ? 'schedules' : ''}...
          </p>
        </div>
      </div>
    );
  }

  if (realtimeError || schedulesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading data</div>
          <p className="text-gray-600">{realtimeError || schedulesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/50 rounded-lg transition-colors">
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Teachers Management</h1>
              <p className="text-gray-600">Manage teacher profiles and their schedules</p>
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

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {realtimeTeachers.map(teacher => (
            <div key={teacher.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{teacher.firstName} {teacher.lastName}</h3>
                    <p className="text-sm text-gray-600">{teacher.email}</p>
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
                    onClick={() => handleDeleteTeacher(teacher.id!)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {teacher.instrument && (
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-700">{teacher.instrument}</span>
                  </div>
                )}
                
                {teacher.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-700">{formatPhoneNumber(teacher.phone)}</span>
                  </div>
                )}

                {/* Schedule Summary */}
                <div className="text-xs text-gray-500">
                  Classes: {getTeacherSchedule(teacher.id || '').length} scheduled
                </div>
              </div>

              <button
                onClick={() => setSelectedTeacher(teacher)}
                className="w-full px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
              >
                View Schedule
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {realtimeTeachers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Teachers Yet</h3>
            <p className="text-gray-600 mb-6">Start by adding your first teacher to the system.</p>
            <button
              onClick={handleAddTeacher}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              Add First Teacher
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">{realtimeTeachers.length}</div>
            <div className="text-gray-600">Total Teachers</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{schedules.length}</div>
            <div className="text-gray-600">Total Classes</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {realtimeTeachers.filter(t => getTeacherSchedule(t.id || '').length > 0).length}
            </div>
            <div className="text-gray-600">Active Teachers</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {new Set(realtimeTeachers.map(t => t.instrument).filter(Boolean)).size}
            </div>
            <div className="text-gray-600">Instruments</div>
          </div>
        </div>
      </div>

      {/* Teacher Modal */}
      {isModalOpen && (
        <TeacherModal
          teacher={editingTeacher}
          onClose={() => setIsModalOpen(false)}
          onSave={async (teacherData) => {
            try {
              if (editingTeacher) {
                // Update existing teacher
                const response = await fetch('/api/teachers', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: editingTeacher.id,
                    ...teacherData
                  })
                });
                if (!response.ok) throw new Error('Failed to update teacher');
              } else {
                // Create new teacher
                const response = await fetch('/api/teachers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(teacherData)
                });
                if (!response.ok) throw new Error('Failed to create teacher');
              }
              setIsModalOpen(false);
              showModal('success', 'Success', `Teacher ${editingTeacher ? 'updated' : 'created'} successfully!`);
            } catch (error) {
              console.error('Error saving teacher:', error);
              showModal('error', 'Error', `Failed to ${editingTeacher ? 'update' : 'create'} teacher. Please try again.`);
            }
          }}
        />
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <ScheduleModal
          teachers={realtimeTeachers}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={async (scheduleData) => {
            try {
              console.log('🚀 Client: Sending schedule data:', scheduleData);
              
              // Create new schedule
              const response = await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
              });
              
              const responseData = await response.json();
              console.log('📥 Client: API response:', responseData);
              
              if (!response.ok) {
                const errorMessage = responseData?.details || responseData?.error || 'Failed to create schedule';
                throw new Error(errorMessage);
              }
              
              setIsScheduleModalOpen(false);
              showModal('success', 'Success', 'Schedule created successfully!');
            } catch (error) {
              console.error('❌ Client: Error saving schedule:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to create schedule. Please try again.';
              showModal('error', 'Error', `Schedule creation failed: ${errorMessage}`);
            }
          }}
        />
      )}

      {/* Teacher Schedule Display - Inline */}
      {selectedTeacher && (
        <div className="mt-8 bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedTeacher.firstName} {selectedTeacher.lastName}&apos;s Schedule
                </h2>
                <p className="text-gray-600">{selectedTeacher.instrument}</p>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {(() => {
              const schedules = getTeacherSchedule(selectedTeacher.id || '');
              const totalPages = Math.ceil(schedules.length / schedulesPerPage);
              const startIndex = (currentPage - 1) * schedulesPerPage;
              const paginatedSchedules = schedules.slice(startIndex, startIndex + schedulesPerPage);
              
              return (
                <>
                  {paginatedSchedules.length > 0 ? (
                    <div className="space-y-4">
                      {paginatedSchedules.map((schedule) => (
                        <div key={schedule.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-800">Student</h4>
                              <p className="text-gray-600">{schedule.studentName}</p>
                              <p className="text-xs text-gray-500">Card: {schedule.studentCardNumber}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">Day & Time</h4>
                              <p className="text-gray-600">{schedule.day} at {schedule.time}</p>
                              <p className="text-xs text-gray-500">{schedule.duration} minutes</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">Lesson Details</h4>
                              <p className="text-gray-600">{schedule.instrument}</p>
                              <p className="text-xs text-gray-500">Lesson #{schedule.lessonNumber}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">Room</h4>
                              <p className="text-gray-600">{schedule.room || 'Not specified'}</p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {schedule.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {schedule.startDate && `Started: ${new Date(schedule.startDate).toLocaleDateString()}`}
                            </span>
                            <span>
                              Level: {schedule.level}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <Calendar className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-600">No schedules found for this teacher</p>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-2 text-sm rounded-md ${
                              currentPage === i + 1
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      
                      <span className="text-sm text-gray-600 ml-4">
                        Page {currentPage} of {totalPages} ({schedules.length} total schedules)
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modern Modal System */}
      {modalState.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-out scale-100">
            <div className="p-6 text-center">
              {/* Icon based on type */}
              <div className="mb-4">
                {modalState.type === 'success' && (
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                )}
                {modalState.type === 'error' && (
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                )}
                {modalState.type === 'warning' && (
                  <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                )}
                {modalState.type === 'info' && (
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Info className="w-8 h-8 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Title and Message */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{modalState.title}</h3>
              <p className="text-gray-600 mb-6">{modalState.message}</p>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                {modalState.onConfirm && (
                  <>
                    <button
                      onClick={() => setModalState(prev => ({ ...prev, show: false }))}
                      className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        modalState.onConfirm!();
                        setModalState(prev => ({ ...prev, show: false }));
                      }}
                      className="px-6 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors shadow-lg"
                    >
                      Confirm
                    </button>
                  </>
                )}
                {!modalState.onConfirm && (
                  <button
                    onClick={() => setModalState(prev => ({ ...prev, show: false }))}
                    className={`px-8 py-2.5 text-white rounded-lg font-medium transition-colors shadow-lg ${
                      modalState.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                      modalState.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                      modalState.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Schedule Modal Component
interface ScheduleData {
  teacherId: string;
  teacherName: string;
  studentName: string;
  studentCardNumber: string;
  instrument: string;
  level: string;
  day: string;
  time: string;
  duration: string;
  lessonNumber: string;
  room?: string;
  isActive?: boolean;
  startDate: string;
}

interface ScheduleModalProps {
  teachers: Teacher[];
  onClose: () => void;
  onSave: (schedule: ScheduleData) => void;
}

function ScheduleModal({ teachers, onClose, onSave }: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    teacherId: '',
    studentName: '',
    studentCardNumber: '',
    instrument: '',
    room: '',
    time: '',
    day: '',
    duration: '60',
    lessonNumber: '1',
    startDate: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find the selected teacher to get the teacher name
    const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
    const scheduleData = {
      ...formData,
      teacherName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : '',
      level: formData.instrument // Use instrument as level for now
    };
    
    onSave(scheduleData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Schedule</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="">Select a teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName} ({teacher.instrument})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                placeholder="Enter student name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Card Number *</label>
              <input
                type="text"
                value={formData.studentCardNumber}
                onChange={(e) => setFormData({...formData, studentCardNumber: e.target.value})}
                placeholder="e.g., SC001, STU123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Number *</label>
              <select
                value={formData.lessonNumber}
                onChange={(e) => setFormData({...formData, lessonNumber: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="1">Lesson 1</option>
                <option value="2">Lesson 2</option>
                <option value="3">Lesson 3</option>
                <option value="4">Lesson 4</option>
                <option value="5">Lesson 5</option>
                <option value="6">Lesson 6</option>
                <option value="7">Lesson 7</option>
                <option value="8">Lesson 8</option>
                <option value="9">Lesson 9</option>
                <option value="10">Lesson 10</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrument *</label>
              <input
                type="text"
                value={formData.instrument}
                onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                placeholder="e.g., Piano, Guitar, Violin"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room *</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
                placeholder="e.g., Room 1, Studio A"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day *</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({...formData, day: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="">Select day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active Schedule</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              Add Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Teacher Modal Component
interface TeacherModalProps {
  teacher: Teacher | null;
  onClose: () => void;
  onSave: (teacher: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

function TeacherModal({ teacher, onClose, onSave }: TeacherModalProps) {
  const [formData, setFormData] = useState({
    firstName: teacher?.firstName || '',
    lastName: teacher?.lastName || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    instrument: teacher?.instrument || '',
    address: teacher?.address || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {teacher ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                placeholder="Enter first name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                placeholder="Enter last name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="teacher@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const formatted = formatPhoneNumberInput(e.target.value);
                setFormData({...formData, phone: formatted});
              }}
              placeholder="09XX XXX XXXX"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instrument/Subject *</label>
            <input
              type="text"
              value={formData.instrument}
              onChange={(e) => setFormData({...formData, instrument: e.target.value})}
              placeholder="e.g., Piano, Guitar, Violin"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Enter complete address"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              {teacher ? 'Update Teacher' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
