import { useState, useEffect, useCallback } from 'react'
import { useHotel } from '@/context/HotelContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Clock, CheckCircle, AlertCircle, TrendingUp, Loader2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement)

export default function HousekeepingStats() {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')
  const [stats, setStats] = useState({
    daily: [], avgTimeByType: {},
    completionRate: 0, totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0,
  })

  const loadStats = useCallback(async () => {
    if (!hotelId) return
    setLoading(true)
    try {
      const { data: tasks, error } = await supabase
        .from('room_cleaning_tasks')
        .select('*, rooms(room_number)')
        .eq('hotel_id', hotelId)

      if (error) throw error

      const totalTasks = tasks.length
      const pendingTasks = tasks.filter(t => t.status === 'a_faire').length
      const inProgressTasks = tasks.filter(t => t.status === 'en_cours').length
      const completedTasks = tasks.filter(t => t.status === 'termine').length
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Aggregate by date (last 30 days)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - (period === 'week' ? 7 : period === 'month' ? 30 : 90))

      const dailyMap = new Map()
      tasks.filter(t => t.status === 'termine' && t.completed_at && new Date(t.completed_at) >= cutoff)
        .forEach(task => {
          const dayKey = task.completed_at.split('T')[0]
          let duration = null
          if (task.started_at && task.completed_at) {
            duration = Math.round((new Date(task.completed_at) - new Date(task.started_at)) / 60000)
          }
          const prev = dailyMap.get(dayKey) || { count: 0, durations: [] }
          prev.count++
          if (duration) prev.durations.push(duration)
          dailyMap.set(dayKey, prev)
        })

      const daily = Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, d]) => ({
          date,
          count: d.count,
          avgDuration: d.durations.length > 0 ? Math.round(d.durations.reduce((a, b) => a + b, 0) / d.durations.length) : 0,
        }))

      // Avg time by priority
      const avgTimeByType = { 3: { label: 'Haute', total: 0, count: 0, avg: 0 }, 2: { label: 'Moyenne', total: 0, count: 0, avg: 0 }, 1: { label: 'Basse', total: 0, count: 0, avg: 0 } }
      tasks.forEach(task => {
        if (task.status === 'termine' && task.started_at && task.completed_at) {
          const dur = (new Date(task.completed_at) - new Date(task.started_at)) / 60000
          const p = task.priority || 1
          if (avgTimeByType[p]) { avgTimeByType[p].total += dur; avgTimeByType[p].count++ }
        }
      })
      Object.values(avgTimeByType).forEach(v => { if (v.count > 0) v.avg = Math.round(v.total / v.count) })

      setStats({ daily, avgTimeByType, completionRate, totalTasks, pendingTasks, inProgressTasks, completedTasks })
    } catch (e) {
      console.error('[HousekeepingStats]', e)
    } finally {
      setLoading(false)
    }
  }, [hotelId, period])

  useEffect(() => { loadStats() }, [loadStats])

  const kpis = [
    { label: 'Total', value: stats.totalTasks, icon: BarChart3, color: '#6366F1' },
    { label: 'En attente', value: stats.pendingTasks, icon: Clock, color: '#F59E0B' },
    { label: 'En cours', value: stats.inProgressTasks, icon: AlertCircle, color: '#3B82F6' },
    { label: 'Terminées', value: stats.completedTasks, icon: CheckCircle, color: '#22C55E' },
    { label: 'Taux', value: `${stats.completionRate}%`, icon: TrendingUp, color: '#8B5CF6' },
  ]

  const barData = {
    labels: stats.daily.map(d => d.date.substring(5)),
    datasets: [{
      label: 'Taches terminées',
      data: stats.daily.map(d => d.count),
      backgroundColor: 'rgba(34,197,94,0.5)',
      borderColor: '#22C55E',
      borderWidth: 2,
      borderRadius: 6,
    }]
  }

  const lineData = {
    labels: stats.daily.map(d => d.date.substring(5)),
    datasets: [{
      label: 'Temps moyen (min)',
      data: stats.daily.map(d => d.avgDuration),
      backgroundColor: 'rgba(59,130,246,0.2)',
      borderColor: '#3B82F6',
      borderWidth: 2,
      tension: 0.3,
      fill: true,
    }]
  }

  const doughnutData = {
    labels: Object.values(stats.avgTimeByType).map(v => v.label),
    datasets: [{
      data: Object.values(stats.avgTimeByType).map(v => v.avg || 0),
      backgroundColor: ['#EF4444', '#3B82F6', '#10B981'],
      borderWidth: 0,
    }]
  }

  const chartOpts = { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12" data-testid="hk-stats-loading">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500 mr-2" />
        <span className="text-sm text-slate-500">Chargement des statistiques...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="housekeeping-stats">
      {/* Period selector */}
      <div className="flex gap-2" data-testid="hk-stats-period">
        {[{ key: 'week', label: '7 jours' }, { key: 'month', label: '30 jours' }, { key: 'year', label: '90 jours' }].map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${period === p.key ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >{p.label}</button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <kpi.icon className="w-5 h-5 mx-auto mb-1" style={{ color: kpi.color }} />
              <div className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Taches terminées</CardTitle></CardHeader>
          <CardContent>
            {stats.daily.length > 0 ? <Bar data={barData} options={chartOpts} /> : <p className="text-xs text-slate-400 text-center py-8">Pas de données pour cette période</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Temps moyen par jour</CardTitle></CardHeader>
          <CardContent>
            {stats.daily.length > 0 ? <Line data={lineData} options={chartOpts} /> : <p className="text-xs text-slate-400 text-center py-8">Pas de données pour cette période</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Temps moyen par priorité</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-48 h-48">
              <Doughnut data={doughnutData} options={{ ...chartOpts, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Récapitulatif</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.values(stats.avgTimeByType).map(v => (
              <div key={v.label} className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500">{v.label} priorité</span>
                <span className="text-sm font-semibold text-slate-700">{v.avg || 0} min ({v.count} tâches)</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-semibold text-slate-600">Productivité globale</span>
              <span className="text-sm font-bold text-violet-600">{stats.completionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
