import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = import.meta.env.VITE_BACKEND_URL || ''

export const CheckoutReturn = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState(null)
  const [polling, setPolling] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 8

  useEffect(() => {
    if (!sessionId) {
      setPolling(false)
      return
    }

    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/stripe/checkout-status/${sessionId}`)
        if (!res.ok) throw new Error('Erreur statut')
        const data = await res.json()
        setStatus(data)

        if (data.payment_status === 'paid' || data.status === 'complete') {
          setPolling(false)
          return
        }
        if (data.status === 'expired') {
          setPolling(false)
          return
        }

        // Continue polling
        if (attempts < maxAttempts) {
          setTimeout(() => setAttempts((a) => a + 1), 2000)
        } else {
          setPolling(false)
        }
      } catch (err) {
        console.error('Polling error:', err)
        if (attempts < maxAttempts) {
          setTimeout(() => setAttempts((a) => a + 1), 2000)
        } else {
          setPolling(false)
        }
      }
    }

    poll()
  }, [sessionId, attempts])

  const isPaid = status?.payment_status === 'paid'
  const isExpired = status?.status === 'expired'

  return (
    <div
      data-testid="checkout-return"
      className="flex items-center justify-center min-h-[400px]"
    >
      <div
        className="rounded-2xl p-8 text-center max-w-md w-full"
        style={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${isPaid ? 'rgba(16,185,129,0.2)' : 'rgba(124,140,248,0.15)'}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        {polling ? (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Vérification du paiement...</h2>
            <p className="text-sm text-slate-500">Merci de patienter quelques secondes</p>
          </>
        ) : isPaid ? (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(16,185,129,0.1)' }}
            >
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Paiement réussi !</h2>
            <p className="text-sm text-slate-500 mb-1">
              Montant : {status.amount_total ? (status.amount_total / 100).toFixed(2) : '—'}{' '}
              {(status.currency || 'eur').toUpperCase()}
            </p>
            <p className="text-xs text-slate-400 mb-6">Session : {sessionId?.slice(0, 20)}...</p>
          </>
        ) : isExpired ? (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Session expirée</h2>
            <p className="text-sm text-slate-500 mb-6">Veuillez réessayer</p>
          </>
        ) : (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(245,158,11,0.1)' }}
            >
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Statut indéterminé</h2>
            <p className="text-sm text-slate-500 mb-6">
              Vérifiez votre email pour confirmation
            </p>
          </>
        )}

        <Link to="/finance">
          <Button
            data-testid="back-to-finance-btn"
            variant="outline"
            className="gap-2 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à Finance
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default CheckoutReturn
