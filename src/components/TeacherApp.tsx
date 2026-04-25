import { useState } from 'react'
import type { TeacherData, TeacherAssignmentConfig, TeacherStudent, TeacherSubject } from '../types'
import * as XLSX from 'xlsx'

export default function TeacherApp({ data, updateData }: { data: TeacherData, updateData: (d: TeacherData) => void }) {
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [newSubject, setNewSubject] = useState({ name: '', credits: '1.0', gradeType: 'letter' as 'letter'|'numeric', assignmentCount: '', studentCount: '' })
  const [setupAssignments, setSetupAssignments] = useState<TeacherAssignmentConfig[]>([])
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null)
  const [newSubjectStudents, setNewSubjectStudents] = useState<TeacherStudent[]>([])

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAssignments, setEditingAssignments] = useState<TeacherAssignmentConfig[]>([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [addStudentId, setAddStudentId] = useState('')

  const openEditModal = () => {
    const subject = data.subjects.find(s => s.id === activeSubjectId)
    if (subject) {
      setEditingAssignments([...subject.assignments])
      setShowEditModal(true)
    }
  }

  const handleSaveEdit = () => {
    updateData({
      subjects: data.subjects.map(s => {
        if (s.id !== activeSubjectId) return s;
        
        const validIds = new Set(editingAssignments.map(a => a.id))
        const cleanedStudents = s.students.map(st => {
           const newScores = {...st.scores}
           for (const key in newScores) {
             if (!validIds.has(key)) delete newScores[key]
           }
           editingAssignments.forEach(a => {
             if (newScores[a.id] > a.maxScore) newScores[a.id] = a.maxScore
           })
           return { ...st, scores: newScores }
        })

        return { ...s, assignments: editingAssignments, students: cleanedStudents }
      })
    })
    setShowEditModal(false)
  }

  const handleAddStudent = () => {
    const trimmed = addStudentId.trim()
    if (!trimmed || !activeSubjectId) return
    const subject = data.subjects.find(s => s.id === activeSubjectId)
    if (!subject) return
    if (subject.students.find(st => st.id === trimmed)) {
      alert(`มีนักเรียนชื่อ/เลขที่ "${trimmed}" อยู่แล้ว`)
      return
    }
    updateData({
      subjects: data.subjects.map(s =>
        s.id === activeSubjectId
          ? { ...s, students: [...s.students, { id: trimmed, scores: {} }] }
          : s
      )
    })
    setAddStudentId('')
    setShowAddStudent(false)
  }

  const handleDeleteStudent = (studentId: string) => {
    if (!activeSubjectId) return
    updateData({
      subjects: data.subjects.map(s =>
        s.id === activeSubjectId
          ? { ...s, students: s.students.filter(st => st.id !== studentId) }
          : s
      )
    })
  }

  const handleStartSetup = () => {
    const count = parseInt(newSubject.assignmentCount) || 1
    const defaultAssignments = Array.from({ length: count }, (_, i) => ({
      id: Date.now().toString() + i,
      name: `งานชิ้นที่ ${i+1}`,
      maxScore: 10
    }))
    setSetupAssignments(defaultAssignments)
    setIsSettingUp(true)
  }

  const handleSaveNewSubject = () => {
    let defaultStudents: TeacherStudent[] = []
    
    if (newSubjectStudents.length > 0 && newSubject.studentCount === newSubjectStudents.length.toString()) {
      defaultStudents = newSubjectStudents
    } else {
      const count = parseInt(newSubject.studentCount) || 10
      defaultStudents = Array.from({ length: count }, (_, i) => ({
        id: (i + 1).toString(),
        scores: {}
      }))
    }

    const subject: TeacherSubject = {
      id: Date.now().toString(),
      name: newSubject.name || 'วิชาใหม่',
      credits: parseFloat(newSubject.credits) || 1.0,
      gradeType: newSubject.gradeType,
      assignments: setupAssignments,
      students: defaultStudents
    }

    updateData({ subjects: [...data.subjects, subject] })
    setShowSubjectForm(false)
    setIsSettingUp(false)
    setNewSubjectStudents([])
    setNewSubject({ name: '', credits: '1.0', gradeType: 'numeric', assignmentCount: '3', studentCount: '10' })
  }

  const handleImportForNewSubject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const dataBuffer = event.target?.result
        const workbook = XLSX.read(dataBuffer, { type: 'array' })
        const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 })
        
        const newStudentsList: TeacherStudent[] = []
        rows.forEach(row => {
          if (!row || row.length === 0) return
          let studentId = String(row[0] || '').trim()
          if (/^\d+$/.test(studentId) && row.length > 1 && row[1]) studentId = String(row[1]).trim()
          if (!studentId || ['เลขที่', 'ชื่อ', 'name', 'id'].includes(studentId.toLowerCase())) return
          
          if (!newStudentsList.find(s => s.id === studentId)) {
            newStudentsList.push({ id: studentId, scores: {} })
          }
        })
        
        setNewSubjectStudents(newStudentsList)
        setNewSubject({ ...newSubject, studentCount: newStudentsList.length.toString() })
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const deleteSubject = (id: string) => {
    updateData({ subjects: data.subjects.filter(s => s.id !== id) })
    if (activeSubjectId === id) setActiveSubjectId(null)
  }

  const handleScoreChange = (subjectId: string, studentId: string, assignmentId: string, value: string) => {
    let num = value === '' ? NaN : parseFloat(value)
    
    updateData({
      subjects: data.subjects.map(s => {
        if (s.id !== subjectId) return s
        
        const assignment = s.assignments.find(a => a.id === assignmentId)
        if (assignment && !isNaN(num) && num > assignment.maxScore) {
          return s
        }

        return {
          ...s,
          students: s.students.map(st => {
            if (st.id !== studentId) return st
            const newScores = { ...st.scores }
            if (isNaN(num)) delete newScores[assignmentId]
            else newScores[assignmentId] = num
            return { ...st, scores: newScores }
          })
        }
      })
    })
  }

  const calculateStudentGrade = (subject: TeacherSubject, student: TeacherStudent): string => {
    if (subject.assignments.length === 0) return 'N/A'
    
    let totalScore = 0
    let totalMaxScore = 0
    
    subject.assignments.forEach(a => {
      totalMaxScore += a.maxScore
      totalScore += (student.scores[a.id] || 0)
    })
    
    if (totalMaxScore === 0) return 'N/A'
    
    const avg = (totalScore / totalMaxScore) * 100
    
    if (subject.gradeType === 'letter') {
      if (avg >= 80) return '4.0'
      if (avg >= 75) return '3.5'
      if (avg >= 70) return '3.0'
      if (avg >= 65) return '2.5'
      if (avg >= 60) return '2.0'
      if (avg >= 55) return '1.5'
      if (avg >= 50) return '1.0'
      return '0.0'
    }
    return avg.toFixed(2)
  }

  const exportToExcel = () => {
    if (!activeSubjectId) return
    const subject = data.subjects.find(s => s.id === activeSubjectId)
    if (!subject) return

    const rows = subject.students.map(st => {
      const rowData: any = { 'เลขที่': st.id }
      subject.assignments.forEach(a => {
        rowData[`${a.name} (เต็ม ${a.maxScore})`] = st.scores[a.id] !== undefined ? st.scores[a.id] : ''
      })
      rowData['เกรด'] = calculateStudentGrade(subject, st)
      return rowData
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scores")
    XLSX.writeFile(workbook, `${subject.name}_คะแนน.xlsx`)
  }

  const importStudentsFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSubjectId) return
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const dataBuffer = event.target?.result
        const workbook = XLSX.read(dataBuffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        let newStudentsList: TeacherStudent[] = []
        const currentSubject = data.subjects.find(s => s.id === activeSubjectId)
        if (!currentSubject) return
        
        const existingStudentsMap = new Map(currentSubject.students.map(st => [st.id, st]))
        
        rows.forEach(row => {
          if (!row || row.length === 0) return
          let studentId = String(row[0] || '').trim()
          
          if (/^\d+$/.test(studentId) && row.length > 1 && row[1]) {
            studentId = String(row[1]).trim()
          }
          
          if (!studentId || studentId.toLowerCase() === 'เลขที่' || studentId.toLowerCase() === 'ชื่อ' || studentId.toLowerCase() === 'name' || studentId.toLowerCase() === 'id') return
          
          if (existingStudentsMap.has(studentId)) {
            newStudentsList.push(existingStudentsMap.get(studentId)!)
            existingStudentsMap.delete(studentId)
          } else {
            newStudentsList.push({ id: studentId, scores: {} })
          }
        })
        
        newStudentsList = [...newStudentsList, ...Array.from(existingStudentsMap.values())]

        updateData({
          subjects: data.subjects.map(s => s.id === activeSubjectId ? { ...s, students: newStudentsList } : s)
        })

      } catch (error) {
        alert('เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const activeSubject = data.subjects.find(s => s.id === activeSubjectId)

  return (
    <div className="space-y-6">
      {!activeSubjectId ? (
        <>
          {/* Subject List View */}
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-teal-500">📚</span> จัดการรายวิชา
            </h2>
            <button 
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all shadow-sm active:scale-95"
              onClick={() => setShowSubjectForm(true)}
            >
              + สร้างวิชาใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.subjects.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group flex flex-col" onClick={() => setActiveSubjectId(s.id)}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-800">{s.name}</h3>
                  <button className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={(e) => { e.stopPropagation(); deleteSubject(s.id) }}>
                    🗑️
                  </button>
                </div>
                <div className="mt-auto space-y-2 text-sm text-slate-600">
                  <p className="flex justify-between"><span>นักเรียน:</span> <span className="font-medium text-slate-800">{s.students.length} คน</span></p>
                  <p className="flex justify-between"><span>งานทั้งหมด:</span> <span className="font-medium text-slate-800">{s.assignments.length} ชิ้น</span></p>
                  <p className="flex justify-between"><span>รูปแบบเกรด:</span> <span className="font-medium text-slate-800">{s.gradeType === 'letter' ? '4.0-0.0' : 'เปอร์เซ็นต์'}</span></p>
                </div>
                <button className="w-full mt-6 py-2.5 bg-slate-50 text-teal-600 font-medium rounded-xl group-hover:bg-teal-50 transition-colors">
                  จัดการคะแนน ➔
                </button>
              </div>
            ))}
          </div>
          {data.subjects.length === 0 && !showSubjectForm && (
             <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-3xl">
               <span className="text-4xl mb-4 opacity-50">📂</span>
               <p className="text-lg">ยังไม่มีรายวิชา คลิกสร้างวิชาใหม่เพื่อเริ่มต้น</p>
             </div>
          )}
        </>
      ) : activeSubject ? (
        /* Teacher Subject Score Matrix */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[70vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <button className="text-sm font-medium text-teal-600 hover:text-teal-700 mb-2 flex items-center gap-1" onClick={() => setActiveSubjectId(null)}>
                <span>←</span> กลับไปหน้ารายวิชา
              </button>
              <h2 className="text-2xl font-bold text-slate-800">{activeSubject.name}</h2>
              <p className="text-slate-500 text-sm mt-1">นักเรียน {activeSubject.students.length} คน • งาน {activeSubject.assignments.length} ชิ้น</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-teal-200 text-teal-600 hover:bg-teal-50 font-medium rounded-lg transition-colors text-sm shadow-sm" onClick={openEditModal}>
                 ตั้งค่างาน
              </button>
              <button className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium rounded-lg transition-colors text-sm border border-violet-200 flex items-center gap-1" onClick={() => { setShowAddStudent(v => !v); setAddStudentId('') }}>
                 <span>➕</span> เพิ่มนักเรียน
              </button>
              <label className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors text-sm border border-indigo-200 flex items-center gap-1 cursor-pointer">
                 <span>📥</span> นำเข้ารายชื่อ
                 <input type="file" accept=".xlsx,.xls" onChange={importStudentsFromExcel} className="hidden" />
              </label>
              <button className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg transition-colors text-sm border border-green-200 flex items-center gap-1" onClick={exportToExcel}>
                 <span>📤</span> ส่งออก Excel
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-0">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-700 w-24 sticky left-0 bg-slate-50 border-r border-slate-200 z-20">เลขที่/รายชื่อ</th>
                  {activeSubject.assignments.map(a => (
                    <th key={a.id} className="p-4 font-semibold text-slate-700 border-r border-slate-200 min-w-[140px]">
                      <div className="text-sm">{a.name}</div>
                      <div className="text-xs text-slate-500 font-normal mt-1">
                        คะแนนเต็ม: {a.maxScore}
                      </div>
                    </th>
                  ))}
                  <th className="p-4 font-bold text-teal-700 bg-teal-50 w-32 text-center sticky right-0 z-20 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">เกรด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSubject.students.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/50 transition-colors group/row">
                    <td className="p-4 font-medium text-slate-800 sticky left-0 bg-white border-r border-slate-200 z-10 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>{st.id}</span>
                        <button
                          className="opacity-0 group-hover/row:opacity-100 text-slate-300 hover:text-red-500 transition-all p-0.5 rounded"
                          onClick={() => handleDeleteStudent(st.id)}
                          title="ลบนักเรียน"
                        >✕</button>
                      </div>
                    </td>
                    {activeSubject.assignments.map(a => (
                      <td key={a.id} className="p-2 border-r border-slate-100">
                        <input 
                          type="number"
                          min="0"
                          max={a.maxScore}
                          value={st.scores[a.id] !== undefined ? st.scores[a.id] : ''}
                          onChange={(e) => handleScoreChange(activeSubject.id, st.id, a.id, e.target.value)}
                          className="w-full px-3 py-2 bg-transparent hover:bg-slate-100 focus:bg-white border-2 border-transparent focus:border-teal-500 rounded-lg outline-none transition-all text-center"
                          placeholder="-"
                        />
                      </td>
                    ))}
                    <td className="p-4 text-center sticky right-0 bg-white z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)] bg-teal-50/30">
                      <div className="font-bold text-teal-600 text-lg">{calculateStudentGrade(activeSubject, st)}</div>
                      <div className="text-xs text-teal-600 font-medium whitespace-nowrap mt-0.5">
                        ({activeSubject.assignments.reduce((sum, a) => sum + (st.scores[a.id] || 0), 0)} / {activeSubject.assignments.reduce((sum, a) => sum + a.maxScore, 0)})
                      </div>
                    </td>
                  </tr>
                ))}
                {showAddStudent && (
                  <tr className="bg-violet-50/40">
                    <td className="p-3 sticky left-0 bg-violet-50 border-r border-violet-100 z-10" colSpan={1}>
                      <input
                        autoFocus
                        type="text"
                        value={addStudentId}
                        onChange={e => setAddStudentId(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddStudent(); if (e.key === 'Escape') setShowAddStudent(false) }}
                        placeholder="เลขที่ / ชื่อ"
                        className="w-full px-3 py-2 bg-white border-2 border-violet-400 rounded-lg outline-none text-center text-sm font-medium"
                      />
                    </td>
                    {activeSubject.assignments.map(a => (
                      <td key={a.id} className="p-2 border-r border-violet-100 bg-violet-50/30" />
                    ))}
                    <td className="p-3 sticky right-0 bg-violet-50 z-10">
                      <div className="flex gap-1 justify-center">
                        <button className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700" onClick={handleAddStudent}>เพิ่ม</button>
                        <button className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-300" onClick={() => setShowAddStudent(false)}>ยกเลิก</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Creation Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">สร้างวิชาใหม่</h3>
              <button className="text-slate-400 hover:text-slate-600 p-2" onClick={() => {setShowSubjectForm(false); setIsSettingUp(false)}}>✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {!isSettingUp ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อวิชา</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none" placeholder="เช่น คณิตศาสตร์" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">หน่วยกิต</label>
                    <input type="number" step="0.5" min="0.5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none" value={newSubject.credits} onChange={e => setNewSubject({...newSubject, credits: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">รูปแบบการตัดเกรด</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none" value={newSubject.gradeType} onChange={e => setNewSubject({...newSubject, gradeType: e.target.value as 'numeric'|'letter'})}>
                      <option value="numeric">เปอร์เซ็นต์ (0-100)</option>
                      <option value="letter">เกรด 4.0-0.0</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนงานทั้งหมด</label>
                      <input type="number" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none" value={newSubject.assignmentCount} onChange={e => setNewSubject({...newSubject, assignmentCount: e.target.value})} />
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium text-slate-700">จำนวนนักเรียน</label>
                        <label className="text-xs text-teal-600 font-medium cursor-pointer hover:underline flex items-center gap-1">
                          <span>📥</span> นำเข้าจาก Excel
                          <input type="file" accept=".xlsx,.xls" onChange={handleImportForNewSubject} className="hidden" />
                        </label>
                      </div>
                      <input type="number" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none" value={newSubject.studentCount} onChange={e => {setNewSubject({...newSubject, studentCount: e.target.value}); setNewSubjectStudents([])}} />
                      {newSubjectStudents.length > 0 && newSubject.studentCount === newSubjectStudents.length.toString() && (
                        <p className="text-xs text-teal-600 mt-1 font-medium">✓ นำเข้ารายชื่อ {newSubjectStudents.length} คนแล้ว</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-teal-50 text-teal-800 p-4 rounded-xl text-sm font-medium">
                    กำหนดรายละเอียดงาน {setupAssignments.length} ชิ้น เพื่อใช้คำนวณเกรด
                  </div>
                  <div className="space-y-4">
                    {setupAssignments.map((a, i) => (
                      <div key={a.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-wrap gap-3 items-end">
                        <div className="flex-[2] min-w-[150px]">
                          <label className="block text-xs font-medium text-slate-500 mb-1">ชื่องาน {i+1}</label>
                          <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500" value={a.name} onChange={e => setSetupAssignments(prev => prev.map((pa, pi) => pi === i ? {...pa, name: e.target.value} : pa))} />
                        </div>
                        <div className="flex-1 min-w-[80px]">
                          <label className="block text-xs font-medium text-slate-500 mb-1">คะแนนเต็ม</label>
                          <input type="number" min="1" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500" value={a.maxScore} onChange={e => setSetupAssignments(prev => prev.map((pa, pi) => pi === i ? {...pa, maxScore: parseFloat(e.target.value)||0} : pa))} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors" onClick={() => {setShowSubjectForm(false); setIsSettingUp(false)}}>ยกเลิก</button>
              {!isSettingUp ? (
                <button className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors" onClick={handleStartSetup}>ถัดไป ➔</button>
              ) : (
                <button className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors" onClick={handleSaveNewSubject}>บันทึกวิชา</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignments Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">ตั้งค่างานและคะแนนเต็ม</h3>
              <button className="text-slate-400 hover:text-slate-600 p-2" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                {editingAssignments.map((a, i) => (
                  <div key={a.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-wrap gap-3 items-end">
                    <div className="flex-[2] min-w-[150px]">
                      <label className="block text-xs font-medium text-slate-500 mb-1">ชื่องาน</label>
                      <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500" value={a.name} onChange={e => setEditingAssignments(prev => prev.map((pa, pi) => pi === i ? {...pa, name: e.target.value} : pa))} />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <label className="block text-xs font-medium text-slate-500 mb-1">คะแนนเต็ม</label>
                      <input type="number" min="1" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500" value={a.maxScore} onChange={e => setEditingAssignments(prev => prev.map((pa, pi) => pi === i ? {...pa, maxScore: parseFloat(e.target.value)||0} : pa))} />
                    </div>
                    <button className="px-3 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-sm font-medium" onClick={() => setEditingAssignments(prev => prev.filter((_, pi) => pi !== i))}>ลบ</button>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-teal-200 text-teal-600 rounded-xl hover:bg-teal-50 font-medium transition-colors" onClick={() => setEditingAssignments(prev => [...prev, { id: Date.now().toString(), name: 'งานใหม่', maxScore: 10 }])}>
                  + เพิ่มงานใหม่
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors" onClick={() => setShowEditModal(false)}>ยกเลิก</button>
              <button className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors" onClick={handleSaveEdit}>บันทึกการเปลี่ยนแปลง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
