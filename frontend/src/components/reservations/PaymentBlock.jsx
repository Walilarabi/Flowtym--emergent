import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Send, Clock, AlertTriangle, CheckCircle, XCircle,
  ShieldCheck, RefreshCw, Loader2, ExternalLink, Bell, Euro, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const API = import.meta.env.VITE_BACKEND_URL || ''

const PAYMENT_STATUS_CONFIG = {
  pending:       { label: 'En attente',          color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
  link_sent:     { label: 'Lien envoye',         color: '#3B82F6', bg: '#DBEAFE', icon: Send },
  preauthorized: { label: 'Carte preautorisee',  color: '#8B5CF6', bg: '#EDE9FE', icon: ShieldCheck },
  partial_paid:  { label: 'Acompte paye',        color: '#06B6D4', bg: '#CFFAFE', icon: Euro },
  paid:          { label: 'Paye en totalite',     color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
  failed:        { label: 'Echoue',              color: '#EF4444', bg: '#FEE2E2', icon: XCircle },
  cancelled:     { label: 'Annulee',             color: '#6B7280', bg: '#F3F4F6', icon: XCircle },
}

export const PaymentBlock = ({ reservation, hotelId, onUpdate }) => {
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchPaymentStatus = useCallback(async () => {
    if (!reservation?.id) return
    try {
      const res = await fetch(`${API}/api/payments/auto/status/${reservation.id}`)
      if (res.ok) {
        const data = await res.json()
        setPaymentInfo(data)
      }
    } catch (err) {
      console.error('Payment status fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [reservation?.id])

  useEffect(() => {
    fetchPaymentStatus()
  }, [fetchPaymentStatus])

  const doAction = async (endpoint, body, successMsg) => {
    setActionLoading(endpoint)
    try {
      const res = await fetch(`${API}/api/payments/auto/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, reservation_id: reservation.id, ...body }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || successMsg)
        fetchPaymentStatus()
        onUpdate?.()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const status = paymentInfo?.payment_status || 'pending'
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending
  const StatusIcon = config.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div data-testid="payment-block" className="space-y-4">
      {/* Status Header */}
      <div
        className="rounded-xl p-4"
        style={{ background: config.bg, border: `1px solid ${config.color}22` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${config.color}20` }}
            >
              <StatusIcon className="w-5 h-5" style={{ color: config.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: config.color }}>
                PAIEMENT — {config.label}
              </p>
              {paymentInfo?.deadline_label && (
                <p className="text-xs text-slate-500">{paymentInfo.deadline_label}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchPaymentStatus}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-sm font-bold">{paymentInfo?.total_amount?.toFixed(2) || '0.00'} EUR</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Paye</p>
            <p className="text-sm font-bold text-emerald-600">{paymentInfo?.paid_amount?.toFixed(2) || '0.00'} EUR</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Solde</p>
            <p className={`text-sm font-bold ${(paymentInfo?.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {paymentInfo?.balance?.toFixed(2) || '0.00'} EUR
            </p>
          </div>
        </div>

        {/* Pre-auth info */}
        {paymentInfo?.preauthorization_amount && (
          <div className="mt-3 p-2 rounded-lg bg-white/60 flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-500" />
            <span className="text-xs text-slate-600">
              Preautorisation : {paymentInfo.preauthorization_amount?.toFixed(2)} EUR
              ({paymentInfo.preauthorization_status})
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!['paid', 'cancelled'].includes(status) && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions reception</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Send Payment Link — Total */}
            <ActionBtn
              data-testid="btn-send-link-total"
              icon={Send}
              label="Lien paiement (solde)"
              loading={actionLoading === 'send-link-total'}
              onClick={() => doAction('send-link', { amount_type: 'total' }, 'Lien envoye')}
              color="#3B82F6"
            />

            {/* Send Payment Link — 1st Night */}
            <ActionBtn
              data-testid="btn-send-link-night"
              icon={Send}
              label="Lien (1ere nuit)"
              loading={actionLoading === 'send-link-night'}
              onClick={() => {
                setActionLoading('send-link-night')
                doAction('send-link', { amount_type: 'first_night' }, 'Lien 1ere nuit envoye')
              }}
              color="#06B6D4"
            />

            {/* Pre-authorize 1st night */}
            <ActionBtn
              data-testid="btn-preauth-night"
              icon={ShieldCheck}
              label="Preautoriser 1ere nuit"
              loading={actionLoading === 'preauth-night'}
              onClick={() => {
                setActionLoading('preauth-night')
                doAction('preauthorize', { amount_type: 'first_night' }, 'Preautorisation creee')
              }}
              color="#8B5CF6"
            />

            {/* Pre-authorize total */}
            <ActionBtn
              data-testid="btn-preauth-total"
              icon={Lock}
              label="Preautoriser total"
              loading={actionLoading === 'preauth-total'}
              onClick={() => {
                setActionLoading('preauth-total')
                doAction('preauthorize', { amount_type: 'total' }, 'Preautorisation creee')
              }}
              color="#7C3AED"
            />

            {/* Send Reminder */}
            <ActionBtn
              data-testid="btn-send-reminder"
              icon={Bell}
              label="Envoyer rappel"
              loading={actionLoading === 'send-reminder'}
              onClick={() => doAction('send-reminder', {}, 'Rappel envoye')}
              color="#F59E0B"
              disabled={!paymentInfo?.payment_link_sent}
            />

            {/* Capture Pre-auth */}
            {paymentInfo?.preauthorization_id && paymentInfo?.preauthorization_status === 'pending' && (
              <ActionBtn
                data-testid="btn-capture-preauth"
                icon={CreditCard}
                label="Capturer preauth"
                loading={actionLoading === 'capture'}
                onClick={() => doAction('capture-preauth', {}, 'Preautorisation capturee')}
                color="#10B981"
              />
            )}

            {/* Cancel Pre-auth */}
            {paymentInfo?.preauthorization_id && paymentInfo?.preauthorization_status === 'pending' && (
              <ActionBtn
                data-testid="btn-cancel-preauth"
                icon={XCircle}
                label="Annuler preauth"
                loading={actionLoading === 'cancel-preauth'}
                onClick={() => doAction('cancel-preauth', {}, 'Preautorisation annulee')}
                color="#EF4444"
              />
            )}
          </div>
        </div>
      )}

      {/* Recent Payment Links */}
      {paymentInfo?.links?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Liens de paiement</p>
          {paymentInfo.links.slice(0, 3).map((link, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-sm"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{link.amount?.toFixed(2)} {link.currency}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  link.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  link.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {link.status}
                </span>
              </div>
              {link.url && (
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-700">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ActionBtn = ({ icon: Icon, label, loading, onClick, color, disabled, ...props }) => (
  <button
    {...props}
    onClick={onClick}
    disabled={loading || disabled}
    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-md active:scale-[0.97]'}
    `}
    style={{
      background: `${color}10`,
      color: color,
      border: `1px solid ${color}20`,
    }}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
    {label}
  </button>
)

export default PaymentBlock
