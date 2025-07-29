import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface DashboardProps {
  onViewObject: (objectId: string) => void;
  onEditObject: (objectId: string) => void;
}

export function Dashboard({ onViewObject, onEditObject }: DashboardProps) {
  const [search, setSearch] = useState("");
  const objects = useQuery(api.objects.getUserObjects, { search: search || undefined });
  const releaseObject = useMutation(api.objects.releaseObject);

  const handleRelease = async (objectId: string) => {
    if (confirm("Objekt freigeben? Nach der Freigabe kann es nicht mehr bearbeitet werden.")) {
      try {
        await releaseObject({ objectId: objectId as Id<"objects"> });
        toast.success("Objekt wurde freigegeben");
      } catch (error: any) {
        toast.error("Fehler beim Freigeben: " + error.message);
      }
    }
  };

  if (objects === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meine Objekte</h1>
        <button
          onClick={() => onEditObject("")}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          Neues Objekt erstellen
        </button>
      </div>

      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Nach Objektname suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
        />
      </div>

      {objects.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-500 text-base sm:text-lg mb-4">
            {search ? "Keine Objekte gefunden" : "Noch keine Objekte erstellt"}
          </div>
          {!search && (
            <button
              onClick={() => onEditObject("")}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Erstes Objekt erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((object) => (
            <div key={object._id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate flex-1 mr-2">
                  {object.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                    object.isReleased
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {object.isReleased ? "Freigegeben" : "Entwurf"}
                </span>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                <p>{object.street}</p>
                <p>{object.postalCode} {object.city}</p>
                <p className="mt-2">
                  Erstellt: {new Date(object.createdAt).toLocaleDateString("de-DE")}
                </p>
                {object.releasedAt && (
                  <p>
                    Freigegeben: {new Date(object.releasedAt).toLocaleDateString("de-DE")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onViewObject(object._id)}
                  className="bg-gray-100 text-gray-700 px-2 sm:px-3 py-2 rounded hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                >
                  Anzeigen
                </button>
                {!object.isReleased && (
                  <>
                    <button
                      onClick={() => onEditObject(object._id)}
                      className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-2 rounded hover:bg-blue-200 transition-colors text-xs sm:text-sm"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleRelease(object._id)}
                      className="bg-green-100 text-green-700 px-2 sm:px-3 py-2 rounded hover:bg-green-200 transition-colors text-xs sm:text-sm"
                    >
                      Freigeben
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
