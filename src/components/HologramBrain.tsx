import React from 'react';
import { motion } from 'motion/react';
import { cls } from '../utils';

export const HologramBrain = ({ onClick, isThinking }: { onClick: () => void, isThinking: boolean }) => {
  return (
    <motion.div 
      className="relative cursor-pointer flex items-center justify-center"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isThinking ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      <img 
        src="https://storage.googleapis.com/gen-lang-client-0474847336/brain_hologram.png" 
        alt="Executor Brain" 
        className={cls(
          "w-64 h-64 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-500",
          isThinking ? "brightness-150 saturate-150" : "brightness-100"
        )}
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};
