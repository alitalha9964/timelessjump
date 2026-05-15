import { useState } from 'react';
import { Send, Download, Bookmark, RefreshCw, Search, Bell, MoreVertical, Sparkles, Copy, Trash2, ThumbsUp, ThumbsDown, Edit, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';

interface GeneratedImage {
  id: number;
  url: string;
  prompt: string;
  date: string;
  aspectRatio: string;
  variations: number;
  liked?: boolean;
  disliked?: boolean;
}

export function ImageGeneratorPage() {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage>({
    id: 1,
    url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    prompt: 'Company, Foreground shows a confident male industrial business executive (formal dark suit with subtle industrial styling), stepping forward confidently on stacked steel-toned metallic platforms inspired by steel pipes, symbolizing progressive financial and operational growth.',
    date: '15 January 2026',
    aspectRatio: '16:9',
    variations: 3,
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('square');
  const [variations, setVariations] = useState(3);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [images, setImages] = useState<GeneratedImage[]>([
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
      prompt: 'Business executive on metallic platforms with financial growth charts',
      date: '15 January 2026',
      aspectRatio: '16:9',
      variations: 3,
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      prompt: 'Digital analytics dashboard with data visualization',
      date: '15 January 2026',
      aspectRatio: '16:9',
      variations: 3,
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      prompt: 'Modern business analytics and growth metrics',
      date: '15 January 2026',
      aspectRatio: '16:9',
      variations: 3,
    },
  ]);

  const handleLike = () => {
    setImages(images.map(img => 
      img.id === selectedImage.id 
        ? { ...img, liked: !img.liked, disliked: false }
        : img
    ));
    setSelectedImage({ ...selectedImage, liked: !selectedImage.liked, disliked: false });
  };

  const handleDislike = () => {
    setImages(images.map(img => 
      img.id === selectedImage.id 
        ? { ...img, disliked: !img.disliked, liked: false }
        : img
    ));
    setSelectedImage({ ...selectedImage, disliked: !selectedImage.disliked, liked: false });
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditPrompt(selectedImage.prompt);
  };

  const handleEditSave = () => {
    const updatedImage = { ...selectedImage, prompt: editPrompt };
    setSelectedImage(updatedImage);
    setImages(images.map(img => img.id === selectedImage.id ? updatedImage : img));
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditPrompt('');
  };

  const handleGenerate = () => {
    if (!inputPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate image generation
    setTimeout(() => {
      const newImage: GeneratedImage = {
        id: images.length + 1,
        url: `https://images.unsplash.com/photo-${Date.now() % 2 === 0 ? '1460925895917-afdab827c52f' : '1551288049-bebda4e38f71'}?w=800&h=600&fit=crop`,
        prompt: inputPrompt,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        aspectRatio: aspectRatio,
        variations: variations,
      };
      
      setImages([newImage, ...images]);
      setSelectedImage(newImage);
      setImageKey(prev => prev + 1);
      setIsGenerating(false);
      setInputPrompt('');
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#212121] h-screen">
      {/* Header */}
      <div className="bg-[#212121] border-b border-[#3a3a3a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-xl font-semibold">Product Image Generator</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
            <Search className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
            <MoreVertical className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center - Main Image Display */}
        <div className="flex-1 flex flex-col">
          {/* Image Display */}
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[#0a0b0f]">
            {isGenerating ? (
              <div className="relative max-w-5xl w-full">
                <div className="w-full aspect-video bg-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-[#FAEF2F] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-white text-lg font-semibold">Generating your image...</p>
                    <p className="text-gray-400 text-sm">This may take a few moments</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                key={imageKey}
                className="relative group max-w-5xl w-full animate-fadeIn"
              >
                <img
                  src={selectedImage.url}
                  alt="Generated"
                  className="w-full rounded-lg shadow-2xl"
                />
              
                {/* Image Hover Actions */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button size="icon" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  <Button size="icon" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button size="icon" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              
                {/* Bottom Feedback Buttons - Always Visible */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      onClick={handleLike}
                      className={`backdrop-blur-sm ${
                        selectedImage.liked 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-black/50 hover:bg-black/70 text-white'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon"
                      onClick={handleDislike}
                      className={`backdrop-blur-sm ${
                        selectedImage.disliked 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-black/50 hover:bg-black/70 text-white'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleEditClick}
                    className="bg-[#FAEF2F] hover:bg-[#E5D629] text-black font-semibold backdrop-blur-sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Image
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Input Area */}
          <div className="bg-[#212121] border-t border-[#3a3a3a] p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Prompt Input */}
              <div className="relative">
                <Textarea
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Describe your image in detail..."
                  className="bg-[#2a2a2a] border-[#4a4a4a] text-white min-h-[60px] resize-none pr-12"
                  disabled={isGenerating}
                />
                <Button
                  size="icon"
                  className="absolute right-2 bottom-2 bg-[#FAEF2F] hover:bg-[#E5D629] text-black font-semibold"
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>

              {/* Generation Controls */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Auto Style Dropdown */}
                <Button
                  variant="outline"
                  className="bg-[#2a2a2a] border-[#4a4a4a] text-white hover:bg-[#4a4a4a]"
                  disabled={isGenerating}
                >
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 mr-2" />
                  Auto style
                </Button>

                {/* Aspect Ratio Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAspectRatio('square')}
                    disabled={isGenerating}
                    className={`${
                      aspectRatio === 'square'
                        ? 'bg-[#FAEF2F] border-[#FAEF2F] text-black font-semibold'
                        : 'bg-[#2a2a2a] border-[#4a4a4a] text-gray-400'
                    } hover:bg-[#FAEF2F] hover:text-black hover:font-semibold`}
                  >
                    Square
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAspectRatio('portrait')}
                    disabled={isGenerating}
                    className={`${
                      aspectRatio === 'portrait'
                        ? 'bg-[#FAEF2F] border-[#FAEF2F] text-black font-semibold'
                        : 'bg-[#2a2a2a] border-[#4a4a4a] text-gray-400'
                    } hover:bg-[#FAEF2F] hover:text-black hover:font-semibold`}
                  >
                    Portrait
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAspectRatio('landscape')}
                    disabled={isGenerating}
                    className={`${
                      aspectRatio === 'landscape'
                        ? 'bg-[#FAEF2F] border-[#FAEF2F] text-black font-semibold'
                        : 'bg-[#2a2a2a] border-[#4a4a4a] text-gray-400'
                    } hover:bg-[#FAEF2F] hover:text-black hover:font-semibold`}
                  >
                    Landscape
                  </Button>
                </div>

                {/* Variations */}
                <Button
                  variant="outline"
                  className="bg-[#2a2a2a] border-[#4a4a4a] text-white hover:bg-[#4a4a4a]"
                  disabled={isGenerating}
                >
                  {variations} variations
                </Button>

                <div className="flex-1" />

                {/* Generate Button */}
                <Button 
                  className="bg-[#FAEF2F] hover:bg-[#E5D629] text-black font-semibold px-8" 
                  onClick={handleGenerate}
                  disabled={isGenerating || !inputPrompt.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
