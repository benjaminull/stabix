'use client';

import { motion } from 'framer-motion';

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const nodes: Node[] = [
  { id: 1, x: 10, y: 20, size: 60, delay: 0 },
  { id: 2, x: 85, y: 15, size: 40, delay: 0.2 },
  { id: 3, x: 20, y: 70, size: 50, delay: 0.4 },
  { id: 4, x: 75, y: 65, size: 45, delay: 0.6 },
  { id: 5, x: 50, y: 40, size: 35, delay: 0.8 },
  { id: 6, x: 30, y: 45, size: 38, delay: 1.0 },
  { id: 7, x: 65, y: 30, size: 42, delay: 1.2 },
];

export function FloatingNodes() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full border border-orange-400/30 backdrop-blur-sm"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size,
            height: node.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + node.id,
            repeat: Infinity,
            delay: node.delay,
            ease: 'easeInOut',
          }}
        >
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-400/20"
            style={{
              boxShadow: '0 0 20px rgba(255, 140, 66, 0.3)',
            }}
          />
        </motion.div>
      ))}

      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full">
        <motion.line
          x1="10%"
          y1="20%"
          x2="85%"
          y2="15%"
          stroke="rgba(255, 140, 66, 0.2)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2, delay: 1 }}
        />
        <motion.line
          x1="85%"
          y1="15%"
          x2="75%"
          y2="65%"
          stroke="rgba(255, 209, 102, 0.2)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
        <motion.line
          x1="20%"
          y1="70%"
          x2="75%"
          y2="65%"
          stroke="rgba(255, 140, 66, 0.2)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2, delay: 2 }}
        />
      </svg>
    </div>
  );
}
