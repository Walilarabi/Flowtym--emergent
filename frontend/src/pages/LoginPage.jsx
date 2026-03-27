import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await login(formData.email, formData.password)
      toast.success('Connexion réussie')
      navigate('/pms/planning')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundImage: 'url(https://customer-assets.emergentagent.com/job_34b63afc-18b0-4c61-91ea-7e5b856ce43a/artifacts/gdtbzrqh_image.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .form-overlay {
          position: absolute;
          top: 50%;
          right: 5.5%;
          transform: translateY(-50%);
          width: 310px;
        }
        
        .input-field {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          background: transparent;
          border: none;
          outline: none;
          box-sizing: border-box;
        }
        
        .input-field::placeholder {
          color: transparent;
          opacity: 0;
        }
        
        .input-wrapper {
          position: relative;
          margin-bottom: 62px;
          background: transparent;
        }
        
        .input-wrapper:first-child {
          margin-top: 115px;
        }
        
        .input-wrapper label {
          display: none;
        }
        
        .input-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: transparent;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px;
          z-index: 10;
          width: 30px;
          height: 30px;
        }
        
        .submit-btn {
          width: 100%;
          height: 48px;
          background: transparent;
          color: transparent;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          border: none;
          cursor: pointer;
          margin-top: 8px;
        }
        
        .submit-btn:disabled {
          cursor: not-allowed;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <form onSubmit={handleSubmit} className="form-overlay">
        <div className="input-wrapper">
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email"
            required
            className="input-field"
            data-testid="input-email"
            autoComplete="email"
          />
        </div>
        
        <div className="input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Mot de passe"
            required
            className="input-field"
            style={{ paddingRight: '40px' }}
            data-testid="input-password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="input-icon"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
          data-testid="btn-submit-login"
        >
          {loading ? <div className="spinner" /> : ''}
        </button>
      </form>
    </div>
  )
}
