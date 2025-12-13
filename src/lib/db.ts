import type { Timestamp } from 'firebase/firestore';

// Dynamic imports to avoid build-time Firebase issues
let firestore: any = null;
let collection: any = null;
let doc: any = null;
let getDocs: any = null;
let addDoc: any = null;
let updateDoc: any = null;
let deleteDoc: any = null;
let query: any = null;
let orderBy: any = null;
let serverTimestamp: any = null;

// Initialize Firebase only when needed
const initFirebaseIfNeeded = async () => {
  if (!firestore) {
    try {
      const { db: firebaseDb } = await import('./firebase');
      const firestoreModule = await import('firebase/firestore');
      
      firestore = firebaseDb;
      collection = firestoreModule.collection;
      doc = firestoreModule.doc;
      getDocs = firestoreModule.getDocs;
      addDoc = firestoreModule.addDoc;
      updateDoc = firestoreModule.updateDoc;
      deleteDoc = firestoreModule.deleteDoc;
      query = firestoreModule.query;
      orderBy = firestoreModule.orderBy;
      serverTimestamp = firestoreModule.serverTimestamp;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }
};

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
  socialMediaConsent?: string
  howFound?: string
  referralDetails?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Teacher {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  instrument: string
  address: string
  dateOfBirth?: string
  age?: string
  zipCode?: string
  tinNumber?: string
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
        await initFirebaseIfNeeded();
        
        const q = query(
          collection(firestore, STUDENTS_COLLECTION),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        
        const students: Student[] = []
        querySnapshot.forEach((docSnap: any) => {
          const data = docSnap.data()
          students.push({
            id: docSnap.id,
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
        await initFirebaseIfNeeded();
        
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
        await initFirebaseIfNeeded();
        
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
        await initFirebaseIfNeeded();
        
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
        await initFirebaseIfNeeded();
        
        const q = query(
          collection(firestore, TEACHERS_COLLECTION),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        
        const teachers: Teacher[] = []
        querySnapshot.forEach((docSnap: any) => {
          const data = docSnap.data()
          teachers.push({
            id: docSnap.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            instrument: data.instrument,
            address: data.address,
            dateOfBirth: data.dateOfBirth,
            age: data.age,
            zipCode: data.zipCode,
            tinNumber: data.tinNumber,
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
        await initFirebaseIfNeeded();
        
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
        await initFirebaseIfNeeded();
        
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
        await initFirebaseIfNeeded();
        
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
