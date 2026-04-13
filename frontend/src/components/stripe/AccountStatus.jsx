import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, ExternalLink, LogOut, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const API = import.meta.env.VITE_BACKEND_URL || ''

export const AccountStatus = ({ accountId, onStartOnboarding, onLogout }) => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
    if (!accountId) return
    try {
      const res = await fetch(`${API}/api/stripe/account-status/${accountId}`)
      if (!res.ok) throw new Error('Erreur statut')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Account status error:', err)
    } finally {
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    )
  }

  if (!status) return null

  const isActive = status.chargesEnabled
  const needsOnboarding = !status.chargesEnabled && !status.detailsSubmitted

  return (
    <div
      data-testid="account-status-card"
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isActive ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
        boxShadow: '0 4px 24px rgba(124,140,248,0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <Clock className="w-5 h-5 text-amber-500" />
          )}
          <h3 className="text-base font-semibold text-slate-800">
            Compte Stripe{' '}
            <span style={{ color: isActive ? '#10B981' : '#F59E0B' }}>
              {isActive ? 'Actif' : 'En attente'}
            </span>
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchStatus}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Details */}
      <div className="space-y-3 mb-5">
        <StatusRow label="Account ID" value={status.id} mono />
        <StatusRow
          label="Paiements"
          value={status.chargesEnabled ? 'Activés' : 'Désactivés'}
          ok={status.chargesEnabled}
        />
        <StatusRow
          label="Virements"
          value={status.payoutsEnabled ? 'Activés' : 'Désactivés'}
          ok={status.payoutsEnabled}
        />
        <StatusRow
          label="Infos soumises"
          value={status.detailsSubmitted ? 'Oui' : 'Non'}
          ok={status.detailsSubmitted}
        />
      </div>

      {/* Requirements warnings */}
      {status.requirements?.currently_due?.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
            <AlertTriangle className="w-4 h-4" />
            Informations requises
          </div>
          <ul className="text-xs text-amber-600 space-y-0.5 ml-6">
            {status.requirements.currently_due.slice(0, 5).map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {needsOnboarding && (
          <Button
            data-testid="start-onboarding-btn"
            onClick={onStartOnboarding}
            className="w-full gap-2"
            style={{
              background: 'linear-gradient(135deg, #7C8CF8 0%, #6366F1 100%)',
              borderRadius: '40px',
            }}
          >
            Compléter l'inscription Stripe
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}

        <a
          href={`https://dashboard.stripe.com/${accountId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors"
        >
          Dashboard Stripe
          <ExternalLink className="w-4 h-4" />
        </a>

        {onLogout && (
          <Button
            data-testid="stripe-logout-btn"
            variant="outline"
            onClick={onLogout}
            className="w-full gap-2 rounded-full"
          >
            <LogOut className="w-4 h-4" />
            Déconnecter
          </Button>
        )}
      </div>
    </div>
  )
}

const StatusRow = ({ label, value, ok, mono }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <div className="flex items-center gap-1.5">
      {ok !== undefined && (
        ok ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />
      )}
      <span className={`text-sm font-medium ${mono ? 'font-mono text-xs text-slate-600' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  </div>
)

export default AccountStatus
