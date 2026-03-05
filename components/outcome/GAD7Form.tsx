'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { GAD7_QUESTIONS, GAD7_OPTIONS, getGAD7Severity, IAPT_THRESHOLDS } from '@/lib/iapt-dataset';

interface GAD7FormProps {
  onSubmit: (scores: number[], total: number) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function GAD7Form({ onSubmit, onCancel, isSubmitting }: GAD7FormProps) {
  const [scores, setScores] = useState<number[]>(Array(7).fill(-1));
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswer = (value: number) => {
    const newScores = [...scores];
    newScores[currentQuestion] = value;
    setScores(newScores);

    // Auto-advance to next question
    if (currentQuestion < GAD7_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const total = scores.filter(s => s >= 0).reduce((sum, s) => sum + s, 0);
  const allAnswered = scores.every(s => s >= 0);
  const severity = allAnswered ? getGAD7Severity(total) : null;
  const isAboveCaseness = total >= IAPT_THRESHOLDS.GAD7_CASENESS;

  const handleSubmit = () => {
    if (allAnswered) {
      onSubmit(scores, total);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-cinzel text-lg text-text-main">GAD-7 Assessment</h3>
          <p className="text-xs text-text-muted">Generalised Anxiety Disorder Scale</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-text-muted">
            Question {currentQuestion + 1} of {GAD7_QUESTIONS.length}
          </div>
          <div className="w-32 h-1.5 bg-border rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-violet-500 transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / GAD7_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-text-mid mb-6">
        Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following problems?
      </p>

      {/* Question navigation dots */}
      <div className="flex gap-2 mb-6 justify-center">
        {GAD7_QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQuestion(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentQuestion 
                ? 'bg-violet-500 scale-125' 
                : scores[i] >= 0 
                  ? 'bg-violet-500/50' 
                  : 'bg-border'
            }`}
            aria-label={`Go to question ${i + 1}`}
          />
        ))}
      </div>

      {/* Current question */}
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <p className="text-base text-text-main mb-4">
          {currentQuestion + 1}. {GAD7_QUESTIONS[currentQuestion].text}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GAD7_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={`p-4 rounded-lg border text-center transition-all ${
                scores[currentQuestion] === option.value
                  ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                  : 'border-border hover:border-violet-500/50 text-text-mid'
              }`}
            >
              <div className="font-cinzel text-lg mb-1">{option.value}</div>
              <div className="text-xs">{option.label}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="text-sm text-text-muted hover:text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentQuestion(Math.min(GAD7_QUESTIONS.length - 1, currentQuestion + 1))}
          disabled={currentQuestion === GAD7_QUESTIONS.length - 1}
          className="text-sm text-text-muted hover:text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      {/* Results preview */}
      {allAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg mb-6 ${
            isAboveCaseness 
              ? 'bg-amber-900/20 border border-amber-500/30' 
              : 'bg-emerald-900/20 border border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-main">Total Score: <strong>{total}</strong></p>
              <p className={`text-xs ${isAboveCaseness ? 'text-amber-400' : 'text-emerald-400'}`}>
                {severity}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-border text-text-muted font-cinzel text-sm tracking-widest rounded-lg hover:border-text-muted transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className="flex-1 py-3 bg-violet-500 text-void font-cinzel text-sm tracking-widest rounded-lg hover:bg-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit GAD-7'}
        </button>
      </div>
    </div>
  );
}
