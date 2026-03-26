import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Check, Layers, RefreshCw, TrendingUp } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════════
   FLOWTYM LOGIN PAGE - Inspired by modern hotel management design
═══════════════════════════════════════════════════════════════════════════════ */

// CSS for glassmorphism and animations
const LoginStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    .login-page {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .login-bg {
      background: linear-gradient(135deg, 
        #6C5CE7 0%, 
        #7C6BED 30%,
        #8B7AF3 60%,
        #A29BFE 100%
      );
    }
    
    .glass-card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 
        0 25px 60px -12px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    }
    
    .logo-badge {
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }
    
    .btn-gradient {
      background: linear-gradient(135deg, #6C5CE7 0%, #5B4ED1 100%);
      box-shadow: 0 4px 20px rgba(108, 92, 231, 0.35);
      transition: all 0.2s ease;
    }
    
    .btn-gradient:hover {
      box-shadow: 0 8px 30px rgba(108, 92, 231, 0.45);
      transform: translateY(-1px);
    }
    
    .btn-gradient:active {
      transform: translateY(0);
    }
    
    .feature-check {
      color: #22C55E;
      filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.4));
    }
    
    .input-styled {
      background: #F8F9FC;
      border: 1px solid #E5E7EB;
      transition: all 0.15s ease;
    }
    
    .input-styled:focus {
      background: white;
      border-color: #6C5CE7;
      box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.12);
    }
    
    .text-gradient {
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .animate-delay-1 { animation-delay: 0.1s; }
    .animate-delay-2 { animation-delay: 0.2s; }
    .animate-delay-3 { animation-delay: 0.3s; }
  `}</style>
)

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        toast.success('Connexion réussie')
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: 'admin',
        })
        toast.success('Compte créé avec succès')
      }
      navigate('/pms/planning')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Layers, text: "Plateforme tout-en-un" },
    { icon: RefreshCw, text: "Synchronisation temps réel" },
    { icon: TrendingUp, text: "Pilotage intelligent des revenus" },
  ]

  return (
    <>
      <LoginStyles />
      <div className="login-page min-h-screen w-full flex">
        {/* Left Panel - Background with Hotel Image */}
        <div 
          className="hidden lg:flex lg:w-[55%] bg-cover bg-center relative overflow-hidden"
          style={{ 
            backgroundImage: 'url(https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)'
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 login-bg" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
            {/* Logo */}
            <div className="animate-fade-in">
              <div className="logo-badge inline-flex items-center gap-2 px-5 py-2.5 rounded-xl">
                <span className="text-xl font-bold tracking-tight text-white">FLOW</span>
                <span className="text-xl font-bold tracking-tight text-gradient">TYM</span>
              </div>
            </div>
            
            {/* Main Text */}
            <div className="max-w-lg animate-fade-in animate-delay-1">
              <h1 className="text-4xl lg:text-[2.75rem] font-bold mb-5 leading-tight tracking-tight">
                Le système d'exploitation<br />
                des hôtels modernes
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Réservations, revenus, distribution et expérience client.<br />
                Tout est connecté dans une seule plateforme.
              </p>
            </div>
            
            {/* Footer */}
            <p className="text-sm text-white/50 animate-fade-in animate-delay-2">
              Flowtym PMS – Tous droits réservés 2026
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
          {/* Decorative gradient blob */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="w-full max-w-md relative z-10">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
              <div className="logo-badge inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600">
                <span className="text-xl font-bold tracking-tight text-white">FLOW</span>
                <span className="text-xl font-bold tracking-tight text-emerald-400">TYM</span>
              </div>
            </div>

            {/* Glass Card */}
            <div className="glass-card rounded-2xl p-8 lg:p-10">
              {/* Header */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl lg:text-[1.75rem] font-bold text-slate-800 mb-2">
                  {isLogin ? 'Bienvenue sur Flowtym' : 'Créer un compte'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {isLogin ? 'Connectez-vous pour accéder à votre plateforme' : 'Remplissez le formulaire pour commencer'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-slate-700 font-medium text-sm">Prénom</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Jean"
                        required={!isLogin}
                        className="input-styled h-11 rounded-lg"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-slate-700 font-medium text-sm">Nom</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Dupont"
                        required={!isLogin}
                        className="input-styled h-11 rounded-lg"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.dupont@hotel.com"
                    required
                    className="input-styled h-11 rounded-lg"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="input-styled h-11 rounded-lg pr-11"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 btn-gradient text-white font-semibold rounded-xl text-base border-0" 
                  disabled={loading} 
                  data-testid="btn-submit-login"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    isLogin ? 'Accéder à mon espace' : 'Créer le compte'
                  )}
                </Button>
              </form>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 mt-5 text-slate-400 text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Données sécurisées – Accès réservé</span>
              </div>

              {/* Toggle Mode */}
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                  data-testid="btn-toggle-auth-mode"
                >
                  {isLogin ? "Mot de passe oublié ?" : 'Déjà un compte ? Se connecter'}
                </button>
              </div>

              {/* Features */}
              {isLogin && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="space-y-3">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 feature-check flex-shrink-0" />
                        <span className="text-slate-600 text-sm">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
