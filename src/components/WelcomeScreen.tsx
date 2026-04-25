import React from 'react'
import type { Role } from '../types'

export default function WelcomeScreen({ setRole, exportData, importData }: { setRole: (r: Role) => void, exportData: () => void, importData: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 max-w-2xl w-full text-center space-y-8">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
          <span className="text-4xl">📊</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-800">
          ยินดีต้อนรับสู่เครื่องมือคิดเกรด
        </h1>
        <p className="text-slate-500 text-lg">
          กรุณาเลือกโหมดการใช้งานของคุณ เพื่อเข้าสู่ระบบที่เหมาะสม
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 pt-4">
          <button 
            onClick={() => setRole('student')}
            className="group relative overflow-hidden bg-white border-2 border-indigo-100 hover:border-indigo-400 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-indigo-100 active:scale-95 flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <span className="text-3xl">👨‍🎓</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-indigo-900 mb-1">โหมดนักเรียน</h2>
              <p className="text-sm text-indigo-600/70">สำหรับติดตามเกรดส่วนตัวรายวิชา</p>
            </div>
          </button>
          
          <button 
            onClick={() => setRole('teacher')}
            className="group relative overflow-hidden bg-white border-2 border-teal-100 hover:border-teal-400 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-teal-100 active:scale-95 flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <span className="text-3xl">👨‍🏫</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-teal-900 mb-1">โหมดคุณครู</h2>
              <p className="text-sm text-teal-600/70">สำหรับจัดการคะแนนนักเรียนทั้งห้อง</p>
            </div>
          </button>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-center gap-4">
          <button onClick={exportData} className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">📥 สำรองข้อมูลระบบ (Backup)</button>
          <span className="text-slate-300">|</span>
          <label className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer">
            📤 กู้คืนข้อมูลระบบ (Restore)
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  )
}
