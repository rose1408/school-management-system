import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db as firestore } from './firebase'

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  age?: string
  address?: string
  parentName?: string
  parentPhone?: string
  enrollmentDate: string
  studentId?: string
  status: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Teacher {
  id: string
  firstName: string
  lastName: string
  callName?: string // Teacher's Call Name
  dateOfBirth?: string
  email: string
  phone?: string // Contact Number  
  address?: string
  zipCode?: string
  tinNumber?: string // Tin #
  subject?: string
  currentLesson?: number
  maxLessons?: number
  cardNumber?: string
  lessonPlan?: string
  notes?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const STUDENTS_COLLECTION = 'students'
const TEACHERS_COLLECTION = 'teachers'

// Database operations
export const db = {
  student: {
    findMany: async (): Promise<Student[]> => {
      try {
        const q = query(
          collection(firestore, STUDENTS_COLLECTION),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        
        const students: Student[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          students.push({
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            age: data.age,
            address: data.address,
            parentName: data.parentName,
            parentPhone: data.parentPhone,
            enrollmentDate: data.enrollmentDate,
            studentId: data.studentId,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          })
        })
        
        return students
      } catch (error) {
        console.error('Error fetching students from Firebase:', error)
        throw error
      }
    },
    
    create: async (data: { data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> }) => {
      try {
        const docRef = await addDoc(collection(firestore, STUDENTS_COLLECTION), {
          ...data.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        // Return the created student with the generated ID
        const newStudent: Student = {
          id: docRef.id,
          ...data.data
        }
        
        return newStudent
      } catch (error) {
        console.error('Error creating student in Firebase:', error)
        throw error
      }
    },
    
    update: async ({ where, data }: { 
      where: { id: string }, 
      data: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>> 
    }) => {
      try {
        const docRef = doc(firestore, STUDENTS_COLLECTION, where.id)
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        })
        
        // Return updated student data
        return {
          id: where.id,
          ...data
        }
      } catch (error: unknown) {
        console.error('Error updating student in Firebase:', error)
        if (error instanceof Error && 'code' in error && error.code === 'not-found') {
          throw new Error('Student not found')
        }
        throw error
      }
    },
    
    delete: async ({ where }: { where: { id: string } }) => {
      try {
        const docRef = doc(firestore, STUDENTS_COLLECTION, where.id)
        await deleteDoc(docRef)
        
        return { id: where.id }
      } catch (error: unknown) {
        console.error('Error deleting student from Firebase:', error)
        if (error instanceof Error && 'code' in error && error.code === 'not-found') {
          throw new Error('Student not found')
        }
        throw error
      }
    }
  },
  
  teacher: {
    findMany: async (): Promise<Teacher[]> => {
      try {
        const q = query(
          collection(firestore, TEACHERS_COLLECTION),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        
        const teachers: Teacher[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          teachers.push({
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            callName: data.callName,
            dateOfBirth: data.dateOfBirth,
            email: data.email,
            phone: data.phone,
            address: data.address,
            zipCode: data.zipCode,
            tinNumber: data.tinNumber,
            subject: data.subject,
            currentLesson: data.currentLesson,
            maxLessons: data.maxLessons,
            cardNumber: data.cardNumber,
            lessonPlan: data.lessonPlan,
            notes: data.notes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          })
        })
        
        return teachers
      } catch (error) {
        console.error('Error fetching teachers from Firebase:', error)
        throw error
      }
    },
    
    create: async (data: { data: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'> }) => {
      try {
        const docRef = await addDoc(collection(firestore, TEACHERS_COLLECTION), {
          ...data.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        // Return the created teacher with the generated ID
        const newTeacher: Teacher = {
          id: docRef.id,
          ...data.data
        }
        
        return newTeacher
      } catch (error) {
        console.error('Error creating teacher in Firebase:', error)
        throw error
      }
    },
    
    update: async ({ where, data }: { 
      where: { id: string }, 
      data: Partial<Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>> 
    }) => {
      try {
        const docRef = doc(firestore, TEACHERS_COLLECTION, where.id)
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        })
        
        // Return updated teacher data
        return {
          id: where.id,
          ...data
        }
      } catch (error: unknown) {
        console.error('Error updating teacher in Firebase:', error)
        if (error instanceof Error && 'code' in error && error.code === 'not-found') {
          throw new Error('Teacher not found')
        }
        throw error
      }
    },
    
    delete: async ({ where }: { where: { id: string } }) => {
      try {
        const docRef = doc(firestore, TEACHERS_COLLECTION, where.id)
        await deleteDoc(docRef)
        
        return { id: where.id }
      } catch (error: unknown) {
        console.error('Error deleting teacher from Firebase:', error)
        if (error instanceof Error && 'code' in error && error.code === 'not-found') {
          throw new Error('Teacher not found')
        }
        throw error
      }
    }
  }
}
