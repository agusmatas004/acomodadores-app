'use client'

import { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Clock, 
  Users, 
  ClipboardList, 
  FileText, 
  Edit2, 
  Check, 
  X, 
  Phone 
} from 'lucide-react'
import { 
  getExistingUshers, 
  saveUshers, 
  updateUshersBaseInfo, 
  updateUsher, 
  deleteUsher 
} from '@/app/actions'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const DAYS = ['Viernes', 'Sábado', 'Domingo']

const DAY_ORDER: Record<string, number> = {
  'viernes': 1,
  'sábado': 2,
  'sabado': 2,
  'domingo': 3
}

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 20; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
  }
}

type UsherData = {
  id?: string
  province: string
  circuit: string
  congregation: string
  captain_name: string
  usher_name: string
  sector: string
  day: string
  start_time: string
  end_time: string
  phone: string
}

type FormUsherData = Partial<UsherData & { 
  days: string[]
  schedules: Record<string, { start_time: string, end_time: string }>
}>

export default function PublicForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [baseInfo, setBaseInfo] = useState({
    captain_name: '',
    province: '',
    circuit: '',
    congregation: '',
  })

  const [existingUshers, setExistingUshers] = useState<UsherData[]>([])
  const [newUshers, setNewUshers] = useState<FormUsherData[]>([])

  // Estado para la edición de acomodadores ya cargados
  const [editingUsherId, setEditingUsherId] = useState<string | null>(null)
  const [editingFormData, setEditingFormData] = useState<Partial<UsherData>>({})
  const [savingEditId, setSavingEditId] = useState<string | null>(null)
  const [deletingUsherId, setDeletingUsherId] = useState<string | null>(null)

  const handleBaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const existing = await getExistingUshers(
        baseInfo.province,
        baseInfo.circuit,
        baseInfo.congregation,
        baseInfo.captain_name
      )
      setExistingUshers(existing as UsherData[])
      setNewUshers([{ usher_name: '', sector: '', days: ['Viernes'], schedules: { 'Viernes': { start_time: '08:00', end_time: '10:00' } }, phone: '' }])
      setStep(2)
    } catch (err: any) {
      setErrorMsg('Error al verificar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBaseInfo = async () => {
    if (existingUshers.length === 0) return
    setLoading(true)
    setErrorMsg('')
    try {
      const usherIds = existingUshers.map(u => u.id).filter(Boolean) as string[]
      if (usherIds.length > 0) {
        await updateUshersBaseInfo(usherIds, baseInfo)
      }
      
      const existing = await getExistingUshers(
        baseInfo.province,
        baseInfo.circuit,
        baseInfo.congregation,
        baseInfo.captain_name
      )
      setExistingUshers(existing as UsherData[])
      setStep(2)
      setSuccessMsg('¡Los datos del capitán se actualizaron correctamente para los acomodadores cargados!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg('Error al actualizar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Iniciar edición de un acomodador existente
  const handleStartEdit = (usher: UsherData) => {
    setEditingUsherId(usher.id || null)
    setEditingFormData({
      usher_name: usher.usher_name,
      sector: usher.sector || '',
      day: usher.day,
      start_time: (usher.start_time || '08:00').substring(0, 5),
      end_time: (usher.end_time || '10:00').substring(0, 5),
      phone: usher.phone || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingUsherId(null)
    setEditingFormData({})
  }

  // Guardar cambios en un acomodador existente
  const handleSaveEdit = async (id: string) => {
    if (!editingFormData.usher_name?.trim()) {
      alert('El nombre del acomodador no puede estar vacío.')
      return
    }

    setSavingEditId(id)
    setErrorMsg('')
    try {
      await updateUsher(id, {
        usher_name: editingFormData.usher_name,
        sector: editingFormData.sector || '',
        day: editingFormData.day || 'Viernes',
        start_time: editingFormData.start_time || '08:00',
        end_time: editingFormData.end_time || '10:00',
        phone: editingFormData.phone || ''
      })

      // Actualizar en el estado local
      setExistingUshers(prev => prev.map(u => {
        if (u.id === id) {
          return {
            ...u,
            usher_name: editingFormData.usher_name!.trim().toUpperCase(),
            sector: (editingFormData.sector || '').trim().toUpperCase(),
            day: editingFormData.day || u.day,
            start_time: editingFormData.start_time || u.start_time,
            end_time: editingFormData.end_time || u.end_time,
            phone: (editingFormData.phone || '').trim()
          }
        }
        return u
      }))

      setEditingUsherId(null)
      setEditingFormData({})
      setSuccessMsg('Acomodador actualizado con éxito.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg('Error al actualizar acomodador: ' + err.message)
    } finally {
      setSavingEditId(null)
    }
  }

  // Eliminar un acomodador existente
  const handleDeleteExistingUsher = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a "${name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setDeletingUsherId(id)
    setErrorMsg('')
    try {
      await deleteUsher(id)
      setExistingUshers(prev => prev.filter(u => u.id !== id))
      setSuccessMsg(`"${name}" fue eliminado correctamente.`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg('Error al eliminar acomodador: ' + err.message)
    } finally {
      setDeletingUsherId(null)
    }
  }

  const handleAddRow = () => {
    setNewUshers([
      ...newUshers,
      { usher_name: '', sector: '', days: ['Viernes'], schedules: { 'Viernes': { start_time: '08:00', end_time: '10:00' } }, phone: '' }
    ])
  }

  const handleRemoveRow = (index: number) => {
    setNewUshers(newUshers.filter((_, i) => i !== index))
  }

  const handleRowChange = (index: number, field: keyof FormUsherData, value: any) => {
    const updated = [...newUshers]
    updated[index] = { ...updated[index], [field]: value }
    setNewUshers(updated)
  }

  const handleScheduleChange = (index: number, day: string, field: 'start_time' | 'end_time', value: string) => {
    const updated = [...newUshers]
    const schedules = { ...updated[index].schedules }
    if (!schedules[day]) {
      schedules[day] = { start_time: '08:00', end_time: '10:00' }
    }
    schedules[day][field] = value
    updated[index] = { ...updated[index], schedules }
    setNewUshers(updated)
  }

  const handleFinalSubmit = async () => {
    const validUshers = newUshers.filter(u => u.usher_name?.trim() !== '')
    if (validUshers.length === 0) {
      setErrorMsg('Debes ingresar al menos un acomodador.')
      return
    }

    const dataToInsert = validUshers.flatMap(u => {
      const baseRecord = {
        province: baseInfo.province.trim().toUpperCase(),
        circuit: baseInfo.circuit.trim().toUpperCase(),
        congregation: baseInfo.congregation.trim().toUpperCase(),
        captain_name: baseInfo.captain_name.trim().toUpperCase(),
        usher_name: (u.usher_name || '').trim().toUpperCase(),
        sector: (u.sector || '').trim().toUpperCase(),
        phone: u.phone || ''
      }
      const selectedDays = u.days && u.days.length > 0 ? u.days : ['Viernes']
      return selectedDays.map(d => ({ 
        ...baseRecord, 
        day: d,
        start_time: u.schedules?.[d]?.start_time || '08:00',
        end_time: u.schedules?.[d]?.end_time || '10:00'
      }))
    })

    setLoading(true)
    setErrorMsg('')
    try {
      await saveUshers(dataToInsert)
      setStep(3)
    } catch (err: any) {
      setErrorMsg('Error al guardar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    const validUshers = newUshers.filter(u => u.usher_name?.trim() !== '')
    const submittedData = validUshers.flatMap(u => {
      const baseRecord = {
        ...baseInfo,
        province: baseInfo.province.trim().toUpperCase(),
        circuit: baseInfo.circuit.trim().toUpperCase(),
        congregation: baseInfo.congregation.trim().toUpperCase(),
        captain_name: baseInfo.captain_name.trim().toUpperCase(),
        usher_name: (u.usher_name || '').trim().toUpperCase(),
        sector: (u.sector || '').trim().toUpperCase(),
        phone: u.phone || ''
      }
      const selectedDays = u.days && u.days.length > 0 ? u.days : ['Viernes']
      return selectedDays.map(d => ({ 
        ...baseRecord, 
        day: d,
        start_time: u.schedules?.[d]?.start_time || '08:00',
        end_time: u.schedules?.[d]?.end_time || '10:00'
      }))
    })
    
    const allData = [...existingUshers, ...submittedData].sort((a, b) => {
      const dayA = DAY_ORDER[a.day?.toLowerCase() || ''] || 99
      const dayB = DAY_ORDER[b.day?.toLowerCase() || ''] || 99
      if (dayA !== dayB) return dayA - dayB
      return (a.start_time || '').localeCompare(b.start_time || '')
    })

    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text(`Acomodadores - ${baseInfo.congregation.trim().toUpperCase()}`, 14, 20)
    
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Capitán: ${baseInfo.captain_name.trim().toUpperCase()} | Circuito: ${baseInfo.circuit.trim().toUpperCase()}`, 14, 28)

    const tableData = allData.map(u => [
      u.usher_name || '',
      u.sector || '-',
      u.day || '',
      `${(u.start_time || '').substring(0,5)} - ${(u.end_time || '').substring(0,5)}`,
      u.phone || '-'
    ])

    autoTable(doc, {
      startY: 35,
      head: [['Acomodador', 'Sector', 'Día', 'Horario', 'Teléfono']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] },
    })

    doc.save(`Acomodadores_${baseInfo.congregation.replace(/\s+/g, '_').toUpperCase()}.pdf`)
  }

  if (step === 3) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center animate-in fade-in zoom-in duration-500">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Datos Guardados!</h2>
        <p className="text-slate-600 mb-8">Se han registrado los acomodadores correctamente.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={handleDownloadPDF} className="btn-primary px-6 py-3 flex-1 bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 flex items-center justify-center">
            <FileText className="w-5 h-5 mr-2" />
            Descargar mi Planilla (PDF)
          </button>
          <button onClick={() => window.location.reload()} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold py-3 px-6 rounded-xl transition-all flex-1">
            Cargar otra congregación
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-100 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tarjeta 1: Detalles del Capitán */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 relative overflow-hidden">
        <div className="flex items-center mb-6">
          <ClipboardList className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-bold text-primary-700">Detalles del Capitán</h2>
        </div>

        <form onSubmit={handleBaseSubmit}>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2 uppercase">
                Nombre Completo
              </label>
              <input 
                required type="text" className="input-field" 
                value={baseInfo.captain_name} onChange={e => setBaseInfo({...baseInfo, captain_name: e.target.value})}
                disabled={step === 2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2 uppercase">
                Provincia
              </label>
              <input 
                required type="text" className="input-field" 
                value={baseInfo.province} onChange={e => setBaseInfo({...baseInfo, province: e.target.value})}
                disabled={step === 2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2 uppercase">
                Circuito
              </label>
              <input 
                required type="text" className="input-field" 
                value={baseInfo.circuit} onChange={e => setBaseInfo({...baseInfo, circuit: e.target.value})}
                disabled={step === 2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2 uppercase">
                Congregación
              </label>
              <input 
                required type="text" className="input-field" 
                value={baseInfo.congregation} onChange={e => setBaseInfo({...baseInfo, congregation: e.target.value})}
                disabled={step === 2}
              />
            </div>
          </div>
          
          {step === 1 && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button disabled={loading} type="submit" className="btn-primary flex-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (existingUshers.length > 0 ? 'Buscar con nuevos datos' : 'Siguiente Paso')}
              </button>
              
              {existingUshers.length > 0 && (
                <button 
                  disabled={loading} 
                  type="button" 
                  onClick={handleUpdateBaseInfo}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md flex-1 text-sm"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Actualizar estos datos en mis acomodadores'}
                </button>
              )}
            </div>
          )}
        </form>
        
        {step === 2 && (
          <div className="absolute top-6 right-6">
             <button onClick={() => setStep(1)} className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full hover:bg-primary-100 transition-colors">
               Editar
             </button>
          </div>
        )}
      </div>

      {/* Tarjeta 2: Registro de Acomodadores */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-xl font-bold text-primary-700">Registro de Acomodadores</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {existingUshers.length > 0 && (
                <button 
                  onClick={handleDownloadPDF} 
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold rounded-xl text-xs flex items-center transition-all shadow-sm"
                  title="Descargar PDF con los acomodadores cargados"
                >
                  <FileText className="w-4 h-4 mr-1.5 text-rose-600" />
                  Descargar PDF
                </button>
              )}
              <button onClick={handleAddRow} className="btn-primary py-2 px-4 text-sm w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4 mr-1.5" /> AÑADIR ACOMODADOR
              </button>
            </div>
          </div>

          {/* Sección de Acomodadores Cargados Previamente (con Edición y Eliminación) */}
          {existingUshers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-3 uppercase flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Cargados previamente ({existingUshers.length})
              </h3>
              <div className="grid gap-2.5">
                {existingUshers.map((u) => {
                  const isEditing = editingUsherId === u.id
                  const isSaving = savingEditId === u.id
                  const isDeleting = deletingUsherId === u.id

                  if (isEditing) {
                    return (
                      <div key={u.id} className="p-4 bg-primary-50/50 border-2 border-primary-300 rounded-xl space-y-3 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary-800 uppercase flex items-center">
                            <Edit2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Modificar Acomodador
                          </span>
                          <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600 text-xs flex items-center">
                            <X className="w-4 h-4 mr-0.5" /> Cancelar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre</label>
                            <input
                              type="text"
                              className="input-field py-1.5 text-sm bg-white"
                              value={editingFormData.usher_name || ''}
                              onChange={(e) => setEditingFormData({ ...editingFormData, usher_name: e.target.value })}
                            />
                          </div>

                          <div className="md:col-span-6">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sector</label>
                            <input
                              type="text"
                              className="input-field py-1.5 text-sm bg-white"
                              placeholder="Ej: Plataforma, Entradas..."
                              value={editingFormData.sector || ''}
                              onChange={(e) => setEditingFormData({ ...editingFormData, sector: e.target.value })}
                            />
                          </div>

                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Día</label>
                            <select
                              className="input-field py-1.5 text-sm bg-white"
                              value={editingFormData.day || 'Viernes'}
                              onChange={(e) => setEditingFormData({ ...editingFormData, day: e.target.value })}
                            >
                              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>

                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Horario</label>
                            <div className="flex items-center gap-1.5">
                              <select
                                className="input-field py-1.5 text-sm bg-white flex-1"
                                value={editingFormData.start_time || '08:00'}
                                onChange={(e) => setEditingFormData({ ...editingFormData, start_time: e.target.value })}
                              >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <span className="text-slate-400 text-xs">-</span>
                              <select
                                className="input-field py-1.5 text-sm bg-white flex-1"
                                value={editingFormData.end_time || '10:00'}
                                onChange={(e) => setEditingFormData({ ...editingFormData, end_time: e.target.value })}
                              >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                            <input
                              type="text"
                              className="input-field py-1.5 text-sm bg-white"
                              value={editingFormData.phone || ''}
                              onChange={(e) => setEditingFormData({ ...editingFormData, phone: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveEdit(u.id!)}
                            className="btn-primary py-1.5 px-4 text-xs flex items-center bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                          >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                            Guardar Cambios
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div 
                      key={u.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl p-3 text-sm transition-all"
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="font-semibold text-slate-800 min-w-[120px]">{u.usher_name}</span>
                        {u.sector && (
                          <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-md">
                            {u.sector}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${u.day.toLowerCase() === 'viernes' ? 'bg-emerald-100 text-emerald-700' : u.day.toLowerCase() === 'domingo' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {u.day}
                        </span>
                        <span className="text-slate-500 flex items-center text-xs">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> {u.start_time.substring(0,5)} - {u.end_time.substring(0,5)}
                        </span>
                        {u.phone && (
                          <span className="text-slate-500 flex items-center text-xs">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" /> {u.phone}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar este acomodador"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteExistingUsher(u.id!, u.usher_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar este acomodador"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sección de Nuevos Registros */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Nuevos Registros</h3>
            {newUshers.map((usher, index) => (
              <div key={index} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 relative group transition-colors hover:border-primary-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-12">
                    <input 
                      type="text" placeholder="Nombre completo del acomodador" 
                      className="input-field py-2"
                      value={usher.usher_name || ''} onChange={e => handleRowChange(index, 'usher_name', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-12">
                    <input 
                      type="text" placeholder="Sector (Ej: Plataforma, Estacionamiento, Entradas...)" 
                      className="input-field py-2"
                      value={usher.sector || ''} onChange={e => handleRowChange(index, 'sector', e.target.value)}
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {DAYS.map(d => {
                        const isSelected = usher.days?.includes(d)
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              const currentDays = usher.days || []
                              if (currentDays.includes(d)) {
                                if (currentDays.length > 1) {
                                  handleRowChange(index, 'days', currentDays.filter(day => day !== d))
                                }
                              } else {
                                const newDays = [...currentDays, d]
                                const newSchedules = { ...usher.schedules }
                                if (!newSchedules[d]) {
                                  newSchedules[d] = { start_time: '08:00', end_time: '10:00' }
                                }
                                const updated = [...newUshers]
                                updated[index] = { ...updated[index], days: newDays, schedules: newSchedules }
                                setNewUshers(updated)
                              }
                            }}
                            className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-colors ${isSelected ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                          >
                            {d}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-6">
                    <div className="flex flex-col gap-2">
                      {(usher.days || ['Viernes']).map(d => (
                        <div key={d} className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 w-16">{d}</span>
                          <select 
                            className="input-field py-1 text-sm flex-1"
                            value={usher.schedules?.[d]?.start_time || '08:00'}
                            onChange={e => handleScheduleChange(index, d, 'start_time', e.target.value)}
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-slate-400 text-xs">-</span>
                          <select 
                            className="input-field py-1 text-sm flex-1"
                            value={usher.schedules?.[d]?.end_time || '10:00'}
                            onChange={e => handleScheduleChange(index, d, 'end_time', e.target.value)}
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-3">
                    <input 
                      type="text" placeholder="Teléfono" 
                      className="input-field py-2"
                      value={usher.phone || ''} onChange={e => handleRowChange(index, 'phone', e.target.value)}
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => handleRemoveRow(index)}
                  className="absolute -top-3 -right-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 p-1.5 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                  title="Eliminar fila"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={handleFinalSubmit}
              disabled={loading} 
              className="btn-primary w-full shadow-primary-500/30 shadow-lg py-3 text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Guardar Registros'}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
