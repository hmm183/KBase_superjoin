import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { 
  EvidenceGalaxyGraph, 
  GalaxyNode, 
  GalaxyLink 
} from '../types';
import { Clock, Maximize2 } from 'lucide-react';

interface EvidenceGalaxyProps {
  graphData: EvidenceGalaxyGraph;
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  onNodeSelect: (node: GalaxyNode) => void;
  selectedNodeId: string | null;
}

export const EvidenceGalaxy: React.FC<EvidenceGalaxyProps> = ({
  graphData,
  selectedYear,
  onYearChange,
  onNodeSelect,
  selectedNodeId
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fitGraphRef = useRef<() => void>(() => {});
  const [hoveredNode, setHoveredNode] = useState<GalaxyNode | null>(null);
  const [isPlayingTimeMachine, setIsPlayingTimeMachine] = useState(false);

  // Time Machine Playback Loop
  useEffect(() => {
    let interval: any;
    if (isPlayingTimeMachine && graphData.available_years.length > 0) {
      interval = setInterval(() => {
        onYearChange(
          selectedYear === null || selectedYear >= Math.max(...graphData.available_years)
            ? Math.min(...graphData.available_years)
            : selectedYear + 1
        );
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeMachine, selectedYear, graphData.available_years]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return;

    const width = containerRef.current.clientWidth || 1200;
    const height = containerRef.current.clientHeight || 750;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs & Glow Filters
    const defs = svg.append('defs');

    // Subtle node highlight filter
    const filter = defs.append('filter')
      .attr('id', 'cosmic-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3.0')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Radial Laser Gradient for Tension Arcs
    const laserGrad = defs.append('linearGradient')
      .attr('id', 'laser-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    laserGrad.append('stop').attr('offset', '0%').attr('stop-color', '#F43F5E').attr('stop-opacity', 0.8);
    laserGrad.append('stop').attr('offset', '50%').attr('stop-color', '#FB7185').attr('stop-opacity', 1.0);
    laserGrad.append('stop').attr('offset', '100%').attr('stop-color', '#F43F5E').attr('stop-opacity', 0.8);

    // Root Zoom Group
    const g = svg.append('g').attr('class', 'galaxy-universe-root');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4.0])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Cosmic Grid Lines
    const grid = g.append('g').attr('class', 'cosmic-grid-lines').attr('opacity', 0.12);
    for (let x = -width * 2; x < width * 3; x += 70) {
      grid.append('line')
        .attr('x1', x).attr('y1', -height * 2)
        .attr('x2', x).attr('y2', height * 3)
        .attr('stroke', '#4338CA').attr('stroke-width', 0.7);
    }
    for (let y = -height * 2; y < height * 3; y += 70) {
      grid.append('line')
        .attr('x1', -width * 2).attr('y1', y)
        .attr('x2', width * 3).attr('y2', y)
        .attr('stroke', '#4338CA').attr('stroke-width', 0.7);
    }

    // Stellar Background Star Particles
    const starField = g.append('g').attr('class', 'star-field').attr('opacity', 0.45);
    for (let i = 0; i < 160; i++) {
      const rx = (Math.random() - 0.5) * width * 3.5;
      const ry = (Math.random() - 0.5) * height * 3.5;
      const r = Math.random() * 1.8 + 0.4;
      const starColor = Math.random() > 0.7 ? '#A5B4FC' : (Math.random() > 0.4 ? '#67E8F9' : '#FFFFFF');
      starField.append('circle')
        .attr('cx', rx).attr('cy', ry).attr('r', r)
        .attr('fill', starColor)
        .attr('opacity', Math.random() * 0.7 + 0.3);
    }

    // Force Simulation Setup
    const nodes: GalaxyNode[] = graphData.nodes.map(d => ({ ...d }));
    const links: GalaxyLink[] = graphData.links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation<GalaxyNode>(nodes)
      .force('link', d3.forceLink<GalaxyNode, GalaxyLink>(links).id(d => d.id).distance(210))
      .force('charge', d3.forceManyBody().strength(-750))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX<GalaxyNode>(d => {
        const isDelhivery = d.id.includes('delhivery') || d.id.includes('dlhv') || (d.label && d.label.toLowerCase().includes('delhivery'));
        return isDelhivery ? width * 0.18 : width * 0.82;
      }).strength(0.20))
      .force('y', d3.forceY<GalaxyNode>(height / 2).strength(0.16))
      .force('collision', d3.forceCollide().radius(d => (d as GalaxyNode).size + 55));

    // Links Rendering
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => d.is_tension_laser ? 'url(#laser-grad)' : d.color)
      .attr('stroke-width', d => d.is_tension_laser ? 3.0 : 1.2)
      .attr('stroke-opacity', d => d.is_tension_laser ? 0.95 : 0.45)
      .attr('stroke-dasharray', d => d.is_tension_laser ? '5,5' : 'none');

    // Laser Tension Delta Badges
    const linkLabels = g.append('g').attr('class', 'link-labels')
      .selectAll('g')
      .data(links.filter(l => l.delta_value))
      .enter()
      .append('g');

    linkLabels.append('rect')
      .attr('fill', '#450A0A')
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 0.8)
      .attr('rx', 4)
      .attr('height', 18)
      .attr('width', 160)
      .attr('x', -80)
      .attr('y', 0);

    linkLabels.append('text')
      .text(d => d.delta_value || '')
      .attr('font-size', '9.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#FECDD3')
      .attr('font-weight', '600')
      .attr('text-anchor', 'middle')
      .attr('dy', 12.5);

    // Nodes Rendering
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup.selectAll<SVGGElement, GalaxyNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'galaxy-node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GalaxyNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          (d as any).fx = d.x;
          (d as any).fy = d.y;
        })
        .on('drag', (event, d) => {
          (d as any).fx = event.x;
          (d as any).fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          (d as any).fx = null;
          (d as any).fy = null;
        })
      )
      .on('click', (_, d) => {
        onNodeSelect(d);
      })
      .on('mouseenter', (_, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Outer Target Rings for Selected Node
    node.filter(d => d.id === selectedNodeId)
      .append('circle')
      .attr('r', d => d.size * 2.5)
      .attr('fill', 'none')
      .attr('stroke', '#67E8F9')
      .attr('stroke-width', 2.0)
      .attr('stroke-dasharray', '4,4');

    // Pulsing Red Rings for Contradictions
    node.filter(d => d.status === 'CONTRADICTION')
      .append('circle')
      .attr('r', d => d.size * 2.2)
      .attr('fill', 'none')
      .attr('stroke', '#F43F5E')
      .attr('stroke-width', 1.8)
      .attr('stroke-dasharray', '3,3')
      .style('filter', 'drop-shadow(0 0 8px #F43F5E)');

    // Central Sphere Body
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('filter', 'url(#cosmic-glow)')
      .attr('stroke', d => d.id === selectedNodeId ? '#FFFFFF' : '#05070E')
      .attr('stroke-width', d => d.id === selectedNodeId ? 3.5 : 1.8);

    // Glowing Inner Core
    node.append('circle')
      .attr('r', d => Math.max(3, d.size * 0.45))
      .attr('fill', '#FFFFFF')
      .attr('opacity', 0.9);

    // Primary Labels
    node.append('text')
      .text(d => d.label)
      .attr('font-size', d => d.node_type === 'DOCUMENT' ? '12.5px' : '11px')
      .attr('font-family', 'Outfit, sans-serif')
      .attr('font-weight', d => d.node_type === 'DOCUMENT' ? '700' : '500')
      .attr('fill', '#F8FAFC')
      .attr('dy', d => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))');

    // Period / Vintage Pill Text
    node.filter(d => !!d.period)
      .append('text')
      .text(d => d.period || '')
      .attr('font-size', '9.5px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#94A3B8')
      .attr('dy', d => d.size + 28)
      .attr('text-anchor', 'middle');

    // Simulation Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GalaxyNode).x || 0)
        .attr('y1', d => (d.source as GalaxyNode).y || 0)
        .attr('x2', d => (d.target as GalaxyNode).x || 0)
        .attr('y2', d => (d.target as GalaxyNode).y || 0);

      linkLabels.attr('transform', d => {
        const sx = (d.source as GalaxyNode).x || 0;
        const sy = (d.source as GalaxyNode).y || 0;
        const tx = (d.target as GalaxyNode).x || 0;
        const ty = (d.target as GalaxyNode).y || 0;
        return `translate(${(sx + tx) / 2}, ${(sy + ty) / 2 - 10})`;
      });

      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // Auto-fit framing so both clusters are 100% visible on load
    const fitToViewport = (animated = true) => {
      if (!nodes || nodes.length === 0) return;
      const minX = d3.min(nodes, d => d.x) ?? 0;
      const maxX = d3.max(nodes, d => d.x) ?? width;
      const minY = d3.min(nodes, d => d.y) ?? 0;
      const maxY = d3.max(nodes, d => d.y) ?? height;

      const graphWidth = Math.max(100, maxX - minX + 220);
      const graphHeight = Math.max(100, maxY - minY + 220);

      const scale = Math.min(1.0, Math.max(0.35, Math.min((width * 0.94) / graphWidth, (height * 0.92) / graphHeight)));
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const targetTransform = d3.zoomIdentity
        .translate(width / 2 - midX * scale, height / 2 - midY * scale)
        .scale(scale);

      if (animated) {
        svg.transition().duration(700).ease(d3.easeCubicOut).call(zoom.transform, targetTransform);
      } else {
        svg.call(zoom.transform, targetTransform);
      }
    };
    fitGraphRef.current = () => fitToViewport(true);

    // Initial warm-up ticks and auto-fit on start
    for (let i = 0; i < 35; ++i) simulation.tick();
    fitToViewport(false);
    const fitTimer = setTimeout(() => fitToViewport(true), 400);

    return () => {
      clearTimeout(fitTimer);
      simulation.stop();
    };
  }, [graphData, selectedNodeId]);

  return (
    <div ref={containerRef} className="galaxy-viewport">
      {/* 3D Force Canvas */}
      <svg ref={svgRef} className="galaxy-svg" />

      {/* Top Left HUD Stats Pill */}
      <div className="galaxy-hud-stats">
        <div className="hud-stat-item">
          <span className="hud-dot emerald" />
          <span>Facts: <strong style={{ color: '#FFFFFF' }}>{graphData.total_facts}</strong></span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <div className="hud-stat-item">
          <span className="hud-dot emerald" />
          <span>Corroborated: <strong style={{ color: '#34D399' }}>{graphData.corroboration_count}</strong></span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <div className="hud-stat-item">
          <span className="hud-dot red" />
          <span>Contradictions: <strong style={{ color: '#FB7185' }}>{graphData.contradiction_count}</strong></span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fitGraphRef.current();
          }}
          style={{
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            border: '1px solid rgba(165, 180, 252, 0.5)',
            color: '#FFFFFF',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            pointerEvents: 'auto',
            boxShadow: 'none',
            transition: 'all 0.15s ease'
          }}
          title="Auto-fit both clusters into the viewport without scrolling"
        >
          <Maximize2 size={13} />
          <span>Fit Universe</span>
        </button>
      </div>

      {/* Hover Card Inspector */}
      {hoveredNode && (
        <div className="galaxy-hover-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className={`hover-badge ${hoveredNode.status === 'CONTRADICTION' ? 'clash' : 'normal'}`}>
              {hoveredNode.node_type}
            </span>
            {hoveredNode.status === 'CONTRADICTION' && (
              <span className="hover-badge clash">CLASH DETECTED</span>
            )}
          </div>
          <h4 className="hover-title">{hoveredNode.label}</h4>
          {hoveredNode.secondary_label && (
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
              {hoveredNode.secondary_label}
            </p>
          )}
          <div className="hover-meta-grid">
            {hoveredNode.period && <div>Period: <span style={{ color: '#E2E8F0' }}>{hoveredNode.period}</span></div>}
            {hoveredNode.vintage && <div>Vintage: <span style={{ color: '#E2E8F0' }}>{hoveredNode.vintage}</span></div>}
            {hoveredNode.document_id && <div>Doc: <span style={{ color: '#A5B4FC' }}>{hoveredNode.document_id}</span></div>}
            {hoveredNode.page_number && <div>Page: <span style={{ color: '#E2E8F0' }}>{hoveredNode.page_number}</span></div>}
          </div>
        </div>
      )}

      {/* Bottom Bar: Timeline */}
      <div className="time-machine-capsule">
        <div className="time-title">
          <Clock size={14} />
          <span>Timeline</span>
        </div>

        <div className="time-buttons-row">
          <button
            onClick={() => onYearChange(null)}
            className={`time-btn ${selectedYear === null ? 'active' : ''}`}
          >
            All Time
          </button>

          {graphData.available_years.map(yr => (
            <button
              key={yr}
              onClick={() => onYearChange(yr)}
              className={`time-btn ${selectedYear === yr ? 'active' : ''}`}
            >
              {yr}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsPlayingTimeMachine(!isPlayingTimeMachine)}
          className={`play-timeline-btn ${isPlayingTimeMachine ? 'active' : ''}`}
        >
          {isPlayingTimeMachine ? 'Pause Timeline' : 'Play Timeline'}
        </button>
      </div>
    </div>
  );
};
