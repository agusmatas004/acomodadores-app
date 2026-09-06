'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

// Normalizador flexible: quita acentos, signos de puntuación, pasa a minúsculas y colapsa espacios
function normalize(str: string | null | undefined): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Quita signos de puntuación (puntos, comas, guiones)
    .replace(/\s+/g, ' ') // Colapsa múltiples espacios
    .trim()
}

// Versión compacta sin espacios para comparar por ejemplo "circuito 4" con "circuito4" o "Bs As"
function compact(str: string | null | undefined): string {
  return normalize(str).replace(/\s+/g, '')
}

export async function getExistingUshers(province: string, circuit: string, congregation: string, captainName: string) {
  const normP = normalize(province)
  const normC = normalize(circuit)
  const normCong = normalize(congregation)
  const normCap = normalize(captainName)

  const compP = compact(province)
  const compC = compact(circuit)
  const compCong = compact(congregation)
  const compCap = compact(captainName)

  const { data, error } = await supabaseAdmin
    .from('ushers')
    .select('*')
    .order('day', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching ushers:', error)
    return []
  }

  // Filtrado super tolerante:
  // 1. Coincidencia por texto normalizado o compacto en congregación y circuito
  // 2. Coincidencia en provincia (o si contiene el texto)
  // 3. Coincidencia en nombre de capitán (exacto normalizado, compacto, o si coincide apellido/nombre principal)
  const filteredData = (data || []).filter(u => {
    const uNormP = normalize(u.province)
    const uNormC = normalize(u.circuit)
    const uNormCong = normalize(u.congregation)
    const uNormCap = normalize(u.captain_name)

    const uCompP = compact(u.province)
    const uCompC = compact(u.circuit)
    const uCompCong = compact(u.congregation)
    const uCompCap = compact(u.captain_name)

    // Match de Congregación (ej: "Palermo" = "palermo", o "Congregación Palermo")
    const matchCong = uNormCong === normCong || uCompCong === compCong || 
                      uNormCong.includes(normCong) || normCong.includes(uNormCong)

    // Match de Circuito (ej: "4", "Circuito 4", "circuito-4")
    const matchCirc = uNormC === normC || uCompC === compC ||
                      uCompC.replace('circuito', '') === compC.replace('circuito', '')

    // Match de Provincia (ej: "Buenos Aires", "buenos aires", "BS AS")
    const matchProv = uNormP === normP || uCompP === compP ||
                      uNormP.includes(normP) || normP.includes(uNormP)

    // Match de Capitán (ej: "Juan Pérez", "juan perez", o palabras clave coincidentes)
    const capWords = normCap.split(' ').filter(w => w.length > 2)
    const uCapWords = uNormCap.split(' ').filter(w => w.length > 2)
    const hasSharedWord = capWords.some(w => uCapWords.includes(w))
    const matchCap = uNormCap === normCap || uCompCap === compCap || hasSharedWord

    return matchCong && matchCirc && matchProv && matchCap
  })

  return filteredData
}

export async function saveUshers(ushersToInsert: any[]) {
  if (!ushersToInsert || ushersToInsert.length === 0) return { success: true }

  const { data, error } = await supabaseAdmin
    .from('ushers')
    .insert(ushersToInsert)
    .select()

  if (error) {
    console.error('Error saving ushers:', error)
    throw new Error('No se pudieron guardar los datos: ' + error.message)
  }

  return { success: true, data }
}

export async function updateUsher(id: string, usherData: {
  usher_name: string
  sector?: string
  day: string
  start_time: string
  end_time: string
  phone?: string
}) {
  if (!id) throw new Error('ID no válido')

  const uppercased = {
    usher_name: usherData.usher_name.trim().toUpperCase(),
    sector: (usherData.sector || '').trim().toUpperCase(),
    day: usherData.day,
    start_time: usherData.start_time,
    end_time: usherData.end_time,
    phone: (usherData.phone || '').trim()
  }

  const { error } = await supabaseAdmin
    .from('ushers')
    .update(uppercased)
    .eq('id', id)

  if (error) {
    console.error('Error updating usher:', error)
    throw new Error('No se pudo actualizar el acomodador: ' + error.message)
  }

  return { success: true }
}

export async function deleteUsher(id: string) {
  if (!id) throw new Error('ID no válido')

  const { error } = await supabaseAdmin
    .from('ushers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting usher:', error)
    throw new Error('No se pudo eliminar el acomodador: ' + error.message)
  }

  return { success: true }
}

export async function updateUshersBaseInfo(usherIds: string[], newBaseInfo: { province: string, circuit: string, congregation: string, captain_name: string }) {
  if (!usherIds || usherIds.length === 0) return { success: true }
  
  const uppercased = {
    province: newBaseInfo.province.trim().toUpperCase(),
    circuit: newBaseInfo.circuit.trim().toUpperCase(),
    congregation: newBaseInfo.congregation.trim().toUpperCase(),
    captain_name: newBaseInfo.captain_name.trim().toUpperCase(),
  }

  const { error } = await supabaseAdmin
    .from('ushers')
    .update(uppercased)
    .in('id', usherIds)

  if (error) {
    console.error('Error updating ushers base info:', error)
    throw new Error('No se pudieron actualizar los datos: ' + error.message)
  }

  return { success: true }
}
