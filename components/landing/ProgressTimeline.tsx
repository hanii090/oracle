'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProgressEvent {
  id: string;
  type: 'session' | 'homework' | 'insight' | 'milestone';
  title: string;
  description?: string;
  date: string;
  depth?: number;
  mood?: string;
}

interface ProgressStats {
  totalSessions: number;
  totalHomework: number;
  averageDepth: number;
  longestStreak: number;
  currentStreak: number;
  weeklyTrend: 'improving' | 'stable' | 'declining' | 'fluctuating';
}

export function ProgressTimeline() {
  const { user, getIdToken } = useAuth();
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch(`/api/progress?range=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
          setStats(data.stats || null);
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, getIdToken, timeRange]);

  const getEventIcon = (type: ProgressEvent['type']) => {
    switch (type) {
      case 'session':
        return '💭';
      case 'homework':
        return '📝';
      case 'insight':
        return '💡';
      case 'milestone':
        return '🏆';
      default:
        return '•';
    }
  };

  const getEventColor = (type: ProgressEvent['type']) => {
    switch (type) {
      case 'session':
        return 'bg-blue-500/20 border-blue-500/40';
      case 'homework':
        return 'bg-green-500/20 border-green-500/40';
      case 'insight':
        return 'bg-yellow-500/20 border-yellow-500/40';
      case 'milestone':
        return 'bg-purple-500/20 border-purple-500/40';
      default:
        return 'bg-stone-500/20 border-stone-500/40';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getTrendIcon = (trend: ProgressStats['weeklyTrend']) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      case 'stable':
        return '➡️';
      case 'fluctuating':
        return '📊';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-6 bg-stone-800 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-stone-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-stone-200">Your Progress</h2>
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                timeRange === range
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
              }`}
            >
              {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-stone-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{stats.totalSessions}</div>
            <div className="text-xs text-stone-400">Sessions</div>
          </div>
          <div className="bg-stone-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.totalHomework}</div>
            <div className="text-xs text-stone-400">Homework Done</div>
          </div>
          <div className="bg-stone-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.averageDepth.toFixed(1)}</div>
            <div className="text-xs text-stone-400">Avg Depth</div>
          </div>
          <div className="bg-stone-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {stats.currentStreak} 🔥
            </div>
            <div className="text-xs text-stone-400">Day Streak</div>
          </div>
        </div>
      )}

      {/* Weekly Trend */}
      {stats?.weeklyTrend && (
        <div className="bg-stone-800/30 rounded-lg p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">{getTrendIcon(stats.weeklyTrend)}</span>
          <div>
            <div className="text-sm font-medium text-stone-200">
              Weekly Trend: {stats.weeklyTrend.charAt(0).toUpperCase() + stats.weeklyTrend.slice(1)}
            </div>
            <div className="text-xs text-stone-400">
              {stats.weeklyTrend === 'improving' && 'Great progress! Keep it up.'}
              {stats.weeklyTrend === 'stable' && 'Consistent engagement. Steady progress.'}
              {stats.weeklyTrend === 'declining' && 'Consider scheduling some time for reflection.'}
              {stats.weeklyTrend === 'fluctuating' && 'Varied engagement. That\'s okay.'}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          <p className="text-lg mb-2">No progress events yet</p>
          <p className="text-sm">Start a session to begin tracking your journey</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-stone-700" />

          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${getEventColor(
                    event.type
                  )}`}
                >
                  {getEventIcon(event.type)}
                </div>

                {/* Event card */}
                <div className="bg-stone-800/50 rounded-lg p-4 hover:bg-stone-800/70 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-stone-200">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-stone-400 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-stone-500">{formatDate(event.date)}</div>
                  </div>

                  {/* Depth indicator for sessions */}
                  {event.type === 'session' && event.depth && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-stone-500">Depth:</span>
                      <div className="flex-1 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                          style={{ width: `${Math.min(event.depth * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-amber-400">{event.depth}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressTimeline;
