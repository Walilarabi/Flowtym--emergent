/**
 * useHousekeepingV2 - Hook pour l'API NestJS Housekeeping V2
 * Utilise l'API /api/v2 avec support WebSocket temps réel
 * Inclut le système de notifications pour gouvernantes
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useHotel } from '@/context/HotelContext'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import axios from 'axios'
import { showCleaningCompletedToast } from '@/components/housekeeping/HousekeepingNotifications'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

export function useHousekeepingV2() {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id
  const socketRef = useRef(null)
  
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

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!hotelId) return
    
    setData(d => ({ ...d, loading: true, error: null }))
    const token = localStorage.getItem('flowtym_token')
    const headers = { Authorization: `Bearer ${token}` }
    
    try {
      const [statsRes, tasksRes, roomsRes, staffRes, inspectionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/tasks`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/rooms`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/staff?role=femme_de_chambre`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/inspections`, { headers }).catch(() => ({ data: [] })),
      ])
      
      setData(d => ({
        ...d,
        stats: statsRes.data,
        tasks: tasksRes.data || [],
        // Normalize room data: API returns 'number' but frontend expects 'room_number'
        rooms: (roomsRes.data || []).map(room => ({
          ...room,
          room_number: room.room_number || room.number || room._id,
          cleaning_status: room.cleaning_status || 'none',
          status: room.status || 'libre',
        })),
        staff: staffRes.data || [],
        inspections: inspectionsRes.data || [],
        loading: false,
        error: null,
        connected: true, // Mark as connected since HTTP API works
      }))
    } catch (error) {
      console.error('Error fetching housekeeping V2 data:', error)
      setData(d => ({ ...d, loading: false, error: error.message }))
    }
  }, [hotelId])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!hotelId) return

    // For now, mark as "connected" if data loads successfully
    // WebSocket via proxy is not yet configured
    // Full WebSocket will work when NestJS is exposed directly
    
    // Try WebSocket connection (may fail due to proxy)
    try {
      const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
      socketRef.current = io(`${wsUrl}/housekeeping`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000,
      })

      const socket = socketRef.current

      socket.on('connect', () => {
        console.log('WebSocket connected')
        socket.emit('join_hotel', { hotelId, role: 'reception' })
        setData(d => ({ ...d, connected: true }))
      })

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected')
        // Don't set connected to false if we have data (API polling works)
      })

      socket.on('connect_error', (err) => {
        console.log('WebSocket connect_error, using polling mode:', err.message)
        // Mark as connected anyway since HTTP polling works
        setData(d => ({ ...d, connected: true }))
      })

      // Real-time updates
      socket.on('room_updated', (update) => {
        console.log('Room update received:', update)
        setData(d => ({
          ...d,
          rooms: d.rooms.map(room =>
            room._id === update.roomId ? { ...room, ...update } : room
          ),
        }))
      })

      socket.on('task_updated', (update) => {
        console.log('Task update received:', update)
        setData(d => ({
          ...d,
          tasks: d.tasks.map(task =>
            task._id === update.taskId ? { ...task, status: update.status } : task
          ),
        }))
      })

      socket.on('stats_refresh', () => {
        console.log('Stats refresh signal received')
        fetchData()
      })

      socket.on('assignment_updated', (update) => {
        console.log('Assignment update received:', update)
        fetchData() // Refresh all data
      })

      // Handle cleaning completed notifications for gouvernante
      socket.on('cleaning_completed', (notification) => {
        console.log('Cleaning completed notification received:', notification)
        
        // Add notification to state
        const newNotification = {
          id: `notif_${Date.now()}_${notification.roomNumber}`,
          ...notification,
          receivedAt: new Date(),
        }
        
        setData(d => ({
          ...d,
          notifications: [newNotification, ...d.notifications].slice(0, 20), // Keep last 20
        }))
        
        // Show toast notification
        showCleaningCompletedToast(notification)
        
        // Refresh inspections list
        fetchData()
      })
    } catch (err) {
      console.log('WebSocket initialization failed, using HTTP polling:', err)
      setData(d => ({ ...d, connected: true }))
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_hotel', { hotelId })
        socketRef.current.disconnect()
      }
    }
  }, [hotelId, fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchData])

  // Actions
  const seedData = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      const res = await axios.post(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/seed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(`Données créées: ${res.data.rooms_created} chambres, ${res.data.tasks_created} tâches`)
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la création des données')
    }
  }, [hotelId, fetchData])

  const startTask = useCallback(async (taskId) => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.post(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/tasks/${taskId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Nettoyage démarré')
      fetchData()
    } catch (error) {
      toast.error('Erreur lors du démarrage')
    }
  }, [hotelId, fetchData])

  const completeTask = useCallback(async (taskId, photosAfter = [], notes = '') => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.post(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/tasks/${taskId}/complete`, 
        { photos_after: photosAfter, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Nettoyage terminé')
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la complétion')
    }
  }, [hotelId, fetchData])

  const assignTasks = useCallback(async (taskIds, staffId, staffName) => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      const res = await axios.post(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/tasks/assign`, 
        { task_ids: taskIds, staff_id: staffId, staff_name: staffName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${res.data.assigned} tâche(s) assignée(s)`)
      fetchData()
      return res.data
    } catch (error) {
      toast.error('Erreur lors de l\'assignation')
    }
  }, [hotelId, fetchData])

  const autoAssign = useCallback(async (strategy = 'balanced') => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      const res = await axios.post(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/assignments/auto`, 
        { strategy },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${res.data.assigned} chambre(s) assignée(s) automatiquement`)
      fetchData()
      return res.data
    } catch (error) {
      toast.error('Erreur lors de l\'assignation automatique')
    }
  }, [hotelId, fetchData])

  const validateInspection = useCallback(async (inspectionId, approved, rating, comments, refusedReason) => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    try {
      await axios.post(`${API_URL}/api/v2/hotels/${hotelId}/housekeeping/inspections/${inspectionId}/validate`,
        { approved, rating, comments, refused_reason: refusedReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
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
    // Notifications
    clearAllNotifications,
    dismissNotification,
    toggleSound,
  }
}

export default useHousekeepingV2
