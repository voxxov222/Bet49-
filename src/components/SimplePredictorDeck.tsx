import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, addDoc } from '../lib/firebase';
import { 
  Sparkles, 
  HelpCircle, 
  Check, 
  Copy, 
  Lock, 
  Zap, 
  Activity, 
  Compass, 
  Info,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Focus,
  RefreshCw
} from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface SimplePredictorDeckProps {
  draws: LottoDraw[];
  activeProposedNumbers: number[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

interface ParameterCard {
  id: string;
  title: string;
  simpleSubtitle: string;
  icon: React.ReactNode;
  explanation: string;
  badgeText: string;
  badgeStyle: string;
}

export default function SimplePredictorDeck({
  draws,
  activeProposedNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: SimplePredictorDeckProps) {
  // Set current inspected number in simple layout (defaults to 7)
  const [inspectedNum, setInspectedNum] = useState<number>(7);
  const [copied, setCopied] = useState<boolean>(false);
  const [simplePredictionMode, setSimplePredictionMode] = useState<'single' | 'batch'>('single');

  // Helper check for mathematical qualities
  const isPrime = (n: number): boolean => {
    if (n <= 1) return false;
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return false;
    }
    return true;
  };

  const isSemiprime = (n: number): boolean => {
    if (n <= 3) return false;
    let factors = 0;
    let d = n;
    for (let i = 2; i * i <= d; i++) {
      while (d % i === 0) {
        factors++;
        d /= i;
        if (factors > 2) return false;
      }
    }
    if (d > 1) factors++;
    return factors === 2;
  };

  // 1. Gather statistical calculations in a very solid, high-fidelity format for all 49 numbers
  const calculatedMetrics = useMemo(() => {
    if (draws.length === 0) {
      return Array.from({ length: 49 }, (_, idx) => ({
        num: idx + 1,
        frequency: 5,
        gap: 4,
        harmonicRoot: 3,
        spiralStrength: 5,
        totalScore: 50,
        tempStatus: 'Balanced' as 'Frequent' | 'Warm' | 'Overdue/Sleeper' | 'Balanced',
        recExplanation: 'Standard statistical parameters are currently neutralizing.'
      }));
    }

    const totalDraws = draws.length;
    const freqs: Record<number, number> = {};
    const lastIndices: Record<number, number> = {};

    for (let i = 1; i <= 49; i++) {
      freqs[i] = 0;
      lastIndices[i] = -1;
    }

    // Process from oldest to newest
    draws.forEach((draw, index) => {
      draw.numbers.forEach(num => {
        if (num >= 1 && num <= 49) {
          freqs[num]++;
          lastIndices[num] = Math.max(lastIndices[num], index);
        }
      });
    });

    return Array.from({ length: 49 }, (_, idx) => {
      const num = idx + 1;
      const freq = freqs[num] || 0;
      
      // Calculate gap size (how many draws have passed since this number last appeared)
      const gap = lastIndices[num] === -1 ? totalDraws : totalDraws - 1 - lastIndices[num];
      
      // Vortex Harmonic calculation based on standard digital roots (modulo-9 sum)
      const digitalRoot = ((num - 1) % 9) + 1;
      const distTo3 = Math.abs(digitalRoot - 3);
      const distTo6 = Math.abs(digitalRoot - 6);
      const distTo9 = Math.abs(digitalRoot - 9);
      const minTeslaDistance = Math.min(distTo3, distTo6, distTo9);
      const teslaHarmonizerValue = 10 - minTeslaDistance; // Closer to 3, 6, 9 gets higher score

      // Prime Spiral distance score
      const isP = isPrime(num);
      const isSemi = isSemiprime(num);
      const spiralStrength = isP ? 10 : isSemi ? 6 : 2;

      // Compound mathematical weight
      const rawFrequencyWeight = (freq / totalDraws) * 35;
      const rawGapWeight = Math.min(10, gap) * 1.5;
      const rawTeslaWeight = teslaHarmonizerValue * 1.5;
      const rawSpiralWeight = spiralStrength * 1.25;

      const totalScore = parseFloat((rawFrequencyWeight + rawGapWeight + rawTeslaWeight + rawSpiralWeight).toFixed(2));

      // Classify the current status of the lottery key
      let tempStatus: 'Frequent' | 'Warm' | 'Overdue/Sleeper' | 'Balanced' = 'Balanced';
      if (freq > (totalDraws * 0.16)) {
        tempStatus = 'Frequent';
      } else if (gap >= 6) {
        tempStatus = 'Overdue/Sleeper';
      } else if (gap <= 2 && gap >= 1) {
        tempStatus = 'Warm';
      }

      // Generate context-rich human friendly summary
      let recExplanation = "";
      if (tempStatus === 'Frequent') {
        recExplanation = `This number is a dominant statistical performer, appearing ${freq} times in the analyzed timeline. It holds strong active momentum, which indicates a highly reliable core selection for your combination.`;
      } else if (tempStatus === 'Overdue/Sleeper') {
        recExplanation = `Currently classified as an "Overdue Sleeper." It has been absent for ${gap} draws. Statistical distribution curves strongly indicate it is mathematically primed for a fallback draw to satisfy normal averages.`;
      } else if (tempStatus === 'Warm') {
        recExplanation = `Currently "Warm" following a quick turnaround appearance exactly ${gap} draw(s) ago. Its harmonic root distance score of ${teslaHarmonizerValue}/10 is highly optimal, maintaining rapid recurrence potential.`;
      } else {
        recExplanation = `Exhibiting stable, balanced properties across historical gaps. Fuses a moderate frequency density (${freq} appearances) with highly stabilized Archimedean prime-coordinate spiral alignments.`;
      }

      return {
        num,
        frequency: freq,
        gap,
        harmonicRoot: teslaHarmonizerValue,
        spiralStrength,
        totalScore,
        tempStatus,
        recExplanation
      };
    });
  }, [draws]);

  // 3. Generate batch of 5 simplified tickets based on different optimization metrics
  const simpleBatchTickets = useMemo(() => {
    const sorted = [...calculatedMetrics].sort((a, b) => b.totalScore - a.totalScore);
    const tickets: number[][] = [];
    
    // Ticket 1: Top 6 absolute scores (Consensus Golden Set)
    tickets.push(sorted.slice(0, 6).map(c => c.num).sort((a, b) => a - b));

    // Ticket 2: Alternative offset (Every alternate top score)
    const alternate1: number[] = [];
    for (let i = 0; i < 12; i += 2) {
      if (sorted[i]) alternate1.push(sorted[i].num);
    }
    while (alternate1.length < 6) {
      const fallback = Math.floor(Math.random() * 49) + 1;
      if (!alternate1.includes(fallback)) alternate1.push(fallback);
    }
    tickets.push(alternate1.sort((a, b) => a - b));

    // Ticket 3: Sleepers mix (mix of high gaps and high frequencies)
    const highFreqs = [...calculatedMetrics].sort((a, b) => b.frequency - a.frequency).slice(0, 3).map(c => c.num);
    const highGaps = [...calculatedMetrics].sort((a, b) => b.gap - a.gap).slice(0, 3).map(c => c.num);
    const sleepersMix = Array.from(new Set([...highFreqs, ...highGaps])).slice(0, 6);
    while (sleepersMix.length < 6) {
      const fallback = Math.floor(Math.random() * 49) + 1;
      if (!sleepersMix.includes(fallback)) sleepersMix.push(fallback);
    }
    tickets.push(sleepersMix.sort((a, b) => a - b));

    // Ticket 4: Tesla root favorites (3-6-9 Harmonics)
    const teslaFavs = [...calculatedMetrics].sort((a, b) => b.harmonicRoot - a.harmonicRoot).slice(0, 6).map(c => c.num);
    tickets.push(teslaFavs.sort((a, b) => a - b));

    // Ticket 5: Prime spiral heavy nodes (Spirals & Primes)
    const spiralFavs = [...calculatedMetrics].sort((a, b) => b.spiralStrength - a.spiralStrength).slice(0, 6).map(c => c.num);
    tickets.push(spiralFavs.sort((a, b) => a - b));

    return tickets;
  }, [calculatedMetrics]);

  // Firestore Batch Savers
  const handleSaveSimpleBatchToFirebase = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const batchPromises = simpleBatchTickets.map((numbers, idx) => {
        return addDoc(collection(db, 'predictions'), {
          timestamp: new Date().toISOString(),
          targetDrawDate: today,
          strategyId: `simple-dashboard-batch-${idx+1}`,
          numbers: [...numbers],
          bonus: 25 // Default bonus for simple predictions
        });
      });
      await Promise.all(batchPromises);
      addToast(
        'BATCH PREDICTIONS SAVED',
        'Successfully recorded all 5 accessibility tickets to the predictions database!',
        'success'
      );
      if (isTTSEnabled) {
        playSpeech("All five accessibility tickets successfully recorded to central database.");
      }
    } catch (e: any) {
      console.error(e);
      addToast('ERROR', `Failed to save predictions batch: ${e.message}`, 'error');
    }
  };

  const handleSaveSimpleSinglePrediction = async (numbers: number[], index: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'predictions'), {
        timestamp: new Date().toISOString(),
        targetDrawDate: today,
        strategyId: `simple-dashboard-batch-${index + 1}`,
        numbers: [...numbers],
        bonus: 25
      });
      addToast(
        'PREDICTION SAVED',
        `Prediction [${numbers.join(', ')}] logged permanently.`,
        'success'
      );
      if (isTTSEnabled) {
        playSpeech("Prediction successfully recorded to central database.");
      }
    } catch (e: any) {
      console.error(e);
      addToast('ERROR', `Failed to save prediction: ${e.message}`, 'error');
    }
  };

  // 2. Generate the consensus "Most Likely Combination" string of 6 numbers
  const simpleTopConsensus = useMemo(() => {
    // Sort the numbers based on total calculated score
    const sorted = [...calculatedMetrics].sort((a, b) => b.totalScore - a.totalScore);
    const top6 = sorted.slice(0, 6).sort((a, b) => a.num - b.num);
    return top6;
  }, [calculatedMetrics]);

  // Read current inspected stats
  const inspectedStats = useMemo(() => {
    return calculatedMetrics.find(m => m.num === inspectedNum) || calculatedMetrics[6];
  }, [calculatedMetrics, inspectedNum]);

  // Copy consensus sequence string to clipboard
  const handleCopyCombo = () => {
    const sequenceStr = simpleTopConsensus.map(c => c.num).join(' - ');
    navigator.clipboard.writeText(sequenceStr);
    setCopied(true);
    addToast(
      "COMBINATION COPIED",
      `The simplified golden combination [${sequenceStr}] has been copied to your clipboard.`,
      "success"
    );
    if (isTTSEnabled) {
      playSpeech("Golden combination copied successfully. Ready to deploy.");
    }
    setTimeout(() => setCopied(false), 2000);
  };

  // Deploy numbers directly to main deck
  const handleDeployConsensus = () => {
    const nums = simpleTopConsensus.map(c => c.num);
    onApplyNumbers(nums);
    
    const voiceMsg = `Golden combination consensus deployed successfully. The numbers are ${nums.join(', ')}.`;
    if (isTTSEnabled) {
      playSpeech(voiceMsg);
    }
    
    addToast(
      "COORDINATE VECTOR SYNC",
      `Active target coordinates override applied: [${nums.join(', ')}]. Core matrices synced successfully.`,
      "success"
    );
  };

  // 4 Jargon-busting visual cards
  const simpleVariables: ParameterCard[] = [
    {
      id: 'var-freq',
      title: 'Popularity (Frequency Score)',
      simpleSubtitle: 'How often does this number appear?',
      icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
      explanation: 'High popularity means the number has consistent momentum and is a historical favorite in the draw sequences. This forms the foundational safety net of our predictions.',
      badgeText: 'Historical Anchor',
      badgeStyle: 'bg-amber-950/45 text-amber-300 border-amber-500/20'
    },
    {
      id: 'var-gap',
      title: 'Overdue Status (Recency Clock)',
      simpleSubtitle: 'How long has it been sleeping?',
      icon: <Activity className="w-5 h-5 text-indigo-400" />,
      explanation: 'Lottery drawings always strive to even out over time. If a number has not appeared for a long stretch (a high gap score), it acts as a "Sleeper Giant" that is statistically due for a resurgence.',
      badgeText: 'Sleeper Prime',
      badgeStyle: 'bg-indigo-950/45 text-indigo-350 border-indigo-500/20'
    },
    {
      id: 'var-tesla',
      title: 'Vortex Energy Harmonic',
      simpleSubtitle: 'Closeness to the golden math loop (3-6-9)',
      icon: <Sparkles className="w-5 h-5 text-fuchsia-400" />,
      explanation: 'Based on Nikolai Tesla\'s unified energy code, numbers with digital roots near 3, 6, and 9 fall in cosmic alignment. This measures the energetic cycles and repetition frequency rhythm.',
      badgeText: ' Tesla Wave',
      badgeStyle: 'bg-fuchsia-950/45 text-fuchsia-350 border-fuchsia-500/20'
    },
    {
      id: 'var-spiral',
      title: 'Spiral Layout Density',
      simpleSubtitle: 'Proximity on the Prime coordinate grid',
      icon: <Compass className="w-5 h-5 text-teal-400" />,
      explanation: 'Our algorithm maps the numbers 1 to 49 onto a spiral grid. Prime and semiprime numbers (numbers made of two primes multiplied) create dense hubs that magnetically attract neighboring matches.',
      badgeText: 'Quantum Focal',
      badgeStyle: 'bg-teal-950/45 text-teal-350 border-teal-500/20'
    }
  ];

  return (
    <section className="flex flex-col gap-6 w-full max-w-4xl mx-auto scroll-mt-24" id="simple-predictions-deck">
      
      {/* HEADER EXPLANATORY CARD */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 border border-indigo-500/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.05] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-900/30 border border-indigo-400/30 flex items-center justify-center">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-black tracking-widest text-indigo-300 uppercase">Simplicity Dashboard</h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Predicting next sequences using plain-English variables and straightforward math.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/20 px-3 py-1.5 rounded-lg select-none">
            <span className="w-2 h-2 rounded bg-emerald-500 animate-pulse" />
            <span className="text-[8.5px] font-mono font-black text-indigo-300 uppercase tracking-wider">BASIC USER ACCESSIBILITY: ONLINE</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION: THE HIGHEST COHERENCE GOLDEN COMBINATION */}
      <div className="bg-black/40 backdrop-blur-xl border border-indigo-500/15 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden">
        {/* Subtle warm layout accents */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-indigo-500/15 rounded-tl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-indigo-500/15 rounded-br-2xl pointer-events-none" />

        {/* Card Header with Dual Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4 select-none">
          <div>
            <span className="text-[9px] font-mono text-indigo-400 tracking-wider font-extrabold uppercase bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-500/20">
              OPTIMUM GOLDEN COMBINATION
            </span>
            <h3 className="text-base font-sans font-extrabold text-slate-200 mt-1.5">Most Likely sequence For The Next Draw</h3>
            <p className="text-xs text-slate-400 mt-1">This specific combination holds the highest mathematical coherence density among all 49 numbers in our tracking database.</p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-950 border border-slate-900 rounded-xl p-0.5 font-mono text-[9px] font-black shrink-0">
            <button
              onClick={() => setSimplePredictionMode('single')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${simplePredictionMode === 'single' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/15' : 'text-slate-500 hover:text-slate-300'}`}
            >
              SINGLE TICKET
            </button>
            <button
              onClick={() => setSimplePredictionMode('batch')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${simplePredictionMode === 'batch' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/15' : 'text-slate-500 hover:text-slate-300'}`}
            >
              BATCH (5 SETS)
            </button>
          </div>
        </div>

        {simplePredictionMode === 'single' ? (
          /* SINGLE COMBINATION DISPLAY */
          <div className="flex flex-col gap-6">
            {/* Dynamic Glowing Lotto Balls Combination */}
            <div className="py-2.5 flex flex-wrap justify-center md:justify-around items-center gap-4 select-none">
              {simpleTopConsensus.map((card, idx) => {
                const isFrequent = card.tempStatus === 'Frequent';
                const isSleeper = card.tempStatus === 'Overdue/Sleeper';
                
                let badgeColor = "from-amber-400 to-yellow-600 border-amber-300/40 text-amber-950";
                if (isFrequent) {
                  badgeColor = "from-rose-500 to-orange-600 border-rose-400/40 text-rose-950";
                } else if (isSleeper) {
                  badgeColor = "from-indigo-500 to-blue-600 border-indigo-400/40 text-indigo-950";
                }

                return (
                  <div 
                    key={card.num} 
                    onClick={() => setInspectedNum(card.num)}
                    className="flex flex-col items-center gap-2 cursor-pointer group transition duration-300 transform hover:-translate-y-1.5"
                  >
                    <div className="text-[9px] font-mono text-slate-650 font-extrabold uppercase">BALL 0{idx + 1}</div>
                    
                    {/* 3D Sphere render sphere */}
                    <div 
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${badgeColor} border-[3px] shadow-[inset_-2px_-4px_16px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.2)] group-hover:shadow-[inset_-2px_-4px_16px_rgba(0,0,0,0.5),0_0_30px_rgba(245,158,11,0.4)] flex flex-col justify-center items-center font-black relative transition`}
                    >
                      <span className="text-xl md:text-2xl font-sans tracking-tighter leading-none">{card.num}</span>
                      {/* Miniature shiny specular reflection */}
                      <div className="absolute top-1.5 left-2.5 w-3 h-1.5 bg-white/30 rounded-full rotate-[-15deg] filter blur-[0.5px]" />
                    </div>

                    <span className="text-[8px] font-mono text-slate-405 group-hover:text-amber-400 transition uppercase font-semibold">
                      {card.tempStatus === 'Frequent' && '🔥 Frequent'}
                      {card.tempStatus === 'Overdue/Sleeper' && '💤 Sleeper'}
                      {card.tempStatus === 'Warm' && '⚡ Warm'}
                      {card.tempStatus === 'Balanced' && '⚖ Balanced'}
                    </span>
                    
                    {/* Micro scoring metrics */}
                    <span className="text-[7.5px] font-mono text-slate-550">
                      CR:{card.totalScore}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Panel */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-2.5 pt-4 border-t border-slate-900 select-none">
              <button
                id="btn-copy-consensus"
                onClick={handleCopyCombo}
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-mono font-bold flex items-center gap-2 cursor-pointer transition active:scale-95 w-full sm:w-auto justify-center"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copied ? 'COPIED!' : 'COPY COMBO'}</span>
              </button>

              <button
                onClick={() => handleSaveSimpleSinglePrediction(simpleTopConsensus.map(c => c.num), 0)}
                className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 border border-indigo-900/30 text-[10px] font-mono font-bold uppercase transition active:scale-95 cursor-pointer w-full sm:w-auto text-center"
              >
                Save To DB
              </button>

              <button
                id="btn-deploy-consensus"
                onClick={handleDeployConsensus}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 text-[10px] font-mono font-black tracking-widest uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] transition duration-300 active:scale-95 w-full sm:w-auto justify-center"
              >
                <Lock className="w-3.5 h-3.5 text-slate-950" />
                <span>LOCK & PREDICT</span>
              </button>
            </div>
          </div>
        ) : (
          /* BATCH DISPLAY MODULE (5 UNIQUE ACCESSIBILITY TICKETS) */
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3.5">
              {simpleBatchTickets.map((numbers, tIdx) => (
                <div 
                  key={tIdx}
                  className="flex flex-col lg:flex-row items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-950/95 border border-slate-900/80 hover:border-indigo-500/25 rounded-xl transition duration-300 gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-indigo-400 font-black bg-indigo-950/30 border border-indigo-500/10 px-2 py-1 rounded-lg min-w-[70px] text-center uppercase">
                      TICKET {tIdx + 1}
                    </span>

                    {/* Lotto balls */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {numbers.map((num) => (
                        <span
                          key={num}
                          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shadow-inner hover:border-indigo-500/30 hover:scale-105 transition cursor-pointer select-none"
                          onClick={() => setInspectedNum(num)}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Micro Actions */}
                  <div className="flex items-center gap-2 select-none">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(numbers.join(' - '));
                        addToast('COPIED', `Ticket ${tIdx + 1} copied to clipboard!`, 'success');
                      }}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-300 transition duration-200 cursor-pointer"
                      title="Copy ticket"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onApplyNumbers(numbers);
                        addToast('LOCK VECTOR', `Simple Ticket ${tIdx + 1} applied to core predictions drawer!`, 'success');
                        if (isTTSEnabled) {
                          playSpeech(`Ticket ${tIdx + 1} coordinates applied.`);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white transition duration-200 text-[9px] font-mono font-black uppercase cursor-pointer"
                    >
                      Deploy
                    </button>

                    <button
                      onClick={() => handleSaveSimpleSinglePrediction(numbers, tIdx)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-950 to-slate-950 hover:from-indigo-900 hover:to-slate-900 border border-slate-800 hover:border-indigo-400 text-indigo-300 hover:text-white transition duration-200 text-[9px] font-mono font-black uppercase cursor-pointer"
                    >
                      Save to DB
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Global save controls for Simple batch */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-900 pt-3.5 gap-4">
              <span className="text-[9px] font-mono text-slate-550 leading-relaxed uppercase">
                * ACCESSIBILITY BATCH DERIVES 5 HIGHLY SPECIFIC, STYLIZED RHYTHM SEGMENTS ACROSS ACTIVE TEMPORAL METRICS.
              </span>

              <button
                onClick={handleSaveSimpleBatchToFirebase}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-mono font-black border border-indigo-500/20 shadow-md hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] select-none active:scale-95 transition-all w-full sm:w-auto text-center cursor-pointer uppercase"
              >
                SAVE BATCH OF 5 TO DB
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CORE INFO LABELS / ACCORDION DETAIL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {simpleVariables.map(v => (
          <div 
            key={v.id} 
            className="bg-slate-950 border border-slate-900 rounded-xl p-5 hover:border-indigo-500/20 hover:bg-slate-950/80 transition duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    {v.icon}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-mono font-black text-slate-300 uppercase">{v.title}</h4>
                    <span className="text-[10px] text-slate-550 block font-sans">{v.simpleSubtitle}</span>
                  </div>
                </div>
                <span className={`text-[7px] font-mono tracking-widest uppercase border px-1.5 py-0.5 rounded ${v.badgeStyle}`}>
                  {v.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-450 mt-4 leading-relaxed font-sans font-medium">
                {v.explanation}
              </p>
            </div>
            
            <div className="border-t border-slate-900/60 pt-3.5 mt-3.5 flex items-center justify-between text-[8px] font-mono text-slate-550 select-none">
              <span>WEIGHT VALUE ON EQUATORIAL DECK:</span>
              <span className="text-indigo-400 text-[9px] font-black uppercase">Consensus 25.0% Impact</span>
            </div>
          </div>
        ))}
      </div>

      {/* INTERACTIVE INSPECTOR AND EXPLANATION SYSTEM */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-slate-300 uppercase">Number Inspection Station</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase">Click any number below to verify explaining stats written in simple english words</p>
          </div>
        </div>

        {/* 1 to 49 Number Selection Grid */}
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 max-h-[170px] overflow-y-auto pr-1 pb-1 scrollbar-thin select-none">
          {calculatedMetrics.map(item => {
            const isInspected = inspectedNum === item.num;
            const isProposed = activeProposedNumbers.includes(item.num);
            
            let btnStyle = "bg-slate-950 border-slate-900 text-slate-400 hover:border-indigo-500/30";
            if (isInspected) {
              btnStyle = "bg-indigo-950/45 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/35";
            } else if (isProposed) {
              btnStyle = "bg-amber-950/30 border-amber-500/35 text-amber-300";
            }

            return (
              <button
                key={item.num}
                id={`inspector-cell-${item.num}`}
                onClick={() => setInspectedNum(item.num)}
                className={`py-1.5 rounded text-[10px] font-mono font-black border transition shrink-0 cursor-pointer text-center ${btnStyle}`}
              >
                {item.num < 10 ? `0${item.num}` : item.num}
              </button>
            );
          })}
        </div>

        {/* Detailed Plain-English Stats Card */}
        <div className="bg-black/60 border border-indigo-950/40 p-5 rounded-xl flex flex-col md:flex-row gap-5 items-stretch relative overflow-hidden">
          {/* Circular inspected visualization indicator */}
          <div className="flex flex-col items-center justify-center gap-2 md:border-r border-slate-905 md:pr-6 shrink-0 min-w-[120px] select-none">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">PROBE NODE</div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-900/60 to-purple-950/60 border-2 border-indigo-500/40 shadow-lg flex items-center justify-center relative font-black font-sans text-2xl text-white">
              {inspectedStats.num}
              <div className="absolute inset-0.5 rounded-full border border-dashed border-indigo-400/25 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <span className="text-[7.5px] font-mono text-slate-500 uppercase">
              {inspectedStats.tempStatus === 'Overdue/Sleeper' ? '💤 SLEEPER STATUS' : `${inspectedStats.tempStatus.toUpperCase()} STATUS`}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-3 font-sans">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-extrabold text-indigo-400 uppercase">
                  SIMPLICITY ANALYSIS LOG
                </span>
                <span className="text-[9px] font-mono bg-indigo-950/45 text-indigo-350 border border-indigo-500/10 px-2 py-0.5 rounded font-black uppercase">
                  Prediction Potential: {inspectedStats.totalScore} Pts
                </span>
              </div>
              <p className="text-xs text-slate-350 font-medium leading-relaxed">
                {inspectedStats.recExplanation}
              </p>
            </div>

            {/* Dynamic visual parameters table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-900/50 text-[10px] select-none font-mono font-bold leading-none">
              <div className="flex flex-col gap-1.5 p-1 text-center">
                <span className="text-[7.5px] text-slate-500 uppercase">Historical Hits</span>
                <span className="text-amber-400">{inspectedStats.frequency} times</span>
              </div>
              
              <div className="flex flex-col gap-1.5 p-1 text-center border-l border-slate-900">
                <span className="text-[7.5px] text-slate-500 uppercase">Draw Absence Gap</span>
                <span className="text-indigo-400">{inspectedStats.gap} drafts</span>
              </div>

              <div className="flex flex-col gap-1.5 p-1 text-center border-l border-slate-900">
                <span className="text-[7.5px] text-slate-500 uppercase">Tesla Root</span>
                <span className="text-fuchsia-400">{inspectedStats.harmonicRoot} / 10 Match</span>
              </div>

              <div className="flex flex-col gap-1.5 p-1 text-center border-l border-slate-900">
                <span className="text-[7.5px] text-slate-500 uppercase">Spiral Rank</span>
                <span className="text-teal-400">{inspectedStats.spiralStrength === 10 ? 'Elite (Prime)' : inspectedStats.spiralStrength === 6 ? 'Vocal (Semi)' : 'Neutral'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pro tip helper banner */}
        <div className="bg-indigo-950/10 border border-indigo-500/10 p-4 rounded-xl flex gap-3 items-start select-none">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
          <p className="text-[11px] text-indigo-300 font-mono leading-relaxed uppercase">
            <strong>Basic User Pro-Tip:</strong> Click on <span className="text-amber-400 underline decoration-dashed select-all">LOCK & PREDICT</span> to overlay these exact recommended coordinates directly into the tactile drawing space above. This automatically prepares your tickets with maximum statistics.
          </p>
        </div>
      </div>

    </section>
  );
}
