import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Acomodadores Asamblea',
    short_name: 'Acomodadores',
    description: 'Sistema de Gestión de Acomodadores y Turnos',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#9333ea',
    icons: [
      {
        src: '/app-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
