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
  Check, 
  TrendingUp, 
  CircleDot, 
  Wrench, 
  Terminal,
  HelpCircle,
  Send,
  GitFork,
  MessageSquare,
  AudioLines,
  Compass,
  Layers,
  Network
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

interface ChatMessage {
  sender: 'jarvis' | 'user';
  text: string;
  timestamp: string;
}

export default function MultivariateMLPredictor({
  draws,
  activeProposedNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: MultivariateMLPredictorProps) {
  // Navigation tab states
  const [activeTab, setActiveTab] = useState<'regression' | 'markov' | 'quantum_tensor'>('regression');

  // Machine learning hyperparameters (Standard Ridge)
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [lambda, setLambda] = useState<number>(0.01); // L2 regularization (Ridge regression)
  const [splitRatio, setSplitRatio] = useState<number>(75); // 75% train, 25% test
  const [totalEpochs, setTotalEpochs] = useState<number>(1000);
  
  // Quantum-Inspired Multilinear Tensor Regression Hyperparameters
  const [chebyshevOrder, setChebyshevOrder] = useState<number>(2); // T1 to T_order polynomial expansion
  const [tensorRank, setTensorRank] = useState<number>(4); // Top SVD singular values
  const [elasticNetAlpha, setElasticNetAlpha] = useState<number>(0.5); // L1 mixing ratio (Elastic Net)
  const [l1Penalty, setL1Penalty] = useState<number>(0.005);
  const [l2Penalty, setL2Penalty] = useState<number>(0.01);
  const [tensorEpochs, setTensorEpochs] = useState<number>(500);

  // Interactive testing multimeter dial values
  const [probeSelectedNum, setProbeSelectedNum] = useState<number>(7);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainProgress, setTrainProgress] = useState<number>(0);

  // Standard Model parameters state
  const [weights, setWeights] = useState<number[]>([0.15, -0.10, 0.25, 0.05]);
  const [bias, setBias] = useState<number>(0.1);
  const [lossHistory, setLossHistory] = useState<LossHistoryPoint[]>([]);
  const [modelTrained, setModelTrained] = useState<boolean>(false);

  // Quantum-Inspired Tensor Model Parameters State
  const [tensorWeights1D, setTensorWeights1D] = useState<number[]>([]);
  const [tensorBias, setTensorBias] = useState<number>(0.1);
  const [tensorLossHistory, setTensorLossHistory] = useState<LossHistoryPoint[]>([]);
  const [tensorModelTrained, setTensorModelTrained] = useState<boolean>(false);
  const [isTensorTraining, setIsTensorTraining] = useState<boolean>(false);
  const [tensorTrainProgress, setTensorTrainProgress] = useState<number>(0);

  // Singular Value Decomposition States for Pattern Recognition
  const [singularValues, setSingularValues] = useState<number[]>([]);
  const [svdPotential, setSvdPotential] = useState<number[]>(Array(49).fill(0.1));
  const [eigenvectors, setEigenvectors] = useState<number[][]>([]);

  // State for Jarvis Conversation Terminal
  const [jarvisMessages, setJarvisMessages] = useState<ChatMessage[]>([
    { 
      sender: 'jarvis', 
      text: "Mainframe online, operator. I have compiled the multivariate telemetry grid and initialized the Quantum-Inspired Multilinear Tensor solver. Select a visual protocol above or click any tactical command query to analyze next-sequence probabilities.", 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
    }
  ]);
  const [userQueryText, setUserQueryText] = useState<string>('');
  const [isJarvisAnswering, setIsJarvisAnswering] = useState<boolean>(false);

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

    for (let i = 1; i <= 49; i++) {
      frequencies[i] = 0;
      lastSeenIndex[i] = -1;
    }

    draws.forEach((draw, dIdx) => {
      draw.numbers.forEach(num => {
        if (num >= 1 && num <= 49) {
          frequencies[num]++;
          lastSeenIndex[num] = Math.max(lastSeenIndex[num], dIdx);
        }
      });
    });

    const vectors: Omit<FeatureVector, 'freqVoltage' | 'recencyAmp' | 'harmonicRes' | 'spiralZ' | 'target'>[] = [];

    for (let num = 1; num <= 49; num++) {
      const freqVoltageValue = frequencies[num];
      const gap = lastSeenIndex[num] === -1 ? totalDraws : totalDraws - 1 - lastSeenIndex[num];
      const recencyAmpValue = 1 / (1 + gap);

      const digRoot = ((num - 1) % 9) + 1;
      const distTo3 = Math.abs(digRoot - 3);
      const distTo6 = Math.abs(digRoot - 6);
      const distTo9 = Math.abs(digRoot - 9);
      const harmonicResVal = 10 - Math.min(distTo3, distTo6, distTo9);

      const isP = isPrime(num);
      const isS = isSemiprime(num);
      const spiralZVal = isP ? 10 : isS ? 6 : 2;

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

  // 2. Compute 1st-Order Markov State Transition matrix dynamically from actual sequence data
  const transitionMatrix = useMemo(() => {
    const matrix: Record<number, Record<number, number>> = {};
    for (let i = 1; i <= 49; i++) {
      matrix[i] = {};
      for (let j = 1; j <= 49; j++) {
        matrix[i][j] = 0;
      }
    }

    // Sort draws sequentially by date (oldest to newest) to map transitions
    const sortedDraws = [...draws].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (let i = 0; i < sortedDraws.length - 1; i++) {
      const currentNums = sortedDraws[i].numbers;
      const nextNums = sortedDraws[i + 1].numbers;
      currentNums.forEach(numA => {
        nextNums.forEach(numB => {
          if (numA >= 1 && numA <= 49 && numB >= 1 && numB <= 49) {
            matrix[numA][numB]++;
          }
        });
      });
    }

    // Convert frequencies to raw probability weights
    const normalized: Record<number, Record<number, number>> = {};
    for (let i = 1; i <= 49; i++) {
      normalized[i] = {};
      const row = matrix[i];
      const sum = Object.values(row).reduce((s, v) => s + v, 0);
      for (let j = 1; j <= 49; j++) {
        normalized[i][j] = sum > 0 ? (row[j] / sum) : (1 / 49);
      }
    }

    return normalized;
  }, [draws]);

  // High-Probability Subsequent States from the currently selected active node
  const topTransitions = useMemo(() => {
    const row = transitionMatrix[probeSelectedNum] || {};
    return Object.entries(row)
      .map(([numStr, prob]) => ({
        num: parseInt(numStr, 10),
        probability: prob
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 6);
  }, [transitionMatrix, probeSelectedNum]);

  // Singular Value Decomposition on Historical Draw Co-occurrence Covariance Matrix
  const computeCovarianceAndSVD = (drawsList: LottoDraw[], rank: number) => {
    if (drawsList.length === 0) return { singularValues: [], eigenvectors: [] };

    const totalD = drawsList.length;
    const meanOccur = 6 / 49;
    const A: number[][] = Array.from({ length: totalD }, () => Array(49).fill(-meanOccur));
    drawsList.forEach((draw, dIdx) => {
      draw.numbers.forEach(num => {
        if (num >= 1 && num <= 49) {
          A[dIdx][num - 1] = 1 - meanOccur;
        }
      });
    });

    const C: number[][] = Array.from({ length: 49 }, () => Array(49).fill(0));
    for (let i = 0; i < 49; i++) {
      for (let j = 0; j < 49; j++) {
        let sum = 0;
        for (let d = 0; d < totalD; d++) {
          sum += A[d][i] * A[d][j];
        }
        C[i][j] = sum / (totalD - 1 || 1);
      }
    }

    const sValues: number[] = [];
    const eVectors: number[][] = [];
    const tempC = C.map(row => [...row]);

    for (let r = 0; r < rank; r++) {
      let v: number[] = Array.from({ length: 49 }, (_, idx) => Math.sin(idx + r + 1.2));
      let norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
      v = v.map(val => val / (norm || 1));

      for (let iter = 0; iter < 25; iter++) {
        const nextV = Array(49).fill(0);
        for (let i = 0; i < 49; i++) {
          for (let j = 0; j < 49; j++) {
            nextV[i] += tempC[i][j] * v[j];
          }
        }
        const nextNorm = Math.sqrt(nextV.reduce((sum, val) => sum + val * val, 0));
        v = nextV.map(val => val / (nextNorm || 1));
      }

      let lam = 0;
      for (let i = 0; i < 49; i++) {
        let rowSum = 0;
        for (let j = 0; j < 49; j++) {
          rowSum += tempC[i][j] * v[j];
        }
        lam += v[i] * rowSum;
      }

      sValues.push(Math.max(0.0001, lam));
      eVectors.push(v);

      for (let i = 0; i < 49; i++) {
        for (let j = 0; j < 49; j++) {
          tempC[i][j] -= lam * v[i] * v[j];
        }
      }
    }

    return { singularValues: sValues, eigenvectors: eVectors };
  };

  // Chebyshev polynomial terms of the first kind: T_n(x)
  const chebyshevTerms = (x: number, order: number): number[] => {
    const z = 2 * x - 1; // map [0,1] to [-1,1]
    const terms: number[] = [];
    for (let o = 1; o <= order; o++) {
      const clampedZ = Math.max(-1.0, Math.min(1.0, z));
      terms.push(Math.cos(o * Math.acos(clampedZ)));
    }
    return terms;
  };

  // Maps normalized feature vectors into Chebyshev Quantum state expansions
  const constructFeatureVector = (item: FeatureVector, order: number): number[] => {
    const v = [1]; // intercept term
    v.push(...chebyshevTerms(item.freqVoltage, order));
    v.push(...chebyshevTerms(item.recencyAmp, order));
    v.push(...chebyshevTerms(item.harmonicRes, order));
    v.push(...chebyshevTerms(item.spiralZ, order));
    return v;
  };

  // Index mapping from 1D weight list to symmetric 2D outer product matrices
  const getIndexMapping = (L: number) => {
    const map: { i: number; j: number }[] = [];
    for (let i = 0; i < L; i++) {
      for (let j = i; j < L; j++) {
        map.push({ i, j });
      }
    }
    return map;
  };

  const L_curr = 1 + 4 * chebyshevOrder;
  const map_curr = useMemo(() => getIndexMapping(L_curr), [L_curr]);

  const tensorWeightsMatrix = useMemo(() => {
    const L = 1 + 4 * chebyshevOrder;
    const W = Array.from({ length: L }, () => Array(L).fill(0));
    if (tensorWeights1D.length === 0) {
      for (let i = 0; i < L; i++) {
        for (let j = 0; j < L; j++) {
          W[i][j] = 0.01 * Math.sin(i * j + 1.2);
        }
      }
      return W;
    }
    map_curr.forEach(({ i, j }, idx) => {
      const val = tensorWeights1D[idx] || 0;
      W[i][j] = val;
      W[j][i] = val;
    });
    return W;
  }, [tensorWeights1D, chebyshevOrder, map_curr]);

  // Evaluates Multilinear Tensor regression score for a single node
  const tensorScoreForNode = (item: FeatureVector): number => {
    const L = 1 + 4 * chebyshevOrder;
    const v = constructFeatureVector(item, chebyshevOrder);
    let yHat = tensorBias;
    let idx = 0;
    for (let i = 0; i < L; i++) {
      for (let j = i; j < L; j++) {
        const w_val = tensorWeights1D[idx] !== undefined 
          ? tensorWeights1D[idx] 
          : 0.01 * Math.sin(i * j + 1.2);
        yHat += w_val * (v[i] * v[j]);
        idx++;
      }
    }
    return Math.max(0, yHat);
  };

  // Automated live background SVD pattern engine
  useEffect(() => {
    if (draws.length === 0) return;
    const { singularValues: sVals, eigenvectors: eVects } = computeCovarianceAndSVD(draws, tensorRank);
    setSingularValues(sVals);
    setEigenvectors(eVects);

    // Compute co-occurrence singular density loading for all 49 numbers
    const potential = Array(49).fill(0);
    for (let idx = 0; idx < 49; idx++) {
      let sum = 0;
      eVects.forEach((v, rIdx) => {
        sum += sVals[rIdx] * Math.abs(v[idx]);
      });
      potential[idx] = sum;
    }

    // Min-Max normalize
    const min = Math.min(...potential);
    const max = Math.max(...potential);
    const range = max - min || 1;
    const normPotential = potential.map(p => (p - min) / range);
    setSvdPotential(normPotential);
  }, [draws, tensorRank]);

  // Combined Tri-Hybrid Model score - Fuses Ridge Regression, Markov State Transitions, and Chebyshev Tensor + SVD Pattern recognition
  const hybridForecast = useMemo(() => {
    if (draws.length === 0) return [];
    
    // Grab numbers from the latest historical draw
    const lastDraw = [...draws].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const lastNums = lastDraw ? lastDraw.numbers : [];

    const hybridScores = dataset.map(item => {
      // 1. Standard Regression Potential Y_Hat
      const yHat = weights[0] * item.freqVoltage + 
                   weights[1] * item.recencyAmp + 
                   weights[2] * item.harmonicRes + 
                   weights[3] * item.spiralZ + bias;
      const regScore = Math.max(0, yHat);

      // 2. Markov transition prior (average transition likelihood starting from previous draw numbers)
      let priorScore = 0;
      if (lastNums.length > 0) {
        let sumProb = 0;
        lastNums.forEach(ln => {
          sumProb += transitionMatrix[ln]?.[item.num] || 0;
        });
        priorScore = sumProb / lastNums.length;
      } else {
        priorScore = 1 / 49;
      }

      // 3. Chebyshev Tensor + SVD co-occurrence Score
      const tensorRegVal = tensorScoreForNode(item);
      const svdVal = svdPotential[item.num - 1] || 0.1;
      const tensorScore = tensorRegVal * 0.6 + svdVal * 0.4;

      // Combine with equal weights (33% Ridge Regression, 33% Markov Transitions, 34% Chebyshev Tensor + SVD pattern Recognition)
      return {
        num: item.num,
        regScore,
        priorScore,
        tensorScore,
        combined: regScore * 0.33 + priorScore * 0.33 + tensorScore * 0.34
      };
    });

    // Min-Max normalize combined score to [0, 1]
    const combinedVals = hybridScores.map(h => h.combined);
    const minC = Math.min(...combinedVals);
    const maxC = Math.max(...combinedVals);
    const rangeC = maxC - minC || 1;

    return hybridScores.map(h => ({
      ...h,
      displayScore: (h.combined - minC) / rangeC
    })).sort((a, b) => b.combined - a.combined).slice(0, 6);
  }, [dataset, weights, bias, transitionMatrix, draws, chebyshevOrder, tensorWeights1D, tensorBias, svdPotential]);

  // Read raw telemetry metrics for selected probe node
  const activeProbeStats = useMemo(() => {
    const matched = dataset.find(v => v.num === probeSelectedNum);
    if (!matched) return null;

    const yHat = weights[0] * matched.freqVoltage + 
                 weights[1] * matched.recencyAmp + 
                 weights[2] * matched.harmonicRes + 
                 weights[3] * matched.spiralZ + bias;

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

  // Live predictions ranking across the 49 node array based on regression only
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

    const logMsg = "Configuring neural shunt. Commencing multivariate linear gradient descent optimization model.";
    if (isTTSEnabled) {
      playSpeech(logMsg);
    }
    pushJarvisLog('jarvis', logMsg);

    addToast(
      "MULTIVARIATE RIDGE REGRESSION",
      "Gradient descent optimization engaged. Calibrating weights & bias with L2 ridge penalty...",
      "info"
    );

    const shuffledData = [...dataset].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor((splitRatio / 100) * dataset.length);
    const trainSet = shuffledData.slice(0, splitIndex);
    const testSet = shuffledData.slice(splitIndex);

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
      for (let s = 0; s < stepSize && epoch < totalEpochs; s++) {
        let dw = [0, 0, 0, 0];
        let db = 0;

        trainSet.forEach(item => {
          const yHat = w[0] * item.freqVoltage + 
                       w[1] * item.recencyAmp + 
                       w[2] * item.harmonicRes + 
                       w[3] * item.spiralZ + b;
          const error = yHat - item.target;

          dw[0] += error * item.freqVoltage;
          dw[1] += error * item.recencyAmp;
          dw[2] += error * item.harmonicRes;
          dw[3] += error * item.spiralZ;
          db += error;
        });

        const M = trainSet.length || 1;
        w[0] = w[0] * (1 - learningRate * lambda) - learningRate * (dw[0] / M);
        w[1] = w[1] * (1 - learningRate * lambda) - learningRate * (dw[1] / M);
        w[2] = w[2] * (1 - learningRate * lambda) - learningRate * (dw[2] / M);
        w[3] = w[3] * (1 - learningRate * lambda) - learningRate * (dw[3] / M);
        b = b - learningRate * (db / M);

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

        const successMsg = "Multivariate linear model optimization complete. Weights calibrated successfully.";
        if (isTTSEnabled) {
          playSpeech(successMsg);
        }
        pushJarvisLog('jarvis', `Model optimization complete! Train MSE: ${finalTrainL.toFixed(4)}, Test MSE: ${finalTestL.toFixed(4)}. Weights locked: [w0: ${w[0].toFixed(3)}, w1: ${w[1].toFixed(3)}, w2: ${w[2].toFixed(3)}, w3: ${w[3].toFixed(3)}]`);
        
        addToast(
          "OPTIMAL CONVERGENCE REACHED",
          `Model convergence success. Train MSE: ${finalTrainL.toFixed(4)}, Test MSE: ${finalTestL.toFixed(4)}. calibrated weights locked.`,
          "success"
        );
      }
    }, 45);
  };

  // Train the Chebyshev Multilinear Tensor Regression model via Coordinate Descent with L1/L2 Elastic Net penalties
  const runTensorTraining = () => {
    if (isTensorTraining) return;
    setIsTensorTraining(true);
    setTensorTrainProgress(0);

    const logMsg = "Calibrating Chebyshev phase-space fields. Commencing multilinear coordinate descent tensor optimization.";
    if (isTTSEnabled) {
      playSpeech(logMsg);
    }
    pushJarvisLog('jarvis', logMsg);

    addToast(
      "MULTILINEAR TENSOR SOLVER",
      "Coordinate descent initialized. Resolving higher-order Chebyshev interaction weights...",
      "info"
    );

    const L = 1 + 4 * chebyshevOrder;
    const map = getIndexMapping(L);
    const N_param = map.length;

    // Create the feature-target pairs
    const samples = dataset.map(item => {
      const v = constructFeatureVector(item, chebyshevOrder);
      const X_pair: number[] = [];
      map.forEach(({ i, j }) => {
        X_pair.push(v[i] * v[j]);
      });
      return {
        num: item.num,
        X: X_pair,
        Y: item.target
      };
    });

    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor((splitRatio / 100) * samples.length);
    const trainSet = shuffled.slice(0, splitIndex);
    const testSet = shuffled.slice(splitIndex);

    let w = Array(N_param).fill(0).map(() => Math.random() * 0.1 - 0.05);
    let b = Math.random() * 0.1 - 0.05;

    const computeMSE = (subset: typeof trainSet, currentW: number[], currentB: number): number => {
      let sumErr = 0;
      subset.forEach(s => {
        let yHat = currentB;
        for (let k = 0; k < N_param; k++) {
          yHat += currentW[k] * s.X[k];
        }
        sumErr += Math.pow(yHat - s.Y, 2);
      });
      return sumErr / (2 * subset.length || 1);
    };

    const history: LossHistoryPoint[] = [];
    const stepSize = Math.max(1, Math.floor(tensorEpochs / 35));

    let epoch = 0;
    const interval = setInterval(() => {
      for (let s = 0; s < stepSize && epoch < tensorEpochs; epoch++) {
        // Optimize coordinates (one feature pair weight at a time)
        for (let k = 0; k < N_param; k++) {
          let rho = 0;
          let sumSqX = 0;

          trainSet.forEach(sample => {
            let yHatExcl = b;
            for (let j_feat = 0; j_feat < N_param; j_feat++) {
              if (j_feat !== k) {
                yHatExcl += w[j_feat] * sample.X[j_feat];
              }
            }
            const errExcl = sample.Y - yHatExcl;
            rho += errExcl * sample.X[k];
            sumSqX += sample.X[k] * sample.X[k];
          });

          // Normalize regularization
          const M_samples = trainSet.length;
          const l1 = l1Penalty * M_samples * elasticNetAlpha;
          const l2 = l2Penalty * M_samples * (1 - elasticNetAlpha);

          // Soft Thresholding
          let softRho = 0;
          if (rho > l1) softRho = rho - l1;
          else if (rho < -l1) softRho = rho + l1;

          w[k] = softRho / (sumSqX + l2 || 1);
        }

        // Optimize Intercept (bias b)
        let sumErr = 0;
        trainSet.forEach(sample => {
          let yHat = 0;
          for (let k = 0; k < N_param; k++) {
            yHat += w[k] * sample.X[k];
          }
          sumErr += (sample.Y - yHat);
        });
        b = sumErr / trainSet.length;

        if (epoch % Math.max(1, Math.floor(tensorEpochs / 25)) === 0) {
          const trainLoss = computeMSE(trainSet, w, b);
          const testLoss = computeMSE(testSet, w, b);
          history.push({ epoch, trainLoss, testLoss });
        }
        s++;
      }

      const progressRaw = Math.min(100, Math.round((epoch / tensorEpochs) * 100));
      setTensorTrainProgress(progressRaw);
      setTensorWeights1D([...w]);
      setTensorBias(b);
      setTensorLossHistory([...history]);

      if (epoch >= tensorEpochs) {
        clearInterval(interval);
        setIsTensorTraining(false);
        setTensorModelTrained(true);

        const finalTrainL = computeMSE(trainSet, w, b);
        const finalTestL = computeMSE(testSet, w, b);

        const successMsg = "Tensor network convergence achieved. Interactive weights locked.";
        if (isTTSEnabled) {
          playSpeech(successMsg);
        }
        pushJarvisLog('jarvis', `Tensor model optimization complete! Train MSE: ${finalTrainL.toFixed(4)}, Test MSE: ${finalTestL.toFixed(4)}. Total params calibrated: ${N_param}. Chebyshev Degree: ${chebyshevOrder}`);

        addToast(
          "TENSOR CALIBRATION SUCCESS",
          `Elastic Net multilinear optimization reached convergence. Train MSE: ${finalTrainL.toFixed(4)}, Test MSE: ${finalTestL.toFixed(4)}.`,
          "success"
        );
      }
    }, 45);
  };

  // 3D Regression Plane Visualizer Effect
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (activeTab !== 'regression') return;
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0; 

    const render = () => {
      angle += 0.0035;
      
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2 + 30; 
      const scaleBase = height * 0.45; 
      
      const project = (x3: number, y3: number, z3: number) => {
        const rotX = x3 * Math.cos(angle) - z3 * Math.sin(angle);
        const rotZ = x3 * Math.sin(angle) + z3 * Math.cos(angle);
        
        const pitch = 0.45;
        const finalY = y3 * Math.cos(pitch) - rotZ * Math.sin(pitch);
        const finalZ = y3 * Math.sin(pitch) + rotZ * Math.cos(pitch);
        
        const perspective = 400 / (400 + finalZ * scaleBase * 0.5);
        
        return {
           px: cx + rotX * scaleBase * perspective,
           py: cy - finalY * scaleBase * perspective,
           sz: perspective
        };
      };

      // Background grid lines (Y = -0.5)
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.12)';
      ctx.lineWidth = 1;
      
      for (let i = -0.5; i <= 0.5; i += 0.25) {
         const p1 = project(i, -0.5, -0.5);
         const p2 = project(i, -0.5, 0.5);
         ctx.beginPath();
         ctx.moveTo(p1.px, p1.py);
         ctx.lineTo(p2.px, p2.py);
         ctx.stroke();
         
         const p3 = project(-0.5, -0.5, i);
         const p4 = project(0.5, -0.5, i);
         ctx.beginPath();
         ctx.moveTo(p3.px, p3.py);
         ctx.lineTo(p4.px, p4.py);
         ctx.stroke();
      }

      const pointsData = dataset.map(item => {
         const vx = item.freqVoltage - 0.5;
         const vz = item.recencyAmp - 0.5;
         const vy = item.target - 0.5;
         const p = project(vx, vy, vz);
         return { ...item, vx, vy, vz, p };
      });

      pointsData.forEach(pt => {
         const baseP = project(pt.vx, -0.5, pt.vz);
         ctx.beginPath();
         ctx.moveTo(pt.p.px, pt.p.py);
         ctx.lineTo(baseP.px, baseP.py);
         ctx.strokeStyle = 'rgba(236, 72, 153, 0.12)';
         ctx.stroke();
      });

      const getPredY = (x3: number, z3: number) => {
         const realX = x3 + 0.5;
         const realZ = z3 + 0.5;
         const medianFeat = 0.5;
         const yVal = weights[0] * realX + weights[1] * realZ + weights[2] * medianFeat + weights[3] * medianFeat + bias;
         return yVal - 0.5; 
      };

      ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 0.5;
      
      for (let xi = -0.5; xi < 0.5; xi += 0.1) {
         for (let zi = -0.5; zi < 0.5; zi += 0.1) {
             const y1 = getPredY(xi, zi);
             const y2 = getPredY(xi+0.1, zi);
             const y3 = getPredY(xi+0.1, zi+0.1);
             const y4 = getPredY(xi, zi+0.1);
             
             const p1 = project(xi, y1, zi);
             const p2 = project(xi+0.1, y2, zi);
             const p3 = project(xi+0.1, y3, zi+0.1);
             const p4 = project(xi, y4, zi+0.1);

             ctx.beginPath();
             ctx.moveTo(p1.px, p1.py);
             ctx.lineTo(p2.px, p2.py);
             ctx.lineTo(p3.px, p3.py);
             ctx.lineTo(p4.px, p4.py);
             ctx.closePath();
             ctx.fill();
             ctx.stroke();
         }
      }

      pointsData.forEach(pt => {
         ctx.beginPath();
         ctx.arc(pt.p.px, pt.p.py, Math.max(0.7, 3.2 * pt.p.sz), 0, Math.PI * 2);
         ctx.fillStyle = pt.num === probeSelectedNum ? '#ec4899' : 'rgba(217, 70, 239, 0.65)';
         ctx.fill();
         
         if (pt.num === probeSelectedNum) {
            ctx.fillStyle = '#ec4899';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(`P${pt.num}`, pt.p.px + 5, pt.p.py - 5);
         }
      });
      
      animId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animId);
  }, [dataset, weights, bias, probeSelectedNum, activeTab]);

  // Probability Flows / Markov Transition Network Canvas Animator
  const canvasProbPathRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (activeTab !== 'markov') return;
    const canvas = canvasProbPathRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    // Electrons arrays along transition curves
    const particles: { targetIdx: number; dist: number; speed: number }[] = [];
    for (let i = 0; i < 18; i++) {
      particles.push({
        targetIdx: Math.floor(Math.random() * topTransitions.length),
        dist: Math.random(),
        speed: 0.007 + Math.random() * 0.012
      });
    }

    const render = () => {
      phase += 0.015;
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.35;

      // Draw background tactical radar grid rings
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
      ctx.lineWidth = 1;
      for (let r = R*0.3; r <= R*1.2; r += R*0.3) {
         ctx.beginPath();
         ctx.arc(cx, cy, r, 0, Math.PI * 2);
         ctx.stroke();
      }

      // Draw crosshairs
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.beginPath();
      ctx.moveTo(cx - R*1.3, cy);
      ctx.lineTo(cx + R*1.3, cy);
      ctx.moveTo(cx, cy - R*1.3);
      ctx.lineTo(cx, cy + R*1.3);
      ctx.stroke();

      // Outer nodes positions
      const nodesPos = topTransitions.map((t, idx) => {
        const theta = (idx * (Math.PI * 2) / topTransitions.length) + phase * 0.2;
        return {
          num: t.num,
          prob: t.probability,
          x: cx + Math.cos(theta) * R,
          y: cy + Math.sin(theta) * R,
          theta
        };
      });

      // Draw flowing transition arcs
      nodesPos.forEach(node => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        
        ctx.bezierCurveTo(
          cx + (node.x - cx) * 0.5 - Math.sin(node.theta) * 30,
          cy + (node.y - cy) * 0.5 + Math.cos(node.theta) * 30,
          cx + (node.x - cx) * 0.8,
          cy + (node.y - cy) * 0.8,
          node.x,
          node.y
        );

        // Gradient & width representing probability weight scale
        const grad = ctx.createLinearGradient(cx, cy, node.x, node.y);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.8)'); // Purple core
        grad.addColorStop(1, 'rgba(6, 182, 212, 0.8)');  // Cyan outer
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + (node.prob * 26);
        ctx.stroke();

        // Target Number Node Outline Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        // Node Label
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${node.num}`, node.x, node.y);

        // Probability tag
        const tagX = node.x + Math.cos(node.theta) * 24;
        const tagY = node.y + Math.sin(node.theta) * 24;
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(`P:${(node.prob * 100).toFixed(1)}%`, tagX, tagY);
      });

      // Animate flowing particle current packages
      particles.forEach(p => {
        p.dist += p.speed;
        if (p.dist > 1) {
          p.dist = 0;
          p.targetIdx = Math.floor(Math.random() * topTransitions.length);
        }

        const target = nodesPos[p.targetIdx];
        if (target) {
          // Linear interpolation + curved deflection
          const t = p.dist;
          const px = cx + (target.x - cx) * t - Math.sin(target.theta) * Math.sin(t * Math.PI) * 15;
          const py = cy + (target.y - cy) * t + Math.cos(target.theta) * Math.sin(t * Math.PI) * 15;

          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#22d3ee';
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      // Central selected sequence node
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Outer halo animation
      ctx.beginPath();
      ctx.arc(cx, cy, 26 + Math.abs(Math.sin(phase * 1.5)) * 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`#${probeSelectedNum}`, cx, cy - 2);

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 7px monospace';
      ctx.fillText(`SOURCE`, cx, cy + 9);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [topTransitions, probeSelectedNum, activeTab]);

  // Quantum SVD / Chebyshev state-space Visualizer
  const canvasQuantumRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTab !== 'quantum_tensor') return;
    const canvas = canvasQuantumRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.01;
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.42;

      // Draw background spectral constellation web (SVD Eigenvector connections)
      if (eigenvectors.length > 0 && singularValues.length > 0) {
        // Draw connection lines for nodes with strong eigenvector correlation
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)';
        ctx.lineWidth = 0.5;
        const v0 = eigenvectors[0];
        const v1 = eigenvectors[1] || v0;
        
        for (let i = 0; i < 49; i += 2) {
          const thetaI = (i * Math.PI * 2) / 49 + phase * 0.08;
          const ri = maxR * (0.4 + 0.5 * Math.abs(v0[i] || 0.1));
          const xi = cx + Math.cos(thetaI) * ri;
          const yi = cy + Math.sin(thetaI) * ri;

          for (let j = i + 1; j < 49; j += 3) {
            // Correlation strength
            const correlation = Math.abs(v0[i] * v0[j] + v1[i] * v1[j]);
            if (correlation > 0.005) {
              const thetaJ = (j * Math.PI * 2) / 49 + phase * 0.08;
              const rj = maxR * (0.4 + 0.5 * Math.abs(v0[j] || 0.1));
              const xj = cx + Math.cos(thetaJ) * rj;
              const yj = cy + Math.sin(thetaJ) * rj;

              ctx.beginPath();
              ctx.moveTo(xi, yi);
              ctx.lineTo(xj, yj);
              ctx.strokeStyle = `rgba(16, 185, 129, ${Math.min(0.2, correlation * 12)})`;
              ctx.lineWidth = 0.5 + correlation * 4;
              ctx.stroke();
            }
          }
        }
      }

      // Draw concentric orbital shells (Chebyshev nodes)
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
      ctx.lineWidth = 1;
      for (let s = 1; s <= chebyshevOrder; s++) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * (s / chebyshevOrder), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw active probe selection particle ripples
      const probeIndex = probeSelectedNum - 1;
      const thetaProbe = (probeIndex * Math.PI * 2) / 49 + phase * 0.08;
      const v0_p = eigenvectors[0] ? eigenvectors[0][probeIndex] : 0.1;
      const rProbe = maxR * (0.4 + 0.5 * Math.abs(v0_p));
      const xp = cx + Math.cos(thetaProbe) * rProbe;
      const yp = cy + Math.sin(thetaProbe) * rProbe;

      // Pulse ripple
      const rippleRadius = 15 + Math.abs(Math.sin(phase * 4)) * 12;
      ctx.beginPath();
      ctx.arc(xp, yp, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Render all 49 lottery numbers as quantum states loaded by SVD density
      for (let i = 0; i < 49; i++) {
        const num = i + 1;
        const theta = (i * Math.PI * 2) / 49 + phase * 0.08;
        
        // Scale distance from center based on first eigenvector component loading
        const eigVal0 = eigenvectors[0] ? eigenvectors[0][i] : Math.sin(i * 0.2);
        const r = maxR * (0.4 + 0.5 * Math.abs(eigVal0));
        
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;

        // Size scaled by SVD potential value
        const sPot = svdPotential[i] || 0.15;
        const nodeSize = 4 + sPot * 8;

        // Draw node dot
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);

        // Highlight selected node
        if (num === probeSelectedNum) {
          ctx.fillStyle = '#ec4899'; // Tesla Pink
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ec4899';
        } else if (activeProposedNumbers.includes(num)) {
          ctx.fillStyle = '#10b981'; // SVD Emerald
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#10b981';
        } else {
          ctx.fillStyle = `rgba(168, 85, 247, ${0.4 + sPot * 0.6})`; // Chebyshev Purple
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw outer ring around high density nodes
        if (sPot > 0.7) {
          ctx.beginPath();
          ctx.arc(x, y, nodeSize + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Draw index text for high-value nodes or if probed
        if (num === probeSelectedNum || sPot > 0.8 || num % 5 === 0) {
          ctx.fillStyle = num === probeSelectedNum ? '#ffffff' : '#94a3b8';
          ctx.font = num === probeSelectedNum ? 'bold 8px monospace' : '7px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${num}`, x, y);
        }
      }

      // Center singularity
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [eigenvectors, singularValues, svdPotential, chebyshevOrder, probeSelectedNum, activeTab, activeProposedNumbers]);

  // Chat/dialog helper
  const pushJarvisLog = (sender: 'jarvis' | 'user', text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setJarvisMessages(prev => [...prev, { sender, text, timestamp }]);
    setTimeout(() => {
      const consoleNode = document.getElementById('jarvis-terminal-inner');
      if (consoleNode) {
        consoleNode.scrollTop = consoleNode.scrollHeight;
      }
    }, 50);
  };

  // Pre-computed voice responses
  const runVoiceAction = (actionId: 'coefficients' | 'transitions' | 'hybrid') => {
    if (isJarvisAnswering) return;
    setIsJarvisAnswering(true);

    if (actionId === 'coefficients') {
      const resp = `Mainframe regression vectors analyzed. Porosity weight coefficient index zero is loaded at ${weights[0].toFixed(3)}. Recency amperage index one is at ${weights[1].toFixed(3)}. Total model bias is calibrated at ${bias.toFixed(3)}. Overall fit captures ${modelTrained ? "high-fidelity linear dynamics" : "initial randomized state parameters"}.`;
      pushJarvisLog('user', "Explain Multi-Linear Regression Coefficients");
      
      setTimeout(() => {
        pushJarvisLog('jarvis', resp);
        if (isTTSEnabled) playSpeech(resp);
        setIsJarvisAnswering(false);
      }, 500);

    } else if (actionId === 'transitions') {
      const bestT = topTransitions[0];
      const secondT = topTransitions[1];
      const resp = `Active resonance mapping for lottery node ${probeSelectedNum} completed. In historical sequences, node ${probeSelectedNum} has the highest transition likelihood flowing into node ${bestT ? bestT.num : "N/A"} at a rate of ${(bestT ? bestT.probability * 100 : 0).toFixed(1)} percent, followed by node ${secondT ? secondT.num : "N/A"} with ${(secondT ? secondT.probability * 100 : 0).toFixed(1)} percent.`;
      pushJarvisLog('user', `Retrieve Markov transitions for Node #${probeSelectedNum}`);
      
      setTimeout(() => {
        pushJarvisLog('jarvis', resp);
        if (isTTSEnabled) playSpeech(resp);
        setIsJarvisAnswering(false);
      }, 500);

    } else if (actionId === 'hybrid') {
      const mappedNumbers = hybridForecast.map(h => h.num);
      const resp = `Deploying synthesized Hybrid Multi-Linear Regression & Markov Probability sequence onto tactical dashboard. Calibration sequence confirmed: [${mappedNumbers.join(', ')}]. Quantum probability density synchronized.`;
      pushJarvisLog('user', "Calculate and synchronize consensus Hybrid Model sequence");
      
      setTimeout(() => {
        pushJarvisLog('jarvis', resp);
        if (isTTSEnabled) playSpeech(resp);
        
        onApplyNumbers(mappedNumbers);
        addToast(
          "HYBRID VECTOR DEPLOYED",
          `Joint ML + Markov consensus lottery sequence [${mappedNumbers.join(', ')}] synchronized.`,
          "success"
        );
        setIsJarvisAnswering(false);
      }, 500);
    }
  };

  // Custom User Input Query processor
  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQueryText.trim() || isJarvisAnswering) return;

    const query = userQueryText.trim();
    setUserQueryText('');
    pushJarvisLog('user', query);
    setIsJarvisAnswering(true);

    // Context-sensitive high-tech analytical responses from Jarvis simulated dynamically
    setTimeout(() => {
      let answer = "";
      const queryLower = query.toLowerCase();

      if (queryLower.includes('weight') || queryLower.includes('slope') || queryLower.includes('coefficient')) {
        answer = `Accessing Ridge regression coefficients, sir. Current weight matrix is configured as: w0 (Frequency) = ${weights[0].toFixed(3)}, w1 (Recency gap reciprocal) = ${weights[1].toFixed(3)}, w2 (Harmonic Nikolai Tesla root) = ${weights[2].toFixed(3)}, w3 (Archimedean spiral spiralZ) = ${weights[3].toFixed(3)}. Model bias index: ${bias.toFixed(3)}.`;
      } else if (queryLower.includes('probability') || queryLower.includes('markov') || queryLower.includes('next')) {
        const best = topTransitions[0];
        answer = `Evaluating lottery transition vector distributions for Selected Node ${probeSelectedNum}. The Markov state matrix yields the strongest sequential transition index flowing into Node ${best ? best.num : "N/A"} at a rate of ${(best ? best.probability * 100 : 0).toFixed(1)}% probability, followed closely by secondary vectors with negative entropy margins.`;
      } else if (queryLower.includes('sync') || queryLower.includes('apply') || queryLower.includes('predict')) {
        const numbers = hybridForecast.map(h => h.num);
        answer = `Consensus model synthesized, sir. By taking regression weights and combining them with previous historical transitions, the 6 optimized target keys are: [${numbers.join(', ')}]. Click 'SYNC CONDENSATE' in the predictions deck to override proposed vectors.`;
      } else if (queryLower.includes('clear')) {
        setJarvisMessages([{
          sender: 'jarvis',
          text: "Terminal log flushed. I am standing by for tactical commands, sir.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }]);
        setIsJarvisAnswering(false);
        return;
      } else {
        answer = `Mainframe analyzed query structural parameters. To predict high-probability sequences, I have combined a 4-Feature Ridge Regression plane with a First-Order Markov Transition probability chain. Current probe selected is Node #${probeSelectedNum} with calibrated potential of ${(activeProbeStats?.predictedPotential || 0).toFixed(4)} POT.`;
      }

      pushJarvisLog('jarvis', answer);
      if (isTTSEnabled) playSpeech(answer);
      setIsJarvisAnswering(false);
    }, 750);
  };

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-purple-500/15 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-purple-500/25 transition-all duration-500 relative overflow-hidden">
      
      {/* Stark Geometric HUD Overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(#a855f7_0.6px,transparent_0.6px)] [background-size:10px_10px] opacity-[0.04] pointer-events-none" />

      {/* Main Panel Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3 select-none">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-purple-400 uppercase">Multivariate Linear & Markov Probability Cockpit</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">Consolidated machine learning regression plane and transition path optimizer</p>
          </div>
        </div>

        {/* Tab Selection Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-900">
          <button
            onClick={() => setActiveTab('regression')}
            className={`px-3 py-1 text-[8.5px] font-mono rounded uppercase font-black tracking-widest transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'regression' 
                ? 'bg-purple-900/40 border border-purple-500/30 text-purple-300' 
                : 'text-slate-500 hover:text-slate-350 bg-transparent border border-transparent'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Regression Deck</span>
          </button>
          <button
            onClick={() => setActiveTab('markov')}
            className={`px-3 py-1 text-[8.5px] font-mono rounded uppercase font-black tracking-widest transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'markov' 
                ? 'bg-cyan-900/40 border border-cyan-500/30 text-cyan-300' 
                : 'text-slate-500 hover:text-slate-350 bg-transparent border border-transparent'
            }`}
          >
            <Network className="w-3 h-3" />
            <span>Markov Paths</span>
          </button>
          <button
            onClick={() => setActiveTab('quantum_tensor')}
            className={`px-3 py-1 text-[8.5px] font-mono rounded uppercase font-black tracking-widest transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quantum_tensor' 
                ? 'bg-emerald-900/40 border border-emerald-500/30 text-emerald-300' 
                : 'text-slate-500 hover:text-slate-350 bg-transparent border border-transparent'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Quantum Tensor</span>
          </button>
        </div>
      </header>

      {/* Primary Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Column 1: Live Multimeter Telemetry Probe */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between min-h-[350px] relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900/60 font-mono select-none text-[8.5px] text-slate-500">
            <span>MULTIMETER SCANNER MODULE</span>
            <span className={`${activeTab === 'regression' ? 'text-purple-400' : activeTab === 'markov' ? 'text-cyan-400' : 'text-emerald-400'} animate-pulse`}>
              {`NODE #${probeSelectedNum} SCAN`}
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-3 justify-center py-2">
            
            {/* Main digital readout panel */}
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

            {/* Simulated analogue gauges */}
            <div className="flex flex-col gap-2 font-mono text-[8px] select-none">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>ALPHA PROBE: DRAW FREQ (V)</span>
                  <span className="text-emerald-400">{activeProbeStats?.voltage}</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-950">
                  <div 
                    className="h-full bg-emerald-500 rounded transition duration-500" 
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
                    className="h-full bg-cyan-500 rounded transition duration-500" 
                    style={{ width: `${(activeProbeStats?.amperagePct || 0) * 100}%` }} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>TESLA PROBE: HARMONIC ROOT (Ω)</span>
                  <span className="text-amber-400">{activeProbeStats?.resistance}</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-950">
                  <div 
                    className="h-full bg-amber-500 rounded transition duration-500" 
                    style={{ width: `${(activeProbeStats?.resistancePct || 0) * 100}%` }} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-slate-400">
                  <span>ARCHIMEDEAN PROBE: SPIRAL DENSITY (Z)</span>
                  <span className="text-pink-400">{activeProbeStats?.impedance}</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-950">
                  <div 
                    className="h-full bg-pink-500 rounded transition duration-500" 
                    style={{ width: `${(activeProbeStats?.impedancePct || 0) * 100}%` }} 
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Connect Telemetry Probes node selector list */}
          <div className="flex flex-col gap-1.5 border-t border-slate-900/60 pt-2 select-none">
            <span className="text-[7.5px] font-mono text-slate-500 uppercase leading-none">CONNECT HORIZON PROBES</span>
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none-horizontal">
              {[3, 7, 11, 19, 23, 29, 37, 41, 47].map(num => (
                <button
                  key={num}
                  onClick={() => setProbeSelectedNum(num)}
                  className={`px-2 py-1 text-[8px] font-mono rounded font-black border transition shrink-0 cursor-pointer ${
                    probeSelectedNum === num
                      ? activeTab === 'regression'
                        ? "bg-purple-950/45 border-purple-500/40 text-purple-200"
                        : "bg-cyan-950/45 border-cyan-500/40 text-cyan-200"
                      : "bg-slate-900 border-slate-900 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  #{num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Regression Controls OR Markov Transitions Info OR Quantum Tensor controls */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between min-h-[350px] shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
          <AnimatePresence mode="wait">
            {activeTab === 'regression' ? (
              <motion.div 
                key="regression-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col justify-between h-full w-full"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-900/60 font-mono select-none text-[8.5px] text-slate-500">
                  <span>GRADIENT MSE LOSS HISTORY</span>
                  <span className="text-purple-400 animate-pulse">{isTraining ? "TUNING HYPERPLANE..." : "STANDBY"}</span>
                </div>

                {/* Training plots */}
                <div className="flex-1 h-[135px] min-h-[135px] flex items-center justify-center relative mt-3 mb-2">
                  {lossHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center select-none">
                      <Activity className="w-8 h-8 text-purple-850 animate-pulse mb-1" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                        MATRIX COHERENCE WAVEFORMS INACTIVE.<br />
                        BOOT THE TELEMETRY OPTIMIZER DEPLOYMENT.
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full text-[8.5px] font-mono text-slate-400">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lossHistory} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                          <XAxis dataKey="epoch" tick={{ fill: '#4b5563', fontSize: 7 }} />
                          <YAxis tick={{ fill: '#4b5563', fontSize: 7 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '8px' }}
                            labelStyle={{ color: '#a855f7' }}
                          />
                          <Legend iconSize={6} wrapperStyle={{ fontSize: '7px' }} />
                          <Line type="monotone" dataKey="trainLoss" name="Train MSE" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                          <Line type="monotone" dataKey="testLoss" name="Test MSE" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Weights & sliders indicators */}
                <div className="flex flex-col gap-2.5 bg-black/40 p-3 rounded-lg border border-slate-900 select-none font-mono text-[7.5px]">
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
                        <span>GRADIENT STEPS:</span>
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
              </motion.div>
            ) : activeTab === 'markov' ? (
              <motion.div 
                key="markov-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col justify-between h-full w-full"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-900/60 font-mono select-none text-[8.5px] text-slate-500">
                  <span>MARKOV DUAL SEQUENCE PATH STRENGTH</span>
                  <span className="text-cyan-400 font-extrabold uppercase animate-pulse">PROBABILITY INDEX LOCK</span>
                </div>

                <div className="flex-1 flex flex-col gap-2 justify-center py-3">
                  <span className="text-[7.5px] font-mono text-slate-500 uppercase leading-none">
                    Downstream probability paths from selected node #{probeSelectedNum}:
                  </span>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {topTransitions.map((item, idx) => (
                      <div 
                        key={item.num}
                        onClick={() => setProbeSelectedNum(item.num)}
                        className="bg-slate-950/90 border border-slate-900/80 p-2 rounded flex items-center justify-between font-mono cursor-pointer hover:border-cyan-500/20 transition hover:bg-slate-900/40 text-[9px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[7.5px] font-black text-slate-600">#{idx + 1}</span>
                          <span className="w-4 h-4 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-center text-[7.5px] font-extrabold flex items-center justify-center">
                            {item.num}
                          </span>
                        </div>
                        <span className="text-cyan-300 font-black">
                          {(item.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[7.5px] font-mono text-slate-600 uppercase leading-relaxed mt-2 p-2.5 bg-black/40 border border-slate-900/60 rounded">
                    <strong className="text-cyan-400">COMPLEX CASCADE ENTROPY:</strong> These weights reflect the historical transition rates. If node {probeSelectedNum} occurs in a draw, the numbers above represent the highest probability candidates for the next consecutive sequence.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="quantum-tensor-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col justify-between h-full w-full"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-900/60 font-mono select-none text-[8.5px] text-slate-500">
                  <span>QUANTUM TENSOR CO-OCCURRENCE SPECTRAL MATRIX</span>
                  <span className="text-emerald-400 font-extrabold uppercase animate-pulse">
                    {isTensorTraining ? "RESOLVING TENSOR..." : "LOCK COHERENT"}
                  </span>
                </div>

                {/* SVD singular values spectrum visualization bar chart */}
                <div className="flex-1 h-[135px] min-h-[135px] flex items-center justify-center relative mt-3 mb-2">
                  {tensorLossHistory.length === 0 ? (
                    <div className="w-full h-full flex flex-col justify-between p-1">
                      <div className="flex justify-between text-[7px] text-slate-500 font-mono select-none uppercase">
                        <span>SVD Singular Values Spectrum:</span>
                        <span>Rank {tensorRank} loading</span>
                      </div>
                      <div className="flex items-end justify-around gap-1.5 h-[95px] px-2 bg-black/40 border border-slate-900/40 rounded py-2">
                        {singularValues.map((val, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[6.5px] font-mono text-emerald-400">{(val * 10).toFixed(1)}</span>
                            <div 
                              className="w-full bg-gradient-to-t from-emerald-950 to-emerald-500 rounded-t transition-all duration-500 border-t border-emerald-400/30" 
                              style={{ height: `${Math.min(75, Math.max(10, val * 45)) || 10}px` }}
                            />
                            <span className="text-[6.5px] font-mono text-slate-600">λ_{idx+1}</span>
                          </div>
                        ))}
                        {singularValues.length === 0 && (
                          <span className="text-[7.5px] font-mono text-slate-600 uppercase tracking-widest text-center py-8">
                            COVARIANCE EIGEN-DECOMPOSITION PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full text-[8.5px] font-mono text-slate-400">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tensorLossHistory} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                          <XAxis dataKey="epoch" tick={{ fill: '#4b5563', fontSize: 7 }} />
                          <YAxis tick={{ fill: '#4b5563', fontSize: 7 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '8px' }}
                            labelStyle={{ color: '#10b981' }}
                          />
                          <Legend iconSize={6} wrapperStyle={{ fontSize: '7px' }} />
                          <Line type="monotone" dataKey="trainLoss" name="Tensor Train" stroke="#10b981" strokeWidth={1.5} dot={false} />
                          <Line type="monotone" dataKey="testLoss" name="Tensor Test" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Tensor & SVD sliders */}
                <div className="flex flex-col gap-2 bg-black/40 p-2.5 rounded-lg border border-slate-900 select-none font-mono text-[7px]">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-slate-400">
                        <span>CHEBYSHEV DEGREE (D):</span>
                        <span className="text-emerald-400">{chebyshevOrder}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={chebyshevOrder}
                        onChange={(e) => setChebyshevOrder(parseInt(e.target.value))}
                        disabled={isTensorTraining}
                        className="w-full h-1 bg-slate-800 rounded outline-none accent-emerald-500 cursor-pointer disabled:opacity-40"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-slate-400">
                        <span>SVD TENSOR RANK:</span>
                        <span className="text-emerald-400">{tensorRank}</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="8"
                        step="1"
                        value={tensorRank}
                        onChange={(e) => setTensorRank(parseInt(e.target.value))}
                        disabled={isTensorTraining}
                        className="w-full h-1 bg-slate-800 rounded outline-none accent-emerald-500 cursor-pointer disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-slate-400">
                        <span>ELASTIC ALPHA (α):</span>
                        <span className="text-emerald-400">{elasticNetAlpha.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={elasticNetAlpha}
                        onChange={(e) => setElasticNetAlpha(parseFloat(e.target.value))}
                        disabled={isTensorTraining}
                        className="w-full h-1 bg-slate-800 rounded outline-none accent-emerald-500 cursor-pointer disabled:opacity-40"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-slate-400">
                        <span>TENSOR EPOCHS:</span>
                        <span className="text-emerald-400">{tensorEpochs}</span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="1500"
                        step="100"
                        value={tensorEpochs}
                        onChange={(e) => setTensorEpochs(parseInt(e.target.value))}
                        disabled={isTensorTraining}
                        className="w-full h-1 bg-slate-800 rounded outline-none accent-emerald-500 cursor-pointer disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Column 3: Predictions Outputs and consensus Sync Deck */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          
          <div className="bg-slate-950/70 border border-slate-900/60 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[220px]">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center select-none border-b border-slate-900 pb-1.5 font-mono text-[8.5px] text-slate-500">
                <span>HYBRID CORE CONSENSUS DECK</span>
                <span className="text-[7px] font-mono text-cyan-400 font-bold uppercase tracking-wider animate-pulse">OPTIMIZED SPEC</span>
              </div>

              {/* Hybrid Prediction list (combines multi-linear + Markov) */}
              <div className="flex flex-col gap-1.5">
                {hybridForecast.map((item, idx) => {
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
                            isSelected ? "bg-cyan-550 border border-white/20 text-white" : "bg-slate-900 text-slate-350"
                          }`}
                        >
                          {item.num}
                        </div>
                        <span className="text-[7px] text-slate-500 uppercase">HYBRID INDEX</span>
                      </div>

                      <span className="text-cyan-300 font-extrabold text-[8.5px]">
                        {item.combined.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sync trigger button */}
            <div className="pt-2 border-t border-slate-900/60 mt-2 flex justify-between items-center gap-2 select-none">
              <span className="text-[7px] font-mono text-slate-500 uppercase leading-none">
                Deploy joint Ridge regression & Markov priority sequence.
              </span>
              <button
                onClick={() => {
                  const top6 = hybridForecast.map(h => h.num);
                  onApplyNumbers(top6);
                  addToast(
                    "HYBRID SEQUENCE INJECTED",
                    `Synthesized consensus ML + Probability sequence [${top6.join(', ')}] deployed.`,
                    "success"
                  );
                  if (isTTSEnabled) {
                    playSpeech("Consensus hybrid model sequence synchronized.");
                  }
                }}
                className="px-2 py-1 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-500/40 text-[8px] font-mono text-cyan-300 font-bold uppercase rounded cursor-pointer transition active:scale-95"
              >
                Sync Forecast
              </button>
            </div>
          </div>

          {/* Trigger training loop button */}
          {activeTab === 'quantum_tensor' ? (
            <button
              onClick={runTensorTraining}
              disabled={isTensorTraining}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-950 to-purple-950 hover:from-emerald-900 hover:to-purple-900 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-black tracking-widest uppercase transition-all duration-300 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-98"
            >
              <Zap className={`w-3.5 h-3.5 text-emerald-400 ${isTensorTraining ? 'animate-pulse' : ''}`} />
              <span>{isTensorTraining ? `SOLVING TENSOR: ${tensorTrainProgress}%` : "BOOT TENSOR RESOLVER"}</span>
            </button>
          ) : (
            <button
              onClick={runGradientDescentTraining}
              disabled={isTraining}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-950 to-cyan-950 hover:from-purple-900 hover:to-cyan-900 border border-purple-500/30 text-[10px] font-mono text-purple-300 font-black tracking-widest uppercase transition-all duration-300 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.1)] active:scale-98"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isTraining ? 'animate-spin' : ''}`} />
              <span>{isTraining ? `CALCULATING EPOCHS: ${trainProgress}%` : "BOOT NEURAL OPTIMIZER"}</span>
            </button>
          )}
          
        </div>

      </div>

      {/* Primary Visual Canvas Block */}
      <div className="mt-2 bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col relative shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center pb-2 border-b border-slate-900/60 font-mono select-none text-[8.5px] text-slate-500 z-10 relative">
           <div className="flex items-center gap-1.5">
             <Maximize2 className="w-3 h-3 text-cyan-400" />
             <span>
               {activeTab === 'regression' 
                 ? '3D MULTIPLE LINEAR REGRESSION HYPERPLANE' 
                 : activeTab === 'markov'
                   ? '2D MARKOV STATE TRANSITION FLOW PATHWAY'
                   : 'QUANTUM SPECTRAL DECOMPOSITION (SVD & CHEBYSHEV)'
               }
             </span>
           </div>
           <span>
             {activeTab === 'regression' 
               ? '[X: FREQ, Z: RECENCY GAP] -> RESIDUAL Y' 
               : activeTab === 'markov'
                 ? `FLOW CURRENTS FOR ACTIVE HORIZON NODE #${probeSelectedNum}`
                 : `49-STATE PROBABILITY DENSITY AND CONSTELLATION WEB`
             }
           </span>
        </div>
        
        <div className="w-full h-[260px] relative mt-2">
           <AnimatePresence mode="wait">
             {activeTab === 'regression' ? (
               <motion.div 
                 key="canvas-regression"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="w-full h-full relative"
               >
                 <canvas ref={canvas3DRef} className="w-full h-full block" />
                 <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none font-mono text-[7px] text-slate-500 uppercase">
                   <span>w0 Frequency: {weights[0].toFixed(3)}</span>
                   <span>w1 Recency: {weights[1].toFixed(3)}</span>
                   <span>b Intercept: {bias.toFixed(3)}</span>
                 </div>
               </motion.div>
             ) : activeTab === 'markov' ? (
               <motion.div 
                 key="canvas-markov"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="w-full h-full relative"
               >
                 <canvas ref={canvasProbPathRef} className="w-full h-full block" />
                 <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none font-mono text-[7px] text-slate-500 uppercase">
                   <span>State transition probability weights</span>
                   <span>Active core origin: node #{probeSelectedNum}</span>
                 </div>
               </motion.div>
             ) : (
               <motion.div 
                 key="canvas-quantum"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="w-full h-full relative"
               >
                 <canvas ref={canvasQuantumRef} className="w-full h-full block" />
                 <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none font-mono text-[7px] text-slate-500 uppercase">
                   <span>SVD Singularity Density Map</span>
                   <span>Orthogonal Chebyshev Degree: {chebyshevOrder}</span>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Advanced Jarvis 2-Way Speech-Interactive HUD Console */}
      <div className="mt-2 bg-slate-950 border border-purple-500/10 rounded-xl p-4 flex flex-col relative shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
        <header className="flex justify-between items-center pb-2 border-b border-slate-900/60 font-mono select-none text-[8.5px] text-slate-500 col-span-12 z-10">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold tracking-wider text-purple-400 uppercase">Jarvis Telemetry Assistant (VTC-649)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isJarvisAnswering ? 'bg-cyan-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="text-[7px]">ASSISTANT SHUNT ONLINE</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3">
          
          {/* Audio Wave Visualizer Simulation Column */}
          <div className="md:col-span-3 bg-black/60 border border-slate-900 rounded-lg p-3 flex flex-col items-center justify-center relative overflow-hidden select-none min-h-[140px]">
             <div className="absolute top-1.5 left-2 font-mono text-[6.5px] text-purple-500 font-extrabold uppercase tracking-widest flex items-center gap-1">
               <AudioLines className="w-2.5 h-2.5 text-purple-400" />
               <span>VOICE BRIDGE BRIDGE ACTIVE</span>
             </div>
             
             {/* Dynamic audio waves pulse styling */}
             <div className="flex items-end gap-1.5 h-16 pt-4">
               {[1,2,3,4,5,6,7,8].map(bar => (
                 <motion.div
                   key={bar}
                   animate={{
                     height: isJarvisAnswering 
                       ? [12, Math.random() * 45 + 15, 12] 
                       : isTraining 
                         ? [8, Math.random() * 20 + 8, 8] 
                         : [6, 12, 6]
                   }}
                   transition={{
                     duration: isJarvisAnswering ? 0.35 : 0.65,
                     repeat: Infinity,
                     delay: bar * 0.05
                   }}
                   className={`w-1 bg-gradient-to-t ${isJarvisAnswering ? 'from-cyan-600 to-white' : 'from-purple-600 to-pink-500'} rounded`}
                 />
               ))}
             </div>
             
             <span className="font-mono text-[7px] text-slate-500 uppercase mt-4 select-all text-center leading-tight">
               {isJarvisAnswering ? "JARVIS IS TRANSMITTING..." : isTraining ? "OPTIMIZING GRID PARAMETERS..." : "AWAITING TELEMETRY COMMANDS"}
             </span>
          </div>

          {/* Conversations Log Terminal */}
          <div className="md:col-span-9 flex flex-col gap-2">
            <div 
              id="jarvis-terminal-inner"
              className="h-28 bg-black/80 border border-slate-900 rounded-lg p-3 overflow-y-auto font-mono text-[9px] text-purple-300/80 leading-relaxed scrollbar-none"
            >
              <AnimatePresence mode="popLayout">
                {jarvisMessages.map((msg, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mb-2 ${msg.sender === 'user' ? 'text-cyan-300' : 'text-purple-300/70'}`}
                  >
                    <span className="text-[7.5px] text-slate-600 select-none">[{msg.timestamp}]</span>{' '}
                    <strong className="uppercase">{msg.sender === 'user' ? 'Operator' : 'Jarvis'}:</strong>{' '}
                    {msg.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Quick Stark Action dialog triggers */}
            <div className="flex flex-wrap gap-2 justify-start items-center p-0.5">
               <button
                 onClick={() => runVoiceAction('coefficients')}
                 disabled={isJarvisAnswering}
                 className="px-2 py-1 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-500/20 hover:border-purple-500/40 text-[7.5px] font-mono text-purple-400 font-extrabold uppercase rounded cursor-pointer transition disabled:opacity-40"
               >
                 [CALC COEFFICIENTS]
               </button>
               <button
                 onClick={() => runVoiceAction('transitions')}
                 disabled={isJarvisAnswering}
                 className="px-2 py-1 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/40 text-[7.5px] font-mono text-cyan-400 font-extrabold uppercase rounded cursor-pointer transition disabled:opacity-40"
               >
                 [NODE TRANSITIONS]
               </button>
               <button
                 onClick={() => runVoiceAction('hybrid')}
                 disabled={isJarvisAnswering}
                 className="px-2 py-1 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500/40 text-[7.5px] font-mono text-emerald-405 font-extrabold uppercase rounded cursor-pointer transition disabled:opacity-40"
               >
                 [SYNCHRONIZE HYBRID FORECAST]
               </button>
            </div>

            {/* Text Message query execution form */}
            <form onSubmit={handleQuerySubmit} className="flex gap-2">
              <input
                type="text"
                value={userQueryText}
                onChange={(e) => setUserQueryText(e.target.value)}
                placeholder="Ask Jarvis about linear weights, transition paths, or sync requests..."
                disabled={isJarvisAnswering}
                className="flex-1 bg-black/80 border border-slate-900 rounded-lg px-3 py-1.5 text-[9px] font-mono text-cyan-200 placeholder-slate-600 outline-none focus:border-cyan-500/40 transition disabled:opacity-45"
              />
              <button
                type="submit"
                disabled={isJarvisAnswering || !userQueryText.trim()}
                className="px-4 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 rounded-lg text-[9px] font-mono text-purple-200 uppercase font-bold tracking-wider cursor-pointer transition flex items-center gap-1.5 hover:scale-103 active:scale-97 disabled:opacity-40"
              >
                <Send className="w-3 h-3 text-purple-400" />
                <span>QUERY</span>
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}
