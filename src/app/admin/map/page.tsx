'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, LayoutDashboard, Settings, MapPin, User, ChevronRight, Edit2, Trash2, Crosshair, Plus } from 'lucide-react'

type Sector = {
  id: string
  name: string
  manager_name: string
  auxiliary_name: string
  color: string
  pos_x: number
  pos_y: number
}

export default function StadiumMapPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)
  const [repositioningId, setRepositioningId] = useState<string | null>(null)
  
  // States para Edición/Añadir
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Sector>>({})
  
  const mapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
        return
      }
      fetchSectors()
    }
    checkAuth()

    const channel = supabase.channel('stadium_sectors_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stadium_sectors' }, () => {
        fetchSectors()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router])

  const fetchSectors = async () => {
    const { data } = await supabase.from('stadium_sectors').select('*').order('created_at', { ascending: true })
    if (data) {
      setSectors(data)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleMapClick = async (e: React.MouseEvent) => {
    if (!repositioningId || !mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    await supabase.from('stadium_sectors').update({ pos_x: x, pos_y: y }).eq('id', repositioningId)
    setRepositioningId(null)
  }

  const handleSave = async () => {
    if (isAdding) {
      const newSector = { ...formData, pos_x: 50, pos_y: 50, color: formData.color || 'bg-primary-500' }
      await supabase.from('stadium_sectors').insert([newSector])
      setIsAdding(false)
    } else if (editingId) {
      await supabase.from('stadium_sectors').update(formData).eq('id', editingId)
      setEditingId(null)
    }
    setFormData({})
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este sector?')) {
      await supabase.from('stadium_sectors').delete().eq('id', id)
      if (selectedSector === id) setSelectedSector(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary-500 to-primary-700 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-primary-500/30">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Panel de Administración</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-full hover:bg-primary-50" title="Configuración">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200"></div>
            <button 
              onClick={handleLogout}
              className="text-sm font-semibold text-slate-600 hover:text-red-600 flex items-center transition-all bg-white hover:bg-red-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-red-100 shadow-sm hover:shadow"
            >
              <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mapa de Sectores</h2>
            <p className="text-slate-500 text-sm mt-1">
              Visualiza y administra a los hombres claves del estadio. 
              {repositioningId && <span className="text-amber-600 font-bold ml-2">Haz clic en el mapa para posicionar el pin.</span>}
            </p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl">
            <button onClick={() => router.push('/admin')} className="px-5 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              Tabla de Turnos
            </button>
            <button className="px-5 py-2 bg-white shadow-sm rounded-lg text-sm font-bold text-primary-700">
              Mapa del Estadio
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
          {/* MAPA */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
            <div 
              ref={mapRef}
              onClick={handleMapClick}
              className={`flex-1 relative bg-slate-100 overflow-hidden ${repositioningId ? 'cursor-crosshair' : ''}`}
            >
              {/* Imagen del mapa */}
              <img 
                src="/stadium-map.jpg" 
                alt="Mapa del Estadio" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/1200x800/e2e8f0/64748b?text=Por+favor+sube+stadium-map.jpg+a+la+carpeta+public'
                }}
              />

              {/* Pines */}
              {sectors.map((sector) => (
                <button
                  key={sector.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!repositioningId) setSelectedSector(sector.id)
                  }}
                  className={`absolute w-8 h-8 -ml-4 -mt-8 flex flex-col items-center group transition-all transform ${selectedSector === sector.id ? 'scale-125 z-20' : 'hover:scale-110 z-10'} ${repositioningId === sector.id ? 'animate-bounce' : ''}`}
                  style={{ left: `${sector.pos_x}%`, top: `${sector.pos_y}%` }}
                >
                  <MapPin className={`w-8 h-8 drop-shadow-md ${sector.color ? sector.color.replace('bg-', 'text-') : 'text-primary-500'}`} fill="currentColor" />
                  
                  {/* Tooltip */}
                  <div className="absolute top-full mt-1 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                    {sector.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DIRECTORIO LATERAL */}
          <div className="w-full lg:w-[400px] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center">
                <User className="w-4 h-4 mr-2 text-primary-500" />
                Hombres Clave
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(true)
                  setEditingId(null)
                  setFormData({ name: '', manager_name: '', auxiliary_name: '', color: 'bg-primary-500' })
                }}
                className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors" title="Añadir Sector"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isAdding && (
                <div className="p-4 rounded-2xl border bg-white border-primary-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-sm text-primary-700 mb-2">Nuevo Sector</h4>
                  <input type="text" placeholder="Nombre del Sector" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input type="text" placeholder="Encargado (Hombre Clave)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={formData.manager_name || ''} onChange={e => setFormData({...formData, manager_name: e.target.value})} />
                  <input type="text" placeholder="Auxiliar (Opcional)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={formData.auxiliary_name || ''} onChange={e => setFormData({...formData, auxiliary_name: e.target.value})} />
                  
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} className="flex-1 bg-primary-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-primary-700">Guardar</button>
                    <button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-100 text-slate-600 font-semibold py-2 rounded-lg text-xs hover:bg-slate-200">Cancelar</button>
                  </div>
                </div>
              )}

              {sectors.map((sector) => (
                <div 
                  key={sector.id}
                  onClick={() => {
                    if (editingId !== sector.id) {
                      setSelectedSector(sector.id)
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all ${selectedSector === sector.id ? 'bg-primary-50 border-primary-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'} ${editingId !== sector.id ? 'cursor-pointer' : ''}`}
                >
                  {editingId === sector.id ? (
                    <div className="space-y-3">
                      <input type="text" placeholder="Nombre del Sector" className="w-full px-3 py-2 bg-white border border-primary-300 rounded-lg text-sm outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                      <input type="text" placeholder="Encargado" className="w-full px-3 py-2 bg-white border border-primary-300 rounded-lg text-sm outline-none" value={formData.manager_name || ''} onChange={e => setFormData({...formData, manager_name: e.target.value})} />
                      <input type="text" placeholder="Auxiliar" className="w-full px-3 py-2 bg-white border border-primary-300 rounded-lg text-sm outline-none" value={formData.auxiliary_name || ''} onChange={e => setFormData({...formData, auxiliary_name: e.target.value})} />
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleSave} className="flex-1 bg-primary-600 text-white font-semibold py-1.5 rounded-lg text-xs hover:bg-primary-700">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 text-slate-700 font-semibold py-1.5 rounded-lg text-xs hover:bg-slate-300">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${sector.color || 'bg-primary-500'}`}></div>
                            <h4 className="font-bold text-sm text-slate-900">{sector.name}</h4>
                          </div>
                          <div className="text-sm font-medium text-slate-700 pl-4">
                            Encargado: <span className="text-primary-700 font-bold">{sector.manager_name}</span>
                          </div>
                          {sector.auxiliary_name && (
                            <div className="text-xs text-slate-500 pl-4 mt-0.5">
                              Auxiliar: {sector.auxiliary_name}
                            </div>
                          )}
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${selectedSector === sector.id ? 'rotate-90 text-primary-400' : ''}`} />
                      </div>

                      {selectedSector === sector.id && (
                        <div className="mt-4 pt-3 border-t border-slate-200/60 pl-4 flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setRepositioningId(sector.id); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Crosshair className="w-3.5 h-3.5" /> Posición
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingId(sector.id); setFormData(sector); }}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(sector.id); }}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
