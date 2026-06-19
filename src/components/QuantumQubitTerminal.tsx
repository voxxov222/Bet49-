import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, ShieldCheck, Cpu, Zap, Radio, RefreshCw, Play, 
  Trash2, Sliders, Activity, HelpCircle, CornerDownLeft, Sparkles, X, Database
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, setDoc, doc, onSnapshot, getDocs, limit, query, orderBy } from "firebase/firestore";

interface QuantumQubitTerminalProps {
  onApplyNumbers?: (nums: number[], bonus?: number) => void;
  addToast: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
  playSpeech?: (text: string) => void;
}

export default function QuantumQubitTerminal({
  onApplyNumbers,
  addToast,
  playSpeech
}: QuantumQubitTerminalProps) {
  // Qubit State & Bloch Sphere Rotation
  const [theta, setTheta] = useState(60); // polar angle 0 to 180
  const [phi, setPhi] = useState(45); // azimuthal angle 0 to 360
  const [coherence, setCoherence] = useState(99.98); // in ms
  const [fidelity, setFidelity] = useState(99.993); // gate fidelity
  const [isHovered, setIsHovered] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // Error Correction Stabilizer Grid
  const [stabilizers, setStabilizers] = useState<Array<{ id: string; val: number; status: 'nominal' | 'correcting' | 'error' }>>([
    { id: 'X0X1', val: 1, status: 'nominal' },
    { id: 'X2X3', val: 1, status: 'nominal' },
    { id: 'Z0Z1', val: 1, status: 'nominal' },
    { id: 'Z2Z3', val: 1, status: 'nominal' },
    { id: 'Y0Y1', val: -1, status: 'nominal' },
    { id: 'Y2Y3', val: 1, status: 'nominal' },
  ]);
  const [eccInjected, setEccInjected] = useState(false);
  
  // Terminal Panel States
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ text: string; type: 'sys' | 'user' | 'success' | 'err' | 'telemetry' }>>([
    { text: "GOOGLE WILLOW QVM KERNEL BOOT [v2.4.9]", type: 'sys' },
    { text: "SUPERCONDUCTING REFRIGERATOR COLD-STAGE: 10.4 mK", type: 'telemetry' },
    { text: "STABILIZER SYNDROMES ACTIVE. SHOR 9-QUBIT CODES ENGAGED.", type: 'success' },
    { text: "autonomous background learning daemon running 24/7...", type: 'telemetry' },
    { text: "Type 'help' to initialize matrix commands.", type: 'sys' }
  ]);
  const [commandInput, setCommandInput] = useState("");
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Firebase Real-time Learnings
  const [firebaseActive, setFirebaseActive] = useState(false);
  const [learningRate, setLearningRate] = useState(0.0042);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Never");
  const [totalSimCount, setTotalSimCount] = useState(0);

  // Integrated Option Toolsets State (Covalent, Google, etc.)
  interface QuantumLibrary {
    id: string;
    name: string;
    description: string;
    url: string;
    type: string;
    isCloned: boolean;
    filesCount: number;
  }
  const [hudTab, setHudTab] = useState<'telemetry' | 'toolsets'>('telemetry');
  const [libraries, setLibraries] = useState<QuantumLibrary[]>([]);
  const [isLoadingLibs, setIsLoadingLibs] = useState(false);
  const [installingLibId, setInstallingLibId] = useState<string | null>(null);

  const fetchLibraries = async () => {
    setIsLoadingLibs(true);
    try {
      const res = await fetch('/api/quantum-libraries');
      const data = await res.json();
      if (data.success && Array.isArray(data.libraries)) {
        setLibraries(data.libraries);
      }
    } catch (err) {
      console.warn("Failed to query quantum integrated libraries:", err);
    } finally {
      setIsLoadingLibs(false);
    }
  };

  const cloneLibrary = async (id: string, name: string) => {
    setInstallingLibId(id);
    addToast("INTEGRATION PIPELINE INITIATED", `Securing quantum package repository files for ${name}...`, "info");
    setTerminalLogs(prev => [...prev, { text: `>>> PIPELINE: Securing dynamic clone for ${name}...`, type: 'telemetry' }]);
    
    try {
      const res = await fetch('/api/quantum-libraries/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryId: id })
      });
      const data = await res.json();
      if (data.success) {
        addToast("INTEGRATION SUCCESS", `${name} integrated into active quantum option toolsets.`, "success");
        setTerminalLogs(prev => [
          ...prev, 
          { text: `>>> SUCCESS: ${name} toolkit matched.`, type: 'success' },
          { text: `>>> message: ${data.message}`, type: 'success' }
        ]);
        if (playSpeech) playSpeech(`${name} has been compiled and registered successfully.`);
        fetchLibraries();
      } else {
        addToast("INTEGRATION EXCEPTION", `Failure cloning ${id}: ${data.error || 'Server rejected request'}`, "error");
        setTerminalLogs(prev => [...prev, { text: `>>> FAIL: ${data.error || 'Cloning process interrupted'}`, type: 'err' }]);
      }
    } catch (err: any) {
      addToast("PIPELINE FAIL", "No route to active compilation server.", "error");
    } finally {
      setInstallingLibId(null);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  // Auto Calculations (Autonomous 24/7 calculations simulation)
  useEffect(() => {
    // Attempt Firebase initial handshake
    try {
      const qvmDocRef = doc(db, "willow_qvm_learning", "current_model");
      const unsubscribe = onSnapshot(qvmDocRef, (snapDoc) => {
        if (snapDoc.exists()) {
          const data = snapDoc.data();
          if (data.learningRate) setLearningRate(data.learningRate);
          if (data.totalSimCount) setTotalSimCount(data.totalSimCount);
          if (data.theta) setTheta(data.theta);
          if (data.phi) setPhi(data.phi);
          if (data.coherence) setCoherence(data.coherence);
          if (data.fidelity) setFidelity(data.fidelity);
          setLastSyncTime(new Date(data.updatedAt).toLocaleTimeString());
          setFirebaseActive(true);
        } else {
          // Initialize doc if missing
          setDoc(qvmDocRef, {
            learningRate: 0.0042,
            totalSimCount: 0,
            theta: 60,
            phi: 45,
            coherence: 99.98,
            fidelity: 99.993,
            updatedAt: new Date().toISOString()
          });
          setFirebaseActive(true);
        }
      }, (err) => {
        console.warn("Firestore permissions or initialization delay:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Could not setup Firestore live listener. Checking local backup.", e);
    }
  }, []);

  // Autonomous background loop to calculate and process (simulates 24/7 learning)
  useEffect(() => {
    const backgroundCalcInterval = setInterval(async () => {
      // 1. Oscillate Bloch parameters smoothly 
      const deltaTheta = (Math.random() - 0.5) * 5;
      const deltaPhi = (Math.random() - 0.5) * 8;
      
      setTheta(prev => {
        const next = Math.max(0, Math.min(180, prev + deltaTheta));
        return parseFloat(next.toFixed(2));
      });
      
      setPhi(prev => {
        const next = (prev + deltaPhi + 360) % 360;
        return parseFloat(next.toFixed(2));
      });

      // 2. Slow environmental noise on coherence & fidelity
      setCoherence(prev => {
        const nextVal = prev - 0.01 + (Math.random() * 0.02);
        return parseFloat(Math.max(90, Math.min(100, nextVal)).toFixed(4));
      });

      setFidelity(prev => {
        const nextVal = prev - 0.0002 + (Math.random() * 0.0004);
        return parseFloat(Math.max(99.9, Math.min(100, nextVal)).toFixed(5));
      });

      // 3. Spatially run automatic error correction stabilizer check
      setStabilizers(prev => 
        prev.map(stab => {
          // Occasional temporary error simulated, then auto-corrected
          if (Math.random() < 0.05 && stab.status === 'nominal') {
            return { ...stab, status: 'error', val: -1 };
          } else if (stab.status === 'error') {
            // Auto correct error
            return { ...stab, status: 'correcting', val: 1 };
          } else if (stab.status === 'correcting') {
            return { ...stab, status: 'nominal', val: 1 };
          }
          return stab;
        })
      );

      // Save a simulated live quantum training step to Firebase Doc
      const randBonus = Math.floor(Math.random() * 49) + 1;
      const randNums = Array.from({ length: 6 }, () => Math.floor(Math.random() * 49) + 1).sort((a,b)=>a-b);
      
      try {
        const qvmDocRef = doc(db, "willow_qvm_learning", "current_model");
        const nextSimCount = totalSimCount + 1;
        setTotalSimCount(nextSimCount);
        
        await setDoc(qvmDocRef, {
          learningRate,
          totalSimCount: nextSimCount,
          theta: parseFloat(theta.toFixed(2)),
          phi: parseFloat(phi.toFixed(2)),
          coherence: parseFloat(coherence.toFixed(4)),
          fidelity: parseFloat(fidelity.toFixed(5)),
          latestNumbers: randNums,
          latestBonus: randBonus,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Add a soft automated telemetry log periodically
        if (Math.random() < 0.25) {
          setTerminalLogs(prev => [
            ...prev.slice(-30),
            { 
              text: `[QOMP-AUTO-RUN #${nextSimCount}] Resonator array stabilized. Bonus correlation weight: ${(Math.random() * 0.9).toFixed(5)}. Saved to Firebase DB.`, 
              type: 'telemetry' 
            }
          ]);
        }
      } catch (err) {
        // Fallback local updates if database is loading or locked
        setTotalSimCount(prev => prev + 1);
        if (Math.random() < 0.25) {
          setTerminalLogs(prev => [
            ...prev.slice(-30),
            { 
              text: `[LOCAL-AUTO-RUN] Quantum array state update cached locally. Coordinate theta=${theta.toFixed(2)}, phi=${phi.toFixed(2)}.`, 
              type: 'telemetry' 
            }
          ]);
        }
      }
    }, 7000);

    return () => clearInterval(backgroundCalcInterval);
  }, [theta, phi, coherence, fidelity, totalSimCount, learningRate]);

  // Handle auto scroll terminal
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs, isTerminalOpen]);

  // Audio synthezier sound effect using browser AudioContext
  const triggerBeep = (freq = 800, type: OscillatorType = "sine", duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration - 0.01);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignored if sound is blocked or unsupported
    }
  };

  // Click Qubit event trigger
  const handleQubitInteractiveClick = () => {
    setPulseCount(p => p + 1);
    triggerBeep(320 + Math.random() * 450, "triangle", 0.15);
    
    // Rotate Qubit vectors dramatically
    setTheta(Math.floor(Math.random() * 180));
    setPhi(Math.floor(Math.random() * 360));

    // Stabilizers error correct event
    setStabilizers(stabs => stabs.map(s => ({ ...s, status: 'correcting', val: 1 })));
    
    addToast("QUANTUM EXCITON FLIP", "You perturbed the Bloch sphere vector! Recalculating superconducting quantum state dynamics.", "info");
    
    // Toggle Terminal View!
    setIsTerminalOpen(true);
  };

  // Inject localized noise / trigger stabilizer showoff
  const injectNoiseAndStabilize = () => {
    triggerBeep(220, "sawtooth", 0.2);
    setEccInjected(true);
    setFidelity(f => parseFloat((f - 0.12).toFixed(5)));
    setCoherence(c => parseFloat((c - 12.5).toFixed(4)));

    setStabilizers(stabs => 
      stabs.map((s, idx) => {
        if (idx % 2 === 0) {
          return { ...s, status: 'error', val: -1 };
        }
        return s;
      })
    );

    setTerminalLogs(prev => [
      ...prev,
      { text: ">>> [WARN] STOCHASTIC THERMAL NOISE DEPOLARIZING INJECTION IN PROGRESS", type: 'err' },
      { text: ">>> GATE FIDELITY DRIPPED below threshold. COHERENCE CASCADE detected.", type: 'err' },
    ]);

    setTimeout(() => {
      triggerBeep(650, "sine", 0.25);
      setStabilizers(stabs => stabs.map(s => ({ ...s, status: 'correcting', val: 1 })));
      setTerminalLogs(prev => [
        ...prev,
        { text: ">>> SHOR ERROR CORRECTION CODES COLLAPSED. Syndicate checks completed.", type: 'sys' },
        { text: ">>> BIT-FLIP AND PHASE-FLIP stabilizer signals successfully resolved.", type: 'success' },
      ]);
      setFidelity(99.993);
      setCoherence(99.98);
      setEccInjected(false);
      addToast("ERROR CORRECTED", "Shor stabilizers detected thermal error codes and correctly collapsed the vectors.", "success");
    }, 1500);
  };

  // Terminal logic handler
  const executeTerminalCommand = async () => {
    const rawCmd = commandInput.trim();
    if (!rawCmd) return;

    setCmdHistory(prev => [...prev, rawCmd]);
    setHistoryPointer(-2);
    setCommandInput("");

    setTerminalLogs(prev => [...prev, { text: `QVM-USER@SHELL:~$ ${rawCmd}`, type: 'user' }]);

    const args = rawCmd.split(" ");
    const cmd = args[0].toLowerCase();

    switch (cmd) {
      case 'help': {
        setTerminalLogs(prev => [
          ...prev,
          { text: "--- AVAILABLE STRATEGIC HUD COMMANDS ---", type: 'sys' },
          { text: "  help                         Displays this secure quantum instruction roster.", type: 'sys' },
          { text: "  status                       Outputs current superconducting physical metrics.", type: 'sys' },
          { text: "  tools                        Lists quantum option toolsets (orchestrator: covalent, Google libraries, etc).", type: 'sys' },
          { text: "  install <id>                 Clones/integrates the specified quantum library into your workstation.", type: 'sys' },
          { text: "  sync                         Leverages Firebase to fetch/post autonomous models.", type: 'sys' },
          { text: "  error-correct                Injects simulated environmental entropy and resolves stabilizer errors.", type: 'sys' },
          { text: "  set-learning-rate <val>      Configures SGD algorithm training weight coefficients.", type: 'sys' },
          { text: "  simulate                     Triggers deep lattice quantum calculation (collapses new 6+1 series).", type: 'sys' },
          { text: "  logs                         Queries historic terminal audits logged in Cloud run databases.", type: 'sys' },
          { text: "  clear                        Wipes terminal screen memory buffers.", type: 'sys' },
          { text: "  close                        Collapses the active programming shell dashboard.", type: 'sys' },
        ]);
        triggerBeep(500, "sine", 0.05);
        break;
      }
      case 'status': {
        setTerminalLogs(prev => [
          ...prev,
          { text: `[PHYSICAL TELEMETRY STATUS]`, type: 'success' },
          { text: `  - Sycamore II Superconductivity Grid: ACTIVE`, type: 'sys' },
          { text: `  - Dilution Refrigerator Core Temp: 10.42 mK (millikelvin)`, type: 'sys' },
          { text: `  - Sphere Vectors: Polar(θ) = ${theta}°, Azimuth(φ) = ${phi}°`, type: 'sys' },
          { text: `  - System Coherence Window: ${coherence} ms`, type: 'sys' },
          { text: `  - High-Fidelity 2-Qubit Gates: ${fidelity}%`, type: 'sys' },
          { text: `  - Background Optimization Daemons count: 24 active 24/7 threads`, type: 'telemetry' },
          { text: `  - Firebase Sync Link: ${firebaseActive ? "ESTABLISHED (Online)" : "INTERNAL EMULATOR MODE"}`, type: 'telemetry' },
        ]);
        triggerBeep(450, "sine", 0.1);
        break;
      }
      case 'sync': {
        setTerminalLogs(prev => [...prev, { text: ">>> Pinging Willow-QVM Firebase master nodes...", type: 'telemetry' }]);
        try {
          const qvmDocRef = doc(db, "willow_qvm_learning", "current_model");
          const nextNums = Array.from({ length: 6 }, () => Math.floor(Math.random() * 49) + 1).sort((a,b)=>a-b);
          const nextB = Math.floor(Math.random() * 49) + 1;
          
          await setDoc(qvmDocRef, {
            learningRate,
            totalSimCount: totalSimCount + 1,
            theta,
            phi,
            coherence,
            fidelity,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          setTotalSimCount(prev => prev + 1);
          setTerminalLogs(prev => [
            ...prev,
            { text: `>>> Handshake synchronized! Current calibration factors stored:`, type: 'success' },
            { text: `  - Base Learning SGD Rate: ${learningRate}`, type: 'success' },
            { text: `  - Autonomous Cycles Recorded: ${totalSimCount + 1}`, type: 'success' },
            { text: `>>> Next prediction seed stabilized dynamically!`, type: 'success' },
          ]);
          addToast("FIREBASE LIVE REPORT", "Latest autonomous parameter model pushed to Cloud database.", "success");
          triggerBeep(880, "sine", 0.15);
        } catch (e) {
          setTerminalLogs(prev => [
            ...prev,
            { text: `>>> ERROR: Direct cloud connection failed. Cache locked locally. Detaching system rules.`, type: 'err' }
          ]);
        }
        break;
      }
      case 'error-correct': {
        injectNoiseAndStabilize();
        break;
      }
      case 'set-learning-rate': {
        const rateVal = parseFloat(args[1]);
        if (isNaN(rateVal) || rateVal <= 0 || rateVal > 1) {
          setTerminalLogs(prev => [...prev, { text: ">>> SYNTAX ERROR: Set-learning-rate expects floats in interval (0.0, 1.0]", type: 'err' }]);
        } else {
          setLearningRate(rateVal);
          setTerminalLogs(prev => [...prev, { text: `>>> SYSTEM TRAINING METRIC UPDATED: SGD training factor set to ${rateVal}`, type: 'success' }]);
          addToast("SGD CALIBRATED", `Quantum optimizer training rate altered to ${rateVal}`, "info");
          // Sync with Firestore
          try {
            const qvmDocRef = doc(db, "willow_qvm_learning", "current_model");
            setDoc(qvmDocRef, { learningRate: rateVal }, { merge: true });
          } catch(e){}
        }
        break;
      }
      case 'simulate': {
        setTerminalLogs(prev => [
          ...prev,
          { text: ">>> Initiating Google Willow superconducting wavefunction calculation...", type: 'telemetry' },
        ]);
        triggerBeep(330, "sine", 0.4);
        
        // Generate new predictions
        let genSet = new Set<number>();
        while(genSet.size < 6) {
          genSet.add(Math.floor(Math.random() * 49) + 1);
        }
        const nums = Array.from(genSet).sort((a,b)=>a-b);
        let bonusNum = Math.floor(Math.random() * 49) + 1;
        while(nums.includes(bonusNum)) {
          bonusNum = Math.floor(Math.random() * 49) + 1;
        }

        setTimeout(() => {
          setTerminalLogs(prev => [
            ...prev,
            { text: `>>> SYSTEM: Wavefunction collapsed dynamically!`, type: 'success' },
            { text: `  - Predict Sequence: ${nums.join(", ")}`, type: 'success' },
            { text: `  - Predict Red Bonus Node: [${bonusNum}]`, type: 'err' },
          ]);
          triggerBeep(982, "sine", 0.12);

          if (onApplyNumbers) {
            onApplyNumbers(nums, bonusNum);
            addToast("WILLOW DISPATCH", "Generated Willow sequence collapsed onto main dashboard!", "success");
          }
        }, 1200);

        break;
      }
      case 'logs': {
        setTerminalLogs(prev => [
          ...prev,
          { text: "=== SYSTEM LOCAL & CLOUD DATABASE AUDITS ===", type: 'sys' },
          { text: `  Active Firebase Instance: ${firebaseActive ? "Online" : "Cached" }`, type: 'sys' },
          { text: `  Device Porting: INGRESS-HTTPS-LOOPBACK`, type: 'sys' },
          { text: `  Coherence Stable Ratio: ${coherence}%`, type: 'sys' },
          { text: `  Lattice topology index: QVM-WILLOW-GRID-72`, type: 'sys' },
          { text: `  Completed simulated matrix iterations: ${totalSimCount}`, type: 'telemetry' },
        ]);
        break;
      }
      case 'clear': {
        setTerminalLogs([]);
        break;
      }
      case 'close': {
        setIsTerminalOpen(false);
        break;
      }
      case 'tools': {
        setTerminalLogs(prev => [
          ...prev,
          { text: "=== INTEGRATED QUANTUM OPTION TOOLSETS & COVALENT ===", type: 'sys' },
          ...libraries.map(lib => ({
            text: `  [${lib.id}] - ${lib.name} (${lib.type})\n    - status: ${lib.isCloned ? `[REGISTERED / ${lib.filesCount} modules linked]` : "[AVAILABLE FOR INTEGRATION]"}\n    - repo: ${lib.url}`,
            type: (lib.isCloned ? 'success' : 'telemetry') as any
          })),
          { text: "  * Type 'install <id>' (e.g., 'install covalent') to dynamically compile any package.", type: 'sys' }
        ]);
        triggerBeep(450, "sine", 0.05);
        break;
      }
      case 'install': {
        const targetId = args[1];
        const match = libraries.find(lib => lib.id.toLowerCase() === targetId?.toLowerCase() || lib.name.toLowerCase().includes(targetId?.toLowerCase() || ''));
        if (!targetId || !match) {
          setTerminalLogs(prev => [
            ...prev,
            { text: `>>> SYNTAX ERROR: Specify a matching toolset ID to integrate. Predefined: ${libraries.map(lib => lib.id).join(', ')}`, type: 'err' }
          ]);
          triggerBeep(150, "sawtooth", 0.1);
        } else if (match.isCloned) {
          setTerminalLogs(prev => [
            ...prev,
            { text: `>>> LOG: [${match.name}] is already integrated and fully active in background workspace.`, type: 'success' }
          ]);
          triggerBeep(600, "sine", 0.05);
        } else {
          cloneLibrary(match.id, match.name);
        }
        break;
      }
      default: {
        setTerminalLogs(prev => [...prev, { text: `>>> '${cmd}' is not recognized as a valid lattice command. Type 'help'.`, type: 'err' }]);
        triggerBeep(150, "triangle", 0.2);
        break;
      }
    }
  };

  // Polar and Azimuth projections for SVG 3D Bloch representation
  const getQubitVectorCoords = () => {
    const r = 85; // Sphere radius inside SVG
    const thetaRad = (theta * Math.PI) / 180;
    const phiRad = (phi * Math.PI) / 180;

    // Standard 3D to 2D projection with isometric tilt
    const x = r * Math.sin(thetaRad) * Math.cos(phiRad);
    const y = r * Math.sin(thetaRad) * Math.sin(phiRad);
    const z = r * Math.cos(thetaRad);

    const tiltAngle = 18 * Math.PI / 180; // isometric tilt on vertical plane
    
    const projX = x * Math.cos(tiltAngle) + y * Math.sin(tiltAngle);
    const projY = -z + (x * -Math.sin(tiltAngle) + y * Math.cos(tiltAngle)) * 0.35; // squished vertical projection

    return { x: 100 + projX, y: 100 + projY };
  };

  const vectorCoords = getQubitVectorCoords();

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Interactive Main HUD widget containing Bloch Qubit & Real-time stabilizing system indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Animated Quantum Qubit Visual Widget ( Bloch Sphere & Resonators ) */}
        <div className="lg:col-span-5 bg-slate-950/85 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-5 flex flex-col items-center justify-between min-h-[360px] relative overflow-hidden group shadow-2xl">
          
          {/* Neon decorative background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all duration-500" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/15 transition-all duration-500" />

          {/* Heading HUD status bar */}
          <div className="w-full flex justify-between items-center z-10">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
              <span>Willow Qbit Module</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-bold uppercase">
                {firebaseActive ? "Database Live" : "Local Sync Mode"}
              </span>
              <button 
                onClick={() => setIsTerminalOpen(p => !p)}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Toggle Terminal Shell"
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Master 3D-Animated Bloch sphere visual block */}
          <div 
            onClick={handleQubitInteractiveClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-52 h-52 relative flex items-center justify-center cursor-pointer select-none transition-transform z-10 py-3 active:scale-95"
            title="Interact with Qubit to trigger program terminal"
          >
            {/* Sphere halo glow backdrops */}
            <div className={`absolute w-44 h-44 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
              isHovered ? "bg-cyan-500/20 scale-110 opacity-100" : "bg-cyan-500/10 scale-100 opacity-60"
            }`} />

            <div className={`absolute w-36 h-36 rounded-full blur-md border transition-all duration-500 pointer-events-none ${
              isHovered ? "border-cyan-500/30 bg-slate-950/40" : "border-slate-800/40 bg-transparent"
            }`} />

            {/* Google Willow-inspired meander trace resonators surrounding the qubit sphere */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Serpentine Superconducting Resonators matching Google Willow image style */}
              <path 
                d="M 20,45 L 180,45 C 190,45 190,75 180,75 L 20,75 C 10,75 10,105 20,105 L 180,105 C 190,105 190,135 180,135 L 20,135 C 10,135 10,165 20,165 L 180,165" 
                fill="none" 
                stroke="url(#traceGrad)" 
                strokeWidth={isHovered ? "2.5" : "1.5"} 
                strokeDasharray={isHovered ? "4 2" : "none"}
                className="transition-all duration-500 ease-in-out opacity-20"
              />
            </svg>

            {/* Bloch Sphere SVG Geometry Mapping */}
            <svg 
              className="w-full h-full transform overflow-visible scale-110 transition-transform duration-500 relative" 
              viewBox="0 0 200 200"
            >
              {/* Outer boundary circle sphere projections */}
              <circle cx="100" cy="100" r="85" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="85" fill="none" stroke="#1e293b" strokeWidth="1" />
              
              {/* Equator plane projection ellipse */}
              <ellipse cx="100" cy="100" rx="85" ry="25" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />

              {/* 3D Coordinate Orthogonal Axes (z-axis, x/y plane axes) */}
              {/* Z-axis vertical */}
              <line x1="100" y1="15" x2="100" y2="185" stroke="#475569" strokeWidth="0.8" />
              {/* Y-axis horizontal */}
              <line x1="15" y1="100" x2="185" y2="100" stroke="#475569" strokeWidth="0.8" />
              {/* X-axis isometric diagonal */}
              <line x1="40" y1="140" x2="160" y2="60" stroke="#475569" strokeWidth="0.8" />

              {/* Z-axis labels: state |0> at top, |1> at bottom */}
              <text x="100" y="12" fill="#10b981" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">|0⟩</text>
              <circle cx="100" cy="15" r="4.5" fill="#10b981" />
              <text x="100" y="196" fill="#f43f5e" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">|1⟩</text>
              <circle cx="100" cy="185" r="4.5" fill="#f43f5e" />

              {/* Static Axes Pointer Indicator Nodes */}
              <text x="192" y="103" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="bold">y</text>
              <text x="32" y="145" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="bold">x</text>

              {/* State Vector Arrow Pointer ( |ψ> ) */}
              <line 
                x1="100" 
                y1="100" 
                x2={vectorCoords.x} 
                y2={vectorCoords.y} 
                stroke="#06b6d4" 
                strokeWidth="2.5" 
                className="transition-all duration-300 pointer-events-none"
              />
              {/* Arrow Head/End State Node representing superposed state vector */}
              <circle 
                cx={vectorCoords.x} 
                cy={vectorCoords.y} 
                r={isHovered ? "5.5" : "4.5"} 
                fill="#06b6d4" 
                className="transition-all duration-200 shadow-[0_0_10px_#06b6d4] hover:scale-125" 
              />
              {/* Label indicating Wavefunction vector */}
              <text 
                x={vectorCoords.x + 10} 
                y={vectorCoords.y + (vectorCoords.y < 100 ? -2 : 8)} 
                fill="#06b6d4" 
                fontSize="9" 
                fontFamily="monospace" 
                fontWeight="extrabold"
              >
                |ψ⟩
              </text>

              {/* Wave Projection dashed guide lines to axes */}
              <line 
                x1={vectorCoords.x} 
                y1={vectorCoords.y} 
                x2="100" 
                y2="100" 
                stroke="#0891b2" 
                strokeWidth="0.8" 
                strokeDasharray="2 2" 
              />
              <line 
                x1={vectorCoords.x} 
                y1={vectorCoords.y} 
                x2={vectorCoords.x} 
                y2="100" 
                stroke="#0891b2" 
                strokeWidth="0.8" 
                strokeDasharray="2 2" 
              />

              {/* Decorative Angle Guides (θ and φ representations) */}
              <path 
                d="M 100,75 A 25,25 0 0 1 113,87" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="1" 
              />
              <text x="110" y="70" fill="#f59e0b" fontSize="8" fontFamily="monospace">θ</text>

              <path 
                d="M 85,110 A 20,10 0 0 0 100,113" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="1" 
              />
              <text x="80" y="125" fill="#3b82f6" fontSize="8" fontFamily="monospace">φ</text>
            </svg>
          </div>

          {/* Interactive footer overlay trigger instruction */}
          <div className="text-center z-10 w-full mt-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded bg-rose-500 animate-pulse" />
              <span>Tap Qbit to launch programming shell</span>
            </span>
          </div>
        </div>

        {/* Real-time Stabilizers, Error Correcting Codes & Firebase Dynamic Parameters HUD Card */}
        <div className="lg:col-span-7 bg-slate-950/85 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-5 flex flex-col justify-between shadow-2xl relative">
          
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <h4 className="font-sans font-bold text-sm text-slate-200 tracking-tight uppercase">Shor Stabilization & Live Database Store</h4>
            </div>
            
            {/* Action buttons triggers */}
            <button 
              onClick={injectNoiseAndStabilize}
              disabled={eccInjected}
              className={`font-mono text-[9.5px] px-2.5 py-1 rounded-xl font-bold uppercase transition-all duration-300 border flex items-center gap-1 text-xs cursor-pointer ${
                eccInjected 
                  ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed" 
                  : "bg-rose-950/40 text-rose-300 hover:text-rose-100 border-rose-500/20 hover:border-rose-400"
              }`}
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{eccInjected ? "Injecting Noise..." : "Inject Error Stabilizer"}</span>
            </button>
          </div>

          {/* Metrics strip layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-900/60 rounded-2xl border border-slate-850 p-2.5 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Coherence</span>
              <span className="text-sm font-mono font-bold text-slate-200">{coherence} ms</span>
            </div>
            <div className="bg-slate-900/60 rounded-2xl border border-slate-850 p-2.5 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase">2-Qubit Gate</span>
              <span className="text-sm font-mono font-bold text-slate-200">{fidelity}%</span>
            </div>
            <div className="bg-slate-900/60 rounded-2xl border border-slate-850 p-2.5 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Learning Rate</span>
              <span className="text-sm font-mono font-bold text-amber-400">{learningRate}</span>
            </div>
            <div className="bg-slate-900/60 rounded-2xl border border-slate-850 p-2.5 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Sync Stamp</span>
              <span className="text-sm font-mono font-bold text-cyan-400 truncate tracking-tight">{lastSyncTime}</span>
            </div>
          </div>

          {/* HUD Tabs Toggle */}
          <div className="flex border-b border-slate-900 mb-4">
            <button
              onClick={() => setHudTab('telemetry')}
              className={`pb-2 px-3 font-mono text-[9.5px] uppercase font-bold tracking-wider transition-all duration-200 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                hudTab === 'telemetry' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Lattice Stabilizers
            </button>
            <button
              onClick={() => setHudTab('toolsets')}
              className={`pb-2 px-3 font-mono text-[9.5px] uppercase font-bold tracking-wider transition-all duration-200 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                hudTab === 'toolsets' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-500" />
              Option Toolsets (Covalent Orchestrator)
              {libraries.filter(l => l.isCloned).length > 0 && (
                <span className="text-[7.5px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/10 animate-pulse">
                  {libraries.filter(l => l.isCloned).length} ON
                </span>
              )}
            </button>
          </div>

          {hudTab === 'telemetry' ? (
            <>
              {/* Interactive Stabilizer grid status */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Dynamic Stabilizer Syndromes Matrix</span>
                  <span className="text-[9px] font-mono text-slate-500">Active Syndrome Check: 10mK</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {stabilizers.map((s, idx) => (
                    <div 
                      key={s.id} 
                      className={`border rounded-xl p-2.5 flex flex-col items-center justify-center font-mono transition-all duration-300 relative overflow-hidden ${
                        s.status === 'error' 
                          ? "bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-[0_0_12px_rgba(239,68,68,0.15)] animate-pulse" 
                          : s.status === 'correcting'
                            ? "bg-amber-955 border-amber-400/50 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                            : "bg-slate-900/40 border-slate-800 text-slate-300"
                      }`}
                    >
                      <span className="text-[8px] text-slate-500 font-bold mb-0.5">{s.id}</span>
                      <span className="text-sm font-bold font-mono">
                        {s.status === 'error' ? "FAULT" : s.status === 'correcting' ? "CORR" : "LOCK"}
                      </span>
                      
                      {/* Miniature progress scanner bar if correcting */}
                      {s.status === 'correcting' && (
                        <div className="absolute bottom-0 left-0 h-[2.5px] bg-amber-500 w-full animate-[shor-bar_1.5s_ease-out_infinite]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Database autonomous learning telemetry list */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-3 h-28 overflow-y-auto font-mono text-[9.5px] text-slate-400 flex flex-col gap-1 scrolls">
                <div className="text-slate-500 border-b border-slate-900 pb-1 flex justify-between">
                  <span>AUTONOMOUS LEARNING STREAM (POSTING 24/7 TO FIREBASE)</span>
                  <span>CYCLES: {totalSimCount}</span>
                </div>
                
                {terminalLogs.filter(logs => logs.type === 'telemetry').slice(-3).map((l, idx) => (
                  <div key={idx} className="flex gap-2 text-cyan-400/95 leading-relaxed">
                    <span className="text-slate-600 font-bold">●</span>
                    <span className="text-slate-300 font-bold tracking-tight">{l.text}</span>
                  </div>
                ))}
                
                <div className="flex gap-2 text-emerald-400 leading-relaxed font-bold animate-pulse mt-auto">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />
                  <span>SGD network weights computed; synchronized under Firestore ID: willow_qvm_learning</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9.5px] text-slate-400 uppercase tracking-wider font-mono">WORKSPACE INTEGRATED TOOLSETS & OPTION CODES</span>
                  <button 
                    onClick={fetchLibraries} 
                    disabled={isLoadingLibs}
                    className="text-[8.5px] font-mono text-cyan-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-cyan-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isLoadingLibs ? 'animate-spin' : ''}`} />
                    Query Status
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5 max-h-[175px] overflow-y-auto pr-1">
                  {libraries.map((lib) => (
                    <div 
                      key={lib.id} 
                      className="bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850/40 rounded-xl p-2.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-slate-100">{lib.name}</span>
                          <span className={`text-[7.5px] px-1 rounded border uppercase font-mono font-bold ${
                            lib.isCloned 
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20' 
                              : 'bg-slate-950/45 text-slate-500 border-slate-800'
                          }`}>
                            {lib.type}
                          </span>
                          {lib.isCloned && (
                            <span className="text-[8px] text-slate-500 font-mono">
                              ({lib.filesCount} modules)
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{lib.description}</p>
                      </div>

                      <div className="shrink-0">
                        {lib.isCloned ? (
                          <span className="text-[8px] font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/20 border border-emerald-905 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            REGISTERED
                          </span>
                        ) : (
                          <button
                            onClick={() => cloneLibrary(lib.id, lib.name)}
                            disabled={installingLibId !== null}
                            className="text-[8.5px] font-mono font-bold uppercase transition-colors px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-100 border border-cyan-800 rounded flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {installingLibId === lib.id ? (
                              <>
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                CLONING...
                              </>
                            ) : (
                              <>
                                <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                                INTEGRATE
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 text-[8px] bg-slate-920/80 p-2 rounded-xl border border-slate-905 flex items-center gap-2 text-slate-500 font-mono">
                <Zap className="w-3.5 h-3.5 text-cyan-500 shrink-0 animate-pulse" />
                <span>Frameworks like <strong className="text-cyan-400 font-bold">Covalent (by Agnostiq)</strong> orchestrate simulations across HPC environments and hybrid-cloud runtimes.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out / Pop-up Retro Hacker-style Shell Coding terminal */}
      <AnimatePresence>
        {isTerminalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full bg-slate-950 rounded-3xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(6,182,212,0.15)] p-5 relative overflow-hidden z-25 min-h-[420px] flex flex-col justify-between"
          >
            {/* Hacker matrix terminal aesthetic elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />

            {/* Terminal Panel Header layout */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h4 className="font-mono text-xs font-bold text-slate-200 tracking-wider">
                  GOOGLE WILLOW QUANTUM PROGRAMMING SHELL (INTEGRAL-STYLING)
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono text-[9px] text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded">
                  <Database className="w-2.5 h-2.5" />
                  <span>Firestore Session Linked</span>
                </span>
                <button 
                  onClick={() => setIsTerminalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-920 cursor-pointer"
                  title="Close Terminal Dashboard"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrolling command feed buffer block */}
            <div className="flex-1 bg-slate-950/45 p-4 rounded-2xl border border-slate-920 overflow-y-auto mb-4 font-mono text-xs leading-relaxed space-y-2 h-[260px] custom-scrollbar selection:bg-cyan-500/30">
              {terminalLogs.map((log, idx) => {
                let textCol = "text-slate-300";
                if (log.type === 'sys') textCol = "text-cyan-400 font-extrabold";
                if (log.type === 'user') textCol = "text-white font-extrabold";
                if (log.type === 'success') textCol = "text-emerald-400 font-bold";
                if (log.type === 'err') textCol = "text-rose-500 font-bold";
                if (log.type === 'telemetry') textCol = "text-slate-500";

                return (
                  <div key={idx} className={`${textCol} break-words whitespace-pre-wrap flex gap-2`}>
                    <span className="text-slate-600 select-none">[{new Date().toLocaleTimeString()}]</span>
                    <span>{log.text}</span>
                  </div>
                );
              })}
              <div ref={terminalBottomRef} />
            </div>

            {/* Prompt input interface */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800/80 rounded-2xl p-2">
              <span className="font-mono text-cyan-400 font-extrabold text-xs pl-2 pr-1 select-none flex items-center gap-1 shrink-0">
                <span>qvm-willow@root:~$</span>
              </span>
              
              <input 
                type="text"
                autoFocus
                placeholder="Type 'help' to run stabilization, sync weights, trigger predictions codes..."
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeTerminalCommand();
                  } else if (e.key === "ArrowUp") {
                    // History traversal
                    if (cmdHistory.length > 0) {
                      const nextPtr = historyPointer === -1 ? cmdHistory.length - 1 : Math.max(0, historyPointer - 1);
                      setHistoryPointer(nextPtr);
                      setCommandInput(cmdHistory[nextPtr]);
                    }
                  } else if (e.key === "ArrowDown") {
                    if (historyPointer !== -1 && cmdHistory.length > 0) {
                      const nextPtr = historyPointer >= cmdHistory.length - 1 ? -1 : historyPointer + 1;
                      setHistoryPointer(nextPtr);
                      setCommandInput(nextPtr === -1 ? "" : cmdHistory[nextPtr]);
                    }
                  }
                }}
                className="flex-1 bg-transparent border-none text-white outline-none focus:ring-0 font-mono text-xs py-1"
              />

              <button 
                onClick={executeTerminalCommand}
                className="p-1 px-3 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-xl hover:text-cyan-100 hover:bg-cyan-900 transition-colors cursor-pointer flex items-center gap-1 text-[10px] uppercase font-bold shrink-0"
              >
                <span>Execute</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
