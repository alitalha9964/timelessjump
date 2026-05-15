import { useState, useEffect } from 'react';
import { X, Cpu, Zap, BarChart3, Package, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { api } from '@/services/api';

interface RightSettingsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSettingsChange?: (settings: {
    selectedColor: string;
    resolution: string;
    aspectRatios: string[];
    imageFolder: string;
    imageFolderPath: string;
    generationMode: 'single' | 'multi';
    temperature: number;
    selectedModel: 'nano-banana-pro' | 'flux-klein-9b';
    productionType: 'single-product' | 'bundle';
    selectedProducts: string[];
  }) => void;
}

const FOLDER_OPTIONS: { [key: string]: string } = {
  "Airborne-1 PVC": "gemini_images",
  "Airborne-1 Beaded": "02 - Airborne-1 Beaded",
  "Airborne 2": "Airborne-2",
  "Hercules 1": "Hercule",
  "Plasma": "Speed_Rope",
  "Jump Mat" : "jump_mat",
};

export function RightSettingsPanel({ isOpen, onClose, onSettingsChange }: RightSettingsPanelProps) {
  const [selectedColor, setSelectedColor] = useState('#FCC01E'); // Thunderbolt Yellow
  const [resolution, setResolution] = useState('1K');
  const [aspectRatios, setAspectRatios] = useState<string[]>(['1:1']);
  const [imageFolder, setImageFolder] = useState('Airborne-1 PVC');
  const [generationMode, setGenerationMode] = useState<'single' | 'multi'>('single');
  const [temperature, setTemperature] = useState(1.0);
  const [selectedModel, setSelectedModel] = useState<'nano-banana-pro' | 'flux-klein-9b'>('nano-banana-pro');
  const [modelUsage, setModelUsage] = useState<number | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [productionType, setProductionType] = useState<'single-product' | 'bundle'>('single-product');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Model name mapping for the backend API
  const MODEL_NAME_MAP: Record<string, string> = {
    'nano-banana-pro': 'Gemini-3-pro-image-preview',
    'flux-klein-9b': 'flux-klein-distilled',
  };

  // Fetch model usage whenever selectedModel changes
  useEffect(() => {
    const fetchUsage = async () => {
      setUsageLoading(true);
      try {
        const backendModelName = MODEL_NAME_MAP[selectedModel];
        const response = await api.getModelUsage(backendModelName);
        setModelUsage(response.usage ?? 0);
      } catch (error) {
        console.error('Failed to fetch model usage:', error);
        setModelUsage(null);
      } finally {
        setUsageLoading(false);
      }
    };
    fetchUsage();
  }, [selectedModel]);

  // Notify parent component whenever settings change
  const notifySettingsChange = (updates: any) => {
    const newSettings = {
      selectedColor,
      resolution,
      aspectRatios,
      imageFolder,
      imageFolderPath: FOLDER_OPTIONS[imageFolder],
      generationMode,
      temperature,
      selectedModel,
      productionType,
      selectedProducts,
      ...updates,
    };

    onSettingsChange?.(newSettings);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    notifySettingsChange({ selectedColor: color });
  };

  const handleResolutionChange = (res: string) => {
    setResolution(res);
    notifySettingsChange({ resolution: res });
  };

  const handleAspectRatioToggle = (ratio: string) => {
    const newAspectRatios = aspectRatios.includes(ratio)
      ? aspectRatios.filter((r) => r !== ratio)
      : [...aspectRatios, ratio];
    
    // Ensure at least one aspect ratio is selected
    if (newAspectRatios.length === 0) return;
    
    setAspectRatios(newAspectRatios);
    notifySettingsChange({ aspectRatios: newAspectRatios });
  };

  const handleFolderChange = (folder: string) => {
    setImageFolder(folder);
    notifySettingsChange({ 
      imageFolder: folder,
      imageFolderPath: FOLDER_OPTIONS[folder]
    });
  };

  const handleGenerationModeChange = (mode: 'single' | 'multi') => {
    setGenerationMode(mode);
    notifySettingsChange({ generationMode: mode });
  };

  const handleTemperatureChange = (temp: number) => {
    setTemperature(temp);
    notifySettingsChange({ temperature: temp });
  };

  const handleModelChange = (model: 'nano-banana-pro' | 'flux-klein-9b') => {
    setSelectedModel(model);
    // If switching to Flux Klein, reset to single-product mode (no bundle for Flux Klein)
    if (model === 'flux-klein-9b' && productionType === 'bundle') {
      setProductionType('single-product');
      setSelectedProducts([]);
      notifySettingsChange({ 
        selectedModel: model, 
        productionType: 'single-product',
        selectedProducts: [],
      });
    } else {
      notifySettingsChange({ selectedModel: model });
    }
  };

  const handleProductionTypeChange = (type: 'single-product' | 'bundle') => {
    setProductionType(type);
    if (type === 'single-product') {
      setSelectedProducts([]);
      notifySettingsChange({ productionType: type, selectedProducts: [] });
    } else {
      notifySettingsChange({ productionType: type });
    }
  };

  const handleProductToggle = (folderPath: string) => {
    const newSelected = selectedProducts.includes(folderPath)
      ? selectedProducts.filter(p => p !== folderPath)
      : [...selectedProducts, folderPath];
    setSelectedProducts(newSelected);
    notifySettingsChange({ selectedProducts: newSelected });
  };

  // TIMELESS JUMP Brand Colors
  const colorSwatches = [
    '#FCC01E', // Thunderbolt Yellow
    '#C8102E', // Fever Red
    '#39FF14', // Neon Green
    '#FF6600', // Orange Blaze
    '#FF63E9', // Candy Pink
    '#0000FF', // Sky Blue
    '#7851A9', // Purple Queen
    '#FFFAFA', // Snow White
  ];

  return (
    <div className={`
      fixed inset-y-0 right-0 z-50 w-80 bg-[#212121] border-l border-[#3a3a3a] 
      h-full flex flex-col shrink-0
      transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
      ${isOpen ? 'translate-x-0' : 'translate-x-full'} 
      lg:relative lg:translate-x-0 lg:inset-auto
    `}>
      {/* Fixed Header */}
      <div className="p-4 xl:p-6 border-b border-[#3a3a3a] flex items-center justify-between shrink-0 bg-[#212121]">
        <h2 className="text-white font-semibold text-base xl:text-lg">Generation Settings</h2>
        <button 
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#3a3a3a] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 xl:p-6 space-y-4 xl:space-y-6 pb-20 lg:pb-6 custom-scrollbar">
        {/* Model Selection - Top Position */}
        <div className="space-y-3">
          <Label className="text-white text-sm">AI Model</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleModelChange('nano-banana-pro')}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedModel === 'nano-banana-pro'
                  ? 'border-[#FCC01E] bg-[#FCC01E]/10 shadow-[0_0_12px_rgba(252,192,30,0.15)]'
                  : 'border-[#3a3a3a] bg-[#2a2a2a] hover:border-[#4a4a4a] hover:bg-[#333]'
              }`}
            >
              {selectedModel === 'nano-banana-pro' && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FCC01E]" />
              )}
              <Cpu className={`w-5 h-5 ${selectedModel === 'nano-banana-pro' ? 'text-[#FCC01E]' : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${selectedModel === 'nano-banana-pro' ? 'text-[#FCC01E]' : 'text-gray-300'}`}>
                Nano Banana Pro
              </span>
            </button>
            <button
              onClick={() => handleModelChange('flux-klein-9b')}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedModel === 'flux-klein-9b'
                  ? 'border-[#FCC01E] bg-[#FCC01E]/10 shadow-[0_0_12px_rgba(252,192,30,0.15)]'
                  : 'border-[#3a3a3a] bg-[#2a2a2a] hover:border-[#4a4a4a] hover:bg-[#333]'
              }`}
            >
              {selectedModel === 'flux-klein-9b' && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FCC01E]" />
              )}
              <Zap className={`w-5 h-5 ${selectedModel === 'flux-klein-9b' ? 'text-[#FCC01E]' : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${selectedModel === 'flux-klein-9b' ? 'text-[#FCC01E]' : 'text-gray-300'}`}>
                Flux Klein 9B
              </span>
            </button>
          </div>
          {/* Model info badge */}
          <div className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
            selectedModel === 'nano-banana-pro' 
              ? 'bg-blue-500/10 text-blue-300' 
              : 'bg-purple-500/10 text-purple-300'
          }`}>
            {selectedModel === 'nano-banana-pro' ? (
              <>
                <Cpu className="w-3 h-3" />
                Full control: resolution, creativity, batch mode
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                Fast generation with color & aspect ratio control
              </>
            )}
          </div>
          {/* Model usage */}
          <div className="mt-1">
            {usageLoading ? (
              <div className="flex items-center gap-1.5">
                <div className="animate-spin w-4 h-4 border-2 border-[#FCC01E] border-t-transparent rounded-full" />
                <span className="text-xs text-gray-500">Loading usage...</span>
              </div>
            ) : modelUsage !== null ? (
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#FCC01E]" />
                <span className="text-xs text-gray-400">
                  Images generated: <span className="text-[#FCC01E] font-medium">{modelUsage.toLocaleString()}</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Color Selection with Swatches */}
        <div className="space-y-3">
          <Label className="text-white text-sm">🎨 Color Selection</Label>
          <p className="text-xs text-gray-500">Pick a color for your product</p>
          
          {/* Color Swatches */}
          <div className="grid grid-cols-4 gap-2">
            {colorSwatches.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-full aspect-square rounded-lg border-2 ${
                  selectedColor === color
                    ? 'border-white'
                    : 'border-[#4a4a4a] hover:border-gray-500'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 xl:w-12 xl:h-12 rounded border-2 border-[#4a4a4a] bg-[#2a2a2a] cursor-pointer"
            />
            <div className="flex-1 bg-[#2a2a2a] border border-[#4a4a4a] rounded px-2 py-2 text-white text-xs xl:text-sm overflow-hidden">
              {selectedColor}
            </div>
          </div>
        </div>

        {/* Resolution - Only for Nano Banana Pro */}
        {selectedModel === 'nano-banana-pro' && (
        <div className="space-y-2">
          <Label className="text-white text-sm">Resolution</Label>
          <Select value={resolution} onValueChange={handleResolutionChange}>
            <SelectTrigger className="bg-[#2a2a2a] border-[#4a4a4a] text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-[#4a4a4a]">
              <SelectItem value="1K" className="text-white">1K</SelectItem>
              <SelectItem value="2K" className="text-white">2K</SelectItem>
              <SelectItem value="4K" className="text-white">4K</SelectItem>
            </SelectContent>
          </Select>
        </div>
        )}

        {/* Temperature / Creativity Slider - Only for Nano Banana Pro */}
        {selectedModel === 'nano-banana-pro' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white text-sm">Model Creativity</Label>
            <span className="text-xs text-[#FCC01E] font-medium bg-[#FCC01E]/10 px-2 py-0.5 rounded">
              {temperature}
            </span>
          </div>
          <div className="pt-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#FCC01E] hover:accent-[#E5B01E]"
              style={{
                backgroundImage: `linear-gradient(to right, #FCC01E 0%, #FCC01E ${temperature * 100}%, #2a2a2a ${temperature * 100}%, #2a2a2a 100%)`
              }}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Precise (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>
        </div>
        )}

        {/* Aspect Ratio - Multiple Selection */}
        <div className="space-y-2">
          <Label className="text-white text-sm">Aspect Ratios</Label>
          <p className="text-xs text-gray-500">Select one or more aspect ratios</p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="square" 
                checked={aspectRatios.includes('1:1')}
                onCheckedChange={() => handleAspectRatioToggle('1:1')}
                className="border-gray-500 data-[state=checked]:bg-[#FCC01E] data-[state=checked]:text-black"
              />
              <Label htmlFor="square" className="text-gray-300 cursor-pointer text-sm">
                Square (1:1)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="vertical" 
                checked={aspectRatios.includes('9:16')}
                onCheckedChange={() => handleAspectRatioToggle('9:16')}
                className="border-gray-500 data-[state=checked]:bg-[#FCC01E] data-[state=checked]:text-black"
              />
              <Label htmlFor="vertical" className="text-gray-300 cursor-pointer text-sm">
                Vertical (9:16)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="horizontal" 
                checked={aspectRatios.includes('16:9')}
                onCheckedChange={() => handleAspectRatioToggle('16:9')}
                className="border-gray-500 data-[state=checked]:bg-[#FCC01E] data-[state=checked]:text-black"
              />
              <Label htmlFor="horizontal" className="text-gray-300 cursor-pointer text-sm">
                Horizontal (16:9)
              </Label>
            </div>
          </div>
        </div>

        {/* Select Image Folder */}
        {productionType === 'single-product' && (
        <div className="space-y-2">
          <Label className="text-white text-sm">Select Product</Label>
          <Select value={imageFolder} onValueChange={handleFolderChange}>
            <SelectTrigger className="bg-[#2a2a2a] border-[#4a4a4a] text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-[#4a4a4a]">
              {Object.keys(FOLDER_OPTIONS).map((folderName) => (
                <SelectItem key={folderName} value={folderName} className="text-white">
                  {folderName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="bg-[#1e3a5c] text-blue-300 text-xs p-2 rounded">
            Loading images from: {FOLDER_OPTIONS[imageFolder]}
          </div>
        </div>
        )}

        {/* Production Type */}
        <div className="space-y-2">
          <Label className="text-white text-sm">Production Type</Label>
          <RadioGroup value={productionType} onValueChange={handleProductionTypeChange}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single-product" id="single-product" className="border-gray-500 text-[#FCC01E]" />
                <Label htmlFor="single-product" className="text-gray-300 cursor-pointer text-sm">
                  Single Product
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Generate images for a single product
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bundle" id="bundle" className="border-gray-500 text-[#FCC01E]" />
                <Label htmlFor="bundle" className="text-gray-300 cursor-pointer text-sm">
                  Bundle
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Generate images for multiple products
              </p>
            </div>
          </RadioGroup>
          
          {/* Info box explaining current selection */}
          <div className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-3 mt-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[#FCC01E]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FCC01E] text-xs">ℹ</span>
              </div>
              <div className="text-xs text-gray-400">
                {productionType === 'single-product' ? (
                  <>
                    <span className="text-white font-medium">Single Product Mode:</span>
                    <br />
                    Generates images for a single product.
                  </>
                ) : (
                  <>
                    <span className="text-white font-medium">Bundle Mode:</span>
                    <br />
                    Generates images for multiple products.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Products */}
        {productionType === 'bundle' && (
        <div className="space-y-2">
          <Label className="text-white text-sm">Selected Products</Label>
          <p className="text-xs text-gray-500">Select products to include in the bundle</p>
          <div className="space-y-2">
            {Object.keys(FOLDER_OPTIONS).map((folderName) => (
              <div key={folderName} className="flex items-center space-x-2">
                <Checkbox 
                  id={folderName} 
                  checked={selectedProducts.includes(FOLDER_OPTIONS[folderName])}
                  onCheckedChange={() => handleProductToggle(FOLDER_OPTIONS[folderName])}
                  className="border-gray-500 data-[state=checked]:bg-[#FCC01E] data-[state=checked]:text-black"
                />
                <Label htmlFor={folderName} className="text-gray-300 cursor-pointer text-sm">
                  {folderName}
                </Label>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Generation Mode - Only for single-product mode */}
        {productionType === 'single-product' && (
        <div className="space-y-2">
          <Label className="text-white text-sm">Generation Mode</Label>
          <RadioGroup value={generationMode} onValueChange={handleGenerationModeChange}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" className="border-gray-500 text-[#FCC01E]" />
                <Label htmlFor="single" className="text-gray-300 cursor-pointer text-sm">
                  Single Image
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Same image in selected aspect ratios (1-3 images)
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multi" id="multi" className="border-gray-500 text-[#FCC01E]" />
                <Label htmlFor="multi" className="text-gray-300 cursor-pointer text-sm">
                  Multiple Images
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                3 different images distributed across aspect ratios
              </p>
            </div>
          </RadioGroup>
          
          {/* Info box explaining current selection */}
          <div className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-3 mt-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[#FCC01E]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FCC01E] text-xs">ℹ</span>
              </div>
              <div className="text-xs text-gray-400">
                {generationMode === 'single' ? (
                  <>
                    <span className="text-white font-medium">Single Image Mode:</span>
                    <br />
                    Generates {aspectRatios.length} {aspectRatios.length === 1 ? 'image' : 'images'} 
                    {' '}(same content, {aspectRatios.length === 1 ? 'one' : 'different'} aspect ratio{aspectRatios.length > 1 ? 's' : ''})
                  </>
                ) : (
                  <>
                    <span className="text-white font-medium">Multiple Images Mode:</span>
                    <br />
                    Generates 3 different images distributed across {aspectRatios.length} selected aspect ratio{aspectRatios.length > 1 ? 's' : ''}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}