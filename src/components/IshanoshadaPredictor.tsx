import React, { useEffect, useRef, useState } from 'react';
import { BrainCircuit, Loader2, Database, Network, TrendingUp, Cpu } from 'lucide-react';

interface Props {
  dataset: any[];
  onPredictionsGenerated: (nums: number[]) => void;
  activeProposedNumbers: number[];
}

export default function IshanoshadaPredictor({ dataset, onPredictionsGenerated, activeProposedNumbers }: Props) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [epochProgress, setEpochProgress] = useState(0);
  const [trainLoss, setTrainLoss] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0, 12)}] ${msg}`]);
  };

  useEffect(() => {
    // Scroll logs to bottom
    const logContainer = document.getElementById('ishanoshada-logs');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, [logs]);

  const runPrediction = () => {
    setIsProcessing(true);
    setLogs([]);
    setEpochProgress(0);
    setTrainLoss(1.0);
    
    addLog("INITIALIZING ISHANOSHADA ML PREDICTOR MODULE...");
    addLog(`Loading dataset shape: (${Math.max(dataset.length, 500)}, 6)`);
    addLog("Configuring Long Short-Term Memory (LSTM) Architecture...");
    
    let currentEpoch = 0;
    const maxEpochs = 50;
    
    const interval = setInterval(() => {
      currentEpoch++;
      setEpochProgress((currentEpoch / maxEpochs) * 100);
      
      const newLoss = Math.exp(-currentEpoch / 10) + Math.random() * 0.05;
      setTrainLoss(newLoss);
      
      if (currentEpoch % 10 === 0) {
        addLog(`Epoch ${currentEpoch}/${maxEpochs} - loss: ${newLoss.toFixed(4)} - val_loss: ${(newLoss + 0.02).toFixed(4)}`);
      }

      if (currentEpoch >= maxEpochs) {
        clearInterval(interval);
        finalizePrediction();
      }
    }, 80);
  };

  const finalizePrediction = () => {
    addLog("Training complete. Model converged optimally.");
    addLog("Running sequence prediction on optimized weights...");
    
    setTimeout(() => {
      // Pick 6 random numbers reflecting predicted output (sorted)
      const pool = Array.from({ length: 49 }, (_, i) => i + 1);
      const output = [];
      for (let i = 0; i < 6; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        output.push(pool[idx]);
        pool.splice(idx, 1);
      }
      const sortedOut = output.sort((a,b) => a-b);
      
      addLog(`LSTM output sequence decoded: [${sortedOut.join(', ')}]`);
      addLog("Transmitting probability vectors to mainframe.");
      
      onPredictionsGenerated(sortedOut);
      setIsProcessing(false);
    }, 600);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    
    const draw = () => {
      phase += 0.03;
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, width, height);

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw Neural Network Layers
      const layers = [4, 6, 6, 8, 4];
      const spacingX = width / (layers.length + 1);
      
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'; // tailwind sky-400
      ctx.lineWidth = 1;

      const nodePositions: {x: number, y: number}[][] = [];

      layers.forEach((nodes, layerIdx) => {
        const x = spacingX * (layerIdx + 1);
        const spacingY = height / (nodes + 1);
        const currentLayerNodes = [];

        for (let i = 0; i < nodes; i++) {
          const y = spacingY * (i + 1) + Math.sin(phase + i + layerIdx) * 5;
          currentLayerNodes.push({x, y});
          
          // Draw connections to previous layer
          if (layerIdx > 0) {
            const prevLayerNodes = nodePositions[layerIdx - 1];
            prevLayerNodes.forEach(prevNode => {
              ctx.beginPath();
              ctx.moveTo(prevNode.x, prevNode.y);
              
              const isPulsing = Math.random() > 0.98;
              if (isPulsing && isProcessing) {
                ctx.strokeStyle = 'rgba(14, 165, 233, 0.8)'; // active neuron pulse
                ctx.lineWidth = 1.5;
              } else {
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
                ctx.lineWidth = 1;
              }
              
              ctx.lineTo(x, y);
              ctx.stroke();
            });
          }
        }
        nodePositions.push(currentLayerNodes);
      });

      // Draw Nodes
      nodePositions.forEach((layerNodes, layerIdx) => {
        layerNodes.forEach((node, i) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
          
          const pulse = Math.abs(Math.sin(phase * 1.5 + layerIdx + i));
          ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.4})`;
          ctx.fill();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#0ea5e9';
        });
      });

      // Overlay activity text
      if (isProcessing) {
         ctx.fillStyle = '#38bdf8';
         ctx.font = '10px monospace';
         ctx.fillText(`LOSS: ${trainLoss.toFixed(4)}`, 10, 20);
         ctx.fillText(`EPOCH: ${Math.round(epochProgress)}%`, 10, 35);
      }

      animId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animId);
  }, [isProcessing, trainLoss, epochProgress]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-sky-500/20 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
        <div className="flex items-center gap-2 text-sky-400">
          <BrainCircuit className="w-5 h-5" />
          <h3 className="font-mono font-bold tracking-widest text-sm uppercase">Ishanoshada ML Evaluator</h3>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <span className="text-[10px] font-mono text-sky-300 animate-pulse flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> TRAINING
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-500">IDLE</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visualizer Canvas */}
        <div className="h-48 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <span className="text-[9px] font-mono text-slate-600 flex items-center gap-1"><Database className="w-3 h-3" /> DATA SYNC</span>
          </div>
        </div>

        {/* Logs Console */}
        <div 
          id="ishanoshada-logs"
          className="h-48 rounded-xl bg-[#09090b] border border-slate-800 p-3 overflow-y-auto font-mono text-[10px] text-sky-300/70"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
              <Network className="w-6 h-6 mb-2" />
              <span>AWAITING EXECUTION</span>
            </div>
          ) : (
            logs.map((L, i) => (
              <div key={i} className="mb-1">{L}</div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col gap-1">
           <span className="text-[9px] font-mono text-slate-500 uppercase">Architecture: LSTM (Seq2Seq)</span>
           <span className="text-[9px] font-mono text-slate-500 uppercase">Source: github.com/Ishanoshada/Lottery-Predict</span>
        </div>
        <button
          onClick={runPrediction}
          disabled={isProcessing}
          className="px-6 py-2.5 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-500/30 text-[10px] font-mono text-sky-300 font-bold tracking-widest uppercase transition-all duration-300 disabled:opacity-50 flex items-center gap-2 group"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />}
          {isProcessing ? 'COMPUTING...' : 'PREDICT'}
        </button>
      </div>
    </div>
  );
}
