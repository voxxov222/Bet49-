import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  Cpu, 
  Zap, 
  Activity, 
  RefreshCw, 
  Sliders, 
  Maximize2, 
  Info, 
  Play, 
  SlidersHorizontal,
  Check,
  TrendingUp,
  CircleDot,
  Wrench,
  Gauge
} from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface MultivariateMLPredictorProps {
  draws: LottoDraw[];
  activeProposedNumbers: number[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

// 4 multi-metric features modeled after electronic/electrical multimeter outputs
interface FeatureVector {
  num: number;
  freqVoltageValue: number; // raw value
  freqVoltage: number;      // normalized X1: how frequent
  recencyAmpValue: number;  // raw value
  recencyAmp: number;       // normalized X2: reciprocal of gap since last draw
  harmonicResVal: number;   // raw value
  harmonicRes: number;      // normalized X3: modulo-9 digital root closeness to active resonance
  spiralZVal: number;       // raw value
  spiralZ: number;          // normalized X4: prime spiral Archimedean coordinates proximity score
  targetVal: number;        // raw target Y: hit density vector 
  target: number;           // normalized target Y
}

interface LossHistoryPoint {
  epoch: number;
  trainLoss: number;
  testLoss: number;
}

export default function MultivariateMLPredictor({
  draws,
  activeProposedNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: MultivariateMLPredictorProps) {
  // Machine learning hyperparameters state
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [lambda, setLambda] = useState<number>(0.01); // L2 regularization (Ridge regression)
  const [splitRatio, setSplitRatio] = useState<number>(75); // 75% train, 25% test
  const [totalEpochs, setTotalEpochs] = useState<number>(1000);
  
  // Interactive testing multimeter dial values
  const [probeSelectedNum, setProbeSelectedNum] = useState<number>(7);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainProgress, setTrainProgress] = useState<number>(0);

  // Model parameters state
  const [weights, setWeights] = useState<number[]>([0.15, -0.10, 0.25, 0.05]);
  const [bias, setBias] = useState<number>(0.1);
  const [lossHistory, setLossHistory] = useState<LossHistoryPoint[]>([]);
  const [modelTrained, setModelTrained] = useState<boolean>(false);

  // Primality helper checks
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

  // 1. Generate & pre-process dataset
  const dataset: FeatureVector[] = useMemo(() => {
    if (draws.length === 0) {
      // Fallback container if database is empty 
      return Array.from({ length: 49 }, (_, idx) => {
        const num = idx + 1;
        return {
          num,
          freqVoltageValue: 1, freqVoltage: 0.5,
          recencyAmpValue: 1, recencyAmp: 0.5,
          harmonicResVal: 3, harmonicRes: 0.5,
          spiralZVal: 2, spiralZ: 0.5,
          targetVal: 1, target: 0.5
        };
      });
    }

    const totalDraws = draws.length;
    const frequencies: Record<number, number> = {};
    const lastSeenIndex: Record<number, number> = {};

    // Initial values
    for (let i = 1; i <= 49; i++) {
      frequencies[i] = 0;
      lastSeenIndex[i] = -1;
    }

    // Accumulate draw frequencies & track last occurrence index
    draws.forEach((draw, dIdx) => {
      draw.numbers.forEach(num => {
        if (num >= 1 && num <= 49) {
          frequencies[num]++;
          lastSeenIndex[num] = Math.max(lastSeenIndex[num], dIdx);
        }
      });
    });

    // Populate values for all 49 points
    const vectors: Omit<FeatureVector, 'freqVoltage' | 'recencyAmp' | 'harmonicRes' | 'spiralZ' | 'target'>[] = [];

    for (let num = 1; num <= 49; num++) {
      // Feature 1: Frequency Voltage (Historical Draw Occurrences)
      const freqVoltageValue = frequencies[num];

      // Feature 2: Recency Amperage output (how recently drawn, inverted gap)
      const gap = lastSeenIndex[num] === -1 ? totalDraws : totalDraws - 1 - lastSeenIndex[num];
      const recencyAmpValue = 1 / (1 + gap);

      // Feature 3: Harmonic Resonance (closeness of modulo-9 root to Nikolai Tesla's 3-6-9 anchors)
      const digRoot = ((num - 1) % 9) + 1;
      const distTo3 = Math.abs(digRoot - 3);
      const distTo6 = Math.abs(digRoot - 6);
      const distTo9 = Math.abs(digRoot - 9);
      const harmonicResVal = 10 - Math.min(distTo3, distTo6, distTo9); // closer gives higher raw score

      // Feature 4: Prime Spiral Coordinates (Archimedean coordinate distance proximity code)
      const isP = isPrime(num);
      const isS = isSemiprime(num);
      const spiralZVal = isP ? 10 : isS ? 6 : 2;

      // Target Value: Target likelihood factor (measured by combined hit ratios of last 15 draws + overall)
      const recentLookback = draws.slice(-15);
      const recentHits = recentLookback.filter(d => d.numbers.includes(num)).length;
      const targetVal = (frequencies[num] / totalDraws) * 0.4 + (recentHits / Math.max(1, recentLookback.length)) * 0.6;

      vectors.push({
        num,
        freqVoltageValue,
        recencyAmpValue,
        harmonicResVal,
        spiralZVal,
        targetVal
      });
    }

    // Perform feature scaling / min-max normalization [0, 1] to prevent gradient explosion
    const scaleFeature = (arr: number[]) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const range = max - min || 1;
      return arr.map(v => (v - min) / range);
    };

    const freqNorm = scaleFeature(vectors.map(v => v.freqVoltageValue));
    const recencyNorm = scaleFeature(vectors.map(v => v.recencyAmpValue));
    const harmonicNorm = scaleFeature(vectors.map(v => v.harmonicResVal));
    const spiralNorm = scaleFeature(vectors.map(v => v.spiralZVal));
    const targetNorm = scaleFeature(vectors.map(v => v.targetVal));

    return vectors.map((v, idx) => ({
      ...v,
      freqVoltage: freqNorm[idx],
      recencyAmp: recencyNorm[idx],
      harmonicRes: harmonicNorm[idx],
      spiralZ: spiralNorm[idx],
      target: targetNorm[idx]
    }));
  }, [draws]);

  // Read raw telemetry metrics for selected probe node
  const activeProbeStats = useMemo(() => {
    const matched = dataset.find(v => v.num === probeSelectedNum);
    if (!matched) return null;

    // Predicted value calculated from current hyp parameters
    const yHat = weights[0] * matched.freqVoltage + 
                 weights[1] * matched.recencyAmp + 
                 weights[2] * matched.harmonicRes + 
                 weights[3] * matched.spiralZ + bias;

    // Convert to realistic multimeter dial outputs
    return {
      num: matched.num,
      voltage: (matched.freqVoltageValue * 1.84).toFixed(2) + " V",
      amperage: (matched.recencyAmpValue * 450).toFixed(0) + " mA",
      resistance: (matched.harmonicResVal * 12.5).toFixed(1) + " kΩ",
      impedance: (matched.spiralZVal * 8.0).toFixed(1) + " Ω",
      voltagePct: matched.freqVoltage,
      amperagePct: matched.recencyAmp,
      resistancePct: matched.harmonicRes,
      impedancePct: matched.spiralZ,
      predictedPotential: Math.max(0.01, Math.min(1.0, yHat)),
      targetPotential: matched.target
    };
  }, [probeSelectedNum, dataset, weights, bias]);

  // Live predictions ranking across the 49 node array
  const predictionsRanked = useMemo(() => {
    return dataset.map(item => {
      const yHat = weights[0] * item.freqVoltage + 
                   weights[1] * item.recencyAmp + 
                   weights[2] * item.harmonicRes + 
                   weights[3] * item.spiralZ + bias;
      return {
        num: item.num,
        score: Math.max(0, yHat)
      };
    }).sort((a, b) => b.score - a.score);
  }, [dataset, weights, bias]);

  // Train the multivariate linear regression engine with Ridge regularization L2
  const runGradientDescentTraining = () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainProgress(0);

    if (isTTSEnabled) {
      playSpeech("Configuring neural shunt. Commencing multivariate linear gradient descent optimization model.");
    }

    addToast(
      "MULTIVARIATE RIGID REGRESSION INTERACTION",
      "Gradient descent optimization engaged. Calculating optimal weights & bias with L2 ridge penalty...",
      "info"
    );

    // Split Dataset randomly into Train and Test subsets
    const shuffledData = [...dataset].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor((splitRatio / 100) * dataset.length);
    const trainSet = shuffledData.slice(0, splitIndex);
    const testSet = shuffledData.slice(splitIndex);

    // Initial weights randomized
    let w = [Math.random() * 0.4 - 0.2, Math.random() * 0.4 - 0.2, Math.random() * 0.4 - 0.2, Math.random() * 0.4 - 0.2];
    let b = Math.random() * 0.2 - 0.1;

    const computeMSE = (subset: typeof dataset, currentW: number[], currentB: number): number => {
      let sumSqError = 0;
      subset.forEach(item => {
        const yHat = currentW[0] * item.freqVoltage + 
                     currentW[1] * item.recencyAmp + 
                     currentW[2] * item.harmonicRes + 
                     currentW[3] * item.spiralZ + currentB;
        sumSqError += Math.pow(yHat - item.target, 2);
      });
      return sumSqError / (2 * subset.length || 1);
    };

    const history: LossHistoryPoint[] = [];
    const stepSize = Math.max(1, Math.floor(totalEpochs / 35));

    let epoch = 0;
    const interval = setInterval(() => {
      // Run batch gradient descent steps
      for (let s = 0; s < stepSize && epoch < totalEpochs; s++) {
        let dw = [0, 0, 0, 0];
        let db = 0;

        // Compute gradients over trainSet
        trainSet.forEach(item => {
          const yHat = w[0] * item.freqVoltage + 
                       w[1] * item.recencyAmp + 
                       w[2] * item.harmonicRes + 
                       w[3] * item.spiralZ + b;
          const error = yHat - item.target;

          // Add Ridge Gradient derivative details
          dw[0] += error * item.freqVoltage;
          dw[1] += error * item.recencyAmp;
          dw[2] += error * item.harmonicRes;
          dw[3] += error * item.spiralZ;
          db += error;
        });

        // Normalize & apply parameter penalty updates with regularizer
        const M = trainSet.length || 1;
        w[0] = w[0] * (1 - learningRate * lambda) - learningRate * (dw[0] / M);
        w[1] = w[1] * (1 - learningRate * lambda) - learningRate * (dw[1] / M);
        w[2] = w[2] * (1 - learningRate * lambda) - learningRate * (dw[2] / M);
        w[3] = w[3] * (1 - learningRate * lambda) - learningRate * (dw[3] / M);
        b = b - learningRate * (db / M);

        // Record loss snapshots at milestones
        if (epoch % Math.max(1, Math.floor(totalEpochs / 25)) === 0) {
          const trainLoss = computeMSE(trainSet, w, b);
          const testLoss = computeMSE(testSet, w, b);
          history.push({ epoch, trainLoss, testLoss });
        }

        epoch++;
      }

      const progressRaw = Math.min(100, Math.round((epoch / totalEpochs) * 100));
      setTrainProgress(progressRaw);
      setWeights([...w]);
      setBias(b);
      setLossHistory([...history]);

      if (epoch >= totalEpochs) {
        clearInterval(interval);
        setIsTraining(false);
        setModelTrained(true);

        const finalTrainL = computeMSE(trainSet, w, b);
        const finalTestL = computeMSE(testSet, w, b);

        if (isTTSEnabled) {
          playSpeech("Multivariate linear model optimization complete. Weights calibrated successfully.");
        }
        addToast(
          "OPTIMAL CONVERGENCE REACHED",
          `Model convergence success. Final Train MSE: ${finalTrainL.toFixed(4)}, Test MSE: ${finalTestL.toFixed(4)}. calibrated weights locked.`,
          "success"
        );
      }
    }, 45); // small interval to let the charts animate elegantly
  };

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-purple-500/15 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-purple-500/25 transition-all duration-500 relative overflow-hidden">
      
      {/* Stark Geometric HUD Overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(#a855f7_0.6px,transparent_0.6px)] [background-size:10px_10px] opacity-[0.04] pointer-events-none" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3 select-none">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-purple-400 uppercase">Multivariate Linear & Multimeter ML Simulator</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">Multi-metric analytical feature calibrator with ridge regularization</p>
          </div>
        </div>
        <div className="flex bg-slate-900 border border-slate-950 px-2 py-0.5 rounded text-[8.5px] font-mono text-purple-300 font-extrabold uppercase animate-pulse">
          gradient-descent core
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Live Multimeter Testing Dial/Probe Tool Visualizer */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between min-h-[340px] relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900/60 font-mono select-none text-[8.5px] text-slate-500">
            <span>MULTIMETER METRIC SCANNER</span>
            <span className="text-purple-400">{`NODE #${probeSelectedNum} SCAN`}</span>
          </div>

          <div className="flex-1 flex flex-col gap-3 justify-center py-2">
            
            {/* Main digital pointer readout panel */}
            <div className="bg-black/80 font-mono p-3 rounded border border-purple-950/40 text-center relative overflow-hidden select-all">
              <div className="absolute top-1 left-2 text-[6.5px] text-purple-500 font-extrabold uppercase">CALIBRATED POTENTIAL</div>
              <div className="text-2xl font-black text-purple-400 mt-1 flex justify-center items-baseline gap-1">
                {(activeProbeStats?.predictedPotential || 0).toFixed(4)}
                <span className="text-xs text-purple-600">POT</span>
              </div>
              <div className="flex justify-between items-center text-[7.5px] text-slate-500 font-bold border-t border-slate-900/80 pt-1 mt-1">
                <span>FREQ SCALE: {activeProbeStats?.voltage}</span>
                <span>Y_TARGET: {(activeProbeStats?.targetPotential || 0).toFixed(3)}</span>
              </div>
            </div>

            {/* Simulated hardware analogue bar dials */}
            <div className="flex flex-col gap-2 font-mono text-[8px] select-none">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>ALPHA PROBE: DRAW FREQ (V)</span>
                  <span className="text-emerald-400">{activeProbeStats?.voltage}</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-950">
                  <div 
                    className="h-full bg-emerald-500 rounded transition" 
                    style={{ width: `${(activeProbeStats?.voltagePct || 0) * 100}%` }} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>BETA PROBE: RECENCY GAP (A)</span>
                  <span className="text-cyan-400">{activeProbeStats?.amperage}</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-950">
                  <div 
                    className="h-full bg-cyan-500 rounded transition" 
                    style={{ width: `${(activeProbeStats?.amperagePct || 0) * 100}%` }} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>RESISTANCE PROBE: TESLA RESONANCE (Ω)</span>
                  <span className="text-amber-400">{activeProbeStats?.resistance}</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-950">
                  <div 
                    className="h-full bg-amber-500 rounded transition" 
                    style={{ width: `${(activeProbeStats?.resistancePct || 0) * 100}%` }} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>IMPEDANCE SCALE: ARCHIMEDEAN DENSITY (Z)</span>
                  <span className="text-pink-400">{activeProbeStats?.impedance}</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-950">
                  <div 
                    className="h-full bg-pink-500 rounded transition" 
                    style={{ width: `${(activeProbeStats?.impedancePct || 0) * 100}%` }} 
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Quick interactive probe selector strip */}
          <div className="flex flex-col gap-1.5 border-t border-slate-900/60 pt-2 select-none">
            <span className="text-[7.5px] font-mono text-slate-500 uppercase leading-none">CONNECT TELEMETRY PROBES</span>
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none-horizontal">
              {[3, 7, 11, 19, 23, 29, 37, 41, 47].map(num => (
                <button
                  key={num}
                  onClick={() => setProbeSelectedNum(num)}
                  className={`px-1.5 py-1 text-[8px] font-mono rounded font-black border transition shrink-0 cursor-pointer ${
                    probeSelectedNum === num
                      ? "bg-purple-950/40 border-purple-500/40 text-purple-200"
                      : "bg-slate-900 border-slate-900 text-slate-400"
                  }`}
                >
                  #{num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Training Loss Curve & Hyperparameter Controls */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between min-h-[340px] shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900/60 font-mono select-none text-[8.5px] text-slate-500">
            <span>GRADIENT DESCENT CALIBRATION & LOSS</span>
            <span className="text-cyan-400 animate-pulse">{isTraining ? "TUNING WEIGHTS..." : "NEURAL WEIGHTS CONCURRED"}</span>
          </div>

          {/* Recharts dynamic loss plotting viewport */}
          <div className="flex-1 h-[140px] min-h-[140px] flex items-center justify-center relative mt-3 mb-2">
            {lossHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 text-center select-none">
                <Activity className="w-8 h-8 text-slate-850 animate-pulse mb-1" />
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                  GRADIENT MSE COHERENCE SPECTRUM OFFLINE.<br />
                  TAP 'BOOT TELEMETRY OPTIMIZER' TO FIT WEIGHTS.
                </span>
              </div>
            ) : (
              <div className="w-full h-full text-[8px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lossHistory} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                    <XAxis dataKey="epoch" tick={{ fill: '#4b5563', fontSize: 7 }} />
                    <YAxis tick={{ fill: '#4b5563', fontSize: 7 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '8px', color: '#cbd5e1' }}
                      labelStyle={{ color: '#8b5cf6' }}
                    />
                    <Legend iconSize={6} wrapperStyle={{ fontSize: '7px', color: '#9ca3af' }} />
                    <Line 
                      type="monotone" 
                      dataKey="trainLoss" 
                      name="Train MSE" 
                      stroke="#8b5cf6" 
                      strokeWidth={1.5} 
                      dot={false}
                      activeDot={{ r: 3 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="testLoss" 
                      name="Test MSE" 
                      stroke="#06b6d4" 
                      strokeWidth={1.5} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Hyperparameter slider controllers */}
          <div className="flex flex-col gap-2.5 bg-black/40 p-3 rounded-lg border border-slate-900 select-none font-mono text-[7.5px] leading-tight">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400">
                  <span>LEARNING RATE (α):</span>
                  <span className="text-purple-400">{learningRate}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.01"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  disabled={isTraining}
                  className="w-full h-1 bg-slate-800 rounded outline-none accent-purple-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400">
                  <span>RIDGE PENALTY (λ):</span>
                  <span className="text-purple-400">{lambda}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.005"
                  value={lambda}
                  onChange={(e) => setLambda(parseFloat(e.target.value))}
                  disabled={isTraining}
                  className="w-full h-1 bg-slate-800 rounded outline-none accent-purple-500 cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400">
                  <span>TRAIN/TEST SPLIT:</span>
                  <span className="text-purple-400">{splitRatio}% / {100 - splitRatio}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="90"
                  value={splitRatio}
                  onChange={(e) => setSplitRatio(Number(e.target.value))}
                  disabled={isTraining}
                  className="w-full h-1 bg-slate-800 rounded outline-none accent-purple-500 cursor-pointer disabled:opacity-40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400">
                  <span>EPOCHS:</span>
                  <span className="text-purple-400">{totalEpochs}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="250"
                  value={totalEpochs}
                  onChange={(e) => setTotalEpochs(Number(e.target.value))}
                  disabled={isTraining}
                  className="w-full h-1 bg-slate-800 rounded outline-none accent-purple-500 cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Outputs & Sync Action Panel */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          
          <div className="bg-slate-950/70 border border-slate-900/60 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[220px]">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center select-none border-b border-slate-900 pb-1.5 font-mono text-[8.5px] text-slate-500">
                <span>LINEAR REGRESSION FORECAST RANGE</span>
                {modelTrained && (
                  <span className="text-[7px] font-mono text-emerald-400 font-bold uppercase tracking-wider animate-pulse">OPTIMIZED SPEC LOCK</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {predictionsRanked.slice(0, 6).map((item, idx) => {
                  const isSelected = activeProposedNumbers.includes(item.num);
                  return (
                    <div
                      key={item.num}
                      className={`p-1.5 rounded border font-mono text-[9px] flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-purple-950/20 border-purple-500/40 text-purple-200 font-bold"
                          : "bg-slate-950 border-slate-900/80 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[7.5px] font-bold text-slate-500">
                          #{idx + 1}
                        </span>
                        <div 
                          onClick={() => setProbeSelectedNum(item.num)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-sans font-bold text-[9px] cursor-pointer hover:scale-105 active:scale-95 transition ${
                            isSelected ? "bg-purple-550 border border-white/20 text-white" : "bg-slate-900 text-slate-350"
                          }`}
                        >
                          {item.num}
                        </div>
                        <span className="text-[7.5px] text-slate-500 uppercase">POTENTIAL WEIGHT</span>
                      </div>

                      <span className="text-slate-300 font-extrabold text-[8.5px]">
                        {item.score.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Application Synch */}
            {modelTrained && (
              <div className="pt-2 border-t border-slate-900/60 mt-2 flex justify-between items-center gap-2 select-none">
                <span className="text-[7px] font-mono text-slate-500 uppercase leading-none">
                  Regression weights optimized. Deploy top 6 forecast potential sequence.
                </span>
                <button
                  onClick={() => {
                    const top6 = predictionsRanked.slice(0, 6).map(p => p.num);
                    onApplyNumbers(top6);
                    addToast(
                      "MULTIVARIATE DEPLOY RESIDUALS",
                      `Optimized ML regression sequence [${top6.join(', ')}] synchronized onto system dashboard.`,
                      "success"
                    );
                    if (isTTSEnabled) {
                      playSpeech("Optimized regression sequence synchronized.");
                    }
                  }}
                  className="px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-[8px] font-mono text-purple-300 font-bold uppercase rounded cursor-pointer transition active:scale-95"
                >
                  Sync Forecast
                </button>
              </div>
            )}
          </div>

          {/* Trigger training loop button */}
          <button
            onClick={runGradientDescentTraining}
            disabled={isTraining}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-950 to-pink-950 hover:from-purple-900 hover:to-pink-900 border border-purple-500/40 text-[10px] font-mono text-purple-300 font-black tracking-widest uppercase transition-all duration-300 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.1)] active:scale-98"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isTraining ? 'animate-spin' : ''}`} />
            <span>{isTraining ? `CALCULATING EPOCHS: ${trainProgress}%` : "BOOT TELEMETRY OPTIMIZER"}</span>
          </button>
          
        </div>

      </div>

    </div>
  );
}
