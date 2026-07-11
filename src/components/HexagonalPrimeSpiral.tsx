import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Sparkles, HelpCircle, RefreshCw, Cpu, Activity, Info, Check, ToggleLeft, ShieldAlert } from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface HexagonalPrimeSpiralProps {
  draws: LottoDraw[];
  activeProposedNumbers: number[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

interface HexPoint {
  num: number;
  x: number;
  y: number;
  isPrime: boolean;
  ring: number;
}

export default function HexagonalPrimeSpiral({
  draws,
  activeProposedNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: HexagonalPrimeSpiralProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [maxNodes, setMaxNodes] = useState<number>(91); // Show up to 91 (fits perfectly on hex grid ring 5)
  const [spiralSpeed, setSpiralSpeed] = useState<number>(0.005);
  const [hoveredNode, setHoveredNode] = useState<HexPoint | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [showFlowPaths, setShowFlowPaths] = useState(true);
  const [harmonicFilter, setHarmonicFilter] = useState<'all' | 'primes' | 'vortex' | 'consensus'>('all');

  // Math: Check Prime
  const isPrime = (num: number): boolean => {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

  // Dynamic Hex spiral node calculations
  const hexNodes = useMemo(() => {
    const nodes: HexPoint[] = [];
    nodes.push({ num: 1, x: 0, y: 0, isPrime: false, ring: 0 });

    let currentNum = 2;
    let ring = 1;

    // Loop through outer rings
    while (currentNum <= maxNodes) {
      const ringPointsCount = 6 * ring;
      
      for (let s = 0; s < 6; s++) {
        // Hexagon corner coordinates
        const angleA = (s * Math.PI) / 3;
        const angleB = (((s + 1) % 6) * Math.PI) / 3;

        const ax = Math.cos(angleA) * ring;
        const ay = Math.sin(angleA) * ring;
        const bx = Math.cos(angleB) * ring;
        const by = Math.sin(angleB) * ring;

        for (let k = 0; k < ring; k++) {
          if (currentNum > maxNodes) break;

          // Interpolate points between adjacent corners to make a flat hex ring side
          const t = k / ring;
          const px = ax + t * (bx - ax);
          const py = ay + t * (by - ay);

          nodes.push({
            num: currentNum,
            x: px * 36, // scale multiplier
            y: py * 36,
            isPrime: isPrime(currentNum),
            ring
          });
          currentNum++;
        }
      }
      ring++;
    }

    return nodes;
  }, [maxNodes]);

  // Rotator ticker loop
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setRotationAngle(prev => (prev + spiralSpeed) % (Math.PI * 2));
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [spiralSpeed]);

  // Check hover positions on the canvas coordinate space
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Translate mouse coords matching internal rot matrix
    const tx = mouseX - cx;
    const ty = mouseY - cy;

    // Rotate mouse backwards by rotationAngle to match static hexNodes array mapping
    const cosR = Math.cos(-rotationAngle);
    const sinR = Math.sin(-rotationAngle);

    const nx = tx * cosR - ty * sinR;
    const ny = tx * sinR + ty * cosR;

    let closest: HexPoint | null = null;
    let minDist = 18; // hover bounds

    hexNodes.forEach(node => {
      const dist = Math.hypot(node.x - nx, node.y - ny);
      if (dist < minDist) {
        minDist = dist;
        closest = node;
      }
    });

    setHoveredNode(closest);
  };

  // Canvas visual draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize matching bounding sizes
    const container = containerRef.current;
    if (container) {
      if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationAngle);

    // 1. Draw connecting hexagonal spiral pathway
    if (showFlowPaths && hexNodes.length > 1) {
      ctx.beginPath();
      ctx.moveTo(hexNodes[0].x, hexNodes[0].y);
      for (let i = 1; i < hexNodes.length; i++) {
        ctx.lineTo(hexNodes[i].x, hexNodes[i].y);
      }
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Draw mathematical vortex sequence overlaps: Vortex math (1, 2, 4, 8, 7, 5)
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)'; // Radiant vortex rose color
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      let started = false;
      const vortexBase = [1, 2, 4, 8, 7, 5];
      hexNodes.forEach(node => {
        const baseNum = node.num % 9;
        const vortexMatch = vortexBase.includes(baseNum === 0 ? 9 : baseNum);
        if (vortexMatch && node.num <= 49) {
          if (!started) {
            ctx.moveTo(node.x, node.y);
            started = true;
          } else {
            ctx.lineTo(node.x, node.y);
          }
        }
      });
      ctx.stroke();
    }

    // 2. Draw outer grid bounding hexagon lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.1)';
    ctx.lineWidth = 0.5;
    for (let r = 1; r <= 5; r++) {
      ctx.beginPath();
      for (let s = 0; s <= 6; s++) {
        const angle = (s * Math.PI) / 3;
        const hx = Math.cos(angle) * r * 36;
        const hy = Math.sin(angle) * r * 36;
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.stroke();
    }

    // 3. Render Node spheres
    hexNodes.forEach(node => {
      // Apply filters
      const isVortex = [1, 2, 4, 8, 7, 5].includes((node.num % 9) === 0 ? 9 : (node.num % 9));
      const isConsensusOverlap = draws[0]?.numbers?.includes(node.num) ?? false;

      if (harmonicFilter === 'primes' && !node.isPrime) return;
      if (harmonicFilter === 'vortex' && (!isVortex || node.num > 49)) return;
      if (harmonicFilter === 'consensus' && !isConsensusOverlap) return;

      const isProposed = activeProposedNumbers.includes(node.num);
      const isHovered = hoveredNode?.num === node.num;

      let radius = 6;
      let fillCol = 'rgba(15, 23, 42, 0.9)';
      let strokeCol = 'rgba(100, 116, 139, 0.5)';
      ctx.shadowBlur = 0;

      if (isProposed) {
        radius = 11;
        fillCol = '#22d3ee'; // Neon Cyan
        strokeCol = '#ffffff';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
      } else if (node.isPrime) {
        radius = 8;
        fillCol = '#a855f7'; // Velvet Purple
        strokeCol = '#e9d5ff';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 6;
      } else if (isConsensusOverlap) {
        radius = 7.5;
        fillCol = '#ec4899'; // Hot Magenta
        strokeCol = '#fbcfe8';
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillCol;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = isProposed || isHovered ? 2 : 1;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset

      // Add small core numeric labels inside prominent nodes
      const drawingNumbers = draws[0]?.numbers || [];
      if (node.num <= 49 && (node.isPrime || isProposed || isHovered || isConsensusOverlap)) {
        ctx.save();
        // Counter rotate text so numbers remain upright
        ctx.translate(node.x, node.y);
        ctx.rotate(-rotationAngle);
        
        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = isProposed || isPrime(node.num) ? '#ffffff' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(node.num), 0, 0);
        ctx.restore();
      }
    });

    ctx.restore();
  }, [hexNodes, rotationAngle, activeProposedNumbers, hoveredNode, showFlowPaths, harmonicFilter, draws]);

  // Handle clicking a node to extract/toggle
  const handleCanvasClick = () => {
    if (hoveredNode && hoveredNode.num <= 49) {
      const selectedNum = hoveredNode.num;
      onApplyNumbers([selectedNum]);
      addToast(
        'VORTEX PRIME CONVERGENCE',
        `Locked sensor tracking on Spiral Node #${selectedNum}.`,
        'success'
      );
      if (isTTSEnabled) {
        playSpeech(`Spiral node ${selectedNum} selected.`);
      }
    }
  };

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/25 transition-all duration-500 relative overflow-hidden">
      
      {/* Glancing laser light */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#06b6d4] opacity-35 animate-[scanline_7s_infinite] pointer-events-none" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800/80 pb-3 select-none">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-cyan-450 uppercase">Hexagonal Prime Spiral Matrix</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">SECURED HARMONIC COORDINATE OVERLAYS & 124857 VORTEX ROOTS</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex bg-slate-900 border border-slate-950 p-1 rounded-lg gap-1 select-none">
          {(['all', 'primes', 'vortex', 'consensus'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setHarmonicFilter(filter)}
              className={`px-2 py-1 rounded text-[8px] font-mono tracking-widest font-black uppercase cursor-pointer transition ${
                harmonicFilter === filter
                  ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Main Canvas projection deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Canvas panel */}
        <div 
          ref={containerRef}
          className="lg:col-span-8 bg-slate-950 border border-slate-900 rounded-2xl h-[310px] relative overflow-hidden flex items-center justify-center cursor-crosshair"
        >
          <canvas 
            ref={canvasRef} 
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
            className="w-full h-full block" 
          />

          {/* Dynamic math indicators overlay */}
          <div className="absolute top-4 left-4 font-mono text-[8px] text-slate-500 pointer-events-none select-none uppercase font-bold flex flex-col gap-0.5 opacity-80">
            <span>ROTATION_SWEEP: {rotationAngle.toFixed(3)} RAD</span>
            <span>SPIRAL_SPEED: {spiralSpeed.toFixed(4)} Hz</span>
            <span>MODEL_INTEGERS: {maxNodes} NODES (MAX)</span>
            <span>FILTER: {harmonicFilter}</span>
          </div>

          {/* Floating Hover node card */}
          <AnimatePresence>
            {hoveredNode && hoveredNode.num <= 49 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 left-4 bg-slate-950/95 border border-cyan-400/40 rounded-xl p-3 font-mono text-[8.5px] shadow-[0_0_15px_rgba(6,182,212,0.25)] pointer-events-none select-none z-30 flex flex-col gap-1 w-[170px]"
              >
                <div className="flex items-center justify-between border-b border-slate-900 pb-0.5">
                  <span className="text-cyan-400 font-extrabold uppercase">NODE #{hoveredNode.num}</span>
                  <span className="text-[7.5px] text-slate-500">RING {hoveredNode.ring}</span>
                </div>
                <span>TYPE: {hoveredNode.isPrime ? <strong className="text-purple-400 font-bold uppercase">PRIME HOTSPOT</strong> : <span className="text-slate-400">COMPOSITE LATTICE</span>}</span>
                <span>VORTEX ROOT Math: <strong className="text-pink-400 font-bold">{(hoveredNode.num % 9) === 0 ? 9 : (hoveredNode.num % 9)}</strong></span>
                <span>PROPOSED STATE: {activeProposedNumbers.includes(hoveredNode.num) ? <strong className="text-cyan-400 font-bold">ACTIVE</strong> : 'STANDBY'}</span>
                <p className="text-[7px] text-cyan-500 font-bold uppercase mt-1 leading-none">Click root to select node</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controller selectors within canvas corners */}
          <div className="absolute bottom-4 right-4 flex gap-1.5 select-none">
            <button
              onClick={() => setShowFlowPaths(prev => !prev)}
              className={`px-2 py-1 rounded text-[8px] font-mono uppercase font-black tracking-wider transition cursor-pointer border ${
                showFlowPaths 
                  ? 'border-cyan-500/35 text-cyan-400 bg-cyan-950/25' 
                  : 'border-slate-800 text-slate-500 bg-slate-950/50 hover:text-slate-400'
              }`}
            >
              FLOW PATHS: {showFlowPaths ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                setSpiralSpeed(prev => (prev === 0 ? 0.005 : 0));
              }}
              className="px-2 py-1 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-455 rounded text-[8px] font-mono uppercase font-black tracking-wider transition cursor-pointer"
            >
              {spiralSpeed === 0 ? 'SWEEP ENGINE ON' : 'PAUSE SCAN'}
            </button>
          </div>
        </div>

        {/* Context diagnostics metadata sidebar panel */}
        <div className="lg:col-span-4 bg-black/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-550 animate-pulse" />
              PRIMAL RESIDENCE ANALYSIS
            </span>

            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              The hexagonal prime spiral (Abbott 2005) arrays consecutive numbers in concentric 60° triangular grids. Prime clusters align on specific diagonal arrays of vortex equations ($3n^2 + bn + c$), exposing high-probability density roots.
            </p>

            <div className="flex flex-col gap-2 bg-black/40 p-2.5 rounded border border-slate-900/60 font-mono text-[8.5px] leading-relaxed">
              <div className="flex justify-between">
                <span className="text-slate-500">TOTAL PRIMES IN MODEL:</span>
                <span className="text-purple-400 font-extrabold">{hexNodes.filter(n => n.isPrime && n.num <= 49).length} / 15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VORTEX 1-2-4-8-7-5 INTEGRATORS:</span>
                <span className="text-pink-400 font-extrabold">{hexNodes.filter(n => [1,2,4,8,7,5].includes(n.num % 9 === 0 ? 9 : n.num % 9) && n.num <= 49).length} / 49</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CONSENSUS OVERLAPS (LAST DRAW):</span>
                <span className="text-cyan-450 font-black">{(draws[0]?.numbers || []).filter(n => isPrime(n)).length} PRIMES</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-3 border-t border-slate-900/65">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none">PRIME DIAGONALS POLARIZER:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const primeNums = hexNodes.filter(n => n.isPrime && n.num <= 49).map(n => n.num).slice(0, 6);
                  onApplyNumbers(primeNums);
                  addToast('PRIME HARMONICS LOCKED', 'Spiral mathematical primes loaded into computation deck.', 'success');
                }}
                className="py-2 bg-purple-950/25 hover:bg-purple-900/30 active:scale-95 text-[9.5px] font-mono text-purple-300 rounded border border-purple-500/25 transition cursor-pointer text-center font-extrabold"
              >
                APPLY ALL PRIMES ➜
              </button>
              <button
                onClick={() => {
                  const vortexNums = [1, 2, 4, 8, 7, 5].slice(0, 6);
                  onApplyNumbers(vortexNums);
                  addToast('VORTEX ROOTS APPLIED', 'Vortex multiplier 1-2-4-8-7-5 loaded.', 'success');
                }}
                className="py-2 bg-pink-950/25 hover:bg-pink-900/30 active:scale-95 text-[9.5px] font-mono text-pink-300 rounded border border-pink-500/25 transition cursor-pointer text-center font-extrabold"
              >
                APPLY VORTEX ROOTS ➜
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
