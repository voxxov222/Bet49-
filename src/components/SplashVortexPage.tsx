import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  HelpCircle, 
  Clock, 
  Calendar, 
  TrendingUp, 
  RotateCw,
  Cpu,
  Bookmark,
  Compass,
  Database,
  History,
  Zap,
  Network,
  Hexagon
} from 'lucide-react';

import { REGIONS_DATABASE, RegionGrid, LotterySystem, LottoDraw as RegionalLottoDraw } from '../data/regions';
import { ShieldAlert, ArrowLeft, Target, Globe, ChevronRight } from 'lucide-react';

interface SplashVortexPageProps {
  draws: RegionalLottoDraw[];
  onEnter: (regionName: string, configName: string, regionalDraws: RegionalLottoDraw[]) => void;
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
}

export default function SplashVortexPage({
  draws,
  onEnter,
  playSpeech,
  isTTSEnabled
}: SplashVortexPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeTab, setActiveTab] = useState<'tetra' | 'spiral'>('tetra');

  // Interactive Geolocation step state
  const [currentStep, setCurrentStep] = useState<'intro' | 'location' | 'lottery' | 'confirm'>('intro');
  const [selectedRegion, setSelectedRegion] = useState<RegionGrid | null>(null);
  const [selectedLottery, setSelectedLottery] = useState<LotterySystem | null>(null);

  // Math: Procedurally build vertices for a 3D star tetrahedron structure/cluster (64-tetrahedron layout)
  const vertices3D = useMemo(() => {
    const coords: { x: number; y: number; z: number }[] = [];
    
    // Procedural generation of a 3-dimensional Vector Equilibrium & Isotropic Vector Matrix
    // Repeating 64 coordinates forming a cluster of interconnected tetrahedrons
    const offsets = [
      { x: 0, y: 0, z: 0 },
      { x: -1.5, y: -1, z: -1 }, { x: 1.5, y: -1, z: -1 }, { x: 0, y: 2, z: -1 }, { x: 0, y: -1, z: 2 },
      { x: -1.5, y: 1, z: 1 }, { x: 1.5, y: 1, z: 1 }, { x: 0, y: -2, z: 1 }, { x: 0, y: 1, z: -2 },
    ];

    // Base tetrahedron relative nodes
    const baseNodes = [
      { x: 0, y: 0.8, z: 0 },
      { x: -0.7, y: -0.3, z: 0.4 },
      { x: 0.7, y: -0.3, z: 0.4 },
      { x: 0, y: -0.3, z: -0.6 }
    ];

    offsets.forEach(offset => {
      baseNodes.forEach(node => {
        coords.push({
          x: (node.x + offset.x) * 1.4,
          y: (node.y + offset.y) * 1.4,
          z: (node.z + offset.z) * 1.4
        });
      });
    });

    // Add extra spatial nodes to pad exactly 64 coordinates for high density
    while (coords.length < 64) {
      const idx = coords.length % baseNodes.length;
      coords.push({
        x: baseNodes[idx].x * (1.2 + coords.length * 0.05),
        y: baseNodes[idx].y * (1.2 + coords.length * 0.05),
        z: baseNodes[idx].z * (1.2 + coords.length * 0.05)
      });
    }

    return coords.slice(0, 64);
  }, []);

  // Compute edges based on euclidean distance separation
  const edges3D = useMemo(() => {
    const pairLimits: [number, number][] = [];
    for (let i = 0; i < vertices3D.length; i++) {
      for (let j = i + 1; j < vertices3D.length; j++) {
        const dx = vertices3D[i].x - vertices3D[j].x;
        const dy = vertices3D[i].y - vertices3D[j].y;
        const dz = vertices3D[i].z - vertices3D[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Connect nodes if they rest in immediate tetrahedral proximity spacing
        if (dist > 0.8 && dist < 2.9) {
          pairLimits.push([i, j]);
        }
      }
    }
    return pairLimits;
  }, [vertices3D]);

  // Next Draw Time calculation: Lotto 649 is traditionally drawn Wednesdays and Saturdays at 10:30 PM
  const nextDrawDate = useMemo(() => {
    const now = new Date();
    // Wednesday is 3, Saturday is 6
    let target = new Date();
    target.setHours(22, 30, 0, 0); // 10:30 PM

    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let daysToAdd = 0;
    
    if (currentDay === 3) { // Today is Wednesday
      if (currentHour > 22 || (currentHour === 22 && currentMin >= 30)) {
        daysToAdd = 3; // Jump to Saturday
      } else {
        daysToAdd = 0; // Today later
      }
    } else if (currentDay === 6) { // Today is Saturday
      if (currentHour > 22 || (currentHour === 22 && currentMin >= 30)) {
        daysToAdd = 4; // Jump to Wednesday
      } else {
        daysToAdd = 0; // Today later
      }
    } else {
      // Calculate closest Wed (3) or Sat (6)
      if (currentDay < 3) {
        daysToAdd = 3 - currentDay;
      } else if (currentDay < 6) {
        daysToAdd = 6 - currentDay;
      } else { // Sunday (0)
        daysToAdd = 3; 
      }
    }

    target.setDate(now.getDate() + daysToAdd);
    return target;
  }, []);

  // Update live countdown trigger
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = nextDrawDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, [nextDrawDate]);

  // Read top 3 drawings for fast feedback
  const past3Draws = useMemo(() => {
    return draws.slice(0, 3);
  }, [draws]);

  // Canvas Animation loop handling rotating 64-tetrahedron and vortex spirals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angleX = 0.007;
    let angleY = 0.009;
    let angleZ = 0.004;

    // Fluid particles array for ambient vortex core
    const particles: { angle: number; r: number; speed: number; size: number; alpha: number; cycleId: number }[] = [];
    for (let p = 0; p < 180; p++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        r: 30 + Math.random() * 220,
        speed: 0.015 + Math.random() * 0.025,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.6,
        cycleId: Math.floor(Math.random() * 49) + 1
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // Deep cosmic alpha wipe
      ctx.fillStyle = 'rgba(2, 6, 23, 0.16)';
      ctx.fillRect(0, 0, w, h);

      // Increment rotation speeds gently
      angleX += 0.0025;
      angleY += 0.0035;
      angleZ += 0.0018;

      const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
      const cosZ = Math.cos(angleZ), sinZ = Math.sin(angleZ);

      // 1. Draw glowing background transparent Hexagonal Spiral Map
      const drawHexagonSpiral = () => {
        const cx = w / 2;
        const cy = h / 2;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.035)';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Archimedean Spiral containing hexagon points
        for (let idx = 1; idx <= 49; idx++) {
          const theta = idx * 0.52 + (angleZ * 0.2); // Golden spiral wrap
          const r = 24 + idx * 4.4; // gradual radial outward expansion
          
          const x = cx + Math.sin(theta) * r;
          const y = cy + Math.cos(theta) * r;

          // Render miniature transparent structural hexagon
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const hAngle = (s * Math.PI) / 3;
            const hx = x + Math.cos(hAngle) * 9;
            const hy = y + Math.sin(hAngle) * 9;
            if (s === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();

          // Write faint golden numeric index
          ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
          ctx.fillText(idx < 10 ? `0${idx}` : `${idx}`, x, y);
        }
      };

      drawHexagonSpiral();

      // 2. Draw 3D projected wireframe 64-tetrahedron rotating crystal matrix
      const projectedNodes: { x: number; y: number; originalZ: number }[] = [];
      const cx = w / 2;
      const cy = h / 2;
      
      // Compute responsive 3D projection scaling
      const perspectiveScale = Math.min(w, h) * 0.42;
      const cameraZOffset = 4.5;

      vertices3D.forEach(node => {
        // Rotate Z-axis
        let x1 = node.x * cosZ - node.y * sinZ;
        let y1 = node.x * sinZ + node.y * cosZ;
        let z1 = node.z;

        // Rotate Y-axis
        let x2 = x1 * cosY + z1 * sinY;
        let y2 = y1;
        let z2 = -x1 * sinY + z1 * cosY;

        // Rotate X-axis
        let x3 = x2;
        let y3 = y2 * cosX - z2 * sinX;
        let z3 = y2 * sinX + z2 * cosX;

        // Perspective Projection calculation
        const perspectiveFactor = perspectiveScale / (z3 + cameraZOffset);
        projectedNodes.push({
          x: cx + x3 * perspectiveFactor,
          y: cy + y3 * perspectiveFactor,
          originalZ: z3
        });
      });

      // Draw wireframe edges with relative Z-depth shading
      edges3D.forEach(([startIdx, endIdx]) => {
        const startNode = projectedNodes[startIdx];
        const endNode = projectedNodes[endIdx];

        // Draw only if nodes stay reasonably inside screen
        if (
          startNode.x >= 0 && startNode.x <= w &&
          startNode.y >= 0 && startNode.y <= h &&
          endNode.x >= 0 && endNode.x <= w &&
          endNode.y >= 0 && endNode.y <= h
        ) {
          const avgZ = (startNode.originalZ + endNode.originalZ) / 2.0;
          const opacity = Math.max(0.04, Math.min(0.5, ((avgZ + 2.0) / 4.0))); // Dynamic depth opacity

          ctx.beginPath();
          ctx.moveTo(startNode.x, startNode.y);
          ctx.lineTo(endNode.x, endNode.y);

          // Custom cyber color gradient based on Depth Map
          const val = Math.floor(opacity * 255);
          ctx.strokeStyle = `rgba(${val / 2}, ${120 + val / 2}, 255, ${opacity * 0.5})`;
          ctx.lineWidth = 0.75 + opacity * 0.85;
          ctx.stroke();
        }
      });

      // Draw nodal glowing dots on vertices
      projectedNodes.forEach((node, i) => {
        const zValue = node.originalZ;
        if (zValue > -2.0) {
          const size = 1.0 + (zValue + 2.0) * 1.5;
          const ringRad = size * 2.2;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
          ctx.fillStyle = i % 5 === 0 ? 'rgba(168, 85, 247, 0.8)' : 'rgba(6, 182, 212, 0.8)';
          ctx.fill();

          // Subtle neon dot ring halo
          ctx.beginPath();
          ctx.arc(node.x, node.y, ringRad, 0, Math.PI * 2);
          ctx.strokeStyle = i % 5 === 0 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(6, 182, 212, 0.2)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      // 3. Draw stunning spiraling Vortex and celestial particles
      particles.forEach(p => {
        p.angle -= p.speed; // Rotation spiral inwards
        p.r -= 0.35; // gradually fall into vortex singularity

        // Reset particle position if it sinks to center structure
        if (p.r < 18) {
          p.r = 210 + Math.random() * 50;
          p.angle = Math.random() * Math.PI * 2;
        }

        const px = cx + Math.sin(p.angle) * p.r;
        const py = cy + Math.cos(p.angle) * p.r;

        // Draw particle trail dot
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        
        const coreAlpha = p.alpha * (p.r / 200.0); // Fades away near outer edge / center
        ctx.fillStyle = p.cycleId % 3 === 0 
          ? `rgba(168, 85, 247, ${coreAlpha * 0.95})` 
          : p.cycleId % 3 === 1 
            ? `rgba(6, 182, 212, ${coreAlpha * 0.95})` 
            : `rgba(245, 158, 11, ${coreAlpha * 0.95})`;

        ctx.fill();

        // Let some particles show tiny numbers rotating
        if (p.cycleId % 11 === 0 && p.r > 80 && p.r < 170) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.font = '7px monospace';
          ctx.fillText(p.cycleId.toString(), px + p.size + 2, py + 1.5);
        }
      });

      // 4. Central Vector singularity core
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [vertices3D, edges3D]);

  // Audio prompt on arrival
  useEffect(() => {
    const speechText = "Welcome to Lotto 649 Tactical Mainframe. Swarm systems initialized. Next sequence draw date and reference indices are loaded, sir. Synchronize matrix deck to enter.";
    if (isTTSEnabled) {
      playSpeech(speechText);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[99999] flex flex-col md:flex-row items-stretch overflow-hidden font-sans">
      
      {/* LEFT PORTION: mesmeric 3D Canvas rendering window */}
      <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.1),#020617)] overflow-hidden flex flex-col justify-between p-6">
        {/* Absolute canvas container */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block cursor-crosshair opacity-90" />
        
        {/* Custom branding metadata indicators */}
        <div className="relative z-10 flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-purple-950 border border-purple-500/30 flex items-center justify-center">
              <Hexagon className="w-3.5 h-3.5 text-purple-400 rotate-12" />
            </div>
            <span className="text-[10px] font-mono font-black tracking-widest text-slate-300 uppercase">SYS_MODEL: COOPERATIVE_CORE</span>
          </div>

          <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded text-[8px] font-mono text-purple-300">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
            <span>ORTHOGONAL VORTEX ONLINE</span>
          </div>
        </div>

        {/* Floating live mathematical indicators overlay */}
        <div className="relative z-10 flex flex-col gap-1.5 self-start pointer-events-none select-none max-w-sm">
          <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest">TETRAHEDRON SEED MATRIX (64-T)</span>
          <h1 className="text-3xl font-sans font-black text-slate-100 tracking-tight leading-none uppercase">
            MATRIX SPIRAL v9.4
          </h1>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5 leading-normal">
            Procedurally spinning vectors represent the 6/49 coordinate geometry. Interconnected dense prime vertices attract recurrence points in historical spacetime.
          </p>
        </div>

        {/* Minimal status labels down below */}
        <div className="relative z-10 flex justify-between items-end select-none">
          <div className="flex flex-col font-mono text-[8.5px] text-slate-600 gap-1 uppercase">
            <span>Grid Status: Synchronized (64/64 Nodes)</span>
            <span>Vortex Speed: 4.88 Rad/S</span>
          </div>
          
          <div className="text-[8.5px] font-mono text-slate-600 uppercase">
            6/49 ENSEMBLE VECTOR DECKS
          </div>
        </div>
      </div>

      {/* RIGHT PORTION: interactive setup console parameters */}
      <div className="w-full md:w-[480px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800/80 z-10 flex flex-col justify-between p-6 md:p-8 overflow-y-auto shrink-0 relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Subtle decorative futuristic grid markings layout */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
        
        {/* Header Branding */}
        <div className="flex flex-col gap-2 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/5">
              <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-sans font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                <span>bet49 TACTICAL HUB</span>
                <span className="text-[8.5px] bg-slate-950 text-sky-400 border border-sky-500/10 px-1 py-0.5 rounded font-mono uppercase leading-none">OS v5.2</span>
              </div>
              <span className="text-[9.5px] text-slate-500 font-mono tracking-wide mt-1 block uppercase">GEO-COORDINATED LOTTERY COGNITIVE AI PLATFORM</span>
            </div>
          </div>
        </div>

        {/* Dynamic Stepper Rendering */}
        <div className="my-5 flex-1 flex flex-col justify-center min-h-[340px]">
          <AnimatePresence mode="wait">
            {currentStep === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="flex flex-col gap-4"
              >
                {/* LIVE HIGHLIGHT: NEXT DRAWING CLOCK AND STAMP */}
                <div className="bg-gradient-to-br from-purple-950/25 to-slate-950 border border-purple-500/15 rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-2 rounded bg-purple-500 animate-ping m-3.5" />
                  <div className="absolute top-0 right-0 w-2 h-2 rounded bg-purple-500 m-3.5" />

                  <div className="flex items-center gap-2 font-mono text-[8.5px] text-purple-400 font-black uppercase tracking-widest bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/10 self-start">
                    <Clock className="w-3.5 h-3.5" />
                    <span>LIVE NEXT DRAW COUNTDOWN</span>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="text-xs font-sans font-extrabold text-slate-100 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>Wednesday, June 17, 2026</span>
                    </h3>
                    <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5 uppercase">EST Draw Window: 10:30 PM (Wednesday/Saturday Schedule)</span>
                  </div>

                  {/* Glowing Chrono Timer digits block */}
                  <div className="mt-3 bg-slate-950/80 border border-slate-900 rounded-xl p-2.5 grid grid-cols-4 gap-1.5 text-center select-none">
                    <div className="flex flex-col">
                      <span className="text-lg font-mono font-black text-white tracking-widest leading-none">
                        {countdown.days < 10 ? `0${countdown.days}` : countdown.days}
                      </span>
                      <span className="text-[7px] font-mono text-slate-500 uppercase mt-1">Days</span>
                    </div>
                    
                    <div className="flex flex-col border-l border-slate-900">
                      <span className="text-lg font-mono font-black text-purple-400 tracking-widest leading-none">
                        {countdown.hours < 10 ? `0${countdown.hours}` : countdown.hours}
                      </span>
                      <span className="text-[7px] font-mono text-slate-500 uppercase mt-1">Hrs</span>
                    </div>

                    <div className="flex flex-col border-l border-slate-900">
                      <span className="text-lg font-mono font-black text-indigo-400 tracking-widest leading-none">
                        {countdown.minutes < 10 ? `0${countdown.minutes}` : countdown.minutes}
                      </span>
                      <span className="text-[7px] font-mono text-slate-500 uppercase mt-1">Mins</span>
                    </div>

                    <div className="flex flex-col border-l border-slate-900">
                      <span className="text-lg font-mono font-black text-cyan-400 tracking-widest leading-none animate-pulse">
                        {countdown.seconds < 10 ? `0${countdown.seconds}` : countdown.seconds}
                      </span>
                      <span className="text-[7px] font-mono text-slate-500 uppercase mt-1">Secs</span>
                    </div>
                  </div>
                </div>

                {/* QUICK REFERENCE SUMMARY: LAST THREE DRAWINGS */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 select-none">
                    <div className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <h4 className="text-[9.5px] font-mono font-black text-slate-300 tracking-wider uppercase">HISTORICAL REFERENCE DRAWINGS</h4>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {past3Draws.map((d, index) => {
                      return (
                        <div 
                          key={d.id} 
                          className="bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-xl flex items-center justify-between transition-all duration-300"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-mono text-slate-500 font-bold uppercase">SEQUENCE INDEX: 0{d.id}</span>
                            <span className="text-[9.5px] font-mono text-purple-400 font-extrabold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {d.date}
                            </span>
                          </div>

                          {/* Balls line sequence */}
                          <div className="flex gap-1 select-none shrink-0">
                            {d.numbers.map(num => (
                              <span 
                                key={num}
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 border border-purple-500/25 flex items-center justify-center font-sans font-black text-[9.5px] text-slate-200 shadow-[inset_0_-1px_4px_rgba(0,0,0,0.5)]"
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-2.5 select-none">
                  <button
                    onClick={() => {
                      setCurrentStep('location');
                      if (isTTSEnabled) {
                        playSpeech("Terminal mapping live satellite grids. Please specify your geographical coordinates, sir.");
                      }
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-mono font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all duration-300 transform hover:scale-[1.01] active:scale-95 group"
                  >
                    <Play className="w-4 h-4 text-white" />
                    <span>SYNCHRONIZE TACTICAL ENGINES</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-[8px] font-mono text-slate-500 text-center uppercase tracking-wide block mt-2">
                    Accepting unified neural weights will overwrite local tactile memory cards
                  </span>
                </div>
              </motion.div>
            )}

            {currentStep === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="flex flex-col gap-3 py-1"
              >
                <div className="border-b border-purple-500/10 pb-2">
                  <span className="text-[7.5px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase">STEP 01 // GEOLOCATION DECK</span>
                  <h3 className="text-sm font-sans font-black text-slate-100 uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Select Local Satellite Grid</span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Lottery systems vary by coordinates, states, and provinces. Select your central geographical matrix.
                  </p>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-[280px] pr-1">
                  {REGIONS_DATABASE.map(region => (
                    <button
                      key={region.id}
                      onClick={() => {
                        setSelectedRegion(region);
                        setCurrentStep('lottery');
                        if (isTTSEnabled) {
                          playSpeech(`Coordinate verified. Retrieving registered systems for ${region.name}.`);
                        }
                      }}
                      className="w-full text-left bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 p-3 rounded-xl flex items-center justify-between transition-all duration-300 hover:bg-slate-900 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none">
                          {region.flag}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[11.5px] font-mono font-bold text-slate-200 group-hover:text-cyan-300 uppercase transition-colors">
                            {region.name}
                          </span>
                          <span className="text-[8px] font-mono text-slate-500">
                            COORD // {region.coordinate}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentStep('intro')}
                  className="mt-2.5 py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-xl text-slate-400 hover:text-slate-350 font-mono text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Main Deck</span>
                </button>
              </motion.div>
            )}

            {currentStep === 'lottery' && selectedRegion && (
              <motion.div
                key="lottery"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="flex flex-col gap-3 py-1"
              >
                <div className="border-b border-purple-500/10 pb-2">
                  <span className="text-[7.5px] font-mono text-purple-400 font-extrabold tracking-widest uppercase">STEP 02 // LOTTERY REGISTER</span>
                  <h3 className="text-sm font-sans font-black text-slate-100 uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                    <Target className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span>Select Specific State/Province</span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Select the active lottery terminal mapping from the <span className="text-cyan-400 font-black">{selectedRegion.name}</span> list.
                  </p>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-[280px] pr-1">
                  {selectedRegion.lotteries.map(lottery => (
                    <button
                      key={lottery.id}
                      onClick={() => {
                        setSelectedLottery(lottery);
                        setCurrentStep('confirm');
                        if (isTTSEnabled) {
                          playSpeech(`Mouthpiece configured. Preparing neural indices for ${lottery.name}.`);
                        }
                      }}
                      className="w-full text-left bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/30 p-2.5 rounded-xl flex flex-col gap-1 transition-all duration-300 hover:bg-slate-900 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-mono font-extrabold text-slate-200 group-hover:text-purple-300 uppercase transition-colors">
                          {lottery.name}
                        </span>
                        <span className="text-[8px] bg-purple-950/40 text-purple-400 border border-purple-500/15 px-1.5 py-0.5 rounded font-mono break-all font-bold">
                          {lottery.formula}
                        </span>
                      </div>
                      <p className="text-[9px] font-mono text-slate-500 leading-normal line-clamp-2">
                        {lottery.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[7.5px] font-mono text-slate-605">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="uppercase">{lottery.schedule}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 select-none">
                  <button
                    onClick={() => setCurrentStep('location')}
                    className="py-2 border border-slate-800 hover:border-slate-750 bg-slate-950/40 rounded-xl text-slate-400 hover:text-slate-350 font-mono text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all duration-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRegion(null);
                      setCurrentStep('location');
                    }}
                    className="py-2 border border-slate-800 hover:border-slate-750 bg-slate-950/40 rounded-xl text-slate-400 hover:text-slate-350 font-mono text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all duration-200"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>All Regions</span>
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'confirm' && selectedRegion && selectedLottery && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="flex flex-col gap-3 py-1"
              >
                <div className="border-b border-purple-500/10 pb-2">
                  <span className="text-[7.5px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase">STEP 03 // CALIBRATION CONFIRM</span>
                  <h3 className="text-sm font-sans font-black text-slate-100 uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                    <Hexagon className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span>Initialize Terminal Index</span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    Parameters compiled successfully. The E8 spatial matrices and predictive neural modules will orient to:
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex flex-col gap-2 font-mono text-[10px] select-none text-slate-300">
                  <div className="flex justify-between items-center bg-slate-900/30 p-1.5 rounded">
                    <span className="text-slate-500">SYS_LOCATION:</span>
                    <span className="font-bold text-white uppercase text-right">{selectedRegion.name}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/30 p-1.5 rounded">
                    <span className="text-slate-500">SYS_LOTTERY:</span>
                    <span className="font-bold text-cyan-400 uppercase text-right leading-none max-w-[200px] truncate">{selectedLottery.name}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/30 p-1.5 rounded">
                    <span className="text-slate-500">MATRIX_FORMAT:</span>
                    <span className="font-bold text-purple-400 uppercase text-right">{selectedLottery.formula}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/30 p-1.5 rounded">
                    <span className="text-slate-500">SEED_SAMPLES:</span>
                    <span className="font-bold text-emerald-400 uppercase text-right">{selectedLottery.draws.length} Historical Records</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 select-none">
                  <button
                    onClick={() => {
                      if (isTTSEnabled) {
                        playSpeech(`System engaged. Cognitive neural matrices locked onto ${selectedLottery.name}. Processing E8 quasi crystals and Linear multi layer regressors now.`);
                      }
                      onEnter(selectedRegion.name, selectedLottery.name, selectedLottery.draws);
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all duration-300 hover:scale-[1.01]"
                  >
                    <Zap className="w-4 h-4 text-slate-950" />
                    <span>LAUNCH COGNITIVE SYSTEM</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep('lottery')}
                    className="py-2 border border-slate-800 hover:border-slate-750 bg-slate-950/40 rounded-xl text-slate-400 hover:text-slate-350 font-mono text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all duration-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Modify Lottery Target</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimal status labels down below */}
        <div className="pt-2 border-t border-slate-800/40 flex justify-between items-end select-none">
          <div className="flex flex-col font-mono text-[8px] text-slate-600 gap-0.5 uppercase">
            <span>Terminal state: {currentStep}</span>
            <span>Network: active ssl</span>
          </div>
          
          <div className="text-[8px] font-mono text-slate-600 uppercase">
            COGNITIVE INTERCEPT V5.2
          </div>
        </div>

      </div>

    </div>
  );
}
