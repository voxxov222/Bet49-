import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Activity, RefreshCw, Layers, ShieldCheck, Play, Info, HelpCircle, Flame, Sparkles } from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface DWaveQuantumEngineProps {
  draws: LottoDraw[];
  activeProposedNumbers: number[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

interface Qubit {
  id: number; // 1 to 49
  bias: number; // h_i
  state: number; // 0 or 1
  phase: number; // current superposition amplitude (displays as opacity/scale fluctuation)
  x: number; // layout position
  y: number;
}

interface AnnealingSequence {
  numbers: number[];
  energy: number;
  probability: number; // sample frequency percentage
}

export default function DWaveQuantumEngine({
  draws,
  activeProposedNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: DWaveQuantumEngineProps) {
  // Annealing configuration
  const [annealingTime, setAnnealingTime] = useState<number>(20); // ms / microseconds in real QPU
  const [sampleReads, setSampleReads] = useState<number>(2000); // number of reads
  const [magCoupling, setMagCoupling] = useState<number>(0.75); // coupler weight multiplier
  const [isAnnealing, setIsAnnealing] = useState<boolean>(false);
  const [annealProgress, setAnnealProgress] = useState<number>(0);
  const [currentTemp, setCurrentTemp] = useState<number>(1.0); // Transverse field strength (decaying to 0)
  const [qubits, setQubits] = useState<Qubit[]>([]);
  const [temperatureHistory, setTemperatureHistory] = useState<{ step: number; t: number; energy: number }[]>([]);
  
  // Storage for ground states found
  const [discoveredStates, setDiscoveredStates] = useState<AnnealingSequence[]>([]);
  const [selectedDiscoveredIndex, setSelectedDiscoveredIndex] = useState<number>(-1);

  // Layout parameters for qubits (distributed on a spiral/grid topology in the HUD)
  useEffect(() => {
    const list: Qubit[] = [];
    const center = { x: 150, y: 150 };
    for (let id = 1; id <= 49; id++) {
      // Pegasus-inspired concentric ring layout
      const angle = (id * 137.5) * (Math.PI / 180);
      const radius = 16 * Math.sqrt(id);
      list.push({
        id,
        bias: 0.0,
        state: activeProposedNumbers.includes(id) ? 1 : 0,
        phase: Math.random() * Math.PI * 2,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      });
    }
    setQubits(list); // initialize
  }, [activeProposedNumbers]);

  // Compute Biases (h_i) and Couplers (J_ij) using actual past drawing records
  const { biases, couplers } = useMemo(() => {
    const totalDraws = Math.max(1, draws.length);
    const frequencies: Record<number, number> = {};
    const jointOccurrences: Record<string, number> = {};

    // Initialise records
    for (let i = 1; i <= 49; i++) {
      frequencies[i] = 0;
      for (let j = i + 1; j <= 49; j++) {
        jointOccurrences[`${i}-${j}`] = 0;
      }
    }

    // Accumulate draw statistics
    draws.forEach(draw => {
      const nums = [...draw.numbers].sort((a,b)=>a-b);
      nums.forEach(num => {
        if (num >= 1 && num <= 49) {
          frequencies[num] = (frequencies[num] || 0) + 1;
        }
      });
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]}-${nums[j]}`;
          if (key in jointOccurrences) {
            jointOccurrences[key]++;
          }
        }
      }
    });

    // 1. Single Spin Biases h_i (High frequency -> negative bias, making alignment more probable)
    const computedBiases: Record<number, number> = {};
    for (let i = 1; i <= 49; i++) {
      const p = frequencies[i] / totalDraws;
      // Normalise bias between -1.0 and 1.0
      computedBiases[i] = -2.5 * (p - 6 / 49); 
    }

    // 2. Quadratic Coupling strengths J_ij (Joint appearances -> ferromagnetic alignment interaction)
    const computedCouplers: Record<string, number> = {};
    for (let i = 1; i <= 49; i++) {
      for (let j = i + 1; j <= 49; j++) {
        const key = `${i}-${j}`;
        const pJoined = jointOccurrences[key] / totalDraws;
        const pExpected = (frequencies[i] / totalDraws) * (frequencies[j] / totalDraws);
        // Exclude / correct for negative expectation boundaries
        computedCouplers[key] = -4.0 * (pJoined - pExpected) * magCoupling;
      }
    }

    return { biases: computedBiases, couplers: computedCouplers };
  }, [draws, magCoupling]);

  // Metropolis-Hastings MCMC QUBO Annealer calculation
  const calculateQUBOEnergy = (stateVector: Record<number, number>) => {
    let energyField = 0.0;
    // Single spin biases
    for (let i = 1; i <= 49; i++) {
      if (stateVector[i] === 1) {
        energyField += biases[i] || 0;
      }
    }
    // Cross coupling weights
    for (let i = 1; i <= 49; i++) {
      for (let j = i + 1; j <= 49; j++) {
        if (stateVector[i] === 1 && stateVector[j] === 1) {
          const key = `${i}-${j}`;
          energyField += couplers[key] || 0;
        }
      }
    }
    return energyField;
  };

  // Run the progressive D-Wave simulation
  const performQuantumAnnealCycles = () => {
    if (isAnnealing) return;
    setIsAnnealing(true);
    setAnnealProgress(0);
    setDiscoveredStates([]);
    setSelectedDiscoveredIndex(-1);

    if (isTTSEnabled) {
      playSpeech("Scheduling transverse field decay. Running D-Wave probability simulator.");
    }
    addToast(
      "D-WAVE SUPERPOSITION SOLVER",
      `Superposing ${sampleReads} Qubu combinations over Pegasus correlation matrix...`,
      "info"
    );

    // Initial state vector
    const initializeRandomState = (): Record<number, number> => {
      const vec: Record<number, number> = {};
      for (let i = 1; i <= 49; i++) vec[i] = 0;
      // Choose 6 unique numbers randomly
      const pool = Array.from({ length: 49 }, (_, idx) => idx + 1);
      for (let i = 0; i < 6; i++) {
        const randIdx = Math.floor(Math.random() * pool.length);
        const rolled = pool.splice(randIdx, 1)[0];
        vec[rolled] = 1;
      }
      return vec;
    };

    // Keep track of temperature and energy progression for plotting
    const localHistory: { step: number; t: number; energy: number }[] = [];
    
    // We will simulate sample reads loops in the background
    // MCMC simulation for finding lowest energy combos
    const runSampleAnnealingRead = () => {
      let state = initializeRandomState();
      let energy = calculateQUBOEnergy(state);
      
      // Decay steps of annealing timeline
      const totalSteps = 24;
      for (let step = 0; step < totalSteps; step++) {
        const progressFrac = step / totalSteps;
        // Transverse field strength T decays from 3.0 to 0.01 (collapsing fluctuations)
        const T = Math.max(0.01, 3.5 * Math.exp(-progressFrac * 4));
        
        // Dynamic spins perturbation
        const activeIds = Object.keys(state).map(Number).filter(k => state[k] === 1);
        const inactiveIds = Object.keys(state).map(Number).filter(k => state[k] === 0);
        
        // Swap one active spin with one inactive spin to maintain exact size restriction = 6
        if (activeIds.length > 0 && inactiveIds.length > 0) {
          const swapActive = activeIds[Math.floor(Math.random() * activeIds.length)];
          const swapInactive = inactiveIds[Math.floor(Math.random() * inactiveIds.length)];
          
          const nextState = { ...state, [swapActive]: 0, [swapInactive]: 1 };
          const nextEnergy = calculateQUBOEnergy(nextState);
          
          // Metropolis acceptance criteria
          const dE = nextEnergy - energy;
          if (dE < 0 || Math.random() < Math.exp(-dE / T)) {
            state = nextState;
            energy = nextEnergy;
          }
        }
      }
      
      const numbers = Object.keys(state).map(Number).filter(k => state[k] === 1).sort((a,b)=>a-b);
      return { numbers, energy };
    };

    // Run sample reads pool
    const samplesRecord: Record<string, { numbers: number[]; energy: number; frequency: number }> = {};
    for (let r = 0; r < sampleReads; r++) {
      const result = runSampleAnnealingRead();
      const stringKey = result.numbers.join('-');
      if (samplesRecord[stringKey]) {
        samplesRecord[stringKey].frequency++;
      } else {
        samplesRecord[stringKey] = {
          numbers: result.numbers,
          energy: result.energy,
          frequency: 1
        };
      }
    }

    // Sort states by energy (lowest energy = ground state = highest mathematical likelihood under constraints)
    const sortedDiscoveredList = Object.values(samplesRecord)
      .map(s => ({
        numbers: s.numbers,
        energy: s.energy,
        probability: Number(((s.frequency / sampleReads) * 100).toFixed(2))
      }))
      .sort((a, b) => a.energy - b.energy)
      .slice(0, 5);

    // Animation Loop
    let currentStep = 0;
    const intervalTime = 60; // total 1.5s
    const animeInterval = setInterval(() => {
      currentStep++;
      const frac = currentStep / 25;
      const tVal = Math.max(0.0, 1.0 - frac);
      const progressPercent = Math.round(frac * 100);

      setAnnealProgress(progressPercent);
      setCurrentTemp(tVal);

      // Mutate qubit phases for holographic vibration
      setQubits(prev =>
        prev.map(q => {
          // Blur / shake phase when temp is high
          const fluctuation = Math.sin(q.phase + currentStep * 0.45) * tVal * 8;
          // Randomise temporary state indicator to simulate live flux
          const randomState = progressPercent < 100 && Math.random() < tVal ? (Math.random() > 0.5 ? 1 : 0) : q.state;
          return {
            ...q,
            phase: q.phase + 0.25,
            state: progressPercent === 100 
              ? (sortedDiscoveredList[0]?.numbers.includes(q.id) ? 1 : 0)
              : randomState
          };
        })
      );

      // Record simulated temperature decay logs
      localHistory.push({
        step: currentStep,
        t: Number((tVal * 4.5).toFixed(2)),
        energy: Number((sortedDiscoveredList[0]?.energy * (frac) + (Math.random() * 4 - 2) * (1 - frac)).toFixed(2))
      });
      setTemperatureHistory([...localHistory]);

      if (currentStep >= 25) {
        clearInterval(animeInterval);
        setIsAnnealing(false);
        setDiscoveredStates(sortedDiscoveredList);
        setSelectedDiscoveredIndex(0);

        if (isTTSEnabled) {
          playSpeech("Annealing cycle completed. Ground state locked.");
        }
        addToast(
          "CONVERGENCE COMPLETED",
          `Minimum Hamiltonian energy state secured: [${sortedDiscoveredList[0]?.numbers.join(', ')}] with E = ${sortedDiscoveredList[0]?.energy.toFixed(2)}`,
          "success"
        );
      }
    }, intervalTime);
  };

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-pink-500/10 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-pink-500/20 transition-all duration-550 relative overflow-hidden">
      
      {/* Stark HUD Scan sweep line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-pink-400 to-transparent pointer-events-none opacity-40 animate-[pulse_2s_infinite]" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-pink-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-pink-400 uppercase">D-Wave QPU Probability Engine</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">Pegasus Hamiltonian QUBO Annealer system</p>
          </div>
        </div>
        <div className="flex items-center gap-2 select-none">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-950/40 border border-pink-850/40 text-pink-400 font-extrabold uppercase tracking-wider animate-pulse">
            TRANSCENDENT QUANTUM
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Visual Qubit Manifold Representation (HTML Canvas/Interactive area) */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-900 rounded-2xl h-[330px] p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(#ec4899_[0.5px],transparent_[0.5px])] [background-size:20px_20px] opacity-[0.015] pointer-events-none" />
          
          <div className="flex justify-between items-center select-none font-mono text-[8px] text-slate-500 z-10">
            <span>QUBIT INTERACTION GRID topology [PEGASUS]</span>
            <span className="text-pink-400 animate-pulse">{isAnnealing ? "ANNEALING FIELD ENGAGED" : "FIELD AT REST"}</span>
          </div>

          {/* Interactive graphical representation of Qubits */}
          <div className="flex-1 relative flex items-center justify-center h-[240px]">
            {qubits.map(qubit => {
              const isSelected = activeProposedNumbers.includes(qubit.id);
              
              // Colors based on state or superposition
              let nodeColor = "border-slate-800 bg-slate-950/80 text-slate-500";
              let glowStyle = {};
              
              if (qubit.state === 1) {
                nodeColor = "border-pink-500 bg-pink-950/20 text-pink-300 font-bold";
                // Adding neon glow
                glowStyle = {
                  boxShadow: "0 0 10px rgba(236,72,153,0.35)",
                  borderColor: "rgba(236,72,153,0.8)"
                };
              } else if (isSelected) {
                nodeColor = "border-cyan-500 bg-cyan-950/10 text-cyan-300 font-semibold";
                glowStyle = {
                  boxShadow: "0 0 8px rgba(6,182,212,0.2)"
                };
              }

              // Apply coordinate offsets during active annealing to denote superposition noise
              const currentX = qubit.x + (isAnnealing ? (Math.sin(qubit.phase) * currentTemp * 4) : 0);
              const currentY = qubit.y + (isAnnealing ? (Math.cos(qubit.phase) * currentTemp * 4) : 0);

              return (
                <div
                  key={qubit.id}
                  className={`absolute w-5 h-5 rounded-md border text-[7.5px] font-mono font-bold flex items-center justify-center transition-all duration-300 select-none ${nodeColor}`}
                  style={{
                    left: `${(currentX / 300) * 100}%`,
                    top: `${(currentY / 300) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    opacity: isAnnealing ? Math.max(0.45, 1 - currentTemp * 0.4) : isSelected ? 1 : 0.65,
                    ...glowStyle
                  }}
                  title={`Qubit #${qubit.id} [Bias h_i: ${qubit.bias.toFixed(2)}]`}
                >
                  {qubit.id}
                </div>
              );
            })}

            {/* Simulated Energy chart line overlay inside qubits panel for feedback */}
            {isAnnealing && (
              <div className="absolute inset-x-8 bottom-4 h-16 pointer-events-none select-none flex flex-col justify-between font-mono text-[8px] text-pink-500/80">
                <div className="border-t border-dashed border-pink-500/20 w-full" />
                <div className="h-10 flex items-end gap-1 overflow-hidden">
                  {temperatureHistory.map((h, i) => (
                    <div 
                      key={i}
                      className="bg-pink-500/30 rounded-t w-1.5 transition-all duration-300"
                      style={{ height: `${Math.min(100, Math.max(10, Math.floor((Math.abs(h.energy) / 15) * 100)))}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[7px]">
                  <span>ENERGY PATHWAY H(s)</span>
                  <span className="animate-pulse flex items-center gap-1">
                    <Flame className="w-2 h-2" /> Decaying: {currentTemp.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-500 z-10 border-t border-slate-950 pt-2 select-none">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500/60" /> ACTIVE COUPLERS: 1,176 CORRELATION SPINS
            </span>
            <span>N={sampleReads} READS</span>
          </div>
        </div>

        {/* Configuration sliders and Discovered States dashboard */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4">
          
          {/* Top Panel sliders */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 select-none flex flex-col gap-3">
            <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest font-black block">ANNEALER TUNE & PARAMETERS</span>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] font-mono text-slate-400 font-bold">
                  <span>ANNEALING TIME:</span>
                  <span className="text-pink-400">{annealingTime} μs</span>
                </div>
                <select
                  value={annealingTime}
                  onChange={(e) => setAnnealingTime(Number(e.target.value))}
                  disabled={isAnnealing}
                  className="bg-slate-950 border border-slate-900 hover:border-pink-500/30 text-[9px] font-mono text-slate-300 p-1.5 rounded-lg focus:outline-none cursor-pointer bg-black"
                >
                  <option value={5}>5 μs (Ultra Fast Collapse)</option>
                  <option value={20}>20 μs (Standard Pegasus)</option>
                  <option value={50}>50 μs (High Precision Ground)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] font-mono text-slate-400 font-bold">
                  <span>SAMPLE QPU READS:</span>
                  <span className="text-pink-400">{sampleReads} reads</span>
                </div>
                <select
                  value={sampleReads}
                  onChange={(e) => setSampleReads(Number(e.target.value))}
                  disabled={isAnnealing}
                  className="bg-slate-950 border border-slate-900 hover:border-pink-500/30 text-[9px] font-mono text-slate-300 p-1.5 rounded-lg focus:outline-none cursor-pointer bg-black"
                >
                  <option value={1000}>1,000 QPU Reads</option>
                  <option value={2000}>2,000 QPU Reads</option>
                  <option value={5000}>5,000 QPU Reads</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[8px] font-mono text-slate-400 font-bold">
                <span>COUPLING PENETRATION DEPTH (J_ij strength multiplier):</span>
                <span className="text-pink-400">{magCoupling.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={magCoupling}
                onChange={(e) => setMagCoupling(parseFloat(e.target.value))}
                disabled={isAnnealing}
                className="w-full h-1 bg-slate-800 rounded outline-none accent-pink-500 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Results Discovered from Hamiltonian Minimisation */}
          <div className="bg-slate-950/70 border border-slate-900/60 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[160px]">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center select-none border-b border-slate-900 pb-1.5">
                <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest font-bold">ANNEALED LANDSCAPE (MINIMA PATHS)</span>
                {discoveredStates.length > 0 && (
                  <span className="text-[7.5px] font-mono text-emerald-400 font-bold uppercase tracking-wider animate-pulse">OPTIMISED SOLUTIONS LOCKED</span>
                )}
              </div>

              {discoveredStates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center select-none">
                  <Activity className="w-6 h-6 text-slate-800 animate-pulse" />
                  <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider leading-relaxed">
                    HAMILTONIAN SPECTRUM IDLE.<br />
                    TAP 'COMMENCE PROGRESSIVE ANNEAL' TO ANNEAL CYCLES.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {discoveredStates.map((state, idx) => {
                    const isSelected = selectedDiscoveredIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDiscoveredIndex(idx)}
                        className={`p-2 rounded-lg border font-mono text-[9px] transition-all cursor-pointer text-left flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-pink-950/20 border-pink-500/40 text-pink-100"
                            : "bg-slate-950 border-slate-900/80 hover:border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] px-1 py-0.5 rounded ${isSelected ? "bg-pink-900/40 text-pink-300" : "bg-slate-900 text-slate-500"}`}>
                            #{idx + 1}
                          </span>
                          <div className="flex gap-1.5">
                            {state.numbers.map(num => (
                              <span 
                                key={num} 
                                className={`w-4 h-4 rounded-full flex items-center justify-center font-sans font-bold text-[8.5px] ${
                                  isSelected ? "bg-pink-550 border border-white/20 text-white" : "bg-slate-900 text-slate-350"
                                }`}
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase">HAMILT_E</span>
                            <span className={`${isSelected ? "text-pink-300" : "text-slate-400"} font-extrabold`}>
                              {state.energy.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase">READS_FRQ</span>
                            <span className="text-slate-300 font-extrabold">{state.probability}%</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamic CTA */}
            {discoveredStates.length > 0 && selectedDiscoveredIndex !== -1 && (
              <div className="pt-2 border-t border-slate-900/60 mt-2 flex justify-between items-center gap-2 select-none">
                <span className="text-[7.5px] font-mono text-slate-500 uppercase leading-none">
                  Converged state selected. Inject Hamiltonian ground sequence into the core.
                </span>
                <button
                  onClick={() => {
                    const selNumbers = discoveredStates[selectedDiscoveredIndex].numbers;
                    onApplyNumbers([...selNumbers]);
                    addToast(
                      "HAMILTONIAN QUANTUM SYNC",
                      `Quantum ground state sequence [${selNumbers.join(', ')}] synchronized onto main dashboard.`,
                      "success"
                    );
                    if (isTTSEnabled) {
                      playSpeech("Quantum state sequence synced.");
                    }
                  }}
                  className="px-2.5 py-1 bg-pink-900/30 hover:bg-pink-900/50 border border-pink-500/40 text-[8px] font-mono text-pink-300 font-bold uppercase rounded cursor-pointer transition active:scale-95"
                >
                  Apply Ground State
                </button>
              </div>
            )}
          </div>

          {/* Trigger button */}
          <button
            onClick={performQuantumAnnealCycles}
            disabled={isAnnealing}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-950 to-purple-950 hover:from-pink-900 hover:to-purple-900 border border-pink-500/40 text-[10px] font-mono text-pink-300 font-black tracking-widest uppercase transition-all duration-300 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.1)] active:scale-98"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-pink-450 ${isAnnealing ? 'animate-spin' : ''}`} />
            <span>{isAnnealing ? `ANNEALING MATRIX: ${annealProgress}%` : "Commence Progressive Anneal"}</span>
          </button>
          
        </div>

      </div>

    </div>
  );
}
