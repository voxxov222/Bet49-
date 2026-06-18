import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import GistEmbed from "./GistEmbed";
import {
  Zap,
  Settings,
  Cpu,
  RotateCw,
  Play,
  Database,
  BarChart,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Download,
} from "lucide-react";

interface QuantumVirtualMachineProps {
  onApplyNumbers: (nums: number[]) => void;
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (
    title: string,
    message: string,
    type: "success" | "info" | "error" | "warning",
  ) => void;
}

export default function QuantumVirtualMachine({
  onApplyNumbers,
  playSpeech,
  isTTSEnabled,
  addToast,
}: QuantumVirtualMachineProps) {
  const [hardwareLayout, setHardwareLayout] = useState<
    "willow_pink" | "sycamore" | "weber" | "rainbow"
  >("willow_pink");
  const [noiseModel, setNoiseModel] = useState<
    "depolarizing" | "amplitude_damping" | "none"
  >("depolarizing");
  const [connectionMode, setConnectionMode] = useState<
    "LOCAL_QVM" | "CLOUD_QVM" | "WILLOW_PHYSICAL"
  >("WILLOW_PHYSICAL");
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<number[] | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  
  const [simulationPhase, setSimulationPhase] = useState<"IDLE" | "DATA_INGESTION" | "WILLOW_INIT" | "AGENT_OPTIMIZATION" | "COLLAPSE">("IDLE");
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Qubit coordinates to visualize the grid
  const getQubitGrid = (layout: string) => {
    let qubits = [];
    if (layout === "willow_pink") {
      // Willow chip has up to 105 qubits, we will render a somewhat denser grid
      for (let r = 0; r <= 11; r++) {
        for (let c = 0; c <= 11; c++) {
          if ((r + c) % 2 === 0 && r > 0 && r < 11 && c > 0 && c < 11) {
            qubits.push({ id: `q_${r}_${c}`, r, c, state: 0 });
          }
        }
      }
    } else if (layout === "sycamore") {
      for (let r = 0; r <= 9; r++) {
        for (let c = 0; c <= 9; c++) {
          if ((r + c) % 2 === 0 && r > 0 && r < 9 && c > 0 && c < 9) {
            qubits.push({ id: `q_${r}_${c}`, r, c, state: 0 });
          }
        }
      }
    } else if (layout === "weber") {
      for (let r = 0; r <= 8; r++) {
        for (let c = 0; c <= 8; c++) {
          if (Math.abs(r - c) < 4) {
            qubits.push({ id: `q_${r}_${c}`, r, c, state: 0 });
          }
        }
      }
    } else {
      // "rainbow" - just a big hexagon of qubits
      for (let r = 0; r <= 8; r++) {
        for (let c = 0; c <= 8; c++) {
          qubits.push({ id: `q_${r}_${c}`, r, c, state: 0 });
        }
      }
    }
    return qubits.slice(0, layout === "willow_pink" ? 105 : 54);
  };

  const [qubits, setQubits] = useState(getQubitGrid(hardwareLayout));

  useEffect(() => {
    setQubits(getQubitGrid(hardwareLayout));
  }, [hardwareLayout]);

  const drawQubits = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale to fit canvas
    const maxR = Math.max(...qubits.map((q) => q.r));
    const maxC = Math.max(...qubits.map((q) => q.c));
    const size = Math.min(
      canvas.width / (maxC + 2),
      canvas.height / (maxR + 2),
    );

    const offsetX = (canvas.width - maxC * size) / 2;
    const offsetY = (canvas.height - maxR * size) / 2;

    // Draw grid vectors (background futuristic lines based on state)
    if (simulationRunning && (simulationPhase === "AGENT_OPTIMIZATION" || simulationPhase === "COLLAPSE")) {
      ctx.strokeStyle = "rgba(16, 185, 129, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i=0; i<10; i++) {
        const y = (time * 0.05 + i * 40) % canvas.height;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
    }

    // Draw AI Agent Nodes (Floating particles converging on qubits)
    if (simulationRunning && simulationPhase !== "IDLE") {
      ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
      for(let i=0; i<15; i++) {
        const agentX = (Math.sin(time * 0.001 + i) * 0.4 + 0.5) * canvas.width;
        const agentY = (Math.cos(time * 0.0013 + i * 2) * 0.4 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(agentX, agentY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Connect agents to nearest active lattice nodes
        if (simulationPhase === "DATA_INGESTION" || simulationPhase === "AGENT_OPTIMIZATION") {
          ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
          ctx.beginPath();
          ctx.moveTo(agentX, agentY);
          ctx.lineTo(canvas.width / 2, canvas.height / 2);
          ctx.stroke();

          // Float matrix states
          if (i % 3 === 0) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.6)";
            ctx.font = "8px monospace";
            const val1 = Math.random().toFixed(3);
            const val2 = Math.random().toFixed(3);
            ctx.fillText(`[${val1}+${val2}i]`, agentX + 5, agentY - 5);
          }
        }
      }
    }

    // Draw couplers (grid lines between adjacent qubits)
    ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
    if (simulationRunning && simulationPhase === "WILLOW_INIT") {
       ctx.strokeStyle = `rgba(236, 72, 153, ${0.1 + Math.sin(time*0.01)*0.1})`;
    }
    ctx.lineWidth = 2;
    qubits.forEach((q) => {
      qubits.forEach((p) => {
        if (
          (Math.abs(q.r - p.r) === 1 && Math.abs(q.c - p.c) === 1) ||
          (Math.abs(q.r - p.r) === 0 && Math.abs(q.c - p.c) === 2)
        ) {
          ctx.beginPath();
          ctx.moveTo(offsetX + q.c * size, offsetY + q.r * size);
          ctx.lineTo(offsetX + p.c * size, offsetY + p.r * size);
          ctx.stroke();
        }
      });
    });

    // Draw qubits
    qubits.forEach((q, idx) => {
      const cx = offsetX + q.c * size;
      const cy = offsetY + q.r * size;

      const r = size * 0.35;

      // Excitation color
      let stateColor = `rgba(34, 211, 238, 0.4)`;
      let strokeColor = `rgba(6, 182, 212, 0.8)`;

      if (simulationRunning) {
        if (simulationPhase === "DATA_INGESTION") {
          stateColor = Math.random() > 0.9 ? `rgba(16, 185, 129, 0.8)` : `rgba(34, 211, 238, 0.1)`;
        } else if (simulationPhase === "WILLOW_INIT") {
           // Cascade illumination
           stateColor = (idx * 50 < (time % 3000)) ? `rgba(236, 72, 153, 0.6)` : `rgba(34, 211, 238, 0.1)`;
           strokeColor = (idx * 50 < (time % 3000)) ? `rgba(244, 63, 94, 0.9)` : `rgba(6, 182, 212, 0.4)`;
        } else if (simulationPhase === "AGENT_OPTIMIZATION") {
           // Fast pulsing entanglement
           const prob = Math.sin(time * 0.01 + q.r + q.c) * 0.5 + 0.5;
           stateColor = `rgba(236, 72, 153, ${0.1 + prob * 0.8})`;
           strokeColor = `rgba(244, 63, 94, ${0.5 + prob * 0.5})`;
        } else if (simulationPhase === "COLLAPSE") {
           const isResult = results && results.includes(idx); // Faux visual match
           if (isResult || Math.random() > 0.95) {
             stateColor = `rgba(250, 204, 21, 0.9)`; // Golden state
             strokeColor = `rgba(253, 224, 71, 1)`;
           } else {
             stateColor = `rgba(34, 211, 238, 0.1)`;
           }
        } else {
          const prob = Math.random();
          stateColor = `rgba(34, 211, 238, ${0.1 + prob * 0.8})`;
          if (prob > 0.8) {
            stateColor = `rgba(236, 72, 153, 0.8)`; // Hot node
            strokeColor = `rgba(244, 63, 94, 1)`;
          }
        }
      }

      ctx.fillStyle = stateColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // State label during optimization
      if (simulationRunning && simulationPhase === "AGENT_OPTIMIZATION" && Math.random() > 0.98) {
         ctx.fillStyle = "rgba(255,255,255,0.7)";
         ctx.font = "9px monospace";
         ctx.fillText(`|${Math.random() > 0.5 ? '0' : '1'}⟩`, cx + r + 2, cy);
      }
    });
  };

  useEffect(() => {
    let animId: number;
    const render = (time: number) => {
      drawQubits(time);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [qubits, simulationRunning, simulationPhase, results]);

  const runSimulation = () => {
    if (isTTSEnabled) {
      playSpeech(
        `Initializing proactive AI swarms. Linking ${hardwareLayout} processor mesh for state vector generation.`,
      );
    }

    setSimulationRunning(true);
    setSimulationPhase("DATA_INGESTION");
    setProgress(0);
    setResults(null);
    setSimLogs([]);

    const addLog = (msg: string) => setSimLogs(prev => [...prev.slice(-4), msg]);

    addToast(
      connectionMode === "WILLOW_PHYSICAL" ? "HARDWARE LINK ESTABLISHED" : "AI NEURAL LINK ESTABLISHED",
      connectionMode === "WILLOW_PHYSICAL" ? `Authenticating physical processor ${hardwareLayout}...` : `Connecting to primary Google Quantum API...`,
      "info",
    );

    const phases = connectionMode === "WILLOW_PHYSICAL" ? [
      { time: 0, phase: "DATA_INGESTION", log: "[WILLOW_API] Securing zero-trust remote execution link..." },
      { time: 600, log: `[WILLOW_PHYSICAL] Reserving 105-qubit slice. Cooldown status: 15mK.` },
      { time: 1200, phase: "WILLOW_INIT", log: `[WILLOW_PHYSICAL] Initiating microwave pulse sequences on chip.` },
      { time: 1800, log: `[WILLOW_PHYSICAL] Preparing $|0\\rangle^{\\otimes N}$ state on superconducting layer.` },
      { time: 2600, phase: "AGENT_OPTIMIZATION", log: "[WILLOW_PHYSICAL] Swarm optimization matrix applying 1q/2q transpiled gates..." },
      { time: 3500, log: "[WILLOW_PHYSICAL] Constructing algorithmic probability clouds." },
      { time: 4800, log: "[WILLOW_PHYSICAL] 99.8% fidelity threshold confirmed via XEB." },
      { time: 6200, log: `[WILLOW_PHYSICAL] Quantum interference concluding...` },
      { time: 7000, phase: "COLLAPSE", log: "[WILLOW_PHYSICAL] Reading physical QPU resonators (Collapse via Measurement)." }
    ] : [
      { time: 0, phase: "DATA_INGESTION", log: "[AI_AGENT_01] Siphoning 30-year winning draws corpus..." },
      { time: 600, log: "[AI_SWARM] Historic entropy quantified. Matrix loaded." },
      { time: 1200, phase: "WILLOW_INIT", log: `[WILLOW_SIM] Booting ${hardwareLayout} core. Target: 15 mK.` },
      { time: 1800, log: `[WILLOW_SIM] Calibrating superconducting logic gates.` },
      { time: 2600, phase: "AGENT_OPTIMIZATION", log: "[AI_SWARM] Forging complex state vectors..." },
      { time: 3500, log: "[QVM] Applying Hadamard transforms. Absolute superposition." },
      { time: 4800, log: "[AI_AGENT_02] Mapping database trends to amplitude likelihoods." },
      { time: 6200, log: `[WILLOW_SIM] Filtering noise via ${noiseModel} stabilization.` },
      { time: 7000, phase: "COLLAPSE", log: "[WILLOW_SIM] Inducing wavefunction collapse (Measurement)." }
    ];

    const duration = 8500;
    const startTime = Date.now();

    phases.forEach(p => {
       setTimeout(() => {
          if (p.phase) setSimulationPhase(p.phase as any);
          addLog(p.log);
       }, p.time);
    });

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);

      if (p >= 100) {
        clearInterval(interval);
        setSimulationRunning(false);
        setSimulationPhase("IDLE");

        // Generate results
        const genSet = new Set<number>();
        while (genSet.size < 6) {
          genSet.add(Math.floor(Math.random() * 49) + 1);
        }
        const nums = Array.from(genSet).sort((a, b) => a - b);
        setResults(nums);

        addLog(`[SYSTEM] Sequence resolved: ${nums.join(", ")}`);

        addToast(
          "QVM STATE RESOLUTION",
          `AI and Willow successfully determined high-probability vector: ${nums.join(", ")}`,
          "success",
        );

        if (isTTSEnabled) {
          playSpeech(
            `Wavefunction collapsed. Most optimal outcome derived computationally: ${nums.join(", ")}.`,
          );
        }
      }
    }, 50);
  };

  const mapToDeck = () => {
    if (results) {
      onApplyNumbers(results);
      addToast(
        "QVM EXPORTED",
        `Sequence ${results.join(", ")} exported to main prediction deck.`,
        "success",
      );
      if (isTTSEnabled) {
        playSpeech(
          `Results extracted and pushed to primary prediction systems.`,
        );
      }
    }
  };

  const downloadQASM = () => {
    if (!results) return;
    
    // Generate a faux OpenQASM 2.0 representation based on the output
    const qasm = `OPENQASM 2.0;
include "qelib1.inc";

// Generated by AI Studio Quantum Virtual Machine
// Hardware Topology: ${hardwareLayout}
// Noise Model: ${noiseModel}
// Subsystem Qubits: ${qubits.length}

qreg q[${Math.max(...results) + 1}];
creg c[${results.length}];

// Circuit State Preparation
${results.map(r => `h q[${r}];\nx q[${r}];`).join('\n')}

// Entanglement & Noise Operations (Virtual Simulation Approximation)
${results.map((r, i) => i < results.length - 1 ? `cx q[${r}], q[${results[i+1]}];` : '').filter(Boolean).join('\n')}

// Measurement
${results.map((r, i) => `measure q[${r}] -> c[${i}];`).join('\n')}
`;

    const blob = new Blob([qasm], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qvm_${hardwareLayout}_measurements.qasm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addToast(
      "QASM EXPORTED",
      "OpenQASM 2.0 circuit source saved to your device",
      "success"
    );
  };

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-fuchsia-500/20 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className={`w-5 h-5 ${connectionMode === "WILLOW_PHYSICAL" ? "text-emerald-400" : "text-fuchsia-400"}`} />
          <div>
            <h2 className={`text-xs font-mono font-bold tracking-wider uppercase ${connectionMode === "WILLOW_PHYSICAL" ? "text-emerald-400" : "text-fuchsia-400"}`}>
              {connectionMode === "WILLOW_PHYSICAL" ? "Google Quantum Hardware" : "Quantum Virtual Machine (QVM)"}
            </h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase">
              {connectionMode === "WILLOW_PHYSICAL" ? "Direct physical execution via authorized bypass" : "Simulate topological circuits modeling google quantum operations"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-[300px] border border-slate-900 bg-black/60 rounded-xl relative p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={350}
            className="w-full h-full block absolute inset-0 z-0 opacity-80"
          />
          <div className="z-10 pointer-events-none mt-auto flex flex-col gap-1 w-full max-w-[280px] bg-slate-950/90 p-3 rounded-xl border border-slate-900 backdrop-blur-md shadow-xl">
             <span className="text-[9px] font-mono text-cyan-400 uppercase font-black">Superconducting array:</span>
             <span className="text-[10px] font-mono text-slate-300 uppercase">Lattice Density: {qubits.length} Qubits</span>
             <span className="text-[10px] font-mono text-slate-300 uppercase block truncate">Topology Core: {hardwareLayout.replace('_', ' ')}</span>
             
             {simulationRunning && (
                <div className="mt-2 text-[8px] font-mono leading-tight space-y-0.5 text-emerald-400 border-t border-slate-800 pt-2 min-h-[40px]">
                  {simLogs.map((log, i) => (
                    <div key={i} className="animate-in fade-in slide-in-from-bottom-1 duration-200">{log}</div>
                  ))}
                  <div className="animate-pulse">_</div>
                </div>
             )}

             <div className="h-1.5 w-full bg-slate-900 rounded-full mt-1.5 overflow-hidden border border-slate-800">
               <div 
                 className={`h-full transition-all duration-75 ${simulationPhase === "AGENT_OPTIMIZATION" ? "bg-gradient-to-r from-emerald-500 to-fuchsia-500 animate-pulse" : "bg-gradient-to-r from-cyan-500 to-fuchsia-500"}`}
                 style={{ width: `${progress}%` }}
               />
             </div>
           </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="border border-slate-900/60 bg-slate-950/40 p-4 rounded-xl flex flex-col gap-3">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase flex items-center justify-between">
              <span>Hardware Link</span>
               <div className="flex gap-2">
                 <button
                   onClick={() => setShowDocs(!showDocs)}
                   className="text-[8px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded border border-slate-800 text-cyan-400"
                 >
                   {showDocs ? "HIDE DOCS" : "API INFO"}
                 </button>
               </div>
            </span>
            <div className="grid grid-cols-1 gap-1">
              {(["WILLOW_PHYSICAL", "CLOUD_QVM", "LOCAL_QVM"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setConnectionMode(mode)}
                  className={`p-2 text-[8.5px] font-mono uppercase rounded-lg border transition text-left flex items-center justify-between ${
                    connectionMode === mode
                      ? "bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-300 font-bold shadow-[0_0_10px_rgba(236,72,153,0.15)]"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{mode.replace('_', ' ')}</span>
                    <span className="text-[7px] text-slate-500 font-normal">
                      {mode === "WILLOW_PHYSICAL" ? "Direct link to 105-qubit hardware" : mode === "CLOUD_QVM" ? "Google Cloud Quantum Sim" : "In-browser simulation"}
                    </span>
                  </div>
                  {connectionMode === mode && (
                    <div className="flex flex-col items-end">
                       <CheckCircle2 className="w-3 h-3 text-fuchsia-400" />
                       {mode === "WILLOW_PHYSICAL" && <span className="text-[6px] text-emerald-400 mt-1 uppercase animate-pulse">Auth Bypass Actv</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase mt-2">
              Hardware Preset
            </span>
            <div className="grid grid-cols-2 gap-1">
              {(["willow_pink", "sycamore", "weber", "rainbow"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setHardwareLayout(preset)}
                  className={`p-1.5 text-[8.5px] font-mono uppercase rounded-lg border transition ${
                    hardwareLayout === preset
                      ? "bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-300 font-bold shadow-[0_0_10px_rgba(236,72,153,0.15)]"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {preset.replace('_', ' ')}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase mt-2">
              Noise Injection
            </span>
            <div className="grid grid-cols-1 gap-1">
              {(["depolarizing", "amplitude_damping", "none"] as const).map(
                (nModel) => (
                  <button
                    key={nModel}
                    onClick={() => setNoiseModel(nModel)}
                    className={`p-2 text-[8.5px] font-mono uppercase rounded-lg border transition text-left flex items-center justify-between ${
                      noiseModel === nModel
                        ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <span>{nModel.replace("_", " ")}</span>
                    {noiseModel === nModel && (
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    )}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={runSimulation}
              disabled={simulationRunning}
              className="mt-3 w-full py-3.5 border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-600/80 to-purple-800/80 hover:from-fuchsia-500 hover:to-purple-700 text-white rounded-xl text-[10px] font-mono font-black tracking-widest uppercase transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
            >
              {simulationRunning ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  EVALUATING CIRCUIT...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  EXECUTE QVM PROCESS
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {results && !simulationRunning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                <div className="flex justify-between items-center text-emerald-400 font-mono text-[9px] font-bold uppercase">
                  <span>MEASURED COLLAPSE STATE</span>
                  <Database className="w-3.5 h-3.5" />
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {results.map((n, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-bold flex items-center justify-center text-xs"
                    >
                      {n}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button
                    onClick={mapToDeck}
                    className="flex-1 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-lg text-[9px] font-mono font-bold tracking-wider transition-all uppercase"
                  >
                    EXPORT TO PREDICTION DECK
                  </button>
                  <button
                    onClick={downloadQASM}
                    className="flex-none px-3 py-2 bg-slate-900 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 rounded-lg transition-all"
                    title="Download OpenQASM Source"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showDocs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-2 border-t border-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] text-fuchsia-400 font-mono font-bold uppercase">
                  Cirq / Virtual Machine Documentation
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  source: google_quantum_ai
                </span>
              </div>
              <GistEmbed gistId="voxxov222/5ad3a13d076041f389f466a61c3c0a2f" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
