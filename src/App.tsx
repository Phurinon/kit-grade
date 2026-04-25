import React, { useState } from 'react'
import type { Role, AppData } from './types'
import WelcomeScreen from './components/WelcomeScreen'
import StudentApp from './components/StudentApp'
import TeacherApp from './components/TeacherApp'

export default function App() {
  const [role, setRole] = useState<Role>(null)
  
  // We keep a combined state to allow exporting/importing everything at once
  const [appData, setAppData] = useState<AppData>({
    studentData: { subjects: [] },
    teacherData: { subjects: [] }
  })

  const exportData = () => {
    const json = JSON.stringify(appData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kit-grade-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string)
          if (imported.studentData || imported.teacherData) {
            setAppData({
              studentData: imported.studentData || { subjects: [] },
              teacherData: imported.teacherData || { subjects: [] }
            })
          } else if (imported.subjects) {
            // Backwards compatibility with old student-only exports
            setAppData({
              studentData: imported,
              teacherData: { subjects: [] }
            })
          }
        } catch (error) {
          alert('เกิดข้อผิดพลาดในการนำเข้าไฟล์')
        }
      }
      reader.readAsText(file)
    }
    // Reset file input
    e.target.value = ''
  }

  if (role === null) {
    return <WelcomeScreen setRole={setRole} exportData={exportData} importData={importData} />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Universal Header */}
        <header className="bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-sm rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${role === 'student' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200' : 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-200'}`}>
              <span className="text-2xl">{role === 'student' ? '👨‍🎓' : '👨‍🏫'}</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                เครื่องคิดเกรด {role === 'student' ? 'นักเรียน' : 'คุณครู'}
              </h1>
              <p className="text-slate-500 text-sm font-medium">โหมด{role === 'student' ? 'นักเรียน' : 'คุณครู'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center">
            <button 
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all shadow-sm active:scale-95"
              onClick={() => setRole(null)}
            >
              🔄 เปลี่ยนโหมด
            </button>
            <button 
              className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
              onClick={exportData}
            >
              <span>📥</span> Backup
            </button>
            <label className={`px-5 py-2 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 flex items-center gap-2 ${role === 'student' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'}`}>
              <span>📤</span> Restore
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </header>

        {role === 'student' ? (
          <StudentApp 
            data={appData.studentData} 
            updateData={(newData) => setAppData(prev => ({ ...prev, studentData: newData }))} 
          />
        ) : (
          <TeacherApp 
            data={appData.teacherData} 
            updateData={(newData) => setAppData(prev => ({ ...prev, teacherData: newData }))} 
          />
        )}

      </div>
    </div>
  )
}
