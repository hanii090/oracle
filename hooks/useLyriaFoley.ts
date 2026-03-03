import { useRef, useEffect, useCallback } from 'react';
import { LyriaFoleyEngine, EmotionWeights } from '@/lib/lyria-client';

export function useLyriaFoley(sessionActive: boolean) {
  const engineRef = useRef<LyriaFoleyEngine | null>(null);

  useEffect(() => {
    if (!sessionActive) return;
    const engine = new LyriaFoleyEngine();
    engine.connect();
    engineRef.current = engine;

    return () => engine.disconnect();
  }, [sessionActive]);

  const steerMusic = useCallback((emotions: EmotionWeights) => {
    engineRef.current?.steer(emotions);
  }, []);

  const triggerBreakthrough = useCallback(() => {
    engineRef.current?.triggerBreakthrough();
  }, []);

  return { steerMusic, triggerBreakthrough };
}
