import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Check, Layers, RefreshCw, TrendingUp } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════════
   FLOWTYM LOGIN PAGE - Design Premium Hôtelier
   Basé sur le mockup fourni avec image d'hôtel et gradient violet/rose
═══════════════════════════════════════════════════════════════════════════════ */

const LoginStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    .login-page {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      width: 100%;
      display: flex;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #6d28d9 80%, #7c3aed 100%);
      position: relative;
      overflow: hidden;
    }
    
    .login-bg-image {
      position: absolute;
      inset: 0;
      background-image: url('https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=1920');
      background-size: cover;
      background-position: center;
      opacity: 0.4;
      mix-blend-mode: overlay;
    }
    
    .login-gradient-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(30, 27, 75, 0.95) 0%,
        rgba(76, 29, 149, 0.85) 40%,
        rgba(109, 40, 217, 0.75) 70%,
        rgba(168, 85, 247, 0.65) 100%
      );
    }
    
    .login-content {
      position: relative;
      z-index: 10;
      display: flex;
      width: 100%;
      min-height: 100vh;
    }
    
    .login-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 60px;
      color: white;
    }
    
    .login-right {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 12px 20px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    
    .logo-flow {
      font-size: 20px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.02em;
    }
    
    .logo-tym {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #34d399, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }
    
    .login-tagline {
      max-width: 500px;
    }
    
    .login-tagline h1 {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 20px;
      letter-spacing: -0.02em;
      color: white;
    }
    
    .login-tagline p {
      font-size: 1.1rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .login-footer {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .login-card {
      width: 420px;
      max-width: 100%;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
    }
    
    .login-card-header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .login-card-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    
    .login-card-subtitle {
      font-size: 0.9rem;
      color: #6b7280;
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .login-input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .login-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }
    
    .login-input-wrapper {
      position: relative;
    }
    
    .login-input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      font-size: 0.95rem;
      color: #1f2937;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      transition: all 0.2s ease;
    }
    
    .login-input:focus {
      outline: none;
      background: white;
      border-color: #a855f7;
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    }
    
    .login-input::placeholder {
      color: #9ca3af;
    }
    
    .login-input-icon {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      cursor: pointer;
      transition: color 0.15s ease;
    }
    
    .login-input-icon:hover {
      color: #6b7280;
    }
    
    .login-submit {
      width: 100%;
      height: 52px;
      background: #a855f7;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(168, 85, 247, 0.35);
      margin-top: 8px;
    }
    
    .login-submit:hover:not(:disabled) {
      background: #9333ea;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(168, 85, 247, 0.45);
    }
    
    .login-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .login-security {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      font-size: 0.8rem;
      color: #9ca3af;
    }
    
    .login-forgot {
      text-align: center;
      margin-top: 16px;
    }
    
    .login-forgot a {
      color: #a855f7;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.15s ease;
    }
    
    .login-forgot a:hover {
      color: #9333ea;
    }
    
    .login-features {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .login-feature {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #4b5563;
      font-size: 0.9rem;
    }
    
    .login-feature-icon {
      width: 20px;
      height: 20px;
      color: #22c55e;
      flex-shrink: 0;
    }
    
    .login-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
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
    
    .animate-delay-1 { animation-delay: 0.1s; opacity: 0; }
    .animate-delay-2 { animation-delay: 0.2s; opacity: 0; }
    .animate-delay-3 { animation-delay: 0.3s; opacity: 0; }
    
    /* Responsive */
    @media (max-width: 1024px) {
      .login-left {
        display: none;
      }
      
      .login-right {
        flex: 1;
        background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #7c3aed 100%);
      }
      
      .login-card {
        margin: 20px;
      }
    }
    
    @media (max-width: 480px) {
      .login-card {
        padding: 30px 24px;
        border-radius: 16px;
      }
      
      .login-card-title {
        font-size: 1.5rem;
      }
    }
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
    "Plateforme tout-en-un",
    "Synchronisation temps réel",
    "Pilotage intelligent des revenus",
  ]

  return (
    <>
      <LoginStyles />
      <div className="login-page">
        {/* Background Image */}
        <div className="login-bg-image" />
        
        {/* Gradient Overlay */}
        <div className="login-gradient-overlay" />
        
        {/* Content */}
        <div className="login-content">
          {/* Left Panel - Branding */}
          <div className="login-left">
            {/* Logo */}
            <div className="animate-fade-in">
              <div className="logo-badge">
                <span className="logo-flow">FLOW</span>
                <span className="logo-tym">TYM</span>
              </div>
            </div>
            
            {/* Tagline */}
            <div className="login-tagline animate-fade-in animate-delay-1">
              <h1>
                Le système d'exploitation<br />
                des hôtels modernes
              </h1>
              <p>
                Réservations, revenus, distribution et expérience client.<br />
                Tout est connecté dans une seule plateforme.
              </p>
            </div>
            
            {/* Footer */}
            <div className="login-footer animate-fade-in animate-delay-2">
              Flowtym – Tous droits réservés 2026
            </div>
          </div>
          
          {/* Right Panel - Login Form */}
          <div className="login-right">
            <div className="login-card animate-fade-in animate-delay-1">
              {/* Header */}
              <div className="login-card-header">
                <h2 className="login-card-title">
                  {isLogin ? 'Bienvenue sur Flowtym' : 'Créer un compte'}
                </h2>
                <p className="login-card-subtitle">
                  {isLogin 
                    ? 'Connectez-vous pour accéder à votre plateforme' 
                    : 'Remplissez le formulaire pour commencer'}
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="login-form">
                {!isLogin && (
                  <>
                    <div className="login-input-group">
                      <label className="login-label">Prénom</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Jean"
                        required={!isLogin}
                        className="login-input"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="login-input-group">
                      <label className="login-label">Nom</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Dupont"
                        required={!isLogin}
                        className="login-input"
                        data-testid="input-last-name"
                      />
                    </div>
                  </>
                )}
                
                <div className="login-input-group">
                  <label className="login-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.dupont@hotel.com"
                    required
                    className="login-input"
                    data-testid="input-email"
                  />
                </div>
                
                <div className="login-input-group">
                  <label className="login-label">Mot de passe</label>
                  <div className="login-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="login-input"
                      style={{ paddingRight: '48px' }}
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="login-input-icon"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="login-submit"
                  disabled={loading}
                  data-testid="btn-submit-login"
                >
                  {loading ? (
                    <div className="login-spinner" />
                  ) : (
                    isLogin ? 'Accéder à mon espace' : 'Créer le compte'
                  )}
                </button>
              </form>
              
              {/* Security Note */}
              <div className="login-security">
                <Lock size={14} />
                <span>Données sécurisées – Accès réservé</span>
              </div>
              
              {/* Forgot Password / Toggle */}
              <div className="login-forgot">
                <a onClick={() => setIsLogin(!isLogin)} data-testid="btn-toggle-auth-mode">
                  {isLogin ? "Mot de passe oublié ?" : 'Déjà un compte ? Se connecter'}
                </a>
              </div>
              
              {/* Features */}
              {isLogin && (
                <div className="login-features">
                  {features.map((feature, idx) => (
                    <div key={idx} className="login-feature">
                      <Check className="login-feature-icon" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
