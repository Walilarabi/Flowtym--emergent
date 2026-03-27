import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Check } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════════
   FLOWTYM LOGIN PAGE - Design exact basé sur la maquette fournie
═══════════════════════════════════════════════════════════════════════════════ */

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

  // Image de fond encodée en base64 ou URL directe
  const bgImageUrl = 'https://customer-assets.emergentagent.com/job_34b63afc-18b0-4c61-91ea-7e5b856ce43a/artifacts/ixtgjuu5_image.png'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .login-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        
        /* Fond avec dégradé violet/bleu/rose */
        .login-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            #1a0a3a 0%,
            #2d1654 15%,
            #4a2080 35%,
            #6b3fa0 50%,
            #8b5fbb 65%,
            #b080d0 80%,
            #d4a5e8 90%,
            #f0c5a0 100%
          );
        }
        
        /* Image d'hôtel */
        .login-hotel {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 65%;
          height: 75%;
          background-image: url('https://images.pexels.com/photos/7252071/pexels-photo-7252071.jpeg?auto=compress&cs=tinysrgb&w=1200');
          background-size: cover;
          background-position: center;
          mask-image: linear-gradient(
            to top,
            rgba(0,0,0,0.95) 0%,
            rgba(0,0,0,0.8) 40%,
            rgba(0,0,0,0.4) 70%,
            rgba(0,0,0,0) 100%
          );
          -webkit-mask-image: linear-gradient(
            to top,
            rgba(0,0,0,0.95) 0%,
            rgba(0,0,0,0.8) 40%,
            rgba(0,0,0,0.4) 70%,
            rgba(0,0,0,0) 100%
          );
          opacity: 0.75;
        }
        
        .login-content {
          position: relative;
          z-index: 10;
          display: flex;
          min-height: 100vh;
          padding: 48px;
        }
        
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          max-width: 520px;
        }
        
        .logo-badge {
          display: inline-flex;
          align-items: center;
          padding: 16px 28px;
          background: rgba(120, 80, 200, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          width: fit-content;
        }
        
        .logo-flow {
          font-size: 24px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.02em;
        }
        
        .logo-tym {
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(90deg, #c084fc, #e879f9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
        
        .tagline-section {
          margin-top: -80px;
        }
        
        .tagline-title {
          font-size: 40px;
          font-weight: 700;
          line-height: 1.18;
          color: #FFFFFF;
          margin-bottom: 22px;
          letter-spacing: -0.02em;
        }
        
        .tagline-subtitle {
          font-size: 17px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.78);
          font-weight: 400;
        }
        
        .login-footer {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.55);
        }
        
        .footer-brand {
          color: rgba(255, 255, 255, 0.82);
          font-weight: 500;
        }
        
        .login-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-left: 60px;
        }
        
        .login-card {
          width: 420px;
          background: rgba(255, 255, 255, 0.97);
          border-radius: 22px;
          padding: 46px 42px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.18);
        }
        
        .form-header {
          text-align: center;
          margin-bottom: 38px;
        }
        
        .form-title {
          font-size: 30px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        
        .form-title-brand {
          color: #7c3aed;
        }
        
        .form-subtitle {
          font-size: 15px;
          color: #6b7280;
          font-weight: 400;
        }
        
        .input-group {
          margin-bottom: 22px;
        }
        
        .input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 9px;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-field {
          width: 100%;
          height: 52px;
          padding: 0 18px;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 11px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .input-field::placeholder {
          color: #9ca3af;
        }
        
        .input-field:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
        }
        
        .input-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px;
        }
        
        .input-icon:hover {
          color: #6b7280;
        }
        
        .submit-btn {
          width: 100%;
          height: 54px;
          background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 50%, #c4b5fd 100%);
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          border: none;
          border-radius: 13px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.32);
          margin-top: 8px;
        }
        
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(139, 92, 246, 0.42);
        }
        
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinner {
          width: 22px;
          height: 22px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 22px;
          font-size: 13px;
          color: #9ca3af;
        }
        
        .forgot-link {
          display: block;
          text-align: center;
          margin-top: 18px;
          font-size: 15px;
          font-weight: 600;
          color: #8b5cf6;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s;
        }
        
        .forgot-link:hover {
          color: #7c3aed;
        }
        
        .features-list {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #4b5563;
          font-size: 15px;
          font-weight: 400;
        }
        
        .feature-check {
          width: 19px;
          height: 19px;
          color: #8b5cf6;
          flex-shrink: 0;
        }
        
        @media (max-width: 1050px) {
          .login-content {
            flex-direction: column;
            align-items: center;
            padding: 32px 24px;
          }
          .login-left {
            max-width: 100%;
            align-items: center;
            text-align: center;
            margin-bottom: 40px;
          }
          .tagline-section {
            margin-top: 32px;
          }
          .login-right {
            padding-left: 0;
            justify-content: center;
          }
          .login-footer {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .login-card {
            width: 100%;
            padding: 34px 26px;
            border-radius: 18px;
          }
          .form-title {
            font-size: 26px;
          }
          .tagline-title {
            font-size: 30px;
          }
        }
      `}</style>
      
      <div className="login-page">
        {/* Fond dégradé */}
        <div className="login-bg" />
        
        {/* Image hôtel */}
        <div className="login-hotel" />
        
        {/* Contenu */}
        <div className="login-content">
          {/* Panneau gauche */}
          <div className="login-left">
            {/* Logo FLOWTYM */}
            <div className="logo-badge">
              <span className="logo-flow">FLOW</span>
              <span className="logo-tym">TYM</span>
            </div>
            
            {/* Tagline */}
            <div className="tagline-section">
              <h1 className="tagline-title">
                Le système d'exploitation<br />
                des hôtels modernes
              </h1>
              <p className="tagline-subtitle">
                Réservations, revenus, distribution et expérience client.<br />
                Tout est connecté dans une seule plateforme.
              </p>
            </div>
            
            {/* Footer */}
            <div className="login-footer">
              <span className="footer-brand">Flowtym</span> - Tous droits réservés 2026
            </div>
          </div>
          
          {/* Panneau droit - Formulaire */}
          <div className="login-right">
            <div className="login-card">
              <div className="form-header">
                <h2 className="form-title">
                  Bienvenue sur <span className="form-title-brand">Flowtym</span>
                </h2>
                <p className="form-subtitle">
                  Connectez-vous pour accéder à votre plateforme
                </p>
              </div>
              
              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div className="input-group">
                      <label className="input-label">Prénom</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Jean"
                        required={!isLogin}
                        className="input-field"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Nom</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Dupont"
                        required={!isLogin}
                        className="input-field"
                        data-testid="input-last-name"
                      />
                    </div>
                  </>
                )}
                
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.dupont@hotel.com"
                    required
                    className="input-field"
                    data-testid="input-email"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Mot de passe</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="input-field"
                      style={{ paddingRight: '50px' }}
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="input-icon"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                  data-testid="btn-submit-login"
                >
                  {loading ? <div className="spinner" /> : 'Accéder à mon espace'}
                </button>
              </form>
              
              <div className="security-note">
                <Lock size={14} />
                <span>Données sécurisées - Accès réservé</span>
              </div>
              
              <a 
                className="forgot-link" 
                onClick={() => setIsLogin(!isLogin)} 
                data-testid="btn-toggle-auth-mode"
              >
                {isLogin ? "Mot de passe oublié ?" : 'Déjà un compte ? Se connecter'}
              </a>
              
              {isLogin && (
                <div className="features-list">
                  <div className="feature-item">
                    <Check className="feature-check" strokeWidth={2.5} />
                    <span>Plateforme tout-en-un</span>
                  </div>
                  <div className="feature-item">
                    <Check className="feature-check" strokeWidth={2.5} />
                    <span>Synchronisation temps réel</span>
                  </div>
                  <div className="feature-item">
                    <Check className="feature-check" strokeWidth={2.5} />
                    <span>Pilotage intelligent des revenus</span>
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
