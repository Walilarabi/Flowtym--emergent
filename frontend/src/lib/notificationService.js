/**
 * Notification Service - Supabase Realtime
 * Écoute les changements sur reservations, room_cleaning_tasks, rooms
 * et génère des notifications pour l'utilisateur
 */
import { supabase } from '@/lib/supabase'

const listeners = new Set()
let channel = null

export const NotificationType = {
  RESERVATION_NEW: 'reservation_new',
  RESERVATION_CHECKIN: 'reservation_checkin',
  RESERVATION_CHECKOUT: 'reservation_checkout',
  CLEANING_STARTED: 'cleaning_started',
  CLEANING_COMPLETED: 'cleaning_completed',
  ROOM_STATUS_CHANGED: 'room_status_changed',
}

const notificationMessages = {
  [NotificationType.RESERVATION_NEW]: (data) => ({
    title: 'Nouvelle réservation',
    message: `${data.guest_name} — ${data.check_in}`,
    type: 'info',
  }),
  [NotificationType.RESERVATION_CHECKIN]: (data) => ({
    title: 'Check-in',
    message: `${data.guest_name} est arrivé`,
    type: 'success',
  }),
  [NotificationType.RESERVATION_CHECKOUT]: (data) => ({
    title: 'Check-out',
    message: `${data.guest_name} a quitté`,
    type: 'warning',
  }),
  [NotificationType.CLEANING_STARTED]: () => ({
    title: 'Nettoyage démarré',
    message: 'Une chambre est en cours de nettoyage',
    type: 'info',
  }),
  [NotificationType.CLEANING_COMPLETED]: () => ({
    title: 'Nettoyage terminé',
    message: 'Une chambre a été nettoyée',
    type: 'success',
  }),
  [NotificationType.ROOM_STATUS_CHANGED]: (data) => ({
    title: 'Statut chambre',
    message: `Chambre ${data.room_number || '?'} → ${data.status}`,
    type: 'info',
  }),
}

function notify(type, data) {
  const builder = notificationMessages[type]
  if (!builder) return
  const notification = {
    id: `${type}_${Date.now()}`,
    ...builder(data),
    timestamp: new Date(),
    read: false,
  }
  listeners.forEach(cb => cb(notification))
}

export function onNotification(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function startRealtimeNotifications(hotelId) {
  if (channel) {
    supabase.removeChannel(channel)
  }

  channel = supabase.channel(`notifications-${hotelId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reservations', filter: `hotel_id=eq.${hotelId}` },
      (payload) => notify(NotificationType.RESERVATION_NEW, payload.new))
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'reservations', filter: `hotel_id=eq.${hotelId}` },
      (payload) => {
        if (payload.new.status === 'check_in') notify(NotificationType.RESERVATION_CHECKIN, payload.new)
        if (payload.new.status === 'check_out') notify(NotificationType.RESERVATION_CHECKOUT, payload.new)
      })
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'room_cleaning_tasks', filter: `hotel_id=eq.${hotelId}` },
      (payload) => {
        if (payload.new.status === 'en_cours') notify(NotificationType.CLEANING_STARTED, payload.new)
        if (payload.new.status === 'termine') notify(NotificationType.CLEANING_COMPLETED, payload.new)
      })
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `hotel_id=eq.${hotelId}` },
      (payload) => notify(NotificationType.ROOM_STATUS_CHANGED, payload.new))
    .subscribe()

  return () => {
    if (channel) supabase.removeChannel(channel)
  }
}
