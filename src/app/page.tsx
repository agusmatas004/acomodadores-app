import PublicForm from '@/components/PublicForm'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[#f8fafc]">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Formulario del Capitán
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Complete los detalles de su congregación y asigne a los acomodadores para el servicio.
          </p>
        </div>

        <PublicForm />

        <div className="mt-8 text-center pb-8">
          <Link href="/admin" className="text-xs text-slate-400 hover:text-primary-600 transition-colors font-medium">
            Acceso Administración
          </Link>
        </div>
      </div>
    </main>
  )
}
