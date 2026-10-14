import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoButtonProps {
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const InfoButton: React.FC<InfoButtonProps> = ({ 
  title, 
  description, 
  position = 'top' 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTooltipPosition = () => {
    switch (position) {
      case 'bottom':
        return 'top-8 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'right-8 top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-8 top-1/2 transform -translate-y-1/2';
      default:
        return 'bottom-8 left-1/2 transform -translate-x-1/2';
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-1 rounded-full bg-accent-teal/20 hover:bg-accent-teal/30 text-accent-teal transition-colors"
      >
        <Info className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`absolute z-50 ${getTooltipPosition()}`}
          >
            <div className="bg-primary-700 border border-primary-500 rounded-lg shadow-lg p-4 max-w-xs">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-text-secondary">{description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfoButton;