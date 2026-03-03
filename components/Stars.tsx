"use client";

import { useEffect, useState } from "react";

export function Stars() {
  const [stars, setStars] = useState<
    {
      id: number;
      top: string;
      left: string;
      size: number;
      minO: number;
      maxO: number;
      duration: number;
      delay: number;
    }[]
  >([]);

  useEffect(() => {
    const newStars = Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      minO: Math.random() * 0.15,
      maxO: Math.random() * 0.15 + Math.random() * 0.4,
      duration: 2 + Math.random() * 6,
      delay: Math.random() * 6,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.minO,
            animation: `twinkle ${star.duration}s ease-in-out infinite ${star.delay}s`,
          }}
        />
      ))}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
      `,
        }}
      />
    </div>
  );
}
