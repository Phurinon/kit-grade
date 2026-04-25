import { useState } from 'react'
import type { StudentData, Subject } from '../types'
import StudentSubjectCard from './StudentSubjectCard'

export default function StudentApp({ data, updateData }: { data: StudentData, updateData: (d: StudentData) => void }) {
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectType, setNewSubjectType] = useState<'numeric' | 'letter'>('numeric')

  const addSubject = () => {
    if (newSubjectName.trim()) {
      const newSubject: Subject = {
        id: Date.now().toString(),
        name: newSubjectName,
        gradeType: newSubjectType,
        assignments: []
      }
      updateData({
        ...data,
        subjects: [...data.subjects, newSubject]
      })
      setNewSubjectName('')
      setNewSubjectType('numeric')
    }
  }

  const deleteSubject = (id: string) => {
    updateData({
      ...data,
      subjects: data.subjects.filter(s => s.id !== id)
    })
  }

  const addAssignment = (subjectId: string, name: string, score: number, maxScore: number) => {
    if (name.trim() && score >= 0) {
      updateData({
        ...data,
        subjects: data.subjects.map(s => {
          if (s.id === subjectId) {
            return {
              ...s,
              assignments: [...s.assignments, {
                id: Date.now().toString(),
                name,
                score,
                maxScore: maxScore || 10
              }]
            }
          }
          return s
        })
      })
    }
  }

  const deleteAssignment = (subjectId: string, assignmentId: string) => {
    updateData({
      ...data,
      subjects: data.subjects.map(s => {
        if (s.id === subjectId) {
          return {
            ...s,
            assignments: s.assignments.filter(a => a.id !== assignmentId)
          }
        }
        return s
      })
    })
  }

  const updateAssignment = (subjectId: string, assignmentId: string, name: string, score: number, maxScore: number) => {
    updateData({
      ...data,
      subjects: data.subjects.map(s => {
        if (s.id === subjectId) {
          return {
            ...s,
            assignments: s.assignments.map(a => {
              if (a.id === assignmentId) {
                return { ...a, name, score, maxScore }
              }
              return a
            })
          }
        }
        return s
      })
    })
  }

  const calculateGrade = (subject: Subject): string => {
    if (subject.assignments.length === 0) return 'N/A'
    let totalScore = 0
    let totalMaxScore = 0
    subject.assignments.forEach(a => {
      totalScore += a.score
      totalMaxScore += a.maxScore
    })
    if (totalMaxScore === 0) return 'N/A'
    const avg = (totalScore / totalMaxScore) * 100
    
    if (subject.gradeType === 'letter') {
      if (avg >= 80) return 'A'
      if (avg >= 75) return 'B+'
      if (avg >= 70) return 'B'
      if (avg >= 65) return 'C+'
      if (avg >= 60) return 'C'
      if (avg >= 55) return 'D+'
      if (avg >= 50) return 'D'
      return 'F'
    }
    return avg.toFixed(2)
  }

  const calculateGPA = (): string => {
    const gradeValues = { 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0 }
    let totalPoints = 0
    let count = 0
    data.subjects.forEach(subject => {
      const grade = calculateGrade(subject)
      if (grade !== 'N/A') {
        const value = subject.gradeType === 'letter' 
          ? gradeValues[grade as keyof typeof gradeValues]
          : parseFloat(grade) / 25
        totalPoints += value
        count++
      }
    })
    return count === 0 ? 'N/A' : (totalPoints / count).toFixed(2)
  }

  return (
    <>
      {/* GPA Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 md:p-12 shadow-xl shadow-indigo-200 text-center text-white border border-white/20">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-black/10 blur-2xl rounded-full"></div>
        <div className="relative z-10">
          <h2 className="text-indigo-100 font-medium tracking-wide uppercase text-sm mb-2">เกรดเฉลี่ยสะสม (GPA)</h2>
          <div className="text-6xl md:text-8xl font-black tracking-tight drop-shadow-md">
            {calculateGPA()}
          </div>
        </div>
      </div>

      {/* Add Subject Section */}
      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <h2 className="text-slate-500 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          เพิ่มวิชาใหม่
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="ชื่อวิชา (เช่น คณิตศาสตร์)"
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubject()}
          />
          <select 
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 min-w-[180px]"
            value={newSubjectType} 
            onChange={(e) => setNewSubjectType(e.target.value as 'numeric' | 'letter')}
          >
            <option value="numeric">เปอร์เซ็นต์ (0-100)</option>
            <option value="letter">เกรด A-F</option>
          </select>
          <button 
            className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
            onClick={addSubject}
          >
            + เพิ่มวิชา
          </button>
        </div>
      </section>

      {/* Subjects List */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.subjects.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-3xl">
            <span className="text-4xl mb-4 opacity-50">📚</span>
            <p className="text-lg">ยังไม่มีวิชา กรุณาเพิ่มวิชาใหม่</p>
          </div>
        ) : (
          data.subjects.map(subject => (
            <StudentSubjectCard
              key={subject.id}
              subject={subject}
              onDelete={() => deleteSubject(subject.id)}
              onAddAssignment={(name, score, maxScore) => addAssignment(subject.id, name, score, maxScore)}
              onDeleteAssignment={(assignmentId) => deleteAssignment(subject.id, assignmentId)}
              onUpdateAssignment={(assignmentId, name, score, maxScore) => updateAssignment(subject.id, assignmentId, name, score, maxScore)}
              calculateGrade={calculateGrade}
            />
          ))
        )}
      </section>
    </>
  )
}
