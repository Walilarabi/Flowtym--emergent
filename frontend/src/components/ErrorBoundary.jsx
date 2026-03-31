/**
 * ErrorBoundary - Composant global pour capturer les erreurs React
 * Évite les pages blanches en cas de crash runtime
 */

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState(prev => ({ 
      errorInfo,
      errorCount: prev.errorCount + 1
    }))
    
    // Log to monitoring service if available
    if (window.errorLogger) {
      window.errorLogger.log({
        error: error.toString(),
        stack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state
      const isDev = import.meta.env.DEV

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Oups ! Une erreur est survenue</h1>
                  <p className="text-sm text-white/80">L'application a rencontré un problème</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>Message d'erreur :</strong>
                </p>
                <code className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded block break-all">
                  {error?.toString() || 'Erreur inconnue'}
                </code>
              </div>

              {/* Dev mode: show stack trace */}
              {isDev && errorInfo?.componentStack && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    <Bug size={12} /> Stack trace (dev only)
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-900 text-green-400 rounded-lg overflow-auto max-h-40 text-[10px]">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Error count warning */}
              {errorCount > 2 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  <strong>Attention :</strong> Cette erreur s'est produite {errorCount} fois.
                  Un rechargement complet peut être nécessaire.
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="default" 
                  className="flex-1 bg-slate-900 hover:bg-slate-800"
                  onClick={this.handleRetry}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Réessayer
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={this.handleGoHome}
                >
                  <Home size={16} className="mr-2" />
                  Accueil
                </Button>
              </div>

              {errorCount > 2 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-slate-500"
                  onClick={this.handleReload}
                >
                  Recharger la page complète
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                FLOWTYM v2.0 • Si le problème persiste, contactez le support
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
