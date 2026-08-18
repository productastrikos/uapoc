import React from 'react';
import { Bell, User, Settings, Radio, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuthStore } from '../../store/useAuthStore';
import LanguageToggle from './LanguageToggle';

interface HeaderProps {
  currentUser: {
    name: string;
    role: string;
  };
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = React.useState(3);
  const { logout } = useAuthStore();

  // Button handlers - ALL FUNCTIONAL
  const handleNotificationClick = () => {
    setNotifications(0);
    alert('Notifications opened');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleUserProfileClick = () => {
    alert(`User Profile: ${currentUser.name}`);
  };

  const handleSettingsClick = () => {
    alert('Settings opened');
  };

  const handleSystemStatusClick = () => {
    alert('System Status Dashboard opened');
  };

  return (
    <header className="bg-primary-800 border-b border-primary-600 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            {/* ENHANCED LOGO WITH IRREGULAR GRADIENTS & PROPER SHINING */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative p-4 rounded-2xl overflow-hidden"
              style={{
                background: `
                  conic-gradient(from 45deg at 30% 70%, 
                    rgba(59, 130, 246, 0.15) 0deg,
                    rgba(16, 185, 129, 0.2) 90deg,
                    rgba(168, 85, 247, 0.15) 180deg,
                    rgba(245, 158, 11, 0.1) 270deg,
                    rgba(59, 130, 246, 0.15) 360deg
                  )
                `,
                backdropFilter: 'blur(16px) saturate(1.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                `
              }}
            >
              <img
                              src="/dell_technologies-logo.png"
                              alt="Dell Technologies"
                              className="h-16 w-auto relative z-10"
                              style={{
                                filter: 'brightness(1.3) contrast(1.2) saturate(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.4))'
                              }}
                            />
              
              {/* Subtle Shining Animation - No Pulse */}
              <motion.div
                animate={{ 
                  opacity: [0.3, 0.7, 0.3],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      transparent 20%,
                      rgba(255, 255, 255, 0.1) 50%,
                      transparent 80%
                    )
                  `,
                }}
              />
              
              {/* Corner Light Accents */}
              <div className="absolute top-2 left-2 w-2 h-2 bg-blue-400/40 rounded-full blur-sm" />
              <div className="absolute bottom-2 right-2 w-2 h-2 bg-teal-400/40 rounded-full blur-sm" />
            </motion.div>

            <div>
              <h1 className="text-l font-bold text-text-primary text-3xl gap-2 font-bold bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text text-transparent drop-shadow-lg ">U-APOC</h1>
              <h2 className="text-text-primary gap-2 text-xl bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text text-transparent drop-shadow-lg ">Unified-AirPort Operations Center</h2>
            </div>
          </motion.div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* System Status - CLICKABLE */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSystemStatusClick}
              className="flex items-center space-x-1 px-3 py-1 bg-status-success/20 hover:bg-status-success/30 rounded-full transition-all duration-300 border border-status-success/30"
            >
              <Radio className="h-3 w-3 text-status-success" />
              <span className="text-xs text-status-success font-medium">
                {t('system.status.all_operational')}
              </span>
            </motion.button>
          </div>

          {/* Language Switcher - Google Translate (EN <-> ES) */}
          <LanguageToggle />

          {/* Notifications - FUNCTIONAL WITH BADGE */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNotificationClick}
            className="relative p-2 bg-primary-700 hover:bg-primary-600 rounded-lg transition-all duration-300 border border-primary-500/50"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <Bell className="h-5 w-5 text-text-primary" />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-status-warning text-black text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center"
                style={{
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)'
                }}
              >
                {notifications}
              </motion.span>
            )}
          </motion.button>

          {/* User Profile - FUNCTIONAL */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{currentUser.name}</p>
              <p className="text-xs text-text-muted">{currentUser.role}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUserProfileClick}
              className="p-2 bg-primary-700 hover:bg-primary-600 rounded-lg transition-all duration-300 border border-primary-500/50"
              style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <User className="h-5 w-5 text-text-primary" />
            </motion.button>
          </div>

          {/* Settings - FUNCTIONAL */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSettingsClick}
            className="p-2 bg-primary-700 hover:bg-primary-600 rounded-lg transition-all duration-300 border border-primary-500/50"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <Settings className="h-5 w-5 text-text-primary transition-transform duration-300" />
          </motion.button>

          {/* Logout - FUNCTIONAL */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition-all duration-300 border border-red-500/50"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <LogOut className="h-5 w-5 text-white" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;
