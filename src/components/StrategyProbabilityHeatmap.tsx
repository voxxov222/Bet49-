import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Award, Percent, Grid, Settings, 
  HelpCircle, RefreshCw, Zap, Layers, Compass, BarChart
} from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface StrategyProbabilityHeatmapProps {
  selectedStrategy: string;
  selectedStrategyName: string;
  draws: LottoDraw[];
  getProposedNumbersForStrategy: (stratId: string, currentDraws?: LottoDraw[]) => number[];
  getStrategyCategory: (stratId: string) => {
    name: string;
    color: string;
    textClass: string;
    borderClass: string;
    glowClass: string;
  };
  title?: string;
  subtitle?: string;
}

export default function StrategyProbabilityHeatmap({
  selectedStrategy,
  selectedStrategyName,
  draws,
  getProposedNumbersForStrategy,
  getStrategyCategory,
  title,
  subtitle
}: StrategyProbabilityHeatmapProps) {
  const [hoveredNum, setHoveredNum] = useState<number | null>(null);
  const [gridMode, setGridMode] = useState<'standard' | 'spiral'>('standard');
  const [resonateWaves, setResonateWaves] = useState<boolean>(true);

  const proposedNumbers = useMemo(() => {
    return getProposedNumbersForStrategy(selectedStrategy, draws) || [];
  }, [selectedStrategy, draws, getProposedNumbersForStrategy]);

  // Determine category style for the strategy
  const category = useMemo(() => {
    return getStrategyCategory(selectedStrategy);
  }, [selectedStrategy, getStrategyCategory]);

  // Calculate dynamic probability maps for each number (1 to 49) based on strategy character
  const probabilityData = useMemo(() => {
    if (!draws || draws.length === 0) return {};

    // Get total frequencies for historical normalization
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 49; i++) counts[i] = 0;
    draws.forEach(d => {
      d.numbers?.forEach(num => {
        if (num >= 1 && num <= 49) counts[num]++;
      });
    });

    const maxCount = Math.max(...Object.values(counts), 1);
    const lastDraw = [...draws].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const lastNumbers = lastDraw ? lastDraw.numbers : [];

    const scores: Record<number, {
      probability: number;
      frequency: number;
      heatLevel: 'critical' | 'high' | 'medium' | 'low';
      meta: string;
    }> = {};

    for (let num = 1; num <= 49; num++) {
      const isProposed = proposedNumbers.includes(num);
      const isLastDraw = lastNumbers.includes(num);
      const rawFreq = counts[num] || 0;
      const freqRatio = rawFreq / maxCount; // 0..1

      // 1. Initial base score from simple historical frequency
      let score = 25 + freqRatio * 35; // base 25, plus up to 35 from frequency

      // 2. Apply unique Strategy-Specific Modifier Algorithms to ensure organic signature paths
      switch (selectedStrategy) {
        case 'freq-10': {
          // Direct response to top frequency
          if (isProposed) score += 35;
          else score += (rawFreq / maxCount) * 20;
          break;
        }
        case 'avg-6': {
          // Centroid proximity
          const avgPositions = [8, 15, 23, 30, 37, 44];
          let minDistance = 49;
          avgPositions.forEach(p => {
            minDistance = Math.min(minDistance, Math.abs(num - p));
          });
          const proximityBonus = Math.max(0, (8 - minDistance) * 4.5);
          score += proximityBonus;
          if (isProposed) score += 20;
          break;
        }
        case '369-offset': {
          // Digital root 3, 6, 9 or direct offset
          const digitsSum = String(num).split('').reduce((acc, c) => acc + parseInt(c), 0);
          const digitalRoot = digitsSum % 9 || 9;
          if ([3, 6, 9].includes(digitalRoot)) score += 18;
          
          let nearLast = false;
          lastNumbers.forEach(ln => {
            if (Math.abs(num - ln) <= 3) nearLast = true;
          });
          if (nearLast) score += 12;
          if (isProposed) score += 20;
          break;
        }
        case 'tri-grid': {
          // Perfect squares or primes
          const perfectSquares = [1, 4, 9, 16, 25, 36, 49];
          const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
          if (perfectSquares.includes(num)) score += 16;
          if (primes.includes(num)) score += 10;
          if (isProposed) score += 22;
          break;
        }
        case 'secure-rand': {
          // Deterministic entropy simulation using string hash
          const seedStr = `${selectedStrategy}-${num}`;
          let hash = 0;
          for (let i = 0; i < seedStr.length; i++) {
            hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
          }
          const randNoise = (Math.abs(hash) % 100) / 100;
          score = 15 + randNoise * 75; // chaos distribution bounds
          break;
        }
        case 'cluster-agents': {
          // Multi-agent cluster density points
          const clusterCenters = [12, 22, 28, 35, 41];
          let closestDist = 49;
          clusterCenters.forEach(c => {
            closestDist = Math.min(closestDist, Math.abs(num - c));
          });
          if (closestDist === 0) score += 28;
          else if (closestDist === 1) score += 18;
          else if (closestDist === 2) score += 8;
          if (isProposed) score += 15;
          break;
        }
        case 'chain-3m': {
          // Sequence shift probabilities
          if (isLastDraw) score -= 15; // lower recursion rate
          let consecutiveScore = 0;
          lastNumbers.forEach(ln => {
            if (num === ln + 1 || num === ln - 1) consecutiveScore += 18;
          });
          score += consecutiveScore;
          if (isProposed) score += 20;
          break;
        }
        case 'swarm-5d': {
          // Multidimensional vector convergence
          const resonance = (num * 17) % 49;
          if (resonance < 10) score += 24;
          if (isProposed) score += 26;
          break;
        }
        case 'peptide-fold': {
          // Backpropagation helix structures
          const subgridCol = (num - 1) % 7;
          const subgridRow = Math.floor((num - 1) / 7);
          const foldEnergy = Math.sin(subgridRow) * Math.cos(subgridCol);
          score += (foldEnergy + 1) * 15;
          if (isProposed) score += 20;
          break;
        }
        case 'tesseract-4d': {
          // Rotating coordinate projections
          const radial = Math.pow((num - 25), 2);
          if (radial < 100) score += 20; // core concentration
          if (isProposed) score += 25;
          break;
        }
        case 'cyclic-primes': {
          const primesList = [7, 17, 19, 23, 29, 47];
          if (primesList.includes(num)) score += 30;
          if (num % 7 === 0) score += 12;
          if (isProposed) score += 18;
          break;
        }
        case 'e8-katha': {
          const kathaActive = [3, 9, 14, 21, 27, 33, 39, 45, 48];
          if (kathaActive.includes(num)) score += 28;
          if (isProposed) score += 22;
          break;
        }
        case 'neyen-seq': {
          // Vortex math residues: 1, 2, 4, 8, 7, 5
          const singleDigit = (num - 1) % 9 + 1;
          if ([1, 2, 4, 8, 7, 5].includes(singleDigit)) score += 15;
          if ([3, 6, 9].includes(singleDigit)) score += 20; // tesla nodes
          if (isProposed) score += 18;
          break;
        }
        case 'numeric-word-value': {
          const alphanumericSum = (num * 19) % 9 || 9;
          if ([1, 5, 9].includes(alphanumericSum)) score += 22;
          if (isProposed) score += 25;
          break;
        }
        case 'omni-quantum-nexus': {
          // Highly balanced superposed field
          const quantumState = Math.sin((num * Math.PI) / 13) * Math.cos((num * Math.PI) / 17);
          score += (quantumState + 1) * 20;
          if (isProposed) score += 24;
          break;
        }
        case 'lstm-ai-predict': {
          // RNN neural predictions
          const simulatedCellState = (num * 31) % 100;
          score += (simulatedCellState / 100) * 32;
          if (isProposed) score += 25;
          break;
        }
        case '649-processing': {
          // Group distribution
          if (num >= 10 && num <= 31) score += 20; // decile cluster bias
          if (isProposed) score += 22;
          break;
        }
        case 'neural-network': {
          // Cognitive synaptic triggers
          const activation = (1 / (1 + Math.exp(-((num - 25) / 10)))) * 30;
          score += activation;
          if (isProposed) score += 24;
          break;
        }
        case 'number-patterns': {
          // Arithmetic spacing
          if (num % 5 === 2) score += 18;
          if (num % 3 === 1) score += 10;
          if (isProposed) score += 20;
          break;
        }
        case 'linear-ml': {
          // Best fit slope mapping
          const slopeTrend = 10 + (num * 0.82);
          score += Math.min(30, slopeTrend);
          if (isProposed) score += 22;
          break;
        }
        case 'corvus-codex': {
          // Mainframe training bias
          if (num % 2 === 0) score += 12; // parity balance 
          if (num % 11 === 0) score += 15;
          if (isProposed) score += 26;
          break;
        }
        default: {
          if (isProposed) score += 30;
          break;
        }
      }

      // 3. Absolute bounds enforcement
      const finalVal = Math.min(99.6, Math.max(3.2, score));

      // Define heat bands
      let heatLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
      let meta = 'Secondary Field Resonator';
      
      if (isProposed) {
        heatLevel = 'critical';
        meta = 'Consensus Core Projection Node';
      } else if (finalVal >= 65) {
        heatLevel = 'high';
        meta = 'High-Probability Gravity Well';
      } else if (finalVal >= 40) {
        heatLevel = 'medium';
        meta = 'Standard Harmonic Resonance Grid';
      } else {
        heatLevel = 'low';
        meta = 'Quiescent Entropy Space';
      }

      scores[num] = {
        probability: finalVal,
        frequency: rawFreq,
        heatLevel,
        meta
      };
    }

    return scores;
  }, [selectedStrategy, draws, proposedNumbers]);

  // Order of numbers based on spiral mode vs standard
  const gridNumbers = useMemo(() => {
    if (gridMode === 'standard') {
      return Array.from({ length: 49 }, (_, i) => i + 1);
    } else {
      // Custom center-out spiral logic coordinates
      // Map spiral coordinate offsets or standard JARVIS alternate sequence
      // We'll map values by sorting by proximity to center (25) in spiral-form
      const mapped = Array.from({ length: 49 }, (_, i) => i + 1);
      // Let's sort by concentric rings for spiral display
      return mapped.sort((a, b) => {
        const ringA = Math.max(Math.abs(((a - 1) % 7) - 3), Math.abs(Math.floor((a - 1) / 7) - 3));
        const ringB = Math.max(Math.abs(((b - 1) % 7) - 3), Math.abs(Math.floor((b - 1) / 7) - 3));
        if (ringA !== ringB) return ringA - ringB;
        return a - b;
      });
    }
  }, [gridMode]);

  // Get color configuration based on current strategy category
  const activeColorTheme = useMemo(() => {
    switch (category.color) {
      case 'cyan':
        return {
          fill: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-medium',
          activeFill: 'bg-gradient-to-br from-cyan-400 to-sky-600 text-slate-950 border-cyan-300 font-bold shadow-[0_0_15px_rgba(34,211,238,0.6)]',
          highFill: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
          mediumFill: 'bg-slate-950/70 text-slate-400 border-slate-800',
          lowFill: 'bg-slate-950/30 text-slate-600 border-slate-900/40 opacity-45',
          glowText: 'text-cyan-400',
          solidColor: '#22d3ee'
        };
      case 'purple':
        return {
          fill: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30 font-medium',
          activeFill: 'bg-gradient-to-br from-purple-400 to-violet-600 text-slate-950 border-purple-300 font-bold shadow-[0_0_15px_rgba(168,85,247,0.6)]',
          highFill: 'bg-purple-950/40 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.15)]',
          mediumFill: 'bg-slate-950/70 text-slate-400 border-slate-800',
          lowFill: 'bg-slate-950/30 text-slate-600 border-slate-900/40 opacity-45',
          glowText: 'text-purple-400',
          solidColor: '#a855f7'
        };
      case 'magenta':
        return {
          fill: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/30 font-medium',
          activeFill: 'bg-gradient-to-br from-pink-400 to-rose-600 text-slate-950 border-pink-300 font-bold shadow-[0_0_15px_rgba(244,63,94,0.6)]',
          highFill: 'bg-pink-950/40 text-pink-300 border-pink-500/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]',
          mediumFill: 'bg-slate-950/70 text-slate-400 border-slate-800',
          lowFill: 'bg-slate-950/30 text-slate-600 border-slate-900/40 opacity-45',
          glowText: 'text-pink-400',
          solidColor: '#f43f5e'
        };
      case 'gold':
      default:
        return {
          fill: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 font-medium',
          activeFill: 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 border-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)]',
          highFill: 'bg-amber-950/40 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
          mediumFill: 'bg-slate-950/70 text-slate-400 border-slate-800',
          lowFill: 'bg-slate-950/30 text-slate-600 border-slate-900/40 opacity-45',
          glowText: 'text-amber-400',
          solidColor: '#f59e0b'
        };
    }
  }, [category.color]);

  return (
    <div className="w-full flex flex-col bg-slate-950/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden mt-6">
      {/* JARVIS HUD Accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-${category.color}-500/50 to-transparent`} />
      
      {/* Background radar waves mapping the grid, animated */}
      {resonateWaves && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-cyan-400 rounded-full animate-ping" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-400 rounded-full animate-ping" style={{ animationDuration: '12s' }} />
        </div>
      )}

      {/* Title block with advanced stats indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-5 z-10 relative">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg bg-slate-900 border border-${category.color}-500/30`}>
            {gridMode === 'standard' ? (
              <Grid className={`w-5 h-5 text-${category.color}-400`} />
            ) : (
              <Compass className={`w-5 h-5 text-${category.color}-400 animate-spin`} style={{ animationDuration: '20s' }} />
            )}
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
              {title || "Grid Superposition Heatmap"}
              <span className={`text-[8px] tracking-normal font-medium px-2 py-0.5 rounded-full bg-${category.color}-500/10 border border-${category.color}-500/20 text-${category.color}-400 capitalize`}>
                {category.name}
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">
              {subtitle || "TOPOLOGICAL PROBABILITY SCORE DENSITY MATRIX OVER 49 NODES"}
            </p>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono">
          <button 
            id="heatmap_mode_standard"
            onClick={() => setGridMode('standard')}
            className={`px-3 py-1.5 rounded-md border transition-all ${
              gridMode === 'standard'
                ? `border-${category.color}-500/30 bg-${category.color}-500/10 text-${category.color}-400 font-bold`
                : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:text-slate-300'
            }`}
          >
            STANDARD GRID
          </button>
          
          <button 
            id="heatmap_mode_spiral"
            onClick={() => setGridMode('spiral')}
            className={`px-3 py-1.5 rounded-md border transition-all ${
              gridMode === 'spiral'
                ? `border-${category.color}-500/30 bg-${category.color}-500/10 text-${category.color}-400 font-bold`
                : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:text-slate-300'
            }`}
          >
            SPIRAL VECTOR
          </button>

          <button 
            id="heatmap_toggle_resonate"
            onClick={() => setResonateWaves(prev => !prev)}
            className={`px-3 py-1.5 rounded-md border transition-all flex items-center gap-1 ${
              resonateWaves 
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold'
                : 'border-slate-850 text-slate-500'
            }`}
          >
            <RefreshCw className={`w-2.5 h-2.5 ${resonateWaves ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            {resonateWaves ? 'RESONANCE: ENGAGED' : 'RESONANCE: OFFLINE'}
          </button>
        </div>
      </div>

      {/* Main Grid + Details Split Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10 relative">
        
        {/* Heatmap Grid Cell */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          <div className="grid grid-cols-7 gap-1.5 p-3.5 bg-slate-950/50 rounded-xl border border-slate-900 max-w-full w-[380px] h-[350px] relative">
            
            {gridNumbers.map((num) => {
              const node = probabilityData[num] || { probability: 10, heatLevel: 'low', frequency: 0 };
              const isProposed = proposedNumbers.includes(num);
              
              // Resolve fill classes
              let displayClass = activeColorTheme.lowFill;
              if (isProposed) {
                displayClass = activeColorTheme.activeFill;
              } else if (node.heatLevel === 'high') {
                displayClass = activeColorTheme.highFill;
              } else if (node.heatLevel === 'medium') {
                displayClass = activeColorTheme.mediumFill;
              }

              return (
                <motion.div
                  id={`heatmap_node_${num}`}
                  key={`heat-node-${num}`}
                  onMouseEnter={() => setHoveredNum(num)}
                  onMouseLeave={() => setHoveredNum(null)}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                  className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center border cursor-pointer transition-all duration-150 relative select-none ${displayClass}`}
                >
                  <span className="text-xs font-bold leading-none">{num}</span>
                  <span className="text-[7px] opacity-70 font-mono tracking-tighter mt-0.5">
                    {Math.round(node.probability)}%
                  </span>
                  
                  {/* Miniature dot indicator for top probability draws */}
                  {isProposed && (
                    <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-slate-950 animate-ping" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] font-mono text-slate-500 mt-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded border ${activeColorTheme.activeFill}`} />
              <span>Core Proposal (85-99%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded border ${activeColorTheme.highFill}`} />
              <span>High Probability (&ge;65%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded border ${activeColorTheme.mediumFill}`} />
              <span>Standard (40-64%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded border ${activeColorTheme.lowFill}`} />
              <span>Quiescent (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* Strategy Context & Live HUD Detail Readout Frame */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-950/40 p-4 border border-slate-900 rounded-xl h-full flex-grow">
          <div>
            <span className={`text-[8px] font-mono font-bold tracking-widest text-${category.color}-400 bg-${category.color}-500/10 px-2 py-0.5 rounded border border-${category.color}-500/20 uppercase`}>
              ACTIVE EMULATED CONTEXT
            </span>
            <h4 className="text-sm font-sans font-bold text-slate-100 mt-2">
              {selectedStrategyName}
            </h4>
            <p className="text-[10px] text-slate-400 font-mono mt-1 leading-relaxed">
              Weighing the structural probability of standard nodes using {selectedStrategyName.replace(/^[0-9.]+\s*/, '')} algorithms. The active engine adjusts coefficients in real-time.
            </p>
          </div>

          {/* Analytical Breakdown with hovered node statistics */}
          <div className="border-t border-slate-900 pt-3 flex-grow flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {hoveredNum !== null ? (
                <motion.div
                  key="hovered-details"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[11px] font-mono text-slate-400">NODE INDEX:</span>
                    <span className={`text-xl font-bold font-sans text-white border border-${category.color}-500/20 px-3 py-0.5 bg-slate-900 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                      Ball #{hoveredNum}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                    <div className="bg-slate-950/80 border border-slate-900/60 rounded p-2">
                      <span className="text-slate-500 block">PROBABILITY INDEX:</span>
                      <strong className={`text-sm font-bold ${activeColorTheme.glowText}`}>
                        {(probabilityData[hoveredNum]?.probability || 0).toFixed(1)}%
                      </strong>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-900/60 rounded p-2">
                      <span className="text-slate-500 block">HISTORIC DRAWS:</span>
                      <strong className="text-sm font-bold text-slate-200">
                        {probabilityData[hoveredNum]?.frequency || 0} hits
                      </strong>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-900/40 rounded p-2 text-[9.5px] font-mono text-slate-400">
                    <span className="text-slate-500 block uppercase font-bold text-[8px] mb-1">COGNITIVE CLASSIFICATION:</span>
                    {probabilityData[hoveredNum]?.meta}
                  </div>

                  <div className="text-[9px] text-slate-500 font-mono italic">
                    * Hover other nodes in the probability canvas to capture targeted telemetry vector readings.
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle-details"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 py-2 text-center flex flex-col justify-center items-center h-full min-h-[160px]"
                >
                  <div className={`p-3 rounded-full bg-slate-950 border border-${category.color}-500/10 mb-1 animate-pulse`}>
                    <Flame className={`w-6 h-6 text-${category.color}-400`} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-slate-300 uppercase">Interactive Node Telemetry</h5>
                    <p className="text-[9px] text-slate-500 font-mono max-w-[200px] mt-1 uppercase leading-normal">
                      Hover any ball in the 49-node coordinate landscape to stream live probability values and hit distributions.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
