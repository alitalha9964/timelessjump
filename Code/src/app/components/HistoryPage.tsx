import { useState, useEffect } from 'react';
import { Clock, Search, Loader2 } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { api, getCurrentUserId } from '@/services/api';

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  imageCount: number;
  thumbnailUrl: string;
  isActive?: boolean;
}

interface HistoryPageProps {
  onSessionSelect: (sessionId: string) => void;
}

export function HistoryPage({ onSessionSelect }: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) return;

      const response = await api.listSessions(userId);
      
      if (response.success && response.sessions) {
        const formattedSessions: ChatSession[] = response.sessions.map((session: any) => ({
          id: session.session_id.toString(),
          title: session.first_prompt || 'Untitled Session',
          timestamp: new Date(session.created_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          imageCount: session.thread_count || 0,
          thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
          isActive: false,
        }));
        
        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#212121] h-screen">
      {/* Header */}
      <div className="bg-[#212121] border-b border-[#3a3a3a] px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-[#FAEF2F]" />
          <h1 className="text-white text-xl font-semibold">History of Prompts</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#2a2a2a] border-[#4a4a4a] text-white pl-10"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-10 h-10 text-[#FAEF2F] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-lg transition-all hover:bg-[#2a2a2a] ${
                  session.isActive
                    ? 'bg-[#2a2a2a] border-2 border-[#FAEF2F]'
                    : 'bg-[#1a1a1a] border-2 border-transparent'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <img
                    src={session.thumbnailUrl}
                    alt={session.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                </div>

                {/* Session Info */}
                <div className="flex-1 text-left">
                  <h3
                    className={`font-medium mb-2 line-clamp-2 ${
                      session.isActive ? 'text-[#FAEF2F]' : 'text-white'
                    }`}
                  >
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.timestamp}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                      {session.imageCount} image{session.imageCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}