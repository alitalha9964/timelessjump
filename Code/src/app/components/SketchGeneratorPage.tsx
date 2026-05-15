import { useState, useRef } from 'react';
import { Pencil, Upload, X, Loader2, Download, AlertCircle, Sparkles, ImageIcon } from 'lucide-react';
import { api, getCurrentUserId } from '@/services/api';

export function SketchGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [resultImageId, setResultImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioOptions = [
    { value: '1:1', label: '1:1', widthClass: 'w-6 h-6' },
    { value: '9:16', label: '9:16', widthClass: 'w-5 h-8' },
    { value: '16:9', label: '16:9', widthClass: 'w-8 h-5' },
  ];

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    setError(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !uploadedImage) return;

    setLoading(true);
    setError(null);
    setResultImageUrl(null);
    setResultImageId(null);

    try {
      // Create a chatroom for this sketch session
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const chatRoom = await api.createChatRoom(userId);
      const chatroomId = chatRoom.chatroom_id;

      const response = await api.generateSketchImage(
        chatroomId,
        prompt,
        uploadedImage,
        aspectRatio
      );

      if (response.image_url) {
        setResultImageUrl(response.image_url);
        setResultImageId(response.image_id || null);
      } else {
        throw new Error('No image URL returned from the server');
      }
    } catch (err: any) {
      console.error('Sketch generation failed:', err);
      setError(err.message || 'Failed to generate sketch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0b0f] h-screen overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <div className="bg-[#212121] border-b border-[#3a3a3a] px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#FCC01E]/20 flex items-center justify-center">
          <Pencil className="w-5 h-5 text-[#FCC01E]" />
        </div>
        <div>
          <h1 className="text-white text-lg font-semibold">Sketch Generator</h1>
          <p className="text-xs text-gray-500">Transform photos into pencil sketches</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        {/* Left Panel - Preview Area */}
        <div className="min-h-[250px] sm:min-h-[300px] lg:min-h-0 flex-1 bg-[#1a1a1a] p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(#888 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {loading ? (
            <div className="text-center space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-full border-4 border-[#3a3a3a] border-t-[#FCC01E] animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-white font-medium text-lg">Creating Your Sketch...</h3>
                <p className="text-gray-400 text-sm">Converting your photo into a pencil drawing</p>
              </div>
            </div>
          ) : resultImageUrl ? (
            <div className="relative max-w-2xl w-full flex items-center justify-center z-10">
              <div className="relative bg-white p-3 rounded shadow-2xl">
                <img
                  src={resultImageUrl}
                  alt="Generated Sketch"
                  className="max-w-full max-h-[40vh] sm:max-h-[50vh] lg:max-h-[70vh] object-contain rounded-sm"
                />
                {/* Download */}
                <div className="absolute top-5 right-5">
                  <a
                    href={resultImageUrl}
                    download={`sketch-${resultImageId || 'image'}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition-colors text-sm border border-white/10"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 max-w-sm relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-[#2a2a2a] flex items-center justify-center mx-auto border border-[#3a3a3a]">
                <Pencil className="w-8 h-8 text-[#4a4a4a]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-medium text-xl">Ready to Sketch</h3>
                <p className="text-gray-400 text-sm">
                  Upload a photo, describe how you'd like it sketched, and let AI create a pencil drawing for you.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 bg-red-500/10 border border-red-500/20 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 max-w-[90%] sm:max-w-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Right Panel - Controls */}
        <div className="w-full lg:w-96 bg-[#212121] border-t lg:border-t-0 lg:border-l border-[#3a3a3a] flex flex-col shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Image Upload */}
            <div className="space-y-3">
              <label className="text-white text-sm font-medium block">Upload Photo</label>

              {uploadedImage ? (
                <div className="relative rounded-lg overflow-hidden border border-[#3a3a3a] bg-[#1a1a1a]">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-48 object-contain bg-[#0a0b0f]"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="px-3 py-2 bg-[#2a2a2a] border-t border-[#3a3a3a]">
                    <p className="text-xs text-gray-400 truncate">{uploadedFileName}</p>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all
                    ${isDragging
                      ? 'border-[#FCC01E] bg-[#FCC01E]/5'
                      : 'border-[#3a3a3a] hover:border-[#4a4a4a] bg-[#1a1a1a] hover:bg-[#1e1e1e]'
                    }
                  `}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] flex items-center justify-center mx-auto border border-[#3a3a3a]">
                      <Upload className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">
                        Drop your image here or <span className="text-[#FCC01E]">browse</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Prompt */}
            <div className="space-y-3">
              <label className="text-white text-sm font-medium block">Prompt</label>
              <textarea
                placeholder="e.g. Convert this photo into a detailed pencil sketch with shading..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-[#2a2a2a] border border-[#4a4a4a] text-white placeholder:text-gray-500 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#FCC01E] focus:ring-1 focus:ring-[#FCC01E] transition-colors"
              />
              <p className="text-xs text-gray-500">
                Describe the sketch style — shading, detail level, artistic feel.
              </p>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <label className="text-white text-sm font-medium block">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {aspectRatioOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAspectRatio(option.value)}
                    className={`
                      flex flex-col items-center justify-center py-3 rounded-lg border-2 transition-all
                      ${aspectRatio === option.value
                        ? 'border-[#FCC01E] bg-[#FCC01E]/10 text-[#FCC01E]'
                        : 'border-[#3a3a3a] bg-[#2a2a2a] text-gray-400 hover:border-[#4a4a4a] hover:bg-[#333]'
                      }
                    `}
                  >
                    <div className={`border-2 border-current rounded-sm mb-1.5 opacity-60 ${option.widthClass}`} />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim() || !uploadedImage}
                className="w-full h-12 bg-[#FCC01E] hover:bg-[#E5B01E] text-black font-bold rounded-lg transition-all shadow-lg shadow-yellow-900/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Sketch...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Sketch
                  </>
                )}
              </button>
            </div>

            {/* Quick Tips */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tips</h4>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-[#FCC01E] mt-0.5">•</span>
                  Use clear, well-lit photos for best results
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FCC01E] mt-0.5">•</span>
                  Mention "pencil sketch" or "charcoal drawing" in your prompt
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FCC01E] mt-0.5">•</span>
                  Add details like "with cross-hatching" or "soft shading"
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}