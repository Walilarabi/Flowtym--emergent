import { TopNavigation } from './TopNavigation'
import { SubNavigation } from './SubNavigation'
import { useHotel } from '@/context/HotelContext'
import { SetupWizard } from '@/components/setup/SetupWizard'

export const MainLayout = ({ children }) => {
  const { currentHotel, loading } = useHotel()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-violet-600 border-t-transparent rounded-full spinner" />
          <span className="text-sm font-medium text-slate-600">Chargement...</span>
        </div>
      </div>
    )
  }

  if (!currentHotel) {
    return <SetupWizard />
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100/80">
      <TopNavigation />
      <SubNavigation />
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>
    </div>
  )
}
