import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from 'convex/react'
import { api } from '../convex/_generated/api'
import { SignInForm } from './SignInForm'
import { SignOutButton } from './SignOutButton'
import { Toaster } from 'sonner'
import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { AdminDashboard } from './components/AdminDashboard'
import { UserManagement } from './components/UserManagement'
import { ObjectForm } from './components/ObjectForm'
import { ObjectView } from './components/ObjectView'
import { Profile } from './components/Profile'
import { Registration } from './components/Registration'
import { MigrationHelper } from './components/MigrationHelper'

export default function App() {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedApp />
      </Unauthenticated>
      <Toaster />
    </div>
  )
}

function UnauthenticatedApp() {
  const [showRegistration, setShowRegistration] = useState(false)

  return (
    <>
      <header className='sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4'>
        <h2 className='text-lg sm:text-xl font-semibold text-blue-600'>
          Objektübergabe
        </h2>
        <div className='flex gap-2'>
          <button
            onClick={() => setShowRegistration(false)}
            className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${!showRegistration ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            Anmelden
          </button>
          <button
            onClick={() => setShowRegistration(true)}
            className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${showRegistration ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            Registrieren
          </button>
        </div>
      </header>
      <main className='flex-1 flex items-center justify-center p-4 sm:p-8'>
        <div className='w-full max-w-md mx-fauto'>
          <div className='text-center mb-6 sm:mb-8'>
            <h1 className='text-2xl sm:text-4xl font-bold text-blue-600 mb-3 sm:mb-4'>
              Digitale Objektübergabe
            </h1>
            <p className='text-lg sm:text-xl text-gray-600'>
              {showRegistration
                ? 'Neuen Account erstellen'
                : 'Anmelden um fortzufahren'}
            </p>
          </div>
          {showRegistration ? <Registration /> : <SignInForm />}
        </div>
      </main>
    </>
  )
}

function AuthenticatedApp() {
  const user = useQuery(api.users.getCurrentUser)
  const [currentView, setCurrentView] = useState<string>('dashboard')
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  if (user === undefined) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!user) {
    return <div>Error loading user</div>
  }

  const isAdmin = user.role === 'admin'

  const handleViewObject = (objectId: string) => {
    setSelectedObjectId(objectId)
    setCurrentView('object-view')
    setShowMobileMenu(false)
  }

  const handleEditObject = (objectId: string) => {
    setSelectedObjectId(objectId)
    setCurrentView('object-form')
    setShowMobileMenu(false)
  }

  const handleNavigation = (view: string) => {
    setCurrentView(view)
    setShowMobileMenu(false)
  }

  return (
    <>
      <header className='sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4'>
        <div className='flex items-center gap-2 sm:gap-4'>
          <h2 className='text-lg sm:text-xl font-semibold text-blue-600'>
            Objektübergabe
          </h2>
          <span className='hidden sm:inline text-sm text-gray-500'>
            {user.name || user.email} ({user.role})
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center gap-4'>
          <nav className='flex gap-2'>
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`px-3 py-2 rounded text-sm ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              {isAdmin ? 'Admin Dashboard' : 'Meine Objekte'}
            </button>
            {isAdmin && (
              <button
                onClick={() => handleNavigation('user-management')}
                className={`px-3 py-2 rounded text-sm ${
                  currentView === 'user-management'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                Benutzerverwaltung
              </button>
            )}
            <button
              onClick={() => handleNavigation('profile')}
              className={`px-3 py-2 rounded text-sm ${
                currentView === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              Profil
            </button>
          </nav>
          <SignOutButton />
        </div>

        {/* Mobile Menu Button */}
        <div className='md:hidden flex items-center gap-2'>
          <span className='text-xs text-gray-500 sm:hidden'>
            {user.name || user.email}
          </span>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className='p-2 text-gray-600 hover:text-gray-900'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6h16M4 12h16M4 18h16'
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className='md:hidden bg-white border-b shadow-sm'>
          <nav className='flex flex-col p-4 space-y-2'>
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`px-3 py-2 rounded text-left ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              {isAdmin ? 'Admin Dashboard' : 'Meine Objekte'}
            </button>
            {isAdmin && (
              <button
                onClick={() => handleNavigation('user-management')}
                className={`px-3 py-2 rounded text-left ${
                  currentView === 'user-management'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                Benutzerverwaltung
              </button>
            )}
            <button
              onClick={() => handleNavigation('profile')}
              className={`px-3 py-2 rounded text-left ${
                currentView === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              Profil
            </button>
            <div className='pt-2 border-t'>
              <SignOutButton />
            </div>
          </nav>
        </div>
      )}

      <main className='flex-1 p-3 sm:p-6'>
        {currentView === 'dashboard' && (
          <>
            {isAdmin ? (
              <AdminDashboard
                onViewObject={handleViewObject}
                onEditObject={handleEditObject}
              />
            ) : (
              <Dashboard
                onViewObject={handleViewObject}
                onEditObject={handleEditObject}
              />
            )}
          </>
        )}
        {currentView === 'user-management' && isAdmin && <UserManagement />}
        {currentView === 'object-form' && (
          <ObjectForm
            objectId={selectedObjectId}
            onBack={() => handleNavigation('dashboard')}
          />
        )}
        {currentView === 'object-view' && selectedObjectId && (
          <ObjectView
            objectId={selectedObjectId}
            onBack={() => handleNavigation('dashboard')}
            onEdit={() => handleEditObject(selectedObjectId)}
          />
        )}
        {currentView === 'profile' && <Profile />}
      </main>
    </>
  )
}
