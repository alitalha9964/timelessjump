import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { api } from '@/services/api';
import { Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await api.login(username, password);
        onLoginSuccess();
      } else {
        // Register
        await api.register(username, email, password);
        setError('Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#212121] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Thunderbolt Yellow glow circles */}
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#FCC01E]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#FCC01E]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-[#FCC01E]/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="text-white space-y-6 text-center lg:text-left px-4">
          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <img src="/logo.png" alt="Timeless Jump Logo" className="w-14 h-14 rounded-full object-cover" />
            <div>
              <div className="text-3xl">
                <span className="text-white font-black font-inter tracking-tight">TIMELESS</span>
                <span className="text-[#FCC01E] font-black font-inter tracking-tight ml-2">JUMP</span>
              </div>
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold leading-tight font-inter">
            Elevate Your Product<br />Photography Game
          </h1>

          <p className="text-gray-400 text-lg max-w-md mx-auto lg:mx-0 font-poppins">
            Create stunning product images with AI-powered generation. 
            TIMELESS JUMP brings professional-grade image creation to your fingertips. 
            Perfect for e-commerce, marketing, and brand storytelling.
          </p>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-[#2a2a2a] rounded-2xl p-8 shadow-2xl border border-[#3a3a3a]">
            <h2 className="text-white text-2xl font-semibold text-center mb-2">
              {isLogin ? 'WELCOME BACK EXCLUSIVE MEMBER' : 'CREATE NEW ACCOUNT'}
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              {isLogin ? 'Login to continue' : 'Register to get started'}
            </p>

            {error && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                error.includes('successful') 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/50'
              }`}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                {/* Username/Email Field */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-[#212121] border-[#4a4a4a] text-white pl-12 py-6 rounded-lg focus:ring-2 focus:ring-[#FCC01E] focus:border-[#FCC01E] placeholder:text-gray-500"
                    placeholder={isLogin ? "Username" : "Choose a username"}
                    required
                  />
                </div>

                {/* Email Field (Register Only) */}
                {!isLogin && (
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#212121] border-[#4a4a4a] text-white pl-12 py-6 rounded-lg focus:ring-2 focus:ring-[#FCC01E] focus:border-[#FCC01E] placeholder:text-gray-500"
                      placeholder="Your email address"
                      required
                    />
                  </div>
                )}

                {/* Password Field */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#212121] border-[#4a4a4a] text-white pl-12 py-6 rounded-lg focus:ring-2 focus:ring-[#FCC01E] focus:border-[#FCC01E] placeholder:text-gray-500"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#FCC01E] hover:bg-[#E5B01E] text-black font-semibold py-6 rounded-lg flex items-center justify-center gap-2 transition-all font-inter"
                disabled={loading}
              >
                {loading ? 'Loading...' : (isLogin ? 'Proceed to my Account' : 'Create Account')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-gray-400 hover:text-[#FCC01E] text-sm underline transition-colors font-poppins"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}