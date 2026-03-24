import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useHotel } from '@/context/HotelContext'
import { toast } from 'sonner'
import { format, addDays, startOfWeek, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Plus, Download, Send, Palmtree, CalendarCheck, Info } from 'lucide-react'

const SHIFT_TYPES = [
  { value: 'regular', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'overtime', label: 'Heures sup.', color: 'bg-amber-100 text-amber-700' },
  { value: 'holiday', label: 'Ferie', color: 'bg-purple-100 text-purple-700' },
  { value: 'sick', label: 'Maladie', color: 'bg-red-100 text-red-700' },
  { value: 'vacation', label: 'Conges', color: 'bg-emerald-100 text-emerald-700' },
]

export const StaffPlanning = () => {
  const { api } = useAuth()
  const { currentHotel } = useHotel()
  const [employees, setEmployees] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [sheetOpen, setSheetOpen] = useState(false)
  const [planningSummary, setPlanningSummary] = useState(null)
  const [holidays, setHolidays] = useState([])
  const [formData, setFormData] = useState({
    employee_id: '', date: '', start_time: '09:00', end_time: '17:00', break_duration: 60, shift_type: 'regular', notes: ''
  })

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const fetchData = async () => {
    if (!currentHotel) return
    setLoading(true)
    try {
      const fromDate = format(weekStart, 'yyyy-MM-dd')
      const toDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')
      const [empRes, shiftRes, summaryRes, holidaysRes] = await Promise.all([
        api.get(`/hotels/${currentHotel.id}/staff/employees?is_active=true`),
        api.get(`/hotels/${currentHotel.id}/staff/shifts?from_date=${fromDate}&to_date=${toDate}`),
        api.get(`/hotels/${currentHotel.id}/staff/planning-summary?from_date=${fromDate}&to_date=${toDate}`),
        api.get(`/hotels/${currentHotel.id}/holidays?year=${new Date().getFullYear()}`)
      ])
      setEmployees(empRes.data)
      setShifts(shiftRes.data)
      setPlanningSummary(summaryRes.data)
      setHolidays(holidaysRes.data)
    } catch (error) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [currentHotel, weekStart])

  const getShiftsForCell = (employeeId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return shifts.filter(s => s.employee_id === employeeId && s.date === dateStr)
  }

  const getEmployeeSummary = (employeeId) => {
    if (!planningSummary?.employees) return null
    return planningSummary.employees.find(e => e.employee_id === employeeId)
  }

  const isHoliday = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return holidays.find(h => h.date === dateStr)
  }

  const getEmployeeLeaveOnDate = (employeeId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const summary = getEmployeeSummary(employeeId)
    if (!summary?.leave_requests) return null
    return summary.leave_requests.find(lr => lr.date_start <= dateStr && lr.date_end >= dateStr)
  }

  const handlePrevWeek = () => setWeekStart(addDays(weekStart, -7))
  const handleNextWeek = () => setWeekStart(addDays(weekStart, 7))
  const handleThisWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const handleAddShift = (employeeId, date) => {
    setFormData({
      employee_id: employeeId, date: format(date, 'yyyy-MM-dd'), start_time: '09:00', end_time: '17:00',
      break_duration: 60, shift_type: 'regular', notes: ''
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
      toast.error('Erreur lors de l\'ajout')
    }
  }

  const handleDeleteShift = async (shiftId) => {
    try {
      await api.delete(`/hotels/${currentHotel.id}/staff/shifts/${shiftId}`)
      toast.success('Shift supprime')
      fetchData()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const handleExportPlanning = () => {
    toast.success('Export du planning en cours...')
  }

  const handleSendPlanning = () => {
    toast.success('Envoi du planning aux employes...')
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Planning du personnel</h1>
            <p className="text-sm text-slate-500">Semaine du {format(weekStart, 'dd MMMM yyyy', { locale: fr })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPlanning}><Download className="w-4 h-4 mr-2" />Exporter</Button>
          <Button variant="outline" onClick={handleSendPlanning}><Send className="w-4 h-4 mr-2" />Envoyer</Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-3">
        <Button variant="outline" size="sm" onClick={handlePrevWeek}><ChevronLeft className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={handleThisWeek}>Cette semaine</Button>
        <Button variant="outline" size="sm" onClick={handleNextWeek}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {/* Planning grid */}
      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-slate-600 w-48 sticky left-0 bg-slate-50 z-10">Employé</th>
                <th className="text-center p-3 text-xs font-semibold text-emerald-600 w-20 bg-emerald-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center justify-center gap-1 w-full">
                        <Palmtree className="w-3 h-3" />
                        CP Solde
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Congés payés disponibles (N + N-1)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="text-center p-3 text-xs font-semibold text-blue-600 w-20 bg-blue-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center justify-center gap-1 w-full">
                        <CalendarCheck className="w-3 h-3" />
                        CP Pris
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">CP pris cette période</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                {weekDays.map((day, i) => {
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6
                  const holiday = isHoliday(day)
                  return (
                    <th key={i} className={`text-center p-3 text-xs font-semibold min-w-[100px] ${holiday ? 'bg-purple-100 text-purple-700' : isToday ? 'bg-violet-100 text-violet-700' : isWeekend ? 'bg-slate-100 text-slate-500' : 'text-slate-600'}`}>
                      <div className="flex items-center justify-center gap-1">
                        {format(day, 'EEE', { locale: fr })}
                        {holiday && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3 h-3 text-purple-600" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-medium">{holiday.name}</p>
                                <p className="text-xs text-slate-500">{holiday.is_mandatory ? 'Jour férié obligatoire' : 'Jour férié optionnel'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="text-sm font-bold">{format(day, 'd')}</div>
                      {holiday && <div className="text-[10px] font-medium text-purple-600 truncate">{holiday.name}</div>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center"><div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full spinner mx-auto" /></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-slate-500">Aucun employé actif</td></tr>
              ) : employees.map(employee => {
                const summary = getEmployeeSummary(employee.id)
                return (
                <tr key={employee.id}>
                  <td className="p-3 border-r border-slate-100 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-semibold">
                        {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{employee.first_name} {employee.last_name}</p>
                        <p className="text-xs text-slate-500">{employee.position}</p>
                      </div>
                    </div>
                  </td>
                  {/* CP Solde column */}
                  <td className="p-2 border-r border-slate-100 bg-emerald-50/50 text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold">
                            {summary?.cp_total_disponible?.toFixed(1) || '0.0'}j
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="w-48">
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold">Détail des CP</p>
                            <div className="flex justify-between">
                              <span>CP acquis (N):</span>
                              <span className="font-medium">{summary?.cp_acquis?.toFixed(1) || '0.0'}j</span>
                            </div>
                            <div className="flex justify-between">
                              <span>CP restant (N):</span>
                              <span className="font-medium">{summary?.cp_restant?.toFixed(1) || '0.0'}j</span>
                            </div>
                            <div className="flex justify-between text-amber-600">
                              <span>CP N-1 restant:</span>
                              <span className="font-medium">{summary?.cp_n1_restant?.toFixed(1) || '0.0'}j</span>
                            </div>
                            <hr className="my-1" />
                            <div className="flex justify-between font-semibold">
                              <span>Total disponible:</span>
                              <span>{summary?.cp_total_disponible?.toFixed(1) || '0.0'}j</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  {/* CP Pris column */}
                  <td className="p-2 border-r border-slate-100 bg-blue-50/50 text-center">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-semibold">
                      {summary?.cp_pris_periode?.toFixed(1) || '0.0'}j
                    </Badge>
                  </td>
                  {/* Week days */}
                  {weekDays.map((day, i) => {
                    const cellShifts = getShiftsForCell(employee.id, day)
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    const holiday = isHoliday(day)
                    const leaveOnDate = getEmployeeLeaveOnDate(employee.id, day)
                    return (
                      <td key={i} className={`p-1 border-r border-slate-100 align-top min-h-[60px] ${leaveOnDate ? 'bg-emerald-50' : holiday ? 'bg-purple-50/50' : isToday ? 'bg-violet-50/50' : ''}`}>
                        <div className="min-h-[50px] space-y-1">
                          {leaveOnDate ? (
                            <div className="text-xs p-1.5 rounded bg-emerald-100 text-emerald-700">
                              <div className="font-medium flex items-center gap-1">
                                <Palmtree className="w-3 h-3" />
                                Congé
                              </div>
                              <div className="text-[10px] opacity-75">{leaveOnDate.leave_type === 'cp' ? 'CP' : leaveOnDate.leave_type}</div>
                            </div>
                          ) : (
                            <>
                              {cellShifts.map(shift => {
                                const type = SHIFT_TYPES.find(t => t.value === shift.shift_type)
                                return (
                                  <div
                                    key={shift.id}
                                    className={`text-xs p-1.5 rounded ${type?.color || 'bg-slate-100'} cursor-pointer hover:opacity-80`}
                                    onClick={() => handleDeleteShift(shift.id)}
                                    title="Cliquer pour supprimer"
                                  >
                                    <div className="font-medium">{shift.start_time} - {shift.end_time}</div>
                                    <div className="text-[10px] opacity-75">{shift.worked_hours}h</div>
                                  </div>
                                )
                              })}
                              {holiday && cellShifts.length === 0 && (
                                <div className="text-xs p-1.5 rounded bg-purple-100 text-purple-700 text-center">
                                  <div className="text-[10px] font-medium">Férié</div>
                                </div>
                              )}
                              <button
                                onClick={() => handleAddShift(employee.id, day)}
                                className="w-full h-6 border border-dashed border-slate-300 rounded text-slate-400 hover:border-violet-400 hover:text-violet-600 flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        {SHIFT_TYPES.map(type => (
          <div key={type.value} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${type.color.split(' ')[0]}`} />
            <span className="text-slate-600">{type.label}</span>
          </div>
        ))}
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Ajouter un shift</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Employe</Label>
              <Select value={formData.employee_id} onValueChange={v => setFormData({...formData, employee_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Debut</Label><Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} /></div>
              <div className="space-y-2"><Label>Fin</Label><Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Pause (min)</Label><Input type="number" value={formData.break_duration} onChange={e => setFormData({...formData, break_duration: parseInt(e.target.value)})} /></div>
              <div className="space-y-2"><Label>Type</Label>
                <Select value={formData.shift_type} onValueChange={v => setFormData({...formData, shift_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">Ajouter</Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
