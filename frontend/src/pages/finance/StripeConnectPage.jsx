import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Zap, CreditCard, Building2, ShoppingBag, ArrowRight,
  CheckCircle, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useHotel } from '@/context/HotelContext'
import { ConnectOnboarding } from '@/components/stripe/ConnectOnboarding'
import { AccountStatus } from '@/components/stripe/AccountStatus'
import { StripeProducts } from '@/components/stripe/StripeProducts'
import { QuickPayment } from '@/components/stripe/QuickPayment'
import { CheckoutReturn } from '@/components/stripe/CheckoutReturn'

const API = import.meta.env.VITE_BACKEND_URL || ''

export const StripeConnectPage = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { currentHotel } = useHotel()
  const hotelId = currentHotel?.id || ''

  const [accountId, setAccountId] = useState(null)
  const [accountStatus, setAccountStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('connect') // connect, products, payment

  // Fetch hotel Stripe info on mount
  const fetchHotelStripe = useCallback(async () => {
    if (!hotelId) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${API}/api/stripe/hotel/${hotelId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.stripe_account_id) {
          setAccountId(data.stripe_account_id)
          setAccountStatus(data.account_status)
        }
      }
    } catch (err) {
      console.error('Fetch hotel stripe error:', err)
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    fetchHotelStripe()
  }, [fetchHotelStripe])

  // If returning from checkout, show the return page
  if (sessionId) {
    return <CheckoutReturn />
  }

  // Handle account creation callback
  const handleAccountCreated = (newAccountId) => {
    setAccountId(newAccountId)
    setActiveSection('connect')
  }

  // Handle onboarding start
  const handleStartOnboarding = async () => {
    try {
      const res = await fetch(`${API}/api/stripe/create-account-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, hotel_id: hotelId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erreur onboarding')
      }

      const data = await res.json()
      window.location.href = data.url
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Handle disconnect
  const handleDisconnect = () => {
    setAccountId(null)
    setAccountStatus(null)
    toast.info('Compte Stripe déconnecté localement')
  }

  const chargesEnabled = accountStatus?.chargesEnabled || false

  const sections = [
    { id: 'connect', label: 'Compte Connect', icon: Building2 },
    { id: 'products', label: 'Produits', icon: ShoppingBag, disabled: !accountId },
    { id: 'payment', label: 'Paiement rapide', icon: CreditCard },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div data-testid="stripe-connect-page" className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(124,140,248,0.08) 0%, rgba(99,102,241,0.04) 100%)',
          border: '1px solid rgba(124,140,248,0.12)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C8CF8, #6366F1)' }}
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Stripe Connect</h2>
              <p className="text-sm text-slate-500">
                {accountId
                  ? `Connecté : ${accountId.slice(0, 15)}...`
                  : 'Configurez les paiements pour votre hôtel'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {accountId && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: chargesEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                color: chargesEnabled ? '#059669' : '#D97706',
              }}
            >
              {chargesEnabled ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {chargesEnabled ? 'Paiements actifs' : 'Configuration requise'}
            </div>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              data-testid={`section-tab-${section.id}`}
              onClick={() => !section.disabled && setActiveSection(section.id)}
              disabled={section.disabled}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'text-white shadow-md'
                  : section.disabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 bg-white border border-slate-200 hover:border-violet-200'
              }`}
              style={
                activeSection === section.id
                  ? { background: 'linear-gradient(135deg, #7C8CF8, #6366F1)' }
                  : {}
              }
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeSection === 'connect' && (
          <>
            {!accountId ? (
              <ConnectOnboarding hotelId={hotelId} onAccountCreated={handleAccountCreated} />
            ) : (
              <AccountStatus
                accountId={accountId}
                onStartOnboarding={handleStartOnboarding}
                onLogout={handleDisconnect}
              />
            )}

            {/* Info Card */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <h3 className="text-base font-semibold text-slate-800 mb-4">Comment ça marche ?</h3>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Créez votre compte Stripe', desc: 'Renseignez votre email et les informations de votre établissement' },
                  { step: '2', title: 'Complétez la vérification', desc: 'Stripe vérifie votre identité et vos coordonnées bancaires' },
                  { step: '3', title: 'Créez vos produits', desc: 'Définissez les services et tarifs de votre hôtel' },
                  { step: '4', title: 'Encaissez les paiements', desc: 'Vos clients paient directement sur votre compte Stripe' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #7C8CF8, #6366F1)' }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === 'products' && accountId && (
          <div className="lg:col-span-2">
            <StripeProducts
              accountId={accountId}
              hotelId={hotelId}
              chargesEnabled={chargesEnabled}
            />
          </div>
        )}

        {activeSection === 'payment' && (
          <>
            <QuickPayment hotelId={hotelId} />

            {/* Payment Info */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <h3 className="text-base font-semibold text-slate-800 mb-3">Paiement rapide</h3>
              <p className="text-sm text-slate-500 mb-4">
                Encaissez un montant libre via Stripe Checkout sans créer de produit.
                Idéal pour les extras, mini-bar, ou paiements ponctuels.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Carte bancaire (Visa, Mastercard, Amex)
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Apple Pay / Google Pay
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Sécurisé par Stripe (PCI DSS)
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default StripeConnectPage
