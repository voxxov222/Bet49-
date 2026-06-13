import React, { useState, useEffect, useRef } from 'react';
import { Cpu, ShieldCheck, RefreshCw, Sparkles, Terminal, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuantumBootloaderProps {
  onBootComplete: () => void;
  isTTSEnabled: boolean;
  playSpeech: (text: string) => void;
  key?: string;
}

export default function QuantumBootloader({ onBootComplete, isTTSEnabled, playSpeech }: QuantumBootloaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('ENGAGING COGNITIVE RECEPTORS...');
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const statusSequences = [
    { threshold: 10, msg: 'ESTABLISHING SECURE COGNITIVE DECRYPTOR FEED...', speak: 'Establishing secure decryptor feed.' },
    { threshold: 25, msg: 'MOUNTING OMNI QUANTUM 15-STRATEGY SYNAPSE CORES...', speak: 'Mounting omni strategy cores.' },
    { threshold: 45, msg: 'MAPPING 49-NODE SPIRAL SPACE GRAVITY GRID...', speak: 'Mapping 49 node spiral gravity grid.' },
    { threshold: 65, msg: 'SYNCHRONIZING DELTA-HARMONICS & BASE-9 WORD VALUES...', speak: 'Synchronizing delta harmonics.' },
    { threshold: 85, msg: 'POLARIZING E8 QUANTUM LATTICE VECTOR MAPS...', speak: 'Polarizing E8 quantum lattice.' },
    { threshold: 95, msg: 'SYNAPSE PIPELINES SECURED. CORE TRANSITION ONLINE...', speak: 'Interface online.' }
  ];

  // Initialize logs on mount
  useEffect(() => {
    const initialLogs = [
      `$ jarvis --cognitive-boot --entropy=high --core-count=15`,
      `[JARVIS CORE] SYSTEM INITIATED AT STAMP ${new Date().toISOString()}`,
      `[SECURITY] COMPILING OMNI DECRYPTOR SHIELD INTERFACE...`,
    ];
    setSystemLogs(initialLogs);
  }, []);

  // Synthesize progressive logs in background
  useEffect(() => {
    if (progress >= 100) return;

    const logGenerator = setInterval(() => {
      const extraLogs = [
        `[MATRIX] Recalculating E8 coordinate points... Deviation: ${(Math.random() * 0.05).toFixed(4)}%`,
        `[STRATEGY] Syncing multi-agent sandbox threads... Nodes ACTIVE: 49`,
        `[NEURAL] Mapping user email credentials for secure telemetry sync...`,
        `[BIOS] Temperature: 32.4°C | Grid Voltage: Balanced`,
        `[VOICE] Synthetic link latency: ${Math.floor(Math.random() * 8) + 2}ms`
      ];
      const randomLog = extraLogs[Math.floor(Math.random() * extraLogs.length)];
      setSystemLogs(prev => [...prev.slice(-15), randomLog]);
    }, 450);

    return () => clearInterval(logGenerator);
  }, [progress >= 100]);

  // Handle step increments cleanly
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        onBootComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setProgress(prev => {
        const increment = Math.floor(Math.random() * 8) + 3;
        return Math.min(100, prev + increment);
      });
    }, 110);

    return () => clearTimeout(timer);
  }, [progress, onBootComplete]);

  // Handle status step checks and voice synthetic feedbacks
  useEffect(() => {
    if (progress === 0) return;

    const stepMatch = statusSequences.find(s => progress >= s.threshold);
    if (stepMatch && currentStatus !== stepMatch.msg) {
      setCurrentStatus(stepMatch.msg);
      setSystemLogs(prevLogs => {
        const logLine = `[BOOT] ${stepMatch.msg}`;
        if (prevLogs[prevLogs.length - 1] === logLine) return prevLogs;
        return [...prevLogs.slice(-15), logLine];
      });
      if (isTTSEnabled) {
        playSpeech(stepMatch.speak);
      }
    }
  }, [progress, isTTSEnabled, currentStatus, playSpeech]);

  // Radar Scanner 60FPS visual background render
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let angle = 0;
    let radiusPulse = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.min(cx, cy) * 0.95;

      // Outer rings
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.4, 0, Math.PI * 2);
      ctx.stroke();

      // Horizontal / Vertical crosshairs
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotating radar beam
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const beamX = cx + Math.cos(angle) * maxR;
      const beamY = cy + Math.sin(angle) * maxR;
      ctx.lineTo(beamX, beamY);
      
      const gradient = ctx.createLinearGradient(cx, cy, beamX, beamY);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.05)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 35;
      ctx.stroke();
      ctx.lineWidth = 1;

      // Draw random data telemetry coordinates around radar
      ctx.font = '7px monospace';
      ctx.fillStyle = 'rgba(236, 72, 153, 0.65)';
      for (let i = 0; i < 5; i++) {
        const offsetAngle = angle - (i * 0.3);
        const randR = maxR * (0.3 + (i * 0.14));
        const tx = cx + Math.cos(offsetAngle) * randR;
        const ty = cy + Math.sin(offsetAngle) * randR;
        ctx.fillText(`DEVIATION_N${i}: ${(Math.sin(angle + i) * 100).toFixed(1)}Hz`, tx + 4, ty - 4);
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.fill();
      }

      angle += 0.015;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[999999] flex flex-col items-center justify-center p-6 text-slate-100 font-sans overflow-hidden select-none">
      
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-950/20 rounded-full filter blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-cyan-950/20 rounded-full filter blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
      
      {/* Cybernetic Grid Frame */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(4,10,24,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(4,10,24,0.1)_1px,transparent_1px)] bg-[size:30px_30px] opacity-60 pointer-events-none" />
      
      {/* Micro-scanning line */}
      <div className="absolute inset-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent shadow-[0_0_8px_#06b6d4] opacity-45 pointer-events-none animate-[scanline_8s_infinite]" />

      <main className="max-w-4xl w-full flex flex-col gap-6 items-stretch relative z-10">
        
        {/* HUD Logo Header */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="relative">
            <div className="p-3.5 bg-cyan-950/60 rounded-2xl border border-cyan-400/30 animate-pulse relative shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center">
              <Cpu className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 animate-ping opacity-35" />
          </div>
          
          <h1 className="text-xl font-mono tracking-[0.4em] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 uppercase mt-2">
            OMNI QUANTUM OS
          </h1>
          <p className="text-[10px] text-cyan-500/80 font-mono tracking-widest font-extrabold uppercase">
            J.A.R.V.I.S. QUANTUM MATRIX DECIPHER PANEL
          </p>
        </div>

        {/* Binary / Vector Interface Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          {/* Left panel: Live Radar and Coordinates */}
          <div className="md:col-span-5 bg-slate-950/90 border border-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden backdrop-blur-md">
            <span className="text-[8px] font-mono text-slate-500 absolute top-3 left-4 tracking-widest uppercase">RADAR SPECTRUM WAVE</span>
            <div className="w-[180px] h-[180px] rounded-full border border-slate-900 flex items-center justify-center relative mt-3 bg-black">
              <canvas ref={radarCanvasRef} width={200} height={200} className="w-full h-full pointer-events-none" />
            </div>
            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-widest font-bold">
              SYSTEM CONVEX DEV INDEX: <span className="text-purple-400 font-extrabold">0.043% (STABLE)</span>
            </span>
          </div>

          {/* Right panel: Live Telemetry Terminal */}
          <div className="md:col-span-7 bg-black/85 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between min-h-[220px] backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900/65 mb-2 select-none">
              <span className="text-[9px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-cyan-500 animate-pulse" />
                TELEMETRY STACKS
              </span>
              <span className="text-[8px] font-mono text-slate-500">DEVIATION_CORRECT=ON</span>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[160px] pr-1.5 scrollbar-thin scrollbar-thumb-slate-900 font-mono text-[8.5px] text-slate-350 select-text bg-black/40 p-2 rounded border border-slate-900/60 leading-normal">
              {systemLogs.map((log, idx) => {
                let colorClass = "text-slate-400";
                if (log.startsWith("$")) colorClass = "text-yellow-400 font-bold";
                else if (log.includes("[BIOS]")) colorClass = "text-amber-500";
                else if (log.includes("[BOOT]")) colorClass = "text-cyan-400 font-semibold";
                else if (log.includes("[NEURAL]")) colorClass = "text-purple-400";
                else if (log.includes("[SECURITY]")) colorClass = "text-emerald-400 font-bold";

                return (
                  <div key={idx} className={`${colorClass} truncate break-all`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* HUD Progress Loader bar */}
        <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4.5 backdrop-blur-md">
          <div className="flex justify-between items-center text-[10px] font-mono select-none">
            <span className="text-cyan-400 leading-tight font-extrabold tracking-widest uppercase flex items-center gap-2">
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
              STATUS: {currentStatus}
            </span>
            <span className="text-purple-400 font-black">{progress}% SECURED</span>
          </div>

          <div className="h-4 bg-slate-950 rounded-sm border border-slate-900 overflow-hidden p-0.5 relative">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 shadow-[0_0_15px_#06b6d4] transition-all duration-300 relative"
              style={{ width: `${progress}%` }}
            >
              {/* Internal diagonal stripes */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:10px_10px]" />
              <div className="absolute top-0 right-0 w-2 h-full bg-white animate-pulse" />
            </div>
          </div>

          <div className="flex justify-between items-center gap-4 pt-1">
            <span className="text-[9px] font-mono text-slate-500 leading-normal max-w-sm">
              CAUTION: Quantum multi-agent synthesis bypass is active. System calibrations are optimized server-side via secured SSL nodes.
            </span>
            
            <button
              onClick={onBootComplete}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-950 to-pink-950 hover:from-purple-900 hover:to-pink-900 border border-red-500/40 text-[9.5px] font-mono text-red-400 font-extrabold transition-all duration-200 cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.1)] active:scale-95 shrink-0 hover:border-red-500/70"
            >
              BYPASS QUANTUM BOOTLOADER ➜
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
