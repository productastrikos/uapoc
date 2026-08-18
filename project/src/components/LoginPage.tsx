import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle, User, Anchor, Lock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, UserRole } from '../store/useAuthStore';

interface LoginPageProps {
  onLogin: () => void;
}

const roleConfigs = {
  admin: {
    title: 'Administrator',
    icon: Shield,
    color: 'cyan',
    username: 'admin',
    password: 'Astrikos2026',
    description: 'Full system access with control center overview',
    gradient: 'from-cyan-600 to-blue-600',
    hoverGradient: 'hover:from-cyan-500 hover:to-blue-500',
    borderColor: 'border-cyan-500/30'
  }
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { login } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<keyof typeof roleConfigs | null>(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: keyof typeof roleConfigs) => {
    setSelectedRole(role);
    setCredentials({
      username: '',
      password: ''
    });
    setError('');
  };

  const handleBack = () => {
    setSelectedRole(null);
    setCredentials({ username: '', password: '' });
    setError('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const success = login(credentials.username, credentials.password);
      setIsLoading(false);
      
      if (success) {
        onLogin();
      } else {
        setError('Invalid credentials. Please check your password.');
      }
    }, 1500);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: 'url("/astrikos_login_page.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      
      <div className="relative z-10 w-full max-w-6xl mx-4">
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            // Role Selection View
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Logo and Title */}
              <div className="text-center mb-12">
                <img 
                  src="/Astrikos Logo Transparent perfect.png" 
                  alt="Astrikos Logo" 
                  className="h-20 w-auto mx-auto mb-6"
                />
                <h1 className="text-4xl font-bold text-white mb-3 font-condensed tracking-wider">
                  Total Airport Management System
                </h1>
                <p className="text-cyan-300 text-lg uppercase tracking-wide">
                 Access System
                </p>
              </div>

              {/* Role Cards */}
              <div className="flex justify-center">
                {Object.entries(roleConfigs).map(([roleKey, config]) => {
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={roleKey}
                      onClick={() => handleRoleSelect(roleKey as keyof typeof roleConfigs)}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative p-8 rounded-2xl border-2 ${config.borderColor}
                        bg-slate-800/80 backdrop-blur-md
                        hover:bg-slate-800/95 transition-all duration-300
                        group cursor-pointer overflow-hidden
                        w-full max-w-sm
                      `}
                    >
                      {/* Gradient Background on Hover */}
                      <div className={`
                        absolute inset-0 bg-gradient-to-br ${config.gradient} 
                        opacity-0 group-hover:opacity-10 transition-opacity duration-300
                      `} />
                      
                      {/* Content */}
                      <div className="relative z-10 text-center space-y-4">
                        <div className={`
                          w-20 h-20 mx-auto rounded-full 
                          bg-gradient-to-br ${config.gradient}
                          flex items-center justify-center
                          group-hover:shadow-lg group-hover:shadow-${config.color}-500/50
                          transition-shadow duration-300
                        `}>
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {config.title}
                        </h3>
                        
                        <p className="text-slate-300 text-sm">
                          {config.description}
                        </p>
                        
                        <div className="flex items-center justify-center gap-2 text-cyan-400 font-medium pt-2">
                          <span>Access Login</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Info Text */}
              <div className="text-center mt-8">
                <p className="text-slate-400 text-sm">
                  Authorized personnel only. All access attempts are logged and monitored.
                </p>
              </div>
            </motion.div>
          ) : (
            // Login Form View
            <motion.div
              key="login-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="hexagon-container">
                <div className="hexagon-border">
                  <div className="hexagon-content">
                    <div className="p-8">
                      {/* Back Button */}
                      <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        <span className="text-sm">Change Role</span>
                      </button>

                      {/* Role Icon and Title */}
                      {selectedRole && (
                        <>
                          <div className={`
                            w-16 h-16 mx-auto mb-4 rounded-full 
                            bg-gradient-to-br ${roleConfigs[selectedRole].gradient}
                            flex items-center justify-center
                          `}>
                            {React.createElement(roleConfigs[selectedRole].icon, {
                              className: 'w-8 h-8 text-white'
                            })}
                          </div>
                          
                          <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2 font-condensed tracking-wider">
                              {roleConfigs[selectedRole].title}
                            </h2>
                            <p className="text-cyan-300 text-sm uppercase tracking-wide">
                              Enter Access Credentials
                            </p>
                          </div>
                        </>
                      )}

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wide">
                            User ID
                          </label>
                          <input
                            type="text"
                            value={credentials.username}
                            onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-800/80 border border-cyan-400/30 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                            placeholder="Enter user ID"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wide">
                            Access Code
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={credentials.password}
                              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                              className="w-full px-4 py-3 pr-12 bg-slate-800/80 border border-cyan-400/30 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                              placeholder="Enter access code"
                              required
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                          >
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <span className="text-red-300 text-sm">{error}</span>
                          </motion.div>
                        )}

                        {selectedRole && (
                          <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                              w-full py-3 bg-gradient-to-r ${roleConfigs[selectedRole].gradient}
                              ${roleConfigs[selectedRole].hoverGradient}
                              text-white font-bold rounded-lg transition-all duration-200 
                              transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed 
                              flex items-center justify-center gap-2
                            `}
                          >
                            {isLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Authenticating...
                              </>
                            ) : (
                              <>
                                {React.createElement(roleConfigs[selectedRole].icon, {
                                  className: 'w-5 h-5'
                                })}
                                Access System
                              </>
                            )}
                          </button>
                        )}
                      </form>


                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}