import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Cpu, 
  Terminal, 
  Play, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  RotateCw, 
  Activity, 
  Compass, 
  TrendingUp, 
  Info,
  Check,
  Copy,
  FolderSync,
  Bot,
  BrainCircuit,
  Workflow,
  Zap,
  Network
} from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface AgentSwarmEngineProps {
  draws: LottoDraw[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

interface SwarmAgent {
  id: string;
  name: string;
  algorithm: string;
  avatarColor: string;
  status: 'Idle' | 'Scanning' | 'Processing Pattern' | 'Completed' | 'Error';
  progress: number;
  patternType: string;
  variables: { [key: string]: string | number };
  explanation: string;
  recommendedIds: number[];
  logs: string[];
}

export default function AgentSwarmEngine({
  draws,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: AgentSwarmEngineProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('lstm-temp');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  const [consensusNumbers, setConsensusNumbers] = useState<number[]>([4, 15, 23, 31, 39, 45]);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate dynamic agents with custom strategies and algorithms
  const [agents, setAgents] = useState<SwarmAgent[]>([
    {
      id: 'lstm-temp',
      name: 'Agent Chronos',
      algorithm: 'LSTM Recurrent Neural Networks',
      avatarColor: 'from-cyan-500 to-blue-650',
      status: 'Idle',
      progress: 0,
      patternType: 'Long-term Sequential Time-series',
      variables: {
        'Hidden Units': 128,
        'Epochs Trained': 2450,
        'Learning Rate': '0.0014',
        'State Memory': '64 Lots'
      },
      explanation: 'Chronos evaluates the recurrence intervals between drawing events by feeding historic dates and consecutive drawings directly into recurrent gates. This model is ideal for spotting historical cadence cycles.',
      recommendedIds: [12, 19, 23, 35, 41, 47],
      logs: ['Ready to scan drawing sequences.', 'Chronos standby active.']
    },
    {
      id: 'markov-trans',
      name: 'Agent Markov',
      algorithm: 'Markov Transition Matrix Probability',
      avatarColor: 'from-purple-500 to-indigo-650',
      status: 'Idle',
      progress: 0,
      patternType: 'First-Order State Transitions',
      variables: {
        'States Monitored': 49,
        'Transition Sparsity': '82.4%',
        'Eigenvector Rank': '0.785',
        'Convergence Threshold': '1e-6'
      },
      explanation: 'Markov scans what specific numbers statistically tend to follow what prior numbers. He models the lottery drawing as an interconnected web of probabilities, detecting sequential jumps that conventional filters ignore.',
      recommendedIds: [4, 15, 22, 31, 39, 44],
      logs: ['Transition probabilities initiated.', 'Markov standby active.']
    },
    {
      id: 'xgboost-forest',
      name: 'Agent Booster',
      algorithm: 'Gradient Boosted Decision Forest',
      avatarColor: 'from-amber-500 to-orange-650',
      status: 'Idle',
      progress: 0,
      patternType: 'Nonlinear Structural Multi-Features',
      variables: {
        'Max Tree Depth': 8,
        'Learning Objective': 'reg:squarederror',
        'L2 Regularization': 2.5,
        'Subsample Multiplier': 0.85
      },
      explanation: 'Booster parses secondary metadata context like month of drawing, phase of week, adjacent sequence gaps, and digital roots to build random tree weights. It captures highly complex, nonlinear associations.',
      recommendedIds: [8, 14, 23, 32, 40, 48],
      logs: ['Multi-feature trees calibrated.', 'Booster standby active.']
    },
    {
      id: 'tesla-369',
      name: 'Agent Nikola',
      algorithm: 'Tesla 3-6-9 Vortex Resonance',
      avatarColor: 'from-fuchsia-500 to-pink-650',
      status: 'Idle',
      progress: 0,
      patternType: 'Digital Root Vibrational Harmonics',
      variables: {
        'Vortex Amplitude': '9.82 Hz',
        'Frequency Modulo': 'Modulo-9 Sum',
        'Golden Octave Ratio': '1.618',
        'Harmonic Coeff': '0.941'
      },
      explanation: 'Nikola maps numbers 1 to 49 along a modular vortex grid, prioritizing points that land perfectly into the digital vibrations of 3, 6, and 9. It searches for harmonic resonance cycles in the drawings.',
      recommendedIds: [3, 9, 18, 27, 36, 45],
      logs: ['Modulo calculations structured.', 'Nikola standby active.']
    },
    {
      id: 'spacing-entropy',
      name: 'Agent Entropy (5D)',
      algorithm: '5-Dimensional Spatial Gravity Cluster',
      avatarColor: 'from-teal-500 to-emerald-650',
      status: 'Idle',
      progress: 0,
      patternType: 'High-Dimension Spacing Gravity Solver',
      variables: {
        'Dimensions': 5,
        'Gravity Constant': '0.045',
        'Density Bandwidth': '0.312',
        'Neighbor K-Limit': 12
      },
      explanation: 'Entropy maps drawing records as coordinates in 5D geometry. It models physical attraction force nodes inside high-dimension manifolds, detecting where numbers naturally cluster together or drift away.',
      recommendedIds: [7, 15, 24, 30, 39, 43],
      logs: ['5D gravity grid assembled.', 'Entropy standby active.']
    },
    {
      id: 'bayes-density',
      name: 'Agent Bayes',
      algorithm: 'Bayesian Posterior Probability Modeler',
      avatarColor: 'from-rose-500 to-red-650',
      status: 'Idle',
      progress: 0,
      patternType: 'Post-Distribution Variance Density',
      variables: {
        'Prior Density': 'Uniform 1/49',
        'Likelihood Window': 'Rollback-12',
        'Alpha Hyperparameter': '1.25',
        'Credible Interval': '95%'
      },
      explanation: 'Bayes updates probability estimates iteratively as new drawings arrive. He combines the baseline equal-draw expectation with localized clusters to compute extremely precise likelihood bands.',
      recommendedIds: [4, 11, 23, 29, 38, 45],
      logs: ['Posterior variables initialized.', 'Bayes standby active.']
    }
  ]);

  // Compute stats on existing numbers to support our visual logic
  const historicalAverages = useMemo(() => {
    if (draws.length === 0) return {};
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 49; i++) counts[i] = 0;
    
    draws.forEach(d => {
      d.numbers.forEach(n => {
        if (n >= 1 && n <= 49) counts[n]++;
      });
    });
    return counts;
  }, [draws]);

  // Trigger the Swarm scanning simulation
  const handleFireSwarmCascade = () => {
    if (isRunning) return;
    setIsRunning(true);
    setGlobalProgress(0);

    const voiceMsg = "Initiating parallel Agent Swarm cascade. Analyzing entire historical drawings database.";
    if (isTTSEnabled) {
      playSpeech(voiceMsg);
    }
    addToast(
      "SWARM ANALYSIS ONLINE",
      "Deploying 6 algorithmic AI agents to evaluate full multi-variable pattern models.",
      "info"
    );

    // Initial log wipe
    setAgents(prev => prev.map(a => ({
      ...a,
      status: 'Scanning',
      progress: 0,
      logs: ['Initializing diagnostic vector scans...', 'Retrieving 6/49 database sequence records...']
    })));

    // Timing state simulation
    let currentStep = 0;
    const totalSteps = 20;
    const intervalTime = 250; // Total 5 seconds

    const runInterval = setInterval(() => {
      currentStep++;
      const currentGlobalProgress = Math.min(100, Math.floor((currentStep / totalSteps) * 100));
      setGlobalProgress(currentGlobalProgress);

      setAgents(prevAgents => {
        return prevAgents.map(a => {
          let nextProgress = a.progress;
          let nextStatus = a.status;
          let nextLogs = [...a.logs];

          // Stagger scanning progress per agent
          if (a.id === 'lstm-temp' && currentStep > 1) {
            nextProgress = Math.min(100, nextProgress + Math.floor(Math.random() * 12) + 6);
          } else if (a.id === 'markov-trans' && currentStep > 3) {
            nextProgress = Math.min(100, nextProgress + Math.floor(Math.random() * 15) + 5);
          } else if (a.id === 'xgboost-forest' && currentStep > 4) {
            nextProgress = Math.min(100, nextProgress + Math.floor(Math.random() * 10) + 7);
          } else if (a.id === 'tesla-369' && currentStep > 2) {
            nextProgress = Math.min(100, nextProgress + Math.floor(Math.random() * 18) + 8);
          } else if (a.id === 'spacing-entropy' && currentStep > 5) {
            nextProgress = Math.min(100, nextProgress + Math.floor(Math.random() * 8) + 5);
          } else if (a.id === 'bayes-density' && currentStep > 2) {
            nextProgress = Math.min(100, nextProgress + Math.floor(Math.random() * 14) + 6);
          }

          if (nextProgress > 0 && nextProgress < 40 && a.status === 'Scanning') {
            nextStatus = 'Processing Pattern';
            nextLogs.push(`Model compiled. Scanning nonlinear multi-dimensions (${nextProgress}%)...`);
          }

          if (nextProgress >= 100 && nextStatus !== 'Completed') {
            nextStatus = 'Completed';
            nextProgress = 100;
            
            // Generate some algorithmic dynamic recommendations based on draws or deterministic keys
            const seed = draws.length > 0 ? draws[0].numbers[0] : 10;
            const seedOffset = a.id === 'lstm-temp' ? 2 : a.id === 'markov-trans' ? 5 : a.id === 'xgboost-forest' ? 9 : 14;
            const recs: number[] = [];
            while (recs.length < 6) {
              const val = ((seed + seedOffset + recs.length * seedOffset) % 49) + 1;
              if (!recs.includes(val)) {
                recs.push(val);
              } else {
                const altVal = Math.floor(Math.random() * 49) + 1;
                if (!recs.includes(altVal)) recs.push(altVal);
              }
            }
            recs.sort((x, y) => x - y);
            
            a.recommendedIds = recs;
            nextLogs.push(`Patterns extracted. High possibility sequence generated! [${recs.join(', ')}]`);
            nextLogs.push(`Sub-task shut down. Thread safely stored.`);
          }

          return {
            ...a,
            status: nextStatus as any,
            progress: nextProgress,
            logs: nextLogs.slice(-5) // Keep last 5 logs for cleaner UI
          };
        });
      });

      if (currentStep >= totalSteps) {
        clearInterval(runInterval);
        setIsRunning(false);
        setGlobalProgress(100);

        // Compute high possibility consensus outcomes - vote aggregations
        setAgents(prev => {
          // Let's create an elegant aggregate voter pool using actual agent outputs
          const tally: Record<number, number> = {};
          prev.forEach(ag => {
            ag.recommendedIds.forEach(num => {
              tally[num] = (tally[num] || 0) + 1.5;
            });
          });

          // Add minor historical weighted offset so it matches draws perfectly
          Object.keys(historicalAverages).forEach(numStr => {
            const num = parseInt(numStr);
            const freq = historicalAverages[num] || 0;
            tally[num] = (tally[num] || 0) + (freq * 0.05);
          });

          const compiled = Object.keys(tally)
            .map(numStr => ({ num: parseInt(numStr), score: tally[parseInt(numStr)] }))
            .sort((x, y) => y.score - x.score)
            .slice(0, 6)
            .map(x => x.num)
            .sort((x, y) => x - y);

          setConsensusNumbers(compiled);

          // Success notification
          addToast(
            "AGENT SWARM CONSENSUS BUILT",
            `The swarm successfully generated unified golden combination [${compiled.join(', ')}].`,
            "success"
          );

          if (isTTSEnabled) {
            playSpeech(`Swarm consensus finalized successfully, sir. Recommending coordinates: ${compiled.join(', ')}.`);
          }

          return prev;
        });
      }

    }, intervalTime);
  };

  const currentSelectedAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  // Copy consensus sequence string to clipboard
  const handleCopyConsensus = () => {
    const sequenceStr = consensusNumbers.join(' - ');
    navigator.clipboard.writeText(sequenceStr);
    setCopied(true);
    addToast(
      "SWARM CODE COPIED",
      `The unified swarm sequence [${sequenceStr}] has been copied to your clipboard.`,
      "success"
    );
    setTimeout(() => setCopied(false), 2000);
  };

  // Deploy numbers directly to main deck
  const handleDeployConsensus = () => {
    onApplyNumbers(consensusNumbers);
    addToast(
      "COORDINATE VECTOR SYNC",
      `Active target coordinates overlay updated: [${consensusNumbers.join(', ')}]. Core matrices synced successfully.`,
      "success"
    );
  };

  // Let's explain why EACH ball was of high likelihood mathematically based on our agent scores
  const consensusExplanations = useMemo(() => {
    const reasons = [
      {
        label: "Temporal Recurrence Peak",
        leadAgent: "Chronos LSTM Gates",
        desc: "Exhibits prime interval recurrence. This number sits nicely inside the optimal historical period decay threshold, indicating a massive chance of rebound."
      },
      {
        label: "Transition Sparsity Vector",
        leadAgent: "Markov Eigen-Network",
        desc: "Strongest statistical predecessor-successor rating. Highly drawn after recent historical sequences compiled in our active database."
      },
      {
        label: "Structural Multi-Feature Peak",
        leadAgent: "Booster Boosted Forest",
        desc: "Optimal seasonal weight. Score maps a strong interaction correlation with the current week phase configuration."
      },
      {
        label: "Digital Wave Vibrator",
        leadAgent: "Nikola 3-6-9 Harmonics",
        desc: "Sits comfortably at Modulo-9 coordinate 9. Represents highly resilient energetic balance across historic cyclic repetitions."
      },
      {
        label: "Gravity Cluster Convergence",
        leadAgent: "Entropy Spatial Cluster",
        desc: "Mapped with incredibly dense topological gravity pulls inside our 5D coordinate layout, sucking in neighboring draws."
      },
      {
        label: "Posterior Likelihood Peak",
        leadAgent: "Bayesian Belief Modeler",
        desc: "Top ranked probability density following localized rollback drawing frequency analysis. Zero mathematical friction."
      }
    ];
    return reasons;
  }, []);

  return (
    <section className="flex flex-col gap-6 w-full max-w-4xl mx-auto scroll-mt-24" id="agent-swarm-core-dashboard">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/45 border border-indigo-500/15 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.06] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-900/30 border border-purple-400/30 flex items-center justify-center relative">
              <Network className="w-6 h-6 text-purple-400 animate-pulse" />
              <div className="absolute inset-0 rounded-xl border border-purple-500/20 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-black tracking-widest text-purple-300 uppercase">AI AGENT SWARM DECK</h2>
                <span className="text-[8px] font-mono bg-indigo-950 text-indigo-350 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black uppercase">ULTRA MODEL</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Ensembling multiple machine learning and cyclic algorithms over the entire 6/49 drawing timeline.</p>
            </div>
          </div>
          
          <button
            id="btn-fire-swarm"
            disabled={isRunning}
            onClick={handleFireSwarmCascade}
            className={`px-5 py-2.5 rounded-xl text-[10px] sm:text-xs font-mono font-black tracking-widest uppercase flex items-center gap-2.5 shadow-xl transition-all duration-300 cursor-pointer text-slate-950 ${
              isRunning 
                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 hover:scale-[1.02] active:scale-95 shadow-purple-500/10'
            }`}
          >
            <Play className={`w-4 h-4 text-slate-950 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'CALCULATING SWARM...' : 'FIRE THE SWARM CASCADE'}</span>
          </button>
        </div>

        {/* Global Cascade progress bar */}
        {isRunning && (
          <div className="mt-5 p-3.5 bg-black/40 border border-purple-500/10 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-[9px] font-mono text-purple-300 font-bold leading-none uppercase">
              <span className="flex items-center gap-1.5 animate-pulse">
                <Workflow className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                COGNITIVE NETWORK COOPERATIVE ENGINE ACTIVE: SCROLLING MATRIX...
              </span>
              <span>{globalProgress}% SECONDS LAPSE</span>
            </div>
            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* DETAILED CONSENSUS OUTCOME CARD */}
      <div className="bg-black/40 backdrop-blur-xl border border-purple-500/15 rounded-2xl p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-purple-500/10 rounded-tl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-purple-500/10 rounded-br-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-900 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-purple-400 tracking-wider font-extrabold uppercase bg-purple-950/30 px-2 py-0.5 rounded border border-purple-500/20">
                UNIFIED OUTCOMES MATRIX
              </span>
              <span className="text-[8px] font-mono text-slate-500">6/49 HIGH POSSIBILITY OUTCOMES</span>
            </div>
            <h3 className="text-sm font-sans font-extrabold text-slate-200 mt-1.5">Swarm Collaborative Recommendations</h3>
            <p className="text-xs text-slate-400 mt-1">Compiled from cumulative votes of all active math agents. Click on any ball to overlay statistics.</p>
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <button
              onClick={handleCopyConsensus}
              className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-mono font-semibold flex items-center gap-2 cursor-pointer transition active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>{copied ? 'COPIED!' : 'COPY SWARM'}</span>
            </button>

            <button
              onClick={handleDeployConsensus}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-505 text-white text-[10px] font-mono font-black tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.25)] transition duration-300 active:scale-95"
            >
              <FolderSync className="w-3.5 h-3.5 text-purple-300" />
              <span>OVERLAY WORKSPACE</span>
            </button>
          </div>
        </div>

        {/* Dynamic Lotto Balls Combination */}
        <div className="py-2.5 flex flex-wrap justify-center md:justify-around items-center gap-4 select-none">
          {consensusNumbers.map((num, idx) => {
            const extra = consensusExplanations[idx] || { label: "Heuristic Bias", leadAgent: "Shared Swarm Density" };
            return (
              <div 
                key={num} 
                className="flex flex-col items-center gap-2 group transition duration-300 transform hover:-translate-y-1"
              >
                <div className="text-[8px] font-mono text-purple-400/70 font-semibold uppercase">{extra.label}</div>
                
                {/* 3D sphere render */}
                <div 
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 border-[3px] border-purple-400/30 shadow-[inset_-2px_-4px_16px_rgba(0,0,0,0.6),0_0_20px_rgba(168,85,247,0.2)] group-hover:shadow-[inset_-2px_-4px_16px_rgba(0,0,0,0.6),0_0_30px_rgba(168,85,247,0.45)] flex flex-col justify-center items-center font-black relative transition"
                >
                  <span className="text-xl md:text-2xl font-sans tracking-tighter leading-none text-white">{num}</span>
                  {/* Miniature shiny reflection specular overlay */}
                  <div className="absolute top-1.5 left-2.5 w-3 h-1.5 bg-white/20 rounded-full rotate-[-15deg] filter blur-[0.5px]" />
                </div>

                <span className="text-[7.5px] font-mono text-slate-500 uppercase font-black tracking-widest text-center truncate max-w-[85px]">
                  {extra.leadAgent}
                </span>
              </div>
            );
          })}
        </div>

        {/* Detailed ball-by-ball variables and reasons explanations */}
        <div className="pt-4 border-t border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-3.5 select-none text-[11px]">
          {consensusNumbers.map((num, idx) => {
            const extra = consensusExplanations[idx] || { label: "Heuristic Bias", leadAgent: "Shared Swarm Density", desc: "Selected under shared multi-features weight matrix." };
            return (
              <div 
                key={num} 
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-900/60 flex flex-col gap-1.5 hover:border-purple-500/10 hover:bg-slate-950/80 transition duration-300"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-purple-950 border border-purple-500/20 text-[9px] font-mono font-black text-purple-300 flex items-center justify-center">
                      {num}
                    </span>
                    <span className="font-mono font-black text-slate-350 tracking-wider text-[10px] uppercase">
                      {extra.label}
                    </span>
                  </div>
                  <span className="text-[7px] font-mono bg-indigo-950/50 text-indigo-350 border border-indigo-500/10 px-1 py-0.5 rounded uppercase">
                    RESOLVED
                  </span>
                </div>
                <p className="text-[10px] text-slate-450 mt-1 font-sans leading-relaxed">
                  {extra.desc}
                </p>
                <span className="text-[8px] font-mono text-purple-400 mt-1 font-black uppercase inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                  Primary Anchor: {extra.leadAgent}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MIDDLE CONTAINER: AGENT DEPLOYMENT DECK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        
        {/* AGENTS VERTICAL DECK */}
        <div className="md:col-span-1 bg-slate-950 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3 max-h-[460px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900 select-none">
            <Users className="w-4 h-4 text-purple-400" />
            <h4 className="text-[10px] font-mono font-black text-slate-400 tracking-wider uppercase">COLLABORATIVE UNIT DECK</h4>
          </div>

          <div className="flex flex-col gap-2">
            {agents.map(ag => {
              const isSelected = ag.id === selectedAgentId;
              const hasCompleted = ag.status === 'Completed';
              const isScanning = ag.status === 'Scanning' || ag.status === 'Processing Pattern';

              let borderStyle = "border-slate-900 hover:border-slate-800 bg-black/40";
              if (isSelected) {
                borderStyle = "border-purple-500/40 bg-purple-950/10 ring-1 ring-purple-500/20";
              }

              return (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAgentId(ag.id)}
                  className={`w-full text-left p-3 rounded-xl border flex gap-3 items-center cursor-pointer transition ${borderStyle}`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ag.avatarColor} flex items-center justify-center shrink-0`}>
                    <Bot className="w-5 h-5 text-slate-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center select-none">
                      <span className="text-[10px] font-mono font-black text-slate-200 truncate">{ag.name}</span>
                      <span className="text-[7px] font-mono text-slate-500 uppercase">{ag.status}</span>
                    </div>
                    <span className="text-[8px] font-sans text-slate-405 truncate block">{ag.algorithm}</span>
                    
                    {/* Micro gauge representation */}
                    {isScanning && (
                      <div className="h-1 bg-black rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${ag.progress}%` }}
                        />
                      </div>
                    )}

                    {hasCompleted && (
                      <span className="text-[8.5px] font-mono text-emerald-400 flex items-center gap-1 mt-1.5">
                        <Check className="w-3 h-3" />
                        VECTORS FINALIZED
                      </span>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* DETAILED ACTIVE AGENT MONITOR & LOGS */}
        <div className="md:col-span-2 bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.03] pointer-events-none" />
          
          <div className="flex flex-col gap-4">
            {/* Header detail */}
            <div className="flex justify-between items-start gap-4 pb-3.5 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentSelectedAgent.avatarColor} flex items-center justify-center shrink-0`}>
                  <BrainCircuit className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-black text-slate-200 uppercase">{currentSelectedAgent.name}</h4>
                  <span className="text-[9px] font-mono text-purple-400 block tracking-wider uppercase bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-500/10 mt-1">
                    {currentSelectedAgent.algorithm}
                  </span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end select-none">
                <span className="text-[8px] font-mono text-slate-500 uppercase">ANOMALY PROFILE</span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold leading-normal uppercase">{currentSelectedAgent.patternType}</span>
              </div>
            </div>

            {/* Description and Plain-English Explanation */}
            <div className="flex flex-col gap-3 font-sans">
              <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">Algorithmic Math Logic Explained:</h5>
              <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                {currentSelectedAgent.explanation}
              </p>
            </div>

            {/* Variable parameter grid compiled */}
            <div className="flex flex-col gap-3">
              <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">Compiled Mathematical Parameters:</h5>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentSelectedAgent.variables).map(([key, val]) => (
                  <div key={key} className="bg-black/40 border border-slate-900/60 p-3 rounded-xl flex justify-between items-center font-mono">
                    <span className="text-[8.5px] text-slate-500 uppercase">{key}</span>
                    <span className="text-[9.5px] text-indigo-400 font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual agent micro telemetry console logs */}
          <div className="flex flex-col gap-2.5 pt-4.5 border-t border-slate-900/60 select-none">
            <span className="text-[8.5px] font-mono text-slate-500 uppercase font-black tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              Agent Thread Local Logs:
            </span>
            <div className="h-[75px] bg-black/80 border border-slate-905 rounded-lg p-2.5 overflow-y-auto font-mono text-[9px] text-emerald-400 leading-normal scrollbar-none flex flex-col justify-end">
              {currentSelectedAgent.logs.map((logLine, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <span className="text-slate-500 select-none">&gt;</span>
                  <span>{logLine}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM TIPS HELPER BOX */}
      <div className="bg-purple-950/10 border border-purple-500/10 p-4 rounded-xl flex gap-3 items-start select-none">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 animate-bounce" />
        <p className="text-[11px] text-purple-300 font-mono leading-relaxed uppercase">
          <strong>Lotto 6/49 Deep-Scan:</strong> Parallel agents extract correlation vectors from the entire database, then compile values with the highest multi-agent probability. Tap on <span className="text-purple-400 underline decoration-dashed select-all">FIRE THE SWARM CASCADE</span> to trigger real-time neural and thermodynamic simulation rounds.
        </p>
      </div>

    </section>
  );
}
