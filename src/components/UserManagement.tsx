import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function UserManagement() {
  const users = useQuery(api.users.getAllUsers);
  const createUser = useMutation(api.users.createUser);
  const updateUserRole = useMutation(api.users.updateUserRole);
  const deleteUser = useMutation(api.users.deleteUser);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUser = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const email = formData.get("email") as string;
      const name = formData.get("name") as string;
      const role = formData.get("role") as "admin" | "user" | "manager";

      // Entfernen Sie temporaryPassword - nicht mehr benötigt
      const result = await createUser({ email, name, role });
      toast.success(result.message || "Benutzer wurde erfolgreich erstellt");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error("Fehler beim Erstellen: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "admin" | "user" | "manager") => {
    try {
      await updateUserRole({ targetUserId: userId as Id<"users">, newRole });
      toast.success("Benutzerrolle wurde aktualisiert");
    } catch (error: any) {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Benutzer "${userName}" wirklich löschen?`)) {
      try {
        await deleteUser({ targetUserId: userId as Id<"users"> });
        toast.success("Benutzer wurde gelöscht");
      } catch (error: any) {
        toast.error("Fehler beim Löschen: " + error.message);
      }
    }
  };

  if (users === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Neuen Benutzer erstellen
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
          <h2 className="text-xl font-semibold mb-4">Neuen Benutzer erstellen</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Wichtig - Anweisungen für den neuen Benutzer:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Gehen Sie zur Anmeldeseite</li>
                <li>Klicken Sie auf <strong>"Sign up instead"</strong> (nicht "Sign in")</li>
                <li>Geben Sie Ihre E-Mail-Adresse ein</li>
                <li>Erstellen Sie ein neues Passwort Ihrer Wahl</li>
                <li>Klicken Sie auf <strong>"Sign up"</strong></li>
              </ol>
              <p className="mt-2 font-medium">
                Der Benutzer kann sich sein eigenes Passwort erstellen - kein temporäres Passwort erforderlich.
              </p>
            </div>
          </div>
          <form action={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rolle
                </label>
                <select
                  name="role"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Erstelle..." : "Erstellen"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                E-Mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rolle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name || "Kein Name"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user._id, e.target.value as any)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.emailVerificationTime 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailVerificationTime ? 'Aktiviert' : 'Wartend'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDeleteUser(user._id, user.name || user.email || "Unbekannt")}
                    className="text-red-600 hover:text-red-900"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}