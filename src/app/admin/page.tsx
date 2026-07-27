'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AdminTable from '@/components/AdminTable'
import { Loader2, LogOut, LayoutDashboard, Settings } from 'lucide-react'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestión de Turnos</h2>
            <p className="text-slate-500 text-sm mt-1">Supervisa, edita y exporta los horarios de los acomodadores en tiempo real.</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl">
            <button className="px-5 py-2 bg-white shadow-sm rounded-lg text-sm font-bold text-primary-700">
              Tabla de Turnos
            </button>
            <button onClick={() => router.push('/admin/map')} className="px-5 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              Mapa del Estadio
            </button>
          </div>
        </div>
        
        <AdminTable />
      </main>
    </div>
  )
}
