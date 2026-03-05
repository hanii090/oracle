'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  displayName: string;
  nextSession: string | null;
  sessionDay: string | null;
}

interface SessionSchedulerProps {
  client: Client;
  onScheduled?: () => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8; // 8am to 5:30pm
  const minute = (i % 2) * 30;
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    label: `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
  };
});

export function SessionScheduler({ client, onScheduled, onClose }: SessionSchedulerProps) {
  const { getIdToken } = useAuth();
  const [scheduleType, setScheduleType] = useState<'recurring' | 'oneoff'>('recurring');
  const [selectedDay, setSelectedDay] = useState(client.sessionDay || 'monday');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedDate, setSelectedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getIdToken();

      let nextSessionDate: string;

      if (scheduleType === 'oneoff') {
        if (!selectedDate) {
          setError('Please select a date');
          setIsSubmitting(false);
          return;
        }
        nextSessionDate = `${selectedDate}T${selectedTime}:00.000Z`;
      } else {
        // Calculate next occurrence of selected day
        const today = new Date();
        const dayIndex = DAYS_OF_WEEK.findIndex(d => d.value === selectedDay);
        const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert to Monday=0
        let daysUntil = dayIndex - todayIndex;
        if (daysUntil <= 0) daysUntil += 7;

        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntil);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        nextDate.setHours(hours, minutes, 0, 0);
        nextSessionDate = nextDate.toISOString();
      }

      const res = await fetch('/api/therapist/schedule-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId: client.id,
          nextSessionDate,
          sessionDay: scheduleType === 'recurring' ? selectedDay : null,
          sessionTime: selectedTime,
        }),
      });

      if (res.ok) {
        onScheduled?.();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to schedule session');
      }
    } catch (err) {
      console.error('Schedule error:', err);
      setError('Failed to schedule session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface border border-teal-500/30 rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cinzel text-lg text-teal-400">
            Schedule Session
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-gold">
            ✕
          </button>
        </div>

        <p className="text-sm text-text-muted mb-6">
          Scheduling for <span className="text-text-main">{client.displayName}</span>
        </p>

        {/* Schedule Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setScheduleType('recurring')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-cinzel transition-colors ${
              scheduleType === 'recurring'
                ? 'bg-teal-600 text-white'
                : 'bg-raised text-text-muted hover:bg-raised/80'
            }`}
          >
            Weekly Recurring
          </button>
          <button
            onClick={() => setScheduleType('oneoff')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-cinzel transition-colors ${
              scheduleType === 'oneoff'
                ? 'bg-teal-600 text-white'
                : 'bg-raised text-text-muted hover:bg-raised/80'
            }`}
          >
            One-off Session
          </button>
        </div>

        <AnimatePresence mode="wait">
          {scheduleType === 'recurring' ? (
            <motion.div
              key="recurring"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Day Selection */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                  Session Day
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.slice(0, 5).map(day => (
                    <button
                      key={day.value}
                      onClick={() => setSelectedDay(day.value)}
                      className={`py-2 px-2 rounded text-xs transition-colors ${
                        selectedDay === day.value
                          ? 'bg-teal-600 text-white'
                          : 'bg-raised text-text-muted hover:bg-raised/80'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                  Session Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-raised border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-teal-500"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="oneoff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Date Selection */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                  Session Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full bg-raised border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                  Session Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-raised border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-teal-500"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-border text-text-muted rounded-lg hover:bg-raised transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900/50 text-white rounded-lg font-cinzel text-sm transition-colors"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default SessionScheduler;
