/**
 * useHousekeepingV2 - Hook Supabase Realtime pour Housekeeping
 * Remplace l'ancien NestJS WebSocket par Supabase postgres_changes
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useHotel } from '@/context/HotelContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { showCleaningCompletedToast } from '@/components/housekeeping/HousekeepingNotifications'

export function useHousekeepingV2() {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id
  const channelRef = useRef(null)
  
  const [data, setData] = useState({
    stats: null,
    tasks: [],
    rooms: [],
    staff: [],
    inspections: [],
    notifications: [],
    loading: true,
    error: null,
    connected: false,
    soundEnabled: true,
  })

  // Fetch all data from Supabase
  const fetchData = useCallback(async () => {
    if (!hotelId) return
    
    setData(d => ({ ...d, loading: true, error: null }))
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const [roomsRes, tasksRes, staffRes, inspectionsRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('hotel_id', hotelId).eq('is_active', true).order('room_number'),
        supabase.from('room_cleaning_tasks').select('*, rooms(room_number, room_type, status)').eq('hotel_id', hotelId).eq('scheduled_date', today).order('priority', { ascending: false }),
        supabase.from('users').select('*').eq('hotel_id', hotelId).in('role', ['femme_de_chambre', 'gouvernante', 'maintenance']).eq('is_active', true),
        supabase.from('inspections').select('*, rooms(room_number)').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(20),
      ])

      if (roomsRes.error) console.error('Rooms error:', roomsRes.error)
      if (tasksRes.error) console.error('Tasks error:', tasksRes.error)
      if (staffRes.error) console.error('Staff error:', staffRes.error)

      const rooms = (roomsRes.data || []).map(room => ({
        ...room,
        _id: room.id,
        number: room.room_number,
        room_number: room.room_number,
        type: room.room_type,
        cleaning_status: 'none',
      }))

      const tasks = (tasksRes.data || []).map(task => ({
        ...task,
        _id: task.id,
        room_number: task.rooms?.room_number || 'N/A',
        room_type: task.rooms?.room_type || '',
        type: task.cleaning_type,
      }))

      const staff = (staffRes.data || []).map(s => ({
        ...s,
        _id: s.id,
        name: `${s.first_name} ${s.last_name}`,
      }))

      const inspections = (inspectionsRes.data || []).map(i => ({
        ...i,
        _id: i.id,
        room_number: i.rooms?.room_number || 'N/A',
      }))

      // Compute stats - format matching ReceptionViewV2 expectations
      const departsCount = tasks.filter(t => t.cleaning_type === 'depart').length
      const recouchesCount = tasks.filter(t => t.cleaning_type === 'recouche').length
      const pending = tasks.filter(t => t.status === 'a_faire').length
      const inProgress = tasks.filter(t => t.status === 'en_cours').length
      const completed = tasks.filter(t => t.status === 'termine').length
      const refused = tasks.filter(t => t.status === 'refuse').length
      const cleanRooms = rooms.filter(r => r.status === 'libre' || r.status === 'inspectee').length

      const stats = {
        rooms: {
          total: rooms.length,
          libre: rooms.filter(r => r.status === 'libre').length,
          occupee: rooms.filter(r => r.status === 'occupee').length,
          en_nettoyage: rooms.filter(r => r.status === 'en_nettoyage').length,
          inspectee: rooms.filter(r => r.status === 'inspectee').length,
          maintenance: rooms.filter(r => r.status === 'maintenance' || r.status === 'bloquee').length,
        },
        tasks: {
          total: tasks.length,
          a_faire: pending,
          en_cours: inProgress,
          termine: completed,
          refuse: refused,
          departs: departsCount,
          recouches: recouchesCount,
        },
        inspections: {
          total: inspections.length,
          en_attente: inspections.filter(i => i.is_approved === null).length,
          validees: inspections.filter(i => i.is_approved === true).length,
          refusees: inspections.filter(i => i.is_approved === false).length,
        },
        occupancy_rate: rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'occupee').length / rooms.length) * 100) : 0,
        cleanliness_rate: rooms.length > 0 ? Math.round((cleanRooms / rooms.length) * 100) : 0,
        completion_rate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
        staff_count: staff.filter(s => s.role === 'femme_de_chambre').length,
        // Flat aliases for backward compatibility
        total_rooms: rooms.length,
        tasks_pending: pending,
        tasks_in_progress: inProgress,
        tasks_completed: completed,
        tasks_total: tasks.length,
      }

      setData(d => ({
        ...d,
        stats,
        tasks,
        rooms,
        staff,
        inspections,
        loading: false,
        error: null,
        connected: true,
      }))
    } catch (error) {
      console.error('Error fetching housekeeping data:', error)
      setData(d => ({ ...d, loading: false, error: error.message }))
    }
  }, [hotelId])

  // Setup Supabase Realtime
  useEffect(() => {
    if (!hotelId) return

    const channel = supabase.channel(`housekeeping-${hotelId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'room_cleaning_tasks', filter: `hotel_id=eq.${hotelId}` },
        (payload) => {
          console.log('Housekeeping Realtime:', payload.eventType, payload)
          fetchData()
          
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'termine') {
            const notification = {
              roomNumber: payload.new.room_id,
              status: 'termine',
              receivedAt: new Date(),
            }
            showCleaningCompletedToast(notification)
            setData(d => ({
              ...d,
              notifications: [{ id: `notif_${Date.now()}`, ...notification }, ...d.notifications].slice(0, 20),
            }))
          }
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `hotel_id=eq.${hotelId}` },
        () => fetchData())
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'inspections', filter: `hotel_id=eq.${hotelId}` },
        () => fetchData())
      .subscribe((status) => {
        console.log('Housekeeping Realtime status:', status)
        setData(d => ({ ...d, connected: status === 'SUBSCRIBED' }))
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [hotelId, fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Actions - using Supabase directly
  const seedData = useCallback(async () => {
    if (!hotelId) return
    try {
      // Run the seed script via backend API
      const API_URL = import.meta.env.VITE_BACKEND_URL || ''
      const res = await fetch(`${API_URL}/api/housekeeping/seed/${hotelId}`, { method: 'POST' })
      if (res.ok) {
        toast.success('Données de démonstration créées')
        fetchData()
      } else {
        toast.error('Erreur lors de la création des données')
      }
    } catch {
      toast.error('Erreur lors de la création des données')
    }
  }, [hotelId, fetchData])

  const startTask = useCallback(async (taskId) => {
    if (!hotelId) return
    try {
      const { error } = await supabase
        .from('room_cleaning_tasks')
        .update({ status: 'en_cours', started_at: new Date().toISOString() })
        .eq('id', taskId)
      
      if (error) throw error
      toast.success('Nettoyage démarré')
      fetchData()
    } catch (error) {
      toast.error('Erreur lors du démarrage')
    }
  }, [hotelId, fetchData])

  const completeTask = useCallback(async (taskId, photosAfter = [], notes = '') => {
    if (!hotelId) return
    try {
      const updateData = {
        status: 'termine',
        completed_at: new Date().toISOString(),
      }
      if (notes) updateData.notes = notes
      if (photosAfter.length > 0) updateData.photos = JSON.stringify(photosAfter)

      const { error } = await supabase
        .from('room_cleaning_tasks')
        .update(updateData)
        .eq('id', taskId)
      
      if (error) throw error
      toast.success('Nettoyage terminé')
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la complétion')
    }
  }, [hotelId, fetchData])

  const assignTasks = useCallback(async (taskIds, staffId, staffName) => {
    if (!hotelId) return
    try {
      const { error } = await supabase
        .from('room_cleaning_tasks')
        .update({ assigned_to: staffId })
        .in('id', taskIds)
      
      if (error) throw error
      toast.success(`${taskIds.length} tâche(s) assignée(s) à ${staffName}`)
      fetchData()
      return { assigned: taskIds.length }
    } catch (error) {
      toast.error("Erreur lors de l'assignation")
    }
  }, [hotelId, fetchData])

  const autoAssign = useCallback(async (strategy = 'balanced') => {
    if (!hotelId) return
    try {
      // Get unassigned tasks
      const unassigned = data.tasks.filter(t => !t.assigned_to && t.status === 'a_faire')
      const femmes = data.staff.filter(s => s.role === 'femme_de_chambre')
      
      if (unassigned.length === 0 || femmes.length === 0) {
        toast.info('Aucune tâche à assigner ou aucun personnel disponible')
        return { assigned: 0 }
      }

      // Simple round-robin assignment
      let assigned = 0
      for (let i = 0; i < unassigned.length; i++) {
        const staff = femmes[i % femmes.length]
        const { error } = await supabase
          .from('room_cleaning_tasks')
          .update({ assigned_to: staff.id })
          .eq('id', unassigned[i].id)
        
        if (!error) assigned++
      }

      toast.success(`${assigned} chambre(s) assignée(s) automatiquement`)
      fetchData()
      return { assigned }
    } catch (error) {
      toast.error("Erreur lors de l'assignation automatique")
    }
  }, [hotelId, data.tasks, data.staff, fetchData])

  const validateInspection = useCallback(async (inspectionId, approved, rating, comments, refusedReason) => {
    if (!hotelId) return
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          is_approved: approved,
          score: rating,
          rejection_reason: refusedReason || null,
        })
        .eq('id', inspectionId)
      
      if (error) throw error
      toast.success(approved ? 'Chambre validée' : 'Chambre refusée')
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la validation')
    }
  }, [hotelId, fetchData])

  // Notification management
  const clearAllNotifications = useCallback(() => {
    setData(d => ({ ...d, notifications: [] }))
  }, [])

  const dismissNotification = useCallback((notificationId) => {
    setData(d => ({
      ...d,
      notifications: d.notifications.filter(n => n.id !== notificationId)
    }))
  }, [])

  const toggleSound = useCallback(() => {
    setData(d => ({ ...d, soundEnabled: !d.soundEnabled }))
  }, [])

  return {
    ...data,
    refresh: fetchData,
    seedData,
    startTask,
    completeTask,
    assignTasks,
    autoAssign,
    validateInspection,
    clearAllNotifications,
    dismissNotification,
    toggleSound,
  }
}

export default useHousekeepingV2
