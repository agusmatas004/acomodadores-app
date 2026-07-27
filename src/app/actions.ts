'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getExistingUshers(province: string, circuit: string, congregation: string, captainName: string) {
  // Limpiamos los inputs para evitar problemas de mayúsculas/minúsculas y espacios
  const p = province.trim().toLowerCase()
  const c = circuit.trim().toLowerCase()
  const cong = congregation.trim().toLowerCase()
  const cap = captainName.trim().toLowerCase()

  const { data, error } = await supabaseAdmin
    .from('ushers')
    .select('*')
    // Usamos ilike para búsquedas case-insensitive en Supabase
    .ilike('province', p)
    .ilike('circuit', c)
    .ilike('congregation', cong)
    .ilike('captain_name', cap)
    .order('day', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching ushers:', error)
    return []
  }

  return data || []
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
