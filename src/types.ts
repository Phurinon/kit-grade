export type Role = 'student' | 'teacher' | null

// Student Mode Interfaces
export interface Assignment {
  id: string
  name: string
  score: number
  maxScore: number
}

export interface Subject {
  id: string
  name: string
  gradeType: 'numeric' | 'letter'
  assignments: Assignment[]
}

export interface StudentData {
  subjects: Subject[]
}

// Teacher Mode Interfaces
export interface TeacherAssignmentConfig {
  id: string
  name: string
  maxScore: number
}

export interface TeacherStudent {
  id: string // Student number (e.g., "1", "2")
  scores: Record<string, number> // assignmentId -> score
}

export interface TeacherSubject {
  id: string
  name: string
  gradeType: 'numeric' | 'letter'
  assignments: TeacherAssignmentConfig[]
  students: TeacherStudent[]
}

export interface TeacherData {
  subjects: TeacherSubject[]
}

export interface AppData {
  studentData: StudentData
  teacherData: TeacherData
}
