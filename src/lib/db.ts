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
  grade: string
  enrollmentDate: string
  status: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const STUDENTS_COLLECTION = 'students'

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
            grade: data.grade,
            enrollmentDate: data.enrollmentDate,
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
      } catch (error) {
        console.error('Error updating student in Firebase:', error)
        if (error.code === 'not-found') {
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
      } catch (error) {
        console.error('Error deleting student from Firebase:', error)
        if (error.code === 'not-found') {
          throw new Error('Student not found')
        }
        throw error
      }
    }
  }
}
