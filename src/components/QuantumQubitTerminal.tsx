import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, ShieldCheck, Cpu, Zap, Radio, RefreshCw, Play, 
  Trash2, Sliders, Activity, HelpCircle, CornerDownLeft, Sparkles, X, Database,
  Mic, MicOff, Search, Code, Copy, Check, Save, Volume2, VolumeX, Folder, Plus, ChevronRight
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

  // Extended States for high-fidelity interactive sub-systems
  const [terminalTab, setTerminalTab] = useState<'shell' | 'agent' | 'search' | 'workspace'>('shell');
  
  // Speech & Voice Control States
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [waveformPulse, setWaveformPulse] = useState(0);
  
  // Web Quantum Codes Search States
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [webSearchResults, setWebSearchResults] = useState<any[]>([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Workspace File Management States
  const [workspaceFiles, setWorkspaceFiles] = useState<any[]>([]);
  const [selectedFileContents, setSelectedFileContents] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [isExecutingFile, setIsExecutingFile] = useState<string | null>(null);
  const [editingFileCode, setEditingFileCode] = useState<string>("");
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<'list' | 'editor'>('list');
  const [newFileTitle, setNewFileTitle] = useState("");
  const [isCreatingNewFile, setIsCreatingNewFile] = useState(false);
  
  // AI Interactive Chat Agent Session
  const [agentInputText, setAgentInputText] = useState("");
  const [agentHistoryLogs, setAgentHistoryLogs] = useState<Array<{ role: 'user' | 'model', content: string }>>([
    { role: 'model', content: "Hello! Clear communication lines established. I am your Willow QVM Virtual Command Intelligence. Ask me to write customized program routines, execute bash modules, clone git, or search the network!" }
  ]);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);

  // Audio TTS Engine
  const readSpeechText = (text: string) => {
    if (!voiceSpeechEnabled) return;
    try {
      window.speechSynthesis.cancel();
      // clean formatting strings and markdown code blocks limit to prevent long recitation
      const clean = text.replace(/```[\s\S]*?```/g, "[code snippet]").replace(/`{1,3}[\s\S]*?`{1,3}/g, "").replace(/[*_#\-]/g, "");
      const utterance = new SpeechSynthesisUtterance(clean.slice(0, 160));
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS engine failed to run.", e);
    }
  };

  // Web search fetcher
  const handleWebSearchSubmit = async (customQuery?: string) => {
    const queryTerm = customQuery || webSearchQuery;
    if (!queryTerm.trim()) {
      addToast("EMPTY SCAN", "Please detail query keywords to search", "warning");
      return;
    }
    
    setIsSearchingWeb(true);
    triggerBeep(380, "sine", 0.05);
    try {
      const res = await fetch('/api/quantum-terminal/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryTerm })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setWebSearchResults(data.results);
        addToast("WEB SCAN COMPLETE", `Retrieved ${data.results.length} high-fidelity codes.`, "success");
        setTerminalLogs(prev => [
          ...prev,
          { text: `>>> SYSTEM: Decoded web search results for "${queryTerm}": Found ${data.results.length} entries.`, type: 'success' }
        ]);
        if (data.results[0] && voiceSpeechEnabled) {
          readSpeechText(`Found matching quantum implementations for ${queryTerm}.`);
        }
      }
    } catch (err) {
      addToast("WEBSCAN FAIL", "Failed to contact search gateway.", "error");
    } finally {
      setIsSearchingWeb(false);
    }
  };

  // Workspace file loading and saving routines
  const fetchWorkspaceFiles = async () => {
    setIsWorkspaceLoading(true);
    try {
      const res = await fetch('/api/quantum-terminal/files');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setWorkspaceFiles(data.files);
      }
    } catch (e) {
      console.warn("Could not retrieve workspace files:", e);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const writeCustomFile = async (name: string, code: string) => {
    setIsWorkspaceLoading(true);
    try {
      const res = await fetch('/api/quantum-terminal/write-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: name, code: code })
      });
      const data = await res.json();
      if (data.success) {
        addToast("FILE SECURED", `Integrated ${name} under program workspace.`, "success");
        setTerminalLogs(prev => [...prev, { text: `>>> WORKSPACE: Secured file [${name}] successfully.`, type: 'success' }]);
        fetchWorkspaceFiles();
        return true;
      }
      return false;
    } catch (e) {
      addToast("WRITE ERROR", "Failed to access host write pipeline", "error");
      return false;
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleSaveWorkspaceFile = async () => {
    if (!selectedFileName) return;
    const success = await writeCustomFile(selectedFileName, editingFileCode);
    if (success) {
      setActiveWorkspaceView('list');
    }
  };

  // Handle adding new file in workspace
  const handleCreateNewFile = async () => {
    if (!newFileTitle.trim()) {
      addToast("EMPTY NAME", "Workspace requires a specific file identification title.", "warning");
      return;
    }
    const safeName = newFileTitle.endsWith('.py') || newFileTitle.endsWith('.js') ? newFileTitle : `${newFileTitle}.py`;
    setIsWorkspaceLoading(true);
    try {
      const initialSeedCode = `# Dynamic Custom Quantum Script - ${safeName}\n# Generated inside workhouse console interface\n\ndef run_quantum_simulation():\n    print("Initiating custom quantum computations...")\n    print("[SUCCESS] Operational state vectors collapsed nominal.")\n\nif __name__ == "__main__":\n    run_quantum_simulation()\n`;
      const res = await fetch('/api/quantum-terminal/write-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: safeName, code: initialSeedCode })
      });
      const data = await res.json();
      if (data.success) {
        addToast("FILE INITIATED", `Created custom workspace file: ${safeName}`, "success");
        setNewFileTitle("");
        setIsCreatingNewFile(false);
        fetchWorkspaceFiles();
        
        // Open directly in editor
        setSelectedFileName(safeName);
        setEditingFileCode(initialSeedCode);
        setActiveWorkspaceView('editor');
      }
    } catch(err) {
      addToast("CREATE ERROR", "Host permissions restricted file addition.", "error");
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const executeProgramFile = async (fileName: string) => {
    setIsExecutingFile(fileName);
    addToast("LAUNCH ENGINE", `Spinning quantum execution daemon for ${fileName}...`, "info");
    setTerminalLogs(prev => [...prev, { text: `>>> EXECUTE: Running script "${fileName}"...`, type: 'telemetry' }]);
    
    try {
      const res = await fetch('/api/quantum-terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileName })
      });
      const data = await res.json();
      if (data.success) {
        setTerminalLogs(prev => [
          ...prev,
          { text: `=== WORKSPACE RECON RECORD: ${fileName} ===`, type: 'success' },
          { text: data.stdout || "Nominal diagnostic return. Exit code [0].", type: 'sys' },
          ...(data.stderr ? [{ text: `STDERR: ${data.stderr}`, type: 'err' }] : [])
        ] as any);
        addToast("SUCCESSFUL COLLAPSE", `${fileName} executed successfully.`, "success");
        triggerBeep(880, "sine", 0.12);
      } else {
        setTerminalLogs(prev => [
          ...prev,
          { text: `>>> FAULT ERROR [${fileName}]: ${data.error || 'System compiler error'}`, type: 'err' },
          { text: data.stderr || "", type: 'err' }
        ] as any);
        addToast("EXECUTION FAULT", "The selected program crashed or exited with error.", "error");
        triggerBeep(180, "sawtooth", 0.2);
      }
    } catch (e) {
      addToast("COMMS FAULT", "Could not send request.", "error");
    } finally {
      setIsExecutingFile(null);
    }
  };

  // Voice Speech interactions
  const startVoiceChatCapture = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        addToast("VOICE RECOGNITION RESTRICTED", "Your browser does not support Web Speech API. Simulating terminal command listener...", "warning");
        simulateVoiceSpeechHandshake();
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      setIsRecordingAudio(true);
      setWaveformPulse(1);
      triggerBeep(650, "sine", 0.1);
      
      recognition.onstart = () => {
        setTerminalLogs(prev => [...prev, { text: ">>> MICROPHONE: Open. Listening for voice telemetry...", type: 'telemetry' }]);
      };
      
      recognition.onresult = (event: any) => {
        const voiceResult = event.results[0][0].transcript;
        addToast("VOICE REGISTERED", `"${voiceResult}"`, "success");
        setAgentInputText(voiceResult);
        submitAgentIntelMessage(voiceResult);
      };
      
      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsRecordingAudio(false);
        setWaveformPulse(0);
        addToast("MIC DETACHED", "Speech request timed out or was blocked.", "warning");
      };
      
      recognition.onend = () => {
        setIsRecordingAudio(false);
        setWaveformPulse(0);
      };
      
      recognition.start();
    } catch (err) {
      simulateVoiceSpeechHandshake();
    }
  };

  const simulateVoiceSpeechHandshake = () => {
    setIsRecordingAudio(true);
    setWaveformPulse(1);
    triggerBeep(520, "sine", 0.08);
    
    // Choose high-fidelity representative inputs
    const speechOptions = [
      "Write a simulation script for Grovers Search algorithm in python",
      "Install advanced science libraries like scipy into QVM",
      "Search the web for variational quantum eigensolvers codes",
      "Clone covalent orchestrator package now"
    ];
    const mockText = speechOptions[Math.floor(Math.random() * speechOptions.length)];
    
    setTimeout(() => {
      setIsRecordingAudio(false);
      setWaveformPulse(0);
      addToast("SPEECH REGISTERED", `"${mockText}"`, "success");
      setAgentInputText(mockText);
      submitAgentIntelMessage(mockText);
    }, 2500);
  };

  const submitAgentIntelMessage = async (overridingMsg?: string) => {
    const text = overridingMsg || agentInputText;
    if (!text.trim()) return;
    
    setAgentInputText("");
    const updatedHistory = [...agentHistoryLogs, { role: 'user' as const, content: text }];
    setAgentHistoryLogs(updatedHistory);
    setIsAgentProcessing(true);
    triggerBeep(440, "sine", 0.08);
    
    try {
      const res = await fetch('/api/quantum-terminal/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: agentHistoryLogs })
      });
      const data = await res.json();
      if (data.success) {
        setAgentHistoryLogs(prev => [...prev, { role: 'model', content: data.text }]);
        readSpeechText(data.speakText || "Neural processing alignment completed.");
        
        // Handle automated actions
        if (data.action) {
          const action = data.action;
          setTerminalLogs(prev => [...prev, { text: `>>> INTEL DIRECTIVE: Executing action of type [${action.type}]`, type: 'success' }]);
          
          if (action.type === 'dependency_install' && action.target) {
            setTerminalLogs(prev => [...prev, { text: `>>> STAGE WORKSPACE: Installing package via system agent...`, type: 'telemetry' }]);
            addToast("AI DIRECTIVE EXECUTED", `Requested package: ${action.target}`, "info");
          } else if (action.type === 'git_clone' && action.target) {
            cloneLibrary(action.target, action.target);
          } else if (action.type === 'write_code' && action.filename && action.code) {
            await writeCustomFile(action.filename, action.code);
            addToast("AI DIRECTIVE EXECUTED", `Custom file ${action.filename} compiled!`, "success");
          } else if (action.type === 'run_code' && action.filename) {
            executeProgramFile(action.filename);
          }
        }
      }
    } catch (err) {
      addToast("NEURAL MISMATCH", "I could not resolve connection to command central.", "error");
    } finally {
      setIsAgentProcessing(false);
    }
  };

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
    fetchWorkspaceFiles();
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
        setTerminalLogs(prev => [...prev, { text: `>>> Connecting to host terminal to execute: ${rawCmd}`, type: 'telemetry' }]);
        try {
          const res = await fetch('/api/quantum-terminal/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: rawCmd })
          });
          const data = await res.json();
          if (data.success) {
            setTerminalLogs(prev => [
              ...prev,
              { text: data.stdout || `Command succeeded.`, type: 'sys' },
              ...(data.stderr ? [{ text: `STDERR: ${data.stderr}`, type: 'err' as any }] : [])
            ]);
            triggerBeep(450, "sine", 0.05);
          } else {
            setTerminalLogs(prev => [
              ...prev,
              { text: data.stdout || "", type: 'sys' },
              { text: `>>> ERROR: ${data.stderr || data.error || 'Execution failed'}`, type: 'err' }
            ]);
            triggerBeep(150, "triangle", 0.2);
          }
        } catch (e) {
          setTerminalLogs(prev => [...prev, { text: `>>> FATAL: Failed to reach host terminal engine.`, type: 'err' }]);
          triggerBeep(150, "triangle", 0.2);
        }
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
            className="w-full bg-slate-950 rounded-3xl border border-cyan-500/20 shadow-[0_20px_50px_rgba(6,182,212,0.15)] p-5 relative overflow-hidden z-25 min-h-[500px] flex flex-col justify-between"
          >
            {/* Hacker matrix terminal aesthetic elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />

            {/* Terminal Panel Header layout */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-200 tracking-wider flex items-center gap-2">
                    WILLOW CRYOGENIC QVM WORKSTATION v4.9
                  </h4>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-tight">Active Ingress Port: 3000 | Coherence Secured</p>
                </div>
              </div>

              {/* Utility/Quick Status Bar */}
              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                  {/* Voice state Toggle */}
                  <button 
                    onClick={() => { setVoiceSpeechEnabled(!voiceSpeechEnabled); triggerBeep(450, "sine", 0.05); }}
                    className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                      voiceSpeechEnabled 
                        ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/40 hover:bg-cyan-900/45' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350'
                    }`}
                    title={voiceSpeechEnabled ? "Voice Output Enabled" : "Voice Output Muted"}
                  >
                    {voiceSpeechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  <span className="flex items-center gap-1 font-mono text-[9px] text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded">
                    <Database className="w-2.5 h-2.5" />
                    <span>Firestore Linked</span>
                  </span>
                </div>

                <button 
                  onClick={() => setIsTerminalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-920 cursor-pointer"
                  title="Close Terminal Dashboard"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Terminal Tabs Switcher */}
            <div className="flex border-b border-slate-900/80 mb-4 gap-1 overflow-x-auto scrollbar-none flex-nowrap">
              <button 
                onClick={() => { setTerminalTab('shell'); triggerBeep(400, "sine", 0.05); }}
                className={`pb-2 px-3 font-mono text-[9.5px] uppercase font-bold tracking-wider transition-all duration-200 border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  terminalTab === 'shell' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Interactive Shell
              </button>
              <button 
                onClick={() => { setTerminalTab('agent'); triggerBeep(400, "sine", 0.05); }}
                className={`pb-2 px-3 font-mono text-[9.5px] uppercase font-bold tracking-wider transition-all duration-200 border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  terminalTab === 'agent' ? 'border-pink-500 text-pink-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                Voice & Chat Agent
                {isRecordingAudio && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />}
              </button>
              <button 
                onClick={() => { setTerminalTab('search'); triggerBeep(400, "sine", 0.05); }}
                className={`pb-2 px-3 font-mono text-[9.5px] uppercase font-bold tracking-wider transition-all duration-200 border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  terminalTab === 'search' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-amber-500" />
                Web Code Search
              </button>
              <button 
                onClick={() => { setTerminalTab('workspace'); triggerBeep(400, "sine", 0.05); fetchWorkspaceFiles(); }}
                className={`pb-2 px-3 font-mono text-[9.5px] uppercase font-bold tracking-wider transition-all duration-200 border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  terminalTab === 'workspace' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-emerald-500" />
                Workspace Files ({workspaceFiles.length})
              </button>
            </div>

            {/* MAIN TAB CONTENT PANELS */}
            <div className="flex-1 flex flex-col justify-between mb-2 select-none min-h-[280px]">
              
              {/* === TAB 1: INTERACTIVE SHELL === */}
              {terminalTab === 'shell' && (
                <div className="flex-1 flex flex-col justify-between">
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

                  {/* Manual Quick Command Macros bar */}
                  <div className="flex gap-1.5 mb-3 overflow-x-auto py-1 scrollbar-none">
                    <span className="text-[8.5px] font-mono text-slate-500 self-center uppercase mr-1 hidden md:inline">Macros:</span>
                    {['help', 'status', 'tools', 'simulate', 'error-correct', 'sync', 'logs', 'clear'].map((macro) => (
                      <button
                        key={macro}
                        onClick={() => {
                          setCommandInput(macro);
                          triggerBeep(450, "sine", 0.05);
                        }}
                        className="text-[8.5px] font-mono text-cyan-400 hover:text-cyan-200 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 px-2 py-1 rounded-lg cursor-pointer shrink-0 transition-all uppercase"
                      >
                        {macro}
                      </button>
                    ))}
                  </div>

                  {/* Prompt input interface */}
                  <div className="relative flex items-center bg-slate-900 border border-slate-800/80 rounded-2xl p-2">
                    <span className="font-mono text-cyan-400 font-extrabold text-xs pl-2 pr-1 select-none flex items-center gap-1 shrink-0">
                      <span>qvm-willow@root:~$</span>
                    </span>
                    
                    <input 
                      type="text"
                      placeholder="Type 'help' for instructions, 'tools' to list libraries, or execute dynamic operations..."
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          executeTerminalCommand();
                        } else if (e.key === "ArrowUp") {
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
                </div>
              )}

              {/* === TAB 2: VOICE & CHAT AGENT === */}
              {terminalTab === 'agent' && (
                <div className="flex-1 flex flex-col justify-between h-[360px]">
                  
                  {/* Chat feed box */}
                  <div className="flex-1 bg-slate-950/45 p-4 rounded-2xl border border-slate-920 overflow-y-auto mb-4 space-y-3 h-[210px] custom-scrollbar">
                    {agentHistoryLogs.map((chat, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-3 max-w-[85%] ${chat.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <div className={`p-1.5 rounded-xl self-start shrink-0 ${
                          chat.role === 'user' ? 'bg-pink-950 text-pink-400' : 'bg-slate-900 border border-slate-800 text-cyan-400'
                        }`}>
                          {chat.role === 'user' ? <Mic className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`p-3 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-wrap ${
                          chat.role === 'user' 
                            ? 'bg-pink-950/35 text-white border border-pink-900/30' 
                            : 'bg-slate-900/40 border border-slate-850 text-slate-200'
                        }`}>
                          {chat.content}
                        </div>
                      </div>
                    ))}
                    {isAgentProcessing && (
                      <div className="flex items-center gap-3 mr-auto">
                        <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        </div>
                        <span className="font-mono text-slate-500 text-[10px] uppercase tracking-wider animate-pulse">Calculating neural strategy alignments...</span>
                      </div>
                    )}
                  </div>

                  {/* Audio Waveform visualization panel */}
                  {isRecordingAudio && (
                    <div className="flex items-center justify-center gap-1 mb-3 bg-pink-950/20 py-2 border border-pink-900/20 rounded-xl">
                      <span className="text-[9px] font-mono text-pink-400/90 uppercase tracking-widest mr-2 animate-pulse">Recording vocal feed:</span>
                      {[...Array(12)].map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={{ height: [8, 24, 8] }}
                          transition={{ duration: 0.5 + (i * 0.05), repeat: Infinity, ease: "easeInOut" }}
                          className="w-[2.5px] bg-pink-500 rounded-full"
                        />
                      ))}
                    </div>
                  )}

                  {/* Input form */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 rounded-2xl p-1.5">
                    
                    {/* Microphone input trigger */}
                    <button
                      onClick={startVoiceChatCapture}
                      disabled={isRecordingAudio || isAgentProcessing}
                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                        isRecordingAudio 
                          ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]' 
                          : 'bg-pink-950 hover:bg-pink-900 text-pink-400 hover:text-pink-100 border border-pink-800/40'
                      }`}
                      title="Speak Command to Intelligent Terminal"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <input 
                      type="text"
                      placeholder="Ask the Virtual AI to: 'install scipy', 'clone covalent', or 'write grover python script'..."
                      value={agentInputText}
                      onChange={(e) => setAgentInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitAgentIntelMessage();
                      }}
                      className="flex-1 bg-transparent border-none text-white outline-none focus:ring-0 font-mono text-xs py-1 px-1"
                    />

                    <button
                      onClick={() => submitAgentIntelMessage()}
                      disabled={isAgentProcessing || !agentInputText.trim()}
                      className="p-1 px-3 bg-pink-900/60 hover:bg-pink-850/80 border border-pink-800 text-pink-300 hover:text-pink-100 rounded-xl transition-colors font-mono text-[10px] font-medium tracking-wide uppercase shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              )}

              {/* === TAB 3: WEB CODE SEARCH === */}
              {terminalTab === 'search' && (
                <div className="flex-1 flex flex-col justify-between h-[360px]">
                  
                  {/* Search Bar section */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 relative flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1">
                      <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                      <input 
                        type="text"
                        placeholder="Search web for codes (e.g. Shor factoring code, Grover circuit, VQE molecules)..."
                        value={webSearchQuery}
                        onChange={(e) => setWebSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleWebSearchSubmit();
                        }}
                        className="flex-1 bg-transparent border-none text-white outline-none focus:ring-0 font-mono text-xs py-1.5"
                      />
                    </div>
                    <button
                      onClick={() => handleWebSearchSubmit()}
                      disabled={isSearchingWeb}
                      className="p-1.5 px-4 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-300 hover:text-amber-100 rounded-2xl font-mono text-[10px] font-bold uppercase cursor-pointer shrink-0 transition-colors disabled:opacity-50"
                    >
                      {isSearchingWeb ? "Scanning..." : "Scan Web"}
                    </button>
                  </div>

                  {/* Search results box */}
                  <div className="flex-1 bg-slate-950/45 p-3 rounded-2xl border border-slate-920 overflow-y-auto space-y-4 h-[250px] custom-scrollbar">
                    {isSearchingWeb ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                        <span className="font-mono text-slate-400 text-[10px] uppercase tracking-widest animate-pulse">Harnessing Gemini search grounding spectrums...</span>
                      </div>
                    ) : webSearchResults.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-600 font-mono text-[10px] text-center p-6 bg-slate-900/10 border border-dashed border-slate-900/60 rounded-xl">
                        <span className="font-bold">WEB TELEMETRY INACTIVE</span>
                        <span>Key in quantum algorithms like "Shor's", "Grover's", or "VQE" and click Scan Web to pull functional code live from remote repositories.</span>
                        <div className="flex gap-2 mt-2">
                          <button 
                            onClick={() => { setWebSearchQuery("Shor's Factoring python"); handleWebSearchSubmit("Shor's Factoring python"); }}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-2 py-1 rounded text-[8.5px] border border-slate-800 cursor-pointer"
                          >
                            Try "Shor"
                          </button>
                          <button 
                            onClick={() => { setWebSearchQuery("Grover's Amplitude Search"); handleWebSearchSubmit("Grover's Amplitude Search"); }}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-2 py-1 rounded text-[8.5px] border border-slate-800 cursor-pointer"
                          >
                            Try "Grover"
                          </button>
                        </div>
                      </div>
                    ) : (
                      webSearchResults.map((result, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-900/35 hover:bg-slate-900/50 border border-slate-900 rounded-xl p-3 flex flex-col gap-2.5 transition-colors relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <h5 className="font-mono text-xs font-bold text-amber-400 mb-0.5">{result.title}</h5>
                              <p className="text-[9.5px] font-mono text-slate-400 leading-normal">{result.desc}</p>
                            </div>
                            <span className="text-[8px] bg-slate-950 border border-slate-800 text-slate-500 font-mono uppercase font-bold px-1.5 py-0.5 rounded">
                              {result.language}
                            </span>
                          </div>

                          {/* Code pre box */}
                          <div className="relative bg-slate-950/80 p-2.5 rounded-xl border border-slate-905 overflow-x-auto max-h-[160px] custom-scrollbar">
                            <pre className="font-mono text-[9px] text-emerald-400 select-text leading-tight whitespace-pre">
                              {result.code}
                            </pre>

                            {/* Copy and Save quick actions */}
                            <div className="absolute top-2 right-2 flex gap-1.5">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(result.code);
                                  setCopiedIndex(idx);
                                  addToast("CODE COPIED", "Code snippet cached to your clipboard.", "success");
                                  triggerBeep(950, "sine", 0.05);
                                  setTimeout(() => setCopiedIndex(null), 1500);
                                }}
                                className="bg-slate-900 hover:bg-slate-850 p-1 rounded border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                                title="Copy Code to Clipboard"
                              >
                                {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                              
                              <button
                                onClick={async () => {
                                  const name = `${result.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.py`;
                                  await writeCustomFile(name, result.code);
                                  triggerBeep(720, "sine", 0.05);
                                }}
                                className="bg-slate-900 hover:bg-slate-850 p-1 px-2 text-[8px] rounded border border-slate-800 text-amber-400 flex items-center gap-1 cursor-pointer font-mono font-bold"
                                title="Download and save program to Workspace"
                              >
                                <Save className="w-3 h-3 text-amber-400" />
                                <span>INTEGRATE</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* === TAB 4: WORKSPACE FILES === */}
              {terminalTab === 'workspace' && (
                <div className="flex-1 flex flex-col justify-between h-[360px]">
                  {isWorkspaceLoading ? (
                    <div className="h-full flex-1 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                      <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Syncing workstation filesystem clusters...</span>
                    </div>
                  ) : activeWorkspaceView === 'list' ? (
                    <>
                      {/* Top Action layout: Create New File */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider font-bold">Workspace Active Directories</span>
                        
                        {isCreatingNewFile ? (
                          <div className="flex gap-1.5 items-center">
                            <input 
                              type="text"
                              autoFocus
                              placeholder="Filename (e.g. vqe.py)..."
                              value={newFileTitle}
                              onChange={(e) => setNewFileTitle(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNewFile(); }}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-[9.5px] font-mono text-white outline-none w-36"
                            />
                            <button 
                              onClick={handleCreateNewFile}
                              className="bg-emerald-950 border border-emerald-800 text-emerald-400 hover:text-emerald-100 p-1 rounded-md cursor-pointer text-[9.5px] font-mono uppercase px-2 font-bold"
                            >
                              Add
                            </button>
                            <button 
                              onClick={() => { setIsCreatingNewFile(false); setNewFileTitle(""); }}
                              className="bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 p-1 px-2 rounded-md cursor-pointer text-[9.5px] font-mono"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setIsCreatingNewFile(true); triggerBeep(450, "sine", 0.05); }}
                            className="bg-emerald-950 border border-emerald-800 text-emerald-400 hover:text-emerald-100 p-1 px-2.5 rounded-lg cursor-pointer text-[9.5px] font-mono font-bold uppercase flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3 text-emerald-400 shrink-0" />
                            Create Custom Code
                          </button>
                        )}
                      </div>

                      {/* Files list cards */}
                      <div className="flex-1 bg-slate-950/45 p-3 rounded-2xl border border-slate-920 overflow-y-auto space-y-2 h-[220px] custom-scrollbar">
                        {workspaceFiles.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-[9px]">
                            No custom files detected. Create a file above.
                          </div>
                        ) : (
                          workspaceFiles.map((file) => (
                            <div 
                              key={file.name} 
                              className="bg-slate-900/20 hover:bg-slate-900/40 border border-slate-900 rounded-xl p-3 flex items-center justify-between gap-4 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Code className="w-5 h-5 text-emerald-500 shrink-0" />
                                <div className="min-w-0">
                                  <h6 className="font-mono text-xs font-bold text-slate-200 truncate">{file.name}</h6>
                                  <p className="text-[8px] font-mono text-slate-500">
                                    {(file.size / 1024).toFixed(2)} KB | Modified: {new Date(file.mtime).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {/* Edit code trigger */}
                                <button
                                  onClick={() => {
                                    setSelectedFileName(file.name);
                                    // Set editing seed block based on file name or a loader
                                    // For simplicity retrieve the code if matches
                                    const defaultBlocks: Record<string, string> = {
                                      'bell_state.py': `
# Quantum Bell State Simulation
# Pre-loaded into the Willow QVM Microkernel Workstation
# Simulated Qubit Entanglement |ψ+⟩ = (|00⟩ + |11⟩)/√2

import random
import time

def simulate_bell_state_telemetry(runs=1000):
    print("Initializing QVM Microkernel Phase Arrays...")
    time.sleep(0.4)
    print("Calibrating Lattice Grid Junction Coherence... OK")
    print(f"Running {runs} stochastic measurement collapsed operations...")
    
    counts = {"00": 0, "11": 0, "01": 0, "10": 0}
    damping_factor = 0.015
    for _ in range(runs):
        rnd = random.random()
        if rnd < (0.5 - damping_factor):
            counts["00"] += 1
        elif rnd < (1.0 - 2 * damping_factor):
            counts["11"] += 1
        else:
            if random.random() < 0.5:
                counts["01"] += 1
            else:
                counts["10"] += 1
    time.sleep(0.6)
    print("==================================================")
    print("              BELL STATE COLLAPSE RAW DATA        ")
    print("==================================================")
    for state, pct in counts.items():
        ratio = (pct / runs) * 100
        bar = "█" * int(ratio // 4)
        print(f"State |{state}⟩ : {pct:4d} times ({ratio:6.2f}%) {bar}")
    print("==================================================")
    print("Fidelity Index: 98.42% | Phase Coherence Secured")

if __name__ == "__main__":
    simulate_bell_state_telemetry()`.trim()
                                    };
                                    setEditingFileCode(defaultBlocks[file.name] || `# Workspace file: ${file.name}\n\n# Press Save to commit alterations.\n# Press Run to simulate.\n`);
                                    setActiveWorkspaceView('editor');
                                  }}
                                  className="text-[9.5px] font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg cursor-pointer"
                                >
                                  Edit Code
                                </button>
                                
                                {/* Run program trigger */}
                                <button
                                  onClick={async () => {
                                    await executeProgramFile(file.name);
                                    setTerminalTab('shell'); // return to console to view output
                                  }}
                                  disabled={isExecutingFile !== null}
                                  className="text-[9.5px] font-mono font-bold bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 hover:text-emerald-100 text-emerald-400 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  {isExecutingFile === file.name ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      Running...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3 h-3" />
                                      Run Program
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    /* Editor Layout */
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Code className="w-4 h-4 text-emerald-400 shrink-0" />
                          <h6 className="font-mono text-xs font-bold text-white truncate">Editing: {selectedFileName}</h6>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => { setActiveWorkspaceView('list'); triggerBeep(450, "sine", 0.05); }}
                            className="text-[9px] font-mono bg-slate-900 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg cursor-pointer border border-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveWorkspaceFile}
                            className="text-[9px] font-mono font-bold bg-emerald-950 border border-emerald-800 text-emerald-400 hover:text-white px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            Save File
                          </button>
                        </div>
                      </div>

                      <div className="flex-1">
                        <textarea
                          value={editingFileCode}
                          onChange={(e) => setEditingFileCode(e.target.value)}
                          className="w-full h-[220px] bg-slate-950 p-3 rounded-2xl border border-slate-900 font-mono text-[10px] text-emerald-400 leading-tight outline-none focus:ring-0 focus:border-cyan-800 focus:outline-none custom-scrollbar"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
