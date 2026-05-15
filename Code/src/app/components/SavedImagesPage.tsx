import { BookmarkCheck, Download, Trash2, Search, Grid3x3, LayoutGrid, Loader2, Sparkles, ThumbsUp } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface SavedImage {
  id: number;
  img_url: string;
  prompt: string;
  created_at: string;
  resolution: string;
  aspect_ratio: string;
  thread_id: number;
  chatroom_id: number;
}

export function SavedImagesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  useEffect(() => {
    loadSavedImages();
  }, []);

  const loadSavedImages = async () => {
    try {
      setLoading(true);
      const response = await api.getSavedImages();
      if (response.success && response.images) {
        setSavedImages(response.images);
      }
    } catch (error) {
      console.error('Failed to load saved images:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = savedImages.filter(image =>
    image.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDownload = async (imageUrl: string, imageId: number) => {
    try {
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
      console.error('Failed to download image:', error);
      // Fallback: open in new tab if direct download fails
      window.open(imageUrl, '_blank');
    }
  };

  const handleDelete = async (imageId: number) => {
    try {
      // Call API to set is_good = false
      await api.updateImageStatus(String(imageId), false);
      
      // Immediately remove from UI
      setSavedImages(prevImages => prevImages.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#212121] h-screen">
      {/* Header */}
      <div className="bg-[#212121] border-b border-[#3a3a3a] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FAEF2F]/20 rounded-lg flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-[#FAEF2F]" />
            </div>
            <div>
              <h1 className="text-white text-xl font-semibold">Good Images</h1>
              <p className="text-gray-500 text-sm">
                {loading ? 'Loading...' : `${filteredImages.length} image${filteredImages.length !== 1 ? 's' : ''} you liked`}
              </p>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg p-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-[#FAEF2F] text-black' : 'text-gray-400 hover:text-white hover:bg-[#4a4a4a]'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setViewMode('masonry')}
              className={`h-8 w-8 ${viewMode === 'masonry' ? 'bg-[#FAEF2F] text-black' : 'text-gray-400 hover:text-white hover:bg-[#4a4a4a]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#2a2a2a] border-[#4a4a4a] text-white pl-10 h-10 focus:ring-[#FAEF2F] focus:border-[#FAEF2F]"
          />
        </div>
      </div>

      {/* Images Grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#FAEF2F] animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading your good images...</p>
            </div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">
                {searchQuery ? 'No images found' : 'No good images yet'}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchQuery 
                  ? 'Try searching with different keywords' 
                  : 'Thumbs up images in your conversations to see them here'}
              </p>
            </div>
          </div>
        ) : (
          <div 
            className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}
          >
            {filteredImages.map((image, index) => (
              <div
                key={image.id}
                className="bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#4a4a4a] hover:border-[#FAEF2F] transition-all group animate-fade-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'backwards'
                }}
                onMouseEnter={() => setHoveredImage(image.id)}
                onMouseLeave={() => setHoveredImage(null)}
              >
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-[#212121]">
                  <img 
                    src={image.img_url} 
                    alt={image.prompt} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Hover Overlay with Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
                    hoveredImage === image.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm h-8 w-8 transition-all hover:scale-110"
                        onClick={() => handleDownload(image.img_url, image.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 backdrop-blur-sm h-8 w-8 transition-all hover:scale-110"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Prompt overlay - visible on hover */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm font-medium mb-2 max-h-32 overflow-y-auto">
                        {image.prompt}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-[#FAEF2F]/20 text-[#FAEF2F] px-2 py-1 rounded-full">
                          {image.aspect_ratio}
                        </span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                          {image.resolution}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sparkle Icon - Always Visible */}
                  <div className="absolute top-3 left-3">
                    <div className="bg-[#FAEF2F] rounded-full p-1.5">
                      <Sparkles className="w-3 h-3 text-black" />
                    </div>
                  </div>
                </div>
                
                {/* Info Section - Always Visible */}
                <div className="p-3">
                  <div className="relative group/prompt">
                    <p className="text-white text-sm mb-2 line-clamp-2 font-medium cursor-pointer">
                      {image.prompt}
                    </p>
                    {/* Tooltip on hover showing full prompt */}
                    <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-[#1a1a1a] border border-[#4a4a4a] rounded-lg opacity-0 invisible group-hover/prompt:opacity-100 group-hover/prompt:visible transition-all duration-200 z-50 max-h-48 overflow-y-auto shadow-xl">
                      <p className="text-white text-sm whitespace-pre-wrap break-words">
                        {image.prompt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(image.created_at)}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">Saved</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}