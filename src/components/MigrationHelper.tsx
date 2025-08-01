import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'

export function MigrationHelper() {
  const [isRunning, setIsRunning] = useState(false)
  const migrationStatus = useQuery(api.migrations.checkMigrationStatus)
  const runMigration = useMutation(api.migrations.migrateExistingObjects)
  const fixUserProfilesSchema = useMutation(
    api.migrations.fixUserProfilesSchema
  )
  const handleMigration = async () => {
    setIsRunning(true)
    try {
      const result = await runMigration({})
      toast.success(`Migration erfolgreich! Objekte migriert.`)
      const result2 = await fixUserProfilesSchema({})

      toast.success(`Migration erfolgreich! Objekte migriert.`)
    } catch (error: any) {
      toast.error('Fehler bei der Migration: ' + error.message)
    } finally {
      setIsRunning(false)
    }
  }

  if (migrationStatus === undefined) {
    return (
      <div className='flex justify-center items-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!migrationStatus) {
    return null // Don't show if no migration needed
  }

  return (
    <div className='max-w-md mx-auto mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg'>
      <h3 className='text-lg font-semibold text-yellow-800 mb-2'>
        Datenbank-Migration erforderlich
      </h3>
      <p className='text-sm text-yellow-700 mb-4'>Es wurden</p>
      <button
        onClick={handleMigration}
        disabled={isRunning}
        className='w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors disabled:opacity-50'
      >
        {isRunning ? 'Migration läuft...' : 'Migration starten'}
      </button>
    </div>
  )
}
