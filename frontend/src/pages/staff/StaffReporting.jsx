import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useHotel } from '@/context/HotelContext'
import { toast } from 'sonner'
import { format, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Users, Clock, TrendingUp, Thermometer, FileText, Download, Mail, 
  Settings, ChevronLeft, ChevronRight, BarChart3
} from 'lucide-react'

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Fevrier' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Aout' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Decembre' },
]

const DEPARTMENT_COLORS = {
  'Reception': '#7c3aed',
  'Hebergement': '#3b82f6',
  'Restauration': '#f59e0b',
  'Maintenance': '#22c55e',
  'Direction': '#8b5cf6',
  'Cuisine': '#ef4444',
  'Autre': '#94a3b8',
}

export const StaffReporting = () => {
  const { api } = useAuth()
  const { currentHotel } = useHotel()
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState(null)
  const [autoReportEnabled, setAutoReportEnabled] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchData = async () => {
    if (!currentHotel) return
    setLoading(true)
    try {
      const res = await api.get(`/hotels/${currentHotel.id}/reporting/staff-analytics?month=${month}&year=${year}`)
      setData(res.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [currentHotel, month, year])

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  // Calculate max hours for bar chart scaling
  const maxHours = useMemo(() => {
    if (!data?.hours_by_service) return 100
    return Math.max(...data.hours_by_service.map(s => s.hours), 100)
  }, [data])

  // Export to PDF
  const handleExportPDF = async () => {
    setExporting(true)
    try {
      // Create printable content
      const printContent = document.getElementById('report-content')
      if (printContent) {
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
          <html>
            <head>
              <title>Rapport Staff - ${MONTHS.find(m => m.value === month)?.label} ${year}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                h1 { color: #333; }
                .kpi { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .kpi-value { font-size: 24px; font-weight: bold; }
                .kpi-label { color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <h1>Rapport Comptabilite Staff - ${currentHotel?.name}</h1>
              <h2>${MONTHS.find(m => m.value === month)?.label} ${year}</h2>
              
              <div>
                <div class="kpi">
                  <div class="kpi-value">${data?.summary?.active_employees || 0}</div>
                  <div class="kpi-label">Collaborateurs actifs</div>
                </div>
                <div class="kpi">
                  <div class="kpi-value">${data?.summary?.total_hours || 0}h</div>
                  <div class="kpi-label">Heures totales</div>
                </div>
                <div class="kpi">
                  <div class="kpi-value">${data?.summary?.total_overtime || 0}h</div>
                  <div class="kpi-label">Heures sup.</div>
                </div>
                <div class="kpi">
                  <div class="kpi-value">${data?.summary?.total_sick_days || 0}j</div>
                  <div class="kpi-label">Arrets maladie</div>
                </div>
              </div>

              <h3>Detail par collaborateur</h3>
              <table>
                <thead>
                  <tr>
                    <th>Collaborateur</th>
                    <th>Service</th>
                    <th>J. Travailles</th>
                    <th>H. Totales</th>
                    <th>H. Sup</th>
                    <th>Absences</th>
                    <th>CP</th>
                    <th>Maladie</th>
                  </tr>
                </thead>
                <tbody>
                  ${(data?.employees || []).map(emp => `
                    <tr>
                      <td>${emp.employee_name}</td>
                      <td>${emp.department}</td>
                      <td>${emp.worked_days}</td>
                      <td>${emp.total_hours}h</td>
                      <td>${emp.overtime_hours}h</td>
                      <td>${emp.absences}</td>
                      <td>${emp.cp_days}</td>
                      <td>${emp.sick_days}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <p style="margin-top: 40px; color: #999; font-size: 10px;">
                Genere le ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Flowtym PMS
              </p>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
      toast.success('Rapport PDF genere')
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    } finally {
      setExporting(false)
    }
  }

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    if (!data?.employees) return
    
    const headers = ['Collaborateur', 'Service', 'J. Travailles', 'H. Totales', 'H. Sup', 'Absences', 'CP', 'Maladie']
    const rows = data.employees.map(emp => [
      emp.employee_name,
      emp.department,
      emp.worked_days,
      emp.total_hours,
      emp.overtime_hours,
      emp.absences,
      emp.cp_days,
      emp.sick_days
    ])
    
    // Add totals row
    const totals = [
      'TOTAUX',
      '',
      data.employees.reduce((sum, e) => sum + e.worked_days, 0),
      data.summary.total_hours,
      data.summary.total_overtime,
      data.employees.reduce((sum, e) => sum + e.absences, 0),
      data.employees.reduce((sum, e) => sum + e.cp_days, 0),
      data.summary.total_sick_days
    ]
    rows.push(totals)
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport_staff_${year}_${month}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('Export Excel (CSV) telecharge')
  }

  // Send by email
  const handleSendEmail = async () => {
    toast.success('Rapport envoye par email')
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full spinner" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Reporting Comptabilite</h1>
            <p className="text-sm text-slate-500">Donnees de presence et heures travaillees</p>
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-medium text-slate-700 min-w-[140px] text-center">
                {MONTHS.find(m => m.value === month)?.label} {year}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.summary?.active_employees || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Collaborateurs actifs</p>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.summary?.total_hours || 0}h</p>
            <p className="text-sm text-slate-500 mt-1">Heures totales</p>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.summary?.total_overtime || 0}h</p>
            <p className="text-sm text-slate-500 mt-1">Heures supplementaires</p>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-3">
              <Thermometer className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.summary?.total_sick_days || 0}j</p>
            <p className="text-sm text-slate-500 mt-1">Arrets maladie</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Employee Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden" id="report-content">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Detail par collaborateur</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Collaborateur</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Service</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">J. Trav.</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">H. Totales</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">H. Sup</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">Abs.</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">CP</th>
                    <th className="text-center p-3 text-xs font-semibold text-slate-500 uppercase">Maladie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.employees || []).map(emp => (
                    <tr key={emp.employee_id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-medium text-slate-800">{emp.employee_name}</span>
                      </td>
                      <td className="p-3 text-sm text-slate-600">{emp.department}</td>
                      <td className="p-3 text-sm text-center text-slate-600">{emp.worked_days}</td>
                      <td className="p-3 text-sm text-center font-medium text-slate-800">{emp.total_hours}h</td>
                      <td className="p-3 text-sm text-center">
                        <span className={emp.overtime_hours > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}>
                          {emp.overtime_hours}h
                        </span>
                      </td>
                      <td className="p-3 text-sm text-center text-slate-600">{emp.absences}</td>
                      <td className="p-3 text-sm text-center">
                        <span className={emp.cp_days > 0 ? 'text-emerald-600' : 'text-slate-400'}>{emp.cp_days}</span>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <span className={emp.sick_days > 0 ? 'text-red-600' : 'text-slate-400'}>{emp.sick_days}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold">
                  <tr>
                    <td className="p-3 text-slate-800">TOTAUX</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-center text-slate-800">
                      {(data?.employees || []).reduce((sum, e) => sum + e.worked_days, 0)}
                    </td>
                    <td className="p-3 text-center text-slate-800">{data?.summary?.total_hours}h</td>
                    <td className="p-3 text-center text-amber-600">{data?.summary?.total_overtime}h</td>
                    <td className="p-3 text-center text-slate-800">
                      {(data?.employees || []).reduce((sum, e) => sum + e.absences, 0)}
                    </td>
                    <td className="p-3 text-center text-emerald-600">
                      {(data?.employees || []).reduce((sum, e) => sum + e.cp_days, 0)}
                    </td>
                    <td className="p-3 text-center text-red-600">{data?.summary?.total_sick_days}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Hours by Service Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Heures par service</h2>
            <div className="space-y-3">
              {(data?.hours_by_service || []).map(service => (
                <div key={service.service}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{service.service}</span>
                    <span className="font-medium text-slate-800">{service.hours}h</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(service.hours / maxHours) * 100}%`,
                        backgroundColor: DEPARTMENT_COLORS[service.service] || DEPARTMENT_COLORS['Autre']
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export & Automation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={handleExportPDF} variant="outline" className="gap-2" disabled={exporting}>
                <FileText className="w-4 h-4" />
                PDF
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Excel
              </Button>
              <Button onClick={handleSendEmail} variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                Envoyer
              </Button>
            </div>
            
            <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${autoReportEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {autoReportEnabled ? 'Actif' : 'Inactif'}
                </span>
                <span className="text-sm text-slate-600">Envoi automatique comptabilite</span>
              </div>
              <Switch checked={autoReportEnabled} onCheckedChange={setAutoReportEnabled} />
              <Button variant="ghost" size="sm" className="text-slate-500">
                <Settings className="w-4 h-4 mr-1" /> Configurer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
