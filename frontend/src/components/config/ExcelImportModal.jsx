/**
 * ExcelImportModal - Modal d'import Excel pour les chambres
 * Permet de télécharger le template, uploader un fichier, preview et confirmer
 */

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Upload, Download, FileSpreadsheet, Check, X, AlertTriangle,
  Loader2, ChevronRight, Eye, RefreshCw, CheckCircle, FileWarning
} from 'lucide-react'
import { useHotel } from '@/context/HotelContext'
import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL

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
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'Télécharger' },
    { id: 2, label: 'Importer' },
    { id: 3, label: 'Prévisualiser' },
    { id: 4, label: 'Confirmer' },
  ]

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step.id === currentStep 
                ? 'bg-violet-600 text-white' 
                : step.id < currentStep 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-200 text-slate-500'
            }`}
          >
            {step.id < currentStep ? <Check size={16} /> : step.id}
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-1 ${step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREVIEW TABLE
// ═══════════════════════════════════════════════════════════════════════════════

const PreviewTable = ({ rooms, errors }) => {
  if (!rooms || rooms.length === 0) return null

  const columns = ['room_number', 'room_type', 'floor', 'capacity', 'room_size', 'view_type', 'bathroom_type']
  const labels = {
    room_number: 'N° Chambre',
    room_type: 'Type',
    floor: 'Étage',
    capacity: 'Capacité',
    room_size: 'Surface',
    view_type: 'Vue',
    bathroom_type: 'SDB'
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="max-h-[300px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              <th className="py-2 px-3 text-left text-xs font-semibold text-slate-600">Statut</th>
              {columns.map(col => (
                <th key={col} className="py-2 px-3 text-left text-xs font-semibold text-slate-600">
                  {labels[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.map((room, idx) => {
              const roomErrors = errors?.filter(e => e.row === idx + 2) || []
              const hasErrors = roomErrors.length > 0
              
              return (
                <tr key={idx} className={hasErrors ? 'bg-red-50' : 'hover:bg-slate-50'}>
                  <td className="py-2 px-3">
                    {hasErrors ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <X size={14} /> Erreur
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Check size={14} /> OK
                      </span>
                    )}
                  </td>
                  {columns.map(col => (
                    <td key={col} className="py-2 px-3 text-slate-700">
                      {room[col] || '-'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ExcelImportModal({ open, onOpenChange, onImportComplete }) {
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('flowtym_token')}`
  })

  // Download template
  const handleDownloadTemplate = useCallback(async () => {
    if (!hotelId) {
      toast.error('Sélectionnez un hôtel')
      return
    }
    
    setLoading(true)
    try {
      const response = await axios.get(
        `${API_URL}/api/config/hotels/${hotelId}/rooms/import/template`,
        { 
          headers: getAuthHeader(),
          responseType: 'blob'
        }
      )
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `template_chambres_${hotelId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Template téléchargé')
      setStep(2)
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Erreur lors du téléchargement')
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Fichier Excel requis (.xlsx ou .xls)')
      return
    }

    setFile(selectedFile)
  }, [])

  // Preview file
  const handlePreview = useCallback(async () => {
    if (!file || !hotelId) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(
        `${API_URL}/api/config/hotels/${hotelId}/rooms/import/preview`,
        formData,
        { 
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      setPreviewData(response.data)
      setStep(3)
      
      if (response.data.errors?.length > 0) {
        toast.warning(`${response.data.errors.length} erreur(s) détectée(s)`)
      } else {
        toast.success(`${response.data.valid_rooms?.length || 0} chambre(s) prêtes à importer`)
      }
    } catch (error) {
      console.error('Error previewing file:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'analyse du fichier')
    } finally {
      setLoading(false)
    }
  }, [file, hotelId])

  // Confirm import
  const handleConfirmImport = useCallback(async () => {
    if (!file || !hotelId) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('skip_errors', 'true')

      const response = await axios.post(
        `${API_URL}/api/config/hotels/${hotelId}/rooms/import/confirm`,
        formData,
        { 
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      setImportResult(response.data)
      setStep(4)
      toast.success(`${response.data.imported || 0} chambre(s) importée(s) avec succès`)
      
      if (onImportComplete) {
        onImportComplete(response.data)
      }
    } catch (error) {
      console.error('Error importing file:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'import')
    } finally {
      setLoading(false)
    }
  }, [file, hotelId, onImportComplete])

  // Reset and close
  const handleClose = useCallback(() => {
    setStep(1)
    setFile(null)
    setPreviewData(null)
    setImportResult(null)
    onOpenChange(false)
  }, [onOpenChange])

  // Reset to step 1
  const handleReset = useCallback(() => {
    setStep(1)
    setFile(null)
    setPreviewData(null)
    setImportResult(null)
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={20} style={{ color: COLORS.brand }} />
            Import Excel des chambres
          </DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <div className="min-h-[300px]">
          {/* STEP 1: Download Template */}
          {step === 1 && (
            <div className="text-center py-8">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: COLORS.brandSoft }}
              >
                <Download size={36} style={{ color: COLORS.brand }} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Téléchargez le template
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Utilisez notre template Excel pour formater correctement vos chambres. 
                Remplissez les colonnes et réimportez le fichier.
              </p>
              <Button 
                onClick={handleDownloadTemplate}
                disabled={loading}
                style={{ background: COLORS.brand }}
                size="lg"
              >
                {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
                Télécharger le template
              </Button>
              <p className="text-xs text-slate-400 mt-4">
                Vous avez déjà un fichier prêt ?{' '}
                <button onClick={() => setStep(2)} className="text-violet-600 hover:underline">
                  Passer à l'import
                </button>
              </p>
            </div>
          )}

          {/* STEP 2: Upload File */}
          {step === 2 && (
            <div className="py-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:border-violet-300'
                }`}
              >
                {file ? (
                  <div>
                    <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
                    <p className="font-semibold text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <button 
                      onClick={() => setFile(null)}
                      className="text-sm text-red-500 hover:underline mt-2"
                    >
                      Changer de fichier
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload size={40} className="mx-auto mb-3 text-slate-400" />
                    <p className="font-semibold text-slate-700">Glissez-déposez ou cliquez</p>
                    <p className="text-sm text-slate-500">Format accepté: .xlsx, .xls</p>
                    <input 
                      type="file" 
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {file && (
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button 
                    onClick={handlePreview}
                    disabled={loading}
                    style={{ background: COLORS.brand }}
                  >
                    {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Eye size={16} className="mr-2" />}
                    Prévisualiser
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 3 && previewData && (
            <div className="py-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-800">{previewData.total_rows || 0}</div>
                  <div className="text-xs text-slate-500">Lignes lues</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: COLORS.successSoft }}>
                  <div className="text-2xl font-bold" style={{ color: COLORS.success }}>
                    {previewData.valid_rooms?.length || 0}
                  </div>
                  <div className="text-xs text-slate-500">Valides</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: COLORS.dangerSoft }}>
                  <div className="text-2xl font-bold" style={{ color: COLORS.danger }}>
                    {previewData.errors?.length || 0}
                  </div>
                  <div className="text-xs text-slate-500">Erreurs</div>
                </div>
              </div>

              {/* Errors List */}
              {previewData.errors?.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                    <AlertTriangle size={16} />
                    Erreurs détectées
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {previewData.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>Ligne {err.row}: {err.message}</li>
                    ))}
                    {previewData.errors.length > 5 && (
                      <li className="text-slate-500">... et {previewData.errors.length - 5} autre(s)</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              <PreviewTable rooms={previewData.valid_rooms} errors={previewData.errors} />

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Retour
                </Button>
                <Button 
                  onClick={handleConfirmImport}
                  disabled={loading || !previewData.can_proceed}
                  style={{ background: previewData.can_proceed ? COLORS.success : '#CBD5E1' }}
                >
                  {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <CheckCircle size={16} className="mr-2" />}
                  Confirmer l'import ({previewData.valid_rooms?.length || 0} chambres)
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && importResult && (
            <div className="text-center py-8">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: COLORS.successSoft }}
              >
                <CheckCircle size={40} style={{ color: COLORS.success }} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Import terminé !
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                <strong className="text-emerald-600">{importResult.imported || 0}</strong> chambre(s) importée(s) avec succès
                {importResult.skipped > 0 && (
                  <span className="text-amber-600"> • {importResult.skipped} ignorée(s)</span>
                )}
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw size={16} className="mr-2" />
                  Nouvel import
                </Button>
                <Button onClick={handleClose} style={{ background: COLORS.brand }}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
