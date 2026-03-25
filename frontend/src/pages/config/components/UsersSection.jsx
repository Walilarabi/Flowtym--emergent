/**
 * Users Section - RBAC Management
 */
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, Shield, Mail, Phone, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { toast } from 'sonner';
import { getConfigUsers, getAvailableRoles, createConfigUser, updateConfigUser, deleteConfigUser } from '../configApi';

const ROLE_COLORS = {
  admin: 'bg-violet-100 text-violet-700',
  reception: 'bg-blue-100 text-blue-700',
  revenue_manager: 'bg-emerald-100 text-emerald-700',
  housekeeping: 'bg-amber-100 text-amber-700',
  accounting: 'bg-slate-100 text-slate-700',
  readonly: 'bg-gray-100 text-gray-700',
};

const DEPARTMENTS = [
  { value: 'management', label: 'Direction' },
  { value: 'front_office', label: 'Front Office' },
  { value: 'revenue', label: 'Revenue Management' },
  { value: 'sales', label: 'Commercial' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'accounting', label: 'Comptabilité' },
  { value: 'it', label: 'IT' },
];

const initialForm = {
  email: '',
  first_name: '',
  last_name: '',
  role: 'reception',
  department: 'front_office',
  phone: '',
  job_title: '',
  language: 'fr'
};

export default function UsersSection({ hotelId, onUpdate }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [hotelId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        getConfigUsers(hotelId),
        getAvailableRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department: user.department || 'front_office',
      phone: user.phone || '',
      job_title: user.job_title || '',
      language: user.language || 'fr'
    });
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Désactiver l'utilisateur "${user.full_name}" ?`)) return;
    
    try {
      await deleteConfigUser(hotelId, user.id);
      toast.success('Utilisateur désactivé');
      loadData();
      onUpdate?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSave = async () => {
    if (!form.email || !form.first_name || !form.last_name) {
      toast.error('Email, prénom et nom sont requis');
      return;
    }
    
    try {
      setSaving(true);
      if (editingUser) {
        await updateConfigUser(hotelId, editingUser.id, form);
        toast.success('Utilisateur mis à jour');
      } else {
        await createConfigUser(hotelId, form);
        toast.success('Utilisateur créé');
      }
      setShowModal(false);
      loadData();
      onUpdate?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (code) => roles.find(r => r.code === code)?.name || code;
  const getDepartmentLabel = (value) => DEPARTMENTS.find(d => d.value === value)?.label || value;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6" data-testid="users-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-100 rounded-xl">
            <Users className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Utilisateurs & Accès</h2>
            <p className="text-sm text-slate-500">Gestion des droits et des rôles</p>
          </div>
        </div>
        <Button onClick={handleAdd} data-testid="add-user-btn">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Roles Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {roles.map(role => {
          const count = users.filter(u => u.role === role.code).length;
          return (
            <Card key={role.code} className="text-center">
              <CardContent className="py-3">
                <div className="text-2xl font-bold text-slate-900">{count}</div>
                <div className="text-xs text-slate-500 truncate">{role.name}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">Aucun utilisateur configuré</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Créer le premier utilisateur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-violet-100 text-violet-700">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-slate-500">{user.job_title || '-'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[user.role] || 'bg-slate-100'}>
                      {getRoleName(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Building className="h-3 w-3" />
                      <span className="text-sm">{getDepartmentLabel(user.department)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(user)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Roles Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Référentiel des rôles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.code} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={ROLE_COLORS[role.code] || 'bg-slate-100'}>{role.name}</Badge>
                </div>
                <p className="text-sm text-slate-500">{role.description}</p>
                <div className="mt-2 flex gap-2 text-xs">
                  {role.can_manage_config && (
                    <span className="text-emerald-600">Config</span>
                  )}
                  {role.can_manage_users && (
                    <span className="text-blue-600">Utilisateurs</span>
                  )}
                  {role.can_view_financials && (
                    <span className="text-amber-600">Finance</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                placeholder="Marie"
                data-testid="user-firstname-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                placeholder="Dupont"
                data-testid="user-lastname-input"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="marie.dupont@hotel.com"
                data-testid="user-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle *</Label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Département</Label>
              <Select value={form.department} onValueChange={(v) => setForm(f => ({ ...f, department: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fonction</Label>
              <Input
                value={form.job_title}
                onChange={(e) => setForm(f => ({ ...f, job_title: e.target.value }))}
                placeholder="Réceptionniste"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label>Langue</Label>
              <Select value={form.language} onValueChange={(v) => setForm(f => ({ ...f, language: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-user-btn">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
