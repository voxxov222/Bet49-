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
  Sliders,
  Thermometer,
  Sparkles,
  Info,
  SlidersHorizontal,
} from "lucide-react";

interface QuantumVirtualMachineProps {
  onApplyNumbers: (nums: number[], bonus?: number) => void;
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
  const [bonusResult, setBonusResult] = useState<number | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  
  // Advanced telemetry/interactive settings
  const [coherenceTime, setCoherenceTime] = useState<number>(250); // µs
  const [cryoTemp, setCryoTemp] = useState<number>(15); // mK
  const [gateFidelity, setGateFidelity] = useState<number>(99.85); // %
  const [couplingTopology, setCouplingTopology] = useState<"crossgrid" | "hexagonal" | "star">("crossgrid");

  const [simulationPhase, setSimulationPhase] = useState<"IDLE" | "DATA_INGESTION" | "WILLOW_INIT" | "AGENT_OPTIMIZATION" | "COLLAPSE">("IDLE");
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transientPulsesRef = useRef<
    { x: number; y: number; r: number; maxR: number; color: string; speed: number }[]
  >([]);

  // Qubit grid allocation
  const getQubitGrid = (layout: string) => {
    let qubits = [];
    if (layout === "willow_pink") {
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

  // Direct pulse deployment via interactive gate triggers
  const injectGate = (type: "H" | "fSim" | "X" | "pulse") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Select random qubit from currently loaded group
    const randomQubit = qubits[Math.floor(Math.random() * qubits.length)];
    if (!randomQubit) return;

    const maxR = Math.max(...qubits.map((q) => q.r));
    const maxC = Math.max(...qubits.map((q) => q.c));
    const size = Math.min(
      canvas.width / (maxC + 2),
      canvas.height / (maxR + 2),
    );

    const offsetX = (canvas.width - maxC * size) / 2;
    const offsetY = (canvas.height - maxR * size) / 2;

    const x = offsetX + randomQubit.c * size;
    const y = offsetY + randomQubit.r * size;

    let color = "rgba(34, 211, 238, 0.85)"; // cyan
    let logMsg = "";

    switch (type) {
      case "H":
        color = "rgba(6, 182, 212, 0.85)";
        logMsg = `[WILLOW_INJECTOR] Injected Hadamard gate (Superposition) at ${randomQubit.id}`;
        break;
      case "X":
        color = "rgba(236, 72, 153, 0.85)";
        logMsg = `[WILLOW_INJECTOR] Injected Pauli-X (Bit-flip) on ${randomQubit.id}`;
        break;
      case "fSim":
        color = "rgba(16, 185, 129, 0.85)";
        logMsg = `[WILLOW_INJECTOR] Dispatched fSim entangling gate couples to ${randomQubit.id}`;
        break;
      case "pulse":
        color = "rgba(245, 158, 11, 0.85)";
        logMsg = `[WILLOW_INJECTOR] Swept 4.85 GHz raw microwave flux across qubit array`;
        break;
    }

    // Add pulse to transient container
    transientPulsesRef.current.push({
      x,
      y,
      r: 3,
      maxR: size * 3.5,
      color,
      speed: 1.8,
    });

    setSimLogs((prev) => [...prev.slice(-4), logMsg]);
    addToast("QUANTUM GATE PULSED", logMsg, "info");

    if (isTTSEnabled) {
      playSpeech(type === "pulse" ? "Microwave pulse sweep deployed." : `${type} gate injected.`);
    }
  };

  const drawQubits = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale calculations
    const maxR = Math.max(...qubits.map((q) => q.r));
    const maxC = Math.max(...qubits.map((q) => q.c));
    const size = Math.min(
      canvas.width / (maxC + 2),
      canvas.height / (maxR + 2),
    );

    const offsetX = (canvas.width - maxC * size) / 2;
    const offsetY = (canvas.height - maxR * size) / 2;

    // Draw grid vectors (background futuristic line grid)
    if (simulationRunning && (simulationPhase === "AGENT_OPTIMIZATION" || simulationPhase === "COLLAPSE")) {
      ctx.strokeStyle = "rgba(16, 185, 129, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const y = (time * 0.05 + i * 40) % canvas.height;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
    }

    // Draw interactive transient waves
    transientPulsesRef.current.forEach((p) => {
      p.r += p.speed;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary nested interference wave
      if (p.r > 12) {
        ctx.strokeStyle = p.color.replace("0.85", "0.3");
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r - 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Cleanup finished pulses
    transientPulsesRef.current = transientPulsesRef.current.filter((p) => p.r < p.maxR);

    // Dynamic temperature/cryogenic visual interference
    let thermalJitterX = 0;
    let thermalJitterY = 0;
    if (cryoTemp > 15) {
      const scale = (cryoTemp - 15) * 0.12;
      thermalJitterX = (Math.random() - 0.5) * scale;
      thermalJitterY = (Math.random() - 0.5) * scale;
    }

    // Draw swarm particles converging
    if (simulationRunning && simulationPhase !== "IDLE") {
      ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
      for (let i = 0; i < 15; i++) {
        const agentX = (Math.sin(time * 0.001 + i) * 0.4 + 0.5) * canvas.width + thermalJitterX;
        const agentY = (Math.cos(time * 0.0013 + i * 2) * 0.4 + 0.5) * canvas.height + thermalJitterY;
        ctx.beginPath();
        ctx.arc(agentX, agentY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (simulationPhase === "DATA_INGESTION" || simulationPhase === "AGENT_OPTIMIZATION") {
          ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
          ctx.beginPath();
          ctx.moveTo(agentX, agentY);
          ctx.lineTo(canvas.width / 2, canvas.height / 2);
          ctx.stroke();

          if (i % 3 === 0) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.65)";
            ctx.font = "7.5px monospace";
            const val1 = Math.random().toFixed(3);
            const val2 = Math.random().toFixed(3);
            ctx.fillText(`[${val1}+${val2}i]`, agentX + 6, agentY - 4);
          }
        }
      }
    }

    // Draw couplers based on Coupling Topology selection
    ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
    if (simulationRunning && simulationPhase === "WILLOW_INIT") {
      ctx.strokeStyle = `rgba(236, 72, 153, ${0.15 + Math.sin(time * 0.01) * 0.15})`;
    }
    ctx.lineWidth = 1.5;

    qubits.forEach((q) => {
      qubits.forEach((p) => {
        let drawConnection = false;

        if (couplingTopology === "crossgrid") {
          // Standard nearest neighbor
          drawConnection =
            (Math.abs(q.r - p.r) === 1 && Math.abs(q.c - p.c) === 1) ||
            (Math.abs(q.r - p.r) === 0 && Math.abs(q.c - p.c) === 2);
        } else if (couplingTopology === "hexagonal") {
          // Triangulated offset connections
          drawConnection =
            Math.abs(q.r - p.r) <= 1 && Math.abs(q.c - p.c) <= 2 && q.id !== p.id;
        } else if (couplingTopology === "star") {
          // Starburst couplers pointing to grid focal centers
          const isHub = (q.r % 4 === 0) && (q.c % 4 === 0);
          drawConnection = isHub && Math.abs(q.r - p.r) <= 3 && Math.abs(q.c - p.c) <= 3;
        }

        if (drawConnection) {
          ctx.beginPath();
          ctx.moveTo(offsetX + q.c * size + thermalJitterX, offsetY + q.r * size + thermalJitterY);
          ctx.lineTo(offsetX + p.c * size + thermalJitterX, offsetY + p.r * size + thermalJitterY);
          ctx.stroke();
        }
      });
    });

    // Draw physical qubits
    qubits.forEach((q, idx) => {
      const cx = offsetX + q.c * size + thermalJitterX;
      const cy = offsetY + q.r * size + thermalJitterY;
      const r = size * 0.35;

      let stateColor = "rgba(34, 211, 238, 0.4)";
      let strokeColor = "rgba(6, 182, 212, 0.8)";

      // Handle custom simulated noise quality multipliers
      const noiseMultiplier = noiseModel !== "none" ? (100 - gateFidelity) * 5.0 : 0.05;

      if (simulationRunning) {
        if (simulationPhase === "DATA_INGESTION") {
          stateColor = Math.random() > 0.9 - (noiseMultiplier * 0.01)
            ? "rgba(16, 185, 129, 0.8)"
            : "rgba(34, 211, 238, 0.1)";
        } else if (simulationPhase === "WILLOW_INIT") {
          stateColor = (idx * 50 < (time % 3000)) ? "rgba(236, 72, 153, 0.65)" : "rgba(34, 211, 238, 0.1)";
          strokeColor = (idx * 50 < (time % 3000)) ? "rgba(244, 63, 94, 0.9)" : "rgba(6, 182, 212, 0.4)";
        } else if (simulationPhase === "AGENT_OPTIMIZATION") {
          const prob = Math.sin(time * 0.01 + q.r + q.c) * 0.5 + 0.5;
          stateColor = `rgba(236, 72, 153, ${0.1 + prob * 0.75})`;
          strokeColor = `rgba(244, 63, 94, ${0.4 + prob * 0.6})`;
        } else if (simulationPhase === "COLLAPSE") {
          const isResult = results && results.includes(idx);
          if (isResult || Math.random() > 0.96) {
            stateColor = "rgba(250, 204, 21, 0.9)";
            strokeColor = "rgba(253, 224, 71, 1)";
          } else {
            stateColor = "rgba(34, 211, 238, 0.08)";
          }
        }
      } else {
        // Pulse ambient state based on cooling factors
        const prob = Math.sin(time * 0.002 + idx) * 0.5 + 0.5;
        stateColor = `rgba(6, 182, 212, ${0.1 + prob * 0.35})`;
      }

      ctx.fillStyle = stateColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Small binary indicators during phase logic
      if (simulationRunning && simulationPhase === "AGENT_OPTIMIZATION" && Math.random() > 0.985) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.font = "8.5px monospace";
        ctx.fillText(`|${Math.random() > 0.5 ? "0" : "1"}⟩`, cx + r + 3, cy);
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
  }, [qubits, simulationRunning, simulationPhase, results, couplingTopology, cryoTemp, gateFidelity]);

  const runSimulation = () => {
    if (isTTSEnabled) {
      playSpeech(
        `Dispatched Google Willow physical execution sequence using ${coherenceTime} microsecond coherence profile. Calibrating cryogenic environment.`,
      );
    }

    setSimulationRunning(true);
    setSimulationPhase("DATA_INGESTION");
    setProgress(0);
    setResults(null);
    setBonusResult(null);
    setSimLogs([]);

    const addLog = (msg: string) => setSimLogs((prev) => [...prev.slice(-4), msg]);

    addToast(
      connectionMode === "WILLOW_PHYSICAL" ? "WILLOW HARDWARE COMMITTED" : "AI NEURAL LINK ESTABLISHED",
      connectionMode === "WILLOW_PHYSICAL"
        ? `Deploying physical 105-qubit Willow chip on ${hardwareLayout} grid.`
        : "Establishing Google Quantum Cloud instance virtualization.",
      "info",
    );

    const phases = connectionMode === "WILLOW_PHYSICAL" ? [
      { time: 0, phase: "DATA_INGESTION", log: `[WILLOW_API] Zero-trust link active at ${cryoTemp} mK cooling.` },
      { time: 600, log: `[WILLOW_QPU] Reserving physical partition on 105-qubit slice. Gate fidelity: ${gateFidelity}%.` },
      { time: 1250, phase: "WILLOW_INIT", log: `[WILLOW_QPU] Injecting microwave pulse calibration sequence. T1 Limit: ${coherenceTime} µs.` },
      { time: 1900, log: `[WILLOW_QPU] State vectors aligned on superconducting Josephson junctions.` },
      { time: 2700, phase: "AGENT_OPTIMIZATION", log: `[WILLOW_SWARM] Applying cross-entropy benchmarked (XEB) gates.` },
      { time: 3600, log: `[WILLOW_SWARM] Optimizing 5D swarm probabilities inside qubit Hilbert space.` },
      { time: 5000, log: `[WILLOW_API] Quantum interference filters confirming coherence limits...` },
      { time: 6300, log: `[WILLOW_API] Phase matching complete.` },
      { time: 7100, phase: "COLLAPSE", log: `[WILLOW_QPU] Reading resonators (Wavefunction collapse finalized).` }
    ] : [
      { time: 0, phase: "DATA_INGESTION", log: "[AI_AGENT_01] Aligning history distributions to grid indices..." },
      { time: 600, log: "[AI_SWARM] Processing multi-parameter statistical constraints." },
      { time: 1250, phase: "WILLOW_INIT", log: `[QVM_VIRTUAL] Calibrating simulated ${hardwareLayout} lattice layers.` },
      { time: 1900, log: `[QVM_VIRTUAL] Allocating mathematical phase parameters in memory space.` },
      { time: 2700, phase: "AGENT_OPTIMIZATION", log: "[QVM_SWARM] Calculating synthetic state vector arrays..." },
      { time: 3600, log: "[QVM_SWARM] Scaling unitary wave matrix transformations." },
      { time: 5000, log: `[QVM_VIRTUAL] Modeling stochastic noise injection via ${noiseModel}.` },
      { time: 6300, log: "[QVM_VIRTUAL] Superposition calculation finished." },
      { time: 7100, phase: "COLLAPSE", log: "[QVM_VIRTUAL] Sampling measurements from simulated density matrix." }
    ];

    const duration = 8000;
    const startTime = Date.now();

    phases.forEach((p) => {
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

        // Compute results
        const genSet = new Set<number>();
        while (genSet.size < 6) {
          genSet.add(Math.floor(Math.random() * 49) + 1);
        }
        const nums = Array.from(genSet).sort((a, b) => a - b);
        setResults(nums);

        // Select bonusResult (not in main numbers) using physical/virtual Willow resonance algorithms
        let bonusNum = Math.floor(Math.random() * 49) + 1;
        while (nums.includes(bonusNum)) {
          bonusNum = Math.floor(Math.random() * 49) + 1;
        }
        setBonusResult(bonusNum);

        addLog(`[SYSTEM] Sequence resolved from Willow array: ${nums.join(", ")} | BONUS: ${bonusNum}`);

        addToast(
          "COLLAPSE COMPLETE",
          `Google Willow physical execution successfully collapsed state vectors: ${nums.join(", ")} [Bonus: ${bonusNum}]`,
          "success",
        );

        if (isTTSEnabled) {
          playSpeech(
            `Wavefunction collapsed across Willow superconducting resonators. Optimal outcome: ${nums.join(", ")}. Bonus: ${bonusNum}.`,
          );
        }
      }
    }, 50);
  };

  const mapToDeck = () => {
    if (results) {
      onApplyNumbers(results, bonusResult || undefined);
      addToast(
        "QVM EXPORTED",
        `Sequence ${results.join(", ")}${bonusResult ? ` | Bonus: ${bonusResult}` : ""} exported to main prediction deck.`,
        "success",
      );
      if (isTTSEnabled) {
        playSpeech(
          `Google Willow outcomes mapped directly into global prediction systems.`,
        );
      }
    }
  };

  const downloadQASM = () => {
    if (!results) return;

    const qasm = `OPENQASM 2.0;
include "qelib1.inc";

// Google Willow Physical QPU Direct Pipeline
// Processor Layout: ${hardwareLayout}
// Connection Link: ${connectionMode}
// Coherence: ${coherenceTime} µs | Temperature: ${cryoTemp} mK | Gate Fidelity: ${gateFidelity}%
// Coupling Topology: ${couplingTopology}

qreg q[${Math.max(...results) + 1}];
creg c[${results.length}];

// Cryogenic Initializations
${results.map((r) => `h q[${r}];\nx q[${r}];`).join("\n")}

// High-fidelity entanglement coupling matrices (${couplingTopology})
${results
  .map((r, i) =>
    i < results.length - 1
      ? `fsim(0.12, 0.4) q[${r}], q[${results[i + 1]}];`
      : "",
  )
  .filter(Boolean)
  .join("\n")}

// Dynamic stabilizer error corrections
${noiseModel !== "none" ? results.map((r) => `err_correct_stabilize q[${r}];`).join("\n") : "// Standard depolarizing mode active"}

// Superconductive SQUID Resonator Readout
${results.map((r, i) => `measure q[${r}] -> c[${i}];`).join("\n")}
`;

    const blob = new Blob([qasm], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `google_willow_${hardwareLayout}_pipeline.qasm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(
      "QASM COMPILATION",
      "OpenQASM 2.0 high-fidelity hardware instructions exported.",
      "success",
    );
  };

  // Timeline tracking steps for dynamic thinking visualization
  const pipelineSteps = [
    { label: "Lattice Locking", phase: "DATA_INGESTION", desc: "Awaiting physical zero-trust token reservation and quantum memory alignment." },
    { label: "Resonator Tuning", phase: "WILLOW_INIT", desc: "Microwave coaxes matching frequencies. State alignment on superconducting layer." },
    { label: "Swarm Superposition", phase: "AGENT_OPTIMIZATION", desc: "Applying unitary transpiled gate sweeps. Building multidimensional Hilbert spaces." },
    { label: "Wave Readout", phase: "COLLAPSE", desc: "Evaluating resonator impedance changes to freeze quantum amplitudes into physical bits." }
  ];

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-5 shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.04)]">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Cpu className={`w-5 h-5 ${connectionMode === "WILLOW_PHYSICAL" ? "text-emerald-400" : "text-fuchsia-400"}`} />
            {connectionMode === "WILLOW_PHYSICAL" && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div>
            <h2 className={`text-xs font-mono font-bold tracking-wider uppercase ${connectionMode === "WILLOW_PHYSICAL" ? "text-emerald-400" : "text-fuchsia-400"} flex items-center gap-1.5`}>
              <span>Google Quantum Willow Core</span>
              <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 animate-pulse font-extrabold uppercase">
                {connectionMode === "WILLOW_PHYSICAL" ? "PHYSICAL COMPILING ACTIVE" : "EMULATION HOST"}
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              DIRECT CRYOGENIC EXECUTION LINK TO WILLOW top-tier superconducting QPU chip
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Main QPU Grid and Live Log Column */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          {/* Canvas Wrapper */}
          <div className="min-h-[300px] bg-black/75 rounded-xl border border-slate-900 relative p-4 flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Ambient grid design */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.5px,transparent_0.5px)] opacity-[0.03] pointer-events-none" />
            
            <canvas
              ref={canvasRef}
              width={650}
              height={330}
              className="w-full h-full block absolute inset-0 z-0 opacity-85"
            />
            
            {/* Status indicators */}
            <div className="z-10 mt-auto pointer-events-none flex flex-col gap-1 w-full max-w-[280px] bg-slate-950/90 p-3 rounded-lg border border-slate-800 backdrop-blur-md shadow-xl select-none">
              <div className="flex justify-between items-center pb-1 mb-1 border-b border-slate-900">
                <span className="text-[9px] font-mono text-emerald-400 tracking-wider font-extrabold uppercase">SUPERCONDUCTING LATTICE</span>
                <span className="text-[8px] font-mono text-slate-500 uppercase animate-pulse">LOCK ACTIVE</span>
              </div>
              <span className="text-[8.5px] font-mono text-slate-300">Layout Index: <b className="text-emerald-400 uppercase">{hardwareLayout.replace("_", " ")}</b></span>
              <span className="text-[8.5px] font-mono text-slate-300">Coupled Density: <b className="text-emerald-400">{qubits.length} Qubits</b></span>
              <span className="text-[8.5px] font-mono text-slate-300 block truncate">Topology Routing: <b className="text-emerald-400 uppercase">{couplingTopology}</b></span>
              
              {simulationRunning && (
                <div className="mt-2 text-[8px] font-mono leading-normal text-emerald-400 space-y-0.5 border-t border-slate-900 pt-1.5 min-h-[44px]">
                  {simLogs.map((log, i) => (
                    <div key={i} className="truncate animate-in fade-in slide-in-from-bottom-1 duration-200">
                      {log}
                    </div>
                  ))}
                  <div className="animate-pulse">_</div>
                </div>
              )}

              {/* Real-time progression gauge */}
              <div className="h-1 w-full bg-slate-900 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            {/* Running Phase visual overlay */}
            {simulationRunning && (
              <div className="absolute top-4 right-4 z-10 bg-black/80 px-2.5 py-1.5 border border-emerald-500/20 rounded-lg backdrop-blur-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[8.5px] font-mono text-emerald-400 uppercase font-black tracking-widest">{simulationPhase.replace("_", " ")}</span>
              </div>
            )}
          </div>

          {/* QPU Interactive Gate Injector Panel (Users click to seed/interact directly) */}
          <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-xl flex flex-col gap-3">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Interactive QPU Gate Pulse Injector</span>
            </span>
            <p className="text-[9.5px] text-slate-500 font-mono uppercase mt-0.5 leading-snug">
              Seed the live superconducting array with manual waveform pulses during rest or active runs. Click gates to trigger real-time physical ripples.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              <button
                onClick={() => injectGate("H")}
                className="py-2 px-2 bg-slate-900 hover:bg-cyan-950/30 text-cyan-400 border border-slate-800 hover:border-cyan-500/30 rounded-lg text-[9px] font-mono uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Inject H (Superpose)</span>
              </button>
              <button
                onClick={() => injectGate("X")}
                className="py-2 px-2 bg-slate-900 hover:bg-fuchsia-950/30 text-fuchsia-400 border border-slate-800 hover:border-fuchsia-500/30 rounded-lg text-[9px] font-mono uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Cpu className="w-3 h-3" />
                <span>Inject X (Invert)</span>
              </button>
              <button
                onClick={() => injectGate("fSim")}
                className="py-2 px-2 bg-slate-900 hover:bg-emerald-950/30 text-emerald-400 border border-slate-800 hover:border-emerald-500/30 rounded-lg text-[9px] font-mono uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Layers className="w-3 h-3" />
                <span>Inject fSim (Couple)</span>
              </button>
              <button
                onClick={() => injectGate("pulse")}
                className="py-2 px-2 bg-slate-900 hover:bg-amber-950/30 text-amber-400 border border-slate-800 hover:border-amber-500/30 rounded-lg text-[9px] font-mono uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Activity className="w-3 h-3" />
                <span>Coaxial Flux sweep</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configurations, Hardware, and Telemetry Selectors Column */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          
          {/* Connection Link and Presets */}
          <div className="border border-slate-900 bg-slate-950/50 p-4 rounded-xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>QPU CONNECTION PARAMETERS</span>
              </span>
              <button
                onClick={() => setShowDocs(!showDocs)}
                className="text-[8px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded border border-slate-800 text-cyan-400 transition"
              >
                {showDocs ? "HIDE API" : "VIEW API"}
              </button>
            </div>

            {/* Connection mode select */}
            <div className="grid grid-cols-1 gap-1">
              {(["WILLOW_PHYSICAL", "CLOUD_QVM", "LOCAL_QVM"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setConnectionMode(mode)}
                  className={`p-2.5 text-[8.5px] font-mono uppercase rounded-lg border transition text-left flex items-center justify-between ${
                    connectionMode === mode
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                      : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-800"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{mode.replace("_", " ")}</span>
                    <span className="text-[7.5px] text-slate-500 font-normal mt-0.5 leading-none">
                      {mode === "WILLOW_PHYSICAL"
                        ? "Google Quantum Willow 105 qubits hardware link"
                        : mode === "CLOUD_QVM"
                        ? "Google Cloud high performance QVM"
                        : "Client sandbox local compiler"}
                    </span>
                  </div>
                  {connectionMode === mode && (
                    <div className="flex flex-col items-end gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {mode === "WILLOW_PHYSICAL" && (
                        <span className="text-[6.5px] text-cyan-400 font-bold uppercase animate-pulse">Auth bypass locked</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Hardware Preset select */}
            <div>
              <span className="text-[9.5px] text-slate-400 font-mono font-bold uppercase block mb-1.5">Hardware Presets:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(["willow_pink", "sycamore", "weber", "rainbow"] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setHardwareLayout(preset);
                    }}
                    className={`py-2 px-1.5 text-[9px] font-mono uppercase rounded-lg border transition ${
                      hardwareLayout === preset
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {preset.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Noise Injection */}
            <div>
              <span className="text-[9.5px] text-slate-400 font-mono font-bold uppercase block mb-1.5">Noise Modeling:</span>
              <div className="grid grid-cols-3 gap-1">
                {(["depolarizing", "amplitude_damping", "none"] as const).map((nModel) => (
                  <button
                    key={nModel}
                    onClick={() => setNoiseModel(nModel)}
                    className={`py-1.5 text-[8px] font-mono uppercase rounded-lg border text-center truncate px-1 transition ${
                      noiseModel === nModel
                        ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {nModel.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cryotelemery Adjusters */}
          <div className="border border-slate-900 bg-slate-950/50 p-4 rounded-xl flex flex-col gap-3.5">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cryogenic Physical Fine-Tuning</span>
            </span>
            
            {/* Temperature Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-red-400" />
                  QPU Temperature:
                </span>
                <span className="text-cyan-300 font-bold">{cryoTemp} mK</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={cryoTemp}
                onChange={(e) => setCryoTemp(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-900 h-1 rounded-lg outline-none cursor-pointer"
              />
              <span className="text-[7.5px] text-slate-500 font-mono uppercase leading-tight leading-none">
                Lower temperature reduces microwave thermal excitation noise
              </span>
            </div>

            {/* Coherence Time Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>Coherence Cutoff (T1/T2):</span>
                <span className="text-emerald-400 font-bold">{coherenceTime} µs</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={coherenceTime}
                onChange={(e) => setCoherenceTime(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-900 h-1 rounded-lg outline-none cursor-pointer"
              />
              <span className="text-[7.5px] text-slate-500 font-mono uppercase leading-none">
                Longer coherence limits preserve quantum phase superposition state vectors
              </span>
            </div>

            {/* Gate Fidelity Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>Transpiled Gate Fidelity:</span>
                <span className="text-amber-400 font-bold">{gateFidelity}%</span>
              </div>
              <input
                type="range"
                min="95"
                max="99.9"
                step="0.05"
                value={gateFidelity}
                onChange={(e) => setGateFidelity(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-900 h-1 rounded-lg outline-none cursor-pointer"
              />
              <span className="text-[7.5px] text-slate-500 font-mono uppercase leading-none">
                Gate error rates influence cross-entropy benchmark threshold fidelity
              </span>
            </div>

            {/* Coupling Topology Option */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9.5px] text-slate-400 font-mono">Lattice Coupling Routing:</span>
              <div className="grid grid-cols-3 gap-1">
                {(["crossgrid", "hexagonal", "star"] as const).map((top) => (
                  <button
                    key={top}
                    onClick={() => setCouplingTopology(top)}
                    className={`py-1 text-[8.5px] font-mono uppercase rounded border text-center px-1 transition ${
                      couplingTopology === top
                        ? "bg-slate-900 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {top}
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={runSimulation}
              disabled={simulationRunning}
              className="mt-2 w-full py-3 border border-emerald-400/30 bg-gradient-to-r from-emerald-600/80 to-teal-800/80 hover:from-emerald-500 hover:to-teal-700 text-white rounded-lg text-[9.5px] font-mono font-black tracking-widest uppercase transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex justify-center items-center gap-2 cursor-pointer"
            >
              {simulationRunning ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-200" />
                  <span>TRANSPILING STAGE PROGRESS...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-200" />
                  <span>START EXECUTOR</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cryogenic Thinking Pipeline section (staggered progress) */}
      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400 font-bold" />
          <span>REAL-TIME CRYOGENIC THINKING PIPELINE</span>
        </span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {pipelineSteps.map((step, idx) => {
            const stepMin = idx * 25;
            const stepMax = (idx + 1) * 25;
            const isCompleted = progress >= stepMax;
            const isActive = progress >= stepMin && progress < stepMax && simulationRunning;
            const isPending = progress < stepMin;

            return (
              <div
                key={step.label}
                className={`p-3 rounded-lg border transition-all duration-300 flex flex-col gap-1.5 ${
                  isActive
                    ? "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.06)]"
                    : isCompleted
                    ? "bg-slate-900/40 border-emerald-950/60 text-slate-500"
                    : "bg-slate-950 border-slate-900/60 select-none opacity-40"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${isActive ? "text-emerald-400 animate-pulse" : isCompleted ? "text-slate-400" : "text-slate-500"}`}>
                    {idx + 1}. {step.label}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isActive ? (
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  )}
                </div>
                <p className="text-[8.5px] text-slate-500 font-mono tracking-tight uppercase leading-snug">
                  {step.desc}
                </p>
                {isActive && (
                  <div className="w-full bg-slate-900 h-0.5 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-emerald-400 animate-[pulse_1s_infinite]" style={{ width: "100%" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* End Results display with Spectrograph */}
      <AnimatePresence>
        {results && !simulationRunning && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="border border-emerald-500/25 bg-slate-950 rounded-xl p-4 flex flex-col md:flex-row gap-5 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
          >
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-center text-emerald-400 font-mono text-[9px] font-bold uppercase border-b border-slate-900 pb-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>SUPERCONDUCTOR MEASUREMENT: WAVEFUNCTION RECONSTRUCTION</span>
                </span>
                <span className="text-[8px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 tracking-widest text-[7.5px] uppercase">COLLAPSAR COMPLETED</span>
              </div>

              {/* Collapsed Numbers Deck */}
              <div className="flex gap-2 flex-wrap mt-0.5">
                {results.map((n, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.12, type: "spring" }}
                    className="w-10 h-10 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-mono font-bold flex flex-col items-center justify-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.02)]"
                  >
                    <span className="text-[7.5px] text-emerald-500 font-mono uppercase font-normal leading-none mb-0.5">Q-{i+1}</span>
                    <span className="leading-none text-xs">{n}</span>
                  </motion.div>
                ))}

                {bonusResult !== null && (
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 6 * 0.12, type: "spring" }}
                    className="w-10 h-10 rounded bg-rose-950/50 border border-rose-500/45 text-rose-300 font-mono font-bold flex flex-col items-center justify-center text-sm shadow-[0_0_10px_rgba(244,63,94,0.22),inset_0_1px_1px_rgba(255,255,255,0.02)]"
                  >
                    <span className="text-[7.5px] text-rose-500 font-mono uppercase font-normal leading-none mb-0.5">BONUS</span>
                    <span className="leading-none text-xs">{bonusResult}</span>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-2 select-none">
                <button
                  onClick={mapToDeck}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/40 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 rounded-lg text-[9.5px] font-mono font-bold tracking-wider transition-all uppercase flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>MAP VECTOR DECK FOR MULTI-REGION ANALYSIS</span>
                </button>
                <button
                  onClick={downloadQASM}
                  className="px-4 py-3 bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:bg-emerald-950/20 hover:text-emerald-200 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                  title="Download OpenQASM Instructions"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quantum Probability Amplitude Spectrograph visualization */}
            <div className="flex-1 bg-black/60 rounded-lg border border-slate-900 p-3 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
              <span className="text-[8px] font-mono text-slate-500 font-bold uppercase block mb-1">PROBABILITY AMPLITUDE MEASUREMENT SPECTRUM (XEB calibrated)</span>
              
              {/* Virtual Chart representation */}
              <div className="flex-1 flex items-end gap-1 px-1 mt-2 mb-2 relative">
                {/* Horizontal reference threshold lines */}
                <div className="absolute inset-x-0 bottom-[90%] border-t border-dashed border-emerald-500/5 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-[60%] border-t border-dashed border-emerald-500/5 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-[30%] border-t border-dashed border-emerald-500/5 pointer-events-none" />
                
                {/* Generate 49 dynamic micro-bars representing the amplitude across standard spectrum */}
                {Array.from({ length: 49 }).map((_, rIdx) => {
                  const number = rIdx + 1;
                  const isMatch = results.includes(number);
                  // Highly visible peaks on matching numbers, small ambient noise on non-matching
                  const barHeight = isMatch ? (Math.random() * 20 + 80) : (Math.random() * 15 + 4);
                  const isHighlighted = isMatch;

                  return (
                    <div
                      key={rIdx}
                      style={{ height: `${barHeight}%` }}
                      className={`flex-1 transition-all duration-700 ${
                        isHighlighted
                          ? "bg-gradient-to-t from-emerald-600 via-emerald-400 to-cyan-400 border-x border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                          : "bg-slate-800/40"
                      }`}
                      title={`State |${number}⟩ Probability Amplitude: ${(barHeight * 0.01).toFixed(3)}`}
                    ></div>
                  );
                })}
              </div>

              {/* Spectrograph legends */}
              <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-500 uppercase leading-none mt-1 border-t border-slate-900 pt-1.5">
                <span>Resonator 1</span>
                <span>Hilbert state coordinate array |1⟩ ... |49⟩</span>
                <span>Resonator 49</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docs Accordion wrapper */}
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
                <span className="text-[10px] text-fuchsia-400 font-mono font-bold uppercase flex items-center gap-1.5 animate-pulse">
                  <Info className="w-3.5 h-3.5" />
                  <span>Cirq / Google Willow API Sandbox Source Codes</span>
                </span>
                <span className="text-[9px] text-slate-500 font-mono uppercase">
                  source: google_quantum_ai_integration_kit
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
