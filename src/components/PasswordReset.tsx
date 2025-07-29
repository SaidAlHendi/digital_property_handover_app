'use client'

import type React from 'react'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'

export default function PasswordChange() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Die neuen Passwörter stimmen nicht überein')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Das neue Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setIsLoading(true)

    try {
      /*       await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }) */

      toast.success('Passwort wurde erfolgreich geändert')

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Ändern des Passworts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
    }

  return (
    <div className='bg-gray-50 rounded-lg p-4'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Aktuelles Passwort
          </label>
          <input
            type='password'
            value={formData.currentPassword}
            onChange={handleInputChange('currentPassword')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            placeholder='Ihr aktuelles Passwort'
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Neues Passwort
          </label>
          <input
            type='password'
            value={formData.newPassword}
            onChange={handleInputChange('newPassword')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            placeholder='Mindestens 6 Zeichen'
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
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            placeholder='Neues Passwort wiederholen'
            required
            minLength={6}
          />
        </div>

        <div className='pt-2'>
          <button
            type='submit'
            disabled={
              true ||
              isLoading ||
              !formData.currentPassword ||
              !formData.newPassword ||
              !formData.confirmPassword
            }
            className='w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Passwort wird geändert...' : 'Passwort ändern'}
          </button>
        </div>
      </form>
    </div>
  )
}
