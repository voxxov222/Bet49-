import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Terminal, RefreshCw, Send, ShieldCheck, Sparkles, AlertCircle, Copy, HelpCircle } from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface AutonomousThinkEngineProps {
  draws: LottoDraw[];
  isTTSEnabled: boolean;
  playSpeech: (text: string) => void;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyDecryptedNumbers: (nums: number[]) => void;
}

interface BreakthroughResult {
  id: string;
  timestamp: string;
  strategyChannel: string;
  alignmentRating: number;
  patternDetected: string;
  numbers: number[];
}

export default function AutonomousThinkEngine({
  draws,
  isTTSEnabled,
  playSpeech,
  addToast,
  onApplyDecryptedNumbers
}: AutonomousThinkEngineProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [activeAnalysisTask, setActiveAnalysisTask] = useState('CALIBRATING BASE-9 MATRIX ENTROPY GAP...');
  const [activeProgress, setActiveProgress] = useState(0);
  const [discoveryLog, setDiscoveryLog] = useState<BreakthroughResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const taskPool = [
    'POLARIZING CHAOS CHANNELS EXTRAPOLATION...',
    'SCANNIG PRIMAL RECIPROCALS HARMONIC NODES...',
    'EVALUATING E8 LATTICE DEVIATION DEGREES...',
    'SEARCHING BASE-9 DRIFT CONSTELLATIONAL PEAKS...',
    'PROCESSING QUANTUM SWARM VELOCITY RATIOS...',
    'DECIPHERING HIGH-PROBABILITY ENTROPY RANGES...'
  ];

  const syntheticPatterns = [
    'Hot Base-9 cluster deviation centered at prime points.',
    'Double helix spiral wave convergence found at nodes [12..28].',
    '3D cube matrix sequence intersection locked.',
    'Symmetric reciprocals mirror gap alignment matched.',
    'E8 spatial density deviation mapped on vectors.'
  ];

  const strategyChannels = [
    'Chaos Vector Cascade',
    'Statistical Density Core',
    'Hyper-Dimension Projects',
    'Mystical Balancing Loops'
  ];

  // Primary background research execution ticker
  useEffect(() => {
    if (!isRunning) return;

    // Fast-pacing micro percentage tracer
    const progressInterval = setInterval(() => {
      setActiveProgress(prev => {
        if (prev >= 100) return 100;
        const next = prev + Math.floor(Math.random() * 4) + 1;
        return next >= 100 ? 100 : next;
      });
    }, 400);

    return () => clearInterval(progressInterval);
  }, [isRunning]);

  // Execute complete breakthroughs when activeProgress reaches 100
  useEffect(() => {
    if (activeProgress >= 100) {
      completeAutonomousAnalysisRun();
      setActiveProgress(0);
    }
  }, [activeProgress]);

  // Execute complete breakthroughs
  const completeAutonomousAnalysisRun = () => {
    if (draws.length === 0) return;

    // Pick 6 unique random numbers (1 to 49) representing J.A.R.V.I.S predictions
    const nums: number[] = [];
    while (nums.length < 6) {
      const rand = Math.floor(Math.random() * 49) + 1;
      if (!nums.includes(rand)) nums.push(rand);
    }
    nums.sort((a, b) => a - b);

    // Formulate realistic strategy finding data
    const chosenChannel = strategyChannels[Math.floor(Math.random() * strategyChannels.length)];
    const chosenPattern = syntheticPatterns[Math.floor(Math.random() * syntheticPatterns.length)];
    const score = Math.floor(Math.random() * 22) + 72; // High ratings 72-94%

    const newItem: BreakthroughResult = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
      strategyChannel: chosenChannel,
      alignmentRating: score,
      patternDetected: chosenPattern,
      numbers: nums
    };

    setDiscoveryLog(prev => [newItem, ...prev.slice(0, 15)]);
    
    // Switch task text to next random pointer
    const nextTask = taskPool[Math.floor(Math.random() * taskPool.length)];
    setActiveAnalysisTask(nextTask);

    // Emit HUD Toasts
    addToast(
      'AUTONOMOUS BREAKTHROUGH',
      `JARVIS Decrypted [${nums.join(', ')}] on ${chosenChannel}. Coeff Align: ${score}%`,
      'success'
    );

    // Call Jarvis Vocal synthesizer
    if (isTTSEnabled) {
      const voiceIntroOptions = [
        `Sir, I have computed a breakthrough sequence. Core alignment: ${score} percent.`,
        `Autonomous sweep complete. Convergence detected inside the ${chosenChannel} channel.`,
        `Highly stable pattern match identified. Transmitting coordinate coordinates now.`
      ];
      playSpeech(voiceIntroOptions[Math.floor(Math.random() * voiceIntroOptions.length)]);
    }
  };

  const copyToClipboard = (nums: number[], id: string) => {
    navigator.clipboard.writeText(nums.join(', '));
    setCopiedId(id);
    addToast('COORDINATES ENCODED', `Sequence ${nums.join(', ')} written to client clip.`, 'info');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-5 flex flex-col gap-4.5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/25 transition-all duration-500 relative overflow-hidden">
      
      {/* Glitchy laser neon lights */}
      <div className="absolute inset-x-0 -top-1 h-[2px] bg-cyan-400 opacity-20 blur-[1px] animate-pulse" />

      <header className="flex justify-between items-center border-b border-slate-800/85 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Cpu className="w-5 h-5 text-cyan-400 animate-[spin_8s_linear_infinite]" />
            <span className="absolute inset-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-60" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-cyan-450 uppercase">JARVIS COGNITIVE RESEARCH MATRIX</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">CONTINUOUS SECURED DECRYPTION & HEURISTIC MODEL SCANS</p>
          </div>
        </div>

        <button
          onClick={() => setIsRunning(prev => !prev)}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-widest font-extrabold uppercase transition cursor-pointer border ${
            isRunning 
              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20' 
              : 'border-amber-500/30 text-amber-500 bg-amber-950/20'
          }`}
        >
          {isRunning ? 'AGENT ACTIVE' : 'AGENT STANDBY'}
        </button>
      </header>

      {/* Live progress calibration ticker panel */}
      {isRunning ? (
        <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-[9px] font-mono leading-none select-none">
            <span className="text-cyan-400 font-bold uppercase flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3 h-3 text-cyan-500 animate-spin" />
              {activeAnalysisTask}
            </span>
            <span className="text-purple-405 font-bold tracking-widest">{activeProgress}% COMPLETED</span>
          </div>

          <div className="h-1.5 bg-black rounded-full overflow-hidden p-0.5 relative">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${activeProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/45 border border-slate-900/60 rounded-xl p-4 text-center">
          <span className="text-[10px] font-mono text-slate-550 uppercase font-black">
            AUTONOMOUS SCAVENGER SUBSYSTEM PAUSED. STANDBY INITIATED.
          </span>
        </div>
      )}

      {/* Discovery Logs history column */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[9.5px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5 text-cyan-500" />
          ACTIVE DECIPHER BREAKTHROUGHS ({discoveryLog.length})
        </span>

        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-900">
          <AnimatePresence initial={false}>
            {discoveryLog.length === 0 ? (
              <div className="text-center font-mono py-8 text-[10px] text-slate-500 border border-dashed border-slate-900 rounded-xl">
                RUNNING INITIAL SYSTEM SWEEP MATRIX... TIME LAPSE UNTIL FIRST QUANTUM BREAKTHROUGH: ~20 SECS
              </div>
            ) : (
              discoveryLog.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-black/60 border border-slate-900 hover:border-slate-800 rounded-xl p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors"
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/20 text-cyan-330 uppercase">
                        {log.strategyChannel}
                      </span>
                      <span className="text-[8px] font-mono text-slate-500">
                        DECIPHERED {log.timestamp}
                      </span>
                      <span className="text-[9px] font-mono font-black text-rose-450 border border-rose-500/20 px-1 py-0.5 rounded bg-rose-950/20">
                        {log.alignmentRating}% FIT ACCURACY
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium">
                      {log.patternDetected}
                    </p>

                    <div className="flex gap-1 items-center mt-1">
                      {log.numbers.map(num => (
                        <div 
                          key={num} 
                          className="w-5 h-5 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono font-black text-slate-350 flex items-center justify-center"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => copyToClipboard(log.numbers, log.id)}
                      className="p-1.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 transition text-slate-400 hover:text-slate-200 cursor-pointer"
                      title="Copy elements"
                    >
                      {copiedId === log.id ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        onApplyDecryptedNumbers(log.numbers);
                        addToast('COORDINATE MATRIX RESTRUCTURED', 'Selected autonomic sequence loaded into computation workspace.', 'success');
                      }}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/25 rounded-lg text-[9px] font-mono font-extrabold text-cyan-300 hover:text-cyan-200 transition cursor-pointer flex items-center gap-1 active:scale-95 text-center leading-none"
                    >
                      <Send className="w-3 h-3 text-cyan-400" />
                      LOAD VECTOR
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
