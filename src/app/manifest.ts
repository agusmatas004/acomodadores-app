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
        src: 'https://placehold.co/192x192/9333ea/ffffff.png?text=A',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/9333ea/ffffff.png?text=A',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
