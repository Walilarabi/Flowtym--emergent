/**
 * CRM Service — Supabase
 * CRUD operations for guests, history, preferences
 */
import { supabase } from '@/lib/supabase'

export const crmService = {
  // ─── GUESTS ───
  async getGuests(hotelId, { search, status, limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from('guests')
      .select('*', { count: 'exact' })
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
    if (error) throw error
    return { guests: data || [], total: count || 0 }
  },

  async getGuestById(guestId) {
    const { data, error } = await supabase
      .from('guests')
      .select('*, guest_history(*), guest_preferences(*)')
      .eq('id', guestId)
      .single()
    if (error) throw error
    return data
  },

  async createGuest(guestData) {
    const { data, error } = await supabase
      .from('guests')
      .insert(guestData)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateGuest(guestId, updates) {
    const { data, error } = await supabase
      .from('guests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', guestId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteGuest(guestId) {
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId)
    if (error) throw error
  },

  // ─── HISTORY ───
  async getGuestHistory(guestId) {
    const { data, error } = await supabase
      .from('guest_history')
      .select('*')
      .eq('guest_id', guestId)
      .order('stay_start', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addGuestHistory(historyData) {
    const { data, error } = await supabase
      .from('guest_history')
      .insert(historyData)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ─── PREFERENCES ───
  async getGuestPreferences(guestId) {
    const { data, error } = await supabase
      .from('guest_preferences')
      .select('*')
      .eq('guest_id', guestId)
    if (error) throw error
    return data || []
  },

  async setGuestPreference(guestId, type, value) {
    const { data, error } = await supabase
      .from('guest_preferences')
      .upsert({ guest_id: guestId, preference_type: type, preference_value: value }, { onConflict: 'guest_id,preference_type' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ─── STATS ───
  async getGuestStats(hotelId) {
    const { data, error } = await supabase
      .from('guests')
      .select('id, total_stays, total_spent, status')
      .eq('hotel_id', hotelId)

    if (error) throw error
    const guests = data || []
    return {
      total: guests.length,
      active: guests.filter(g => g.status === 'active').length,
      totalRevenue: guests.reduce((sum, g) => sum + (g.total_spent || 0), 0),
      avgSpend: guests.length > 0 ? guests.reduce((sum, g) => sum + (g.total_spent || 0), 0) / guests.length : 0,
      returningRate: guests.length > 0 ? Math.round((guests.filter(g => g.total_stays > 1).length / guests.length) * 100) : 0,
    }
  },
}
