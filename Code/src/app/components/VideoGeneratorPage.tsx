import { useState } from 'react';
import { Video, Loader2, Play, Download, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';

const FOLDER_OPTIONS: { [key: string]: string } = {
  "Airborne-1 PVC": "/home/ubuntu/ai_backend/gemini_images/Copy of Copy of FINALE WHITE GRAND -2.jpg",
  "Airborne-1 Beaded": "/home/ubuntu/ai_backend/02 - Airborne-1 Beaded/Copy of BEADED - COLOR-01.jpg",
  "Airborne 2": "/home/ubuntu/ai_backend/Airborne-2/1ST-RENDER-2ND-ROPE-BLUE.webp",
  "Hercules 1": "/home/ubuntu/ai_backend/Hercule/1st-Blue.webp",
  "Plasma": "/home/ubuntu/ai_backend/Speed_Rope/BLACK_.jpg",
  "PVC & Beaded": "/home/ubuntu/ai_backend/PVC & Beaded/Copy of Yellow-and-white.jpg"
};
export function VideoGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('Airborne-1 PVC');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const response = await api.generateVideo(
        prompt,
        FOLDER_OPTIONS[selectedFolder],
        aspectRatio
      );

      if (response.video_url) {
        setVideoUrl(response.video_url);
      } else {
        throw new Error('No video URL returned from the server');
      }
    } catch (err: any) {
      console.error('Video generation failed:', err);
      let errorMessage = err.message || 'Failed to generate video. Please try again.';
      
      // Improve error message for network/timeout errors
      if (errorMessage === 'Failed to fetch' || errorMessage.includes('Network error') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Connection lost. The video generation is taking longer than the server allows. Please check your server timeout settings.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0b0f] h-screen overflow-y-auto lg:overflow-hidden">
      {/* Header */}
      <div className="bg-[#212121] border-b border-[#3a3a3a] px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#FCC01E]/20 flex items-center justify-center">
          <Video className="w-5 h-5 text-[#FCC01E]" />
        </div>
        <h1 className="text-white text-lg font-semibold">Video Generator</h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        {/* Left Panel - Preview Area */}
        <div className="min-h-[250px] sm:min-h-[300px] lg:min-h-0 flex-1 bg-[#1a1a1a] p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-10" 
               style={{ 
                 backgroundImage: 'radial-gradient(#4a4a4a 1px, transparent 1px)', 
                 backgroundSize: '24px 24px' 
               }} 
          />

          {loading ? (
            <div className="text-center space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-full border-4 border-[#3a3a3a] border-t-[#FCC01E] animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-white font-medium text-lg">Generating Video...</h3>
                <p className="text-gray-400 text-sm">This may take a few minutes</p>
              </div>
            </div>
          ) : videoUrl ? (
            <div className="relative w-full max-w-4xl h-full flex items-center justify-center z-10">
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-[#3a3a3a]">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                />
              </div>
              
              {/* Download Button Overlay */}
              <div className="absolute top-4 right-4 z-20">
                 <a 
                   href={videoUrl} 
                   download 
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                 >
                   <Download className="w-4 h-4" />
                   <span className="text-sm font-medium">Download</span>
                 </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 max-w-md relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-[#2a2a2a] flex items-center justify-center mx-auto border border-[#3a3a3a]">
                <Play className="w-8 h-8 text-[#4a4a4a]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-medium text-xl">Ready to Generate</h3>
                <p className="text-gray-400">
                  Configure your settings on the right and click generate to create stunning product videos.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 bg-red-500/10 border border-red-500/20 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 max-w-[90%] sm:max-w-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Right Panel - Settings */}
        <div className="w-full lg:w-96 bg-[#212121] border-t lg:border-t-0 lg:border-l border-[#3a3a3a] flex flex-col shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Prompt Input */}
            <div className="space-y-3">
              <Label className="text-white text-sm font-medium">Prompt</Label>
              <Textarea
                placeholder="Describe the camera movement, lighting, and action..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-[#2a2a2a] border-[#4a4a4a] text-white placeholder:text-gray-500 min-h-[120px] resize-none focus:border-[#FCC01E] focus:ring-[#FCC01E]"
              />
              <p className="text-xs text-gray-500">
                Be specific about camera angles (e.g., "slow zoom in", "pan right") and lighting.
              </p>
            </div>

            {/* Product Selection */}
            <div className="space-y-3">
              <Label className="text-white text-sm font-medium">Select Product</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="bg-[#2a2a2a] border-[#4a4a4a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-[#4a4a4a]">
                  {Object.keys(FOLDER_OPTIONS).map((folderName) => (
                    <SelectItem key={folderName} value={folderName} className="text-white focus:bg-[#FCC01E]/20 focus:text-white">
                      {folderName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <Label className="text-white text-sm font-medium">Aspect Ratio</Label>
              <RadioGroup value={aspectRatio} onValueChange={setAspectRatio} className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-2">
                  <RadioGroupItem value="16:9" id="16-9" className="peer sr-only" />
                  <Label
                    htmlFor="16-9"
                    className="flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-[#4a4a4a] bg-[#2a2a2a] peer-data-[state=checked]:border-[#FCC01E] peer-data-[state=checked]:text-[#FCC01E] hover:bg-[#3a3a3a] cursor-pointer transition-all"
                  >
                    <div className="w-8 h-5 border-2 border-current rounded-sm mb-1 opacity-50" />
                    <span className="text-xs">16:9</span>
                  </Label>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <RadioGroupItem value="9:16" id="9-16" className="peer sr-only" />
                  <Label
                    htmlFor="9-16"
                    className="flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-[#4a4a4a] bg-[#2a2a2a] peer-data-[state=checked]:border-[#FCC01E] peer-data-[state=checked]:text-[#FCC01E] hover:bg-[#3a3a3a] cursor-pointer transition-all"
                  >
                    <div className="w-5 h-8 border-2 border-current rounded-sm mb-1 opacity-50" />
                    <span className="text-xs">9:16</span>
                  </Label>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <RadioGroupItem value="1:1" id="1-1" className="peer sr-only" />
                  <Label
                    htmlFor="1-1"
                    className="flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-[#4a4a4a] bg-[#2a2a2a] peer-data-[state=checked]:border-[#FCC01E] peer-data-[state=checked]:text-[#FCC01E] hover:bg-[#3a3a3a] cursor-pointer transition-all"
                  >
                    <div className="w-6 h-6 border-2 border-current rounded-sm mb-1 opacity-50" />
                    <span className="text-xs">1:1</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full h-12 bg-[#FCC01E] hover:bg-[#E5B01E] text-black font-bold text-lg rounded-lg transition-all shadow-lg shadow-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}