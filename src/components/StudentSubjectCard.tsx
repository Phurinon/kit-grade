import { useState } from 'react'
import type { Subject } from '../types'

export default function StudentSubjectCard({
  subject, onDelete, onAddAssignment, onDeleteAssignment, onUpdateAssignment, calculateGrade
}: {
  subject: Subject, onDelete: () => void, onAddAssignment: (n:string, s:number, w:number)=>void,
  onDeleteAssignment: (id:string)=>void, onUpdateAssignment: (id:string, n:string, s:number, w:number)=>void,
  calculateGrade: (s:Subject)=>string
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', score: '', maxScore: '10' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', score: '', maxScore: '10' })

  const handleAdd = () => {
    const score = parseFloat(formData.score); const maxScore = parseFloat(formData.maxScore)
    if (formData.name.trim() && !isNaN(score) && score >= 0) {
      onAddAssignment(formData.name, score, maxScore || 10)
      setFormData({ name: '', score: '', maxScore: '10' }); setShowAddForm(false)
    }
  }

  const handleUpdate = (id: string) => {
    const score = parseFloat(editData.score); const maxScore = parseFloat(editData.maxScore)
    if (editData.name.trim() && !isNaN(score) && score >= 0) {
      onUpdateAssignment(id, editData.name, score, maxScore || 10)
      setEditingId(null)
    }
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight pr-4">{subject.name}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-sm border border-slate-200 shadow-sm">
              หน่วยกิต: {subject.credits || 1.0}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold text-sm border border-sky-100 shadow-sm">
              คะแนน: {subject.assignments.reduce((sum, a) => sum + a.score, 0)} / {subject.assignments.reduce((sum, a) => sum + a.maxScore, 0)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-100 shadow-sm">
              Grade: {calculateGrade(subject)}
            </span>
          </div>
        </div>
        <button className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={onDelete}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 mb-4 max-h-[240px] custom-scrollbar">
        {subject.assignments.length === 0 ? <p className="text-center text-slate-400 py-6 text-sm">ยังไม่มีงาน</p> : 
          subject.assignments.map(a => (
            <div key={a.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors group/item">
              {editingId === a.id ? (
                <div className="flex flex-wrap gap-2">
                  <input type="text" className="flex-[2] min-w-[100px] px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                  <input type="number" min="0" className="flex-1 min-w-[60px] px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg" value={editData.score} onChange={(e) => setEditData({...editData, score: e.target.value})} placeholder="ได้" />
                  <input type="number" min="1" className="flex-1 min-w-[60px] px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg" value={editData.maxScore} onChange={(e) => setEditData({...editData, maxScore: e.target.value})} placeholder="เต็ม" />
                  <div className="w-full flex gap-2 mt-1">
                    <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 rounded-lg" onClick={() => handleUpdate(a.id)}>บันทึก</button>
                    <button className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium py-2 rounded-lg" onClick={() => setEditingId(null)}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">คะแนนเต็ม: {a.maxScore}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-white border border-slate-200 text-indigo-600 font-bold px-2.5 py-1 rounded-md text-sm shadow-sm">{a.score} / {a.maxScore}</span>
                    <div className="flex opacity-0 group-hover/item:opacity-100 transition-opacity gap-1">
                      <button className="text-slate-400 hover:text-indigo-600 p-1" onClick={() => { setEditingId(a.id); setEditData({name: a.name, score: a.score.toString(), maxScore: a.maxScore.toString()}) }}>✏️</button>
                      <button className="text-slate-400 hover:text-red-500 p-1" onClick={() => onDeleteAssignment(a.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      <div className="pt-2 border-t border-slate-100 mt-auto">
        {showAddForm ? (
          <div className="bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100 mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              <input type="text" placeholder="ชื่องาน" className="flex-[2] min-w-[120px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input type="number" min="0" placeholder="ได้" className="flex-1 min-w-[70px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl" value={formData.score} onChange={(e) => setFormData({...formData, score: e.target.value})} />
              <input type="number" min="1" placeholder="เต็ม" className="flex-1 min-w-[70px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl" value={formData.maxScore} onChange={(e) => setFormData({...formData, maxScore: e.target.value})} />
            </div>
            <div className="flex gap-2 pt-1">
              <button className="flex-[2] bg-indigo-600 text-white text-sm py-2.5 rounded-xl" onClick={handleAdd}>เพิ่ม</button>
              <button className="flex-1 bg-white text-slate-600 border text-sm py-2.5 rounded-xl" onClick={() => setShowAddForm(false)}>ยกเลิก</button>
            </div>
          </div>
        ) : (
          <button className="w-full py-3 px-4 border-2 border-dashed border-slate-200 text-slate-500 hover:text-indigo-600 rounded-2xl text-sm font-medium flex justify-center gap-2" onClick={() => setShowAddForm(true)}>
            <span className="text-lg leading-none">+</span> เพิ่มงาน
          </button>
        )}
      </div>
    </div>
  )
}
