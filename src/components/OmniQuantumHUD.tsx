import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Maximize, Rotate3D, Activity, Share2, Zap } from 'lucide-react';

interface OmniQuantumHUDProps {
  proposedNumbers: number[];
  activeSequenceName: string;
}

type ProjectionShape = 'SPHERE' | 'HELIX' | 'CUBE' | 'KATHARA' | 'FIBONACCI' | 'PI' | 'TESSERACT' | 'SOLAR';

interface Node3D {
  id: number;
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
}

export default function OmniQuantumHUD({ proposedNumbers, activeSequenceName }: OmniQuantumHUDProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeShape, setActiveShape] = useState<ProjectionShape>('SPHERE');
  const [showConstellations, setShowConstellations] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  
  // Telemetry state for HUD
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);

  // Constants mapping shapes
  const generateNodes = (shape: ProjectionShape): Node3D[] => {
    const nodes: Node3D[] = [];
    const n = 49;
    
    for (let i = 1; i <= n; i++) {
       let x=0, y=0, z=0;
       
       if (shape === 'SPHERE' || shape === 'SOLAR') {
          // Fibonacci sphere
          const phi = Math.acos(1 - 2 * (i - 0.5) / n);
          const theta = Math.PI * (1 + Math.sqrt(5)) * i;
          const radius = 100;
          x = radius * Math.cos(theta) * Math.sin(phi);
          y = radius * Math.sin(theta) * Math.sin(phi);
          z = radius * Math.cos(phi);
       } 
       else if (shape === 'HELIX') {
          const t = i / n * Math.PI * 4;
          const r = 80;
          x = Math.cos(t) * r;
          z = Math.sin(t) * r;
          y = (i - n/2) * 4;
       }
       else if (shape === 'CUBE' || shape === 'TESSERACT') {
          const s = 140;
          // approximate cube mapping
          x = ((i % 3) - 1) * s/2 + (Math.random()*20-10);
          y = ((Math.floor(i/3) % 4) - 1.5) * s/2.5;
          z = ((Math.floor(i/12) % 4) - 1.5) * s/2.5;
       }
       else if (shape === 'FIBONACCI' || shape === 'PI') {
          const theta = i * 2.39996;
          const r = Math.sqrt(i) * 15;
          x = r * Math.cos(theta);
          y = r * Math.sin(theta);
          z = (Math.random() - 0.5) * 50;
       }
       else if (shape === 'KATHARA') {
          // grid tree
          x = (i % 7 - 3) * 30;
          y = (Math.floor(i/7) - 3) * 30;
          z = Math.sin(i) * 40;
       }

       nodes.push({ id: i, x, y, z, baseX: x, baseY: y, baseZ: z });
    }
    return nodes;
  };

  const nodesRef = useRef<Node3D[]>(generateNodes('SPHERE'));
  const rotationRef = useRef({ x: 0.2, y: 0.5, z: 0 });
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });

  // Handle shape change transitioning
  useEffect(() => {
     const targetNodes = generateNodes(activeShape);
     let frame = 0;
     const duration = 60; // frames
     
     const startNodes = nodesRef.current.map(n => ({...n}));
     
     const animateTransition = () => {
        frame++;
        const ease = 1 - Math.pow(1 - (frame / duration), 3);
        
        nodesRef.current = startNodes.map((node, i) => {
           const target = targetNodes[i];
           return {
              ...node,
              baseX: node.baseX + (target.baseX - node.baseX) * ease,
              baseY: node.baseY + (target.baseY - node.baseY) * ease,
              baseZ: node.baseZ + (target.baseZ - node.baseZ) * ease,
           };
        });
        
        if (frame < duration) {
           requestAnimationFrame(animateTransition);
        }
     };
     
     animateTransition();
  }, [activeShape]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const resize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight || 500;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 20; // Offset down slightly for HUD

      if (autoRotate && !isDragging.current) {
         rotationRef.current.y += 0.003;
         rotationRef.current.x += 0.001;
      }

      setYaw(rotationRef.current.y);
      setPitch(rotationRef.current.x);

      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);

      // Project Nodes
      const projectedNodes = nodesRef.current.map(node => {
         // Y rotation
         let rx = node.baseX * cosY - node.baseZ * sinY;
         let rz = node.baseX * sinY + node.baseZ * cosY;
         let ry = node.baseY;

         // X rotation
         let ry2 = ry * cosX - rz * sinX;
         let rz2 = ry * sinX + rz * cosX;

         // Perspective
         const scale = 300 / (300 + rz2);
         const px = cx + rx * scale * 1.5;
         const py = cy + ry2 * scale * 1.5;

         return { ...node, px, py, scale, zDepth: rz2 };
      });

      // Sort for depth mapping
      projectedNodes.sort((a, b) => b.zDepth - a.zDepth);

      // Draw Constellations (Connections)
      if (showConstellations) {
         ctx.lineWidth = 1;
         ctx.strokeStyle = "rgba(168, 85, 247, 0.15)";
         ctx.beginPath();
         for (let i = 0; i < projectedNodes.length; i++) {
            const n1 = projectedNodes[i];
            // Connect to nearby nodes to form constellation matrix
            // Simple mapping: connect to i+1 and i+7
            if (i < projectedNodes.length - 1) {
               ctx.moveTo(n1.px, n1.py);
               ctx.lineTo(projectedNodes[i+1].px, projectedNodes[i+1].py);
            }
            if (i < projectedNodes.length - 7) {
               ctx.moveTo(n1.px, n1.py);
               ctx.lineTo(projectedNodes[i+7].px, projectedNodes[i+7].py);
            }
         }
         ctx.stroke();
      }

      // Draw Active Connections explicitly
      if (showConstellations && proposedNumbers.length > 0) {
         ctx.beginPath();
         const activeProjNodes = projectedNodes.filter(n => proposedNumbers.includes(n.id));
         for (let i = 0; i < activeProjNodes.length - 1; i++) {
            ctx.moveTo(activeProjNodes[i].px, activeProjNodes[i].py);
            ctx.lineTo(activeProjNodes[i+1].px, activeProjNodes[i+1].py);
         }
         ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
         ctx.lineWidth = 2;
         ctx.stroke();
      }

      // Draw Nodes
      projectedNodes.forEach(node => {
         const isActive = proposedNumbers.includes(node.id);
         const r = isActive ? 12 * node.scale : 9 * node.scale;
         
         ctx.beginPath();
         ctx.arc(node.px, node.py, Math.max(r, 0.1), 0, Math.PI * 2);
         
         if (isActive) {
            ctx.fillStyle = "#06b6d4"; // Cyan
            ctx.shadowColor = "#06b6d4";
            ctx.shadowBlur = 15;
            ctx.fill();
            
            // Outer cyan border
            ctx.beginPath();
            ctx.arc(node.px, node.py, r + 4 * node.scale, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
            ctx.lineWidth = 1;
            ctx.stroke();
         } else {
            ctx.fillStyle = `rgba(30, 41, 59, ${0.4 + (node.scale * 0.4)})`;
            ctx.shadowBlur = 0;
            ctx.fill();
            ctx.strokeStyle = `rgba(148, 163, 184, ${0.2 + (node.scale * 0.2)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
         }

         // Text
         ctx.fillStyle = isActive ? "#ffffff" : `rgba(148, 163, 184, ${0.5 + (node.scale * 0.5)})`;
         ctx.font = `bold ${Math.max(10 * node.scale, 8)}px monospace`;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.shadowBlur = 0;
         ctx.fillText(node.id.toString(), node.px, node.py);
      });

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [proposedNumbers, showConstellations, autoRotate]);

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
     isDragging.current = true;
     previousMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
     if (!isDragging.current) return;
     const dx = e.clientX - previousMouse.current.x;
     const dy = e.clientY - previousMouse.current.y;
     rotationRef.current.y += dx * 0.005;
     rotationRef.current.x += dy * 0.005;
     previousMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = () => {
     isDragging.current = false;
  };

  return (
    <div className="w-full flex justify-center py-4">
      <div 
        ref={containerRef}
        className="w-full max-w-[900px] h-[600px] bg-[#020617] border border-cyan-900/30 rounded-2xl relative overflow-hidden flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_80px_rgba(6,182,212,0.05)]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {/* TOP HUD BAR */}
        <div className="absolute top-0 left-0 w-full p-4 flex flex-col sm:flex-row justify-between items-start z-10 pointer-events-none">
           <div>
              <h2 className="text-[18px] sm:text-[22px] font-mono font-extrabold text-cyan-400 tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                OMNI QUANTUM 3D HUD SPACE
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 tracking-widest mt-1">
                DRAG TO ROTATE | SCROLL TO EXTEND DEPTH ZOOM
              </p>
           </div>
           
           <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0 pointer-events-auto">
              {(['SPHERE', 'HELIX', 'CUBE', 'KATHARA', 'FIBONACCI', 'PI', 'TESSERACT', 'SOLAR'] as ProjectionShape[]).map(shape => (
                 <button
                    key={shape}
                    onClick={() => setActiveShape(shape)}
                    className={`px-3 py-1.5 font-mono text-[9px] sm:text-[10px] font-bold tracking-widest rounded uppercase transition-all duration-300 outline-none
                       ${activeShape === shape 
                          ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                          : 'bg-transparent text-slate-500 border border-slate-800 hover:border-cyan-800 hover:text-cyan-500'}`}
                 >
                    {shape}
                 </button>
              ))}
           </div>
        </div>

        {/* LEFT HUD INFO */}
        <div className="absolute left-4 top-24 pointer-events-none">
           <div className="flex flex-col gap-1.5 text-[9px] sm:text-[10px] font-mono text-slate-500 tracking-widest">
              <p>YAW_ANGLE: <span className="text-slate-300">{(yaw % (Math.PI*2)).toFixed(3)} RAD</span></p>
              <p>PITCH_ANGLE: <span className="text-slate-300">{(pitch % (Math.PI*2)).toFixed(3)} RAD</span></p>
              <p>MAG_ZOOM: <span className="text-slate-300">110%</span></p>
              <p>ACTIVE_VECTORS: <span className="text-slate-300">49 / 49</span></p>
           </div>
        </div>

        {/* RIGHT TOP HUD BOX */}
        <div className="absolute right-4 top-24 pointer-events-none border border-cyan-500/20 bg-[#0f172a]/60 backdrop-blur-md rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
           <p className="text-[9px] font-mono text-slate-400 tracking-widest text-right mb-2">ACTIVE DECRYPT SEQUENCE:</p>
           <p className="text-[11px] sm:text-[12px] font-mono font-bold text-cyan-400 text-right uppercase shadow-cyan-400 drop-shadow flex flex-col">
              {activeSequenceName}
           </p>
           <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_#06b6d4]"></span>
              <span className="text-[9px] font-mono text-cyan-300 tracking-widest">LUMINOUS POINTS MAPPED AS CYAN</span>
           </div>
        </div>

        {/* MAIN CANVAS */}
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

        {/* BOTTOM CONTROLS & HUD */}
        <div className="absolute bottom-6 w-full px-6 flex flex-col sm:flex-row items-end justify-between items-center gap-4 z-10 pointer-events-none">
           
           {/* LEFT CONTROLS */}
           <div className="flex items-center gap-3 pointer-events-auto">
              <button
                 onClick={() => setShowConstellations(!showConstellations)}
                 className={`px-4 flex flex-col items-center justify-center py-2 h-12 font-mono text-[9px] sm:text-[10px] font-bold tracking-widest rounded border transition-all uppercase outline-none
                    ${showConstellations ? 'bg-purple-950/30 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}
              >
                 <span className="mb-0.5">SHOW DRAW CONSTELLATIONS:</span>
                 <span className={showConstellations ? 'text-purple-400' : 'text-slate-600'}>{showConstellations ? 'ON' : 'OFF'}</span>
              </button>
              
              <button
                 onClick={() => setAutoRotate(!autoRotate)}
                 className={`px-4 flex flex-col items-center justify-center py-2 h-12 font-mono text-[9px] sm:text-[10px] font-bold tracking-widest rounded border transition-all uppercase outline-none
                    ${autoRotate ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}
              >
                 <span className="mb-0.5">OS ROTATION SWEEP:</span>
                 <span className={autoRotate ? 'text-emerald-400' : 'text-slate-600'}>{autoRotate ? 'AUTO' : 'MANUAL'}</span>
              </button>
           </div>
           
           {/* RIGHT SIGNAL */}
           <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-cyan-500 opacity-60" />
              <div className="flex flex-col">
                 <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest">3D PROJECTION ENGINE</span>
                 <span className="text-[9px] font-mono text-cyan-500/60 tracking-widest">RUNNING</span>
              </div>
           </div>

        </div>
        
        {/* BOTTOM ACTIVE DECRYPTED BAR */}
        <div className="absolute -bottom-16 w-full border-t border-slate-800/80 p-5 flex items-center justify-center gap-5">
           <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">Active Algorithm Numbers Decrypted:</span>
           <div className="flex gap-2">
              {proposedNumbers.length > 0 ? (
                 proposedNumbers.map(n => (
                    <div key={n} className="w-10 h-10 border border-cyan-800 bg-cyan-950/40 rounded flex items-center justify-center text-cyan-300 font-mono font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                       {n}
                    </div>
                 ))
              ) : (
                 <div className="text-[10px] font-mono text-slate-600 tracking-widest uppercase py-2">Waiting for sequence...</div>
              )}
           </div>
        </div>

      </div>

      {/* LOWER JARVIS MATRIX BANNER */}
      <div className="absolute -bottom-24 w-full max-w-[900px] flex items-center justify-between border-t border-cyan-900/30 pt-6">
         <div className="flex items-center gap-3">
             <Cpu className="w-7 h-7 text-cyan-500 px-1 border border-cyan-500/40 bg-cyan-950/30 rounded" />
             <div>
                <h3 className="text-sm font-mono font-bold text-slate-200 tracking-[0.2em] uppercase drop-shadow">JARVIS COGNITIVE RESEARCH MATRIX</h3>
                <p className="text-[10px] font-mono text-slate-500 tracking-[0.1em] mt-0.5">CONTINUOUS SECURED DECRYPTION & HEURISTIC MODEL SCANS</p>
             </div>
         </div>
         <div className="border border-emerald-500/30 bg-emerald-950/20 px-4 py-2 rounded text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
             AGENT ACTIVE
         </div>
      </div>
    </div>
  );
}
