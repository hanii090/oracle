"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  minO: number;
  maxO: number;
  speed: number;
  phase: number;
}

/**
 * Canvas-based starfield — renders 120 stars on a single canvas
 * instead of 120 individual DOM elements.
 */
export function Stars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Generate stars once
    starsRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      minO: Math.random() * 0.15,
      maxO: Math.random() * 0.15 + Math.random() * 0.4,
      speed: 0.3 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    }));

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = time / 1000;

      for (const star of starsRef.current) {
        const opacity =
          star.minO +
          (star.maxO - star.minO) *
            (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
        const scale = 1 + 0.3 * Math.sin(t * star.speed + star.phase);

        ctx.beginPath();
        ctx.arc(
          star.x * canvas.width,
          star.y * canvas.height,
          (star.size * scale) / 2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
