import { motion } from 'motion/react';
import { Image, Video, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<[number, number][]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPage, setTargetPage] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    setIsNavigating(true);
    setTargetPage(page);
    setTimeout(() => {
      onNavigate(page);
    }, 400); // Wait for animation to complete
  };

  useEffect(() => {
    // Initialize nodes
    const initialNodes: Node[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
    }));
    setNodes(initialNodes);

    // Animation loop
    const interval = setInterval(() => {
      setNodes(prevNodes => {
        const updatedNodes = prevNodes.map(node => {
          let newX = node.x + node.vx;
          let newY = node.y + node.vy;
          let newVx = node.vx;
          let newVy = node.vy;

          if (newX < 0 || newX > 100) newVx = -newVx;
          if (newY < 0 || newY > 100) newVy = -newVy;

          return {
            x: Math.max(0, Math.min(100, newX)),
            y: Math.max(0, Math.min(100, newY)),
            vx: newVx,
            vy: newVy,
          };
        });

        // Calculate connections
        const newConnections: [number, number][] = [];
        const maxDistance = 15;

        for (let i = 0; i < updatedNodes.length; i++) {
          for (let j = i + 1; j < updatedNodes.length; j++) {
            const dx = updatedNodes[i].x - updatedNodes[j].x;
            const dy = updatedNodes[i].y - updatedNodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDistance) {
              newConnections.push([i, j]);
            }
          }
        }

        setConnections(newConnections);
        return updatedNodes;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a2e] h-full relative overflow-hidden">
      {/* Animated Network Background - Fixed Position */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#2a2a5e]" />
        
        {/* SVG Network */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Connection Lines */}
          {connections.map(([i, j], idx) => (
            <line
              key={idx}
              x1={`${nodes[i]?.x}%`}
              y1={`${nodes[i]?.y}%`}
              x2={`${nodes[j]?.x}%`}
              y2={`${nodes[j]?.y}%`}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {/* Nodes */}
          {nodes.map((node, idx) => (
            <circle
              key={idx}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r="2"
              fill="#FFFFFF"
              opacity="0.6"
            />
          ))}
        </svg>

        {/* Subtle Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent opacity-60" />
      </div>

      {/* Scrollable Content Wrapper */}
      <div className="relative z-10 w-full h-full overflow-y-auto custom-scrollbar">
        <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12 px-4 pt-10 sm:pt-0"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center shadow-2xl">
              <img src="/logo.png" alt="Timeless Jump Logo" className="w-full h-full rounded-full object-cover" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 font-inter">
              <span className="text-white">TIMELESS</span>
              <span className="text-[#FCC01E] ml-2 sm:ml-3">JUMP</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-poppins px-2">
              Create stunning product visuals with AI-powered generation tools
            </p>
          </motion.div>

          {/* Generator Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl w-full px-4 mb-8">
            {/* Image Generator Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onClick={() => handleNavigate('imageGenerator')}
              className="group relative bg-gradient-to-br from-[#2a2a3a] to-[#1a1a2a] rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-[#3a3a5a] hover:border-[#FCC01E] transition-colors duration-200 cursor-pointer overflow-hidden backdrop-blur-sm"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#FCC01E] to-[#F59E0B] flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-yellow-500/20">
                  <Image className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 font-inter">
                  Image Generator
                </h2>
                <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 font-poppins">
                  Transform text prompts into stunning product images with advanced AI technology
                </p>
                
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#FCC01E]" />
                    <span>Fast Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#FCC01E]" />
                    <span>High Quality</span>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 text-[#FCC01E] font-semibold text-sm sm:text-base">
                  <span>Get Started</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Video Generator Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              onClick={() => handleNavigate('videoGenerator')}
              className="group relative bg-gradient-to-br from-[#2a2a3a] to-[#1a1a2a] rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-[#3a3a5a] hover:border-[#FCC01E] transition-colors duration-200 cursor-pointer overflow-hidden backdrop-blur-sm"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-purple-500/20">
                  <Video className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                  Video Generator
                </h2>
                <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                  Create engaging product videos from text descriptions with cutting-edge AI models
                </p>
                
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#8B5CF6]" />
                    <span>AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#8B5CF6]" />
                    <span>Professional</span>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 text-[#8B5CF6] font-semibold text-sm sm:text-base">
                  <span>Get Started</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-4 pb-8"
          >
            {['Multiple Variations', 'High Resolution', 'Custom Styles', 'Fast Processing'].map((feature, idx) => (
              <div
                key={idx}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#2a2a3a] border border-[#3a3a5a] text-gray-400 text-xs sm:text-sm backdrop-blur-sm"
              >
                {feature}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
