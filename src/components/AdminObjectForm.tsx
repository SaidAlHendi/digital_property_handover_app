import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface AdminObjectFormProps {
  objectId: string | null;
  onBack: () => void;
}

export function AdminObjectForm({ objectId, onBack }: AdminObjectFormProps) {
  const existingObject = useQuery(
    api.objects.getObject,
    objectId ? { objectId: objectId as Id<"objects"> } : "skip"
  );
  const createObject = useMutation(api.objects.createObject);
  const updateObject = useMutation(api.objects.updateObject);
  const users = useQuery(api.objects.getAllUsers);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    postalCode: "",
    city: "",
    room: "",
    floor: "",
    assignedUsers: [] as string[],
  });

  // 1. State für Parteien
  const [parties, setParties] = useState<{ name: string; function: string; address: string; phone: string; email: string }[]>([]);
  const [showParties, setShowParties] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing object data
  useEffect(() => {
    if (existingObject) {
      setFormData({
        name: existingObject.name,
        street: existingObject.street,
        postalCode: existingObject.postalCode,
        city: existingObject.city,
        room: existingObject.room || "",
        floor: existingObject.floor || "",
        assignedUsers: existingObject.assignedUsers || [],
      });
      setParties(existingObject.parties && existingObject.parties.length > 0 ? existingObject.parties : []);
      setShowParties((existingObject.parties && existingObject.parties.length > 0) ? true : false);
    }
  }, [existingObject]);

  const handleAddParty = () => {
    setShowParties(true);
    setParties((prev) => [
      ...prev,
      { name: "", function: "", address: "", phone: "", email: "" },
    ]);
  };

  const handleRemoveParty = (index: number) => {
    setParties((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePartyChange = (index: number, field: string, value: string) => {
    setParties((prev) =>
      prev.map((party, i) =>
        i === index ? { ...party, [field]: value } : party
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Benutzerzuweisung required
    if (!formData.assignedUsers || formData.assignedUsers.length === 0) {
      setError("Bitte mindestens einen Benutzer zuweisen.");
      setIsLoading(false);
      return;
    }
    // Wenn Parteien sichtbar, müssen alle Felder ausgefüllt sein
    if (showParties) {
      for (const party of parties) {
        if (!party.name || !party.function || !party.address || !party.phone || !party.email) {
          setError("Bitte alle Felder für jede Partei ausfüllen.");
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const data = {
        name: formData.name,
        street: formData.street,
        postalCode: formData.postalCode,
        city: formData.city,
        room: formData.room || undefined,
        floor: formData.floor || undefined,
        assignedUsers: formData.assignedUsers.length > 0 ? (formData.assignedUsers as Id<"users">[]) : undefined,
        parties: showParties && parties.length > 0 ? parties : undefined,
      };

      if (objectId) {
        await updateObject({ objectId: objectId as Id<"objects">, ...data });
        toast.success("Objekt wurde aktualisiert");
      } else {
        await createObject(data);
        toast.success("Objekt wurde erstellt");
      }
      onBack();
    } catch (error: any) {
      toast.error("Fehler beim Speichern: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId)
        ? prev.assignedUsers.filter(id => id !== userId)
        : [...prev.assignedUsers, userId]
    }));
  };

  if (objectId && existingObject === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isReleased = existingObject?.status === "released";
  const isDraft = existingObject?.status === "draft";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm sm:text-base"
        >
          ← Zurück
        </button>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
          {objectId ? "Objekt bearbeiten" : "Neues Objekt erstellen (Admin)"}
        </h1>
        {existingObject && (
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
            isReleased ? "bg-green-100 text-green-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {isReleased ? "Freigegeben" : "Entwurf"}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
        )}
        {/* Object Details - Admin can edit */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Objektdaten</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Objektbezeichnung *
              </label>
                             <input
                 type="text"
                 required
                 value={formData.name}
                 onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                 disabled={!!isReleased || (!!objectId && !isDraft)}
               />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Straße *
              </label>
                             <input
                 type="text"
                 required
                 value={formData.street}
                 onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                 disabled={!!isReleased || (!!objectId && !isDraft)}
               />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                PLZ *
              </label>
                             <input
                 type="text"
                 required
                 value={formData.postalCode}
                 onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                 disabled={!!isReleased || (!!objectId && !isDraft)}
               />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Ort *
              </label>
                             <input
                 type="text"
                 required
                 value={formData.city}
                 onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                 disabled={!!isReleased || (!!objectId && !isDraft)}
               />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Raum/Etage
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="z.B. 3. Stock, Zimmer 12"
                disabled={!!isReleased || (!!objectId && !isDraft)}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Etage
              </label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="z.B. 2. OG"
                disabled={!!isReleased || (!!objectId && !isDraft)}
              />
            </div>
          </div>
        </div>

        {/* User Assignment */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Benutzer zuweisen</h2>
          {users === undefined ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Wählen Sie die Benutzer aus, die dieses Objekt verwalten sollen:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((user) => (
                  <label key={user._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedUsers.includes(user._id)}
                      onChange={() => handleUserToggle(user._id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={!!isReleased || (!!objectId && !isDraft)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                    </div>
                  </label>
                ))}
              </div>
              {formData.assignedUsers.length === 0 && (
                <p className="text-sm text-yellow-600 mt-2">
                  ⚠️ Keine Benutzer ausgewählt. Das Objekt wird als Entwurf erstellt.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Beteiligte Personen */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Beteiligte Personen</h2>
            {!isReleased && (
              <button
                type="button"
                onClick={handleAddParty}
                className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-700"
              >
                Partei hinzufügen
              </button>
            )}
          </div>
          {showParties && (
            <div className="space-y-4 sm:space-y-6">
              {parties.map((party, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-medium">Partei {index + 1}</h3>
                    {!isReleased && parties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParty(index)}
                        className="text-red-600 hover:text-red-800 px-2 text-sm sm:text-base"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <input
                      type="text"
                      placeholder="Name *"
                      value={party.name}
                      onChange={e => handlePartyChange(index, "name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                      disabled={isReleased}
                    />
                    <input
                      type="text"
                      placeholder="Funktion *"
                      value={party.function}
                      onChange={e => handlePartyChange(index, "function", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                      disabled={isReleased}
                    />
                    <div className="sm:col-span-2">
                      <textarea
                        placeholder="Adresse *"
                        value={party.address}
                        onChange={e => handlePartyChange(index, "address", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        rows={3}
                        required
                        disabled={isReleased}
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="Telefon *"
                      value={party.phone}
                      onChange={e => handlePartyChange(index, "phone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                      disabled={isReleased}
                    />
                    <input
                      type="email"
                      placeholder="E-Mail *"
                      value={party.email}
                      onChange={e => handlePartyChange(index, "email", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      required
                      disabled={isReleased}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        {!isReleased && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? "Speichere..." : (objectId ? "Aktualisieren" : "Erstellen")}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-300 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
            >
              Abbrechen
            </button>
          </div>
        )}
      </form>
    </div>
  );
} 