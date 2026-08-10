import { X, Download, AlertTriangle, Database, Moon, Sun, ToggleLeft, ToggleRight } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [autoClearFilters, setAutoClearFilters] = useState(true)

  if (!isOpen) return null

  const handleBackup = async () => {
    const { data, error } = await supabase.from('ushers').select('*')
    if (error) {
      alert('Error al descargar copia de seguridad')
      return
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_acomodadores_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteAll = async () => {
    if (confirm('⚠️ ¿Estás COMPLETAMENTE SEGURO de querer borrar TODOS los registros? Esta acción no se puede deshacer.')) {
      const prompt = window.prompt('Escribe "BORRAR TODO" para confirmar:')
      if (prompt === 'BORRAR TODO') {
        const { error } = await supabase.from('ushers').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Borra todos
        if (error) {
          alert('Error al borrar los registros')
        } else {
          alert('Todos los registros han sido eliminados con éxito.')
          onClose()
        }
      } else {
        alert('Cancelado. No escribiste correctamente la frase de confirmación.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Configuración</h2>
              <p className="text-sm text-slate-500 font-medium">Ajustes del panel de administración</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Apariencia y Preferencias</h3>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <div>
                  <p className="font-semibold text-slate-900">Modo Oscuro</p>
                  <p className="text-xs text-slate-500">Cambiar tema visual (Próximamente)</p>
                </div>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`text-2xl transition-colors ${isDarkMode ? 'text-primary-500' : 'text-slate-300'}`}>
                {isDarkMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-semibold text-slate-900">Limpieza de filtros</p>
                <p className="text-xs text-slate-500">Borrar filtros al añadir registros</p>
              </div>
              <button onClick={() => setAutoClearFilters(!autoClearFilters)} className={`text-2xl transition-colors ${autoClearFilters ? 'text-primary-500' : 'text-slate-300'}`}>
                {autoClearFilters ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Gestión de Datos</h3>
            
            <button 
              onClick={handleBackup}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-primary-300 hover:bg-primary-50 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-white group-hover:shadow-sm">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 group-hover:text-primary-700">Respaldar Datos</p>
                  <p className="text-xs text-slate-500 group-hover:text-primary-600/70">Descargar copia en JSON</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleDeleteAll}
              className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 shadow-sm">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-700">Borrar Todos los Datos</p>
                  <p className="text-xs text-red-500">Acción irreversible</p>
                </div>
              </div>
            </button>

          </div>
        </div>

      </div>
    </div>
  )
}
