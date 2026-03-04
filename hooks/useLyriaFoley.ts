import { useRef, useEffect, useCallback } from 'react';
import { LyriaFoleyEngine, EmotionWeights, PersonalKeyInfo } from '@/lib/lyria-client';

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

  /** Feature 07: Set user's personal musical key */
  const setPersonalKey = useCallback((key: PersonalKeyInfo) => {
    engineRef.current?.setPersonalKey(key);
  }, []);

  /** Feature 08: Replay breakthrough soundmark */
  const replayBreakthroughSignature = useCallback(() => {
    engineRef.current?.replayBreakthroughSignature();
  }, []);

  return { steerMusic, triggerBreakthrough, setPersonalKey, replayBreakthroughSignature };
}
