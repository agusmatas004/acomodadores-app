'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getExistingUshers(province: string, circuit: string, congregation: string, captainName: string) {
  // Limpiamos los inputs para evitar problemas de mayúsculas/minúsculas y espacios
  const p = province.trim()
  const c = circuit.trim()
  const cong = congregation.trim()
  const cap = captainName.trim()

  const { data, error } = await supabaseAdmin
    .from('ushers')
    .select('*')
    .order('day', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching ushers:', error)
    return []
  }

  const removeAccents = (str: string | null | undefined) => 
    (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

  const filteredData = (data || []).filter(u => 
    removeAccents(u.province) === removeAccents(p) &&
    removeAccents(u.circuit) === removeAccents(c) &&
    removeAccents(u.congregation) === removeAccents(cong) &&
    removeAccents(u.captain_name) === removeAccents(cap)
  )

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
