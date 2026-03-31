/**
 * CategoriesConfig - Configuration des catégories (Signalements & Objets Trouvés)
 * Interface Direction pour gérer les catégories paramétrables
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Edit2, Trash2, GripVertical, Save, X, Check,
  AlertTriangle, Package, Lightbulb, Wind, Lock, Droplet, Droplets,
  Tv, Armchair, Smartphone, Laptop, Key, Shirt, Briefcase, 
  Footprints, Gem, Banknote, Loader2, Settings, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from 'sonner'
import axios from 'axios'
import { useHotel } from '@/context/HotelContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

// ═══════════════════════════════════════════════════════════════════════════════
// ICON & COLOR OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const ICON_OPTIONS = [
  { name: 'AlertTriangle', icon: AlertTriangle, label: 'Avertissement' },
  { name: 'Droplets', icon: Droplets, label: 'Eau/WC' },
  { name: 'Lightbulb', icon: Lightbulb, label: 'Ampoule' },
  { name: 'Wind', icon: Wind, label: 'Climatisation' },
  { name: 'Lock', icon: Lock, label: 'Serrure' },
  { name: 'Droplet', icon: Droplet, label: 'Robinet' },
  { name: 'Armchair', icon: Armchair, label: 'Mobilier' },
  { name: 'Tv', icon: Tv, label: 'TV' },
  { name: 'Smartphone', icon: Smartphone, label: 'Téléphone' },
  { name: 'Laptop', icon: Laptop, label: 'Ordinateur' },
  { name: 'Key', icon: Key, label: 'Clés' },
  { name: 'Shirt', icon: Shirt, label: 'Vêtement' },
  { name: 'Briefcase', icon: Briefcase, label: 'Sac/Valise' },
  { name: 'Footprints', icon: Footprints, label: 'Chaussures' },
  { name: 'Gem', icon: Gem, label: 'Bijoux' },
  { name: 'Banknote', icon: Banknote, label: 'Argent' },
  { name: 'Package', icon: Package, label: 'Autre' },
]

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#22C55E', label: 'Vert' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#64748B', label: 'Gris' },
]

const ICON_MAP = {
  AlertTriangle, Droplets, Lightbulb, Wind, Lock, Droplet, Armchair, Tv,
  Smartphone, Laptop, Key, Shirt, Briefcase, Footprints, Gem, Banknote, Package,
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY CARD
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryCard = ({ category, onEdit, onDelete, onToggle }) => {
  const IconComponent = ICON_MAP[category.icon] || Package
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 bg-white rounded-xl border transition-all ${
        category.is_active ? 'border-slate-200' : 'border-slate-100 opacity-50'
      }`}
      data-testid={`category-${category._id}`}
    >
      {/* Drag Handle */}
      <div className="cursor-grab text-slate-300 hover:text-slate-400">
        <GripVertical size={16} />
      </div>
      
      {/* Icon */}
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${category.color}15` }}
      >
        <IconComponent size={20} style={{ color: category.color }} />
      </div>
      
      {/* Name */}
      <div className="flex-1">
        <div className="font-medium text-sm text-slate-800">{category.name}</div>
        {category.is_default && (
          <span className="text-[10px] text-slate-400">Par défaut</span>
        )}
      </div>
      
      {/* Active Toggle */}
      <Switch
        checked={category.is_active}
        onCheckedChange={(checked) => onToggle(category._id, checked)}
        disabled={category.is_default}
      />
      
      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(category)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <Edit2 size={14} />
        </button>
        {!category.is_default && (
          <button
            onClick={() => onDelete(category)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryFormModal = ({ open, onClose, category, type, onSave }) => {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('AlertTriangle')
  const [color, setColor] = useState('#3B82F6')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name || '')
      setIcon(category.icon || 'AlertTriangle')
      setColor(category.color || '#3B82F6')
    } else {
      setName('')
      setIcon(type === 'report' ? 'AlertTriangle' : 'Package')
      setColor('#3B82F6')
    }
  }, [category, type, open])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Le nom est requis')
      return
    }
    
    setLoading(true)
    try {
      await onSave({
        name: name.trim(),
        icon,
        color,
        type,
      })
      onClose()
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde')
    }
    setLoading(false)
  }

  const SelectedIcon = ICON_MAP[icon] || Package

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la catégorie</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Problème électrique"
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((opt) => {
                const IconComp = opt.icon
                return (
                  <button
                    key={opt.name}
                    onClick={() => setIcon(opt.name)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      icon === opt.name 
                        ? 'bg-violet-100 text-violet-600 ring-2 ring-violet-500' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                    title={opt.label}
                  >
                    <IconComp size={18} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColor(opt.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === opt.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  style={{ backgroundColor: opt.value }}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-2">Aperçu</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}15` }}
              >
                <SelectedIcon size={24} style={{ color }} />
              </div>
              <span className="font-semibold text-slate-800">
                {name || 'Nom de la catégorie'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {category ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const DeleteConfirmModal = ({ open, onClose, category, onConfirm }) => {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await onConfirm(category._id)
      onClose()
      toast.success('Catégorie supprimée')
    } catch (e) {
      toast.error('Erreur lors de la suppression')
    }
    setLoading(false)
  }

  if (!category) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-600">Supprimer la catégorie</DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-slate-600">
          Êtes-vous sûr de vouloir supprimer la catégorie "<strong>{category.name}</strong>" ?
          Cette action est irréversible.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CategoriesConfig() {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id

  const [reportCategories, setReportCategories] = useState([])
  const [foundItemCategories, setFoundItemCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reports') // reports | found-items

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!hotelId) return
    const token = localStorage.getItem('flowtym_token')
    
    try {
      const [reportsRes, foundItemsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/settings/categories/reports?activeOnly=false`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/v2/hotels/${hotelId}/settings/categories/found-items?activeOnly=false`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ])
      setReportCategories(reportsRes.data || [])
      setFoundItemCategories(foundItemsRes.data || [])
    } catch (e) {
      console.error('Error fetching categories:', e)
      toast.error('Erreur lors du chargement des catégories')
    }
    setLoading(false)
  }, [hotelId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Create or update category
  const handleSaveCategory = async (data) => {
    const token = localStorage.getItem('flowtym_token')
    
    if (editingCategory) {
      // Update
      await axios.put(
        `${API_URL}/api/v2/hotels/${hotelId}/settings/categories/${editingCategory._id}`,
        { name: data.name, icon: data.icon, color: data.color },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Catégorie modifiée')
    } else {
      // Create
      await axios.post(
        `${API_URL}/api/v2/hotels/${hotelId}/settings/categories`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Catégorie créée')
    }
    
    fetchCategories()
    setEditingCategory(null)
  }

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    const token = localStorage.getItem('flowtym_token')
    await axios.delete(
      `${API_URL}/api/v2/hotels/${hotelId}/settings/categories/${categoryId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    fetchCategories()
  }

  // Toggle category active state
  const handleToggleCategory = async (categoryId, isActive) => {
    const token = localStorage.getItem('flowtym_token')
    await axios.put(
      `${API_URL}/api/v2/hotels/${hotelId}/settings/categories/${categoryId}`,
      { is_active: isActive },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    fetchCategories()
  }

  // Open form modal
  const openCreateModal = () => {
    setEditingCategory(null)
    setFormModalOpen(true)
  }

  const openEditModal = (category) => {
    setEditingCategory(category)
    setFormModalOpen(true)
  }

  const openDeleteModal = (category) => {
    setDeletingCategory(category)
    setDeleteModalOpen(true)
  }

  const currentCategories = activeTab === 'reports' ? reportCategories : foundItemCategories

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="categories-config">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Settings size={20} />
            Configuration des catégories
          </h2>
          <p className="text-sm text-slate-500">
            Personnalisez les catégories de signalements et d'objets trouvés
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'reports' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle size={16} />
          Signalements ({reportCategories.length})
        </button>
        <button
          onClick={() => setActiveTab('found-items')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'found-items' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package size={16} />
          Objets trouvés ({foundItemCategories.length})
        </button>
      </div>

      {/* Add Button */}
      <Button onClick={openCreateModal} className="bg-violet-600 hover:bg-violet-700">
        <Plus size={16} className="mr-2" />
        Ajouter une catégorie
      </Button>

      {/* Categories List */}
      <div className="space-y-2">
        {currentCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            {activeTab === 'reports' ? (
              <AlertTriangle size={48} className="mx-auto mb-4 text-slate-300" />
            ) : (
              <Package size={48} className="mx-auto mb-4 text-slate-300" />
            )}
            <p className="text-slate-500">Aucune catégorie</p>
            <p className="text-sm text-slate-400 mt-1">
              Créez votre première catégorie pour commencer
            </p>
          </div>
        ) : (
          currentCategories.map((category) => (
            <CategoryCard
              key={category._id}
              category={category}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onToggle={handleToggleCategory}
            />
          ))
        )}
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Settings size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">À propos des catégories</p>
            <p className="text-xs text-blue-600 mt-1">
              Les catégories par défaut ne peuvent pas être supprimées, mais peuvent être désactivées.
              Les catégories désactivées ne seront plus proposées lors de la création de signalements ou d'objets trouvés.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CategoryFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setEditingCategory(null)
        }}
        category={editingCategory}
        type={activeTab === 'reports' ? 'report' : 'found-item'}
        onSave={handleSaveCategory}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeletingCategory(null)
        }}
        category={deletingCategory}
        onConfirm={handleDeleteCategory}
      />
    </div>
  )
}
