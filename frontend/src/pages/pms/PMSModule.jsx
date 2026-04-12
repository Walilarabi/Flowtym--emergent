import { useState, useRef, useEffect } from 'react'
import { Maximize2, Minimize2, RefreshCw, ExternalLink } from 'lucide-react'

const API_URL = import.meta.env.VITE_BACKEND_URL || ''

export default function PMSModule() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef(null)
  const containerRef = useRef(null)

  const pmsUrl = `${API_URL}/api/pms-app`

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setHasError(false)
    if (iframeRef.current) {
      iframeRef.current.src = pmsUrl
    }
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full"
      data-testid="pms-module-container"
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{
          background: '#FAFAFF',
          borderColor: '#E8E4FF',
          minHeight: '40px'
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: hasError ? '#EF4444' : isLoading ? '#F59E0B' : '#22C55E' }}
          />
          <span className="text-xs font-semibold" style={{ color: '#7C3AED' }}>
            PMS Flowtym v2.3
          </span>
          {isLoading && (
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Chargement...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md transition-colors hover:bg-white"
            title="Rafraichir"
            data-testid="pms-refresh-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
          </button>
          <button
            onClick={() => window.open(pmsUrl, '_blank')}
            className="p-1.5 rounded-md transition-colors hover:bg-white"
            title="Ouvrir dans un nouvel onglet"
            data-testid="pms-external-btn"
          >
            <ExternalLink className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md transition-colors hover:bg-white"
            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            data-testid="pms-fullscreen-btn"
          >
            {isFullscreen
              ? <Minimize2 className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
              : <Maximize2 className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
            }
          </button>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative" style={{ background: '#F8F7FF' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: '#F8F7FF' }}>
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: '#E8E4FF', borderTopColor: '#7C3AED' }}
              />
              <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
                Chargement du PMS...
              </span>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: '#F8F7FF' }}>
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: '#FEE2E2' }}
              >
                <span className="text-lg">!</span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1F2937' }}>
                  Impossible de charger le PMS
                </p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Vérifiez votre connexion et réessayez
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors"
                style={{ background: '#7C3AED' }}
                data-testid="pms-retry-btn"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={pmsUrl}
          onLoad={handleLoad}
          onError={handleError}
          title="Flowtym PMS"
          data-testid="pms-iframe"
          className="w-full h-full border-0"
          style={{
            display: hasError ? 'none' : 'block',
            background: '#F8F7FF'
          }}
          allow="clipboard-write; clipboard-read"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>
    </div>
  )
}
