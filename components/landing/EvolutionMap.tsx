'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SessionSummary } from '@/hooks/useAuth';

interface EvolutionMapProps {
  sessions: SessionSummary[];
  onViewSession?: (session: SessionSummary) => void;
  beliefs?: { text: string; category: string; status: string; sessionDate: string }[];
}

interface Node {
  id: string;
  x: number;
  y: number;
  radius: number;
  depth: number;
  label: string;
  date: string;
  theme: string;
  exchanges: number;
  session: SessionSummary;
  connections: string[];
}

// Extract dominant themes/keywords from session messages
function extractThemes(session: SessionSummary): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or',
    'if', 'while', 'about', 'up', 'down', 'what', 'which', 'who', 'whom',
    'this', 'that', 'these', 'those', 'am', 'it', 'its', 'my', 'your',
    'his', 'her', 'our', 'their', 'me', 'him', 'us', 'them', 'i', 'you',
    'he', 'she', 'we', 'they', 'said', 'say', 'says', 'like', 'get',
    'got', 'make', 'made', 'know', 'think', 'feel', 'want', 'need',
    'really', 'also', 'even', 'still', 'way', 'something', 'anything',
    'nothing', 'everything', 'thing', 'things', 'dont', "don't", 'im',
    "i'm", "it's", 'yes', 'yeah', 'okay', 'well', 'much', 'many',
    'truth', 'sorca', 'question', 'answer', 'avoiding', 'today',
  ]);

  const userMessages = session.messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase());

  const wordCounts: Record<string, number> = {};

  for (const msg of userMessages) {
    const words = msg
      .replace(/[^a-z\s'-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

// Find connections between sessions based on shared themes
function findConnections(sessions: SessionSummary[], themes: Map<string, string[]>): Map<string, string[]> {
  const connections = new Map<string, string[]>();

  for (const session of sessions) {
    const sessionThemes = themes.get(session.id) || [];
    const connected: string[] = [];

    for (const other of sessions) {
      if (other.id === session.id) continue;
      const otherThemes = themes.get(other.id) || [];
      const shared = sessionThemes.filter(t => otherThemes.includes(t));
      if (shared.length > 0) {
        connected.push(other.id);
      }
    }

    connections.set(session.id, connected);
  }

  return connections;
}

// Color based on session depth
function depthColor(depth: number): string {
  if (depth >= 10) return '#8b1a2f'; // crimson
  if (depth >= 7) return '#0f766e'; // teal
  if (depth >= 5) return '#e74c3c'; // warm red
  if (depth >= 3) return '#b8860b'; // editorial gold
  return '#2a6b6b'; // teal
}

function depthGlow(depth: number): string {
  if (depth >= 10) return 'rgba(139, 26, 47, 0.3)';
  if (depth >= 7) return 'rgba(192, 57, 43, 0.25)';
  if (depth >= 5) return 'rgba(231, 76, 60, 0.2)';
  if (depth >= 3) return 'rgba(184, 134, 11, 0.2)';
  return 'rgba(42, 107, 107, 0.2)';
}

export function EvolutionMap({ sessions, onViewSession, beliefs }: EvolutionMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'sessions' | 'beliefs'>('sessions');

  // Build the node graph
  const nodes = useMemo(() => {
    if (sessions.length === 0) return [];

    const themesMap = new Map<string, string[]>();
    for (const s of sessions) {
      themesMap.set(s.id, extractThemes(s));
    }

    const connectionsMap = findConnections(sessions, themesMap);

    // Layout: chronological spiral
    const result: Node[] = [];
    const sorted = [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const count = sorted.length;

    for (let i = 0; i < count; i++) {
      const session = sorted[i];
      const themes = themesMap.get(session.id) || [];
      const connections = connectionsMap.get(session.id) || [];

      // Spiral layout
      const angle = (i / count) * Math.PI * 2 * Math.max(1, Math.ceil(count / 8));
      const spiralRadius = 80 + (i / count) * 180;
      const x = 400 + Math.cos(angle) * spiralRadius;
      const y = 300 + Math.sin(angle) * spiralRadius;

      result.push({
        id: session.id,
        x,
        y,
        radius: Math.max(6, Math.min(20, session.maxDepth * 2)),
        depth: session.maxDepth,
        label: themes[0] || session.preview.slice(0, 20),
        date: new Date(session.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        theme: themes.join(', ') || 'untitled',
        exchanges: session.messageCount,
        session,
        connections,
      });
    }

    return result;
  }, [sessions]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const scaleX = rect.width / 800;
    const scaleY = rect.height / 600;

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      time += 0.005;

      // Draw connections first
      for (const node of nodes) {
        for (const connId of node.connections) {
          const target = nodes.find(n => n.id === connId);
          if (!target) continue;
          // Only draw each connection once
          if (node.id > target.id) continue;

          ctx.beginPath();
          ctx.moveTo(node.x * scaleX, node.y * scaleY);

          // Curved connection line
          const midX = (node.x + target.x) / 2 * scaleX;
          const midY = (node.y + target.y) / 2 * scaleY - 20;
          ctx.quadraticCurveTo(midX, midY, target.x * scaleX, target.y * scaleY);

          ctx.strokeStyle = 'rgba(14, 12, 9, 0.06)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const nx = node.x * scaleX;
        const ny = node.y * scaleY;
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const pulse = Math.sin(time * 2 + nodes.indexOf(node)) * 0.3 + 1;
        const r = node.radius * (isHovered ? 1.4 : isSelected ? 1.3 : 1) * pulse;

        // Glow
        const glowGradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 3);
        glowGradient.addColorStop(0, depthGlow(node.depth));
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(nx - r * 3, ny - r * 3, r * 6, r * 6);

        // Node circle
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fillStyle = depthColor(node.depth);
        ctx.globalAlpha = isHovered || isSelected ? 1 : 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Border
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(nx, ny, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(192, 57, 43, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = isHovered || isSelected ? '#0e0c09' : 'rgba(61, 56, 48, 0.6)';
        ctx.font = `${isHovered ? 11 : 9}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(node.date, nx, ny + r + 14);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [nodes, hoveredNode, selectedNode]);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const scaleX = rect.width / 800;
    const scaleY = rect.height / 600;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found: Node | null = null;
    for (const node of nodes) {
      const nx = node.x * scaleX;
      const ny = node.y * scaleY;
      const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
      if (dist < node.radius * 2) {
        found = node;
        break;
      }
    }

    setHoveredNode(found);
    canvas.style.cursor = found ? 'pointer' : 'default';
  }, [nodes]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode === selectedNode ? null : hoveredNode);
    } else {
      setSelectedNode(null);
    }
  }, [hoveredNode, selectedNode]);

  if (sessions.length === 0) return null;

  // Stats
  const totalDepth = sessions.reduce((sum, s) => sum + s.maxDepth, 0);
  const avgDepth = (totalDepth / sessions.length).toFixed(1);
  const deepestSession = sessions.reduce((prev, curr) => curr.maxDepth > prev.maxDepth ? curr : prev, sessions[0]);
  const totalExchanges = sessions.reduce((sum, s) => sum + s.messageCount, 0);

  return (
    <section className="w-full max-w-4xl px-6 mt-4 mb-8 relative z-10" aria-labelledby="evolution-heading">
      <div className="font-cinzel text-[9px] tracking-[0.35em] uppercase text-gold mb-5 flex items-center gap-4">
        <span id="evolution-heading">IV · Evolution Map</span>
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" aria-hidden="true" />
        {beliefs && beliefs.length > 0 && (
          <button
            onClick={() => setViewMode(viewMode === 'sessions' ? 'beliefs' : 'sessions')}
            className="text-text-muted hover:text-gold transition-colors font-courier text-[10px] tracking-widest uppercase"
          >
            {viewMode === 'sessions' ? 'Beliefs' : 'Sessions'}
          </button>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-text-muted hover:text-gold transition-colors font-courier text-[10px] tracking-widest uppercase"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-6 mb-4 flex-wrap">
        <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[120px]">
          <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase mb-1">Sessions</div>
          <div className="font-cinzel text-gold text-xl">{sessions.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[120px]">
          <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase mb-1">Avg Depth</div>
          <div className="font-cinzel text-gold text-xl">{avgDepth}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[120px]">
          <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase mb-1">Deepest</div>
          <div className="font-cinzel text-xl" style={{ color: depthColor(deepestSession.maxDepth) }}>
            {deepestSession.maxDepth}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg px-4 py-3 flex-1 min-w-[120px]">
          <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase mb-1">Exchanges</div>
          <div className="font-cinzel text-gold text-xl">{totalExchanges}</div>
        </div>
      </div>

      {/* Depth timeline */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-4">
        <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase mb-3">Depth Over Time</div>
        <div className="flex items-end gap-1 h-20">
          {[...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(100, (session.maxDepth / 15) * 100)}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="flex-1 rounded-t cursor-pointer transition-opacity hover:opacity-100"
              style={{
                backgroundColor: depthColor(session.maxDepth),
                opacity: selectedNode?.id === session.id ? 1 : 0.6,
                minWidth: '4px',
                maxWidth: '24px',
              }}
              title={`Depth ${session.maxDepth} — ${new Date(session.createdAt).toLocaleDateString()}`}
              onClick={() => {
                const node = nodes.find(n => n.id === session.id);
                if (node) setSelectedNode(node === selectedNode ? null : node);
              }}
            />
          ))}
        </div>
      </div>

      {/* Constellation Map (expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              ref={containerRef}
              className="relative bg-surface border border-border rounded-lg overflow-hidden mb-4"
              style={{ height: '400px' }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                onMouseLeave={() => setHoveredNode(null)}
              />

              {/* Tooltip overlay */}
              <AnimatePresence>
                {hoveredNode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute z-20 pointer-events-none bg-deep/95 backdrop-blur border border-gold/20 rounded-lg px-4 py-3 shadow-xl"
                    style={{
                      left: `${Math.min(70, (hoveredNode.x / 800) * 100)}%`,
                      top: `${Math.min(70, (hoveredNode.y / 600) * 100)}%`,
                    }}
                  >
                    <div className="font-cinzel text-[10px] text-gold tracking-widest mb-1">
                      Depth {hoveredNode.depth} · {hoveredNode.date}
                    </div>
                    <div className="font-cormorant italic text-text-mid text-sm">
                      &ldquo;{hoveredNode.session.preview.slice(0, 60)}…&rdquo;
                    </div>
                    <div className="font-courier text-[8px] text-text-muted mt-1">
                      {hoveredNode.exchanges} exchanges · themes: {hoveredNode.theme}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Legend */}
              <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-deep/80 backdrop-blur px-3 py-2 rounded-lg border border-border/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2a6b6b' }} />
                  <span className="font-courier text-[8px] text-text-muted">1-2</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#b8860b' }} />
                  <span className="font-courier text-[8px] text-text-muted">3-4</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e74c3c' }} />
                  <span className="font-courier text-[8px] text-text-muted">5-6</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0f766e' }} />
                  <span className="font-courier text-[8px] text-text-muted">7-9</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8b1a2f' }} />
                  <span className="font-courier text-[8px] text-text-muted">10+</span>
                </div>
              </div>
            </div>

            {/* Feature 04/11: Belief Constellation Overlay */}
            {viewMode === 'beliefs' && beliefs && beliefs.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-5 mb-4">
                <div className="font-courier text-[9px] text-text-muted tracking-widest uppercase mb-4">
                  Belief Constellation · {beliefs.length} beliefs tracked
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {beliefs.map((belief, i) => {
                    const statusColors: Record<string, string> = {
                      active: '#2a6b6b',
                      evolved: '#b8860b',
                      deepened: '#0f766e',
                      contradicted: '#e74c3c',
                      abandoned: '#7a7060',
                    };
                    const color = statusColors[belief.status] || '#3d3830';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-deep/50 rounded-lg border border-border/50"
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0">
                          <p className="font-cormorant text-sm text-text-mid italic leading-snug">
                            &ldquo;{belief.text}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-courier text-[8px] tracking-widest uppercase" style={{ color }}>
                              {belief.status}
                            </span>
                            <span className="font-courier text-[8px] text-text-muted tracking-widest">
                              {belief.category}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected session detail */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-surface border border-gold/20 rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-cinzel text-xs tracking-widest" style={{ color: depthColor(selectedNode.depth) }}>
                Depth {selectedNode.depth} · {selectedNode.date}
              </div>
              <div className="flex items-center gap-3">
                {onViewSession && (
                  <button
                    onClick={() => onViewSession(selectedNode.session)}
                    className="font-courier text-[10px] text-gold hover:text-gold-bright tracking-widest uppercase transition-colors"
                  >
                    Revisit →
                  </button>
                )}
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-text-muted hover:text-gold transition-colors"
                  aria-label="Close detail"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="font-cormorant italic text-text-mid text-lg mb-2">
              &ldquo;{selectedNode.session.preview}&rdquo;
            </p>
            <div className="flex items-center gap-4 text-[9px] font-courier text-text-muted tracking-widest uppercase">
              <span>{selectedNode.exchanges} exchanges</span>
              <span>themes: {selectedNode.theme}</span>
              {selectedNode.connections.length > 0 && (
                <span className="text-gold/60">{selectedNode.connections.length} connected sessions</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
