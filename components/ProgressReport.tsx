'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

interface ReportData {
  generatedAt: string;
  period: { from: string; to: string };
  sessionsSummary: {
    totalSessions: number;
    averageDepth: number;
    themes: string[];
  };
  moodSummary: {
    averageMood: number | null;
    trend: string | null;
    checkInCount: number;
  };
  outcomeMeasures: Array<{
    type: string;
    score: number;
    severity: string;
    date: string;
  }>;
  homeworkSummary: {
    totalAssigned: number;
    completionRate: number;
  };
  keyInsights: string[];
  milestones: string[];
  disclaimer: string;
}

interface ProgressReportProps {
  onClose?: () => void;
}

export function ProgressReport({ onClose }: ProgressReportProps) {
  const { user, getIdToken } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(3);

  const generateReport = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/progress-report?months=${months}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate report');
      }
    } catch {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken, months]);

  const handlePrint = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    printWindow.document.write(`
      <html><head><title>My Therapy Journey — Sorca</title>
      <style>
        body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.7;color:#333;}
        h1{font-size:20px;margin-bottom:4px;}
        h2{font-size:15px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px;}
        .subtitle{font-size:12px;color:#666;margin-bottom:24px;}
        .stat{display:inline-block;margin-right:24px;margin-bottom:8px;}
        .stat-value{font-size:20px;font-weight:bold;}
        .stat-label{font-size:11px;color:#666;}
        .theme{display:inline-block;padding:2px 10px;margin:2px;background:#f5f0e8;border-radius:12px;font-size:12px;}
        .measure{margin-bottom:6px;font-size:13px;}
        .insight{margin-bottom:6px;font-size:13px;padding-left:12px;border-left:2px solid #c4a35a;}
        .milestone{margin-bottom:4px;font-size:13px;}
        .disclaimer{margin-top:32px;padding:12px;background:#f9f7f3;border:1px solid #e5e0d5;font-size:11px;color:#666;border-radius:4px;}
        @media print{body{margin:20px;}}
      </style></head><body>
      <h1>My Therapy Journey</h1>
      <p class="subtitle">${formatDate(report.period.from)} — ${formatDate(report.period.to)}<br/>Generated via Sorca — Patient-Held Record</p>

      <h2>Sessions</h2>
      <div class="stat"><span class="stat-value">${report.sessionsSummary.totalSessions}</span><br/><span class="stat-label">Sessions</span></div>
      <div class="stat"><span class="stat-value">${report.sessionsSummary.averageDepth.toFixed(1)}</span><br/><span class="stat-label">Avg Depth</span></div>
      ${report.sessionsSummary.themes.length > 0 ? `<p><strong>Themes explored:</strong><br/>${report.sessionsSummary.themes.map(t => `<span class="theme">${t}</span>`).join(' ')}</p>` : ''}

      ${report.moodSummary.checkInCount > 0 ? `
      <h2>Wellbeing</h2>
      <div class="stat"><span class="stat-value">${report.moodSummary.averageMood?.toFixed(1) || '—'}</span><br/><span class="stat-label">Avg Mood /10</span></div>
      <div class="stat"><span class="stat-value">${report.moodSummary.checkInCount}</span><br/><span class="stat-label">Check-ins</span></div>
      ${report.moodSummary.trend ? `<div class="stat"><span class="stat-value">${report.moodSummary.trend}</span><br/><span class="stat-label">Trend</span></div>` : ''}
      ` : ''}

      ${report.outcomeMeasures.length > 0 ? `
      <h2>Validated Outcome Measures</h2>
      ${report.outcomeMeasures.map(m => `<p class="measure"><strong>${m.type}:</strong> ${m.score} (${m.severity}) — ${formatDate(m.date)}</p>`).join('')}
      ` : ''}

      ${report.homeworkSummary.totalAssigned > 0 ? `
      <h2>Homework</h2>
      <div class="stat"><span class="stat-value">${report.homeworkSummary.totalAssigned}</span><br/><span class="stat-label">Assigned</span></div>
      <div class="stat"><span class="stat-value">${report.homeworkSummary.completionRate}%</span><br/><span class="stat-label">Completion</span></div>
      ` : ''}

      ${report.keyInsights.length > 0 ? `
      <h2>Key Insights</h2>
      ${report.keyInsights.map(i => `<p class="insight">${i}</p>`).join('')}
      ` : ''}

      ${report.milestones.length > 0 ? `
      <h2>Milestones</h2>
      ${report.milestones.map(m => `<p class="milestone">✓ ${m}</p>`).join('')}
      ` : ''}

      <div class="disclaimer">${report.disclaimer}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!report) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cinzel text-lg text-text-main">My Therapy Journey</h2>
          {onClose && <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-main text-sm">✕</button>}
        </div>

        <p className="text-sm text-text-muted mb-6">
          Generate a progress report you can print for GP appointments or keep as a personal record.
        </p>

        <div className="flex items-center justify-center gap-3 mb-6">
          <label className="text-xs text-text-muted">Period:</label>
          {[1, 3, 6, 12].map(m => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                months === m
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-border text-text-muted hover:border-gold/30'
              }`}
            >
              {m} month{m > 1 ? 's' : ''}
            </button>
          ))}
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="px-8 py-3 bg-gold/10 text-gold border border-gold/30 rounded-lg font-cinzel text-sm tracking-widest hover:bg-gold/20 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>

        {error && (
          <p className="text-xs text-red-400 mt-4">{error}</p>
        )}

        <p className="text-[10px] text-text-muted mt-6">
          This is a patient-held record, not clinical documentation. Requires Patient Plus or higher.
        </p>
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-cinzel text-lg text-text-main">My Therapy Journey</h2>
          <p className="text-xs text-text-muted">
            {formatDate(report.period.from)} — {formatDate(report.period.to)}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="px-4 py-2 bg-gold/10 text-gold border border-gold/30 rounded-lg text-[10px] font-cinzel tracking-widest">Print / PDF</button>
          {onClose && <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-main text-sm">✕</button>}
        </div>
      </div>

      <div className="space-y-4">
        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl text-gold font-cinzel">{report.sessionsSummary.totalSessions}</p>
            <p className="text-[10px] text-text-muted">Sessions</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl text-gold font-cinzel">{report.moodSummary.averageMood?.toFixed(1) || '—'}</p>
            <p className="text-[10px] text-text-muted">Avg Mood</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl text-gold font-cinzel">{report.homeworkSummary.completionRate}%</p>
            <p className="text-[10px] text-text-muted">HW Completion</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl text-gold font-cinzel">{report.moodSummary.trend || '—'}</p>
            <p className="text-[10px] text-text-muted">Mood Trend</p>
          </div>
        </div>

        {/* Themes */}
        {report.sessionsSummary.themes.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-5">
            <h3 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-3">Themes Explored</h3>
            <div className="flex flex-wrap gap-2">
              {report.sessionsSummary.themes.map((theme, i) => (
                <span key={i} className="px-3 py-1.5 bg-gold/10 text-gold text-xs rounded-full border border-gold/20">{theme}</span>
              ))}
            </div>
          </div>
        )}

        {/* Outcome measures */}
        {report.outcomeMeasures.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-5">
            <h3 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-3">Validated Outcome Measures</h3>
            <div className="space-y-2">
              {report.outcomeMeasures.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm text-text-main font-medium">{m.type}</span>
                    <span className="text-xs text-text-muted ml-2">{m.severity}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gold font-cinzel">{m.score}</span>
                    <span className="text-[9px] text-text-muted ml-2">{formatDate(m.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Insights */}
        {report.keyInsights.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-5">
            <h3 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-3">Key Insights</h3>
            <div className="space-y-2">
              {report.keyInsights.map((insight, i) => (
                <p key={i} className="text-xs text-text-mid pl-3 border-l-2 border-gold/30 leading-relaxed">{insight}</p>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        {report.milestones.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-5">
            <h3 className="font-cinzel text-xs text-text-muted tracking-wider uppercase mb-3">Milestones</h3>
            <div className="space-y-1.5">
              {report.milestones.map((m, i) => (
                <p key={i} className="text-xs text-text-main">✓ {m}</p>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-raised border border-border rounded-lg p-4">
          <p className="text-[10px] text-text-muted leading-relaxed">{report.disclaimer}</p>
        </div>
      </div>
    </motion.div>
  );
}
