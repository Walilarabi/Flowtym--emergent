import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Mail, Shield, Zap, Play } from 'lucide-react'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await login(formData.email, formData.password)
      toast.success('Connexion réussie')
      const role = response?.user?.role || 'admin'
      if (role === 'superadmin' || role === 'super_admin') navigate('/superadmin')
      else if (role === 'support') navigate('/support-agent')
      else navigate('/flowboard')
    } catch (error) {
      toast.error(error.message || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    try {
      await login('admin@flowtym.com', 'admin123')
      toast.success('Connexion démo réussie')
      navigate('/flowboard')
    } catch (error) {
      toast.error('Erreur lors de la connexion démo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* ═══ LEFT PANEL — Branding ═══ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between" style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 60%, #8B5CF6 100%)' }}>
        {/* Glow effects */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] right-[-60px] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #C4B5FD 0%, transparent 70%)' }} />
        <div className="absolute top-[50%] left-[30%] w-[300px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6EE7B7 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          {/* Logo */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" data-testid="login-logo">
              <span className="text-white">Flow</span>
              <span style={{ color: '#6EE7B7' }}>tym</span>
            </h1>
          </div>

          {/* Hero */}
          <div className="space-y-6 -mt-8">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
              Le cockpit intelligent<br />de votre hôtel
            </h2>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              Augmentez votre taux d'occupation.<br />
              Réduisez les erreurs opérationnelles.<br />
              Pilotez tout en temps réel.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { text: '+18% productivité', icon: Zap },
                { text: '1 000+ hôtels', icon: Shield },
                { text: 'Sécurité SSL', icon: Lock },
              ].map((b) => (
                <span
                  key={b.text}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/90 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <b.icon className="w-3.5 h-3.5" style={{ color: '#6EE7B7' }} />
                  {b.text}
                </span>
              ))}
            </div>

            {/* Dashboard mockup */}
            <div
              className="mt-6 rounded-2xl p-4 backdrop-blur-md"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)',
              }}
            >
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Occupation', val: '78%', color: '#6EE7B7' },
                  { label: 'Arrivées', val: '12', color: '#93C5FD' },
                  { label: 'Départs', val: '8', color: '#FCA5A5' },
                  { label: 'RevPAR', val: '94€', color: '#FCD34D' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.val}</div>
                    <div className="text-[10px] text-white/60 mt-0.5">{kpi.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 rounded-lg h-12 overflow-hidden flex gap-1">
                {[40, 65, 55, 80, 70, 90, 85, 60, 75, 95, 88, 72].map((h, i) => (
                  <div key={i} className="flex-1 flex items-end">
                    <div className="w-full rounded-t-sm transition-all" style={{ height: `${h}%`, background: `linear-gradient(to top, rgba(110,231,183,0.6), rgba(139,92,246,0.3))` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/40 text-xs">
            © 2026 Flowtym SAS · Tous droits réservés
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Login ═══ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8" style={{ background: '#F8F7FF' }}>
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-violet-700">Flow</span>
              <span style={{ color: '#10B981' }}>tym</span>
            </h1>
          </div>

          {/* Card */}
          <div
            className="rounded-[20px] p-8 sm:p-10"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(91,33,182,0.08), 0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid rgba(139,92,246,0.1)',
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Connexion</h2>
              <p className="text-slate-500 text-sm mt-1">Accédez à votre espace hôtelier</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vous@hotel.com"
                    required
                    data-testid="input-email"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    data-testid="input-password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                  <span className="text-xs text-slate-500">Se souvenir de moi</span>
                </label>
                <a href="#" className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>

              {/* CTA — Se connecter */}
              <button
                type="submit"
                disabled={loading}
                data-testid="btn-submit-login"
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connexion...
                  </>
                ) : 'Se connecter'}
              </button>

              {/* Accès démo */}
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                data-testid="btn-demo-login"
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98]"
                style={{ background: '#F1F0FF', color: '#6D28D9', border: '1px solid rgba(109,40,217,0.15)' }}
              >
                <Play className="w-3.5 h-3.5" />
                Accès démo
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <a href="#" className="text-slate-500 hover:text-violet-600 transition-colors">Connexion Staff</a>
                <a href="#" className="text-slate-500 hover:text-violet-600 transition-colors">Connexion Admin</a>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>Connexion sécurisée SSL</span>
              </div>
            </div>
          </div>

          {/* Help */}
          <p className="text-center text-slate-400 text-xs mt-5">
            Besoin d'aide ? <a href="#" className="text-violet-600 hover:underline">Contactez le support</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
