import { useState } from 'react'
import { Building2, Mail, Globe, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const API = import.meta.env.VITE_BACKEND_URL || ''

export const ConnectOnboarding = ({ hotelId, onAccountCreated }) => {
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [country, setCountry] = useState('FR')
  const [loading, setLoading] = useState(false)

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Email requis')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/stripe/create-connect-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          email,
          business_name: businessName,
          country,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erreur lors de la création du compte')
      }

      const data = await res.json()
      toast.success('Compte Stripe Connect créé')
      if (onAccountCreated) onAccountCreated(data.accountId)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-testid="connect-onboarding"
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(124,140,248,0.15)',
        boxShadow: '0 4px 24px rgba(124,140,248,0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7C8CF8 0%, #6366F1 100%)' }}
        >
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">Connecter votre hôtel à Stripe</h3>
          <p className="text-xs text-slate-500">Recevez les paiements directement sur votre compte</p>
        </div>
      </div>

      <form onSubmit={handleCreateAccount} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Email du compte Stripe</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              data-testid="connect-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="finance@votre-hotel.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Nom de l'établissement</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              data-testid="connect-business-name-input"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Hotel Le Palace"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Pays</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              data-testid="connect-country-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
            >
              <option value="FR">France</option>
              <option value="BE">Belgique</option>
              <option value="CH">Suisse</option>
              <option value="ES">Espagne</option>
              <option value="IT">Italie</option>
              <option value="DE">Allemagne</option>
              <option value="US">États-Unis</option>
              <option value="GB">Royaume-Uni</option>
            </select>
          </div>
        </div>

        <Button
          data-testid="connect-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full gap-2"
          style={{
            background: 'linear-gradient(135deg, #7C8CF8 0%, #6366F1 100%)',
            borderRadius: '40px',
            height: '44px',
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Créer le compte Connect
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

export default ConnectOnboarding
