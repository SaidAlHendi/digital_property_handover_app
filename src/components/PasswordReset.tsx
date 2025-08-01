import { useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'

export function PasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentUser = useQuery(api.users.getCurrentUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Die neuen Passwörter stimmen nicht überein')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Das neue Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setIsSubmitting(true)

    try {
      /*       await changePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      })
 */
      toast.success('Passwort erfolgreich geändert')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error('Fehler beim Ändern des Passworts: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentUser) {
    return <div>Laden...</div>
  }

  return (
    <div className='max-w-md mx-auto bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-xl font-semibold mb-4'>Passwort ändern</h2>
      <p className='text-sm text-gray-600 mb-4'>
        Benutzer: {currentUser.email}
      </p>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Aktuelles Passwort
          </label>
          <input
            type='password'
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Neues Passwort
          </label>
          <input
            type='password'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
            minLength={6}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Neues Passwort bestätigen
          </label>
          <input
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
            minLength={6}
          />
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isSubmitting ? 'Wird geändert...' : 'Passwort ändern'}
        </button>
      </form>
    </div>
  )
}
