'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { PHQ9_QUESTIONS, PHQ9_OPTIONS, getPHQ9Severity, IAPT_THRESHOLDS } from '@/lib/iapt-dataset';

interface PHQ9FormProps {
  onSubmit: (scores: number[], total: number) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function PHQ9Form({ onSubmit, onCancel, isSubmitting }: PHQ9FormProps) {
  const [scores, setScores] = useState<number[]>(Array(9).fill(-1));
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswer = (value: number) => {
    const newScores = [...scores];
    newScores[currentQuestion] = value;
    setScores(newScores);

    // Auto-advance to next question
    if (currentQuestion < PHQ9_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const total = scores.filter(s => s >= 0).reduce((sum, s) => sum + s, 0);
  const allAnswered = scores.every(s => s >= 0);
  const severity = allAnswered ? getPHQ9Severity(total) : null;
  const isAboveCaseness = total >= IAPT_THRESHOLDS.PHQ9_CASENESS;

  const handleSubmit = () => {
    if (allAnswered) {
      onSubmit(scores, total);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-cinzel text-lg text-text-main">PHQ-9 Assessment</h3>
          <p className="text-xs text-text-muted">Patient Health Questionnaire</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-text-muted">
            Question {currentQuestion + 1} of {PHQ9_QUESTIONS.length}
          </div>
          <div className="w-32 h-1.5 bg-border rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / PHQ9_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-text-mid mb-6">
        Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following problems?
      </p>

      {/* Question navigation dots */}
      <div className="flex gap-2 mb-6 justify-center">
        {PHQ9_QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQuestion(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentQuestion 
                ? 'bg-blue-500 scale-125' 
                : scores[i] >= 0 
                  ? 'bg-blue-500/50' 
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
          {currentQuestion + 1}. {PHQ9_QUESTIONS[currentQuestion].text}
        </p>

        {/* Special warning for Q9 */}
        {currentQuestion === 8 && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-400">
              This question asks about thoughts of self-harm. Your answer helps us understand how to best support you.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PHQ9_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={`p-4 rounded-lg border text-center transition-all ${
                scores[currentQuestion] === option.value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-border hover:border-blue-500/50 text-text-mid'
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
          onClick={() => setCurrentQuestion(Math.min(PHQ9_QUESTIONS.length - 1, currentQuestion + 1))}
          disabled={currentQuestion === PHQ9_QUESTIONS.length - 1}
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
            {scores[8] >= 1 && (
              <div className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                ⚠️ Q9 flagged
              </div>
            )}
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
          className="flex-1 py-3 bg-blue-500 text-void font-cinzel text-sm tracking-widest rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit PHQ-9'}
        </button>
      </div>
    </div>
  );
}
