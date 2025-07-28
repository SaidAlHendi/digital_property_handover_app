import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface AdminDashboardProps {
  onViewObject: (objectId: string) => void;
  onEditObject: (objectId: string) => void;
}

export function AdminDashboard({ onViewObject, onEditObject }: AdminDashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | "">("");
  
  const users = useQuery(api.users.getAllUsers);
  const objects = useQuery(api.objects.getAllObjects, { 
    search: search || undefined,
    createdBy: selectedUser || undefined,
  });
  const releaseObject = useMutation(api.objects.releaseObject);
  const deleteObject = useMutation(api.objects.deleteObject);

  const handleRelease = async (objectId: string) => {
    if (confirm("Objekt freigeben?")) {
      try {
        await releaseObject({ objectId: objectId as Id<"objects"> });
        toast.success("Objekt wurde freigegeben");
      } catch (error: any) {
        toast.error("Fehler beim Freigeben: " + error.message);
      }
    }
  };

  const handleDelete = async (objectId: string) => {
    if (confirm("Objekt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      try {
        await deleteObject({ objectId: objectId as Id<"objects"> });
        toast.success("Objekt wurde gelöscht");
      } catch (error: any) {
        toast.error("Fehler beim Löschen: " + error.message);
      }
    }
  };

  if (objects === undefined || users === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={() => onEditObject("")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Neues Objekt erstellen
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Nach Objektname suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value as Id<"users"> | "")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Alle Benutzer</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name || user.email} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {objects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            Keine Objekte gefunden
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {objects.map((object) => (
            <div key={object._id} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  {object.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    object.isReleased
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {object.isReleased ? "Freigegeben" : "Entwurf"}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>{object.street}</p>
                <p>{object.postalCode} {object.city}</p>
                <p className="mt-2 font-medium">
                  Ersteller: {object.creatorName}
                </p>
                <p>
                  Erstellt: {new Date(object.createdAt).toLocaleDateString("de-DE")}
                </p>
                {object.releasedAt && (
                  <p>
                    Freigegeben: {new Date(object.releasedAt).toLocaleDateString("de-DE")}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onViewObject(object._id)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors text-sm"
                >
                  Anzeigen
                </button>
                <button
                  onClick={() => onEditObject(object._id)}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition-colors text-sm"
                >
                  Bearbeiten
                </button>
                {!object.isReleased && (
                  <button
                    onClick={() => handleRelease(object._id)}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 transition-colors text-sm"
                  >
                    Freigeben
                  </button>
                )}
                <button
                  onClick={() => handleDelete(object._id)}
                  className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 transition-colors text-sm"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
