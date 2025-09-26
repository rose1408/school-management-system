"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DebugSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔍 Loading all data...');
      
      // Load schedules
      const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
      const schedulesData = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Load teachers
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const teachersData = teachersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSchedules(schedulesData);
      setTeachers(teachersData);
      setError(null);
      
      console.log('✅ Schedules loaded:', schedulesData);
      console.log('✅ Teachers loaded:', teachersData);
      
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const findTeacherMatches = () => {
    const matches: any[] = [];
    
    schedules.forEach(schedule => {
      const matchingTeacher = teachers.find(teacher => 
        teacher.id === schedule.teacherId ||
        `${teacher.firstName} ${teacher.lastName}`.toLowerCase() === schedule.teacherName?.toLowerCase()
      );
      
      matches.push({
        schedule,
        matchingTeacher,
        hasMatch: !!matchingTeacher
      });
    });
    
    return matches;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>🔍 Loading Debug Data...</h1>
        <div>Loading schedules and teachers from Firebase...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: 'red' }}>
        <h1>❌ Error</h1>
        <div>Error: {error}</div>
        <button onClick={loadData} style={{ marginTop: '10px', padding: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  const matches = findTeacherMatches();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
      <h1>🐛 Schedule Debug Page</h1>
      <p>This page shows raw data from Firebase to debug the schedule display issue.</p>
      
      <div style={{ marginBottom: '30px' }}>
        <button onClick={loadData} style={{ padding: '10px 20px', backgroundColor: '#007cba', color: 'white', border: 'none', borderRadius: '5px' }}>
          🔄 Reload Data
        </button>
      </div>

      <section style={{ marginBottom: '40px' }}>
        <h2>📊 Summary</h2>
        <ul>
          <li><strong>Total Schedules:</strong> {schedules.length}</li>
          <li><strong>Total Teachers:</strong> {teachers.length}</li>
          <li><strong>Schedules with Matching Teachers:</strong> {matches.filter(m => m.hasMatch).length}</li>
        </ul>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>👥 Teachers</h2>
        {teachers.length === 0 ? (
          <p>No teachers found</p>
        ) : (
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            {teachers.map((teacher, index) => (
              <div key={teacher.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                <strong>Teacher {index + 1}:</strong><br/>
                <strong>ID:</strong> {teacher.id}<br/>
                <strong>Name:</strong> {teacher.firstName} {teacher.lastName}<br/>
                <strong>Instrument:</strong> {teacher.instrument}<br/>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>📅 Schedules</h2>
        {schedules.length === 0 ? (
          <p>No schedules found</p>
        ) : (
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            {schedules.map((schedule, index) => (
              <div key={schedule.id} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
                <strong>Schedule {index + 1}:</strong><br/>
                <strong>ID:</strong> {schedule.id}<br/>
                <strong>Teacher ID:</strong> {schedule.teacherId}<br/>
                <strong>Teacher Name:</strong> {schedule.teacherName}<br/>
                <strong>Student:</strong> {schedule.studentName}<br/>
                <strong>Card Number:</strong> {schedule.studentCardNumber}<br/>
                <strong>Day:</strong> {schedule.day}<br/>
                <strong>Time:</strong> {schedule.time}<br/>
                <strong>Instrument:</strong> {schedule.instrument}<br/>
                <strong>Duration:</strong> {schedule.duration}<br/>
                <strong>Level:</strong> {schedule.level}<br/>
                <strong>Room:</strong> {schedule.room}<br/>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>🔗 Schedule-Teacher Matching</h2>
        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          {matches.map((match, index) => (
            <div key={index} style={{ 
              marginBottom: '15px', 
              paddingBottom: '15px', 
              borderBottom: '1px solid #ddd',
              backgroundColor: match.hasMatch ? '#e8f5e8' : '#ffe8e8',
              padding: '10px',
              borderRadius: '3px'
            }}>
              <strong>Schedule {index + 1}: {match.hasMatch ? '✅ MATCHED' : '❌ NO MATCH'}</strong><br/>
              <strong>Schedule Teacher ID:</strong> {match.schedule.teacherId}<br/>
              <strong>Schedule Teacher Name:</strong> {match.schedule.teacherName}<br/>
              <strong>Student:</strong> {match.schedule.studentName}<br/>
              {match.matchingTeacher ? (
                <>
                  <strong>Matched Teacher:</strong> {match.matchingTeacher.firstName} {match.matchingTeacher.lastName} (ID: {match.matchingTeacher.id})<br/>
                </>
              ) : (
                <strong style={{ color: 'red' }}>No matching teacher found!</strong>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}