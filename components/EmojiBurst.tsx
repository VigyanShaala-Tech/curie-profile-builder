
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  trigger: boolean;
  emojis: string[];
}

const EmojiBurst: React.FC<Props> = ({ trigger, emojis }) => {
  const [burstId, setBurstId] = useState<number | null>(null);

  useEffect(() => {
    if (trigger && emojis.length > 0) {
      setBurstId(Date.now());
    }
  }, [trigger, emojis]);

  useEffect(() => {
    if (burstId) {
      const timer = setTimeout(() => setBurstId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [burstId]);

  return (
    <AnimatePresence>
      {burstId && (
        <motion.div 
          key="milestone-badge"
          className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          {/* Subtle backdrop dimming */}
          <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px]" />
          
          {/* Main Badge Container */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex flex-col items-center justify-center"
          >
            {/* Expanding glowing rings */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute w-32 h-32 bg-emerald-400/30 rounded-full blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
              className="absolute w-24 h-24 bg-emerald-400/40 rounded-full blur-md"
            />

            {/* Center Circle */}
            <div className="relative w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center border-4 border-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M20 6 9 17l-5-5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                />
              </svg>
              
              {/* Small floating emoji accent */}
              {emojis.length > 0 && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 10 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-xl border-2 border-slate-50"
                >
                  {emojis[0]}
                </motion.div>
              )}
            </div>

            {/* Text */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/50"
            >
              <div className="text-xl font-black text-slate-800 tracking-tight">Section Complete</div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Progress Saved</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmojiBurst;
