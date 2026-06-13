import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Calendar, Activity, Cpu, Sparkles, Filter, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface InteractivePatternTimelineProps {
  draws: LottoDraw[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

interface PatternHighlight {
  type: 'repeat' | 'prime_hotspot' | 'pair_clash';
  num?: number;
  drawA: string;
  drawB: string;
  numbers: number[];
  intensity: number; // 0 to 1
  description: string;
}

export default function InteractivePatternTimeline({
  draws,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: InteractivePatternTimelineProps) {
  const d3ContainerRef = useRef<SVGSVGElement | null>(null);
  const [timelineZoom, setTimelineZoom] = useState<'all' | 'recent' | 'pairs'>('recent');
  const [hoveredData, setHoveredData] = useState<{
    draw: LottoDraw;
    sum: number;
    oddEven: string;
    primes: number;
    x: number;
    y: number;
  } | null>(null);

  const [activePatternHighlight, setActivePatternHighlight] = useState<PatternHighlight | null>(null);

  // Math helper
  const isPrime = (num: number): boolean => {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

  // Reverse chronological list for D3 rendering sequence
  const renderedDraws = useMemo(() => {
    const sorted = [...draws].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (timelineZoom === 'recent') {
      return sorted.slice(-10);
    }
    return sorted;
  }, [draws, timelineZoom]);

  // Analyze relationships
  const detectedPatterns = useMemo(() => {
    const list: PatternHighlight[] = [];
    if (renderedDraws.length < 2) return list;

    for (let i = 0; i < renderedDraws.length; i++) {
      const drawCurrent = renderedDraws[i];

      // 1. Prime Hotspot detection (4 or more primes in one slice)
      const primeCount = drawCurrent.numbers.filter(isPrime).length;
      if (primeCount >= 4) {
        list.push({
          type: 'prime_hotspot',
          drawA: drawCurrent.id,
          drawB: drawCurrent.id,
          numbers: drawCurrent.numbers.filter(isPrime),
          intensity: 0.85,
          description: `Sir, slice ${drawCurrent.date} holds a unique Prime density hotspot with ${primeCount} primes!`
        });
      }

      // Look back for consecutive connection lines
      if (i > 0) {
        const drawPrev = renderedDraws[i - 1];

        // 2. Trans-temporal consecutive repeating numbers
        drawCurrent.numbers.forEach(num => {
          if (drawPrev.numbers.includes(num)) {
            list.push({
              type: 'repeat',
              num,
              drawA: drawPrev.id,
              drawB: drawCurrent.id,
              numbers: [num],
              intensity: 0.9,
              description: `Consecutive repetition detected. Number ${num} migrated from ${drawPrev.date} into ${drawCurrent.date}.`
            });
          }
        });

        // 3. Common pairs patterns (draws sharing 2+ numbers anywhere in active viewport)
        for (let j = 0; j < i; j++) {
          const drawCompare = renderedDraws[j];
          const common = drawCurrent.numbers.filter(n => drawCompare.numbers.includes(n));
          if (common.length >= 2) {
            list.push({
              type: 'pair_clash',
              drawA: drawCompare.id,
              drawB: drawCurrent.id,
              numbers: common,
              intensity: 0.7 + (common.length * 0.1),
              description: `Temporal Resonance lock. Draws ${drawCompare.date} and ${drawCurrent.date} share symmetric pairing: [${common.join(', ')}].`
            });
          }
        }
      }
    }
    return list;
  }, [renderedDraws]);

  // Main D3 Rendering Hook
  useEffect(() => {
    const svgEl = d3ContainerRef.current;
    if (!svgEl) return;

    // Reset element
    d3.select(svgEl).selectAll('*').remove();

    const containerWidth = svgEl.clientWidth || 800;
    const containerHeight = 300;
    const margin = { top: 35, right: 40, bottom: 50, left: 45 };

    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(svgEl)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define Grid coordinate scales
    const xScale = d3.scalePoint()
      .domain(renderedDraws.map(d => d.date))
      .range([0, width])
      .padding(0.4);

    const yScale = d3.scaleLinear()
      .domain([1, 49])
      .range([height, 0]);

    // Render cybernetic grid background segments
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line.horizontal')
      .data([10, 20, 30, 40])
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('y1', d => yScale(d))
      .attr('x2', width)
      .attr('y2', d => yScale(d))
      .attr('stroke', 'rgba(30, 41, 59, 0.45)')
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '3,3');

    // Add time axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => {
        const dateObj = new Date(d);
        return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      });

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => `#${d}`);

    const gX = svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    gX.selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '8px')
      .attr('fill', '#94a3b8')
      .attr('dy', '1em');

    gX.selectAll('line').attr('stroke', '#1e293b');
    gX.select('.domain').attr('stroke', '#1e293b');

    const gY = svg.append('g')
      .call(yAxis);

    gY.selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '8px')
      .attr('fill', '#94a3b8');

    gY.selectAll('line').attr('stroke', '#1e293b');
    gY.select('.domain').attr('stroke', '#1e293b');

    // Gradient definitions inside defs
    const defs = d3.select(svgEl).append('defs');

    // Repeat transition line gradient
    defs.append('linearGradient')
      .attr('id', 'repeat-neon-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%')
      .html(`
        <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0.9" />
      `);

    defs.append('linearGradient')
      .attr('id', 'pair-res-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%')
      .html(`
        <stop offset="0%" stop-color="#ec4899" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0.05" />
      `);

    // Draw connecting bezier arches for repeating digits
    detectedPatterns.forEach((pat) => {
      const drawAObj = renderedDraws.find(d => d.id === pat.drawA);
      const drawBObj = renderedDraws.find(d => d.id === pat.drawB);

      if (drawAObj && drawBObj) {
        const xA = xScale(drawAObj.date) || 0;
        const xB = xScale(drawBObj.date) || 0;

        if (pat.type === 'repeat' && pat.num) {
          const yVal = yScale(pat.num);
          const controlY = yVal - Math.abs(xB - xA) * 0.35; // Arch offset
          
          // Bezier path string
          const pathString = `M ${xA} ${yVal} Q ${(xA + xB) / 2} ${controlY} ${xB} ${yVal}`;

          svg.append('path')
            .attr('d', pathString)
            .attr('fill', 'none')
            .attr('stroke', 'url(#repeat-neon-grad)')
            .attr('stroke-width', '2')
            .style('cursor', 'pointer')
            .style('filter', 'drop-shadow(0px 0px 4px rgba(34, 211, 238, 0.45))')
            .on('mouseover', function(e) {
              d3.select(this).attr('stroke-width', '4');
              // Highlight selected pattern
              setActivePatternHighlight(pat);
            })
            .on('mouseout', function() {
              d3.select(this).attr('stroke-width', '2');
            })
            .on('click', () => {
              onApplyNumbers(pat.numbers);
              addToast('TIMELINE VECTOR EXTRACTION', `Symmetric pattern locked. Sequence loaded.`, 'success');
              if (isTTSEnabled) {
                playSpeech(`Polarizing recurring vector points. Number ${pat.num} loaded.`);
              }
            });
        } else if (pat.type === 'pair_clash') {
          // Draw connecting polygon band for matching multiple structures
          pat.numbers.forEach(num => {
            const yVal = yScale(num);
            
            // Render straight connector bar
            svg.append('line')
              .attr('x1', xA)
              .attr('y1', yVal)
              .attr('x2', xB)
              .attr('y2', yVal)
              .attr('stroke', 'rgba(236, 72, 153, 0.4)')
              .attr('stroke-width', '1')
              .attr('stroke-dasharray', '2,2')
              .style('cursor', 'pointer')
              .on('mouseover', () => {
                setActivePatternHighlight(pat);
              });
          });
        }
      }
    });

    // Draw sequential lines connecting draw coordinates (temporal trend charts)
    renderedDraws.forEach((draw) => {
      const xPos = xScale(draw.date) || 0;
      
      // Draw thin vertical lines backing each draw
      svg.append('line')
        .attr('x1', xPos)
        .attr('y1', 0)
        .attr('x2', xPos)
        .attr('height', height)
        .attr('y2', height)
        .attr('stroke', 'rgba(51, 65, 85, 0.25)')
        .attr('stroke-width', '1');

      // Draw numerical nodes within slices
      draw.numbers.forEach(num => {
        const yPos = yScale(num);
        const isHighlightItem = activePatternHighlight && activePatternHighlight.numbers.includes(num);

        const circle = svg.append('circle')
          .attr('cx', xPos)
          .attr('cy', yPos)
          .attr('r', isHighlightItem ? 7.5 : 5.5)
          .attr('fill', d => {
            if (isPrime(num)) return 'rgba(168, 85, 247, 0.85)';
            return 'rgba(15, 23, 42, 0.9)';
          })
          .attr('stroke', d => {
            if (isHighlightItem) return '#06b6d4';
            if (isPrime(num)) return '#c084fc';
            return 'rgba(100, 116, 139, 0.7)';
          })
          .attr('stroke-width', isHighlightItem ? '2.5' : '1.2')
          .style('cursor', 'pointer')
          .style('transition', 'all 0.2s');

        // Mouse behaviors
        circle.on('mouseover', function(event) {
          d3.select(this)
            .attr('r', 9.5)
            .attr('fill', '#06b6d4')
            .attr('stroke', '#ffffff');

          const primesNum = draw.numbers.filter(isPrime).length;
          const sum = draw.numbers.reduce((s, n) => s + n, 0);
          const oddCount = draw.numbers.filter(n => n % 2 !== 0).length;
          const evenCount = 6 - oddCount;

          setHoveredData({
            draw,
            primes: primesNum,
            sum,
            oddEven: `${oddCount}O / ${evenCount}E`,
            x: xPos + margin.left,
            y: yPos + margin.top
          });
        });

        circle.on('mouseout', function() {
          d3.select(this)
            .attr('r', isHighlightItem ? 7.5 : 5.5)
            .attr('fill', isPrime(num) ? 'rgba(168, 85, 247, 0.85)' : 'rgba(15, 23, 42, 0.9)')
            .attr('stroke', isHighlightItem ? '#06b6d4' : (isPrime(num) ? '#c084fc' : 'rgba(100, 116, 139, 0.7)'))
            .attr('stroke-width', isHighlightItem ? '2.5' : '1.2');

          setHoveredData(null);
        });

        circle.on('click', () => {
          onApplyNumbers(draw.numbers);
          addToast('DRAW SEQUENCE SELECTION', `Loaded complete timeline sequence of ${draw.date}.`, 'info');
          if (isTTSEnabled) {
            playSpeech(`Transmitting drawing coordinate set from ${draw.date}.`);
          }
        });
      });
    });

  }, [renderedDraws, activePatternHighlight, detectedPatterns]);

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/25 transition-all duration-500 relative overflow-hidden my-1">
      
      {/* HUD scanning pulse decoration */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#06b6d4] opacity-35 animate-[scanline_8s_infinite] pointer-events-none" />

      <header className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-slate-800/85 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-cyan-455 uppercase">Interactive Temporal Pattern D3.js Timeline</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">SECURED VISUAL DECRYPT OF PAST DRAW HISTORIES</p>
          </div>
        </div>

        {/* Viewport controls */}
        <div className="flex bg-slate-900 border border-slate-950 p-1 rounded-lg gap-1 max-w-sm select-none">
          <button
            onClick={() => setTimelineZoom('recent')}
            className={`px-2.5 py-1 rounded text-[8px] font-mono tracking-wider font-extrabold uppercase transition cursor-pointer ${
              timelineZoom === 'recent' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 10 Draws
          </button>
          <button
            onClick={() => setTimelineZoom('all')}
            className={`px-2.5 py-1 rounded text-[8px] font-mono tracking-wider font-extrabold uppercase transition cursor-pointer ${
              timelineZoom === 'all' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Extended Scale ({draws.length})
          </button>
        </div>
      </header>

      {/* SVG Canvas layout wrapper */}
      <div className="relative bg-slate-950/80 border border-slate-900 rounded-2xl min-h-[300px]">
        <svg ref={d3ContainerRef} className="w-full h-full block" />

        {/* Real-time Hover Popup Coordinates Overlay */}
        <AnimatePresence>
          {hoveredData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                position: 'absolute',
                left: Math.min(hoveredData.x + 12, (d3ContainerRef.current?.clientWidth || 800) - 165), 
                top: Math.max(hoveredData.y - 75, 10) 
              }}
              className="bg-slate-950/95 border border-cyan-400/40 rounded-xl p-3 font-mono text-[8.5px] shadow-[0_0_20px_rgba(6,182,212,0.3)] pointer-events-none select-none z-40 flex flex-col gap-1 w-[155px]"
            >
              <div className="flex items-center gap-1 text-cyan-400 font-extrabold uppercase border-b border-slate-900 pb-1 mb-1 leading-normal">
                <Calendar className="w-3 h-3 text-cyan-500" />
                <span>{hoveredData.draw.date}</span>
              </div>
              <div className="flex gap-1 items-center flex-wrap my-1">
                {hoveredData.draw.numbers.map(n => (
                  <span 
                    key={n} 
                    className={`w-4 h-4 rounded text-[7.5px] flex items-center justify-center font-bold font-mono border ${
                      isPrime(n) ? 'bg-purple-950/40 border-purple-500/30 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-350'
                    }`}
                  >
                    {n}
                  </span>
                ))}
              </div>
              <span className="text-slate-450 font-medium">Coordinate Sum: <strong className="text-slate-300 font-bold">{hoveredData.sum}</strong></span>
              <span className="text-slate-450 font-medium">Parity: <strong className="text-slate-300 font-bold">{hoveredData.oddEven}</strong></span>
              <span className="text-slate-450 font-medium">Core Primes: <strong className="text-purple-400 font-bold">{hoveredData.primes} / 6</strong></span>
              <p className="text-[7.5px] text-cyan-500 font-bold uppercase mt-1 leading-none">Click nodes to apply set</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Absolute Background Legend info details */}
        <div className="absolute bottom-3 left-4 font-mono text-[7px] text-slate-600 pointer-events-none select-none flex flex-row items-center gap-4 uppercase font-bold">
          <div className="flex items-center gap-1.5XY">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Regular Nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Prime Numbers</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-[2px] bg-cyan-400 block" />
            <span>Temporal Migration Repeat Connectors</span>
          </div>
        </div>
      </div>

      {/* Interactive Bottom Focus pattern feedback info bar */}
      <footer className="z-10 flex gap-2.5 items-center bg-black/45 border border-slate-900 rounded-xl px-3 py-2.5 min-h-[46px] select-none">
        {activePatternHighlight ? (
          <div className="flex-1 flex justify-between items-center gap-4">
            <div className="flex gap-2 items-center">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-305">
                {activePatternHighlight.description}
              </span>
            </div>
            
            <button
              onClick={() => {
                onApplyNumbers(activePatternHighlight.numbers);
                addToast('TIMELINE RESTRUCTURED', 'Selected sequence from active pattern loaded.', 'success');
              }}
              className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider border border-cyan-500/30 transition cursor-pointer shrink-0 active:scale-95"
            >
              APPLY SEQUENCE
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[9px] uppercase font-bold">
            <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Hover over temporal repeat connections or prime nodes to unlock cybernetic breakdown metrics from J.A.R.V.I.S. database scans.</span>
          </div>
        )}
      </footer>

    </div>
  );
}
