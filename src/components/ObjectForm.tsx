import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { RoomForm } from "./RoomForm";
import { ImageUpload } from "./ImageUpload";

interface ObjectFormProps {
  objectId: string | null;
  onBack: () => void;
}

export function ObjectForm({ objectId, onBack }: ObjectFormProps) {
  const existingObject = useQuery(
    api.objects.getObject,
    objectId ? { objectId: objectId as Id<"objects"> } : "skip"
  );
  const createObject = useMutation(api.objects.createObject);
  const updateObject = useMutation(api.objects.updateObject);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    addressSupplement: "",
    street: "",
    postalCode: "",
    city: "",
    party1Name: "",
    party1Function: "",
    party1Address: "",
    party1Phone: "",
    party1Email: "",
    party2Name: "",
    party2Function: "",
    party2Address: "",
    party2Phone: "",
    party2Email: "",
    keys: [{ type: "", quantity: 1 }],
    counters: [{ number: "", currentReading: 0 }],
    miscellaneous: "",
    notes: "",
    signature: "",
  });

  // Load existing object data
  useEffect(() => {
    if (existingObject) {
      setFormData({
        name: existingObject.name,
        addressSupplement: existingObject.addressSupplement || "",
        street: existingObject.street,
        postalCode: existingObject.postalCode,
        city: existingObject.city,
        party1Name: existingObject.party1Name,
        party1Function: existingObject.party1Function,
        party1Address: existingObject.party1Address,
        party1Phone: existingObject.party1Phone,
        party1Email: existingObject.party1Email,
        party2Name: existingObject.party2Name,
        party2Function: existingObject.party2Function,
        party2Address: existingObject.party2Address,
        party2Phone: existingObject.party2Phone,
        party2Email: existingObject.party2Email,
        keys: existingObject.keys.length > 0 ? existingObject.keys : [{ type: "", quantity: 1 }],
        counters: existingObject.counters.length > 0 ? existingObject.counters : [{ number: "", currentReading: 0 }],
        miscellaneous: existingObject.miscellaneous || "",
        notes: existingObject.notes || "",
        signature: existingObject.signature || "",
      });
    }
  }, [existingObject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Filter out empty keys and counters
      const filteredKeys = formData.keys.filter(key => key.type.trim() !== "");
      const filteredCounters = formData.counters.filter(counter => counter.number.trim() !== "");

      const data = {
        ...formData,
        keys: filteredKeys,
        counters: filteredCounters,
        addressSupplement: formData.addressSupplement || undefined,
        miscellaneous: formData.miscellaneous || undefined,
        notes: formData.notes || undefined,
        signature: formData.signature || undefined,
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

  const addKey = () => {
    setFormData(prev => ({
      ...prev,
      keys: [...prev.keys, { type: "", quantity: 1 }]
    }));
  };

  const removeKey = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keys: prev.keys.filter((_, i) => i !== index)
    }));
  };

  const updateKey = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      keys: prev.keys.map((key, i) => 
        i === index ? { ...key, [field]: value } : key
      )
    }));
  };

  const addCounter = () => {
    setFormData(prev => ({
      ...prev,
      counters: [...prev.counters, { number: "", currentReading: 0 }]
    }));
  };

  const removeCounter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      counters: prev.counters.filter((_, i) => i !== index)
    }));
  };

  const updateCounter = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      counters: prev.counters.map((counter, i) => 
        i === index ? { ...counter, [field]: value } : counter
      )
    }));
  };

  if (objectId && existingObject === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isReleased = existingObject?.isReleased;

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
          {objectId ? "Objekt bearbeiten" : "Neues Objekt erstellen"}
        </h1>
        {isReleased && (
          <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm">
            Freigegeben
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Object Details */}
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
                disabled={isReleased}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Adresszusatz
              </label>
              <input
                type="text"
                value={formData.addressSupplement}
                onChange={(e) => setFormData(prev => ({ ...prev, addressSupplement: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                disabled={isReleased}
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
                disabled={isReleased}
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
                disabled={isReleased}
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
                disabled={isReleased}
              />
            </div>
          </div>
        </div>

        {/* Involved Parties */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Beteiligte Personen</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Party 1 */}
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Partei 1</h3>
              <div className="space-y-2 sm:space-y-3">
                <input
                  type="text"
                  placeholder="Name *"
                  required
                  value={formData.party1Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, party1Name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                <input
                  type="text"
                  placeholder="Funktion *"
                  required
                  value={formData.party1Function}
                  onChange={(e) => setFormData(prev => ({ ...prev, party1Function: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                <textarea
                  placeholder="Adresse *"
                  required
                  value={formData.party1Address}
                  onChange={(e) => setFormData(prev => ({ ...prev, party1Address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  rows={3}
                  disabled={isReleased}
                />
                <input
                  type="tel"
                  placeholder="Telefon *"
                  required
                  value={formData.party1Phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, party1Phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                <input
                  type="email"
                  placeholder="E-Mail *"
                  required
                  value={formData.party1Email}
                  onChange={(e) => setFormData(prev => ({ ...prev, party1Email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
              </div>
            </div>

            {/* Party 2 */}
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Partei 2</h3>
              <div className="space-y-2 sm:space-y-3">
                <input
                  type="text"
                  placeholder="Name *"
                  required
                  value={formData.party2Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, party2Name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                <input
                  type="text"
                  placeholder="Funktion *"
                  required
                  value={formData.party2Function}
                  onChange={(e) => setFormData(prev => ({ ...prev, party2Function: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                <textarea
                  placeholder="Adresse *"
                  required
                  value={formData.party2Address}
                  onChange={(e) => setFormData(prev => ({ ...prev, party2Address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  rows={3}
                  disabled={isReleased}
                />
                <input
                  type="tel"
                  placeholder="Telefon *"
                  required
                  value={formData.party2Phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, party2Phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                <input
                  type="email"
                  placeholder="E-Mail *"
                  required
                  value={formData.party2Email}
                  onChange={(e) => setFormData(prev => ({ ...prev, party2Email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Keys */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Schlüsselübergabe</h2>
            {!isReleased && (
              <button
                type="button"
                onClick={addKey}
                className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-700"
              >
                Schlüssel hinzufügen
              </button>
            )}
          </div>
          <div className="space-y-2 sm:space-y-3">
            {formData.keys.map((key, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                <input
                  type="text"
                  placeholder="Schlüsseltyp (z.B. Haustürschlüssel)"
                  value={key.type}
                  onChange={(e) => updateKey(index, "type", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                <input
                  type="number"
                  placeholder="Anzahl"
                  min="1"
                  value={key.quantity}
                  onChange={(e) => updateKey(index, "quantity", parseInt(e.target.value) || 1)}
                  className="w-full sm:w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                {!isReleased && formData.keys.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKey(index)}
                    className="text-red-600 hover:text-red-800 px-2 text-sm sm:text-base"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Keys Images */}
          {objectId && existingObject && (
            <ImageUpload
              objectId={objectId}
              section="keys"
              images={existingObject.images?.keys || []}
              isDisabled={isReleased}
            />
          )}
        </div>

        {/* Counters */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Zählerdaten</h2>
            {!isReleased && (
              <button
                type="button"
                onClick={addCounter}
                className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-700"
              >
                Zähler hinzufügen
              </button>
            )}
          </div>
          <div className="space-y-2 sm:space-y-3">
            {formData.counters.map((counter, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                <input
                  type="text"
                  placeholder="Zählernummer"
                  value={counter.number}
                  onChange={(e) => updateCounter(index, "number", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                <input
                  type="number"
                  placeholder="Aktueller Stand"
                  min="0"
                  step="0.01"
                  value={counter.currentReading}
                  onChange={(e) => updateCounter(index, "currentReading", parseFloat(e.target.value) || 0)}
                  className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isReleased}
                />
                {!isReleased && formData.counters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCounter(index)}
                    className="text-red-600 hover:text-red-800 px-2 text-sm sm:text-base"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Counters Images */}
          {objectId && existingObject && (
            <ImageUpload
              objectId={objectId}
              section="counters"
              images={existingObject.images?.counters || []}
              isDisabled={isReleased}
            />
          )}
        </div>

        {/* Miscellaneous and Notes */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Sonstiges & Anmerkungen</h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Sonstiges
              </label>
              <textarea
                value={formData.miscellaneous}
                onChange={(e) => setFormData(prev => ({ ...prev, miscellaneous: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                rows={3}
                disabled={isReleased}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Anmerkungen
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                rows={3}
                disabled={isReleased}
              />
            </div>
          </div>
          
          {/* Miscellaneous Images */}
          {objectId && existingObject && (
            <ImageUpload
              objectId={objectId}
              section="miscellaneous"
              images={existingObject.images?.miscellaneous || []}
              isDisabled={isReleased}
            />
          )}
        </div>

        {/* Signature */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Unterschrift</h2>
          <textarea
            placeholder="Unterschrift oder Bestätigung"
            value={formData.signature}
            onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            rows={2}
            disabled={isReleased}
          />
        </div>

        {/* Submit Button */}
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

      {/* Rooms - Outside the main form to prevent interference */}
      {objectId ? (
        <RoomForm objectId={objectId} isReleased={isReleased} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Räume</h2>
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">Räume können nach dem Erstellen des Objekts hinzugefügt werden.</p>
            <p className="text-xs sm:text-sm">Speichern Sie zuerst die Objektdaten, um Räume hinzufügen zu können.</p>
          </div>
        </div>
      )}
    </div>
  );
}
