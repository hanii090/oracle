'use client';

import { motion } from 'motion/react';

interface BreakthroughVisualProps {
  imageUrl: string | null;
  isActive: boolean;
}

export function BreakthroughVisual({ imageUrl, isActive }: BreakthroughVisualProps) {
  if (!imageUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 0.3 : 0 }}
      transition={{ duration: 2 }}
      className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center"
      style={{ backgroundImage: `url(${imageUrl})` }}
      role="img"
      aria-label="Abstract visual representing your breakthrough moment"
    />
  );
}
