import React from 'react';
import { motion } from 'motion/react';

export const GoldenThreads = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <motion.svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,50 Q25,0 50,50 T100,50"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
};
