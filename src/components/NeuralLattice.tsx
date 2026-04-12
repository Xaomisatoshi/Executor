import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const connections = [
  { id: 1, x1: 50, y1: 50, x2: 200, y2: 150, stroke: "#3b82f6", data: "Flow: Stable (98%)" },
  { id: 2, x1: 200, y1: 150, x2: 350, y2: 50, stroke: "#3b82f6", data: "Flow: Stable (95%)" },
  { id: 3, x1: 200, y1: 150, x2: 200, y2: 250, stroke: "#f59e0b", data: "Flow: Anomalous (Drift: 12%)" },
];

export const NeuralLattice = () => {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  return (
    <div className="relative w-full h-full bg-midnight-bg border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      
      <svg className="w-full h-full" viewBox="0 0 400 300">
        {connections.map((conn) => (
          <motion.line
            key={conn.id}
            x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
            stroke={hoveredLine === conn.id ? "#ffffff" : conn.stroke}
            strokeWidth={hoveredLine === conn.id ? "3" : "1"}
            className="cursor-pointer transition-all duration-300"
            onMouseEnter={() => setHoveredLine(conn.id)}
            onMouseLeave={() => setHoveredLine(null)}
            onClick={() => setSelectedLine(conn.id)}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
        ))}

        {[
          { cx: 50, cy: 50, color: "text-blue-500" },
          { cx: 200, cy: 150, color: "text-blue-500" },
          { cx: 350, cy: 50, color: "text-rose-400" },
          { cx: 200, cy: 250, color: "text-amber-500" },
        ].map((node, i) => (
          <motion.circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r="6"
            className={`fill-current ${node.color}`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ))}
      </svg>
      
      {hoveredLine && (
        <div className="absolute top-4 right-4 bg-black/80 p-2 border border-blue-500/50 rounded text-blue-400 font-mono text-xs">
          {connections.find(c => c.id === hoveredLine)?.data}
        </div>
      )}

      <AnimatePresence>
        {selectedLine && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-4 bg-zinc-900 border border-zinc-700 rounded-lg p-6 z-20 shadow-2xl"
          >
            <h2 className="text-white font-mono font-bold mb-4">Audit Rail: Connection {selectedLine}</h2>
            <p className="text-zinc-400 font-mono text-sm">Detailed decision logic for this data flow...</p>
            <button 
              onClick={() => setSelectedLine(null)}
              className="mt-6 bg-blue-600 text-white px-4 py-2 rounded font-mono text-xs hover:bg-blue-500"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute top-4 left-4 font-mono text-xs text-zinc-500 uppercase tracking-widest">
        Kernel_View: Neural_Lattice_Active
      </div>
    </div>
  );
};
