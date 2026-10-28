import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

interface LoginPageProps {
  onLogin: () => void;
}

const roleConfigs = {
  admin: {
    title: 'Administrator',
    icon: Shield,
    username: 'admin',
    password: 'Astrikos2026',
    description: 'Full system access with control center overview',
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
    <div className="grain-overlay min-h-screen bg-primary-900 bg-gradient-mesh flex flex-col items-center justify-center relative overflow-hidden px-4 py-10">
      {/* Partner marks — Astrikos (wordmark), Intel, Dell, in that order */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-6">
        <img src="/astrikos-wordmark.png" alt="Astrikos" className="h-7 w-auto opacity-90" />
        <img src="/intel-logo.png" alt="Intel" className="h-8 w-auto opacity-90" />
        <img src="/dell-logo.png" alt="Dell" className="h-9 w-auto opacity-90" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* The Astrikos mark, centered and large — the one visual anchor of the page. */}
        <div className="flex flex-col items-center mb-8">
          <img src="/astrikos-icon.png" alt="Astrikos" className="h-24 w-auto mb-4" />
          <h1 className="text-lg font-semibold text-text-primary tracking-wide">U-APOC v1</h1>
          <p className="text-xs uppercase tracking-widest text-text-muted mt-1">Unified-AirPort Operations Center</p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {Object.entries(roleConfigs).map(([roleKey, config]) => {
                const Icon = config.icon;
                return (
                  <motion.button
                    key={roleKey}
                    onClick={() => handleRoleSelect(roleKey as keyof typeof roleConfigs)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-panel w-full rounded-2xl p-6 text-center transition-colors hover:border-accent-blue/50"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent-blue" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">{config.title}</h3>
                    <p className="text-text-secondary text-xs mt-1">{config.description}</p>
                    <div className="flex items-center justify-center gap-1 text-accent-blue text-sm font-medium mt-3">
                      <span>Sign in</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </motion.button>
                );
              })}

              <p className="text-center text-text-muted text-xs mt-6">
                Authorized personnel only. All access attempts are logged and monitored.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="glass-panel-strong rounded-2xl p-6"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-accent-blue hover:text-accent-glow transition-colors mb-4 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Change role
              </button>

              {selectedRole && (
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center">
                    {React.createElement(roleConfigs[selectedRole].icon, { className: 'w-6 h-6 text-accent-blue' })}
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">{roleConfigs[selectedRole].title}</h2>
                  <p className="text-text-muted text-xs uppercase tracking-wide mt-1">Enter access credentials</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wide">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-primary-800/80 border border-primary-500/30 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all"
                    placeholder="Enter user ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wide">
                    Access Code
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3.5 py-2.5 pr-11 bg-primary-800/80 border border-primary-500/30 rounded-lg text-text-primary placeholder-text-muted focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all"
                      placeholder="Enter access code"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-status-error/15 border border-status-error/30 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-status-error flex-shrink-0" />
                    <span className="text-status-error text-sm">{error}</span>
                  </motion.div>
                )}

                {selectedRole && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full justify-center py-2.5"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        {React.createElement(roleConfigs[selectedRole].icon, { className: 'w-4 h-4' })}
                        Access System
                      </>
                    )}
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
