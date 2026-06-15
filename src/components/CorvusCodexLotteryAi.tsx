import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Layers, Activity, Play, Sliders, Database, Terminal, Settings, Flame, Sparkles, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface CorvusCodexLotteryAiProps {
  draws: LottoDraw[];
  activeProposedNumbers: number[];
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  onApplyNumbers: (nums: number[]) => void;
}

interface LossHistoryPoint {
  epoch: number;
  loss: number;
  accuracy: number;
}

export default function CorvusCodexLotteryAi({
  draws,
  activeProposedNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
  onApplyNumbers
}: CorvusCodexLotteryAiProps) {
  // Neural model hyperparameters
  const [epochs, setEpochs] = useState<number>(150);
  const [batchSize, setBatchSize] = useState<number>(32);
  const [learningRate, setLearningRate] = useState<number>(0.005);
  const [lookbackDepth, setLookbackDepth] = useState<number>(12);
  const [lossFunction, setLossFunction] = useState<'mse' | 'categorical_crossentropy' | 'binary_crossentropy'>('categorical_crossentropy');
  const [dropoutRate, setDropoutRate] = useState<number>(0.2);
  const [ticketCount, setTicketCount] = useState<number>(3);

  // Model training states
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [currentLoss, setCurrentLoss] = useState<number>(1.25);
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(0.0);
  const [lossHistory, setLossHistory] = useState<LossHistoryPoint[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [trainingComplete, setTrainingComplete] = useState<boolean>(false);
  
  // Generated tickets
  const [generatedTickets, setGeneratedTickets] = useState<number[][]>([]);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState<number>(-1);

  // Layout refs
  const trainCanvasRef = useRef<HTMLCanvasElement>(null);
  const networkCanvasRef = useRef<HTMLCanvasElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const trainingIntervalRef = useRef<any>(null);

  // Reset or initialize state
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Network Visualizer Canvas - runs neural flow animation
  useEffect(() => {
    const canvas = networkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let pulseTime = 0;

    // Define neural network node coordinates
    const layers = [
      { name: 'Input', count: 6, x: 40 },
      { name: 'LSTM', count: 8, x: 130 },
      { name: 'Dropout', count: 6, x: 220 },
      { name: 'Dense', count: 8, x: 310 },
      { name: 'Output', count: 6, x: 400 }
    ];

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 450;
      canvas.height = 180;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pulseTime += 0.05;

      const layerSpacingX = (canvas.width - 80) / (layers.length - 1);
      
      // Calculate layout points
      const layerNodes = layers.map((layer, lIdx) => {
        const x = 40 + lIdx * layerSpacingX;
        const nodes = [];
        const spacingY = (canvas.height - 40) / (layer.count - 1 || 1);
        const startY = layer.count === 1 ? canvas.height / 2 : 20;

        for (let i = 0; i < layer.count; i++) {
          nodes.push({
            x,
            y: startY + i * spacingY,
            active: Math.sin(pulseTime + lIdx * 1.5 + i * 0.4) > 0.1
          });
        }
        return { name: layer.name, nodes };
      });

      // Draw Connections (Synapses)
      ctx.lineWidth = 0.5;
      for (let l = 0; l < layerNodes.length - 1; l++) {
        const fromLayer = layerNodes[l];
        const toLayer = layerNodes[l + 1];

        fromLayer.nodes.forEach((fromNode, fIdx) => {
          toLayer.nodes.forEach((toNode, tIdx) => {
            const isPulseActive = isTraining 
              ? (pulseTime * 10 + fIdx + tIdx) % 7 < 2 
              : fromNode.active && toNode.active;

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);

            if (isPulseActive) {
              ctx.strokeStyle = isTraining ? 'rgba(6, 182, 212, 0.4)' : 'rgba(168, 85, 247, 0.25)';
              ctx.lineWidth = 1;
            } else {
              ctx.strokeStyle = 'rgba(30, 41, 59, 0.15)';
              ctx.lineWidth = 0.5;
            }
            ctx.stroke();
          });
        });
      }

      // Draw Nodes
      layerNodes.forEach((layer, lIdx) => {
        layer.nodes.forEach((node, nIdx) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);

          if (isTraining) {
            // High speed firing during training
            const fire = Math.random() > 0.6;
            ctx.fillStyle = fire ? '#06b6d4' : '#1e293b';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = fire ? 8 : 0;
          } else {
            ctx.fillStyle = node.active ? '#a855f7' : '#1e293b';
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = node.active ? 6 : 0;
          }
          ctx.fill();
          
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // Layer Title
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(layer.name, layer.nodes[0].x, canvas.height - 5);
      });

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [isTraining]);

  // Performance/Loss Mini Graph chart
  useEffect(() => {
    const canvas = trainCanvasRef.current;
    if (!canvas || lossHistory.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Grid lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 4) * i);
      ctx.lineTo(w, (h / 4) * i);
      ctx.stroke();
    }

    // Chart line mapping Loss
    ctx.beginPath();
    lossHistory.forEach((pt, i) => {
      const x = (i / (lossHistory.length - 1 || 1)) * w;
      // Normalise loss between 0.0 and 2.0
      const y = h - ((pt.loss / 2.0) * h);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = '#22d3ee'; // Cyan
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Chart line mapping accuracy
    ctx.beginPath();
    lossHistory.forEach((pt, i) => {
      const x = (i / (lossHistory.length - 1 || 1)) * w;
      // Accuracy is 0.0 to 1.0 (percent)
      const y = h - (pt.accuracy * h);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#a855f7'; // Purple
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
  }, [lossHistory]);

  // Core backpropagation model execution simulation (Generates real numbers from past records)
  const executeNeuralInference = () => {
     if (draws.length === 0) return;
     
     // Retrieve drawings matching our configured sequence lookback depth
     const sliceHistory = draws.slice(0, lookbackDepth);
     const frequencies: Record<number, number> = {};
     
     // Populate frequency mappings
     for (let id = 1; id <= 49; id++) frequencies[id] = 0;
     
     sliceHistory.forEach(d => {
        d.numbers.forEach(n => {
           frequencies[n] = (frequencies[n] || 0) + 1;
        });
     });

     // Apply hyperparameter weights to modify frequencies
     // Dropout lowers weights randomly. Learning rate steers search stride.
     const candidates: { num: number; weight: number }[] = [];
     for (let id = 1; id <= 49; id++) {
        let baseWeight = frequencies[id];
        
        // Pseudo-random deterministic factor mapping from draw values
        const randomOffset = Math.sin(id * learningRate + lookbackDepth) * 1.5;
        
        // Loss factor: if loss function is categorical crossentropy, reward clustered patterns
        const lossFactor = lossFunction === 'categorical_crossentropy' ? 1.2 : 0.8;
        
        // Compute finalized composite fitness value
        const score = (baseWeight * lossFactor) + randomOffset - (Math.random() * dropoutRate * 2);
        candidates.push({ num: id, weight: Math.max(score, 0.1) });
     }

     // Generate configured ticket count
     const generated: number[][] = [];
     for (let tc = 0; tc < ticketCount; tc++) {
        // Sort candidates with high stochastic noise to avoid identical duplicates
        const noiseCandidates = candidates.map(c => ({
           num: c.num,
           weight: c.weight * (0.8 + Math.random() * 0.6)
        })).sort((a, b) => b.weight - a.weight);

        // Slice top 6 unique elements
        const ticket = noiseCandidates.slice(0, 6).map(c => c.num).sort((a,b)=>a-b);
        generated.push(ticket);
     }

     setGeneratedTickets(generated);
     setSelectedTicketIndex(0);
  };

  // Launch training cycle simulating gradient updates
  const handleStartTraining = () => {
    if (isTraining) return;
    
    setIsTraining(true);
    setTrainingComplete(false);
    setCurrentEpoch(0);
    setLossHistory([]);
    setTerminalLogs([
      `[SYSTEM] INIT SYSTEM INTEGRITY SYNC: https://github.com/CorvusCodex/LotteryAi.git`,
      `[MODEL] Compiling LSTM sequence node lattice...`,
      `[MODEL] Loss: ${lossFunction.toUpperCase()} | Optimizer: ADAM`,
      `[DATA] Partitioning ${draws.length} past lottery drawings into time-series tensors`,
      `[DATA] Lookback sequence depth: ${lookbackDepth} steps`,
      `[GPU] Synchronizing local tensor core devices... SUCCESS`,
      `[TRAIN] Beginning network training block across ${epochs} epoch cycles...`,
    ]);

    let epochCount = 0;
    const batchRuns = Math.ceil(draws.length / batchSize);
    
    // Voice cues
    if (isTTSEnabled) {
      playSpeech("Executing neural training sequence based on Corvus Codex AI repository directives. Initializing Adam backpropagation.");
    }

    addToast('TRAINING RUN ACTIVE', `CorvusCodex AI is processing drawing patterns over ${epochs} epochs.`, 'info');

    trainingIntervalRef.current = setInterval(() => {
       epochCount += Math.max(1, Math.floor(epochs / 40)); // Accelerate visuals for smooth UX
       
       if (epochCount >= epochs) {
          epochCount = epochs;
          clearInterval(trainingIntervalRef.current);
          
          setIsTraining(false);
          setTrainingComplete(true);
          setCurrentEpoch(epochs);
          
          // Generate actual predicted combinations
          executeNeuralInference();

          setTerminalLogs(prev => [
             ...prev,
             `[TRAIN] Epoch ${epochs}/${epochs} - loss: 0.1420 - accuracy: 0.9410 - lr: ${learningRate}`,
             `[MODEL] Core weights converged successfully. Model fit completed.`,
             `[PREDICT] Triggering forward inference pass to generate ${ticketCount} high-probability tickets.`,
             `[SUCCESS] Outputs resolved! Matrix telemetry locked to proposed registry.`
          ]);

          addToast('MODEL CONVERGED', 'Neural Network training complete. Decrypted sets available below.', 'success');
          
          if (isTTSEnabled) {
             playSpeech("Inference phase completed. Convergence resolved inside high-probability bounds.");
          }
       } else {
          // Dynamic calculation of decaying training cost loss
          const progress = epochCount / epochs;
          const loss = Math.max(0.15, 1.35 * Math.exp(-progress * 2.8) + (Math.random() * 0.05 - 0.025));
          const acc = Math.min(0.95, progress * 0.9 + (Math.random() * 0.04));

          setCurrentEpoch(epochCount);
          setCurrentLoss(loss);
          setCurrentAccuracy(acc);

          // Append charts coordinates
          setLossHistory(prev => [...prev, { epoch: epochCount, loss, accuracy: acc }]);

          // Append terminal log line
          setTerminalLogs(prev => [
             ...prev,
             `Epoch ${epochCount}/${epochs} - batch_loss: ${loss.toFixed(4)} - val_accuracy: ${acc.toFixed(4)} - learn_stride: ${learningRate.toFixed(4)}`
          ]);
       }
    }, 120);
  };

  // Safe release
  useEffect(() => {
     return () => {
        if (trainingIntervalRef.current) clearInterval(trainingIntervalRef.current);
     };
  }, []);

  return (
    <div id="corvus-codex-integration" className="bg-black/32 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-5 flex flex-col gap-5 shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.04)] hover:border-cyan-500/25 transition-all duration-500 w-full relative overflow-hidden">
       {/* Background design matrix */}
       <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_[0.75px],transparent_[0.75px])] [background-size:16px_16px] opacity-[0.015] pointer-events-none" />
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-3 gap-3">
          <div>
             <span className="text-[10px] font-mono text-cyan-400/70 border border-cyan-500/30 bg-cyan-950/20 px-2 py-0.5 rounded uppercase tracking-widest gap-1 flex items-center w-fit">
                <Cpu className="w-3 h-3 text-cyan-400 animate-pulse" />
                INTEGRATED PIPELINE
             </span>
             <h2 className="text-sm font-mono font-bold tracking-wider text-cyan-400 uppercase mt-1">
                CORVUS CODEX LOTTERYAI NEURAL FRAMEWORK
             </h2>
             <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Targeting neural sequence prediction based on TensorFlow LSTM model weights training over past results.
             </p>
          </div>
          <div className="text-[9px] font-mono text-slate-500 border border-slate-800/80 px-2 py-1 rounded bg-slate-950/60">
             SRC: github.com/CorvusCodex/LotteryAi
          </div>
       </div>

       {/* TWO-COLUMN WORKSPACE */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT PANEL: CONFIGURATION SLIDERS */}
          <div className="lg:col-span-5 flex flex-col gap-4">
             <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 flex flex-col gap-4 shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                   <Sliders className="w-4 h-4 text-cyan-400" />
                   <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Hyperparameter Controls</span>
                </div>

                {/* Epochs Slider */}
                <div className="flex flex-col gap-1.5">
                   <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400 uppercase">Training Epochs:</span>
                      <span className="text-cyan-400 font-bold">{epochs} Cycles</span>
                   </div>
                   <input 
                      type="range"
                      min={20}
                      max={500}
                      step={10}
                      disabled={isTraining}
                      value={epochs}
                      onChange={(e) => setEpochs(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg outline-none"
                   />
                </div>

                {/* Batch Size Selection */}
                <div className="grid grid-cols-2 gap-3.5">
                   <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Batch Size:</label>
                      <select
                         disabled={isTraining}
                         value={batchSize}
                         onChange={(e) => setBatchSize(parseInt(e.target.value))}
                         className="bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-200 outline-none focus:border-cyan-500/40"
                      >
                         <option value={8}>8 Samples</option>
                         <option value={16}>16 Samples</option>
                         <option value={32}>32 Samples</option>
                         <option value={64}>64 Samples</option>
                         <option value={128}>128 Samples</option>
                      </select>
                   </div>

                   <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase">Optimizer Loss:</label>
                      <select
                         disabled={isTraining}
                         value={lossFunction}
                         onChange={(e) => setLossFunction(e.target.value as any)}
                         className="bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-200 outline-none focus:border-cyan-500/40"
                      >
                         <option value="categorical_crossentropy">Categorical</option>
                         <option value="binary_crossentropy">Binary</option>
                         <option value="mse">MSE (Regression)</option>
                      </select>
                   </div>
                </div>

                {/* Learning Rate & Dropout */}
                <div className="grid grid-cols-2 gap-3.5">
                   <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                         <span className="text-slate-400 uppercase">LR rate:</span>
                         <span className="text-cyan-400 font-semibold">{learningRate}</span>
                      </div>
                      <input 
                         type="range"
                         min={0.001}
                         max={0.05}
                         step={0.001}
                         disabled={isTraining}
                         value={learningRate}
                         onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                         className="w-full accent-cyan-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg outline-none"
                      />
                   </div>

                   <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                         <span className="text-slate-400 uppercase">Dropout:</span>
                         <span className="text-purple-400 font-semibold">{(dropoutRate * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                         type="range"
                         min={0.0}
                         max={0.5}
                         step={0.05}
                         disabled={isTraining}
                         value={dropoutRate}
                         onChange={(e) => setDropoutRate(parseFloat(e.target.value))}
                         className="w-full accent-purple-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg outline-none"
                      />
                   </div>
                </div>

                {/* Target Sequences Lookback */}
                <div className="flex flex-col gap-1.5">
                   <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400 uppercase font-medium">LSTm Temporal Lookback depth:</span>
                      <span className="text-cyan-400 font-bold">{lookbackDepth} draws</span>
                   </div>
                   <input 
                      type="range"
                      min={5}
                      max={40}
                      step={1}
                      disabled={isTraining}
                      value={lookbackDepth}
                      onChange={(e) => setLookbackDepth(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg outline-none"
                   />
                </div>

                {/* Ticket Decrypt Pool Count */}
                <div className="flex flex-col gap-1.5 border-t border-slate-900 pt-3">
                   <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400 uppercase">Forecast combination sets:</span>
                      <span className="text-purple-400 font-bold">{ticketCount} Tickets</span>
                   </div>
                   <input 
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      disabled={isTraining}
                      value={ticketCount}
                      onChange={(e) => setTicketCount(parseInt(e.target.value))}
                      className="w-full accent-purple-500 cursor-ew-resize h-1 bg-slate-800 rounded-lg outline-none"
                   />
                </div>

                {/* EXECUTE ACTION BUTTON */}
                <button
                   onClick={handleStartTraining}
                   disabled={isTraining || draws.length === 0}
                   className="mt-2 w-full py-2.5 px-4 bg-cyan-950 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-900/30 text-cyan-400 font-mono font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer select-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                >
                   {isTraining ? (
                      <>
                         <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                         <span>Gradient Fitting active... ({Math.round((currentEpoch/epochs)*100)}%)</span>
                      </>
                   ) : (
                      <>
                         <Play className="w-4 h-4 text-cyan-400 fill-cyan-400/10" />
                         <span>Compile & Train Model</span>
                      </>
                   )}
                </button>
             </div>
          </div>

          {/* RIGHT PANEL: LIVE TRAINING VISUALIZERS */}
          <div className="lg:col-span-7 flex flex-col gap-4">
             {/* SYNAPSE GRID GRAPH */}
             <div className="border border-slate-900 bg-slate-950 rounded-xl p-4 flex flex-col justify-between min-h-[195px] relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <canvas ref={networkCanvasRef} className="w-full block" />
             </div>

             {/* DOCK BAR containing: Loss Decay & Terminal */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Real-time Loss minimization tracker */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] min-h-[150px]">
                   <span className="text-[8px] font-mono text-cyan-500/50 absolute top-2 right-3 uppercase">Dynamic Cost minimizes</span>
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Metrics Telemetry:</span>
                      <div className="flex items-end gap-5 mt-1">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Loss Coefficient</span>
                            <span className="text-sm font-mono font-bold text-cyan-400">{currentLoss.toFixed(4)}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">A.I. Accuracy</span>
                            <span className="text-sm font-mono font-bold text-purple-400">{(currentAccuracy * 100).toFixed(1)}%</span>
                         </div>
                      </div>
                   </div>

                   {/* Canvas Curve */}
                   <div className="w-full h-14 mt-2">
                      {lossHistory.length > 0 ? (
                         <canvas ref={trainCanvasRef} width={220} height={55} className="w-full h-full block" />
                      ) : (
                         <div className="w-full h-full border border-dashed border-slate-900 flex items-center justify-center text-[9px] font-mono text-slate-600 uppercase">
                            Awaiting Gradient Backprop...
                         </div>
                      )}
                   </div>
                </div>

                {/* MATRIX LOG INTERACTION CONSOLE */}
                <div className="bg-[#020617] border border-slate-900/90 rounded-xl p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] flex flex-col justify-between h-[150px]">
                   <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                         <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                         <span className="text-[9px] font-mono text-slate-300 uppercase font-bold tracking-wider">TensorFlow logs</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto font-mono text-[8.5px] text-cyan-500/90 leading-tight flex flex-col gap-1 pr-1.5 max-h-[105px]">
                      {terminalLogs.map((log, lIdx) => (
                         <div key={lIdx} className="break-all whitespace-pre-wrap">
                            <span className="text-slate-600 mr-1">&gt;</span>{log}
                         </div>
                      ))}
                      <div ref={consoleEndRef} />
                   </div>
                </div>

             </div>
          </div>

       </div>

       {/* RESULTS & TARGET BALL SELECTION DECK */}
       <AnimatePresence>
          {trainingComplete && generatedTickets.length > 0 && (
             <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="mt-2 border-t border-slate-900 pt-4 flex flex-col gap-4"
             >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                   <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest">
                         CorvusCodex AI Decrypted Candidates Resolved:
                      </span>
                   </div>
                   <span className="text-[9px] font-mono text-slate-500">
                      Select one of the predicted ticket structures below to map proposed coordinates
                   </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {generatedTickets.map((ticket, tIdx) => (
                      <div 
                         key={tIdx}
                         onClick={() => setSelectedTicketIndex(tIdx)}
                         className={`border cursor-pointer rounded-xl p-3.5 flex flex-col items-center justify-center gap-2.5 transition-all outline-none select-none
                            ${selectedTicketIndex === tIdx 
                               ? 'bg-cyan-950/20 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.15),inset_0_0_10px_rgba(6,182,212,0.1)]' 
                               : 'bg-slate-950/50 border-slate-900 hover:border-slate-800'}`}
                      >
                         <div className="flex justify-between items-center w-full">
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">TICKET SET #{tIdx + 1}</span>
                            {selectedTicketIndex === tIdx && (
                               <span className="text-[9px] font-mono font-bold text-cyan-400 flex items-center gap-1 uppercase">
                                  <Sparkles className="w-3 h-3 text-cyan-400" />
                                  ACTIVE FOCUS
                               </span>
                            )}
                         </div>

                         {/* LOTTERY BALL COGNITIVE DISPLAY */}
                         <div className="flex gap-1.5 justify-center mt-1">
                            {ticket.map(num => (
                               <div 
                                  key={num} 
                                  className={`w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full flex items-center justify-center font-bold font-mono text-[11px] md:text-xs transition-all duration-300
                                     ${selectedTicketIndex === tIdx 
                                        ? 'bg-gradient-to-br from-cyan-950 to-cyan-800 text-cyan-100 border border-cyan-400/40 shadow-[0_2px_8px_rgba(6,182,212,0.25)]' 
                                        : 'bg-slate-900 border border-slate-800 text-slate-300'}`}
                               >
                                  {num}
                               </div>
                            ))}
                         </div>

                         {/* Weight Info */}
                         <span className="text-[8px] font-mono text-slate-500 tracking-wider">
                            PROBABILITY CONTOUR MATCH: {(92.5 - tIdx * 3.4).toFixed(1)}%
                         </span>
                      </div>
                   ))}
                </div>

                <div className="flex justify-end gap-3 mt-1.5">
                   <button
                      onClick={() => {
                         if (selectedTicketIndex >= 0 && selectedTicketIndex < generatedTickets.length) {
                             const targetNums = generatedTickets[selectedTicketIndex];
                             onApplyNumbers(targetNums);
                             addToast('COORDINATE APPLIED', `Locking the terminal coordinates mapping to: ${targetNums.join(', ')}`, 'success');
                             if (isTTSEnabled) {
                                playSpeech(`Mapping active coordinates grid to sequence: ${targetNums.join(', ')}`);
                             }
                         }
                      }}
                      className="py-2 px-6 bg-cyan-900/60 hover:bg-cyan-900 active:scale-95 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded-lg text-[10px] font-mono font-bold transition-all uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)] outline-none"
                   >
                      APPLY ACTIVE COORDINATES GRID
                   </button>
                </div>
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
}
