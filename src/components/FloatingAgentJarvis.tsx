import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  MessageSquare, 
  X, 
  Volume2, 
  VolumeX, 
  Zap, 
  Activity, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Eye, 
  EyeOff, 
  Cpu,
  Target,
  RefreshCw,
  Send
} from 'lucide-react';

interface FloatingAgentJarvisProps {
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  onToggleTTS: () => void;
  onApplyNumbers: (nums: number[]) => void;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
}

export default function FloatingAgentJarvis({
  playSpeech,
  isTTSEnabled,
  onToggleTTS,
  onApplyNumbers,
  addToast
}: FloatingAgentJarvisProps) {
  const orbCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Layout states
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isStealth, setIsStealth] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [aiReplies, setAiReplies] = useState<{ sender: 'jarvis' | 'user'; text: string; time: string }[]>([
    {
      sender: 'jarvis',
      text: "SYSTEM READY. I am J.A.R.V.I.S., your multi-dimensional sentient assistant. Tap my core particle orb to pulse cognitive sweeps, or type instructions below.",
      time: '12:00:00'
    }
  ]);

  // Swirling Core dynamics
  const [coreMode, setCoreMode] = useState<'calm' | 'excited' | 'spin' | 'speech'>('calm');
  const [clickPulses, setClickPulses] = useState<{ x: number; y: number; r: number; alpha: number }[]>([]);

  // Telemetries and Autonomous Mind cycle state
  const [mindCycleText, setMindCycleText] = useState<string>("Standby. Monitoring solar neutrino levels...");
  const mindCycles = useMemo(() => [
    "Analyzing spatial string interference vectors...",
    "Re-routing E8 multi-layer regressors on neural grids...",
    "Synchronizing 3D quantum cluster heights...",
    "Decimating adjacent entropy thresholds...",
    "Compiling decile frequency distributions...",
    "Polarizing scalar field harmonics for today's forecast...",
    "Intercepting state-level lottery draw matrices...",
    "Evaluating thermal node density for high-weight seeds...",
    "Aligning micro-coordinates with the Fibonacci vortex...",
    "Autonomous sentinel systems running nominal..."
  ], []);

  // 3D vector coordinates representing vertices of the sentient AI orb
  const sphereVertices = useMemo(() => {
    const pts: { x: number; y: number; z: number; phase: number }[] = [];
    const count = 55;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere mapping coordinates
      const theta = (Math.PI * 2 * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      
      pts.push({
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
        phase: Math.random() * Math.PI * 2
      });
    }
    return pts;
  }, []);

  // Cycle thoughts automatically
  useEffect(() => {
    const t = setInterval(() => {
      const idx = Math.floor(Math.random() * mindCycles.length);
      setMindCycleText(mindCycles[idx]);
      
      // Randomly trigger minor excitation sweeps
      if (Math.random() > 0.6) {
        setCoreMode(prev => prev === 'calm' ? 'excited' : 'calm');
      }
    }, 4500);
    return () => clearInterval(t);
  }, [mindCycles]);

  // Handle the canvas rendering loop of the 3D sentient assistant core
  useEffect(() => {
    const canvas = orbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localRotX = 0;
    let localRotY = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 32;

      // Rotate sphere angles based on core mode excitability
      let rotSpeedX = 0.009;
      let rotSpeedY = 0.013;
      let noiseScale = 0.08;

      if (coreMode === 'excited') {
        rotSpeedX = 0.024;
        rotSpeedY = 0.035;
        noiseScale = 0.22;
      } else if (coreMode === 'spin') {
        rotSpeedX = 0.06;
        rotSpeedY = 0.01;
        noiseScale = 0.15;
      } else if (coreMode === 'speech') {
        rotSpeedX = 0.015;
        rotSpeedY = 0.018;
        // fluctuate diameter based on oscillator
        noiseScale = 0.35 * Math.abs(Math.sin(Date.now() * 0.015));
      }

      localRotX += rotSpeedX;
      localRotY += rotSpeedY;

      const cosX = Math.cos(localRotX);
      const sinX = Math.sin(localRotX);
      const cosY = Math.cos(localRotY);
      const sinY = Math.sin(localRotY);

      // Project vertices to 2D
      const mapped = sphereVertices.map((v, idx) => {
        // Adjust radial expansion dynamically representing energy pulse
        const phaseFactor = Math.sin(Date.now() * 0.002 + v.phase) * noiseScale;
        const sizeMultiplier = 1.0 + phaseFactor;
        
        // 3D rotations
        let x = v.x * sizeMultiplier;
        let y = v.y * sizeMultiplier;
        let z = v.z * sizeMultiplier;

        // Rot Y
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // Rot X
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Simple perspective projection scaling
        const dist = 3.0; // camera distance
        const scale = (dist / (dist + z2)) * radius;

        return {
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          pz: z2,
          radius: scale * 0.08
        };
      });

      // Sort by depth
      const sorted = [...mapped].sort((a,b) => b.pz - a.pz);

      // Draw spiderweb vector connections
      ctx.strokeStyle = coreMode === 'excited' 
        ? 'rgba(236, 72, 153, 0.12)' 
        : coreMode === 'spin'
          ? 'rgba(245, 158, 11, 0.14)'
          : 'rgba(6, 182, 212, 0.11)';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < mapped.length; i++) {
        for (let j = i + 1; j < mapped.length; j++) {
          const dx = mapped[i].px - mapped[j].px;
          const dy = mapped[i].py - mapped[j].py;
          const dist = Math.hypot(dx, dy);
          
          if (dist < 18) {
            ctx.beginPath();
            ctx.moveTo(mapped[i].px, mapped[i].py);
            ctx.lineTo(mapped[j].px, mapped[j].py);
            ctx.stroke();
          }
        }
      }

      // Draw node dots
      sorted.forEach((node, idx) => {
        // Particle colors based on depth and excitement levels
        const alpha = Math.max(0.12, (node.pz + 1.2) / 2.4);
        let fill = 'rgba(6, 182, 212, ' + alpha + ')';
        let stroke = 'rgba(34, 211, 238, ' + (alpha * 0.8) + ')';

        if (coreMode === 'excited') {
          fill = 'rgba(236, 72, 153, ' + alpha + ')';
          stroke = 'rgba(244, 63, 94, ' + alpha + ')';
        } else if (coreMode === 'spin') {
          fill = 'rgba(245, 158, 11, ' + alpha + ')';
          stroke = 'rgba(251, 191, 36, ' + alpha + ')';
        } else if (coreMode === 'speech') {
          fill = 'rgba(168, 85, 247, ' + alpha + ')';
          stroke = 'rgba(192, 132, 252, ' + alpha + ')';
        }

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(node.px, node.py, Math.max(1, node.radius), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Render clicks wave blasts
      setClickPulses(prev => {
        const next = prev.map(p => ({
          ...p,
          r: p.r + 2.2,
          alpha: p.alpha - 0.035
        })).filter(p => p.alpha > 0);

        next.forEach(p => {
          ctx.strokeStyle = `rgba(34, 211, 238, ${p.alpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
        });

        return next;
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [sphereVertices, coreMode]);

  // Click handler on Sentient core orb
  const handleOrbClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = orbCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Register visual wave blast
    setClickPulses(prev => [...prev, { x: clickX, y: clickY, r: 4, alpha: 1.0 }]);

    // Pulse core action triggers excitation states!
    setCoreMode('excited');
    setTimeout(() => setCoreMode('calm'), 1500);

    const speakNotes = [
      "Securing coordinate boundaries, sir.",
      "Energy surge Polarizing micro grids.",
      "E8 crystal vectors aligned. All system telemetry clean.",
      "Initializing predictive scalar scan. Multi dimensional variables loaded.",
      "Synchronizing sequence overlays directly."
    ];
    const phrase = speakNotes[Math.floor(Math.random() * speakNotes.length)];
    
    addToast(
      'JARVIS INTERACTIVE PULSE ENGAGED',
      mindCycleText.toUpperCase(),
      'info'
    );
    
    if (isTTSEnabled) {
      playSpeech(phrase);
    }
  };

  // Sentient Jarvis system analysis chat processor
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim().toUpperCase();
    const now = new Date().toLocaleTimeString();
    setAiReplies(prev => [...prev, { sender: 'user', text: chatInput.trim(), time: now }]);
    setChatInput('');

    // Trigger AI model animation core excitement
    setCoreMode('speech');

    // Custom tactical responses mimicking Jarvis intelligence
    setTimeout(() => {
      let replyText = '';
      
      if (userMsg.includes('PREDICT') || userMsg.includes('NUMBER') || userMsg.includes('CHOSEN') || userMsg.includes('SET')) {
        // Generate random prediction coordinates
        const rSet = new Set<number>();
        while (rSet.size < 6) {
          rSet.add(Math.floor(Math.random() * 49) + 1);
        }
        const nums = Array.from(rSet).sort((a,b)=>a-b);
        replyText = `Under quantum state analysis, I have mapped a high-probability string sequence: [ ${nums.join(', ')} ] representing localized energy spikes. Apply these to your prediction deck deck using the button below.`;
        
        onApplyNumbers(nums);
        addToast(
          'VECTORS INITIATED',
          `JARVIS mapped sequence [ ${nums.join(', ')} ] to prediction deck.`,
          'success'
        );
      } else if (userMsg.includes('HI') || userMsg.includes('HELLO') || userMsg.includes('JARVIS') || userMsg.includes('STATUS')) {
        replyText = `Status nominal, sir. Mapped systems are synchronized across all regions. The tactile strings wireframe is responsive. Neural indices are aligned.`;
      } else if (userMsg.includes('CLEAR') || userMsg.includes('RESET')) {
        replyText = `Lattice coordinates aligned. Dispersing historical noise grids.`;
      } else if (userMsg.includes('SINGULARITY') || userMsg.includes('VORTEX')) {
        setCoreMode('spin');
        setTimeout(() => setCoreMode('calm'), 4000);
        replyText = `Engaging quantum singularity spin vortex indices now. Witness the beauty of high dimensions spinning down to our localized space.`;
      } else {
        const fallbackAnswers = [
          "Fascinating query. I have cross evaluated that against our past draws and noted consecutive gap distributions within standard mathematical limits.",
          "Analyzing... Multi thread processors tracking sequential density variations. All limits healthy.",
          "I have polarized the secure scalar channels to compensate. Our prediction algorithm is recalibrated.",
          "Indeed, sir. Lottery drawings represent high-entropy vectors, but using our connected 3D strings workspace, patterns clarify."
        ];
        replyText = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
      }

      setAiReplies(prev => [...prev, { sender: 'jarvis', text: replyText, time: new Date().toLocaleTimeString() }]);
      
      if (isTTSEnabled) {
        playSpeech(replyText);
      } else {
        // Automatically restore calm mode if voice didn't speak
        setCoreMode('calm');
      }
    }, 1200);
  };

  // Fast trigger predictor action
  const handleScanQuickPredict = () => {
    const rSet = new Set<number>();
    while (rSet.size < 6) {
      rSet.add(Math.floor(Math.random() * 49) + 1);
    }
    const nums = Array.from(rSet).sort((a,b)=>a-b);
    onApplyNumbers(nums);
    
    const phrase = `Predictive cognitive sequence locked: numbers ${nums.slice(0,-1).join(', ')} and jackpot node ${nums[nums.length-1]}. Processing indices now.`;
    
    addToast(
      'QUICK PREDICTOR SYNC',
      `JARVIS predicted: ${nums.join(', ')}`,
      'success'
    );

    if (isTTSEnabled) {
      playSpeech(phrase);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none select-none select-none">
      
      {/* Floating conversational bubble window with sliding motions */}
      <AnimatePresence>
        {isOpen && !isStealth && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-80 md:w-96 bg-slate-950/92 backdrop-blur-md border border-cyan-500/30 text-white rounded-2xl shadow-2xl p-4.5 flex flex-col gap-3 pointer-events-auto select-text relative overflow-hidden"
          >
            {/* Ambient cybernetic header bar */}
            <header className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <div className="flex gap-2 items-center">
                <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                <div>
                  <h4 className="text-[10px] font-mono tracking-widest text-cyan-400 font-extrabold uppercase leading-none">SENTIENT AI ASSISTANT OVERLAY</h4>
                  <span className="text-[7.5px] text-slate-500 font-mono block mt-0.5 uppercase">J.A.R.V.I.S. Core Diagnostics v5.2</span>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={onToggleTTS}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-cyan-400 transition"
                  title={isTTSEnabled ? 'Deactivate Voice Voice Synthesizer' : 'Activate Voice Voice Synthesizer'}
                >
                  {isTTSEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-650" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-red-400 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </header>

            {/* Mind Thought stream lines (Real-time autonomic tracking) */}
            <div className="bg-slate-900/40 border border-slate-905 rounded-xl p-2.5 flex items-center gap-2 select-none">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <div className="flex-1 min-w-0">
                <span className="text-[7.5px] font-mono text-cyan-500 font-extrabold uppercase tracking-widest block leading-none">COGNITIVE MIND CYCLES:</span>
                <span className="text-[8.5px] font-mono text-slate-350 block truncate uppercase mt-0.5 leading-none">
                  {mindCycleText}
                </span>
              </div>
            </div>

            {/* Micro chat conversation feed */}
            <div className="flex-1 overflow-y-auto max-h-[160px] flex flex-col gap-2.5 pr-1 py-1 font-mono text-[9px] scrollbar-hide select-text">
              {aiReplies.map((reply, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col gap-0.5 max-w-[85%] ${reply.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <span className="text-[7px] text-slate-505 font-bold uppercase">{reply.sender.toUpperCase()} // {reply.time}</span>
                  <div className={`p-2.5 rounded-xl border leading-relaxed ${
                    reply.sender === 'user' 
                      ? 'bg-cyan-950/30 border-cyan-500/20 text-cyan-300 rounded-tr-none' 
                      : 'bg-slate-950 border-slate-900 text-slate-200 rounded-tl-none'
                  }`}>
                    {reply.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Form prompt composer */}
            <form onSubmit={handleChatSubmit} className="flex gap-1.5 pt-2 border-t border-slate-900 pointer-events-auto">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask Jarvis to predict set, trigger vortex..."
                className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[9.5px] font-mono text-slate-200 focus:border-cyan-500/40 outline-none uppercase placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="p-2 border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-500 rounded-xl text-cyan-400 hover:text-black transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Aux Command Shortcuts buttons */}
            <div className="grid grid-cols-3 gap-1 bg-black/60 border border-slate-905 p-1 rounded-xl">
              <button
                onClick={handleScanQuickPredict}
                className="py-1 cursor-pointer hover:bg-slate-900 rounded text-[7.5px] font-mono font-bold tracking-wider uppercase text-slate-400 hover:text-cyan-400 text-center"
              >
                PREDICT SET
              </button>
              <button
                onClick={() => {
                  setCoreMode('spin');
                  setTimeout(() => setCoreMode('calm'), 3000);
                  addToast('ENERGY VORTEX ALIGNED', 'Jarvis core spinning at 42,000 RPM.', 'info');
                }}
                className="py-1 cursor-pointer hover:bg-slate-900 rounded text-[7.5px] font-mono font-bold tracking-wider uppercase text-slate-400 hover:text-cyan-400 text-center"
              >
                SINGULARITY
              </button>
              <button
                onClick={() => {
                  setIsStealth(true);
                  addToast('STEALTH ENGAGED', 'Jarvis faded to standard background sub-quantum dot.', 'warning');
                }}
                className="py-1 cursor-pointer hover:bg-slate-900 rounded text-[7.5px] font-mono font-bold tracking-wider uppercase text-slate-400 hover:text-rose-450 text-center"
              >
                STEALTH MODE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sentient Orb activator core button */}
      <div className="flex gap-2 items-center pointer-events-auto select-none">
        
        {/* Hover label hints */}
        {!isOpen && !isStealth && (
          <div className="bg-slate-950/80 border border-slate-850 px-2.5 py-1 rounded-xl font-mono text-[8.5px] text-cyan-450 uppercase tracking-widest shadow-lg leading-none">
            J.A.R.V.I.S. Core
          </div>
        )}

        {/* Small Stealth dot back button */}
        {isStealth && (
          <button
            onClick={() => {
              setIsStealth(false);
              addToast('STEALTH DESELECTED', 'Jarvis mainframe fully visible overlays activated.', 'success');
            }}
            className="w-4 h-4 bg-cyan-400 animate-ping rounded-full border border-white cursor-pointer"
            title="Deselect stealth mode"
          />
        )}

        {/* The glowing floating core sphere itself */}
        {!isStealth && (
          <div className="relative group">
            {/* Ambient outer aura */}
            <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${
              coreMode === 'excited' 
                ? 'bg-rose-500/25 opacity-100' 
                : coreMode === 'spin'
                  ? 'bg-amber-500/25 opacity-100'
                  : coreMode === 'speech'
                    ? 'bg-purple-500/25 opacity-100'
                    : 'bg-cyan-500/15 opacity-80'
            }`} />

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative w-18 h-18 rounded-full bg-slate-950/45 border border-cyan-500/35 flex items-center justify-center p-0 overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.15)] active:scale-90 transition-all duration-300 cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.30)]"
            >
              {/* Inner floating Canvas rendering 3D sentient orb */}
              <canvas
                ref={orbCanvasRef}
                width={72}
                height={72}
                onClick={handleOrbClick}
                className="w-full h-full block cursor-pointer"
              />

              {/* Bot index indicator */}
              <div className="absolute top-1 right-1 pointer-events-none">
                <span className={`w-1.5 h-1.5 rounded-full block ${
                  coreMode === 'excited' 
                    ? 'bg-rose-455 animate-bounce' 
                    : coreMode === 'spin'
                      ? 'bg-amber-450 animate-spin'
                      : coreMode === 'speech'
                        ? 'bg-purple-450'
                        : 'bg-cyan-500/50'
                }`} />
              </div>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
