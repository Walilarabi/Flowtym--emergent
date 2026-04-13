import { useState, useEffect } from 'react'
import { Package, Plus, Euro, ShoppingCart, Loader2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const API = import.meta.env.VITE_BACKEND_URL || ''

export const StripeProducts = ({ accountId, hotelId, chargesEnabled }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    productPrice: 10000,
    currency: 'eur',
  })
  const [creating, setCreating] = useState(false)

  const fetchProducts = async () => {
    if (!accountId || !chargesEnabled) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/stripe/products/${accountId}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (err) {
      console.error('Products fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [accountId, chargesEnabled])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch(`${API}/api/stripe/create-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          hotel_id: hotelId,
          product_name: formData.productName,
          product_description: formData.productDescription,
          product_price: formData.productPrice,
          currency: formData.currency,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erreur création produit')
      }

      toast.success('Produit créé avec succès')
      setShowForm(false)
      setFormData({ productName: '', productDescription: '', productPrice: 10000, currency: 'eur' })
      fetchProducts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCheckout = async (priceId) => {
    try {
      const res = await fetch(`${API}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          price_id: priceId,
          hotel_id: hotelId,
          origin_url: window.location.origin,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erreur checkout')
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (!chargesEnabled) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Complétez l'inscription Stripe pour gérer les produits
      </div>
    )
  }

  return (
    <div data-testid="stripe-products" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-violet-500" />
          <h3 className="text-base font-semibold text-slate-800">Produits & Services</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{products.length}</span>
        </div>
        <Button
          data-testid="add-product-btn"
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="gap-1.5"
          style={{
            background: showForm ? '#EF4444' : 'linear-gradient(135deg, #7C8CF8 0%, #6366F1 100%)',
            borderRadius: '40px',
          }}
        >
          <Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
          {showForm ? 'Annuler' : 'Nouveau produit'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl p-5 space-y-3"
          style={{
            background: 'rgba(124,140,248,0.04)',
            border: '1px solid rgba(124,140,248,0.12)',
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Nom du produit</label>
            <Input
              data-testid="product-name-input"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="Chambre Deluxe — 1 nuit"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
            <Input
              data-testid="product-desc-input"
              value={formData.productDescription}
              onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
              placeholder="Vue mer, petit-déjeuner inclus"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Prix (centimes)</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  data-testid="product-price-input"
                  type="number"
                  value={formData.productPrice}
                  onChange={(e) => setFormData({ ...formData, productPrice: parseInt(e.target.value) })}
                  className="pl-10"
                  min={100}
                  required
                />
              </div>
              <span className="text-xs text-slate-400 mt-1">
                = {(formData.productPrice / 100).toFixed(2)} EUR
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Devise</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                <option value="eur">EUR</option>
                <option value="usd">USD</option>
                <option value="gbp">GBP</option>
                <option value="chf">CHF</option>
              </select>
            </div>
          </div>
          <Button
            data-testid="create-product-submit-btn"
            type="submit"
            disabled={creating}
            className="w-full gap-2"
            style={{ background: '#10B981', borderRadius: '40px' }}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer le produit
          </Button>
        </form>
      )}

      {/* Products List */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          Aucun produit — créez votre premier produit pour commencer
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((product) => (
            <div
              key={product.priceId}
              data-testid={`product-card-${product.priceId}`}
              className="rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{product.name}</h4>
                  {product.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">
                  {(product.price / 100).toFixed(2)} {(product.currency || 'eur').toUpperCase()}
                </span>
                <Button
                  data-testid={`checkout-btn-${product.priceId}`}
                  size="sm"
                  onClick={() => handleCheckout(product.priceId)}
                  className="gap-1.5"
                  style={{ background: '#10B981', borderRadius: '40px' }}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Payer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StripeProducts
