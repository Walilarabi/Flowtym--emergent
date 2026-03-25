/**
 * Flowtym Housekeeping Module - Version Complète Rorck
 * Reproduction fidèle des interfaces Rorck
 * 
 * VUES:
 * - Réception: Tableau complet des chambres
 * - Répartition: Assignation staff avec alertes
 * - Plan de l'hôtel: Vue grille par étage
 * - Gouvernante: Validation des chambres
 * - Femme de chambre: Mobile
 * - Maintenance: Mobile
 * - Petit-déjeuner: Mobile
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useHotel } from '@/context/HotelContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Brush, Users, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Search, Filter, RefreshCw, Play, Square, ChevronRight, ChevronDown,
  Home, Bed, Coffee, Wrench, Package, BarChart3, History, Zap,
  MapPin, Star, Eye, Phone, Mail, UserPlus, Settings, ArrowRight,
  CheckCircle2, XCircle, Loader2, Building2, Calendar, Sparkles,
  Grid3X3, List, ChevronLeft, Plus, Timer, AlertCircle, User,
  Bath, Sun, TreePine, Waves, X, Check, FileText, MoreHorizontal
} from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES INLINE - Fidèle à Rorck
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  primary: '#5B4ED1',
  primaryLight: '#E8E5FF',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  teal: '#14B8A6',
  tealLight: '#CCFBF1',
  orange: '#F97316',
  orangeLight: '#FFEDD5',
  purple: '#A855F7',
  purpleLight: '#F3E8FF',
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  dark: '#1E1B4B',
}

const STATUS_COLORS = {
  propre: { bg: '#DCFCE7', text: '#16A34A', dot: '#22C55E' },
  sale: { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' },
  inspectee: { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6' },
  en_nettoyage: { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' },
  libre: { bg: '#E8E5FF', text: '#5B4ED1', dot: '#5B4ED1' },
  occupee: { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6' },
  hs: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
}

const SOURCE_ICONS = {
  booking: { bg: '#003580', text: 'B', name: 'Booking' },
  direct: { bg: '#5B4ED1', text: 'D', name: 'Direct' },
  expedia: { bg: '#FBBF24', text: 'E', name: 'Expedia' },
  airbnb: { bg: '#FF5A5F', text: 'A', name: 'Airbnb' },
  agoda: { bg: '#5B9BD5', text: 'Ag', name: 'Agoda' },
  hrs: { bg: '#E11D48', text: 'H', name: 'HRS' },
  tel: { bg: '#6B7280', text: 'T', name: 'Tél.' },
  autre: { bg: '#9CA3AF', text: '?', name: 'Autre' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const HousekeepingStyles = () => (
  <style>{`
    .hk-container {
      background: #F8FAFC;
      min-height: 100vh;
    }
    
    .hk-header {
      background: white;
      border-bottom: 1px solid #E2E8F0;
      padding: 12px 20px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    
    .hk-tabs {
      display: flex;
      gap: 8px;
      background: #F1F5F9;
      padding: 4px;
      border-radius: 12px;
      width: fit-content;
    }
    
    .hk-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #64748B;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      background: transparent;
    }
    
    .hk-tab.active {
      background: white;
      color: #1E1B4B;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .hk-tab:hover:not(.active) {
      color: #1E1B4B;
    }
    
    .hk-kpi-bar {
      display: flex;
      gap: 24px;
      padding: 16px 20px;
      background: white;
      border-bottom: 1px solid #E2E8F0;
    }
    
    .hk-kpi {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .hk-kpi-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hk-kpi-value {
      font-size: 20px;
      font-weight: 700;
      color: #1E1B4B;
      line-height: 1;
    }
    
    .hk-kpi-label {
      font-size: 12px;
      color: #64748B;
    }
    
    .hk-filters {
      display: flex;
      gap: 12px;
      padding: 12px 20px;
      background: white;
      border-bottom: 1px solid #E2E8F0;
      align-items: center;
    }
    
    .hk-filter-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #64748B;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .hk-filter-btn:hover {
      background: #F1F5F9;
      border-color: #CBD5E1;
    }
    
    .hk-table-container {
      background: white;
      margin: 20px;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      overflow: hidden;
    }
    
    .hk-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .hk-table th {
      background: #1E1B4B;
      color: white;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 10px;
      text-align: left;
      white-space: nowrap;
    }
    
    .hk-table th:first-child {
      padding-left: 16px;
    }
    
    .hk-table td {
      padding: 10px;
      font-size: 13px;
      border-bottom: 1px solid #F1F5F9;
      vertical-align: middle;
    }
    
    .hk-table tr:hover {
      background: #FAFBFC;
    }
    
    .hk-room-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .hk-room-number {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 15px;
      color: white;
    }
    
    .hk-room-info {
      display: flex;
      flex-direction: column;
    }
    
    .hk-room-type {
      font-weight: 600;
      color: #1E1B4B;
      font-size: 13px;
    }
    
    .hk-room-size {
      font-size: 11px;
      color: #94A3B8;
    }
    
    .hk-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .hk-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    
    .hk-client-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .hk-vip-badge {
      background: #FEF3C7;
      color: #D97706;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }
    
    .hk-source-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 700;
    }
    
    .hk-check-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hk-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }
    
    .hk-action-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      background: transparent;
      color: #94A3B8;
    }
    
    .hk-action-btn:hover {
      background: #F1F5F9;
      color: #64748B;
    }
    
    .hk-libre-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #5B4ED1;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      background: transparent;
      border: none;
    }
    
    .hk-libre-btn:hover {
      background: #E8E5FF;
    }
    
    /* Plan de l'hôtel */
    .hk-plan-container {
      padding: 20px;
    }
    
    .hk-plan-header {
      background: #1E1B4B;
      padding: 16px 20px;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .hk-plan-title {
      color: white;
      font-size: 16px;
      font-weight: 600;
    }
    
    .hk-plan-legend {
      display: flex;
      gap: 16px;
      padding: 16px 20px;
      background: white;
      border-bottom: 1px solid #E2E8F0;
    }
    
    .hk-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748B;
    }
    
    .hk-legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .hk-floor-section {
      background: white;
      padding: 20px;
      border-bottom: 1px solid #E2E8F0;
    }
    
    .hk-floor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .hk-floor-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #5B4ED1;
    }
    
    .hk-floor-count {
      font-size: 12px;
      color: #94A3B8;
    }
    
    .hk-room-grid {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .hk-room-chip {
      width: 52px;
      height: 52px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }
    
    .hk-room-chip:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .hk-room-chip-number {
      font-weight: 700;
      font-size: 16px;
    }
    
    .hk-room-chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-top: 2px;
    }
    
    /* Répartition */
    .hk-repartition-header {
      background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
      padding: 24px;
      border-radius: 12px;
      margin: 20px;
    }
    
    .hk-repartition-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .hk-repartition-stat {
      text-align: center;
    }
    
    .hk-repartition-stat-value {
      font-size: 28px;
      font-weight: 700;
      color: white;
    }
    
    .hk-repartition-stat-label {
      font-size: 11px;
      color: #A5B4FC;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .hk-repartition-progress {
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
    }
    
    .hk-repartition-progress-bar {
      height: 100%;
      transition: width 0.3s;
    }
    
    .hk-repartition-percent {
      text-align: right;
      font-size: 13px;
      font-weight: 600;
      color: #22C55E;
      margin-top: 8px;
    }
    
    .hk-staff-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid #E2E8F0;
    }
    
    .hk-staff-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .hk-staff-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
    
    .hk-staff-info {
      flex: 1;
    }
    
    .hk-staff-name {
      font-weight: 600;
      color: #1E1B4B;
      font-size: 14px;
    }
    
    .hk-staff-stats {
      font-size: 12px;
      color: #64748B;
    }
    
    .hk-staff-count {
      font-size: 18px;
      font-weight: 700;
      color: #5B4ED1;
    }
    
    .hk-staff-progress {
      height: 6px;
      background: #F1F5F9;
      border-radius: 3px;
      overflow: hidden;
    }
    
    .hk-staff-progress-bar {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }
    
    .hk-alert-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #E2E8F0;
      margin-top: 20px;
    }
    
    .hk-alert-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #1E1B4B;
      margin-bottom: 12px;
    }
    
    .hk-alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #F1F5F9;
    }
    
    .hk-alert-item:last-child {
      border-bottom: none;
    }
    
    .hk-alert-room {
      font-weight: 700;
      color: #EF4444;
      font-size: 14px;
    }
    
    .hk-alert-time {
      font-size: 12px;
      color: #64748B;
    }
    
    .hk-perf-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #F1F5F9;
    }
    
    .hk-perf-name {
      font-size: 13px;
      color: #1E1B4B;
    }
    
    .hk-perf-stats {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .hk-perf-value {
      font-size: 13px;
      font-weight: 600;
    }
    
    /* View toggle */
    .hk-view-toggle {
      display: flex;
      background: #F1F5F9;
      border-radius: 8px;
      padding: 2px;
    }
    
    .hk-view-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: none;
      background: transparent;
      color: #94A3B8;
    }
    
    .hk-view-btn.active {
      background: white;
      color: #5B4ED1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
  `}</style>
)

// ═══════════════════════════════════════════════════════════════════════════════
// API HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useHousekeepingData = () => {
  const { currentHotel } = useHotel()
  const [data, setData] = useState({
    stats: null,
    tasks: [],
    rooms: [],
    staff: [],
    inspections: [],
    maintenance: [],
    breakfast: [],
    inventory: [],
    activity: [],
    loading: true,
    error: null
  })

  const hotelId = currentHotel?.id

  const fetchData = useCallback(async () => {
    if (!hotelId) return
    
    setData(d => ({ ...d, loading: true, error: null }))
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    
    try {
      const [statsRes, tasksRes, staffRes, inspRes, maintRes, bfastRes, invRes, actRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/tasks`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/staff`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/inspections`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/maintenance`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/breakfast`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/inventory`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/housekeeping/hotels/${hotelId}/activity?limit=20`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/hotels/${hotelId}/rooms`, { headers }).catch(() => ({ data: [] }))
      ])
      
      setData({
        stats: statsRes.data,
        tasks: tasksRes.data || [],
        rooms: roomsRes.data || [],
        staff: staffRes.data || [],
        inspections: inspRes.data || [],
        maintenance: maintRes.data || [],
        breakfast: bfastRes.data || [],
        inventory: invRes.data || [],
        activity: actRes.data || [],
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching housekeeping data:', error)
      setData(d => ({ ...d, loading: false, error: error.message }))
    }
  }, [hotelId])

  const seedData = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/seed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Données de démonstration créées')
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la création des données')
    }
  }, [hotelId, fetchData])

  const startTask = useCallback(async (taskId) => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/tasks/${taskId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Nettoyage démarré')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const completeTask = useCallback(async (taskId, photos = [], notes = '') => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/tasks/${taskId}/complete`, 
        { task_id: taskId, photos_after: photos, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Nettoyage terminé')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const validateInspection = useCallback(async (inspectionId, approved, rating, notes, reason) => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/inspections/${inspectionId}/validate`,
        { inspection_id: inspectionId, approved, rating, notes, refused_reason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(approved ? 'Chambre validée' : 'Chambre refusée')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const autoAssign = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API_URL}/api/housekeeping/hotels/${hotelId}/assignments/auto`,
        { date: new Date().toISOString().split('T')[0], strategy: 'balanced' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${res.data.assigned} chambres assignées`)
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const updateBreakfast = useCallback(async (orderId, updates) => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
    try {
      await axios.put(`${API_URL}/api/housekeeping/hotels/${hotelId}/breakfast/${orderId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  const updateMaintenance = useCallback(async (ticketId, updates) => {
    if (!hotelId) return
    const token = localStorage.getItem('token')
    try {
      await axios.put(`${API_URL}/api/housekeeping/hotels/${hotelId}/maintenance/${ticketId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }, [hotelId, fetchData])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    ...data,
    refresh: fetchData,
    seedData,
    startTask,
    completeTask,
    validateInspection,
    autoAssign,
    updateBreakfast,
    updateMaintenance
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Room number with colored background
const RoomNumber = ({ number, type, status }) => {
  const colors = {
    101: '#5B4ED1', 102: '#22C55E', 103: '#A855F7', 104: '#F59E0B', 105: '#EF4444',
    201: '#3B82F6', 202: '#EC4899', 203: '#14B8A6', 204: '#F97316', 205: '#6366F1',
    301: '#8B5CF6', 302: '#06B6D4', 303: '#EF4444', 304: '#22C55E', 305: '#F59E0B',
  }
  const bgColor = colors[number] || '#5B4ED1'
  
  return (
    <div className="hk-room-cell">
      <div className="hk-room-number" style={{ background: bgColor }}>
        {number}
      </div>
      <div className="hk-room-info">
        <span className="hk-room-type">{type}</span>
        <span className="hk-room-size">Classique · 16m²</span>
      </div>
    </div>
  )
}

// Status badge
const StatusBadge = ({ status }) => {
  const config = STATUS_COLORS[status] || STATUS_COLORS.propre
  const labels = {
    propre: 'Propre', sale: 'Sale', inspectee: 'Inspectée', 
    en_nettoyage: 'En nettoyage', libre: 'Libre', occupee: 'Occupée', hs: 'H.S.'
  }
  
  return (
    <span className="hk-status-badge" style={{ background: config.bg, color: config.text }}>
      <span className="hk-status-dot" style={{ background: config.dot }} />
      {labels[status] || status}
    </span>
  )
}

// Source icon
const SourceIcon = ({ source }) => {
  const config = SOURCE_ICONS[source?.toLowerCase()] || SOURCE_ICONS.autre
  return (
    <div className="flex items-center gap-2">
      <div className="hk-source-icon" style={{ background: config.bg }}>
        {config.text}
      </div>
      <div className="text-xs">
        <div className="font-medium text-slate-700">{config.name}</div>
        <div className="text-slate-400">OTA</div>
      </div>
    </div>
  )
}

// Check/X icon
const CheckIcon = ({ checked, color = 'green' }) => {
  if (checked === null || checked === undefined) return <span className="text-slate-300">—</span>
  
  const colors = {
    green: { bg: '#DCFCE7', icon: '#22C55E' },
    red: { bg: '#FEE2E2', icon: '#EF4444' },
    gray: { bg: '#F3F4F6', icon: '#9CA3AF' }
  }
  const cfg = colors[color] || colors.green
  
  return (
    <div className="hk-check-icon" style={{ background: cfg.bg }}>
      {checked ? <Check size={14} style={{ color: cfg.icon }} /> : <X size={14} style={{ color: cfg.icon }} />}
    </div>
  )
}

// Staff avatar
const StaffAvatar = ({ name, color }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  return (
    <div className="hk-avatar" style={{ background: color || '#E8E5FF', color: '#5B4ED1' }}>
      {initials}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VUE: Réception - Tableau complet
// ═══════════════════════════════════════════════════════════════════════════════

const ReceptionView = ({ data, actions }) => {
  const { tasks, staff, inspections, breakfast, rooms } = data
  const [viewMode, setViewMode] = useState('table') // table or grid
  const [filters, setFilters] = useState({
    floor: 'all',
    status: 'all',
    badge: 'all',
    assignee: 'all',
    source: 'all'
  })
  const [searchText, setSearchText] = useState('')

  // Generate room data for display
  const roomsData = useMemo(() => {
    // Create comprehensive room list
    const allRooms = [
      { number: '101', type: 'Simple', floor: 1, size: 16, status: 'propre', client: 'Jean-Pierre Dubois', vip: true, pax: 2, arrival: '28 fév.', departure: '3 mars', eta: null, source: 'booking', hkStatus: null, gouvStatus: null, assignee: null, view: 'Rue', sdb: 'Douche', pdj: true },
      { number: '102', type: 'Double', floor: 1, size: 30, status: 'inspectee', client: null, vip: false, pax: null, arrival: null, departure: null, eta: '15:00', source: 'direct', hkStatus: 'Validé', gouvStatus: 'Validé', assignee: null, view: 'Cour', sdb: 'Baignoire', pdj: false },
      { number: '103', type: 'Suite', floor: 1, size: 33, status: 'propre', client: 'Claire Martin', vip: false, pax: 1, arrival: '27 fév.', departure: '2 mars', eta: null, source: 'expedia', hkStatus: null, gouvStatus: null, assignee: null, view: 'Jardin', sdb: 'Douche+Baignoire', pdj: false },
      { number: '104', type: 'Simple', floor: 1, size: 16, status: 'sale', client: 'Marc Lefevre', vip: false, pax: 1, arrival: '26 fév.', departure: '1 mars', eta: '14:00', source: 'tel', hkStatus: 'Départ', gouvStatus: null, assignee: null, view: 'Rue', sdb: 'Douche', pdj: false },
      { number: '105', type: 'Double', floor: 1, size: 22, status: 'en_nettoyage', client: 'David Leblanc', vip: false, pax: 1, arrival: '28 fév.', departure: '3 mars', eta: null, source: 'airbnb', hkStatus: 'Recouche', gouvStatus: null, assignee: 'Sophie M.', view: 'Cour', sdb: 'Baignoire', pdj: false, time: '35224m' },
      { number: '201', type: 'Deluxe', floor: 2, size: 40, status: 'propre', client: 'Antoine & Sophie B...', vip: true, pax: 2, arrival: '28 fév.', departure: '5 mars', eta: null, source: 'direct', hkStatus: null, gouvStatus: null, assignee: null, view: 'Mer', sdb: 'Douche+Baignoire', pdj: false },
      { number: '202', type: 'Double', floor: 2, size: 20, status: 'sale', client: 'Émilie Garnier', vip: false, pax: 2, arrival: '27 fév.', departure: '1 mars', eta: '16:30', source: 'booking', hkStatus: 'Départ', gouvStatus: null, assignee: null, view: 'Rue', sdb: 'Douche', pdj: false },
      { number: '203', type: 'Simple', floor: 2, size: 18, status: 'en_nettoyage', client: 'Thomas Petit', vip: false, pax: 1, arrival: '25 fév.', departure: '4 mars', eta: null, source: 'agoda', hkStatus: 'Recouche', gouvStatus: null, assignee: 'Marie D.', view: 'Cour', sdb: 'Baignoire', pdj: false, time: '35224m' },
      { number: '204', type: 'Double', floor: 2, size: 20, status: 'propre', client: 'David Leblanc', vip: false, pax: 1, arrival: '27 fév.', departure: '1 mars', eta: null, source: 'expedia', hkStatus: 'Départ', gouvStatus: 'À valider', assignee: 'Sophie M.', view: 'Rue', sdb: 'Douche', pdj: false, time: '35308m' },
      { number: '205', type: 'Deluxe', floor: 2, size: 30, status: 'inspectee', client: null, vip: false, pax: null, arrival: null, departure: null, eta: '20:30', source: 'booking', hkStatus: 'Validé', gouvStatus: 'Validé', assignee: null, view: 'Cour', sdb: 'Baignoire', pdj: false },
      { number: '301', type: 'Suite', floor: 3, size: 45, status: 'inspectee', client: null, vip: false, pax: null, arrival: null, departure: null, eta: 'Late check-in', source: 'direct', hkStatus: 'Validé', gouvStatus: 'Validé', assignee: null, view: 'Jardin', sdb: 'Douche+Baignoire', pdj: false },
      { number: '302', type: 'Deluxe', floor: 3, size: 38, status: 'propre', client: 'Emma Wilson', vip: false, pax: 1, arrival: '1 mars', departure: '4 mars', eta: null, source: 'airbnb', hkStatus: null, gouvStatus: null, assignee: null, view: 'Cour', sdb: 'Baignoire', pdj: false },
      { number: '303', type: 'Double', floor: 3, size: 20, status: 'sale', client: 'Robert Petit', vip: true, pax: 1, arrival: '24 fév.', departure: '2 mars', eta: null, source: 'hrs', hkStatus: 'Recouche', gouvStatus: 'Refusé', assignee: 'Sophie M.', view: 'Rue', sdb: 'Douche', pdj: false },
      { number: '304', type: 'Familiale', floor: 3, size: 38, status: 'propre', client: 'Famille Moreau', vip: false, pax: 4, arrival: '25 fév.', departure: '4 mars', eta: null, source: 'tel', hkStatus: null, gouvStatus: null, assignee: null, view: 'Jardin', sdb: 'Douche+Baignoire', pdj: false },
      { number: '305', type: 'Simple', floor: 3, size: 16, status: 'sale', client: null, vip: false, pax: null, arrival: null, departure: null, eta: null, source: 'autre', hkStatus: 'Bloquée', gouvStatus: null, assignee: null, view: 'Rue', sdb: 'Douche', pdj: false },
    ]
    return allRooms
  }, [tasks])

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return roomsData.filter(room => {
      if (searchText && !room.number.includes(searchText) && !room.client?.toLowerCase().includes(searchText.toLowerCase())) return false
      if (filters.floor !== 'all' && room.floor !== parseInt(filters.floor)) return false
      if (filters.status !== 'all' && room.status !== filters.status) return false
      return true
    })
  }, [roomsData, filters, searchText])

  // Calculate KPIs
  const kpis = useMemo(() => ({
    total: roomsData.length,
    departures: roomsData.filter(r => r.hkStatus === 'Départ').length,
    recouches: roomsData.filter(r => r.hkStatus === 'Recouche').length,
    enCours: roomsData.filter(r => r.status === 'en_nettoyage').length,
    terminees: roomsData.filter(r => r.status === 'propre' || r.status === 'inspectee').length,
    aValider: roomsData.filter(r => r.gouvStatus === 'À valider').length,
    pdj: roomsData.filter(r => r.pdj).length,
    etaUrgent: roomsData.filter(r => r.eta && r.eta !== 'Late check-in').length
  }), [roomsData])

  return (
    <div>
      {/* Alerts Banner */}
      <div style={{ background: '#FEF3C7', padding: '8px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={16} style={{ color: '#D97706' }} />
        <span style={{ color: '#92400E' }}>⚠️ Alertes du jour</span>
      </div>

      {/* Sub-tabs */}
      <div style={{ padding: '12px 20px', background: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <div className="hk-tabs">
          <button className="hk-tab active">
            <MapPin size={16} /> Plan Chambres
          </button>
          <button className="hk-tab">
            <Zap size={16} /> Répartition
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="hk-kpi-bar">
        <div className="hk-kpi">
          <div className="hk-kpi-icon" style={{ background: '#E8E5FF' }}>
            <Bed size={16} style={{ color: '#5B4ED1' }} />
          </div>
          <div>
            <div className="hk-kpi-value">{kpis.total}</div>
            <div className="hk-kpi-label">Chambres</div>
          </div>
        </div>
        <div className="hk-kpi">
          <div className="hk-kpi-icon" style={{ background: '#FEE2E2' }}>
            <ArrowRight size={16} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <div className="hk-kpi-value" style={{ color: '#EF4444' }}>{kpis.departures}</div>
            <div className="hk-kpi-label">Départs</div>
          </div>
        </div>
        <div className="hk-kpi">
          <div className="hk-kpi-icon" style={{ background: '#FFEDD5' }}>
            <RefreshCw size={16} style={{ color: '#F97316' }} />
          </div>
          <div>
            <div className="hk-kpi-value" style={{ color: '#F97316' }}>{kpis.recouches}</div>
            <div className="hk-kpi-label">Recouches</div>
          </div>
        </div>
        <div className="hk-kpi">
          <div className="hk-kpi-icon" style={{ background: '#FEF3C7' }}>
            <Clock size={16} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <div className="hk-kpi-value" style={{ color: '#F59E0B' }}>{kpis.enCours}</div>
            <div className="hk-kpi-label">En cours</div>
          </div>
        </div>
        <div className="hk-kpi">
          <div className="hk-kpi-icon" style={{ background: '#DCFCE7' }}>
            <CheckCircle size={16} style={{ color: '#22C55E' }} />
          </div>
          <div>
            <div className="hk-kpi-value" style={{ color: '#22C55E' }}>{kpis.terminees}</div>
            <div className="hk-kpi-label">Terminées</div>
          </div>
        </div>
        <div className="hk-kpi">
          <div className="hk-kpi-icon" style={{ background: '#FEF3C7' }}>
            <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <div className="hk-kpi-value" style={{ color: '#F59E0B' }}>{kpis.aValider}</div>
            <div className="hk-kpi-label">À valider</div>
          </div>
        </div>
        <div className="hk-kpi">
          <div className="hk-kpi-icon" style={{ background: '#DBEAFE' }}>
            <Coffee size={16} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <div className="hk-kpi-value" style={{ color: '#3B82F6' }}>{kpis.pdj}</div>
            <div className="hk-kpi-label">PDJ inclus</div>
          </div>
        </div>
        <div className="hk-kpi">
          <div className="hk-kpi-icon" style={{ background: '#FEE2E2' }}>
            <AlertCircle size={16} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <div className="hk-kpi-value" style={{ color: '#EF4444' }}>{kpis.etaUrgent}</div>
            <div className="hk-kpi-label">ETA urgents</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="hk-filters">
        <div style={{ position: 'relative', flex: 1, maxWidth: 250 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input 
            placeholder="Chambre, client..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ paddingLeft: 36, background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          />
        </div>
        <button className="hk-filter-btn">
          Étage <ChevronDown size={14} />
        </button>
        <button className="hk-filter-btn">
          Statut <ChevronDown size={14} />
        </button>
        <button className="hk-filter-btn">
          Badge <ChevronDown size={14} />
        </button>
        <button className="hk-filter-btn">
          Assignée <ChevronDown size={14} />
        </button>
        <button className="hk-filter-btn">
          Source <ChevronDown size={14} />
        </button>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="hk-view-toggle">
            <button className={`hk-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
              <Grid3X3 size={16} />
            </button>
            <button className={`hk-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
              <List size={16} />
            </button>
          </div>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>15/15</span>
          <button className="hk-action-btn">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="hk-table-container">
        <table className="hk-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}><Checkbox /></th>
              <th>Chambre</th>
              <th>Statut</th>
              <th>Client</th>
              <th>PAX</th>
              <th>Arrivée</th>
              <th>Départ</th>
              <th>ETA</th>
              <th>Source</th>
              <th>Housekeeping</th>
              <th>Gouvernante</th>
              <th>Assignée</th>
              <th>Vue / SDB</th>
              <th>PDJ</th>
              <th>Temps</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room, idx) => (
              <tr key={room.number}>
                <td><Checkbox /></td>
                <td><RoomNumber number={room.number} type={room.type} status={room.status} /></td>
                <td><StatusBadge status={room.status} /></td>
                <td>
                  {room.client ? (
                    <div className="hk-client-cell">
                      {room.vip && <span className="hk-vip-badge">VIP</span>}
                      <span style={{ fontWeight: 500, color: '#1E1B4B' }}>{room.client}</span>
                    </div>
                  ) : (
                    <button className="hk-libre-btn">
                      <span style={{ color: '#5B4ED1' }}>★</span> Libre <Plus size={12} /> Ajouter
                    </button>
                  )}
                </td>
                <td style={{ color: room.pax ? '#1E1B4B' : '#CBD5E1' }}>
                  {room.pax ? <><span style={{ marginRight: 4 }}>✏️</span>{room.pax}</> : '—'}
                </td>
                <td style={{ color: room.arrival ? '#5B4ED1' : '#CBD5E1' }}>{room.arrival || '—'}</td>
                <td style={{ color: room.departure ? '#EF4444' : '#CBD5E1' }}>{room.departure || '—'}</td>
                <td style={{ color: room.eta ? '#F59E0B' : '#CBD5E1', fontWeight: room.eta ? 600 : 400 }}>
                  {room.eta || '⊕ + ETA'}
                </td>
                <td>{room.source && <SourceIcon source={room.source} />}</td>
                <td>
                  {room.hkStatus ? (
                    <Badge style={{ 
                      background: room.hkStatus === 'Validé' ? '#DCFCE7' : room.hkStatus === 'Départ' ? '#FEE2E2' : '#FEF3C7',
                      color: room.hkStatus === 'Validé' ? '#16A34A' : room.hkStatus === 'Départ' ? '#DC2626' : '#D97706',
                      border: 'none'
                    }}>
                      ● {room.hkStatus}
                    </Badge>
                  ) : '—'}
                </td>
                <td>
                  {room.gouvStatus ? (
                    <Badge style={{ 
                      background: room.gouvStatus === 'Validé' ? '#DCFCE7' : room.gouvStatus === 'Refusé' ? '#FEE2E2' : '#FEF3C7',
                      color: room.gouvStatus === 'Validé' ? '#16A34A' : room.gouvStatus === 'Refusé' ? '#DC2626' : '#D97706',
                      border: 'none'
                    }}>
                      {room.gouvStatus}
                    </Badge>
                  ) : '—'}
                </td>
                <td>
                  {room.assignee ? (
                    <div className="flex items-center gap-2">
                      <StaffAvatar name={room.assignee} />
                      <span style={{ fontSize: 12, color: '#64748B' }}>{room.assignee}</span>
                    </div>
                  ) : '—'}
                </td>
                <td>
                  <div style={{ fontSize: 12 }}>
                    <div style={{ color: '#1E1B4B', fontWeight: 500 }}>{room.view}</div>
                    <div style={{ color: '#94A3B8' }}>{room.sdb}</div>
                  </div>
                </td>
                <td>
                  {room.pdj ? (
                    <CheckIcon checked={true} color="red" />
                  ) : (
                    <span style={{ color: '#CBD5E1' }}>—</span>
                  )}
                </td>
                <td style={{ color: room.time ? '#22C55E' : '#CBD5E1', fontWeight: 500, fontSize: 12 }}>
                  {room.time || '—'}
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="hk-action-btn"><Eye size={14} /></button>
                    <button className="hk-action-btn"><FileText size={14} /></button>
                    <button className="hk-action-btn"><Star size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VUE: Répartition Chambres
// ═══════════════════════════════════════════════════════════════════════════════

const RepartitionView = ({ data, actions }) => {
  const { tasks, staff } = data
  
  const housekeepers = staff.filter(s => s.role === 'femme_de_chambre')
  
  // Calculate stats
  const stats = useMemo(() => {
    const total = tasks.length
    const pending = tasks.filter(t => t.status === 'pending').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const completed = tasks.filter(t => t.status === 'completed').length
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return { total, pending, inProgress, completed, percent }
  }, [tasks])

  // Staff with their tasks
  const staffWithTasks = useMemo(() => {
    return housekeepers.map(s => {
      const assignedTasks = tasks.filter(t => t.assigned_to === s.id)
      const completed = assignedTasks.filter(t => t.status === 'completed').length
      const avgTime = 28 + Math.floor(Math.random() * 20) // Mock avg time
      return {
        ...s,
        tasks: assignedTasks,
        completed,
        avgTime,
        color: s.first_name === 'Maria' ? '#F59E0B' : s.first_name === 'Fatima' ? '#3B82F6' : '#F97316'
      }
    })
  }, [housekeepers, tasks])

  // Alerts
  const alerts = [
    { room: '105', estimated: 20, actual: 665 },
    { room: '203', estimated: 20, actual: 665 }
  ]

  return (
    <div className="hk-plan-container">
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'white', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #E2E8F0' }}>
        <button 
          onClick={() => window.history.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#1E1B4B', fontSize: 16, fontWeight: 600 }}
        >
          <ChevronLeft size={20} /> Répartition chambres
        </button>
      </div>

      {/* Stats Header */}
      <div className="hk-repartition-header">
        <div className="hk-repartition-stats">
          <div className="hk-repartition-stat">
            <div className="hk-repartition-stat-value">{stats.total}</div>
            <div className="hk-repartition-stat-label">Total</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div className="hk-repartition-stat">
            <div className="hk-repartition-stat-value">{stats.pending}</div>
            <div className="hk-repartition-stat-label">En attente</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div className="hk-repartition-stat">
            <div className="hk-repartition-stat-value">{stats.inProgress}</div>
            <div className="hk-repartition-stat-label">En cours</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div className="hk-repartition-stat">
            <div className="hk-repartition-stat-value">{stats.completed}</div>
            <div className="hk-repartition-stat-label">Terminées</div>
          </div>
        </div>
        <div className="hk-repartition-progress">
          <div className="hk-repartition-progress-bar" style={{ width: `${stats.percent}%`, background: '#22C55E' }} />
          <div className="hk-repartition-progress-bar" style={{ width: `${(stats.inProgress / stats.total) * 100}%`, background: '#F59E0B' }} />
        </div>
        <div className="hk-repartition-percent">{stats.percent}%</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
        <Button 
          onClick={actions.autoAssign}
          className="flex-1" 
          style={{ background: '#5B4ED1', height: 48, fontSize: 14, fontWeight: 600 }}
        >
          <Zap size={18} className="mr-2" /> Répartition auto
        </Button>
        <Button variant="outline" style={{ height: 48, fontSize: 14 }}>
          <Plus size={18} className="mr-2" /> Ajouter
        </Button>
      </div>

      {/* Team */}
      <Card style={{ marginBottom: 20, border: '1px solid #E2E8F0' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users size={16} /> Équipe du jour
            </CardTitle>
            <span style={{ fontSize: 12, color: '#5B4ED1' }}>{housekeepers.length} disponibles</span>
          </div>
        </CardHeader>
        <CardContent>
          {staffWithTasks.map(s => (
            <div key={s.id} className="hk-staff-card" style={{ padding: 12 }}>
              <div className="hk-staff-header" style={{ marginBottom: 8 }}>
                <div className="hk-staff-avatar" style={{ background: s.color + '20', color: s.color }}>
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div className="hk-staff-info">
                  <div className="hk-staff-name">{s.first_name} {s.last_name}</div>
                  <div className="hk-staff-stats">{s.tasks.length}/{s.max_rooms_per_day} ch. • moy. {s.avgTime} min</div>
                </div>
                <div className="hk-staff-count">{s.tasks.length}</div>
                <ChevronDown size={16} style={{ color: '#94A3B8' }} />
              </div>
              <div className="hk-staff-progress">
                <div 
                  className="hk-staff-progress-bar" 
                  style={{ 
                    width: `${(s.tasks.length / s.max_rooms_per_day) * 100}%`,
                    background: s.color
                  }} 
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="hk-alert-card">
        <div className="hk-alert-title">
          <AlertTriangle size={16} style={{ color: '#EF4444' }} />
          Alertes retard
        </div>
        {alerts.map((alert, idx) => (
          <div key={idx} className="hk-alert-item">
            <span className="hk-alert-room">{alert.room}</span>
            <span className="hk-alert-time">{alert.actual} min (estimé {alert.estimated} min)</span>
          </div>
        ))}
      </div>

      {/* Performance */}
      <div className="hk-alert-card">
        <div className="hk-alert-title">
          <Timer size={16} style={{ color: '#5B4ED1' }} />
          Performance
        </div>
        {staffWithTasks.map((s, idx) => (
          <div key={idx} className="hk-perf-item">
            <span className="hk-perf-name">{s.first_name} {s.last_name}</span>
            <div className="hk-perf-stats">
              <span className="hk-perf-value" style={{ color: '#5B4ED1' }}>{s.completed} ch.</span>
              <span className="hk-perf-value" style={{ color: '#64748B' }}>{s.avgTime} min moy.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VUE: Plan de l'hôtel
// ═══════════════════════════════════════════════════════════════════════════════

const PlanHotelView = ({ data, actions }) => {
  const { tasks } = data
  const [searchText, setSearchText] = useState('')

  // Room data by floor
  const floors = [
    { 
      number: 3, 
      rooms: [
        { number: '301', status: 'propre' },
        { number: '302', status: 'en_nettoyage' },
        { number: '303', status: 'sale' },
        { number: '304', status: 'propre' },
        { number: '305', status: 'hs' },
      ]
    },
    { 
      number: 2, 
      rooms: [
        { number: '201', status: 'occupee' },
        { number: '202', status: 'sale' },
        { number: '203', status: 'en_nettoyage' },
        { number: '204', status: 'propre' },
        { number: '205', status: 'inspectee' },
      ]
    },
    { 
      number: 1, 
      rooms: [
        { number: '101', status: 'occupee' },
        { number: '102', status: 'sale' },
        { number: '103', status: 'occupee' },
        { number: '104', status: 'en_nettoyage' },
        { number: '105', status: 'sale' },
      ]
    },
  ]

  const legend = [
    { status: 'propre', label: 'Propres', count: 3 },
    { status: 'sale', label: 'À nettoyer', count: 3 },
    { status: 'en_nettoyage', label: 'En cours', count: 2 },
    { status: 'occupee', label: 'Occupées', count: 5 },
    { status: 'inspectee', label: 'Inspection', count: 1 },
    { status: 'hs', label: 'H.S.', count: 1 },
  ]

  const getRoomColor = (status) => {
    const colors = {
      propre: { bg: '#DCFCE7', text: '#16A34A', dot: '#22C55E' },
      sale: { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' },
      en_nettoyage: { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' },
      occupee: { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6' },
      inspectee: { bg: '#E8E5FF', text: '#5B4ED1', dot: '#A78BFA' },
      hs: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
    }
    return colors[status] || colors.propre
  }

  return (
    <div className="hk-plan-container">
      {/* Header */}
      <div className="hk-plan-header">
        <ChevronLeft size={20} style={{ color: 'white', cursor: 'pointer' }} />
        <span className="hk-plan-title">Plan de l'hôtel</span>
      </div>

      {/* Legend */}
      <div className="hk-plan-legend">
        {legend.map(item => (
          <div key={item.status} className="hk-legend-item">
            <div className="hk-legend-dot" style={{ background: getRoomColor(item.status).dot }} />
            <span style={{ fontWeight: 500 }}>{item.count}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '16px 20px', background: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input 
            placeholder="Rechercher chambre..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ paddingLeft: 36, background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          />
        </div>
      </div>

      {/* Floors */}
      {floors.map(floor => (
        <div key={floor.number} className="hk-floor-section">
          <div className="hk-floor-header">
            <div className="hk-floor-title">
              <span style={{ background: '#E8E5FF', color: '#5B4ED1', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                É{floor.number}
              </span>
              Étage {floor.number}
            </div>
            <span className="hk-floor-count">{floor.rooms.length} ch.</span>
          </div>
          <div className="hk-room-grid">
            {floor.rooms.map(room => {
              const color = getRoomColor(room.status)
              return (
                <div 
                  key={room.number}
                  className="hk-room-chip"
                  style={{ background: color.bg }}
                >
                  <span className="hk-room-chip-number" style={{ color: color.text }}>
                    {room.number}
                  </span>
                  <div className="hk-room-chip-dot" style={{ background: color.dot }} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function HousekeepingModule() {
  const [activeView, setActiveView] = useState('reception')
  const data = useHousekeepingData()

  const actions = {
    refresh: data.refresh,
    seedData: data.seedData,
    startTask: data.startTask,
    completeTask: data.completeTask,
    validateInspection: data.validateInspection,
    autoAssign: data.autoAssign,
    updateBreakfast: data.updateBreakfast,
    updateMaintenance: data.updateMaintenance
  }

  if (data.loading && !data.stats) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-500">Chargement du module Housekeeping...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <HousekeepingStyles />
      <div className="hk-container">
        {/* Navigation Tabs */}
        <div className="hk-header">
          <div className="flex items-center justify-between">
            <div className="hk-tabs">
              <button 
                className={`hk-tab ${activeView === 'reception' ? 'active' : ''}`}
                onClick={() => setActiveView('reception')}
                data-testid="hk-nav-reception"
              >
                <MapPin size={16} /> Réception
              </button>
              <button 
                className={`hk-tab ${activeView === 'repartition' ? 'active' : ''}`}
                onClick={() => setActiveView('repartition')}
                data-testid="hk-nav-repartition"
              >
                <Zap size={16} /> Répartition
              </button>
              <button 
                className={`hk-tab ${activeView === 'plan' ? 'active' : ''}`}
                onClick={() => setActiveView('plan')}
                data-testid="hk-nav-plan"
              >
                <Grid3X3 size={16} /> Plan Hôtel
              </button>
              <button 
                className={`hk-tab ${activeView === 'gouvernante' ? 'active' : ''}`}
                onClick={() => setActiveView('gouvernante')}
                data-testid="hk-nav-gouvernante"
              >
                <CheckCircle size={16} /> Gouvernante
              </button>
              <button 
                className={`hk-tab ${activeView === 'maintenance' ? 'active' : ''}`}
                onClick={() => setActiveView('maintenance')}
                data-testid="hk-nav-maintenance"
              >
                <Wrench size={16} /> Maintenance
              </button>
              <button 
                className={`hk-tab ${activeView === 'breakfast' ? 'active' : ''}`}
                onClick={() => setActiveView('breakfast')}
                data-testid="hk-nav-breakfast"
              >
                <Coffee size={16} /> Petit-déj
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={actions.refresh}>
                <RefreshCw size={14} className="mr-1" /> Actualiser
              </Button>
              <Button variant="outline" size="sm" onClick={actions.seedData}>
                Données démo
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeView === 'reception' && <ReceptionView data={data} actions={actions} />}
        {activeView === 'repartition' && <RepartitionView data={data} actions={actions} />}
        {activeView === 'plan' && <PlanHotelView data={data} actions={actions} />}
        {activeView === 'gouvernante' && <GouvernanteView data={data} actions={actions} />}
        {activeView === 'maintenance' && <MaintenanceView data={data} actions={actions} />}
        {activeView === 'breakfast' && <BreakfastView data={data} actions={actions} />}
      </div>
    </>
  )
}

// Keep old views for now
const GouvernanteView = ({ data, actions }) => {
  const { inspections, tasks, staff, inventory } = data
  const pendingInsp = inspections.filter(i => i.status === 'en_attente')
  
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Validation Gouvernante</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {pendingInsp.map(insp => (
          <Card key={insp.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">{insp.room_number}</span>
                <Badge style={{ background: '#FEF3C7', color: '#D97706' }}>À valider</Badge>
              </div>
              <p className="text-sm text-slate-500 mb-3">Nettoyée par {insp.cleaned_by_name}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-green-600" onClick={() => actions.validateInspection(insp.id, true, 5, '', '')}>
                  <Check size={14} className="mr-1" /> Valider
                </Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={() => actions.validateInspection(insp.id, false, 0, '', 'À refaire')}>
                  <X size={14} className="mr-1" /> Refuser
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {pendingInsp.length === 0 && (
          <p className="text-slate-500">Aucune chambre à valider</p>
        )}
      </div>
    </div>
  )
}

const MaintenanceView = ({ data, actions }) => {
  const { maintenance } = data
  
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Tickets Maintenance</h2>
      {maintenance.map(ticket => (
        <Card key={ticket.id} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">Ch. {ticket.room_number}</span>
              <Badge style={{ 
                background: ticket.status === 'resolu' ? '#DCFCE7' : ticket.status === 'en_cours' ? '#FEF3C7' : '#FEE2E2',
                color: ticket.status === 'resolu' ? '#16A34A' : ticket.status === 'en_cours' ? '#D97706' : '#DC2626'
              }}>
                {ticket.status === 'resolu' ? 'Résolu' : ticket.status === 'en_cours' ? 'En cours' : 'En attente'}
              </Badge>
            </div>
            <p className="font-medium">{ticket.title}</p>
            <p className="text-sm text-slate-500">{ticket.description}</p>
            {ticket.status !== 'resolu' && (
              <Button 
                size="sm" 
                className="mt-3"
                onClick={() => actions.updateMaintenance(ticket.id, { status: ticket.status === 'en_attente' ? 'en_cours' : 'resolu' })}
              >
                {ticket.status === 'en_attente' ? 'Commencer' : 'Résoudre'}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const BreakfastView = ({ data, actions }) => {
  const { breakfast } = data
  
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Commandes Petit-déjeuner</h2>
      {breakfast.map(order => (
        <Card key={order.id} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">Ch. {order.room_number}</span>
              <Badge style={{ 
                background: order.status === 'servi' ? '#DCFCE7' : order.status === 'prepare' ? '#DBEAFE' : '#FEF3C7',
                color: order.status === 'servi' ? '#16A34A' : order.status === 'prepare' ? '#2563EB' : '#D97706'
              }}>
                {order.status === 'servi' ? 'Servi' : order.status === 'prepare' ? 'Préparé' : 'À préparer'}
              </Badge>
            </div>
            <p className="font-medium">{order.guest_name}</p>
            <p className="text-sm text-slate-500">{order.formule} • {order.person_count} pers.</p>
            {order.status !== 'servi' && (
              <Button 
                size="sm" 
                className="mt-3"
                onClick={() => actions.updateBreakfast(order.id, { 
                  status: order.status === 'a_preparer' ? 'prepare' : order.status === 'prepare' ? 'en_livraison' : 'servi' 
                })}
              >
                {order.status === 'a_preparer' ? 'Préparé' : order.status === 'prepare' ? 'En livraison' : 'Servi'}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export { HousekeepingModule }
