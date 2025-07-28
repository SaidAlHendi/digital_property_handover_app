import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { ImageGallery } from "./ImageGallery";

interface ObjectViewProps {
  objectId: string;
  onBack: () => void;
  onEdit: () => void;
}

export function ObjectView({ objectId, onBack, onEdit }: ObjectViewProps) {
  const object = useQuery(api.objects.getObject, { objectId: objectId as Id<"objects"> });
  const releaseObject = useMutation(api.objects.releaseObject);

  const handleRelease = async () => {
    if (confirm("Objekt freigeben? Nach der Freigabe kann es nicht mehr bearbeitet werden.")) {
      try {
        await releaseObject({ objectId: objectId as Id<"objects"> });
        toast.success("Objekt wurde freigegeben");
      } catch (error: any) {
        toast.error("Fehler beim Freigeben: " + error.message);
      }
    }
  };

  if (object === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!object) {
    return <div>Objekt nicht gefunden</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Zurück
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{object.name}</h1>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            object.isReleased
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {object.isReleased ? "Freigegeben" : "Entwurf"}
        </span>
      </div>

      <div className="space-y-6">
        {/* Object Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Objektdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Objektbezeichnung</label>
              <div className="mt-1 text-gray-900">{object.name}</div>
            </div>
            {object.addressSupplement && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Adresszusatz</label>
                <div className="mt-1 text-gray-900">{object.addressSupplement}</div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Straße</label>
              <div className="mt-1 text-gray-900">{object.street}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">PLZ</label>
              <div className="mt-1 text-gray-900">{object.postalCode}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ort</label>
              <div className="mt-1 text-gray-900">{object.city}</div>
            </div>
          </div>
        </div>

        {/* Involved Parties */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Beteiligte Personen</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Partei 1</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span> {object.party1Name}
                </div>
                <div>
                  <span className="font-medium">Funktion:</span> {object.party1Function}
                </div>
                <div>
                  <span className="font-medium">Adresse:</span>
                  <div className="whitespace-pre-line">{object.party1Address}</div>
                </div>
                <div>
                  <span className="font-medium">Telefon:</span> {object.party1Phone}
                </div>
                <div>
                  <span className="font-medium">E-Mail:</span> {object.party1Email}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">Partei 2</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span> {object.party2Name}
                </div>
                <div>
                  <span className="font-medium">Funktion:</span> {object.party2Function}
                </div>
                <div>
                  <span className="font-medium">Adresse:</span>
                  <div className="whitespace-pre-line">{object.party2Address}</div>
                </div>
                <div>
                  <span className="font-medium">Telefon:</span> {object.party2Phone}
                </div>
                <div>
                  <span className="font-medium">E-Mail:</span> {object.party2Email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keys */}
        {object.keys.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Schlüsselübergabe</h2>
            <div className="space-y-2">
              {object.keys.map((key, index) => (
                <div key={index} className="flex justify-between">
                  <span>{key.type}</span>
                  <span>{key.quantity}x</span>
                </div>
              ))}
            </div>
            <ImageGallery 
              title="Bilder - Schlüssel" 
              images={object.images?.keys || []} 
            />
          </div>
        )}

        {/* Counters */}
        {object.counters.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Zählerdaten</h2>
            <div className="space-y-2">
              {object.counters.map((counter, index) => (
                <div key={index} className="flex justify-between">
                  <span>{counter.number}</span>
                  <span>{counter.currentReading}</span>
                </div>
              ))}
            </div>
            <ImageGallery 
              title="Bilder - Zähler" 
              images={object.images?.counters || []} 
            />
          </div>
        )}

        {/* Miscellaneous and Notes */}
        {(object.miscellaneous || object.notes) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Sonstiges & Anmerkungen</h2>
            {object.miscellaneous && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Sonstiges</h3>
                <div className="whitespace-pre-line">{object.miscellaneous}</div>
              </div>
            )}
            {object.notes && (
              <div>
                <h3 className="font-medium mb-2">Anmerkungen</h3>
                <div className="whitespace-pre-line">{object.notes}</div>
              </div>
            )}
            <ImageGallery 
              title="Bilder - Sonstiges" 
              images={object.images?.miscellaneous || []} 
            />
          </div>
        )}

        {/* Signature */}
        {object.signature && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Unterschrift</h2>
            <div className="whitespace-pre-line">{object.signature}</div>
          </div>
        )}

        {/* Rooms */}
        {object.rooms && object.rooms.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Räume</h2>
            <div className="space-y-6">
              {object.rooms.map((room) => (
                <div key={room._id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">{room.name}</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium">Bodenbelag:</span>
                      <div>{room.flooring}</div>
                    </div>
                    <div>
                      <span className="font-medium">Wände:</span>
                      <div>{room.walls}</div>
                    </div>
                    <div>
                      <span className="font-medium">Zustand:</span>
                      <div>{room.condition}</div>
                    </div>
                    <div>
                      <span className="font-medium">Ausstattung:</span>
                      <div>
                        {room.outlets} Steckdosen, {room.lightSwitches} Schalter,{" "}
                        {room.windows} Fenster, {room.radiators} Heizkörper
                      </div>
                    </div>
                  </div>

                  {room.images && room.images.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Bilder</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {room.images.map((image) => (
                          <div key={image._id}>
                            <img
                              src={image.url || ""}
                              alt={image.filename}
                              className="w-full h-32 object-cover rounded border"
                            />
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {image.filename}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Metadaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Erstellt:</span>{" "}
              {new Date(object.createdAt).toLocaleString("de-DE")}
            </div>
            {object.releasedAt && (
              <div>
                <span className="font-medium">Freigegeben:</span>{" "}
                {new Date(object.releasedAt).toLocaleString("de-DE")}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onEdit}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Bearbeiten
          </button>
          {!object.isReleased && (
            <button
              onClick={handleRelease}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Freigeben
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
