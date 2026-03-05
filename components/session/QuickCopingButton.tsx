'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface CopingAnchor {
  id: string;
  type: 'grounding' | 'breathing' | 'affirmation' | 'memory';
  content: string;
  createdAt: string;
}

const DEFAULT_GROUNDING_EXERCISES = [
  {
    id: 'grounding-5-4-3-2-1',
    type: 'grounding' as const,
    content: '5-4-3-2-1: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
    createdAt: '',
  },
  {
    id: 'grounding-feet',
    type: 'grounding' as const,
    content: 'Feel your feet on the ground. Press them down. You are here, now, safe.',
    createdAt: '',
  },
  {
    id: 'breathing-box',
    type: 'breathing' as const,
    content: 'Box breathing: Inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 4 times.',
    createdAt: '',
  },
];

export function QuickCopingButton() {
  const { user, getIdToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [anchors, setAnchors] = useState<CopingAnchor[]>(DEFAULT_GROUNDING_EXERCISES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');

  useEffect(() => {
    if (!user) return;

    const fetchAnchors = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/coping-anchor', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.anchors?.length > 0) {
            setAnchors([...data.anchors, ...DEFAULT_GROUNDING_EXERCISES]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch coping anchors:', error);
      }
    };

    fetchAnchors();
  }, [user, getIdToken]);

  // Breathing exercise timer
  useEffect(() => {
    if (!isBreathing) return;

    const phases: Array<'inhale' | 'hold' | 'exhale' | 'rest'> = ['inhale', 'hold', 'exhale', 'rest'];
    let phaseIndex = 0;

    const interval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setBreathPhase(phases[phaseIndex]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isBreathing]);

  const nextAnchor = () => {
    setCurrentIndex((prev) => (prev + 1) % anchors.length);
  };

  const prevAnchor = () => {
    setCurrentIndex((prev) => (prev - 1 + anchors.length) % anchors.length);
  };

  const startBreathing = () => {
    setIsBreathing(true);
    setBreathPhase('inhale');
  };

  const stopBreathing = () => {
    setIsBreathing(false);
  };

  const currentAnchor = anchors[currentIndex];

  const getAnchorIcon = (type: CopingAnchor['type']) => {
    switch (type) {
      case 'grounding':
        return '🌍';
      case 'breathing':
        return '🌬️';
      case 'affirmation':
        return '💪';
      case 'memory':
        return '💭';
      default:
        return '✨';
    }
  };

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale':
        return 'Breathe in...';
      case 'hold':
        return 'Hold...';
      case 'exhale':
        return 'Breathe out...';
      case 'rest':
        return 'Rest...';
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Quick coping tools"
        title="Need grounding?"
      >
        <span className="text-2xl">🌱</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              stopBreathing();
            }}
          />

          {/* Content */}
          <div className="relative bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Grounding Tools</h2>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    stopBreathing();
                  }}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-white/80 mt-1">Take a moment. You&apos;re safe here.</p>
            </div>

            {/* Breathing Exercise */}
            {isBreathing ? (
              <div className="p-8 text-center">
                <div
                  className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-[4000ms] ${
                    breathPhase === 'inhale'
                      ? 'scale-125 bg-blue-500/30'
                      : breathPhase === 'hold'
                      ? 'scale-125 bg-purple-500/30'
                      : breathPhase === 'exhale'
                      ? 'scale-100 bg-green-500/30'
                      : 'scale-100 bg-stone-700/30'
                  }`}
                >
                  <span className="text-2xl font-medium text-stone-200">
                    {getBreathInstruction()}
                  </span>
                </div>
                <button
                  onClick={stopBreathing}
                  className="mt-6 px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-stone-300 text-sm"
                >
                  Stop
                </button>
              </div>
            ) : (
              <>
                {/* Current Anchor */}
                <div className="p-6">
                  <div className="bg-stone-800/50 rounded-xl p-6 min-h-[120px] flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-3">{getAnchorIcon(currentAnchor.type)}</span>
                    <p className="text-stone-200 leading-relaxed">{currentAnchor.content}</p>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={prevAnchor}
                      className="p-2 text-stone-400 hover:text-stone-200"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs text-stone-500">
                      {currentIndex + 1} / {anchors.length}
                    </span>
                    <button
                      onClick={nextAnchor}
                      className="p-2 text-stone-400 hover:text-stone-200"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t border-stone-800 p-4 flex gap-3">
                  <button
                    onClick={startBreathing}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                  >
                    🌬️ Breathing Exercise
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = '/?start=true';
                    }}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-medium transition-colors"
                  >
                    💭 Talk to Sorca
                  </button>
                </div>

                {/* Crisis Resources */}
                <div className="border-t border-stone-800 p-4 text-center">
                  <p className="text-xs text-stone-500 mb-2">If you&apos;re in crisis:</p>
                  <p className="text-sm text-stone-400">
                    🆘 Samaritans: <span className="text-amber-400">116 123</span> (UK, free, 24/7)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default QuickCopingButton;
