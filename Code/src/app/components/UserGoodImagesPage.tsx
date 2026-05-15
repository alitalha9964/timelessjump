import { useState, useEffect } from 'react';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

interface GeneratedImage {
  img_id: string;
  img_url: string;
  resolution: string;
  aspect_ratio: string;
  is_good: boolean;
  created_at: string;
}

interface UserGoodImagesPageProps {
  userId: string;
  userName: string;
  onBack: () => void;
}

export function UserGoodImagesPage({ userId, userName, onBack }: UserGoodImagesPageProps) {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadGoodImages();
  }, [userId]);

  const loadGoodImages = async () => {
    try {
      setLoading(true);
      const response = await api.getUserGoodImages(userId);
      
      if (response.success && response.images) {
        // Filter only images marked as good
        const goodImages = response.images.filter((img: GeneratedImage) => img.is_good);
        setImages(goodImages);
      }
    } catch (error) {
      console.error('Failed to load good images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string, imageId: string) => {
    try {
      setDownloadingId(imageId);
      
      // For S3 URLs, use a different approach to avoid CORS issues
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `good-image-${imageId}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab if direct download fails
      window.open(imageUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex-1 bg-[#1a1a1a] flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-[#212121] border-b border-[#3a3a3a] p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-[#FCC01E] mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin
        </button>
        <h1 className="text-2xl font-bold text-white font-inter">
          {userName}'s Good Images
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Images marked as good by {userName}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#FCC01E] animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading images...</p>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400 text-lg">No good images found</p>
              <p className="text-gray-500 text-sm mt-2">
                {userName} hasn't marked any images as good yet
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <div
                key={image.img_id}
                className="bg-[#212121] rounded-lg overflow-hidden border border-[#3a3a3a] hover:border-[#FCC01E] transition-all group"
              >
                <div className="relative aspect-square bg-[#2a2a2a]">
                  <img
                    src={image.img_url}
                    alt={`Image ${image.img_id}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%232a2a2a" width="400" height="400"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  
                  {/* Download Button Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDownload(image.img_url, image.img_id)}
                      disabled={downloadingId === image.img_id}
                      className="bg-[#FCC01E] hover:bg-[#E5B01E] text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {downloadingId === image.img_id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="bg-[#2a2a2a] px-2 py-1 rounded">
                      {image.aspect_ratio}
                    </span>
                    <span>{image.resolution}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(image.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}