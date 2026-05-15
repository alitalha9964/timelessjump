import { Home, BookmarkCheck, Image, LogOut, X, Video, MessageSquare, Plus, Loader2, Pencil, Megaphone, Box } from 'lucide-react';
import { api, getCurrentUserId } from '@/services/api';
import { useState, useEffect } from 'react';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface LeftSidebarProps {
  onNavigate: (page: string) => void;
  activePage: string;
  onClose?: () => void;
  chatSessions?: ChatSession[];
  onSessionSelect?: (sessionId: string) => void;
  onNewChatCreated?: (sessionId: string) => void;
}

export function LeftSidebar({ onNavigate, activePage, onClose, chatSessions, onSessionSelect, onNewChatCreated }: LeftSidebarProps) {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [userData, setUserData] = useState<{ userId: string; email: string; username: string } | null>(null);
  
  // Load user data from localStorage
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');
    
    if (userId && email) {
      setUserData({ userId, email, username: username || email.split('@')[0] });
    }
  }, []);
  
  const navItems = [
    { icon: Home, label: 'Home', page: 'home' },
    { icon: BookmarkCheck, label: 'Good Images', page: 'saved' },
  ];

  const toolsItems = [
    { icon: Image, label: 'Image Generator', page: 'imageGenerator' },
    { icon: Pencil, label: 'Sketch Generator', page: 'sketchGenerator' },
    { icon: Megaphone, label: 'Ads Generator', page: 'adsGenerator' },
    { icon: Box, label: 'Render Studio', page: 'renderStudio' },
    { icon: Video, label: 'Video Generator', page: 'videoGenerator' },
  ];

  const bottomItems = [
    { icon: LogOut, label: 'Logout', page: 'logout' },
  ];

  const handleNewChat = async () => {
    if (isCreatingChat) return; // Prevent multiple clicks
    
    try {
      setIsCreatingChat(true);
      const userId = getCurrentUserId();
      if (!userId) return;

      const response = await api.createChatRoom(userId);
      const newSessionId = response.chatroom_id;

      onSessionSelect?.(newSessionId);
      onNavigate('imageGenerator');
      onClose?.();
      onNewChatCreated?.(newSessionId);
    } catch (error) {
      console.error('Failed to create new chat room:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="w-56 xl:w-64 bg-[#212121] border-r border-[#3a3a3a] flex flex-col h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Timeless Jump Logo" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <span className="text-white font-black text-base font-inter tracking-tight">TIMELESS</span>
            <span className="text-[#FCC01E] font-black text-base font-inter tracking-tight ml-1">JUMP</span>
          </div>
        </div>
        
        {/* Close Button for Mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activePage === item.page
                  ? 'bg-[#FCC01E] text-black font-semibold'
                  : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Tools Section */}
        <div className="mt-6 px-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Tools
          </div>
          <nav className="space-y-1">
            {toolsItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activePage === item.page
                    ? 'bg-[#FCC01E] text-black font-semibold'
                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Chat Sessions Section */}
        <div className="mt-6 px-3">
          <div className="flex items-center justify-between mb-2 px-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Chat Sessions
            </div>
            <button 
              onClick={handleNewChat}
              className="text-[#FCC01E] hover:text-[#E5B01E] transition-colors"
              title="New Chat"
            >
              {isCreatingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {chatSessions && chatSessions.length > 0 ? (
              chatSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSessionSelect?.(session.id);
                    onClose?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors group"
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left truncate text-xs">{session.title}</span>
                </button>
              ))
            ) : (
              <div className="text-xs text-gray-500 px-3 py-2">
                No chat sessions yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[#3a3a3a] space-y-1">
        {bottomItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(item.page)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}

        {/* User Profile */}
        <div className="mt-3 pt-3 border-t border-[#3a3a3a]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
            <div className="flex-1">
              <div className="text-sm text-white">{userData?.username}</div>
              <div className="text-xs text-gray-500">{userData?.email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}