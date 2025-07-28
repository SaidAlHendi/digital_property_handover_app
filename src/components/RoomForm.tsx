import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface RoomFormProps {
  objectId: string;
  isReleased?: boolean;
}

export function RoomForm({ objectId, isReleased }: RoomFormProps) {
  const object = useQuery(api.objects.getObject, { objectId: objectId as Id<"objects"> });
  const createRoom = useMutation(api.rooms.createRoom);
  const updateRoom = useMutation(api.rooms.updateRoom);
  const deleteRoom = useMutation(api.rooms.deleteRoom);
  const generateUploadUrl = useMutation(api.rooms.generateUploadUrl);
  const addRoomImage = useMutation(api.rooms.addRoomImage);
  const deleteRoomImage = useMutation(api.rooms.deleteRoomImage);

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [roomForm, setRoomForm] = useState({
    name: "",
    flooring: "",
    walls: "",
    outlets: 0,
    lightSwitches: 0,
    windows: 0,
    radiators: 0,
    condition: "",
  });

  const resetForm = () => {
    setRoomForm({
      name: "",
      flooring: "",
      walls: "",
      outlets: 0,
      lightSwitches: 0,
      windows: 0,
      radiators: 0,
      condition: "",
    });
    setShowAddRoom(false);
    setEditingRoom(null);
  };

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRoom) {
        await updateRoom({
          roomId: editingRoom as Id<"rooms">,
          ...roomForm,
        });
        toast.success("Raum wurde aktualisiert");
      } else {
        await createRoom({
          objectId: objectId as Id<"objects">,
          ...roomForm,
        });
        toast.success("Raum wurde erstellt");
      }
      resetForm();
    } catch (error: any) {
      toast.error("Fehler beim Speichern: " + error.message);
    }
  };

  const handleEditRoom = (room: any) => {
    setRoomForm({
      name: room.name,
      flooring: room.flooring,
      walls: room.walls,
      outlets: room.outlets,
      lightSwitches: room.lightSwitches,
      windows: room.windows,
      radiators: room.radiators,
      condition: room.condition,
    });
    setEditingRoom(room._id);
    setShowAddRoom(true);
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (confirm(`Raum "${roomName}" wirklich löschen? Alle Bilder werden ebenfalls gelöscht.`)) {
      try {
        await deleteRoom({ roomId: roomId as Id<"rooms"> });
        toast.success("Raum wurde gelöscht");
      } catch (error: any) {
        toast.error("Fehler beim Löschen: " + error.message);
      }
    }
  };

  const handleImageUpload = async (roomId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImages(prev => ({ ...prev, [roomId]: true }));

    try {
      for (const file of Array.from(files)) {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const { storageId } = await result.json();

        // Save image reference
        await addRoomImage({
          roomId: roomId as Id<"rooms">,
          storageId,
          filename: file.name,
        });
      }
      
      toast.success("Bilder wurden hochgeladen");
    } catch (error: any) {
      toast.error("Fehler beim Hochladen: " + error.message);
    } finally {
      setUploadingImages(prev => ({ ...prev, [roomId]: false }));
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (confirm("Bild wirklich löschen?")) {
      try {
        await deleteRoomImage({ imageId: imageId as Id<"roomImages"> });
        toast.success("Bild wurde gelöscht");
      } catch (error: any) {
        toast.error("Fehler beim Löschen: " + error.message);
      }
    }
  };

  if (!object) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Räume</h2>
        {!isReleased && (
          <button
            onClick={() => setShowAddRoom(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Raum hinzufügen
          </button>
        )}
      </div>

      {/* Add/Edit Room Form */}
      {showAddRoom && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">
            {editingRoom ? "Raum bearbeiten" : "Neuen Raum hinzufügen"}
          </h3>
          <form onSubmit={handleSubmitRoom} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raumname *
                </label>
                <input
                  type="text"
                  required
                  value={roomForm.name}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Wohnzimmer, Küche, Badezimmer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bodenbelag *
                </label>
                <input
                  type="text"
                  required
                  value={roomForm.flooring}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, flooring: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Parkett, Fliesen, Teppich"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wandbeschaffenheit *
                </label>
                <input
                  type="text"
                  required
                  value={roomForm.walls}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, walls: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Tapete, Putz, Fliesen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zustand *
                </label>
                <select
                  required
                  value={roomForm.condition}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Zustand wählen</option>
                  <option value="Sehr gut">Sehr gut</option>
                  <option value="Gut">Gut</option>
                  <option value="Befriedigend">Befriedigend</option>
                  <option value="Ausreichend">Ausreichend</option>
                  <option value="Mangelhaft">Mangelhaft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Steckdosen
                </label>
                <input
                  type="number"
                  min="0"
                  value={roomForm.outlets}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, outlets: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lichtschalter
                </label>
                <input
                  type="number"
                  min="0"
                  value={roomForm.lightSwitches}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, lightSwitches: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fenster
                </label>
                <input
                  type="number"
                  min="0"
                  value={roomForm.windows}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, windows: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heizkörper
                </label>
                <input
                  type="number"
                  min="0"
                  value={roomForm.radiators}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, radiators: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                {editingRoom ? "Aktualisieren" : "Hinzufügen"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms List */}
      <div className="space-y-6">
        {object.rooms?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Noch keine Räume hinzugefügt
          </div>
        ) : (
          object.rooms?.map((room) => (
            <div key={room._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{room.name}</h3>
                {!isReleased && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRoom(room)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room._id, room.name)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Löschen
                    </button>
                  </div>
                )}
              </div>

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

              {/* Images */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Bilder</h4>
                  {!isReleased && (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(room._id, e.target.files)}
                        className="hidden"
                        id={`upload-${room._id}`}
                        disabled={uploadingImages[room._id]}
                      />
                      <label
                        htmlFor={`upload-${room._id}`}
                        className={`cursor-pointer bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors ${
                          uploadingImages[room._id] ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {uploadingImages[room._id] ? "Lade hoch..." : "Bilder hinzufügen"}
                      </label>
                    </div>
                  )}
                </div>

                {room.images && room.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {room.images.map((image) => (
                      <div key={image._id} className="relative group">
                        <img
                          src={image.url || ""}
                          alt={image.filename}
                          className="w-full h-32 object-cover rounded border"
                        />
                        {!isReleased && (
                          <button
                            onClick={() => handleDeleteImage(image._id)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        )}
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {image.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Keine Bilder vorhanden</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
