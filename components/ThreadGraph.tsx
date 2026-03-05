'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import * as d3 from 'd3';
import { useAuth } from '@/hooks/useAuth';

interface ThreadNode {
  id: string;
  type: 'question' | 'answer' | 'theme';
  content: string;
  depth: number;
  sessionId?: string;
  createdAt?: string;
}

interface ThreadLink {
  source: string;
  target: string;
  type: 'response' | 'theme' | 'contradiction';
}

interface ThreadGraphData {
  nodes: ThreadNode[];
  links: ThreadLink[];
}

interface ThreadGraphProps {
  onNodeClick?: (node: ThreadNode) => void;
}

export function ThreadGraph({ onNodeClick }: ThreadGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ThreadGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ThreadNode | null>(null);
  const { user, getIdToken } = useAuth();

  const loadGraphData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/thread-graph', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const graphData = await res.json();
        setData(graphData);
      } else {
        setError('Failed to load thread data');
      }
    } catch (e) {
      setError('Network error loading thread');
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    // Color scale based on node type
    const colorScale = (type: string) => {
      switch (type) {
        case 'question': return '#c0392b'; // gold/crimson
        case 'answer': return '#5dade2'; // blue
        case 'theme': return '#27ae60'; // green
        default: return '#7f8c8d';
      }
    };

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance(80)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', (d) => d.type === 'contradiction' ? '#e74c3c' : '#444')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => d.type === 'contradiction' ? 2 : 1)
      .attr('stroke-dasharray', (d) => d.type === 'theme' ? '4,4' : 'none');

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, ThreadNode>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    // Node circles
    node.append('circle')
      .attr('r', (d) => d.type === 'theme' ? 12 : 8 + Math.min(d.depth, 10))
      .attr('fill', (d) => colorScale(d.type))
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Depth indicator for questions
    node.filter((d) => d.type === 'question')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '8px')
      .attr('fill', '#fff')
      .attr('font-family', 'Cinzel, serif')
      .text((d) => d.depth);

    // Node labels (truncated)
    node.append('title')
      .text((d) => d.content);

    // Click handler
    node.on('click', (event, d) => {
      setSelectedNode(d);
      onNodeClick?.(d);
    });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, onNodeClick]);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-surface border border-border rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] bg-surface border border-border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-text-muted mb-2">{error}</p>
          <button
            onClick={loadGraphData}
            className="text-xs text-gold hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="w-full h-[400px] bg-surface border border-border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-text-muted">No thread data yet.</p>
          <p className="text-xs text-text-muted/60 mt-1">Start a session to build your thread.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="w-full h-[400px] bg-surface border border-border rounded-lg overflow-hidden"
      >
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 bg-void/80 backdrop-blur-sm rounded px-3 py-2 text-[9px] space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#c0392b]" />
          <span className="text-text-muted">Questions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#5dade2]" />
          <span className="text-text-muted">Answers</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#27ae60]" />
          <span className="text-text-muted">Themes</span>
        </div>
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-3 right-3 bg-void/90 backdrop-blur-sm border border-border rounded-lg p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-gold font-cinzel tracking-widest uppercase mb-1">
                {selectedNode.type} · Depth {selectedNode.depth}
              </div>
              <p className="text-xs text-text-mid line-clamp-3">
                {selectedNode.content}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-text-muted hover:text-gold text-xs"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
