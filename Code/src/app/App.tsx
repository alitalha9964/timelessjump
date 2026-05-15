import { useState, useEffect } from 'react';
import { Menu, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeftSidebar } from '@/app/components/LeftSidebar';
import { CenterChatArea } from '@/app/components/CenterChatArea';
import { RightSettingsPanel } from '@/app/components/RightSettingsPanel';
import { AdminRightPanel } from '@/app/components/AdminRightPanel';
import { SavedImagesPage } from '@/app/components/SavedImagesPage';
import { UserGoodImagesPage } from '@/app/components/UserGoodImagesPage';
import { ImageGeneratorPage } from '@/app/components/ImageGeneratorPage';
import { HomePage } from '@/app/components/HomePage';
import { VideoGeneratorPage } from '@/app/components/VideoGeneratorPage';
import { SketchGeneratorPage } from '@/app/components/SketchGeneratorPage';
import { AdsGeneratorPage } from '@/app/components/AdsGeneratorPage';
import { RenderStudioPage } from '@/app/components/RenderStudioPage';
import { LoginPage } from '@/app/components/LoginPage';
import { isAuthenticated, isSuperUser, getCurrentUserId, api } from '@/services/api';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface SelectedUser {
  id: string;
  name: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Mobile settings toggle
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedUserForGoodImages, setSelectedUserForGoodImages] = useState<SelectedUser | null>(null);
  
  // Store settings from RightSettingsPanel/AdminRightPanel
  const [generationSettings, setGenerationSettings] = useState({
    selectedColor: '#FCC01E',
    resolution: '1K',
    aspectRatios: ['1:1'],
    imageFolder: 'Airborne-1 PVC',
    imageFolderPath: 'gemini_images',
    generationMode: 'single' as 'single' | 'multi',
    temperature: 1.0,
    selectedModel: 'nano-banana-pro' as 'nano-banana-pro' | 'flux-klein-9b',
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      const isSuperUserStatus = isSuperUser();
      
      setIsLoggedIn(authenticated);
      setIsAdmin(isSuperUserStatus);
      
      if (authenticated) {
        await loadChatSessions();
      }
    };
    
    checkAuth();
  }, []);

  const loadChatSessions = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const response = await api.listSessions(userId);
      if (response.success && response.sessions) {
        const sessions = response.sessions.map((session: any) => ({
          id: session.session_id,
          title: session.first_prompt || 'New Chat',
          created_at: session.created_at,
        }));
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      if (error instanceof Error && error.message.includes('401')) {
        api.logout();
        setIsLoggedIn(false);
        setIsAdmin(false);
        setCurrentPage('home');
      }
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsAdmin(isSuperUser());
    setCurrentPage('home');
    loadChatSessions();
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentPage('home');
    setChatSessions([]);
    setIsSidebarOpen(false);
    setIsSettingsOpen(false);
    setSelectedUserForGoodImages(null);
  };

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentPage('imageGenerator');
  };

  const handleNewChatCreated = async (sessionId: string) => {
    await loadChatSessions();
    setActiveSessionId(sessionId);
  };

  // Admin-specific handlers
  const handleUserSessionSelect = (userId: string, sessionId: string) => {
    // Load the selected user's session in the chat area
    setActiveSessionId(sessionId);
    setCurrentPage('imageGenerator');
    setIsSettingsOpen(false); // Close settings panel on mobile if open
  };

  const handleUserGoodImagesSelect = (userId: string, userName: string) => {
    setSelectedUserForGoodImages({ id: userId, name: userName });
    setCurrentPage('userGoodImages');
    setIsSettingsOpen(false); // Close settings panel on mobile if open
  };

  const handleBackFromUserGoodImages = () => {
    setSelectedUserForGoodImages(null);
    setCurrentPage('imageGenerator');
  };

  const renderMainContent = () => {
    const content = (() => {
      switch (currentPage) {
        case 'home':
          return <HomePage onNavigate={(page) => setCurrentPage(page)} />;
          
        case 'imageGenerator':
          return (
            <>
              <CenterChatArea 
                sessionId={activeSessionId}
                settings={generationSettings}
              />
              {isAdmin ? (
                <AdminRightPanel 
                  onSettingsChange={setGenerationSettings}
                  onUserSessionSelect={handleUserSessionSelect}
                  onUserGoodImagesSelect={(userId) => {
                    handleUserGoodImagesSelect(userId, 'User');
                  }}
                  isOpen={isSettingsOpen}
                  onClose={() => setIsSettingsOpen(false)}
                />
              ) : (
                <RightSettingsPanel 
                  onSettingsChange={setGenerationSettings}
                  isOpen={isSettingsOpen}
                  onClose={() => setIsSettingsOpen(false)}
                />
              )}
            </>
          );
          
        case 'videoGenerator':
          return <VideoGeneratorPage />;
          
        case 'sketchGenerator':
          return <SketchGeneratorPage />;
          
        case 'adsGenerator':
          return <AdsGeneratorPage />;
          
        case 'renderStudio':
          return <RenderStudioPage />;
          
        case 'saved':
          return <SavedImagesPage />;
          
        case 'userGoodImages':
          return selectedUserForGoodImages ? (
            <UserGoodImagesPage 
              userId={selectedUserForGoodImages.id}
              userName={selectedUserForGoodImages.name}
              onBack={handleBackFromUserGoodImages}
            />
          ) : (
            <HomePage onNavigate={(page) => setCurrentPage(page)} />
          );
          
        default:
          return <HomePage onNavigate={(page) => setCurrentPage(page)} />;
      }
    })();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1 flex w-full h-full"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  };

  const shouldShowSidebar = isLoggedIn && currentPage !== 'home' && currentPage !== 'userGoodImages';
  const shouldShowSettingsToggle = isLoggedIn && currentPage === 'imageGenerator';

  return (
    <div className="flex h-screen bg-[#212121] overflow-hidden">
      {!isLoggedIn ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* Mobile Overlays */}
          {isSidebarOpen && shouldShowSidebar && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {isSettingsOpen && shouldShowSettingsToggle && (
             <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSettingsOpen(false)}
            />
          )}
          
          {shouldShowSidebar && (
            <div className={`
              fixed lg:relative inset-y-0 left-0 z-50
              transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <LeftSidebar 
                onNavigate={(page) => {
                  if (page === 'logout') {
                    handleLogout();
                  } else {
                    setCurrentPage(page);
                    setIsSidebarOpen(false);
                  }
                }} 
                activePage={currentPage}
                onClose={() => setIsSidebarOpen(false)}
                chatSessions={chatSessions}
                onSessionSelect={handleSessionSelect}
                onNewChatCreated={handleNewChatCreated}
              />
            </div>
          )}
          
          <div className="flex-1 flex overflow-hidden relative">
            {renderMainContent()}
            
            {/* Left Sidebar Toggle */}
            {shouldShowSidebar && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`
                  fixed top-4 left-4 z-30 
                  bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white 
                  p-2.5 rounded-lg shadow-lg border border-[#4a4a4a]
                  transition-all duration-300 lg:hidden
                `}
                title="Toggle Sidebar"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Right Settings Toggle - Mobile Only */}
            {shouldShowSettingsToggle && (
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`
                  fixed top-4 right-4 z-30 
                  bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white 
                  p-2.5 rounded-lg shadow-lg border border-[#4a4a4a]
                  transition-all duration-300 lg:hidden
                `}
                title="Toggle Settings"
              >
                {isSettingsOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <SlidersHorizontal className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}