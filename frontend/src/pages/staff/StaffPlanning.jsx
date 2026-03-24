import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useHotel } from '@/context/HotelContext'
import { toast } from 'sonner'
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, isToday, isWeekend, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, Download, Printer, Search, 
  Clock, Eye, History, Filter, Palmtree, UserPlus
} from 'lucide-react'

// Shift types based on PDF design
const SHIFT_TYPES = [
  { value: 'matin', label: 'Matin', abbr: 'M', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'soir', label: 'Soir', abbr: 'S', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'nuit', label: 'Nuit', abbr: 'N', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { value: 'off', label: 'OFF', abbr: 'OFF', color: 'bg-slate-50 text-slate-400 border-slate-200' },
  { value: 'repos', label: 'Repos', abbr: 'Repos', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  { value: 'cp', label: 'Conge paye', abbr: 'CP', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'maladie', label: 'Maladie', abbr: 'MAL', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'ferie', label: 'Ferie', abbr: 'F', color: 'bg-purple-100 text-purple-700 border-purple-200' },
]

const CONTRACT_BADGES = {
  cdi: 'badge-cdi',
  cdd: 'badge-cdd',
  extra: 'badge-extra',
  interim: 'badge-interim',
  stage: 'badge-stage',
  apprentissage: 'badge-apprentissage',
}

const TIMEFRAME_OPTIONS = [
  { value: '7', label: '1 Semaine' },
  { value: '15', label: '15 Jours' },
  { value: '30', label: '1 Mois' },
]

export const StaffPlanning = () => {
  const { api } = useAuth()
  const { currentHotel } = useHotel()
  const [employees, setEmployees] = useState([])
  const [shifts, setShifts] = useState([])
  const [holidays, setHolidays] = useState([])
  const [planningSummary, setPlanningSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30')
  const [viewMode, setViewMode] = useState('lecture')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterContract, setFilterContract] = useState('all')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: '', date: '', start_time: '09:00', end_time: '17:00', break_duration: 60, shift_type: 'matin', notes: ''
  })

  // Generate days array based on timeframe
  const days = useMemo(() => {
    const numDays = parseInt(timeframe)
    const startDate = startOfMonth(currentDate)
    return Array.from({ length: numDays }, (_, i) => addDays(startDate, i))
  }, [currentDate, timeframe])

  const fetchData = async () => {
    if (!currentHotel) return
    setLoading(true)
    try {
      const fromDate = format(days[0], 'yyyy-MM-dd')
      const toDate = format(days[days.length - 1], 'yyyy-MM-dd')
      const year = currentDate.getFullYear()
      
      const [empRes, shiftRes, holidaysRes, summaryRes] = await Promise.all([
        api.get(`/hotels/${currentHotel.id}/staff/employees?is_active=true`),
        api.get(`/hotels/${currentHotel.id}/staff/shifts?from_date=${fromDate}&to_date=${toDate}`),
        api.get(`/hotels/${currentHotel.id}/holidays?year=${year}`),
        api.get(`/hotels/${currentHotel.id}/staff/planning-summary?from_date=${fromDate}&to_date=${toDate}`)
      ])
      setEmployees(empRes.data)
      setShifts(shiftRes.data)
      setHolidays(holidaysRes.data)
      setPlanningSummary(summaryRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [currentHotel, currentDate, timeframe])

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = searchQuery === '' || 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesContract = filterContract === 'all' || emp.contract_type === filterContract
      return matchesSearch && matchesContract
    })
  }, [employees, searchQuery, filterContract])

  // Group employees by department
  const groupedEmployees = useMemo(() => {
    const groups = {}
    filteredEmployees.forEach(emp => {
      const dept = emp.department || 'Autres'
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(emp)
    })
    return groups
  }, [filteredEmployees])

  const getShiftForCell = (employeeId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return shifts.find(s => s.employee_id === employeeId && s.date === dateStr)
  }

  const isHoliday = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return holidays.find(h => h.date === dateStr)
  }

  const getEmployeeSummary = (employeeId) => {
    if (!planningSummary?.employees) return null
    return planningSummary.employees.find(e => e.employee_id === employeeId)
  }

  const getEmployeeLeaveOnDate = (employeeId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const summary = getEmployeeSummary(employeeId)
    if (!summary?.leave_requests) return null
    return summary.leave_requests.find(lr => lr.date_start <= dateStr && lr.date_end >= dateStr)
  }

  const calculateMonthlyHours = (employeeId) => {
    const empShifts = shifts.filter(s => s.employee_id === employeeId)
    return empShifts.reduce((total, s) => total + (s.worked_hours || 0), 0)
  }

  const handlePrevPeriod = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextPeriod = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const handleAddShift = (employeeId, date) => {
    setFormData({
      employee_id: employeeId,
      date: format(date, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      break_duration: 60,
      shift_type: 'matin',
      notes: ''
    })
    setSheetOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/hotels/${currentHotel.id}/staff/shifts`, formData)
      toast.success('Shift ajoute')
      setSheetOpen(false)
      fetchData()
    } catch (error) {
      toast.error("Erreur lors de l'ajout")
    }
  }

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Supprimer ce shift ?')) return
    try {
      await api.delete(`/hotels/${currentHotel.id}/staff/shifts/${shiftId}`)
      toast.success('Shift supprime')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const getDeptLabel = (dept) => {
    const labels = {
      front_office: 'RECEPTION',
      housekeeping: 'HEBERGEMENT',
      food_beverage: 'RESTAURATION',
      maintenance: 'MAINTENANCE',
      administration: 'ADMINISTRATION',
    }
    return labels[dept] || dept?.toUpperCase() || 'AUTRES'
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Title and Period Navigation */}
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">Planning</h1>
            
            {/* Period Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={handlePrevPeriod} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-medium text-slate-700 min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextPeriod} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleToday} className="text-xs">
              Aujourd'hui
            </Button>
          </div>

          {/* Center: Timeframe & View Mode */}
          <div className="flex items-center gap-2">
            {TIMEFRAME_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={timeframe === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(opt.value)}
                className={`text-xs ${timeframe === opt.value ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
              >
                {opt.label}
              </Button>
            ))}
            
            <div className="w-px h-6 bg-slate-200 mx-2" />
            
            <Button
              variant={viewMode === 'lecture' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('lecture')}
              className={`text-xs gap-1.5 ${viewMode === 'lecture' ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Mode Lecture
            </Button>
            <Button
              variant={viewMode === 'historique' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('historique')}
              className={`text-xs gap-1.5 ${viewMode === 'historique' ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
            >
              <History className="w-3.5 h-3.5" />
              Historique
            </Button>
          </div>

          {/* Right: Search, Filters, Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 h-9 text-sm"
              />
            </div>
            
            <Select value={filterContract} onValueChange={setFilterContract}>
              <SelectTrigger className="w-32 h-9 text-sm">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="cdi">CDI</SelectItem>
                <SelectItem value="cdd">CDD</SelectItem>
                <SelectItem value="extra">Extra</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="w-px h-6 bg-slate-200 mx-1" />
            
            <Button variant="default" size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Extra
            </Button>
            
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Exporter
            </Button>
            
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Imprimer
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          {SHIFT_TYPES.map(type => (
            <div key={type.value} className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-7 h-5 text-xs font-semibold rounded border ${type.color}`}>
                {type.abbr}
              </span>
              <span className="text-xs text-slate-600">{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Planning Grid */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full border-collapse" style={{ minWidth: `${days.length * 50 + 250}px` }}>
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                {/* Employee Column Header */}
                <th className="sticky left-0 z-30 bg-slate-50 border-r border-b border-slate-200 p-3 text-left min-w-[200px]">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Collaborateur</span>
                </th>
                {/* H/MOIS Column */}
                <th className="bg-slate-50 border-r border-b border-slate-200 p-2 text-center w-16">
                  <span className="text-xs font-semibold text-slate-500 uppercase">H/Mois</span>
                </th>
                {/* Day Headers */}
                {days.map((day, i) => {
                  const holiday = isHoliday(day)
                  const isTodayDate = isToday(day)
                  const isWeekendDay = isWeekend(day)
                  
                  return (
                    <th
                      key={i}
                      className={`border-r border-b border-slate-200 p-1 text-center w-12 ${
                        holiday ? 'bg-purple-50' :
                        isTodayDate ? 'bg-violet-100' :
                        isWeekendDay ? 'bg-slate-100' :
                        'bg-slate-50'
                      }`}
                    >
                      <div className="text-[10px] font-medium text-slate-500 uppercase">
                        {format(day, 'EEE', { locale: fr })}
                      </div>
                      <div className={`text-sm font-bold ${isTodayDate ? 'text-violet-700' : 'text-slate-700'}`}>
                        {format(day, 'd')}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={days.length + 2} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full spinner" />
                      <span className="text-sm text-slate-500">Chargement du planning...</span>
                    </div>
                  </td>
                </tr>
              ) : Object.keys(groupedEmployees).length === 0 ? (
                <tr>
                  <td colSpan={days.length + 2} className="p-12 text-center text-slate-500">
                    Aucun employe actif
                  </td>
                </tr>
              ) : (
                Object.entries(groupedEmployees).map(([dept, deptEmployees]) => (
                  <React.Fragment key={`dept-group-${dept}`}>
                    {/* Department Header Row */}
                    <tr className="bg-slate-50">
                      <td colSpan={days.length + 2} className="px-3 py-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-600 tracking-wide">{getDeptLabel(dept)}</span>
                      </td>
                    </tr>
                    {/* Employee Rows */}
                    {deptEmployees.map(employee => {
                      const summary = getEmployeeSummary(employee.id)
                      const monthlyHours = calculateMonthlyHours(employee.id)
                      
                      return (
                        <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Employee Info Cell */}
                          <td className="sticky left-0 z-10 bg-white border-r border-b border-slate-100 p-2">
                            <div className="flex items-center gap-2">
                              <div className="employee-avatar-sm">
                                {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {employee.first_name} {employee.last_name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${CONTRACT_BADGES[employee.contract_type] || 'badge-cdi'}`}>
                                    {employee.contract_type?.toUpperCase()}
                                  </span>
                                  {summary && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                                            <Palmtree className="w-3 h-3" />
                                            {summary.cp_total_disponible?.toFixed(1)}j
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-xs">
                                          <p>CP disponibles: {summary.cp_total_disponible?.toFixed(1)}j</p>
                                          <p>CP N: {summary.cp_restant?.toFixed(1)}j</p>
                                          <p>CP N-1: {summary.cp_n1_restant?.toFixed(1)}j</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Monthly Hours Cell */}
                          <td className="border-r border-b border-slate-100 p-1 text-center bg-slate-50/50">
                            <span className="text-xs font-semibold text-slate-600">{monthlyHours.toFixed(0)}h</span>
                          </td>
                          {/* Day Cells */}
                          {days.map((day, i) => {
                            const shift = getShiftForCell(employee.id, day)
                            const holiday = isHoliday(day)
                            const leaveOnDate = getEmployeeLeaveOnDate(employee.id, day)
                            const isTodayDate = isToday(day)
                            const isWeekendDay = isWeekend(day)
                            
                            let cellClass = 'border-r border-b border-slate-100 p-0.5 text-center align-middle'
                            if (leaveOnDate) cellClass += ' bg-emerald-50/70'
                            else if (holiday) cellClass += ' bg-purple-50/50'
                            else if (isTodayDate) cellClass += ' bg-violet-50/50'
                            else if (isWeekendDay) cellClass += ' bg-slate-50/50'
                            
                            return (
                              <td key={i} className={cellClass}>
                                {leaveOnDate ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="shift-badge bg-emerald-100 text-emerald-700 border border-emerald-200">
                                          CP
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">
                                        <p>{leaveOnDate.reason || 'Conge paye'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : shift ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={`shift-badge cursor-pointer ${SHIFT_TYPES.find(t => t.value === shift.shift_type)?.color || 'bg-slate-100'}`}
                                          onClick={() => handleDeleteShift(shift.id)}
                                        >
                                          {shift.start_time?.substring(0, 5) || SHIFT_TYPES.find(t => t.value === shift.shift_type)?.abbr || 'M'}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">
                                        <p>{shift.start_time} - {shift.end_time}</p>
                                        <p>{shift.worked_hours}h - Clic pour supprimer</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : holiday ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="shift-badge bg-purple-100 text-purple-700 border border-purple-200">
                                          F
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">
                                        <p>{holiday.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <button
                                    onClick={() => handleAddShift(employee.id, day)}
                                    className="w-7 h-5 border border-dashed border-slate-200 rounded text-slate-300 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/50 flex items-center justify-center mx-auto transition-all"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Shift Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Ajouter un shift</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Employe</Label>
              <Select value={formData.employee_id} onValueChange={v => setFormData({...formData, employee_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Debut</Label>
                <Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pause (min)</Label>
                <Input type="number" value={formData.break_duration} onChange={e => setFormData({...formData, break_duration: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.shift_type} onValueChange={v => setFormData({...formData, shift_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
              Ajouter le shift
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
