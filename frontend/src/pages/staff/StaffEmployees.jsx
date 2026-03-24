import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useHotel } from '@/context/HotelContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, UserPlus, Mail, Phone, Building2, Calendar, MoreHorizontal, Edit, Trash2, FileText } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const POSITIONS = [
  { value: 'receptionist', label: 'Receptionniste' },
  { value: 'housekeeper', label: 'Femme de chambre' },
  { value: 'maintenance', label: 'Technicien maintenance' },
  { value: 'manager', label: 'Manager' },
  { value: 'chef', label: 'Chef cuisinier' },
  { value: 'waiter', label: 'Serveur' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'night_auditor', label: 'Night auditor' },
]

const DEPARTMENTS = [
  { value: 'front_office', label: 'Reception' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'food_beverage', label: 'Restauration' },
  { value: 'administration', label: 'Administration' },
]

const CONTRACT_TYPES = [
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
  { value: 'interim', label: 'Interim' },
  { value: 'stage', label: 'Stage' },
  { value: 'apprentissage', label: 'Apprentissage' },
]

export const StaffEmployees = () => {
  const { api } = useAuth()
  const { currentHotel } = useHotel()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', position: 'receptionist',
    department: 'front_office', contract_type: 'cdi', hire_date: format(new Date(), 'yyyy-MM-dd'),
    hourly_rate: 11.65, weekly_hours: 35, address: '', city: '', postal_code: '',
    social_security_number: '', bank_iban: '', emergency_contact: '', emergency_phone: '', notes: ''
  })

  const fetchEmployees = async () => {
    if (!currentHotel) return
    setLoading(true)
    try {
      const params = departmentFilter !== 'all' ? `?department=${departmentFilter}` : ''
      const response = await api.get(`/hotels/${currentHotel.id}/staff/employees${params}`)
      setEmployees(response.data)
    } catch (error) {
      toast.error('Erreur lors du chargement des employes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [currentHotel, departmentFilter])

  const filteredEmployees = employees.filter(e => {
    if (!search) return true
    const s = search.toLowerCase()
    return e.first_name.toLowerCase().includes(s) || e.last_name.toLowerCase().includes(s) || e.email?.toLowerCase().includes(s)
  })

  const handleNewEmployee = () => {
    setEditingEmployee(null)
    setFormData({
      first_name: '', last_name: '', email: '', phone: '', position: 'receptionist',
      department: 'front_office', contract_type: 'cdi', hire_date: format(new Date(), 'yyyy-MM-dd'),
      hourly_rate: 11.65, weekly_hours: 35, address: '', city: '', postal_code: '',
      social_security_number: '', bank_iban: '', emergency_contact: '', emergency_phone: '', notes: ''
    })
    setSheetOpen(true)
  }

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      first_name: employee.first_name, last_name: employee.last_name, email: employee.email || '',
      phone: employee.phone || '', position: employee.position, department: employee.department,
      contract_type: employee.contract_type, hire_date: employee.hire_date,
      hourly_rate: employee.hourly_rate, weekly_hours: employee.weekly_hours,
      address: employee.address || '', city: employee.city || '', postal_code: employee.postal_code || '',
      social_security_number: employee.social_security_number || '', bank_iban: employee.bank_iban || '',
      emergency_contact: employee.emergency_contact || '', emergency_phone: employee.emergency_phone || '',
      notes: employee.notes || ''
    })
    setSheetOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
        await api.put(`/hotels/${currentHotel.id}/staff/employees/${editingEmployee.id}`, formData)
        toast.success('Employe mis a jour')
      } else {
        await api.post(`/hotels/${currentHotel.id}/staff/employees`, formData)
        toast.success('Employe cree')
      }
      setSheetOpen(false)
      fetchEmployees()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const handleDelete = async (employee) => {
    if (!confirm(`Desactiver ${employee.first_name} ${employee.last_name} ?`)) return
    try {
      await api.delete(`/hotels/${currentHotel.id}/staff/employees/${employee.id}`)
      toast.success('Employe desactive')
      fetchEmployees()
    } catch (error) {
      toast.error('Erreur lors de la desactivation')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employes</h1>
          <p className="text-sm text-slate-500">{filteredEmployees.length} employes</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleNewEmployee} data-testid="btn-new-employee">
          <UserPlus className="w-4 h-4 mr-2" />Nouvel employe
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Departement" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les departements</SelectItem>
            {DEPARTMENTS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-slate-600">Employe</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600">Poste</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600">Departement</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600">Contrat</th>
                <th className="text-left p-3 text-xs font-semibold text-slate-600">Date embauche</th>
                <th className="text-right p-3 text-xs font-semibold text-slate-600">Taux horaire</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full spinner mx-auto" /></td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Aucun employe</td></tr>
              ) : filteredEmployees.map(employee => (
                <tr key={employee.id} className="table-row-hover">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-600">{employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{employee.first_name} {employee.last_name}</p>
                        {employee.email && <p className="text-xs text-slate-500">{employee.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{POSITIONS.find(p => p.value === employee.position)?.label || employee.position}</td>
                  <td className="p-3">
                    <Badge variant="outline">{DEPARTMENTS.find(d => d.value === employee.department)?.label || employee.department}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge className={employee.contract_type === 'cdi' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                      {CONTRACT_TYPES.find(c => c.value === employee.contract_type)?.label || employee.contract_type}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm">{format(new Date(employee.hire_date), 'dd/MM/yyyy')}</td>
                  <td className="p-3 text-right font-mono text-sm">{employee.hourly_rate.toFixed(2)} EUR</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEmployee(employee)}><Edit className="w-4 h-4 mr-2" />Modifier</DropdownMenuItem>
                        <DropdownMenuItem><FileText className="w-4 h-4 mr-2" />Voir contrat</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(employee)}><Trash2 className="w-4 h-4 mr-2" />Desactiver</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader><SheetTitle>{editingEmployee ? 'Modifier l\'employe' : 'Nouvel employe'}</SheetTitle></SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Prenom *</Label><Input value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Nom *</Label><Input value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="space-y-2"><Label>Telephone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Poste *</Label>
                <Select value={formData.position} onValueChange={v => setFormData({...formData, position: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Departement *</Label>
                <Select value={formData.department} onValueChange={v => setFormData({...formData, department: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Type contrat *</Label>
                <Select value={formData.contract_type} onValueChange={v => setFormData({...formData, contract_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTRACT_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Date embauche *</Label><Input type="date" value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Heures/semaine</Label><Input type="number" value={formData.weekly_hours} onChange={e => setFormData({...formData, weekly_hours: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Taux horaire (EUR)</Label><Input type="number" step="0.01" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})} /></div>
              <div className="space-y-2"><Label>N Securite sociale</Label><Input value={formData.social_security_number} onChange={e => setFormData({...formData, social_security_number: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Adresse</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Ville</Label><Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
              <div className="space-y-2"><Label>Code postal</Label><Input value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>IBAN</Label><Input value={formData.bank_iban} onChange={e => setFormData({...formData, bank_iban: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact urgence</Label><Input value={formData.emergency_contact} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} /></div>
              <div className="space-y-2"><Label>Tel. urgence</Label><Input value={formData.emergency_phone} onChange={e => setFormData({...formData, emergency_phone: e.target.value})} /></div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Annuler</Button>
              <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700">{editingEmployee ? 'Mettre a jour' : 'Creer'}</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
