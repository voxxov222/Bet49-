import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Sparkles, HelpCircle, RefreshCw, Cpu, Activity, Info, Check, ToggleLeft, ShieldAlert, Zap, Layers, Network } from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface PrimeSpiralExplorerProps {
  draws: LottoDraw[];
  activeProposedNumbers: number[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

interface ModelPoint {
  num: number;
  x: number;
  y: number;
  z: number;
  isPrime: boolean;
  isSemiprime: boolean;
  clusterId: number; // -1 for noise, otherwise cluster index
  modulo12: number;
  // Canvas projections
  px: number;
  py: number;
  dScale: number;
}

export default function PrimeSpiralExplorer({
  draws,
  activeProposedNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: PrimeSpiralExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Projection modes corresponding to Prime Spiral Explorer images
  type ViewType = 'dbscan' | 'modulo12' | 'fibonacciSphere' | 'helixPrimesSemiprimes';
  const [viewType, setViewType] = useState<ViewType>('dbscan');

  // Math variables & parameter tweaking
  const [maxNodes, setMaxNodes] = useState<number>(300); // Higher bounds of exploration
  const [dbscanEps, setDbscanEps] = useState<number>(38); // DBSCAN neighborhood distance (px)
  const [dbscanMinPts, setDbscanMinPts] = useState<number>(3); // DBSCAN min neighbors
  const [rotationX, setRotationX] = useState<number>(0.25); // Interactive 3D pitch
  const [rotationY, setRotationY] = useState<number>(0.45); // Interactive 3D yaw
  const [zoom, setZoom] = useState<number>(1.0);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<ModelPoint | null>(null);

  // 1. Primality Checkers
  const isPrime = (num: number): boolean => {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

  const isSemiprime = (num: number): boolean => {
    if (num <= 3) return false;
    let factorCount = 0;
    let temp = num;
    for (let i = 2; i * i <= temp; i++) {
      while (temp % i === 0) {
        factorCount++;
        temp /= i;
        if (factorCount > 2) return false;
      }
    }
    if (temp > 1) factorCount++;
    return factorCount === 2;
  };

  // 2. Compute base properties of the points (1 to MaxNodes)
  const basePoints = useMemo(() => {
    const pts = [];
    for (let num = 1; num <= maxNodes; num++) {
      pts.push({
        num,
        isPrime: isPrime(num),
        isSemiprime: isSemiprime(num),
        modulo12: num % 12
      });
    }
    return pts;
  }, [maxNodes]);

  // 3. Coordinate layouts & DBSCAN clustering
  const pointsWithCoordinates = useMemo(() => {
    const rawCoords: ModelPoint[] = [];

    basePoints.forEach(p => {
      let x = 0, y = 0, z = 0;

      if (viewType === 'fibonacciSphere') {
        // Fibonacci Sphere Mapping (distributes nodes evenly on a 3D sphere)
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const i = p.num;
        const phi = Math.acos(1 - 2 * (i - 0.5) / maxNodes);
        const theta = 2 * Math.PI * i / goldenRatio;
        const r = 160;

        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);

      } else {
        // Helix Spacing models: Archimedean spiral extended along Y or Z
        const theta = p.num * 0.22; // Sweep rate
        const r = 16 * Math.sqrt(p.num); // Helix radius increases logarithmically

        x = Math.cos(theta) * r;
        z = Math.sin(theta) * r;
        y = (p.num - maxNodes / 2) * 1.1; // Helix height distribution
      }

      rawCoords.push({
        ...p,
        x,
        y,
        z,
        clusterId: -1, // default to noise
        px: 0,
        py: 0,
        dScale: 1
      });
    });

    // Run client-side DBSCAN clustering on the 3D projected coordinates if 'dbscan' view is selected
    if (viewType === 'dbscan') {
      const getDistance = (a: ModelPoint, b: ModelPoint) => {
        return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      };

      const neighbors = (pt: ModelPoint) => {
        return rawCoords.filter(other => other.num !== pt.num && getDistance(pt, other) < dbscanEps);
      };

      let currentClusterId = 0;
      const visited = new Set<number>();
      const clustered = new Set<number>();

      rawCoords.forEach(pt => {
        if (visited.has(pt.num)) return;
        visited.add(pt.num);

        const ptsNeighbors = neighbors(pt);
        if (ptsNeighbors.length < dbscanMinPts) {
          // Leave clusterId as -1 (noise)
        } else {
          pt.clusterId = currentClusterId;
          clustered.add(pt.num);

          let queue = [...ptsNeighbors];
          for (let i = 0; i < queue.length; i++) {
            const nextPt = queue[i];
            if (!visited.has(nextPt.num)) {
              visited.add(nextPt.num);
              const nextNeighbors = neighbors(nextPt);
              if (nextNeighbors.length >= dbscanMinPts) {
                queue.push(...nextNeighbors.filter(n => !queue.some(q => q.num === n.num)));
              }
            }
            if (!clustered.has(nextPt.num)) {
              nextPt.clusterId = currentClusterId;
              clustered.add(nextPt.num);
            }
          }
          currentClusterId++;
        }
      });
    }

    return rawCoords;
  }, [basePoints, viewType, dbscanEps, dbscanMinPts, maxNodes]);

  // Rotate continuously in background
  useEffect(() => {
    if (!isRotating) return;
    let frameId: number;
    const rotate = () => {
      setRotationY(prev => (prev + 0.0035) % (Math.PI * 2));
      frameId = requestAnimationFrame(rotate);
    };
    frameId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(frameId);
  }, [isRotating]);

  // Project coordinates onto 2D viewport
  const projectedPoints = useMemo(() => {
    if (!canvasRef.current) return [];
    const canvas = canvasRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fov = 350;

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosP = Math.cos(rotationX);
    const sinP = Math.sin(rotationX);

    return pointsWithCoordinates.map(pt => {
      // Yaw rotation (rotationY)
      const x1 = pt.x * cosY - pt.z * sinY;
      const z1 = pt.x * sinY + pt.z * cosY;

      // Pitch rotation (rotationX)
      const y2 = pt.y * cosP - z1 * sinP;
      const z2 = pt.y * sinP + z1 * cosP;

      // Perspective Scale matching distance
      const dScale = fov / (fov + z2 * zoom);
      const px = cx + x1 * zoom * dScale;
      const py = cy + y2 * zoom * dScale;

      return {
        ...pt,
        px,
        py,
        dScale
      };
    });
  }, [pointsWithCoordinates, rotationX, rotationY, zoom, canvasRef.current]);

  // Canvas Drawing & Render Loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synchronize bounding sizing
    const container = containerRef.current;
    if (container) {
      if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sort nodes back to front for paining perspective accuracy
    const sortedPoints = [...projectedPoints].sort((a, b) => b.dScale - a.dScale);

    // 1. Draw connecting spiral grid lattice
    if (viewType !== 'fibonacciSphere') {
      ctx.beginPath();
      let started = false;
      ctx.strokeStyle = 'rgba(74, 85, 104, 0.12)';
      ctx.lineWidth = 1;
      sortedPoints.forEach(pt => {
        if (!started) {
          ctx.moveTo(pt.px, pt.py);
          started = true;
        } else {
          ctx.lineTo(pt.px, pt.py);
        }
      });
      ctx.stroke();
    }

    // 2. Draw nodes depending on selected viewType
    sortedPoints.forEach(pt => {
      let radius = Math.max(3.5, 6.5 * pt.dScale);
      let fillStyle = 'rgba(15, 23, 42, 0.9)';
      let strokeStyle = 'rgba(100, 116, 139, 0.4)';
      let shadowBlur = 0;
      let shadowColor = '';

      const isProposed = activeProposedNumbers.includes(pt.num);
      const isHovered = hoveredPoint?.num === pt.num;

      if (isProposed) {
        radius = Math.max(8, 12 * pt.dScale);
        fillStyle = '#22d3ee'; // Cyber Neon Cyan
        strokeStyle = '#ffffff';
        shadowColor = '#06b6d4';
        shadowBlur = 12;
      } else if (isHovered) {
        radius = Math.max(7, 10 * pt.dScale);
        fillStyle = '#ffffff';
        strokeStyle = '#06b6d4';
        shadowColor = '#22d3ee';
        shadowBlur = 6;
      } else {
        switch (viewType) {
          case 'dbscan':
            // Highlighting Cluster groupings from density analysis
            if (pt.clusterId !== -1) {
              const clusterColors = [
                '#a855f7', // Purple
                '#f43f5e', // Rose Pink
                '#10b981', // Emerald Green
                '#eab308', // Amber
                '#3b82f6', // Bright Blue
                '#ec4899', // Hot Pink
                '#06b6d4'  // Cyan
              ];
              const colIdx = pt.clusterId % clusterColors.length;
              fillStyle = clusterColors[colIdx];
              strokeStyle = '#ffffff';
              // Check if currently filtered/selected
              if (selectedClusterId !== null && pt.clusterId !== selectedClusterId) {
                fillStyle += '55'; // opaque/dimmed if not active
                strokeStyle += '33';
              }
            } else {
              fillStyle = '#475569'; // Grey / Noise points
              strokeStyle = '#1e293b';
            }
            break;

          case 'modulo12':
            // Modulo View on Helix (Repeating Residues from 0 to 11)
            const moduloColors = [
              '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#10b981',
              '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
            ];
            fillStyle = moduloColors[pt.modulo12];
            strokeStyle = pt.isPrime ? '#ffffff' : 'rgba(255,255,255,0.15)';
            if (pt.isPrime) {
              shadowColor = fillStyle;
              shadowBlur = 5;
            }
            break;

          case 'fibonacciSphere':
          case 'helixPrimesSemiprimes':
            // Direct highlight: Primes (neon green) vs Semiprimes (pinkish/coral)
            if (pt.isPrime) {
              fillStyle = '#22c55e'; // Vibrant Green
              strokeStyle = '#ffffff';
              shadowColor = '#22c55e';
              shadowBlur = 6;
            } else if (pt.isSemiprime) {
              fillStyle = '#ff7f50'; // Coral
              strokeStyle = '#ffffff';
              shadowColor = '#ff7f50';
              shadowBlur = 5;
            } else {
              fillStyle = 'rgba(71, 85, 105, 0.4)'; // Dimmed default composite nodes
              strokeStyle = 'rgba(148, 163, 184, 0.1)';
            }
            break;
        }
      }

      ctx.save();
      if (shadowBlur > 0) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
      }

      ctx.beginPath();
      ctx.arc(pt.px, pt.py, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = pt.isPrime || isProposed ? 1.5 : 0.8;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Show tiny numbers inside primes/semiprimes if within key grid ranges
      if (pt.num <= 49 && (pt.isPrime || pt.isSemiprime || isProposed || isHovered)) {
        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = isProposed || isHovered ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(pt.num), pt.px, pt.py);
      }
    });

    // 3. Render 3D Axis indicators on bottom left
    const axisLen = 45;
    const ax = 55;
    const ay = canvas.height - 55;

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosP = Math.cos(rotationX);
    const sinP = Math.sin(rotationX);

    const drawAxis = (x: number, y: number, z: number, color: string, label: string) => {
      const rx = x * cosY - z * sinY;
      const rz = x * sinY + z * cosY;
      const ry = y * cosP - rz * sinP;

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + rx, ay + ry);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '8px monospace';
      ctx.fillStyle = color;
      ctx.fillText(label, ax + rx + (rx >= 0 ? 4 : -8), ay + ry + (ry >= 0 ? 4 : -4));
    };

    drawAxis(axisLen, 0, 0, '#ef4444', 'X'); // X Axis
    drawAxis(0, axisLen, 0, '#22c55e', 'Y'); // Y Axis
    drawAxis(0, 0, axisLen, '#3b82f6', 'Z'); // Z Axis

  }, [projectedPoints, viewType, activeProposedNumbers, hoveredPoint, selectedClusterId]);

  // Handle pointer tracking across projected coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Look up point intersections within standard hover radii
    let found: ModelPoint | null = null;
    let minDist = 18;

    projectedPoints.forEach(pt => {
      const dist = Math.hypot(pt.px - x, pt.py - y);
      if (dist < minDist) {
        minDist = dist;
        found = pt;
      }
    });

    setHoveredPoint(found);
  };

  // Select point and load it into primary numbers proposed set
  const handleCanvasClick = () => {
    if (hoveredPoint && hoveredPoint.num <= 49) {
      const selectedNum = hoveredPoint.num;
      onApplyNumbers([selectedNum]);
      addToast(
        'QUANTUM HUD HARMONIC SYNC',
        `Successfully synced tracking telemetry onto Prime Node #${selectedNum}.`,
        'success'
      );
      if (isTTSEnabled) {
        playSpeech(`Hologram point ${selectedNum} selected.`);
      }
    }
  };

  // Extract cluster coordinates
  const getClusterNumbers = (clusterId: number): number[] => {
    return pointsWithCoordinates
      .filter(p => p.clusterId === clusterId && p.num <= 49)
      .map(p => p.num);
  };

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/25 transition-all duration-500 relative overflow-hidden">
      
      {/* HUD Scanner Sweep Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(6,182,212,0.15)_99%,rgba(18,24,38,0)_100%)] bg-[length:100%_40px] animate-[ping_8s_infinite] pointer-events-none opacity-40 z-10" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800/80 pb-3 select-none">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-cyan-450 uppercase">Prime-Spiral-Explorer Spatial Deck</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">MULTIDIMENSIONAL PATTERN DECRYPTION & RESIDUE BANDS ANALYSIS</p>
          </div>
        </div>

        {/* Projection Selector Buttons */}
        <div className="flex flex-wrap bg-slate-900 border border-slate-950 p-1 rounded-lg gap-1">
          <button
            onClick={() => { setViewType('dbscan'); setSelectedClusterId(null); }}
            className={`px-2 py-1 rounded text-[8px] font-mono tracking-widest font-black uppercase cursor-pointer transition ${
              viewType === 'dbscan'
                ? 'bg-cyan-950/60 text-cyan-450 border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DBSCAN Clusters
          </button>
          <button
            onClick={() => { setViewType('modulo12'); setSelectedClusterId(null); }}
            className={`px-2 py-1 rounded text-[8px] font-mono tracking-widest font-black uppercase cursor-pointer transition ${
              viewType === 'modulo12'
                ? 'bg-orange-950/60 text-orange-400 border border-orange-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modulo 12 Residues
          </button>
          <button
            onClick={() => { setViewType('fibonacciSphere'); setSelectedClusterId(null); }}
            className={`px-2 py-1 rounded text-[8px] font-mono tracking-widest font-black uppercase cursor-pointer transition ${
              viewType === 'fibonacciSphere'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fibonacci Sphere
          </button>
          <button
            onClick={() => { setViewType('helixPrimesSemiprimes'); setSelectedClusterId(null); }}
            className={`px-2 py-1 rounded text-[8px] font-mono tracking-widest font-black uppercase cursor-pointer transition ${
              viewType === 'helixPrimesSemiprimes'
                ? 'bg-pink-950/60 text-pink-400 border border-pink-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Primes / Semiprimes Helix
          </button>
        </div>
      </header>

      {/* Primary Interaction Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Hologram Canvas Area */}
        <div 
          ref={containerRef}
          className="lg:col-span-8 bg-slate-950 border border-slate-900 rounded-2xl h-[340px] relative overflow-hidden flex items-center justify-center cursor-move"
          onMouseDown={(e) => {
            // Permit rotation panning via mouse drags
            const startX = e.clientX;
            const startY = e.clientY;
            const onMouseMove = (moveEvt: MouseEvent) => {
              setRotationY(prev => prev + (moveEvt.clientX - startX) * 0.007);
              setRotationX(prev => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + (moveEvt.clientY - startY) * 0.007)));
            };
            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        >
          <canvas 
            ref={canvasRef} 
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
            className="w-full h-full block" 
          />

          {/* Left info box */}
          <div className="absolute top-4 left-4 font-mono text-[8px] text-slate-500 pointer-events-none select-none uppercase font-bold flex flex-col gap-0.5 opacity-90">
            <span>MODEL_PITCH: {rotationX.toFixed(3)} RAD</span>
            <span>MODEL_YAW: {rotationY.toFixed(3)} RAD</span>
            <span>INTEGERS_TRACKED: {maxNodes}</span>
            <span>3D_ZOOM: {zoom.toFixed(2)}x</span>
          </div>

          {/* Hover Card Display */}
          <AnimatePresence>
            {hoveredPoint && hoveredPoint.num <= 49 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 left-4 bg-slate-950/95 border border-cyan-400/40 rounded-xl p-3 font-mono text-[8.5px] shadow-[0_0_15px_rgba(6,182,212,0.25)] pointer-events-none select-none z-30 flex flex-col gap-1 w-[180px]"
              >
                <div className="flex items-center justify-between border-b border-slate-900 pb-0.5">
                  <span className="text-cyan-450 font-extrabold">NODE #{hoveredPoint.num}</span>
                  <span className="text-[7.5px] text-slate-500">{(hoveredPoint.px).toFixed(0)}, {(hoveredPoint.py).toFixed(0)}</span>
                </div>
                <span>TYPE: {
                  hoveredPoint.isPrime ? <strong className="text-green-400 font-bold">MATHEMATICAL PRIME</strong> :
                  hoveredPoint.isSemiprime ? <strong className="text-orange-400 font-bold">SEMIPRIME FACTOR</strong> :
                  <span className="text-slate-400">COMPOSITE LATTICE</span>
                }</span>
                <span>RESIDUE MOD 12: <strong className="text-amber-400 font-semibold">{hoveredPoint.modulo12}</strong></span>
                {viewType === 'dbscan' && (
                  <span>DBSCAN CLUSTER ID: {
                    hoveredPoint.clusterId === -1 ? <span className="text-slate-500">NOISE</span> :
                    <strong className="text-purple-400">CLUSTER {hoveredPoint.clusterId}</strong>
                  }</span>
                )}
                <p className="text-[7px] text-cyan-500 font-bold uppercase mt-1 leading-none">Click to copy telemetry</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle controls right corner inside Canvas */}
          <div className="absolute top-4 right-4 flex gap-1.5 select-none">
            <button
              onClick={() => setIsRotating(prev => !prev)}
              className={`px-2 py-1 rounded text-[8px] font-mono uppercase font-black tracking-wider transition cursor-pointer border ${
                isRotating 
                  ? 'border-cyan-500/35 text-cyan-400 bg-cyan-950/25' 
                  : 'border-slate-800 text-slate-500 bg-slate-950/50'
              }`}
            >
              SPIN: {isRotating ? 'ENGAGED' : 'PAUSED'}
            </button>
            <button
              onClick={() => setZoom(prev => (prev === 1.0 ? 1.4 : prev === 1.4 ? 0.75 : 1.0))}
              className="px-2 py-1 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 rounded text-[8px] font-mono uppercase font-black tracking-wider transition cursor-pointer"
            >
              zoom: {zoom.toFixed(2)}x
            </button>
          </div>
        </div>

        {/* Dashboard Diagnostic Specs Sidebar */}
        <div className="lg:col-span-4 bg-black/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md relative overflow-hidden">
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              INTELLIGENT DENSITY CODES
            </span>

            {/* Explanation matching selected viewType layout */}
            {viewType === 'dbscan' && (
              <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
                <strong>DBSCAN Clusters:</strong> Unsupervised density clusters mapped along the 3D spiral. Adjust epsilon to merge/separate repeating residue sequences of primes.
              </p>
            )}
            {viewType === 'modulo12' && (
              <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
                <strong>modulo 12 color Bands:</strong> Colored according to $n \pmod{12}$. Notice how primes cluster specifically on bands of 1, 5, 7, and 11, forming gorgeous harmonic color trails mirroring the repo's modulo structure.
              </p>
            )}
            {viewType === 'fibonacciSphere' && (
              <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
                <strong>Fibonacci Sphere:</strong> Even coverage over a spherical manifold with a golden angle of $137.649^\circ$, highlighting Primes (Green) and Semiprimes (Coral).
              </p>
            )}
            {viewType === 'helixPrimesSemiprimes' && (
              <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
                <strong>Primes vs Semiprimes:</strong> Discloses distribution boundaries and gaps between primes and numbers with exactly 2 prime divisors.
              </p>
            )}

            {/* Fine Tuning sliders for DBSCAN/Nodes */}
            <div className="flex flex-col gap-3 bg-black/50 p-3 rounded-lg border border-slate-900 select-none">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between font-mono text-[8px] text-slate-500 font-black">
                  <span>DBSCAN NEIGHBORHOOD ESP:</span>
                  <span className="text-cyan-400">{dbscanEps}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="70"
                  value={dbscanEps}
                  onChange={(e) => setDbscanEps(Number(e.target.value))}
                  disabled={viewType !== 'dbscan'}
                  className="w-full h-1 bg-slate-800 rounded outline-none accent-cyan-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between font-mono text-[8px] text-slate-500 font-black">
                  <span>MAX INT NODES IN GRAPH:</span>
                  <span className="text-cyan-400">{maxNodes}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="500"
                  value={maxNodes}
                  onChange={(e) => setMaxNodes(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded outline-none accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Cluster Stats for interactive Extraction */}
            {viewType === 'dbscan' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none">DETECTED DENSITY CORES (≤49):</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 1, 2, 3].map(id => {
                    const clusterNums = getClusterNumbers(id);
                    if (clusterNums.length === 0) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedClusterId(prev => prev === id ? null : id);
                          onApplyNumbers(clusterNums);
                          addToast(
                            'CLUSTER LOCKED',
                            `Synchronized all game-compliant numbers within DBSCAN Cluster #${id}.`,
                            'success'
                          );
                        }}
                        className={`p-1.5 rounded border font-mono text-[8.5px] transition cursor-pointer text-left flex flex-col justify-between h-[42px] ${
                          selectedClusterId === id 
                            ? 'bg-purple-950/40 border-purple-400/50 text-purple-200' 
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className="font-extrabold text-[7.5px] uppercase">CLUSTER #{id}</span>
                        <span className="text-cyan-400 overflow-hidden text-ellipsis whitespace-nowrap w-full">
                          {clusterNums.join(', ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-3 border-t border-slate-900/65">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none">POLAR MATH EXPORTERS:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const primeNums = pointsWithCoordinates.filter(p => p.isPrime && p.num <= 49).map(p => p.num).slice(0, 6);
                  onApplyNumbers(primeNums);
                  addToast('SPATIAL PRIMES SYNCED', 'Loaded the highest density Archimedean spiral primes.', 'success');
                }}
                className="py-1.5 bg-green-950/20 hover:bg-green-900/30 active:scale-95 text-[9px] font-mono text-green-300 rounded border border-green-500/25 transition cursor-pointer text-center font-extrabold uppercase"
              >
                Sync Primes (≤49)
              </button>
              <button
                onClick={() => {
                  const semiprimes = pointsWithCoordinates.filter(p => p.isSemiprime && p.num <= 49).map(p => p.num).slice(0, 6);
                  onApplyNumbers(semiprimes);
                  addToast('SEMIPRIMES SYNCHRONIZED', 'Loaded mathematical semiprimes into active pool.', 'success');
                }}
                className="py-1.5 bg-orange-950/20 hover:bg-orange-900/30 active:scale-95 text-[9px] font-mono text-oranges-350 rounded border border-orange-500/25 transition cursor-pointer text-center font-extrabold uppercase"
              >
                Sync Semiprimes
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
