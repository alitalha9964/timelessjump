import { useState, useEffect } from 'react';
import { Users, ChevronRight, MessageSquare, ThumbsUp, ChevronLeft, X, Cpu, Zap, BarChart3 } from 'lucide-react';
import { api } from '@/services/api';

interface User {
  id: string;
  user_name: string;
  email: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface AdminRightPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSettingsChange?: (settings: any) => void;
  onUserSessionSelect?: (userId: string, sessionId: string) => void;
  onUserGoodImagesSelect?: (userId: string, userName: string) => void;
}

type ViewMode = 'settings' | 'users' | 'userDetails' | 'userSessions';

const FOLDER_OPTIONS: { [key: string]: string } = {
  "Airborne-1 PVC": "gemini_images",
  "Airborne-1 Beaded": "02 - Airborne-1 Beaded",
  "Airborne 2": "Airborne-2",
  "Hercules 1": "Hercule",
  "Plasma": "Speed_Rope",
  "Jump Mat" : "jump_mat",
};

export function AdminRightPanel({ isOpen, onClose, onSettingsChange, onUserSessionSelect, onUserGoodImagesSelect }: AdminRightPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('settings');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSessions, setUserSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Generation Settings State
  const [selectedColor, setSelectedColor] = useState('#FCC01E');
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

  const brandColors = [
    { name: 'Thunderbolt Yellow', hex: '#FCC01E' },
    { name: 'Fever Red', hex: '#C8102E' },
    { name: 'Neon Green', hex: '#39FF14' },
    { name: 'Orange Blaze', hex: '#FF6600' },
    { name: 'Candy Pink', hex: '#FF63E9' },
    { name: 'Sky Blue', hex: '#0000FF' },
    { name: 'Purple Queen', hex: '#7851A9' },
    { name: 'Snow White', hex: '#FFFAFA' },
  ];

  // Load users when switching to users view
  useEffect(() => {
    if (viewMode === 'users') {
      loadUsers();
    }
  }, [viewMode]);

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

  // Notify parent of settings changes
  useEffect(() => {
    onSettingsChange?.({
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
    });
  }, [selectedColor, resolution, aspectRatios, imageFolder, generationMode, temperature, selectedModel, productionType, selectedProducts, onSettingsChange]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getAllUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSessions = async (userId: string) => {
    try {
      setLoading(true);
      const response = await api.getUserSessions(userId);
      setUserSessions(response.sessions || []);
    } catch (error) {
      console.error('Failed to load user sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setViewMode('userDetails');
  };

  const handleViewUserChats = () => {
    if (selectedUser) {
      loadUserSessions(selectedUser.id);
      setViewMode('userSessions');
    }
  };

  const handleViewUserGoodImages = () => {
    if (selectedUser) {
      onUserGoodImagesSelect?.(selectedUser.id, selectedUser.user_name);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    if (selectedUser) {
      onUserSessionSelect?.(selectedUser.id, sessionId);
    }
  };

  const handleBack = () => {
    if (viewMode === 'userSessions') {
      setViewMode('userDetails');
    } else if (viewMode === 'userDetails') {
      setViewMode('users');
      setSelectedUser(null);
    }
  };

  const handleModelChange = (model: 'nano-banana-pro' | 'flux-klein-9b') => {
    setSelectedModel(model);
    if (model === 'flux-klein-9b' && productionType === 'bundle') {
      setProductionType('single-product');
      setSelectedProducts([]);
    }
  };

  const handleProductionTypeChange = (type: 'single-product' | 'bundle') => {
    setProductionType(type);
    if (type === 'single-product') {
      setSelectedProducts([]);
    }
  };

  const handleProductToggle = (folderPath: string) => {
    const newSelected = selectedProducts.includes(folderPath)
      ? selectedProducts.filter(p => p !== folderPath)
      : [...selectedProducts, folderPath];
    setSelectedProducts(newSelected);
  };

  const toggleAspectRatio = (ratio: string) => {
    if (aspectRatios.includes(ratio)) {
      if (aspectRatios.length > 1) {
        setAspectRatios(aspectRatios.filter(r => r !== ratio));
      }
    } else {
      setAspectRatios([...aspectRatios, ratio]);
    }
  };

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
        <h2 className="text-white font-semibold text-base xl:text-lg">Admin Panel</h2>
        <button 
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#3a3a3a] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#3a3a3a] shrink-0">
        <button
          onClick={() => setViewMode('settings')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            viewMode === 'settings'
              ? 'text-[#FCC01E] border-b-2 border-[#FCC01E]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setViewMode('users')}
          className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            viewMode === 'users' || viewMode === 'userDetails' || viewMode === 'userSessions'
              ? 'text-[#FCC01E] border-b-2 border-[#FCC01E]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Users
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Settings View */}
        {viewMode === 'settings' && (
          <div className="p-4 xl:p-6 space-y-4 xl:space-y-6">
            {/* Model Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">AI Model</label>
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
              {usageLoading ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="animate-spin w-4 h-4 border-2 border-[#FCC01E] border-t-transparent rounded-full" />
                  <span className="text-xs text-gray-500">Loading usage...</span>
                </div>
              ) : modelUsage !== null ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <BarChart3 className="w-4 h-4 text-[#FCC01E]" />
                  <span className="text-xs text-gray-400">
                    Images generated: <span className="text-[#FCC01E] font-medium">{modelUsage.toLocaleString()}</span>
                  </span>
                </div>
              ) : null}
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">Color Selection</label>
              <p className="text-xs text-gray-500">Pick a color for your product</p>
              <div className="grid grid-cols-4 gap-2">
                {brandColors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setSelectedColor(color.hex)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${
                      selectedColor === color.hex
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-[#4a4a4a] hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-10 h-10 rounded border-2 border-[#4a4a4a] bg-[#2a2a2a] cursor-pointer"
                />
                <div className="flex-1 bg-[#2a2a2a] border border-[#4a4a4a] rounded px-2 py-2 text-white text-xs">
                  {selectedColor}
                </div>
              </div>
            </div>

            {/* Resolution - Only for Nano Banana Pro */}
            {selectedModel === 'nano-banana-pro' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
            )}

            {/* Temperature / Creativity - Only for Nano Banana Pro */}
            {selectedModel === 'nano-banana-pro' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-white">Model Creativity</label>
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
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#FCC01E]"
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

            {/* Aspect Ratios */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Aspect Ratios</label>
              <p className="text-xs text-gray-500">Select one or more aspect ratios</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aspectRatios.includes('1:1')}
                    onChange={() => toggleAspectRatio('1:1')}
                    className="w-4 h-4 rounded bg-[#2a2a2a] border-gray-500 text-[#FCC01E] focus:ring-[#FCC01E]"
                  />
                  <span className="text-sm text-gray-300">Square (1:1)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aspectRatios.includes('9:16')}
                    onChange={() => toggleAspectRatio('9:16')}
                    className="w-4 h-4 rounded bg-[#2a2a2a] border-gray-500 text-[#FCC01E] focus:ring-[#FCC01E]"
                  />
                  <span className="text-sm text-gray-300">Vertical (9:16)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aspectRatios.includes('16:9')}
                    onChange={() => toggleAspectRatio('16:9')}
                    className="w-4 h-4 rounded bg-[#2a2a2a] border-gray-500 text-[#FCC01E] focus:ring-[#FCC01E]"
                  />
                  <span className="text-sm text-gray-300">Horizontal (16:9)</span>
                </label>
              </div>
            </div>

            {/* Select Product */}
            {productionType === 'single-product' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Select Product</label>
              <select
                value={imageFolder}
                onChange={(e) => setImageFolder(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg px-3 py-2 text-white text-sm"
              >
                {Object.keys(FOLDER_OPTIONS).map((folderName) => (
                  <option key={folderName} value={folderName}>{folderName}</option>
                ))}
              </select>
              <div className="bg-[#1e3a5c] text-blue-300 text-xs p-2 rounded">
                Loading images from: {FOLDER_OPTIONS[imageFolder]}
              </div>
            </div>
            )}

            {/* Production Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Production Type</label>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={productionType === 'single-product'}
                    onChange={() => handleProductionTypeChange('single-product')}
                    className="mt-0.5 w-4 h-4 text-[#FCC01E] focus:ring-[#FCC01E] border-gray-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-300">Single Product</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Generate images for a single product
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={productionType === 'bundle'}
                    onChange={() => handleProductionTypeChange('bundle')}
                    className="mt-0.5 w-4 h-4 text-[#FCC01E] focus:ring-[#FCC01E] border-gray-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-300">Product Bundle</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Generate images for multiple products
                    </div>
                  </div>
                </label>
              </div>
              
              {productionType === 'bundle' && (
                <div className="mt-2 text-xs text-[#FCC01E] bg-[#FCC01E]/10 p-2 rounded">
                  Product bundle mode selected. Select products below.
                </div>
              )}
            </div>

            {/* Select Products */}
            {productionType === 'bundle' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Select Products</label>
                <div className="space-y-2">
                  {Object.keys(FOLDER_OPTIONS).map((folderName) => (
                    <label key={folderName} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(FOLDER_OPTIONS[folderName])}
                        onChange={() => handleProductToggle(FOLDER_OPTIONS[folderName])}
                        className="w-4 h-4 rounded bg-[#2a2a2a] border-gray-500 text-[#FCC01E] focus:ring-[#FCC01E]"
                      />
                      <span className="text-sm text-gray-300">{folderName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Generation Mode */}
            {productionType === 'single-product' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Generation Mode</label>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={generationMode === 'single'}
                    onChange={() => setGenerationMode('single')}
                    className="mt-0.5 w-4 h-4 text-[#FCC01E] focus:ring-[#FCC01E] border-gray-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-300">Single Image Mode</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Same image in selected aspect ratios (1-3 images)
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={generationMode === 'multi'}
                    onChange={() => setGenerationMode('multi')}
                    className="mt-0.5 w-4 h-4 text-[#FCC01E] focus:ring-[#FCC01E] border-gray-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-300">Multiple Images</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      3 different images distributed across aspect ratios
                    </div>
                  </div>
                </label>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Users List View */}
        {viewMode === 'users' && (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-white mb-4">All Users</h2>
            {loading ? (
              <div className="text-gray-400 text-center py-8">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No users found</div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.user_name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{user.user_name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#FCC01E] transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Details View */}
        {viewMode === 'userDetails' && selectedUser && (
          <div className="p-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-[#FCC01E] mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Users
            </button>

            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {selectedUser.user_name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedUser.user_name}</h3>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-300 mb-3">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleViewUserChats}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-[#FCC01E]" />
                  <span className="text-sm text-white">View Chat Sessions</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#FCC01E] transition-colors" />
              </button>

              <button
                onClick={handleViewUserGoodImages}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <ThumbsUp className="w-5 h-5 text-[#FCC01E]" />
                  <span className="text-sm text-white">View Good Images</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#FCC01E] transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* User Sessions View */}
        {viewMode === 'userSessions' && selectedUser && (
          <div className="p-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-[#FCC01E] mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to {selectedUser.user_name}
            </button>

            <h2 className="text-xl font-semibold text-white mb-4">Chat Sessions</h2>
            {loading ? (
              <div className="text-gray-400 text-center py-8">Loading sessions...</div>
            ) : userSessions.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No sessions found</div>
            ) : (
              <div className="space-y-2">
                {userSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-[#FCC01E]" />
                      <div className="text-left">
                        <div className="text-sm text-white truncate">{session.title}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#FCC01E] transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}