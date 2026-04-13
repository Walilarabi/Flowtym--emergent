import { useState } from 'react'
import { CreditCard, Euro, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const API = import.meta.env.VITE_BACKEND_URL || ''

export const QuickPayment = ({ hotelId, reservationId, onSuccess }) => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePay = async (e) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return toast.error('Montant invalide')

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/stripe/quick-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_url: window.location.origin,
          amount: numAmount,
          currency: 'eur',
          hotel_id: hotelId || '',
          reservation_id: reservationId || '',
          description: description || 'Paiement Hotel',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erreur paiement')
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-testid="quick-payment"
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(16,185,129,0.15)',
        boxShadow: '0 4px 24px rgba(16,185,129,0.06)',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
        >
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">Paiement rapide</h3>
          <p className="text-xs text-slate-500">Encaisser un montant via Stripe Checkout</p>
        </div>
      </div>

      <form onSubmit={handlePay} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Montant (EUR)</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              data-testid="quick-payment-amount"
              type="number"
              step="0.01"
              min="0.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="150.00"
              className="pl-10 text-lg font-semibold"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
          <Input
            data-testid="quick-payment-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Chambre 201 — Séjour du 15 au 18 avril"
          />
        </div>

        <Button
          data-testid="quick-payment-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full gap-2"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '40px',
            height: '44px',
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Envoyer vers Stripe Checkout
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

export default QuickPayment
