import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Cpu, 
  Layers, 
  Sliders, 
  Activity, 
  Compass, 
  Eye, 
  RefreshCw, 
  Play, 
  Award, 
  CheckCircle, 
  HelpCircle,
  Database,
  Shield,
  Radio,
  Flame,
  Target
} from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface Hyper4DWaveCollapserProps {
  draws: LottoDraw[];
  activeProposedNumbers: number[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

// 4D Coordinate Definition for Tesseract projection
interface Point4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

// Pre-define 16 vertices of a 4D Hypercube (Tesseract)
const TESSERACT_VERTICES: Point4D[] = [];
for (let x of [-1, 1]) {
  for (let y of [-1, 1]) {
    for (let z of [-1, 1]) {
      for (let w of [-1, 1]) {
        TESSERACT_VERTICES.push({ x, y, z, w });
      }
    }
  }
}

// Define the 32 edges of a tesseract
const TESSERACT_EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) {
  for (let j = i + 1; j < 16; j++) {
    // An edge exists if the two vertices differ in exactly one coordinate dimension
    let diffs = 0;
    if (TESSERACT_VERTICES[i].x !== TESSERACT_VERTICES[j].x) diffs++;
    if (TESSERACT_VERTICES[i].y !== TESSERACT_VERTICES[j].y) diffs++;
    if (TESSERACT_VERTICES[i].z !== TESSERACT_VERTICES[j].z) diffs++;
    if (TESSERACT_VERTICES[i].w !== TESSERACT_VERTICES[j].w) diffs++;
    if (diffs === 1) {
      TESSERACT_EDGES.push([i, j]);
    }
  }
}

export default function Hyper4DWaveCollapser({
  draws,
  activeProposedNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: Hyper4DWaveCollapserProps) {
  // Navigation & Interactive Configurations
  const [activeActivityFunction, setActiveActivityFunction] = useState<'sine' | 'transverse' | 'fibonacci' | 'quantum_noise'>('transverse');
  const [transverseVector, setTransverseVector] = useState<number>(0.65);
  const [eventHorizonFocus, setEventHorizonFocus] = useState<number>(0.8);
  const [quantumStateLevel, setQuantumStateLevel] = useState<number>(40); // User requested 40 state positioning
  const [selectedChips, setSelectedChips] = useState<number[]>([3, 7, 18, 25, 33, 45]);

  // Collapser Execution States
  const [isCollapsing, setIsCollapsing] = useState<boolean>(false);
  const [collapseProgress, setCollapseProgress] = useState<number>(0);
  const [isWaveCollapsed, setIsWaveCollapsed] = useState<boolean>(false);
  const [collapsedResult, setCollapsedResult] = useState<number[]>([]);
  const [collapseQuarkLogs, setCollapseQuarkLogs] = useState<string[]>([]);

  // Canvas Reference for animated 4D WebGL/2D projection
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Advanced rotating angles in 4D space
  const angleXY = useRef<number>(0.01);
  const angleXZ = useRef<number>(0.008);
  const angleXW = useRef<number>(0.012);
  const angleYZ = useRef<number>(0.005);
  const angleYW = useRef<number>(0.015);
  const angleZW = useRef<number>(0.007);

  // Generate the activity values for the grid cells dynamically
  const cellActivities = useMemo(() => {
    const activities = new Float32Array(50);
    for (let i = 1; i <= 49; i++) {
      let val = 0.5;
      if (activeActivityFunction === 'sine') {
        val = (Math.sin(i * 0.4) + 1) / 2;
      } else if (activeActivityFunction === 'transverse') {
        val = (Math.sin(i * transverseVector * 1.5) * Math.cos(i * 0.3) + 1) / 2;
      } else if (activeActivityFunction === 'fibonacci') {
        // Fibonacci sequence mapping approximation
        const fib = [1, 2, 3, 5, 8, 13, 21, 34];
        const distance = Math.min(...fib.map(f => Math.abs(i - f)));
        val = 1 / (1 + distance * 0.3);
      } else if (activeActivityFunction === 'quantum_noise') {
        // pseudo quantum noise
        val = Math.random();
      }
      activities[i] = val;
    }
    return activities;
  }, [activeActivityFunction, transverseVector]);

  // Handle clicking on holographic number chips
  const toggleNumberChip = (num: number) => {
    if (selectedChips.includes(num)) {
      setSelectedChips(prev => prev.filter(c => c !== num));
    } else {
      if (selectedChips.length >= 6) {
        // Replace first
        setSelectedChips(prev => [...prev.slice(1), num].sort((a,b) => a-b));
      } else {
        setSelectedChips(prev => [...prev, num].sort((a,b) => a-b));
      }
    }
  };

  // Main canvas animation loop for 4D Perspective projections
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const scale = Math.min(w, h) * 0.18;

      // Incremental rotations in 4D space
      angleXY.current += 0.005;
      angleXZ.current += 0.003;
      angleXW.current += 0.007;
      angleYZ.current += 0.004;
      angleYW.current += 0.006;
      angleZW.current += 0.002;

      // Rotates point around XY, XZ, XW, YZ, YW, ZW planes
      const rotate4D = (p: Point4D): Point4D => {
        let { x, y, z, w } = p;

        // XY Rotation
        let cos = Math.cos(angleXY.current);
        let sin = Math.sin(angleXY.current);
        let x1 = x * cos - y * sin;
        let y1 = x * sin + y * cos;
        x = x1; y = y1;

        // XZ Rotation
        cos = Math.cos(angleXZ.current);
        sin = Math.sin(angleXZ.current);
        x1 = x * cos - z * sin;
        let z1 = x * sin + z * cos;
        x = x1; z = z1;

        // XW Rotation
        cos = Math.cos(angleXW.current);
        sin = Math.sin(angleXW.current);
        x1 = x * cos - w * sin;
        let w1 = x * sin + w * cos;
        x = x1; w = w1;

        // YZ Rotation
        cos = Math.cos(angleYZ.current);
        sin = Math.sin(angleYZ.current);
        let y2 = y * cos - z * sin;
        z1 = y * sin + z * cos;
        y = y2; z = z1;

        // YW Rotation
        cos = Math.cos(angleYW.current);
        sin = Math.sin(angleYW.current);
        y2 = y * cos - w * sin;
        w1 = y * sin + w * cos;
        y = y2; w = w1;

        // ZW Rotation
        cos = Math.cos(angleZW.current);
        sin = Math.sin(angleZW.current);
        z1 = z * cos - w * sin;
        w1 = z * sin + w * cos;
        z = z1; w = w1;

        return { x, y, z, w };
      };

      // Project 4D to 3D and then 3D to 2D
      const project = (p: Point4D) => {
        const rotated = rotate4D(p);
        
        // 4D to 3D Projection factor
        const d4 = 2.0 + eventHorizonFocus * 0.5;
        const factor4 = d4 / (d4 + rotated.w);
        const x3 = rotated.x * factor4;
        const y3 = rotated.y * factor4;
        const z3 = rotated.z * factor4;

        // 3D to 2D Projection factor
        const d3 = 2.5;
        const factor3 = d3 / (d3 + z3);
        const px = centerX + x3 * factor3 * scale;
        const py = centerY + y3 * factor3 * scale;

        return { x: px, y: py, depth: rotated.z + rotated.w };
      };

      // Project all vertices
      const projectedPoints = TESSERACT_VERTICES.map(project);

      // Draw tesseract edges
      ctx.lineWidth = 1.0;
      TESSERACT_EDGES.forEach(([i, j]) => {
        const pi = projectedPoints[i];
        const pj = projectedPoints[j];

        // Draw dynamic gradient or color based on depth value
        const depthAvg = (pi.depth + pj.depth) / 4;
        const alpha = Math.max(0.1, 0.6 + depthAvg * 0.25);
        
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.moveTo(pi.x, pi.y);
        ctx.lineTo(pj.x, pj.y);
        ctx.stroke();
      });

      // Draw Tesseract vertices (Representing 16 primary quantum portals)
      projectedPoints.forEach((p, idx) => {
        const r = Math.max(3, 5 + p.depth * 1.5);
        ctx.fillStyle = idx % 2 === 0 ? '#a855f7' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // 4. DRAW 40 QUANTUM STATE POSITIONINGS (pulsating orbital particles around center)
      const numParticles = quantumStateLevel;
      const time = Date.now() * 0.001;

      for (let i = 0; i < numParticles; i++) {
        const angle = (i * Math.PI * 2) / numParticles + time * 0.3;
        
        // Use traverse wave vectoring to distort circular orbit into 4D coordinate space wave
        const radiusDistortion = Math.sin(time * 2 + i * 0.5) * 15 * transverseVector;
        const radius = (scale * 1.4) + radiusDistortion;
        
        const orbitX = centerX + Math.cos(angle) * radius;
        const orbitY = centerY + Math.sin(angle) * radius * Math.cos(time * 0.1 + i * 0.1);

        // Render particles with pre-collapse error-correcting colors
        const val = i + 1;
        const isTarget = selectedChips.includes(val);

        ctx.beginPath();
        ctx.arc(orbitX, orbitY, isTarget ? 4.5 : 2.5, 0, Math.PI * 2);
        
        if (isTarget) {
          ctx.fillStyle = '#10b981'; // green for pre-locked targets
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = `rgba(168, 85, 247, ${0.4 + 0.6 * Math.sin(time + i)})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        // Link Target Orbit particles to closest tesseract node
        if (isTarget) {
          const closestNode = projectedPoints[i % 16];
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(orbitX, orbitY);
          ctx.lineTo(closestNode.x, closestNode.y);
          ctx.stroke();
        }
      }

      // Draw visual overlay coordinate bounds
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.font = '7px monospace';
      ctx.fillText(`ψ_t_vector: [${transverseVector.toFixed(4)}]`, 15, 20);
      ctx.fillText(`horizon_focus: [${eventHorizonFocus.toFixed(4)}]`, 15, 32);
      ctx.fillText(`active_state_positioning: [${quantumStateLevel} Level]`, 15, 44);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [eventHorizonFocus, transverseVector, quantumStateLevel, selectedChips]);

  // Execute simultaneous wave function collapse sequence across 4D vector spaces
  const triggerWaveCollapseTest = () => {
    setIsCollapsing(true);
    setCollapseProgress(0);
    setIsWaveCollapsed(false);
    
    setCollapseQuarkLogs([
      `[TRANS-WAVE] Emitting transverse induction waves via traverse transponder...`,
      `[QUARK-ENG] Activating multiple state pre-collapse error correction quarks...`,
      `[QUARK-ERR] Error correction qubits aligned. Noise dampening factor active.`
    ]);

    if (isTTSEnabled) {
      playSpeech("Triggering simultaneous wave function collapse sequence. Aligning 40 quantum state positions, activating event horizon intention loops, and solving 4D space vectors.");
    }

    const collapseSteps = [
      `[TRANS-WAVE] Inducing wave vector: ${transverseVector.toFixed(4)}. State grid energized.`,
      `[HOLO-WIDGET] Reading activity distributions... Mode set to ${activeActivityFunction.toUpperCase()}`,
      `[STATE-LEVEL] Aligning 40 quantum positioning structures with current historical draws...`,
      `[PRE-COLLAPSE] Correcting coordinate path deviation using pre-collapse quarks...`,
      `[WAVE-COLLAPSE] COLLAPSING simultaneous vector probability waves to ground state!`,
      `[STATE-LOCKED] Converged on 6 highly stable coordinates.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < collapseSteps.length) {
        setCollapseQuarkLogs(prev => [...prev, collapseSteps[currentStep]]);
        setCollapseProgress(Math.floor(((currentStep + 1) / collapseSteps.length) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Calculate mathematical collapsed combination
        const results = computeWaveCollapseResult();
        setCollapsedResult(results);
        setIsWaveCollapsed(true);
        setIsCollapsing(false);

        addToast('QUANTUM WAVE COLLAPSED', 'Superposed number states collapsed into ground-state coordinates.', 'success');
        
        if (isTTSEnabled) {
          playSpeech(`Wave collapse accomplished. Highly optimized ground state configuration decoded: ${results.join(', ')}.`);
        }
      }
    }, 700);
  };

  // Computes collapsed numbers based on selected activity, transverse vectoring and selected chips
  const computeWaveCollapseResult = (): number[] => {
    // Collect raw state probabilities
    const candidates = Array.from({ length: 49 }, (_, i) => i + 1);
    
    // Weight each number by its activity density + selected chips boost + historical draws bias
    const weights = candidates.map(num => {
      const activityWeight = cellActivities[num] || 0.5;
      const chipBoost = selectedChips.includes(num) ? 3.0 : 1.0;
      
      // Compute delta bias from draws
      let drawBias = 1.0;
      if (draws.length > 0) {
        const lastNumbers = draws[0].numbers;
        if (lastNumbers.includes(num)) {
          drawBias = 1.4; // slight recursive draw preference
        }
      }

      return {
        num,
        score: activityWeight * chipBoost * drawBias * (0.85 + Math.random() * 0.3)
      };
    });

    // Select the top 6 highest weight coordinates as collapsed nodes
    const sorted = weights.sort((a, b) => b.score - a.score);
    return sorted.slice(0, 6).map(s => s.num).sort((a,b) => a-b);
  };

  return (
    <div id="hyper-4d-wave-collapser" className="bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-500/15 rounded-2xl p-5 flex flex-col gap-6 shadow-[0_4px_35px_rgba(6,182,212,0.06)] hover:border-cyan-500/25 transition-all duration-500 w-full relative overflow-hidden">
      
      {/* Dynamic Cyber background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-80 h-80 bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3.5 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/20 rounded-xl">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-cyan-400 tracking-widest uppercase border border-cyan-500/30 bg-cyan-950/20 px-2 py-0.5 rounded">
              4D Multi-Dimensional Layer
            </span>
            <h3 className="text-sm font-mono font-black tracking-wider text-slate-100 uppercase mt-1 flex items-center gap-2">
              4D HYPER WAVE PROBABILITY COLLAPSE ENGINE
            </h3>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-purple-950/30 border border-purple-500/20 rounded-lg text-purple-400 font-mono text-[10px]">
          <Compass className="w-3.5 h-3.5 text-purple-500" />
          <span>POSITION MODE: <strong className="font-extrabold text-purple-300">40 STATE PARALLAX</strong></span>
        </div>
      </div>

      {/* Main Grid: Holographic settings & Canvas projection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Holographic matrix block & controllers */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Holographic grid select */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
                Holographic Chip Array (Intention Input)
              </span>
              <span className="text-[9px] font-mono text-cyan-500">
                {selectedChips.length}/6 Loaded
              </span>
            </div>
            
            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
              Select key target chips to concentrate localized gravitational resonance in the 4D state vector plane.
            </p>

            {/* Grid display */}
            <div className="grid grid-cols-7 gap-1 mt-1">
              {Array.from({ length: 49 }, (_, i) => i + 1).map(num => {
                const isActive = selectedChips.includes(num);
                const intensityVal = cellActivities[num] || 0.5;

                // Color based on active activity density values
                const bgRgba = isActive 
                  ? 'rgba(16, 185, 129, 0.25)' 
                  : `rgba(6, 182, 212, ${0.05 + intensityVal * 0.15})`;
                const borderClass = isActive 
                  ? 'border-emerald-500' 
                  : `border-cyan-500/${Math.floor(15 + intensityVal * 25)}`;

                return (
                  <button
                    key={num}
                    onClick={() => toggleNumberChip(num)}
                    className="h-6 rounded text-[9.5px] font-mono font-black border transition-all flex flex-col items-center justify-center relative overflow-hidden"
                    style={{ 
                      backgroundColor: bgRgba,
                      borderColor: isActive ? '#10b981' : undefined
                    }}
                    title={`Density score: ${intensityVal.toFixed(2)}`}
                  >
                    <span className={isActive ? 'text-emerald-300' : 'text-slate-300'}>
                      {num}
                    </span>
                    {/* Tiny visual bar representing activity wave strength */}
                    <span 
                      className="absolute bottom-0 left-0 h-[1.5px] bg-cyan-400/50" 
                      style={{ width: `${intensityVal * 100}%` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transponder controllers */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3.5">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Wave Induction Transponder Chip
            </span>

            <div className="flex flex-col gap-3 font-mono text-[10px]">
              
              {/* Activity select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] text-slate-500 uppercase">Traverse Wave Activity Pattern</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'sine', label: 'Sine Induction' },
                    { id: 'transverse', label: 'Transverse Wave' },
                    { id: 'fibonacci', label: 'Fibonacci Core' },
                    { id: 'quantum_noise', label: 'Quantum Noise' }
                  ].map(act => (
                    <button
                      key={act.id}
                      onClick={() => setActiveActivityFunction(act.id as any)}
                      className={`py-1.5 px-2 rounded text-[9px] font-bold border transition ${
                        activeActivityFunction === act.id 
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300' 
                          : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Traverse wave vector slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                  <span>ψ Traverse Vectoring</span>
                  <span>{(transverseVector * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.5" 
                  step="0.05"
                  value={transverseVector}
                  onChange={(e) => setTransverseVector(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Event horizon focus slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                  <span>Intention Horizon Focus</span>
                  <span>{(eventHorizonFocus * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.2" 
                  max="2.0" 
                  step="0.05"
                  value={eventHorizonFocus}
                  onChange={(e) => setEventHorizonFocus(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* State positioning slider (40 levels default) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                  <span>Quantum State Positioning</span>
                  <span>{quantumStateLevel} Level Space</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="50" 
                  step="2"
                  value={quantumStateLevel}
                  onChange={(e) => setQuantumStateLevel(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: 4D Canvas rotation visualizer & Collapse telemetry console */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Animated 4D Tesseract canvas */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3 relative">
            <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              4D SPACE VECTOR PERSPECTIVE PROJECTOR
            </span>

            <div className="relative flex justify-center items-center bg-slate-950 rounded-lg border border-slate-900 overflow-hidden">
              <canvas 
                ref={canvasRef}
                width={500}
                height={260}
                className="w-full h-[220px]"
              />
              
              {/* Overlay Badge */}
              <div className="absolute right-3 top-3 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800 text-[8.5px] font-mono text-cyan-400">
                TESSERACT STRETCH: 4D → 3D
              </div>
            </div>
          </div>

          {/* Multiple State Pre-collapse Error Correction Quarks logger */}
          <div className="bg-slate-950 border border-purple-950/30 rounded-xl p-3 flex flex-col gap-2">
            <span className="text-[9px] font-mono text-purple-400 font-extrabold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
              PRE-COLLAPSE QUARK ERROR CORRECTION MATRIX
            </span>

            <div className="bg-black/90 rounded border border-purple-950/50 p-2.5 h-[80px] overflow-y-auto font-mono text-[9px] text-purple-300 leading-relaxed flex flex-col gap-1 scrollbar-thin">
              {collapseQuarkLogs.length === 0 ? (
                <span className="text-slate-600 italic">Quark alignment system is idle. Trigger collapse to test.</span>
              ) : (
                collapseQuarkLogs.map((log, idx) => (
                  <div key={idx} className={log.startsWith('[QUARK-ERR') ? 'text-emerald-400' : 'text-purple-300'}>
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Collapse action button */}
            <div className="flex gap-4 items-center">
              <button
                onClick={triggerWaveCollapseTest}
                disabled={isCollapsing}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 font-mono font-black text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                {isCollapsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>COLLAPSING HYPERWAVE STATES ({collapseProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-slate-950" />
                    <span>COLLAPSE PROBABILITY WAVES</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Decoded Ground-state coordinates */}
      {isWaveCollapsed && collapsedResult.length > 0 && (
        <div className="border-t border-cyan-500/10 pt-4 mt-2 flex flex-col gap-3 bg-gradient-to-br from-slate-950 to-cyan-950/10 rounded-xl p-4 border border-cyan-500/10 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  🧬 GROUND-STATE COLLAPSED BALL VALUES DECODED
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Coordinates locked under event horizon focus of {(eventHorizonFocus * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onApplyNumbers(collapsedResult);
                addToast('COLLAPSED SET LOCKED', 'Active betting configurations updated with ground-state values.', 'success');
              }}
              className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-extrabold text-xs uppercase rounded transition active:scale-95"
            >
              Apply Locked Ground Set
            </button>
          </div>

          <div className="flex gap-2 justify-center py-2 bg-black/40 border border-slate-900 rounded-lg max-w-sm mx-auto w-full">
            {collapsedResult.map((val, idx) => (
              <span key={idx} className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/30 text-cyan-300 font-mono font-black text-xs flex items-center justify-center shadow-lg animate-pulse">
                {val}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
