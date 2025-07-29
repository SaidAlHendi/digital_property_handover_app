interface ImageGalleryProps {
  title: string;
  images: Array<{
    _id: string;
    filename: string;
    url: string | null;
  }>;
}

export function ImageGallery({ title, images }: ImageGalleryProps) {
  console.log(title)
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="font-medium mb-3">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image._id} className="relative">
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
  );
}
