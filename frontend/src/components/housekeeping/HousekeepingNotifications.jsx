/**
 * HousekeepingNotifications - Système de notifications temps réel
 * Alerte les gouvernantes quand une chambre est terminée
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Bell, BellRing, X, CheckCircle, Clock, Star, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  brand: '#5B4ED1',
  brandSoft: '#E8E5FF',
  success: '#22C55E',
  successSoft: '#DCFCE7',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  vip: '#D97706',
  vipSoft: '#FEF3C7',
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ITEM
// ═══════════════════════════════════════════════════════════════════════════════

const NotificationItem = ({ notification, onDismiss, onValidate }) => {
  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const taskTypeLabel = {
    depart: 'Départ',
    recouche: 'Recouche',
    en_cours_sejour: 'Séjour',
  }

  return (
    <div 
      className={`p-3 rounded-xl border transition-all hover:shadow-sm ${
        notification.isVip ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
      }`}
      data-testid={`notification-${notification.roomNumber}`}
    >
      <div className="flex items-start gap-3">
        {/* Room Number Badge */}
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ 
            background: notification.isVip ? COLORS.vipSoft : COLORS.successSoft,
            border: `2px solid ${notification.isVip ? COLORS.vip : COLORS.success}`
          }}
        >
          <span 
            className="text-lg font-black"
            style={{ color: notification.isVip ? COLORS.vip : COLORS.success }}
          >
            {notification.roomNumber}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800">
              Chambre terminée
            </span>
            {notification.isVip && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded">
                VIP
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatTime(notification.completedAt)}
            </span>
            <span>•</span>
            <span>{notification.cleanedBy}</span>
            <span>•</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100">
              {taskTypeLabel[notification.taskType] || notification.taskType}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onDismiss(notification.id)}
            >
              <X size={12} className="mr-1" />
              Ignorer
            </Button>
            <Button 
              size="sm" 
              className="h-7 text-xs"
              style={{ background: COLORS.success }}
              onClick={() => onValidate(notification)}
            >
              <CheckCircle size={12} className="mr-1" />
              Valider
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HousekeepingNotifications({ 
  notifications = [], 
  onClearAll, 
  onDismiss, 
  onValidate,
  soundEnabled = true,
  onToggleSound 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const audioRef = useRef(null)
  const prevCountRef = useRef(0)

  // Play notification sound
  useEffect(() => {
    if (soundEnabled && notifications.length > prevCountRef.current) {
      // New notification arrived
      playNotificationSound()
    }
    prevCountRef.current = notifications.length
  }, [notifications.length, soundEnabled])

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      console.log('Audio notification not supported')
    }
  }, [])

  const unreadCount = notifications.length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-9 w-9 rounded-full border-slate-200 hover:bg-slate-50"
          data-testid="notifications-trigger"
        >
          {unreadCount > 0 ? (
            <BellRing size={18} className="text-amber-500 animate-bounce" />
          ) : (
            <Bell size={18} className="text-slate-600" />
          )}
          
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse"
              style={{ background: COLORS.danger }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        align="end" 
        className="w-96 p-0 shadow-xl"
        data-testid="notifications-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BellRing size={16} style={{ color: COLORS.brand }} />
            <span className="font-semibold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <Badge 
                variant="secondary" 
                className="h-5 px-1.5 text-[10px]"
                style={{ background: COLORS.dangerSoft, color: COLORS.danger }}
              >
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onToggleSound}
              title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
            >
              {soundEnabled ? (
                <Volume2 size={14} className="text-slate-500" />
              ) : (
                <VolumeX size={14} className="text-slate-400" />
              )}
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-500"
                onClick={onClearAll}
              >
                Tout effacer
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">Aucune notification</p>
              <p className="text-xs text-slate-400 mt-1">
                Vous serez alerté quand une chambre sera terminée
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {notifications.map(notif => (
                <NotificationItem 
                  key={notif.id}
                  notification={notif}
                  onDismiss={onDismiss}
                  onValidate={onValidate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-[10px] text-slate-400 text-center">
              Cliquez sur "Valider" pour accéder à l'inspection
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION (for inline display)
// ═══════════════════════════════════════════════════════════════════════════════

export function showCleaningCompletedToast(notification) {
  const isVip = notification.isVip
  
  toast.success(
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ 
          background: isVip ? COLORS.vipSoft : COLORS.successSoft,
        }}
      >
        <span 
          className="text-sm font-black"
          style={{ color: isVip ? COLORS.vip : COLORS.success }}
        >
          {notification.roomNumber}
        </span>
      </div>
      <div>
        <div className="font-semibold text-sm">
          Chambre {notification.roomNumber} terminée
          {isVip && <span className="ml-1 text-amber-600">★ VIP</span>}
        </div>
        <div className="text-xs text-slate-500">
          Par {notification.cleanedBy} • Prête à valider
        </div>
      </div>
    </div>,
    {
      duration: 5000,
      position: 'top-right',
    }
  )
}
