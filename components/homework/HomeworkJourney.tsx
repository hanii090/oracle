'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface JourneyDay {
  theme: string;
  question: string;
  followUp: string;
  grounding?: string;
}

interface CheckIn {
  dayNumber: number;
  response: string;
  timestamp: string;
}

interface HomeworkAssignment {
  id: string;
  topic: string;
  description: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  journeyPlan?: Record<string, JourneyDay>;
  openingMessage?: string;
  closingMessage?: string;
  checkIns: CheckIn[];
  completedDays: number;
  status: 'active' | 'completed' | 'expired';
}

interface HomeworkJourneyProps {
  assignment: HomeworkAssignment;
  onCheckInComplete?: () => void;
}

export function HomeworkJourney({ assignment, onCheckInComplete }: HomeworkJourneyProps) {
  const { getIdToken } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate current day based on start date
  useEffect(() => {
    const start = new Date(assignment.startDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    setCurrentDay(Math.min(Math.max(1, daysSinceStart), assignment.durationDays));
  }, [assignment.startDate, assignment.durationDays]);

  // Check for voice support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setVoiceSupported(true);
    }
  }, []);

  const todayKey = `day${currentDay}`;
  const todayPlan = assignment.journeyPlan?.[todayKey];
  const hasCheckedInToday = assignment.checkIns.some(c => c.dayNumber === currentDay);
  const isLastDay = currentDay === assignment.durationDays;

  const handleSubmit = async () => {
    if (!response.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          assignmentId: assignment.id,
          response: response.trim(),
          dayNumber: currentDay,
        }),
      });

      if (res.ok) {
        setResponse('');
        onCheckInComplete?.();
      }
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startVoiceInput = () => {
    if (!voiceSupported || typeof window === 'undefined') return;

    // Web Speech API types
    type SpeechRecognitionType = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: () => void;
      onend: () => void;
      onerror: () => void;
      onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
      start: () => void;
    };

    const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: SpeechRecognitionType; SpeechRecognition?: SpeechRecognitionType }).webkitSpeechRecognition || (window as Window & { SpeechRecognition?: SpeechRecognitionType }).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setResponse(transcript);
    };

    recognition.start();
  };

  const getProgressPercentage = () => {
    return Math.round((assignment.completedDays / assignment.durationDays) * 100);
  };

  const getDayStatus = (day: number) => {
    const checkedIn = assignment.checkIns.some(c => c.dayNumber === day);
    if (checkedIn) return 'completed';
    if (day === currentDay) return 'current';
    if (day < currentDay) return 'missed';
    return 'upcoming';
  };

  return (
    <div className="bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border border-violet-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-violet-900/30 p-4 border-b border-violet-500/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-cinzel text-sm text-violet-300 tracking-wider">
            {assignment.topic}
          </h3>
          <span className="text-xs text-violet-400">
            Day {currentDay} of {assignment.durationDays}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-violet-900/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-violet-400 font-cinzel">{getProgressPercentage()}%</span>
        </div>

        {/* Day Indicators */}
        <div className="flex gap-1 mt-3">
          {Array.from({ length: assignment.durationDays }).map((_, i) => {
            const day = i + 1;
            const status = getDayStatus(day);
            return (
              <div
                key={day}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  status === 'completed' ? 'bg-emerald-500' :
                  status === 'current' ? 'bg-violet-500' :
                  status === 'missed' ? 'bg-amber-500/50' :
                  'bg-violet-900/50'
                }`}
                title={`Day ${day}: ${status}`}
              />
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {hasCheckedInToday ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-8"
            >
              <div className="text-4xl mb-4">✨</div>
              <h4 className="font-cinzel text-lg text-emerald-400 mb-2">
                {isLastDay ? 'Journey Complete!' : "You've checked in today"}
              </h4>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                {isLastDay 
                  ? assignment.closingMessage || 'Well done on completing your homework journey. Take a moment to appreciate your progress.'
                  : 'Come back tomorrow for your next reflection. Rest well.'}
              </p>
              
              {/* Show today's response */}
              {assignment.checkIns.find(c => c.dayNumber === currentDay) && (
                <div className="mt-6 bg-surface/50 rounded-lg p-4 text-left max-w-md mx-auto">
                  <p className="text-xs text-text-muted mb-1">Your reflection:</p>
                  <p className="text-xs text-text-mid italic">
                    &ldquo;{assignment.checkIns.find(c => c.dayNumber === currentDay)?.response}&rdquo;
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Opening message for day 1 */}
              {currentDay === 1 && assignment.openingMessage && (
                <p className="text-sm text-violet-300 mb-4 italic">
                  {assignment.openingMessage}
                </p>
              )}

              {/* Today's theme */}
              {todayPlan?.theme && (
                <p className="text-xs text-violet-400 uppercase tracking-wider mb-2">
                  {todayPlan.theme}
                </p>
              )}

              {/* Today's question */}
              <p className="text-lg text-text-main font-cormorant leading-relaxed mb-6">
                {todayPlan?.question || `How are you doing with "${assignment.topic}" today?`}
              </p>

              {/* Response input */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-surface/50 border border-violet-500/30 rounded-lg p-4 text-text-main placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-violet-500/60 min-h-[120px]"
                  disabled={isSubmitting}
                />

                {/* Voice input button */}
                {voiceSupported && (
                  <button
                    onClick={startVoiceInput}
                    disabled={isListening}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                    }`}
                    title="Voice input"
                  >
                    🎤
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4">
                {/* Grounding toggle */}
                {todayPlan?.grounding && (
                  <button
                    onClick={() => setShowGrounding(!showGrounding)}
                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                  >
                    🌱 {showGrounding ? 'Hide' : 'Need'} grounding
                  </button>
                )}
                <div className="flex-1" />

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={!response.trim() || isSubmitting}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900/50 disabled:text-text-muted text-white rounded-lg font-cinzel text-sm tracking-wider transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Reflection'}
                </button>
              </div>

              {/* Grounding exercise */}
              <AnimatePresence>
                {showGrounding && todayPlan?.grounding && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-teal-900/20 border border-teal-500/20 rounded-lg p-4"
                  >
                    <p className="text-xs text-teal-400 uppercase tracking-wider mb-2">
                      Grounding Exercise
                    </p>
                    <p className="text-sm text-text-mid">
                      {todayPlan.grounding}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Previous check-ins */}
      {assignment.checkIns.length > 0 && !hasCheckedInToday && (
        <div className="border-t border-violet-500/20 p-4">
          <details className="group">
            <summary className="text-xs text-violet-400 cursor-pointer hover:text-violet-300">
              View previous reflections ({assignment.checkIns.length})
            </summary>
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {assignment.checkIns.slice().reverse().map((checkIn, i) => (
                <div key={i} className="bg-surface/30 rounded p-2">
                  <p className="text-[10px] text-text-muted mb-1">Day {checkIn.dayNumber}</p>
                  <p className="text-xs text-text-mid">{checkIn.response}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default HomeworkJourney;
