'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, Loader2, Clock, Users, ClipboardList, FileText } from 'lucide-react'
import { getExistingUshers, saveUshers } from '@/app/actions'
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

export default function PublicForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [baseInfo, setBaseInfo] = useState({
    captain_name: '',
    province: '',
    circuit: '',
    congregation: '',
  })

  const [existingUshers, setExistingUshers] = useState<UsherData[]>([])
  const [newUshers, setNewUshers] = useState<Partial<UsherData>[]>([])

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
      setNewUshers([{ usher_name: '', sector: '', day: 'Viernes', start_time: '08:00', end_time: '10:00', phone: '' }])
      setStep(2)
    } catch (err: any) {
      setErrorMsg('Error al verificar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRow = () => {
    setNewUshers([
      ...newUshers,
      { usher_name: '', sector: '', day: 'Viernes', start_time: '08:00', end_time: '10:00', phone: '' }
    ])
  }

  const handleRemoveRow = (index: number) => {
    setNewUshers(newUshers.filter((_, i) => i !== index))
  }

  const handleRowChange = (index: number, field: keyof UsherData, value: string) => {
    const updated = [...newUshers]
    updated[index] = { ...updated[index], [field]: value }
    setNewUshers(updated)
  }

  const handleFinalSubmit = async () => {
    const validUshers = newUshers.filter(u => u.usher_name?.trim() !== '')
    if (validUshers.length === 0) {
      setErrorMsg('Debes ingresar al menos un acomodador.')
      return
    }

    const dataToInsert = validUshers.map(u => ({
      province: baseInfo.province.trim().toUpperCase(),
      circuit: baseInfo.circuit.trim().toUpperCase(),
      congregation: baseInfo.congregation.trim().toUpperCase(),
      captain_name: baseInfo.captain_name.trim().toUpperCase(),
      usher_name: (u.usher_name || '').trim().toUpperCase(),
      sector: (u.sector || '').trim().toUpperCase(),
      day: u.day,
      start_time: u.start_time,
      end_time: u.end_time,
      phone: u.phone || ''
    }))

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
    const submittedData = validUshers.map(u => ({
      ...baseInfo,
      province: baseInfo.province.trim().toUpperCase(),
      circuit: baseInfo.circuit.trim().toUpperCase(),
      congregation: baseInfo.congregation.trim().toUpperCase(),
      captain_name: baseInfo.captain_name.trim().toUpperCase(),
      usher_name: (u.usher_name || '').trim().toUpperCase(),
      sector: (u.sector || '').trim().toUpperCase(),
      day: u.day,
      start_time: u.start_time,
      end_time: u.end_time,
      phone: u.phone || ''
    }))
    
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
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {errorMsg}
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
            <div className="mt-8">
              <button disabled={loading} type="submit" className="btn-primary w-full">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Siguiente Paso'}
              </button>
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
            <button onClick={handleAddRow} className="btn-primary py-2 px-4 text-sm w-full sm:w-auto shrink-0">
              <Plus className="w-4 h-4 mr-1.5" /> AÑADIR ACOMODADOR
            </button>
          </div>

          {existingUshers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-3 uppercase flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Cargados previamente
              </h3>
              <div className="grid gap-2">
                {existingUshers.map((u, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm">
                    <span className="font-semibold text-slate-800 min-w-[120px]">{u.usher_name}</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${u.day.toLowerCase() === 'viernes' ? 'bg-emerald-100 text-emerald-700' : u.day.toLowerCase() === 'domingo' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {u.day}
                    </span>
                    <span className="text-slate-500 flex items-center text-xs">
                      <Clock className="w-3.5 h-3.5 mr-1" /> {u.start_time.substring(0,5)} - {u.end_time.substring(0,5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Nuevos Registros</h3>
            {newUshers.map((usher, index) => (
              <div key={index} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 relative group transition-colors hover:border-primary-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-12">
                    <input 
                      type="text" placeholder="Nombre completo del acomodador" 
                      className="input-field py-2"
                      value={usher.usher_name} onChange={e => handleRowChange(index, 'usher_name', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-12">
                    <input 
                      type="text" placeholder="Sector (Ej: Plataforma, Estacionamiento, Entradas...)" 
                      className="input-field py-2"
                      value={usher.sector} onChange={e => handleRowChange(index, 'sector', e.target.value)}
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <select 
                      className="input-field py-2"
                      value={usher.day} onChange={e => handleRowChange(index, 'day', e.target.value)}
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <select 
                      className="input-field py-2"
                      value={usher.start_time} onChange={e => handleRowChange(index, 'start_time', e.target.value)}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  <div className="md:col-span-3">
                    <select 
                      className="input-field py-2"
                      value={usher.end_time} onChange={e => handleRowChange(index, 'end_time', e.target.value)}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  <div className="md:col-span-3">
                    <input 
                      type="text" placeholder="Teléfono" 
                      className="input-field py-2"
                      value={usher.phone} onChange={e => handleRowChange(index, 'phone', e.target.value)}
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
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Guardar Registros'}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
