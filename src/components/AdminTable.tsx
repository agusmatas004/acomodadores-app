'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Download, Edit2, Trash2, Search, Check, X, Filter, User, MapPin, Plus } from 'lucide-react'
import * as XLSX from 'xlsx'

type UsherData = {
  id: string
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
  created_at: string
}

const DAYS = ['Viernes', 'Sábado', 'Domingo']

const DAY_ORDER: Record<string, number> = {
  'viernes': 1,
  'sábado': 2,
  'sabado': 2,
  'domingo': 3
}

export default function AdminTable() {
  const [data, setData] = useState<UsherData[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filterProv, setFilterProv] = useState('')
  const [filterCirc, setFilterCirc] = useState('')
  const [filterCong, setFilterCong] = useState('')
  const [filterDay, setFilterDay] = useState('')
  
  // Edición
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<UsherData>>({})

  // Añadir
  const [isAdding, setIsAdding] = useState(false)
  const [newRowData, setNewRowData] = useState<Partial<UsherData>>({
    usher_name: '', sector: '', day: 'Viernes', start_time: '08:00', end_time: '10:00', 
    province: '', circuit: '', congregation: '', captain_name: '', phone: ''
  })

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('public:ushers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ushers' }, (payload) => {
        fetchData()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchData = async () => {
    const { data: ushers, error } = await supabase.from('ushers').select('*')
    if (!error) setData(ushers || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro permanentemente?')) return
    await supabase.from('ushers').delete().eq('id', id)
  }

  const handleEditClick = (usher: UsherData) => {
    setIsAdding(false)
    setEditingId(usher.id)
    setEditFormData(usher)
  }

  const handleEditSave = async () => {
    if (!editingId) return
    const uppercasedData = {
      ...editFormData,
      province: editFormData.province?.trim().toUpperCase(),
      circuit: editFormData.circuit?.trim().toUpperCase(),
      congregation: editFormData.congregation?.trim().toUpperCase(),
      captain_name: editFormData.captain_name?.trim().toUpperCase(),
      usher_name: editFormData.usher_name?.trim().toUpperCase(),
      sector: editFormData.sector?.trim().toUpperCase(),
    }
    const { error } = await supabase.from('ushers').update(uppercasedData).eq('id', editingId)
    if (!error) setEditingId(null)
  }

  const handleAddNewSave = async () => {
    const uppercasedData = {
      ...newRowData,
      province: newRowData.province?.trim().toUpperCase(),
      circuit: newRowData.circuit?.trim().toUpperCase(),
      congregation: newRowData.congregation?.trim().toUpperCase(),
      captain_name: newRowData.captain_name?.trim().toUpperCase(),
      usher_name: newRowData.usher_name?.trim().toUpperCase(),
      sector: newRowData.sector?.trim().toUpperCase(),
    }
    const { error } = await supabase.from('ushers').insert([uppercasedData])
    if (!error) {
      setIsAdding(false)
    } else {
      alert('Error al añadir: ' + error.message)
    }
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(u => ({
      Provincia: u.province,
      Circuito: u.circuit,
      Congregación: u.congregation,
      Acomodador: u.usher_name,
      Sector: u.sector || '',
      Día: u.day,
      Inicio: u.start_time.substring(0,5),
      Fin: u.end_time.substring(0,5),
      Teléfono: u.phone || ''
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Acomodadores")
    XLSX.writeFile(wb, "Turnos_Acomodadores.xlsx")
  }

  const filteredData = useMemo(() => {
    return data
      .filter(u => 
        u.province.toLowerCase().includes(filterProv.toLowerCase()) &&
        u.circuit.toLowerCase().includes(filterCirc.toLowerCase()) &&
        u.congregation.toLowerCase().includes(filterCong.toLowerCase()) &&
        (filterDay === '' || u.day === filterDay)
      )
      .sort((a, b) => {
        // Ordenar primero por día (Viernes, Sábado, Domingo)
        const dayA = DAY_ORDER[a.day.toLowerCase()] || 99
        const dayB = DAY_ORDER[b.day.toLowerCase()] || 99
        if (dayA !== dayB) return dayA - dayB
        
        // Luego por horario de inicio
        return a.start_time.localeCompare(b.start_time)
      })
  }, [data, filterProv, filterCirc, filterCong, filterDay])

  const getBadgeClass = (day: string) => {
    switch(day.toLowerCase()) {
      case 'viernes': return 'badge-viernes'
      case 'sábado':
      case 'sabado': return 'badge-sabado'
      case 'domingo': return 'badge-domingo'
      default: return 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium'
    }
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium">Sincronizando datos...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      
      {/* Filters Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input 
              type="text" placeholder="Filtrar Provincia" 
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all w-full sm:w-44 placeholder-slate-400 font-medium text-slate-700"
              value={filterProv} onChange={e => setFilterProv(e.target.value)}
            />
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input 
              type="text" placeholder="Circuito" 
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all w-full sm:w-36 placeholder-slate-400 font-medium text-slate-700"
              value={filterCirc} onChange={e => setFilterCirc(e.target.value)}
            />
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input 
              type="text" placeholder="Congregación" 
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all w-full sm:w-44 placeholder-slate-400 font-medium text-slate-700"
              value={filterCong} onChange={e => setFilterCong(e.target.value)}
            />
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <select 
              className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all w-full sm:w-40 font-medium text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-no-repeat"
              value={filterDay} onChange={e => setFilterDay(e.target.value)}
            >
              <option value="">Todos los Días</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="btn-primary py-2.5 px-4 text-sm shrink-0">
            <Plus className="w-4 h-4 mr-1.5" /> Añadir Manual
          </button>
          <button onClick={exportToExcel} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 flex items-center justify-center text-sm shrink-0">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider min-w-[220px]">Acomodador</th>
              <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider min-w-[140px]">Sector</th>
              <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider min-w-[160px]">Turno Asignado</th>
              <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider min-w-[180px]">Congregación</th>
              <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider min-w-[160px]">Circuito & Prov.</th>
              <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider min-w-[180px]">Capitán</th>
              <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-center min-w-[120px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            
            {/* Fila de Añadir Nuevo */}
            {isAdding && (
              <tr className="bg-emerald-50/50 relative z-20 shadow-[0_0_15px_rgba(0,0,0,0.05)] ring-1 ring-emerald-200">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <input type="text" placeholder="Nombre Acomodador" className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium" value={newRowData.usher_name} onChange={e => setNewRowData({...newRowData, usher_name: e.target.value})} />
                    <input type="text" placeholder="Teléfono" className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.phone} onChange={e => setNewRowData({...newRowData, phone: e.target.value})} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input type="text" placeholder="Sector" className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.sector} onChange={e => setNewRowData({...newRowData, sector: e.target.value})} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <select className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.day} onChange={e => setNewRowData({...newRowData, day: e.target.value})}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input type="time" className="w-full px-2 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.start_time} onChange={e => setNewRowData({...newRowData, start_time: e.target.value})} />
                      <input type="time" className="w-full px-2 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.end_time} onChange={e => setNewRowData({...newRowData, end_time: e.target.value})} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input type="text" placeholder="Congregación" className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.congregation} onChange={e => setNewRowData({...newRowData, congregation: e.target.value})} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <input type="text" placeholder="Circuito" className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.circuit} onChange={e => setNewRowData({...newRowData, circuit: e.target.value})} />
                    <input type="text" placeholder="Provincia" className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.province} onChange={e => setNewRowData({...newRowData, province: e.target.value})} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input type="text" placeholder="Capitán" className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newRowData.captain_name} onChange={e => setNewRowData({...newRowData, captain_name: e.target.value})} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={handleAddNewSave} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-all shadow-md shadow-emerald-500/20"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsAdding(false)} className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 p-2 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )}

            {filteredData.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-base">No se encontraron acomodadores</p>
                  <p className="text-slate-400 text-sm mt-1">Prueba ajustando los filtros de búsqueda.</p>
                </td>
              </tr>
            ) : filteredData.map(row => {
              const isEditing = editingId === row.id
              
              if (isEditing) {
                return (
                  <tr key={row.id} className="bg-primary-50/50 relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] ring-1 ring-primary-100">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <input type="text" className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium" value={editFormData.usher_name} onChange={e => setEditFormData({...editFormData, usher_name: e.target.value})} />
                        <input type="text" placeholder="Teléfono" className="w-full px-3 py-1.5 bg-white border border-primary-200 rounded-lg text-xs text-slate-500 focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" placeholder="Sector" className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.sector} onChange={e => setEditFormData({...editFormData, sector: e.target.value})} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <select className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.day} onChange={e => setEditFormData({...editFormData, day: e.target.value})}>
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <input type="time" className="w-full px-2 py-1.5 bg-white border border-primary-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.start_time} onChange={e => setEditFormData({...editFormData, start_time: e.target.value})} />
                          <input type="time" className="w-full px-2 py-1.5 bg-white border border-primary-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.end_time} onChange={e => setEditFormData({...editFormData, end_time: e.target.value})} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.congregation} onChange={e => setEditFormData({...editFormData, congregation: e.target.value})} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <input type="text" placeholder="Circuito" className="w-full px-3 py-1.5 bg-white border border-primary-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.circuit} onChange={e => setEditFormData({...editFormData, circuit: e.target.value})} />
                        <input type="text" placeholder="Provincia" className="w-full px-3 py-1.5 bg-white border border-primary-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.province} onChange={e => setEditFormData({...editFormData, province: e.target.value})} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={editFormData.captain_name} onChange={e => setEditFormData({...editFormData, captain_name: e.target.value})} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={handleEditSave} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-all shadow-md shadow-emerald-500/20"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 p-2 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 border border-primary-100 flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(row.usher_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{row.usher_name}</div>
                        {row.phone && <div className="text-slate-400 text-xs mt-0.5">{row.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{row.sector || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={getBadgeClass(row.day)}>{row.day}</span>
                      <span className="text-slate-500 text-xs font-medium px-1">
                        {row.start_time.substring(0,5)} - {row.end_time.substring(0,5)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{row.congregation}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 font-medium text-sm">{row.circuit}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{row.province}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0 mr-2 border border-slate-200">
                        {getInitials(row.captain_name)}
                      </div>
                      {row.captain_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(row)} className="text-slate-400 hover:text-primary-600 p-2 rounded-xl hover:bg-primary-50 transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400 font-medium">Actualización en tiempo real activa</p>
        <p className="text-xs text-slate-500 font-semibold bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
          Total: <span className="text-primary-600">{filteredData.length}</span> acomodadores
        </p>
      </div>

    </div>
  )
}
