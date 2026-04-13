import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'

const MOCKUP_IMG = 'https://static.prod-images.emergentagent.com/jobs/34b63afc-18b0-4c61-91ea-7e5b856ce43a/images/4adab5efe8adc32910d0272a7aa714a7a1b2c4e15f167e9edb0e51a9cb9f5662.png'

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
      {/* ═══ LEFT — Branding ═══ */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col"
        style={{
          background: 'linear-gradient(160deg, #1a0a3e 0%, #3b1a8e 35%, #6E3AFF 65%, #8B5CF6 100%)',
        }}
      >
        {/* Purple glow orbs */}
        <div className="absolute top-[-120px] right-[20%] w-[500px] h-[500px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }} />
        <div className="absolute bottom-[10%] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #A78BFA, transparent 70%)' }} />
        <div className="absolute top-[40%] right-[-50px] w-[300px] h-[300px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #C4B5FD, transparent 60%)' }} />

        <div className="relative z-10 flex flex-col justify-between h-full px-12 xl:px-16 py-10">
          {/* Logo */}
          <div>
            <h1 className="text-[42px] font-extrabold tracking-tight leading-none" data-testid="login-logo">
              <span className="text-white">Flow</span>
              <span style={{ color: '#40F5B6' }}>tym</span>
            </h1>
          </div>

          {/* Hero text + mockup */}
          <div className="flex-1 flex flex-col justify-center -mt-4">
            <h2 className="text-[44px] xl:text-[50px] font-extrabold text-white leading-[1.1] tracking-tight">
              Le cockpit intelligent<br />
              <em className="not-italic font-extrabold" style={{ color: '#E0D4FF' }}>de votre hôtel</em>
            </h2>

            <div className="mt-6 space-y-1">
              <p className="text-[18px] text-white/75 leading-relaxed">
                Augmentez votre <strong className="text-white font-semibold">taux d'occupation</strong>.
              </p>
              <p className="text-[18px] text-white/75 leading-relaxed">
                Réduisez les <strong className="text-white font-semibold">erreurs opérationnelles</strong>.
              </p>
              <p className="text-[18px] text-white/75 leading-relaxed">
                Pilotez tout en <strong className="text-white font-semibold">temps réel</strong>.
              </p>
            </div>

            {/* Dashboard mockup — tilted tablet */}
            <div className="mt-8 relative">
              <div
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  transform: 'perspective(1200px) rotateY(-6deg) rotateX(3deg)',
                  maxWidth: '520px',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 40px rgba(110,58,255,0.3)',
                }}
              >
                <img
                  src={MOCKUP_IMG}
                  alt="Flowtym Dashboard"
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Bottom badges + copyright */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {[
                { icon: '⚡', prefix: '+', bold: '18%', text: ' de productivité' },
                { icon: '⭐', prefix: 'Utilisé par ', bold: '1000+', text: ' hôtels' },
                { icon: '🔒', prefix: '', bold: 'Sécurité', text: ' SSL' },
              ].map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] text-white/90"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span>{b.icon}</span>
                  <span>{b.prefix}<strong className="font-bold text-white">{b.bold}</strong>{b.text}</span>
                </span>
              ))}
            </div>

            <p className="text-white/30 text-xs">
              © 2026 Flowtym. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — Login ═══ */}
      <div
        className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10"
        style={{ background: 'linear-gradient(180deg, #F3F0FF 0%, #EDE9FE 100%)' }}
      >
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <h1 className="text-3xl font-extrabold">
              <span style={{ color: '#3b1a8e' }}>Flow</span>
              <span style={{ color: '#40F5B6' }}>tym</span>
            </h1>
          </div>

          {/* Card */}
          <div
            className="rounded-[20px] p-8 sm:p-10"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 24px 64px rgba(110,58,255,0.08), 0 4px 24px rgba(0,0,0,0.04)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-[28px] font-bold text-slate-900">Bienvenue</h2>
              <p className="text-slate-500 text-[15px] mt-1">Connectez-vous pour accéder à votre espace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[14px] font-semibold text-slate-800 mb-2">Adresse email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vous@exemple.com"
                    required
                    data-testid="input-email"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/80 border border-slate-200 text-slate-800 text-[15px] placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[14px] font-semibold text-slate-800 mb-2">Mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    data-testid="input-password"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/80 border border-slate-200 text-slate-800 text-[15px] placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                  <span className="text-[13px] text-slate-600">Se souvenir de moi</span>
                </label>
                <a href="#" className="text-[13px] text-slate-500 hover:text-violet-600 transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Se connecter */}
              <button
                type="submit"
                disabled={loading}
                data-testid="btn-submit-login"
                className="w-full py-3.5 rounded-xl text-white font-bold text-[16px] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-violet-500/25 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #6E3AFF 0%, #8B5CF6 100%)' }}
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
                className="w-full py-3.5 rounded-xl font-bold text-[16px] transition-all duration-200 flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] text-slate-700"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)' }}
              >
                Accès démo
              </button>
            </form>

            {/* Staff / Admin */}
            <div className="mt-5 flex items-center justify-center gap-2 text-slate-500 text-[13px]">
              <Shield className="w-3.5 h-3.5" />
              <span>Connexion staff / admin</span>
            </div>
          </div>

          {/* Help */}
          <p className="text-center text-slate-400 text-[13px] mt-5">
            Besoin d'aide ? <a href="#" className="text-violet-600 hover:underline font-medium">Contactez le support</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
