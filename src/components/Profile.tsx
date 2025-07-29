import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import  PasswordReset  from "./PasswordReset";

export function Profile() {
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form when user data loads
  useEffect(() => {
    if (user && name === "") {
      setName(user.name || "");
    }
  }, [user, name]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateProfile({ name: name.trim() || undefined });
      toast.success("Profil wurde aktualisiert");
    } catch (error: any) {
      toast.error("Fehler beim Aktualisieren: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div>Fehler beim Laden des Benutzerprofils</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ihr vollständiger Name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              E-Mail-Adresse kann nicht geändert werden
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rolle
            </label>
            <input
              type="text"
              value={user.role}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
            />
            <p className="text-xs text-gray-500 mt-1">
              Rolle kann nur von einem Administrator geändert werden
            </p>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Speichere..." : "Profil aktualisieren"}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Passwort ändern</h3>
          <p className="text-sm text-gray-600 mb-4">
          <PasswordReset/>
          </p>
        </div>
      </div>
    </div>
  );
}
