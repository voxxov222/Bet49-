import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CircleDot, Activity } from 'lucide-react';

export default function QuantumSuperpositionVisualizer({ 
  particles, 
  setParticles 
}: { 
  particles: any[], 
  setParticles: React.Dispatch<React.SetStateAction<any[]>> 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [density, setDensity] = useState(50);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Initialize particles with grid targets
    const gridSize = Math.ceil(Math.sqrt(density));
    const spacing = Math.min(canvas.width, canvas.height) / (gridSize + 2);
    
    const newParticles = Array.from({ length: density }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      targetX: (i % gridSize) * spacing + spacing,
      targetY: Math.floor(i / gridSize) * spacing + spacing,
      color: Math.random() > 0.5 ? '#06b6d4' : '#a855f7'
    }));
    setParticles(newParticles);
  }, [density, speed, setParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      particles.forEach(p => {
        if (isCollapsed) {
          // Collapse to grid
          p.x += (p.targetX - p.x) * 0.05;
          p.y += (p.targetY - p.y) * 0.05;
        } else {
          // Superposition - turbulence effect
          p.vx += Math.sin(p.y * 0.02 + time) * 0.05 * speed;
          p.vy += Math.cos(p.x * 0.02 + time) * 0.05 * speed;
          p.vx *= 0.98; // Friction
          p.vy *= 0.98;
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isCollapsed ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();
        
        if (isCollapsed) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
        }
      });
      
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [particles, isCollapsed, speed]);

  return (
    <div className="bg-black/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Quantum Superposition & Collapse
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition ${
            isCollapsed 
              ? 'bg-emerald-900 text-emerald-300 border border-emerald-700' 
              : 'bg-purple-900 text-purple-300 border border-purple-700'
          }`}
        >
          {isCollapsed ? 'Re-Superpose' : 'Trigger Collapse'}
        </button>
      </div>
      
      {/* Control Panel */}
      <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-900">
        <div>
          <label className="text-[10px] text-slate-500 font-mono block mb-1">Speed</label>
          <input 
            type="range" min="1" max="10" value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 font-mono block mb-1">Density</label>
          <input 
            type="range" min="10" max="200" value={density} 
            onChange={(e) => setDensity(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-64 bg-slate-950 rounded-lg border border-slate-900" />
      <p className="text-[10px] text-slate-500 font-mono text-center">
        {isCollapsed ? 'Wavefunction collapsed into single state.' : 'Particles in superposition (randomized state).'}
      </p>
    </div>
  );
}
