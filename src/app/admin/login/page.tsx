'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, Mail, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg('Credenciales incorrectas. Intenta de nuevo.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      
      {/* Background Orbs (Glassmorphism effect) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute top-[40%] left-[60%] w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-4000"></div>

      <div className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 p-10 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary-500 to-primary-700 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary-900/50 border border-white/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Acceso Restringido</h1>
          <p className="text-slate-300 text-sm mt-2 font-medium">Sistema de Gestión de Acomodadores</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 text-red-200 p-4 rounded-xl text-sm mb-6 border border-red-500/20 backdrop-blur-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                required
                type="email" 
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:bg-slate-900/80 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all text-white placeholder-slate-500" 
                placeholder="admin@asamblea.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                required
                type="password" 
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:bg-slate-900/80 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all text-white placeholder-slate-500" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary-600" /> : 'Ingresar al Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
