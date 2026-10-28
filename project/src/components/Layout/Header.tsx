import React from 'react';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

interface HeaderProps {
  currentUser: {
    name: string;
    role: string;
  };
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="fs-chrome relative px-4 py-2.5 bg-[#050a14] border-b border-accent-blue/20 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <img src="/astrikos-icon.png" alt="Astrikos" className="h-10 w-auto" />

          <div>
            <h1 className="font-bold text-lg leading-tight text-text-primary">U-APOC v1</h1>
            <h2 className="text-xs leading-tight text-text-muted">Unified-AirPort Operations Center</h2>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Partner marks — Astrikos (wordmark), Intel, Dell, in that order */}
          <div className="hidden sm:flex items-center gap-5 pr-4 border-r border-accent-blue/15">
            <img src="/astrikos-wordmark.png" alt="Astrikos" className="h-6 w-auto opacity-90" />
            <img src="/intel-logo.png" alt="Intel" className="h-7 w-auto opacity-90" />
            <img src="/dell-logo.png" alt="Dell" className="h-8 w-auto opacity-90" />
          </div>

          {/* Logout - FUNCTIONAL */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            title={`${currentUser.name} — ${currentUser.role}`}
            className="p-1.5 bg-status-neutral/80 hover:bg-status-neutral rounded-lg transition-colors duration-200 border border-status-neutral/50"
          >
            <LogOut className="h-4 w-4 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Slot for the active module's sub-navigation.
          Consoles portal their tab bar in here and straddle the header's lower
          edge, which recovers a whole row of vertical space in the content area
          — on a console screen that row is worth more than the chrome. */}
      <div
        id="console-tabs"
        className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-40 flex justify-center"
      />
    </header>
  );
};

export default Header;
