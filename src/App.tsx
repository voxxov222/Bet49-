import React, { useState, useEffect, useRef } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, LabelList } from 'recharts';
import { 
  Terminal, ShieldCheck, Cpu, RefreshCw, BarChart3, LineChart, 
  HelpCircle, Settings, Play, Pause, Send, ArrowRight, 
  Plus, Trash2, Database, Layers, Sparkles, Network, 
  ChevronRight, Volume2, VolumeX, Square, ExternalLink, Menu, X, Copy, Check, Sliders, Activity
} from 'lucide-react';

// Define structures
interface LottoDraw {
  id: string;
  date: string;
  numbers: number[]; // exactly 6 numbers sorted ascending
}

interface Message {
  id: string;
  role: 'user' | 'jarvis';
  content: string;
  timestamp: string;
}

// Preset historical Lotto 649 draws for seed data
const DEFAULT_DRAWS: LottoDraw[] = [
  { id: '1', date: '2026-06-10', numbers: [4, 15, 23, 27, 33, 41] },
  { id: '2', date: '2026-06-06', numbers: [12, 19, 21, 30, 42, 48] },
  { id: '3', date: '2026-06-03', numbers: [2, 16, 27, 33, 39, 45] },
  { id: '4', date: '2026-05-30', numbers: [8, 14, 25, 28, 36, 49] },
  { id: '5', date: '2026-05-27', numbers: [5, 11, 20, 31, 37, 44] },
  { id: '6', date: '2026-05-23', numbers: [1, 15, 22, 29, 32, 40] },
  { id: '7', date: '2026-05-20', numbers: [9, 13, 24, 38, 41, 47] },
  { id: '8', date: '2026-05-16', numbers: [6, 17, 26, 30, 34, 42] },
  { id: '9', date: '2026-05-13', numbers: [10, 18, 21, 35, 43, 46] },
  { id: '10', date: '2026-05-09', numbers: [3, 12, 27, 31, 39, 48] },
  { id: '11', date: '2026-05-06', numbers: [7, 16, 25, 28, 33, 44] },
  { id: '12', date: '2026-05-02', numbers: [11, 20, 24, 29, 37, 41] },
  { id: '13', date: '2026-04-29', numbers: [5, 14, 22, 30, 35, 49] },
  { id: '14', date: '2026-04-25', numbers: [8, 18, 23, 31, 40, 47] },
  { id: '15', date: '2026-04-22', numbers: [2, 15, 21, 27, 36, 45] },
];

const STRATEGIES = [
  { id: 'freq-10', name: '1. Historic Core Frequency', desc: 'Top frequency occurrence among the traced historical draws.' },
  { id: 'avg-6', name: '2. Historic Spatial Averages', desc: 'Position-specific averages calculated over the selected historical depth.' },
  { id: '369-offset', name: '3. 3-6-9 Offset Cascade', desc: 'Interactive offset adjustments (+3 / -3 / +6 / -6 / +9 / -9) from the last draw.' },
  { id: 'tri-grid', name: '4. 49 Square Triangulation', desc: 'Geometry-based perfect-square intersection overlay around recent centroids.' },
  { id: 'secure-rand', name: '5. Secured Random Seed', desc: 'High-entropy random number sequencing and scroll rouletter.' },
  { id: 'cluster-agents', name: '6. Sandbox Multi-Agent Clusters', desc: 'Five neural sandbox agents mapping statistical intervals and gap connections.' },
  { id: 'chain-3m', name: '7. Deep History Chains', desc: 'Continuous sequence modeling to determine the next logical sequence weights over historical depth.' },
  { id: 'swarm-5d', name: '8. Quantum Swarm Solver', desc: '5-Dimensional swarm particles calculating superposed coordinate weights.' },
  { id: 'peptide-fold', name: '9. Alpha Peptide Fold AI', desc: 'Amino acid mapping with secondary helix structural constraints.' },
  { id: 'tesseract-4d', name: '10. 4D Tesseract Projection', desc: 'Hypercube model mapping 1 to 49 on a rotating 4D coordinate lattice with trace history pathways.' },
  { id: 'cyclic-primes', name: '11. Cyclic Prime Reciprocals', desc: 'Reciprocal digit strings of full reptend primes (7, 17, 19, 23, 29, 47) mapped and shifted against historical draws.' },
  { id: 'e8-katha', name: '12. E8 Lattice/Katha Grid Offset', desc: 'Quantum E8 quasi-crystal projection mapped to Katha grid coordinates.' },
  { id: 'neyen-seq', name: '13. NEYƎИ Sequence / Flower Of Life', desc: 'Triadic Energy Balance using Vortex Mathematics (1,2,4,8,7,5) and Tesla (3,6,9) overlaid on the Flower of Life.' },
  { id: 'numeric-word-value', name: '14. Numeric Word Value Root / Base-9', desc: 'English word value mapping reducing words to their digital roots (e.g. ONE = 7), proving the base-9 loop.' },
  { id: 'omni-quantum-nexus', name: '15. Autonomous Omni-Quantum Nexus', desc: 'Sophisticated real-time algorithmic synthesis utilizing unified quantum entanglement state tracking and multi-dimensional holographic telemetry.' }
];

// 7x7 custom spiral coordinates mapping for Lotto Numbers 1-49
// Center is (3,3) which holds the number 1.
// 2 next to it (3,4), 3 above it (2,4) completing a perfect square block.
const SPIRAL_MAP: { [key: number]: { r: number; c: number } } = {
  1: { r: 3, c: 3 },
  2: { r: 3, c: 4 },
  3: { r: 2, c: 4 },
  4: { r: 2, c: 3 },
  5: { r: 2, c: 2 },
  6: { r: 3, c: 2 },
  7: { r: 4, c: 2 },
  8: { r: 4, c: 3 },
  9: { r: 4, c: 4 },
  10: { r: 4, c: 5 },
  11: { r: 3, c: 5 },
  12: { r: 2, c: 5 },
  13: { r: 1, c: 5 },
  14: { r: 1, c: 4 },
  15: { r: 1, c: 3 },
  16: { r: 1, c: 2 },
  17: { r: 1, c: 1 },
  18: { r: 2, c: 1 },
  19: { r: 3, c: 1 },
  20: { r: 4, c: 1 },
  21: { r: 5, c: 1 },
  22: { r: 5, c: 2 },
  23: { r: 5, c: 3 },
  24: { r: 5, c: 4 },
  25: { r: 5, c: 5 },
  26: { r: 5, c: 6 },
  27: { r: 4, c: 6 },
  28: { r: 3, c: 6 },
  29: { r: 2, c: 6 },
  30: { r: 1, c: 6 },
  31: { r: 0, c: 6 },
  32: { r: 0, c: 5 },
  33: { r: 0, c: 4 },
  34: { r: 0, c: 3 },
  35: { r: 0, c: 2 },
  36: { r: 0, c: 1 },
  37: { r: 0, c: 0 },
  38: { r: 1, c: 0 },
  39: { r: 2, c: 0 },
  40: { r: 3, c: 0 },
  41: { r: 4, c: 0 },
  42: { r: 5, c: 0 },
  43: { r: 6, c: 0 },
  44: { r: 6, c: 1 },
  45: { r: 6, c: 2 },
  46: { r: 6, c: 3 },
  47: { r: 6, c: 4 },
  48: { r: 6, c: 5 },
  49: { r: 6, c: 6 }
};

export default function App() {
  // State management
  const [draws, setDraws] = useState<LottoDraw[]>(() => {
    const saved = localStorage.getItem('bet49_draws');
    return saved ? JSON.parse(saved) : DEFAULT_DRAWS;
  });

  const [selectedStrategy, setSelectedStrategy] = useState<string>('freq-10');
  const [proposedNumbers, setProposedNumbers] = useState<number[]>([]);
  const [isWCLCStreamOpen, setIsWCLCStreamOpen] = useState(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Jarvis assistant interactions
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'jarvis',
      content: "Greetings. I am J.A.R.V.I.S., your virtual tactical companion for algorithmic lottery strategy exploration. Systems are fully responsive, monitoring the 49-node matrix grid. Select a strategy above or direct a query to my central database below.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isJarvisThinking, setIsJarvisThinking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  
  // Custom manual draw entry
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newNumbers, setNewNumbers] = useState<string>('');
  const [drawError, setDrawError] = useState<string | null>(null);

  // 3-6-9 Offset Mode Interactive Controls
  // Tracks user-customized offsets for each of the 6 coordinates (-9, -6, -3, +3, +6, +9)
  const [offsets369, setOffsets369] = useState<number[]>([3, -3, 6, -6, 9, -9]);

  // Active random countdown sequence
  const [isRandomizing, setIsRandomizing] = useState(false);

  // 6-49 Python Processing System Filters State
  const [selectedCyclicPrime, setSelectedCyclicPrime] = useState<number>(17);
  const [lookbackDepth, setLookbackDepth] = useState<number>(25);
  const [minSumFilter, setMinSumFilter] = useState<number>(115);
  const [maxSumFilter, setMaxSumFilter] = useState<number>(185);
  const [maxConsecutiveFilter, setMaxConsecutiveFilter] = useState<number>(2);
  const [avoidExtremeRatios, setAvoidExtremeRatios] = useState<boolean>(true);
  const [isTerminalRunning, setIsTerminalRunning] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[JARVIS POWER SYS] Telemetry sync complete.",
    "[INFO] Direct interface with 6-49-Processing-System.py initialized.",
    "[SYSTEM ONLINE] Awaiting command activation check."
  ]);

  // Canvas Refs for Animations
  const quantumSwarmCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const jarvisBrainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tesseractCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cyclicCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const e8KathaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const neyenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const omniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Audio speech synthesiser instance
  const playSpeech = (text: string) => {
    if (!isTTSEnabled) return;
    try {
      window.speechSynthesis.cancel();
      // Clean text of visual markers
      const cleanText = text.replace(/\[.*?\]/g, '').replace(/\*/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Look for standard english voice with sleek pace
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Premium')));
      if (engVoice) utterance.voice = engVoice;
      utterance.rate = 1.05;
      utterance.pitch = 0.95; // Slightly deeper, sophisticated
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Sync draws to storage and update numbers
  useEffect(() => {
    localStorage.setItem('bet49_draws', JSON.stringify(draws));
    calculateProposedNumbers();
  }, [draws, selectedStrategy, offsets369, minSumFilter, maxSumFilter, maxConsecutiveFilter, selectedCyclicPrime, lookbackDepth]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isJarvisThinking]);

  // Holographic pulsing brain ring animator
  useEffect(() => {
    const canvas = jarvisBrainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let frameId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 55;
      
      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius + Math.sin(angle * 3) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Spinning segments
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 8, angle, angle + Math.PI * 0.4);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius - 8, angle + Math.PI, angle + Math.PI * 1.4);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Core neural nodes pulsating
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 24 + Math.cos(angle * 5) * 2, 0, Math.PI * 2);
      ctx.fillStyle = isJarvisThinking ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.15)';
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      // Particle vectors radiating from center
      for (let i = 0; i < 8; i++) {
        const phi = (i * Math.PI) / 4 + angle * 0.4;
        const x1 = Math.cos(phi) * 15;
        const y1 = Math.sin(phi) * 15;
        const x2 = Math.cos(phi) * (40 + Math.sin(angle * 4 + i) * 6);
        const y2 = Math.sin(phi) * (40 + Math.sin(angle * 4 + i) * 6);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(168, 85, 247, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node dot
        ctx.beginPath();
        ctx.arc(x2, y2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#22d3ee' : '#c084fc';
        ctx.fill();
      }
      ctx.restore();

      angle += 0.015;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [isJarvisThinking]);

  // 5D Quantum Swarm particle animator
  useEffect(() => {
    if (selectedStrategy !== 'swarm-5d') return;
    const canvas = quantumSwarmCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      r: Math.random() * 2.5 + 1.2,
      phase: Math.random() * Math.PI * 2,
      targetNumber: Math.floor(Math.random() * 49) + 1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Orbital gravitational center points corresponding to proposed numbers
      const targets = proposedNumbers.map((num, i) => {
        const theta = (i * Math.PI * 2) / 6;
        return {
          num,
          x: canvas.width / 2 + Math.cos(theta) * 80,
          y: canvas.height / 2 + Math.sin(theta) * 55
        };
      });

      // Draw gravity hub linkages
      ctx.beginPath();
      for (let i = 0; i < targets.length; i++) {
        const next = targets[(i + 1) % targets.length];
        ctx.moveTo(targets[i].x, targets[i].y);
        ctx.lineTo(next.x, next.y);
      }
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      targets.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.stroke();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#06b6d4';
        ctx.textAlign = 'center';
        ctx.fillText(`Φ-${t.num}`, t.x, t.y + 4);
      });

      // Draw swarm particles
      particles.forEach(p => {
        // Gravitational pulling force toward closest hub
        let cx = canvas.width / 2;
        let cy = canvas.height / 2;
        if (targets.length > 0) {
          const closest = targets[p.targetNumber % targets.length];
          cx = closest.x;
          cy = closest.y;
        }

        const dx = cx - p.x;
        const dy = cy - p.y;
        const d = Math.sqrt(dx*dx + dy*dy) || 1;
        p.vx += (dx / d) * 0.04;
        p.vy += (dy / d) * 0.04;

        // Friction damper
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Draw connections
        particles.forEach(other => {
          const dist = Math.hypot(other.x - p.x, other.y - p.y);
          if (dist < 40) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 * (1 - dist / 40)})`;
            ctx.stroke();
          }
        });

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.targetNumber % 2 === 0 ? '#22d3ee' : '#a855f7';
        ctx.fill();
      });

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedStrategy, proposedNumbers]);

  // Rotating 4D Tesseract projection renderer
  useEffect(() => {
    if (selectedStrategy !== 'tesseract-4d') return;
    const canvas = tesseractCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let angleXW = 0.015;
    let angleYW = 0.01;
    let angleZW = 0.008;
    let angle3D_Y = 0;
    let angle3D_X = 0;

    // Define 16 vertices of a 4D Hypercube (Tesseract)
    const vertices4D = [
      [-1, -1, -1, -1], [1, -1, -1, -1], [-1, 1, -1, -1], [1, 1, -1, -1],
      [-1, -1, 1, -1], [1, -1, 1, -1], [-1, 1, 1, -1], [1, 1, 1, -1],
      [-1, -1, -1, 1], [1, -1, -1, 1], [-1, 1, -1, 1], [1, 1, -1, 1],
      [-1, -1, 1, 1], [1, -1, 1, 1], [-1, 1, 1, 1], [1, 1, 1, 1]
    ];

    // Find edges where vertices differ by exactly one coordinate
    const edges: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (vertices4D[i][k] !== vertices4D[j][k]) diff++;
        }
        if (diff === 1) {
          edges.push([i, j]);
        }
      }
    }

    // 4D Coordinate mapping for numbers 1 to 49
    const get4DCoordinate = (num: number) => {
      const idx = num - 1;
      const x = (idx % 3) - 1;
      const y = (Math.floor(idx / 3) % 3) - 1;
      const z = (Math.floor(idx / 9) % 3) - 1;
      const w = (Math.floor(idx / 27) % 3) - 1;
      return [x * 0.72, y * 0.72, z * 0.72, w * 0.72]; // scaled to sit beautifully inside hypercube
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.38;

      // 4D Rotation Function
      const rotate = (p: number[]) => {
        let [x, y, z, w] = p;

        // Rotate in XW-plane
        let cos = Math.cos(angleXW), sin = Math.sin(angleXW);
        let x1 = x * cos - w * sin;
        let w1 = x * sin + w * cos;

        // Rotate in YW-plane
        cos = Math.cos(angleYW); sin = Math.sin(angleYW);
        let y2 = y * cos - w1 * sin;
        let w2 = y * sin + w1 * cos;

        // Rotate in ZW-plane
        cos = Math.cos(angleZW); sin = Math.sin(angleZW);
        let z3 = z * cos - w2 * sin;
        let w3 = z * sin + w2 * cos;

        return [x1, y2, z3, w3];
      };

      // Project from 4D down to 3D and then to 2D
      const project = (p: number[]) => {
        const [x, y, z, w] = rotate(p);
        
        // Perspective projection from 4D to 3D
        const distance4D = 2.0;
        const factor4D = 1.0 / (distance4D - w);
        const x3d = x * factor4D;
        const y3d = y * factor4D;
        const z3d = z * factor4D;

        // Rotate 3D coordinates for a spinning camera angle
        let cosY = Math.cos(angle3D_Y), sinY = Math.sin(angle3D_Y);
        let rx1 = x3d * cosY - z3d * sinY;
        let rz1 = x3d * sinY + z3d * cosY;

        let cosX = Math.cos(angle3D_X), sinX = Math.sin(angle3D_X);
        let ry2 = y3d * cosX - rz1 * sinX;
        let rz2 = y3d * sinX + rz1 * cosX;

        // Front projection to 2D screen
        const distance3D = 2.0;
        const factor3D = 1.0 / (distance3D - rz2);
        
        return {
          x: cx + rx1 * factor3D * scale,
          y: cy + ry2 * factor3D * scale,
          depth: rz2
        };
      };

      // Project all 16 Tesseract vertices
      const projectedVertices = vertices4D.map(v => project(v));

      // Draw Tesseract wireframe edges
      ctx.lineWidth = 1;
      edges.forEach(([u, v]) => {
        const p1 = projectedVertices[u];
        const p2 = projectedVertices[v];
        
        const alpha = Math.min(1, Math.max(0.1, (p1.depth + p2.depth + 2) / 4));
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });

      // Draw tesseract outer vertex markers
      projectedVertices.forEach((p) => {
        const size = Math.max(1, 2.5 + p.depth * 1.5);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Plot all 49 numbers positions in their projected spaces
      const projNums: { x: number; y: number; num: number; depth: number }[] = [];
      for (let num = 1; num <= 49; num++) {
        const coord = get4DCoordinate(num);
        const p = project(coord);
        projNums.push({ x: p.x, y: p.y, num, depth: p.depth });
      }

      // Draw connections for the past draws (track the last drawings coordinate trails)
      const traceDraws = draws.slice(0, lookbackDepth);
      if (traceDraws.length > 0) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        
        let pathStarted = false;
        traceDraws.forEach(draw => {
          let centroidX = 0, centroidY = 0, centroidZ = 0, centroidW = 0;
          draw.numbers.forEach(num => {
            const coord = get4DCoordinate(num);
            centroidX += coord[0];
            centroidY += coord[1];
            centroidZ += coord[2];
            centroidW += coord[3];
          });
          const avgCoord = [centroidX / 6, centroidY / 6, centroidZ / 6, centroidW / 6];
          const p = project(avgCoord);
          
          if (!pathStarted) {
            ctx.moveTo(p.x, p.y);
            pathStarted = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        });
        ctx.stroke();

        // Draw node markers along the trail
        traceDraws.forEach((draw, i) => {
          let centroidX = 0, centroidY = 0, centroidZ = 0, centroidW = 0;
          draw.numbers.forEach(num => {
            const coord = get4DCoordinate(num);
            centroidX += coord[0];
            centroidY += coord[1];
            centroidZ += coord[2];
            centroidW += coord[3];
          });
          const avgCoord = [centroidX / 6, centroidY / 6, centroidZ / 6, centroidW / 6];
          const p = project(avgCoord);

          ctx.fillStyle = i === 0 ? '#06b6d4' : 'rgba(168, 85, 247, 0.65)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, i === 0 ? 4.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Highlight the 6 proposed predicting numbers
      proposedNumbers.forEach((num) => {
        const pNum = projNums.find(pn => pn.num === num);
        if (pNum) {
          ctx.save();
          // Draw a glowing crosshair and label
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pNum.x, pNum.y, 7, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
          ctx.beginPath();
          ctx.arc(pNum.x, pNum.y, 7 + Math.sin(angle3D_Y * 4) * 3, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(pNum.x, pNum.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(num.toString(), pNum.x, pNum.y + 12);
          ctx.restore();
        }
      });

      // Slowly increment angles for multi-dimensional rotations
      angleXW += 0.002;
      angleYW += 0.0015;
      angleZW += 0.001;
      angle3D_Y += 0.005;
      angle3D_X += 0.003;

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedStrategy, proposedNumbers, draws]);

  // Rotating Holographic Cyclic Prime Reciprocals Wheel renderer
  useEffect(() => {
    if (selectedStrategy !== 'cyclic-primes') return;
    const canvas = cyclicCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let rotationAngle = 0;
    const p = selectedCyclicPrime || 17;

    // Simulate division to get decimal repeating portion
    let remainder = 1;
    let decimalString = "";
    const seen: { [key: number]: number } = {};
    while (remainder !== 0) {
      if (remainder in seen) break;
      seen[remainder] = decimalString.length;
      remainder *= 10;
      const digit = Math.floor(remainder / p);
      decimalString += digit.toString();
      remainder %= p;
    }

    const len = decimalString.length || 1;

    let shiftOffset = 0;
    if (draws.length > 0) {
      const sortedLast = [...draws].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastSum = sortedLast[0].numbers.reduce((sum, n) => sum + n, 0);
      shiftOffset = lastSum % len;
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.38;

      // Draw outer dotted circle
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Draw main track circle
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw secondary inner track
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 20, 0, Math.PI * 2);
      ctx.stroke();

      // Draw radar sweep line
      const sweepAngle = (Date.now() / 2500) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
      ctx.stroke();

      // Calculate 2D position for each cyclic index
      const positions: { x: number; y: number; digit: string; index: number }[] = [];
      for (let i = 0; i < len; i++) {
        const angle = (i / len) * Math.PI * 2 + rotationAngle - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        positions.push({ x, y, digit: decimalString.charAt(i), index: i });
      }

      // Draw high-quality geometric star polygon connection loops
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      
      // Connect consecutive nodes
      for (let i = 0; i < len; i++) {
        const current = positions[i];
        const next = positions[(i + 1) % len];
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
      }
      ctx.stroke();

      // Connect star strides based on prime arithmetic skip-counts
      const step = Math.max(2, Math.floor(len / 4.5));
      ctx.beginPath();
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      for (let i = 0; i < len; i++) {
        const current = positions[i];
        const target = positions[(i + step) % len];
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(target.x, target.y);
      }
      ctx.stroke();

      // Highlight the active shiftOffset segment with a beautiful neon overlay wedge.
      const startWedge = ((shiftOffset - 0.5) / len) * Math.PI * 2 + rotationAngle - Math.PI / 2;
      const endWedge = ((shiftOffset + 0.5) / len) * Math.PI * 2 + rotationAngle - Math.PI / 2;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius + 10, startWedge, endWedge);
      ctx.closePath();
      ctx.fill();

      // Draw the digital index and actual nodes
      positions.forEach((pNode) => {
        const isCurrentOffset = pNode.index === shiftOffset;
        
        ctx.fillStyle = isCurrentOffset ? '#22d3ee' : 'rgba(168, 85, 247, 0.7)';
        ctx.beginPath();
        ctx.arc(pNode.x, pNode.y, isCurrentOffset ? 4 : 2, 0, Math.PI * 2);
        ctx.fill();

        let isPredicted = false;
        proposedNumbers.forEach(pNum => {
          let idxScan = shiftOffset;
          for (let k = 0; k < 6; k++) {
            const d1 = decimalString.charAt(idxScan % len);
            const d2 = decimalString.charAt((idxScan + 1) % len);
            const groupVal = parseInt(d1 + d2, 10);
            const rawNum = (groupVal % 49) + 1;
            if (rawNum === pNum) {
              if (pNode.index === idxScan % len || pNode.index === (idxScan + 1) % len) {
                isPredicted = true;
              }
            }
            idxScan++;
          }
        });

        if (isPredicted) {
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pNode.x, pNode.y, 8 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.font = isCurrentOffset ? 'bold 11px monospace' : '9px monospace';
        ctx.fillStyle = isCurrentOffset ? '#22d3ee' : isPredicted ? '#ffffff' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const pushRadius = radius + 12;
        const pushAngle = (pNode.index / len) * Math.PI * 2 + rotationAngle - Math.PI / 2;
        const tx = cx + Math.cos(pushAngle) * pushRadius;
        const ty = cy + Math.sin(pushAngle) * pushRadius;
        
        ctx.fillText(pNode.digit, tx, ty);
      });

      // Render Prime Reciprocal metadata labels
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#22d3ee';
      ctx.textAlign = 'center';
      ctx.fillText(`1 / ${p} (${len} DIGITS)`, cx, cy - 8);

      ctx.font = '8px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`SHIFT OFFSET: ${shiftOffset}`, cx, cy + 8);

      rotationAngle += 0.001;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedStrategy, selectedCyclicPrime, proposedNumbers, draws]);

  // E8 Lattice Quasi-Crystal Holographic Renderer
  useEffect(() => {
    if (selectedStrategy !== 'e8-katha') return;
    const canvas = e8KathaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let time = 0;
    
    // Simulate generation of quasi-crystal projection points from a pentagrid/8D lattice
    const kathaOffset = 1.414;
    const phi = 1.6180339887;
    const numPoints = 80;
    const points: {x: number, y: number, z: number, id: number}[] = [];
    
    for (let i = 0; i < numPoints; i++) {
        // Pseudo-random but deterministic spread covering an E8 projection look
        const r = Math.sqrt(i) * 12;
        const theta = i * phi * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        const z = (i % 2 === 0 ? 1 : -1) * (i * kathaOffset) % 20;
        points.push({ x, y, z, id: i + 1 });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Rotate camera angle
      const angle = time * 0.005;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Draw projected quasi-crystal connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          // Rotate Z/X
          const rx1 = p1.x * cosA - p1.z * sinA;
          const rz1 = p1.x * sinA + p1.z * cosA;
          // Scale by pseudo depth
          const scale1 = 200 / (200 + rz1);
          const px1 = cx + rx1 * scale1;
          const py1 = cy + p1.y * scale1;

          // Connect to nearby points for lattice effect
          for (let j = i + 1; j < Math.min(i + 5, points.length); j++) {
              const p2 = points[j];
              const rx2 = p2.x * cosA - p2.z * sinA;
              const rz2 = p2.x * sinA + p2.z * cosA;
              const scale2 = 200 / (200 + rz2);
              const px2 = cx + rx2 * scale2;
              const py2 = cy + p2.y * scale2;

              // Grid connection line
              const dist = Math.sqrt((px2-px1)**2 + (py2-py1)**2);
              if (dist < 40) {
                 ctx.strokeStyle = `rgba(168, 85, 247, ${1 - (dist / 40)})`;
                 ctx.beginPath();
                 ctx.moveTo(px1, py1);
                 ctx.lineTo(px2, py2);
                 ctx.stroke();
              }
          }

          // Draw the node
          ctx.fillStyle = (i % 3 === 0) ? '#22d3ee' : 'rgba(168, 85, 247, 0.4)';
          ctx.beginPath();
          ctx.arc(px1, py1, scale1 * 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Match our proposed numbers over the E8 array to make it look "quantum selected"
          let isTarget = false;
          let matchedNum = 0;
          for (let num of proposedNumbers) {
              // Just pseudo-map numbers to random nodes
              if (p1.id === (num % numPoints) + 1) {
                  isTarget = true;
                  matchedNum = num;
                  break;
              }
          }
          
          if (isTarget) {
              ctx.strokeStyle = '#22d3ee';
              ctx.beginPath();
              ctx.arc(px1, py1, scale1 * 6 + Math.sin(time * 0.1) * 2, 0, Math.PI * 2);
              ctx.stroke();
              
              ctx.font = 'bold 9px monospace';
              ctx.fillStyle = '#ffffff';
              ctx.fillText(matchedNum.toString(), px1, py1 - 8);
              
              // 0 / 1 quantum array holographic text element
              ctx.font = '6px monospace';
              ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
              ctx.fillText((Math.random() > 0.5 ? '1' : '0') + (Math.random() > 0.5 ? '1' : '0'), px1 + 8, py1 + 2);
          }
      }

      time++;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedStrategy, proposedNumbers]);

  // NEYƎИ Sequence / Flower of Life Renderer
  useEffect(() => {
    if (selectedStrategy !== 'neyen-seq') return;
    const canvas = neyenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let time = 0;

    const vortexSeq = [1, 2, 4, 8, 7, 5];
    const teslaSeq = [3, 6, 9];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw the Flower of Life geometry
      const R = 35; // base radius
      ctx.lineWidth = 1;
      
      const drawCircle = (x: number, y: number, alpha: number, strokeColor: string) => {
         ctx.beginPath();
         ctx.arc(x, y, R, 0, Math.PI * 2);
         ctx.strokeStyle = strokeColor;
         ctx.globalAlpha = alpha;
         ctx.stroke();
         ctx.globalAlpha = 1.0;
      };

      // Centers for Flower of Life
      const centers: {x: number, y: number, id: number}[] = [];
      let cId = 0;
      
      for (let a = -2; a <= 2; a++) {
         for (let b = -2; b <= 2; b++) {
            const hexX = cx + (a * R) + (b * R/2);
            const hexY = cy + (b * R * Math.sqrt(3)/2);
            const dist = Math.sqrt((hexX - cx)**2 + (hexY - cy)**2);
            // Confine to 2nd ring
            if (dist < R * 2.1) {
               centers.push({ x: hexX, y: hexY, id: cId++ });
            }
         }
      }

      // Draw petals and write numbers
      centers.forEach((pt, i) => {
         // Cycle opacity for wave effect
         const activeFactor = Math.sin(time*0.05 - Math.sqrt((pt.x-cx)**2 + (pt.y-cy)**2)*0.1)*0.5 + 0.5;
         
         drawCircle(pt.x, pt.y, 0.2 + activeFactor * 0.3, 'rgba(34, 211, 238, 1)');
         
         const isCenter = Math.abs(pt.x - cx) < 1 && Math.abs(pt.y - cy) < 1;
         
         // Inlay the Triadic/Vortex numbers inside petals
         const vNum = vortexSeq[i % vortexSeq.length];
         const tNum = teslaSeq[i % teslaSeq.length];
         
         ctx.font = '8px monospace';
         ctx.fillStyle = `rgba(168, 85, 247, ${0.4 + activeFactor*0.6})`;
         ctx.fillText(vNum.toString(), pt.x - 6, pt.y - 4);
         
         ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + activeFactor*0.6})`;
         ctx.fillText(tNum.toString(), pt.x + 2, pt.y + 8);
         
         if (isCenter) {
             ctx.fillStyle = '#fff';
             ctx.fillText("9", pt.x - 2, pt.y + 2);
         }
      });

      // Overlay the proposed targets atop the flower intersections
      proposedNumbers.forEach((num, idx) => {
         // pick pseudo-random valid intersections based on target num
         const targetCenter = centers[num % centers.length];
         
         ctx.beginPath();
         // Pulse circle
         ctx.arc(targetCenter.x, targetCenter.y, 8 + Math.sin(time*0.1 + idx)*4, 0, Math.PI*2);
         ctx.strokeStyle = 'rgba(252, 211, 77, 0.8)';
         ctx.lineWidth = 1.5;
         ctx.stroke();
         
         ctx.font = 'bold 11px monospace';
         ctx.fillStyle = '#fcd34d';
         ctx.fillText(num.toString(), targetCenter.x - 6, targetCenter.y + 4);
      });

      time++;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedStrategy, proposedNumbers]);

  // Numeric Word Value Root / Base-9 Renderer
  useEffect(() => {
    if (selectedStrategy !== 'numeric-word-value') return;
    const canvas = wordCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let time = 0;

    const phrases = [
      { num: 'ONE',  seq: '7246', text: 'One = 7246 = 7+2+4+6 = 1' },
      { num: 'TWO',  seq: '4672', text: 'Two = 4672  = 4+6+7+2 = 1' },
      { num: 'THREE',seq: '2467', text: 'Three = 2467 = 2+4+6+7 = 1' },
      { num: 'FOUR', seq: '6724', text: 'Four = 6724 = 6+7+2+4 = 1' },
      { num: 'FIVE', seq: '6724', text: 'Five = 6724  = 6+7+2+4 = 1' },
      { num: 'SIX',  seq: '7246', text: 'Six = 7246 = 7+2+4+6 = 1' },
      { num: 'SEVEN',seq: '2467', text: 'Seven = 2467 = 2+4+6+7= 1' },
      { num: 'EIGHT',seq: '4672', text: 'Eight = 4672 = 4+6+7+2 = 1' },
      { num: 'NINE', seq: '6724', text: 'Nine = 6724 = 6+7+2+4 = 1' },
      { num: 'BASE 9', seq: '9', text: '1+1+1+1+1+1+1+1+1 = 9' }
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw background flowing data lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
         ctx.beginPath();
         let yOffset = Math.sin(time*0.02 + i) * 60;
         ctx.moveTo(0, cy + yOffset);
         ctx.lineTo(canvas.width, cy + Math.cos(time*0.02 + i) * 60);
         ctx.stroke();
      }

      // Display the numeric loops
      phrases.forEach((phrase, idx) => {
          let lineY = 20 + (idx * 20);
          let shift = Math.sin(time*0.05 + idx)*5;
          let isFocus = Math.floor(time * 0.05) % phrases.length === idx;
          
          ctx.font = isFocus ? 'bold 11px monospace' : '10px monospace';
          ctx.fillStyle = isFocus ? '#22d3ee' : 'rgba(148, 163, 184, 0.6)';
          
          if (idx === phrases.length - 1) {
             // The master 9 sequence
             ctx.fillStyle = '#f59e0b';
             lineY += 10;
          }
          
          ctx.fillText(phrase.num, 20 + shift, lineY);
          
          ctx.fillStyle = isFocus ? '#a855f7' : 'rgba(168, 85, 247, 0.5)';
          ctx.fillText(phrase.seq, 120 + shift, lineY);
          
          ctx.fillStyle = isFocus ? '#fff' : 'rgba(255, 255, 255, 0.3)';
          ctx.fillText(phrase.text, 200 + shift, lineY);
      });

      // Overlay the proposed targets atop the grid
      proposedNumbers.forEach((num, idx) => {
         const tPos = (idx + 1) / (proposedNumbers.length + 1);
         const targetX = tPos * canvas.width;
         const targetY = cy + Math.sin(time*0.1+idx)*20;
         
         ctx.beginPath();
         // Pulse circle
         ctx.arc(targetX, targetY, 8 + Math.sin(time*0.1 + idx)*4, 0, Math.PI*2);
         ctx.strokeStyle = 'rgba(252, 211, 77, 0.8)';
         ctx.lineWidth = 1.5;
         ctx.stroke();
         
         ctx.font = 'bold 11px monospace';
         ctx.fillStyle = '#fcd34d';
         ctx.fillText(num.toString(), targetX - 6, targetY + 4);
      });

      time++;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedStrategy, proposedNumbers]);

  // Autonomous Omni-Quantum Nexus Renderer
  useEffect(() => {
    if (selectedStrategy !== 'omni-quantum-nexus') return;
    const canvas = omniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let time = 0;

    // We keep a history of "entangled particles"
    const particles = Array.from({length: 60}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 100, // pseudo depth
        speed: 0.5 + Math.random() * 1.5,
        angle: Math.random() * Math.PI * 2
    }));

    const render = () => {
      // Create trailing effect using semi-transparent fill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Update and draw particles forming a rotating autonomous core
      particles.forEach((p, i) => {
          // move particle towards a dynamic point
          const targetAngle = time * 0.02 + i * 0.1;
          const tx = cx + Math.cos(targetAngle) * (50 + Math.sin(time*0.05 + i)*20);
          const ty = cy + Math.sin(targetAngle) * (30 + Math.cos(time*0.04 + i)*15);
          
          p.x += (tx - p.x) * 0.05;
          p.y += (ty - p.y) * 0.05;
          
          const scale = (p.z / 100);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5 * scale, 0, Math.PI * 2);
          ctx.fillStyle = i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#a855f7' : '#fcd34d';
          ctx.fill();
          
          // Connect close particles (entanglement)
          particles.forEach((p2, j) => {
              if (i < j) {
                  const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
                  if (dist < 35) {
                      ctx.beginPath();
                      ctx.moveTo(p.x, p.y);
                      ctx.lineTo(p2.x, p2.y);
                      ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 - dist/35})`;
                      ctx.lineWidth = 0.5;
                      ctx.stroke();
                  }
              }
          });
      });
      
      // Draw a holographic overlay mapping the proposed numbers
      proposedNumbers.forEach((num, idx) => {
         const numAngle = (idx / 6) * Math.PI * 2 + time * 0.01;
         const nx = cx + Math.cos(numAngle) * 90;
         const ny = cy + Math.sin(numAngle) * 60;
         
         ctx.beginPath();
         // Hexagon around number
         for (let s=0; s<6; s++) {
             const angle = s * Math.PI / 3 + time*0.05;
             const hx = nx + Math.cos(angle) * 12;
             const hy = ny + Math.sin(angle) * 12;
             if (s===0) ctx.moveTo(hx, hy);
             else ctx.lineTo(hx, hy);
         }
         ctx.closePath();
         ctx.strokeStyle = 'rgba(252, 211, 77, 0.8)';
         ctx.lineWidth = 1.5;
         ctx.stroke();
         
         // Pulsing center line connecting to core
         ctx.beginPath();
         ctx.moveTo(nx, ny);
         ctx.lineTo(cx + Math.cos(numAngle)*40, cy + Math.sin(numAngle)*20);
         ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
         ctx.stroke();
         
         ctx.font = 'bold 11px monospace';
         ctx.fillStyle = '#fff';
         ctx.fillText(num.toString(), nx - 6, ny + 4);
      });
      
      // Data overlays
      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`AUTONOMOUS QUANTUM OMNI-ROUTINE: ${time.toString(16).toUpperCase()}`, 10, 15);
      ctx.fillText(`ENTANGLED NODES: ${particles.length}`, 10, 28);
      ctx.fillText(`A.I. STATUS: SYNTHESIZING`, 10, 41);

      time++;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedStrategy, proposedNumbers]);

  // Main mathematical calculation dispatch for the 9 Lotto options
  const calculateProposedNumbers = () => {
    if (draws.length === 0) return;
    const sortedLast = [...draws].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDraw = sortedLast[0];

    let result: number[] = [];

    switch (selectedStrategy) {
      case 'freq-10': {
        // Option 1: Choose the most likely set of numbers based on the drawn historical depth
        const pool = sortedLast.slice(0, lookbackDepth);
        const counts: { [key: number]: number } = {};
        for (let i = 1; i <= 49; i++) counts[i] = 0;

        pool.forEach(d => {
          d.numbers.forEach(num => {
            counts[num] = (counts[num] || 0) + 1;
          });
        });

        // Sort by occurrence desc, fallback key asc
        const sortedPool = Object.keys(counts)
          .map(Number)
          .sort((a, b) => {
            if (counts[b] !== counts[a]) {
              return counts[b] - counts[a];
            }
            return a - b;
          });

        result = sortedPool.slice(0, 6);
        break;
      }

      case 'avg-6': {
        // Option 2: Following sequences of historic draws; the averages of all the past draws in scope
        const pool = sortedLast.slice(0, lookbackDepth);
        if (pool.length === 0) {
          result = [5, 12, 19, 26, 33, 40];
          break;
        }

        // Calculate averages for position 1 to 6 (sorted)
        const posSums = [0, 0, 0, 0, 0, 0];
        pool.forEach(d => {
          const sorted = [...d.numbers].sort((a, b) => a - b);
          for (let i = 0; i < 6; i++) {
            posSums[i] += sorted[i] || 0;
          }
        });

        const averages = posSums.map(sum => Math.round(sum / pool.length));
        
        // De-duplicate check and keep in sorted order 1-49
        const finalSet = new Set<number>();
        averages.forEach(val => {
          let adjusted = Math.max(1, Math.min(49, val));
          while (finalSet.has(adjusted)) {
            adjusted++;
            if (adjusted > 49) adjusted = 1;
          }
          finalSet.add(adjusted);
        });

        result = Array.from(finalSet);
        break;
      }

      case '369-offset': {
        // Option 3: Choose numbers higher or lower by 3-6-9 pattern than the last draw.
        // Example: 16 first number -> can go to 13 or 19.
        // Let's take the last draw array, and apply the customized offsets369
        const base = [...lastDraw.numbers].sort((a, b) => a - b);
        const finalSet = new Set<number>();

        for (let i = 0; i < 6; i++) {
          const offset = offsets369[i] || 3;
          let calculated = base[i] + offset;
          
          // Wrap value inside [1, 49] boundaries
          if (calculated > 49) {
            calculated = ((calculated - 1) % 49) + 1;
          } else if (calculated < 1) {
            calculated = 49 - (Math.abs(calculated) % 49);
          }

          // Anti duplicate shift
          while (finalSet.has(calculated)) {
            calculated = (calculated % 49) + 1;
          }
          finalSet.add(calculated);
        }

        result = Array.from(finalSet);
        break;
      }

      case 'tri-grid': {
        // Option 4: 49 square triangulation. perfect box starting with 1 in the center, spiraling.
        // Take the active draws, map each coordinate to the spiral coordinates, compute centroid,
        // and find the closest perfect box nodes on-grid!
        const pool = sortedLast.slice(0, lookbackDepth);
        let countCoords = 0;
        let sumR = 0;
        let sumC = 0;

        pool.forEach(d => {
          d.numbers.forEach(num => {
            const coord = SPIRAL_MAP[num];
            if (coord) {
              sumR += coord.r;
              sumC += coord.c;
              countCoords++;
            }
          });
        });

        const centroidR = countCoords > 0 ? Math.round(sumR / countCoords) : 3;
        const centroidC = countCoords > 0 ? Math.round(sumC / countCoords) : 3;

        // Perfect geometric box values built starting outwards from the centroid
        // We find numbers located at offsets to make a bounding box or triangulation vertices
        const boxOffsets = [
          { dr: 0, dc: 0 },
          { dr: -1, dc: -1 },
          { dr: -1, dc: 1 },
          { dr: 1, dc: -1 },
          { dr: 1, dc: 1 },
          { dr: 0, dc: -2 }
        ];

        const finalSet = new Set<number>();
        boxOffsets.forEach(offset => {
          let tr = (centroidR + offset.dr + 7) % 7;
          let tc = (centroidC + offset.dc + 7) % 7;

          // Find which number maps to key (tr, tc)
          let matchedNum = 1;
          for (const keyStr of Object.keys(SPIRAL_MAP)) {
            const key = Number(keyStr);
            if (SPIRAL_MAP[key].r === tr && SPIRAL_MAP[key].c === tc) {
              matchedNum = key;
              break;
            }
          }

          while (finalSet.has(matchedNum)) {
            matchedNum = (matchedNum % 49) + 1;
          }
          finalSet.add(matchedNum);
        });

        result = Array.from(finalSet);
        break;
      }

      case 'secure-rand': {
        // Option 5: Randomized
        const set = new Set<number>();
        while (set.size < 6) {
          set.add(Math.floor(Math.random() * 49) + 1);
        }
        result = Array.from(set);
        break;
      }

      case 'cluster-agents': {
        // Option 6: AI agents sandbox finding clusters or gap connection coordinates
        // Let's identify the gaps between the last draw numbers
        const lastSorted = [...lastDraw.numbers].sort((a, b) => a - b);
        const gaps: number[] = [];
        for (let i = 0; i < lastSorted.length - 1; i++) {
          gaps.push(Math.round((lastSorted[i] + lastSorted[i + 1]) / 2));
        }
        // Append bounding margins
        gaps.push(Math.round((lastSorted[lastSorted.length - 1] + 49) / 2) % 49 || 1);
        gaps.push(Math.round((1 + lastSorted[0]) / 2));

        const finalSet = new Set<number>();
        gaps.forEach(g => {
          let num = g;
          if (num < 1) num = 1;
          if (num > 49) num = 49;
          while (finalSet.size < 6 && finalSet.has(num)) {
            num = (num % 49) + 1;
          }
          finalSet.add(num);
        });
        
        while (finalSet.size < 6) {
          finalSet.add(Math.floor(Math.random() * 49) + 1);
        }
        result = Array.from(finalSet);
        break;
      }

      case 'chain-3m': {
        // Option 7: Scan historical depth and calculate consecutive transition nodes or chains
        const pool = sortedLast.slice(0, lookbackDepth);
        const nextDrawWeights: { [key: number]: number } = {};
        for (let i = 1; i <= 49; i++) nextDrawWeights[i] = 1;

        // Accumulate sequential occurrences: if a draw has number n, we increment neighbors
        pool.forEach(d => {
          d.numbers.forEach(num => {
            const prev = num - 1 < 1 ? 49 : num - 1;
            const next = num + 1 > 49 ? 1 : num + 1;
            nextDrawWeights[prev] += 5;
            nextDrawWeights[next] += 5;
            nextDrawWeights[num] += 2;
          });
        });

        // Grab top weighted
        const sortedByTransition = Object.keys(nextDrawWeights)
          .map(Number)
          .sort((a, b) => nextDrawWeights[b] - nextDrawWeights[a]);

        result = sortedByTransition.slice(0, 6);
        break;
      }

      case 'swarm-5d': {
        // Option 8: Swarm AI 5D quantum problem solving waves
        // Harmonic superpositions using sine weights based on coordinates
        const scalar = 0.543;
        const weights = Array.from({ length: 49 }, (_, idx) => {
          const num = idx + 1;
          let superposedVal = 0;
          lastDraw.numbers.forEach(ldn => {
            superposedVal += Math.sin(num * ldn * scalar) + Math.cos(num + ldn);
          });
          return { num, val: Math.abs(superposedVal) };
        });

        weights.sort((a, b) => b.val - a.val);
        result = weights.slice(0, 6).map(w => w.num);
        break;
      }

      case 'peptide-fold': {
        // Option 9: Alpha Folding Peptide AI Folding sequence
        // We map each drawing value to indices on a virtual Helix loop, translating numbers to folded peptides
        // Amino acids: A R N D C E Q G H I L K M F P S T W Y V (20 acids)
        // Numbers 1-20 are core amino anchors, 21-49 are hydrogen binding loops coordinates.
        // We fold 6 segments starting using last draw coordinates
        const anchors = lastDraw.numbers.map(num => {
          const residueIndex = (num % 20) + 1;
          const foldAngle = (num * 15) % 360;
          return { num, residueIndex, foldAngle };
        });

        const finalSet = new Set<number>();
        anchors.forEach((residue, idx) => {
          // calculate geometric folding step: anchor + step offset
          const stepOffset = Math.round(Math.sin(residue.foldAngle * Math.PI / 180) * 10);
          let foldCoordinate = Math.abs(residue.num + stepOffset) % 49 || 1;
          while (finalSet.has(foldCoordinate)) {
            foldCoordinate = (foldCoordinate % 49) + 1;
          }
          finalSet.add(foldCoordinate);
        });

        result = Array.from(finalSet);
        break;
      }

      case 'tesseract-4d': {
        // Option 10: 4D Tesseract Dimension Projection Lookback
        // Group previous draws in 4D, extract their centroids series, and extrapolate next barycenter velocity!
        const pool = sortedLast.slice(0, lookbackDepth);
        if (pool.length < 2) {
          result = [4, 15, 23, 27, 33, 41];
          break;
        }

        const get4DCoord = (num: number) => {
          const idx = num - 1;
          const x = (idx % 3) - 1;
          const y = (Math.floor(idx / 3) % 3) - 1;
          const z = (Math.floor(idx / 9) % 3) - 1;
          const w = (Math.floor(idx / 27) % 3) - 1;
          return [x, y, z, w];
        };

        // Compute centroids of last draws
        const getCentroid = (draw: LottoDraw) => {
          let sx = 0, sy = 0, sz = 0, sw = 0;
          draw.numbers.forEach(num => {
            const coord = get4DCoord(num);
            sx += coord[0];
            sy += coord[1];
            sz += coord[2];
            sw += coord[3];
          });
          return [sx / 6, sy / 6, sz / 6, sw / 6];
        };

        const c1 = getCentroid(pool[0]);
        const c2 = getCentroid(pool[1]);
        
        // Extrapolate velocity vector to next barycenter coordinate
        const velocity = [c1[0] - c2[0], c1[1] - c2[1], c1[2] - c2[2], c1[3] - c2[3]];
        const predictedCentroid = [
          c1[0] + velocity[0] * 0.5,
          c1[1] + velocity[1] * 0.5,
          c1[2] + velocity[2] * 0.5,
          c1[3] + velocity[3] * 0.5
        ];

        // Rank all 49 numbers by Euclidean distance to predicted centroid
        const numbersRanked = Array.from({ length: 49 }, (_, i) => {
          const num = i + 1;
          const coord = get4DCoord(num);
          const dist = Math.sqrt(
            Math.pow(coord[0] - predictedCentroid[0], 2) +
            Math.pow(coord[1] - predictedCentroid[1], 2) +
            Math.pow(coord[2] - predictedCentroid[2], 2) +
            Math.pow(coord[3] - predictedCentroid[3], 2)
          );
          return { num, dist };
        });

        // Filter or sort by smallest distance
        numbersRanked.sort((a, b) => a.dist - b.dist);
        
        // Take 6 unique closest numbers
        const selectedSet = new Set<number>();
        for (let idx = 0; idx < numbersRanked.length && selectedSet.size < 6; idx++) {
          selectedSet.add(numbersRanked[idx].num);
        }
        result = Array.from(selectedSet);
        break;
      }

      case 'cyclic-primes': {
        // Option 11: Cyclic Prime Reciprocals Sequence Fold
        // Uses arbitrary-precision long division to find repeating decimal of 1/p.
        // Cyclic numbers are shift-invariant; we offset the cycle based on history (recent sum)
        // and group adjacent digits into modular target coordinates of [1 - 49].
        const p = selectedCyclicPrime || 17;
        
        // Simulates division to construct the cyclic string
        let remainder = 1;
        let decimalString = "";
        const seen: { [key: number]: number } = {};
        while (remainder !== 0) {
          if (remainder in seen) break;
          seen[remainder] = decimalString.length;
          remainder *= 10;
          const digit = Math.floor(remainder / p);
          decimalString += digit.toString();
          remainder %= p;
        }

        const len = decimalString.length;
        if (len === 0) {
          result = [7, 17, 19, 23, 29, 47];
          break;
        }

        // Calculate a cyclic shift based on the sum of the last draw
        let shiftOffset = 0;
        if (sortedLast.length > 0) {
          const lastSum = sortedLast[0].numbers.reduce((sum, n) => sum + n, 0);
          shiftOffset = lastSum % len;
        }

        const finalSet = new Set<number>();
        // Scan through the cyclic string starting at shiftOffset, extracting 2-digit groups
        let scanIndex = shiftOffset;
        let protectionCounter = 0;
        while (finalSet.size < 6 && protectionCounter < 100) {
          protectionCounter++;
          const d1 = decimalString.charAt(scanIndex % len);
          const d2 = decimalString.charAt((scanIndex + 1) % len);
          const groupVal = parseInt(d1 + d2, 10);
          const rawNum = (groupVal % 49) + 1;
          
          if (!finalSet.has(rawNum)) {
            finalSet.add(rawNum);
          }
          // Shift scan index by 1
          scanIndex += 1;
        }

        // If not enough numbers, pad with backup
        const backups = [7, 17, 19, 23, 29, 47];
        let backupIdx = 0;
        while (finalSet.size < 6 && backupIdx < backups.length) {
          const val = backups[backupIdx];
          if (!finalSet.has(val)) {
            finalSet.add(val);
          }
          backupIdx++;
        }

        result = Array.from(finalSet);
        break;
      }

      case 'e8-katha': {
        // Option 12: E8 Lattice quasi-crystal projection using Katha grid offset (1.414)
        // We use the golden ratio and sqrt(2) to project pseudo-quantum offsets.
        const pool = sortedLast.slice(0, lookbackDepth);
        const kathaOffset = 1.414; // Sqrt(2) approximation as requested
        
        let initialSeed = 42; // Base quantum seed
        if (pool.length > 0) {
          // Use historical depth to seed the lattice projection
          initialSeed = pool.reduce((acc, draw) => acc + draw.numbers.reduce((s, n) => s + n, 0), 0);
        }

        const selectedSet = new Set<number>();
        let iter = 1;
        while (selectedSet.size < 6 && iter < 100) {
          // Generate a pseudo-quantum holographic interference pattern state (using Phi and Root 2)
          const phi = 1.6180339887;
          const root2 = kathaOffset;
          
          // E8 lattice quasi-crystal projection simplified to 1-49 mapping
          // (iter * seed * phi) modulo projection against Katha offset array
          const rawMod = (iter * initialSeed * phi * (root2 * (iter % 3 === 0 ? 1 : 0.5))) % 49;
          const mappedVal = Math.floor(rawMod) + 1;
          
          // Apply binary quantum holographic filter (simulate 0/1 array materializing to state 3)
          // If the bitwise parity of the lattice point mixed with the quantum state modulo 3 == it selects
          const quantumState = (Math.floor(mappedVal * root2) % 2) ^ (iter % 2); 
          
          if (!selectedSet.has(mappedVal)) {
            selectedSet.add(mappedVal);
          }
          iter++;
        }
        
        // Backup
        if (selectedSet.size < 6) {
             const backups = [8, 16, 24, 32, 40, 48];
             for (const b of backups) {
                 if (selectedSet.size >= 6) break;
                 selectedSet.add(b);
             }
        }
        result = Array.from(selectedSet);
        break;
      }

      case 'neyen-seq': {
        // Option 13: NEYƎИ Sequence / Flower of Life 
        // Triadic Energy Balance mapping 1,2,4,8,7,5 and 3,6,9
        const pool = sortedLast.slice(0, lookbackDepth);
        const selectedSet = new Set<number>();
        
        const vortexSeq = [1, 2, 4, 8, 7, 5];
        const teslaSeq = [3, 6, 9];
        
        let poolSum = pool.reduce((acc, draw) => acc + draw.numbers.reduce((a, b) => a + b, 0), 0);
        
        // Digital root helper
        const digRoot = (n: number) => {
            let root = n % 9;
            return root === 0 && n > 0 ? 9 : root;
        };
        
        let currentRoot = digRoot(poolSum || 137); // Starting with 137 based on user reference
        let iter = 0;
        
        while (selectedSet.size < 6 && iter < 100) {
            let v = vortexSeq[iter % vortexSeq.length];
            let t = teslaSeq[iter % teslaSeq.length];
            
            // Map the geometric sequences to a numeric projection
            let stepVal = (v * currentRoot) + (t * (iter + 1)) + (iter * 137);
            
            // Expand to the 1-49 field
            let expanded = (stepVal % 49) + 1;
            
            if (!selectedSet.has(expanded)) {
               selectedSet.add(expanded);
            }
            
            currentRoot = digRoot(stepVal);
            iter++;
        }
        
        // Backup filling
        if (selectedSet.size < 6) {
           const backups = [3, 6, 9, 12, 15, 27];
           for (const b of backups) {
               if (selectedSet.size >= 6) break;
               selectedSet.add(b);
           }
        }
        result = Array.from(selectedSet);
        break;
      }

      case 'numeric-word-value': {
        // Option 14: Numeric Word Value Root / Base-9 Mapping
        // Based on the recursive loops of letter counts to digital roots
        // ONE(3)->THREE(5)->FIVE(4)->FOUR(4)... 
        // We use the derived word pattern sums (7246, 4672, 2467, 6724) to map into the 1-49 field
        const pool = sortedLast.slice(0, lookbackDepth);
        const selectedSet = new Set<number>();
        
        let poolSum = pool.reduce((acc, draw) => acc + draw.numbers.reduce((a, b) => a + b, 0), 0);
        
        // Loop values based on the word patterns described by the user
        const loops = [
            [7, 2, 4, 6], // ONE, SIX
            [4, 6, 7, 2], // TWO, EIGHT
            [2, 4, 6, 7], // THREE, SEVEN
            [6, 7, 2, 4]  // FOUR, FIVE, NINE
        ];
        
        let iter = 0;
        let cId = poolSum % loops.length;
        
        while (selectedSet.size < 6 && iter < 100) {
            let activeLoop = loops[cId];
            let activeVal = activeLoop[iter % activeLoop.length];
            
            // Extrapolate the base value to the 49 field using depth and iteration
            let mappedVal = ((activeVal * (iter + 1) * 7) + poolSum) % 49 + 1;
            
            if (!selectedSet.has(mappedVal)) {
                selectedSet.add(mappedVal);
            }
            
            // Shift the loop
            cId = (cId + activeVal) % loops.length;
            iter++;
        }
        
        // Backup
        if (selectedSet.size < 6) {
           const backups = [7, 14, 21, 28, 35, 42];
           for (const b of backups) {
               if (selectedSet.size >= 6) break;
               selectedSet.add(b);
           }
        }
        result = Array.from(selectedSet);
        break;
      }

      case 'omni-quantum-nexus': {
        // Option 15: Autonomous Omni-Quantum Nexus
        // Generates an independent, superposed quantum set derived from combining primes, E8, and NEYEN states
        const pool = sortedLast.slice(0, lookbackDepth);
        const selectedSet = new Set<number>();
        
        let dynamicSeed = pool.length > 0 ? pool[0].numbers.reduce((a,b)=>a+b, 0) : 137;
        
        // Use a mix of techniques previously developed
        const shifts = [1.618, 1.414, 3.1415, 2.718];
        
        let iter = 1;
        while (selectedSet.size < 6 && iter < 100) {
            let activeShift = shifts[iter % shifts.length];
            
            // Quantum calculation: applying Phi/Pi to the historical root with an iteration harmonic
            let qState = (dynamicSeed * activeShift) + (Math.sin(iter * 0.5) * 100);
            
            // Wrap to 1-49
            let targetVal = Math.floor(Math.abs(qState) % 49) + 1;
            
            if (!selectedSet.has(targetVal)) {
                selectedSet.add(targetVal);
            }
            iter++;
        }
        
        // Self-correction fallback
        if (selectedSet.size < 6) {
            const entangledBackups = [11, 22, 33, 44, 5, 25];
            for (const b of entangledBackups) {
                if (selectedSet.size >= 6) break;
                selectedSet.add(b);
            }
        }
        
        result = Array.from(selectedSet);
        break;
      }
    }

    setProposedNumbers(result.sort((a, b) => a - b));
  };

  // Simulated Python 6-49-Processing-System.py verification engine
  const runPythonDiagnostics = () => {
    if (proposedNumbers.length !== 6) return;
    setIsTerminalRunning(true);
    setTerminalLogs([
      `$ python 6-49-Processing-System.py --concentric-vTC --check [${proposedNumbers.join(', ')}]`,
      "[TELEMETRY ENGINE] Loading historical draws from database...",
      `[TELEMETRY ENGINE] Verifying combination validation parameters: [Sum limit: ${minSumFilter}-${maxSumFilter}, Max consecutive limit: ${maxConsecutiveFilter}]`
    ]);

    const logLines: string[] = [];
    const sortedNums = [...proposedNumbers].sort((a,b)=>a-b);
    
    // 1. Sum Range
    const totalSum = sortedNums.reduce((s,x)=>s+x, 0);
    const sumPassed = totalSum >= minSumFilter && totalSum <= maxSumFilter;
    logLines.push(`[FILTER 1/5] Sum check: Total sum ${totalSum} in [${minSumFilter}-${maxSumFilter}] => ${sumPassed ? '✔ PASS' : '✘ CRITICAL OUT OF RANGE'}`);

    // 2. Odd-to-Even Ratio
    const oddCount = sortedNums.filter(x => x % 2 !== 0).length;
    const evenCount = 6 - oddCount;
    const ratioPassed = !avoidExtremeRatios || (oddCount > 0 && oddCount < 6);
    logLines.push(`[FILTER 2/5] Odd/Even balances: ${oddCount} Odd, ${evenCount} Even [Ratio: ${oddCount}:${evenCount}] => ${ratioPassed ? '✔ BALANCED' : '✘ EXTREME COGNITION SKEW'}`);

    // 3. High-to-Low Split
    const lowCount = sortedNums.filter(x => x <= 24).length;
    const highCount = 6 - lowCount;
    const splitPassed = !avoidExtremeRatios || (lowCount > 0 && lowCount < 6);
    logLines.push(`[FILTER 3/5] High/Low split balances: ${lowCount} Low, ${highCount} High [Split: ${lowCount}:${highCount}] => ${splitPassed ? '✔ BALANCED' : '✘ FIELD CONCENTRATION TRIGGER'}`);

    // 4. Consecutive Node Check
    let maxConsecutive = 1;
    let curr = 1;
    for (let i = 0; i < sortedNums.length - 1; i++) {
      if (sortedNums[i+1] - sortedNums[i] === 1) {
        curr++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, curr);
        curr = 1;
      }
    }
    maxConsecutive = Math.max(maxConsecutive, curr);
    const consecutivePassed = maxConsecutive <= maxConsecutiveFilter;
    logLines.push(`[FILTER 4/5] Consecutive sequences: Max consecutive streak is ${maxConsecutive} (Limit: <= ${maxConsecutiveFilter}) => ${consecutivePassed ? '✔ SEGMENT SHIELD ACTIVE' : '✘ SEGMENT VIOLATED'}`);

    // 5. Overlap Guard
    let overlapFault = false;
    let worstOverlapVal = 0;
    let worstOverlapDate = "";
    draws.slice(0, 10).forEach(d => {
      const intersect = d.numbers.filter(n => sortedNums.includes(n)).length;
      if (intersect > worstOverlapVal) {
        worstOverlapVal = intersect;
        worstOverlapDate = d.date;
      }
      if (intersect >= 5) overlapFault = true;
    });
    const overlapPassed = !overlapFault;
    logLines.push(`[FILTER 5/5] Historical duplication protection: Max overlaps with past draws is ${worstOverlapVal} units => ${overlapPassed ? '✔ PERFECT DIVERGENCE' : '✘ EXCESSIVE OVERLAP DETECTED'}`);

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < logLines.length) {
        const lineText = logLines[currentLine];
        setTerminalLogs(prev => [...prev, lineText]);
        currentLine++;
      } else {
        clearInterval(interval);
        const overallSuccess = sumPassed && ratioPassed && splitPassed && consecutivePassed && overlapPassed;
        setTerminalLogs(prev => [
          ...prev,
          overallSuccess 
            ? `[SUCCESS] python 6-49-Processing-System.py completed checks. ALL FILTER CRITERIA APPROVED.`
            : `[FILTER FAILED] python 6-49-Processing-System.py returned filter faults. Recalibrating coordinates...`
        ]);
        setIsTerminalRunning(false);
      }
    }, 285);
  };

  useEffect(() => {
    if (proposedNumbers.length === 6) {
      runPythonDiagnostics();
    }
  }, [proposedNumbers, minSumFilter, maxSumFilter, maxConsecutiveFilter, avoidExtremeRatios]);

  // Submit message to Jarvis API endpoint
  const sendJarvisMessage = async (msgText: string = userInput) => {
    if (!msgText.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsJarvisThinking(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
          })),
          selectedStrategy: STRATEGIES.find(s => s.id === selectedStrategy)?.name,
          listPastDraws: draws.slice(0, lookbackDepth).map(d => `Draw Date ${d.date}: ${d.numbers.join(',')}`),
          currentProposedNumbers: proposedNumbers,
          lookbackDepth: lookbackDepth
        })
      });

      const data = await response.json();
      const replyContent = data.text || " सिनैप्स बाधित synapsis offline. Standby for reboot.";

      const jarvisMessage: Message = {
        id: Math.random().toString(),
        role: 'jarvis',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, jarvisMessage]);
      // Play voice output if enabled
      if (isTTSEnabled) {
        playSpeech(replyContent);
      }
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: 'jarvis',
        content: "[DIAGNOSTIC WARNING] Direct neural synapse disrupted. Heavy static on link. Re-routing computational pathways...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsJarvisThinking(false);
    }
  };

  // Add customized past drawing to the database
  const handleAddDraw = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawError(null);

    // Validate date has value
    if (!newDate) {
      setDrawError("Invalid calendar date selection.");
      return;
    }

    // Parse comma separated values
    const parts = newNumbers.split(/[\s,]+/).map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
    if (parts.length !== 6) {
      setDrawError("You must provide exactly six numbers (e.g. 4, 15, 23, 27, 33, 41)");
      return;
    }

    // Validate bounds
    const invalid = parts.some(n => n < 1 || n > 49);
    if (invalid) {
      setDrawError("All input nodes must operate strictly between bounds [1 - 49]");
      return;
    }

    // Validate unique
    const unique = new Set(parts);
    if (unique.size !== 6) {
      setDrawError("Lot drawings do not permit node duplication. Numbers must be unique.");
      return;
    }

    const sortedDraw = [...parts].sort((a,b) => a-b);
    const item: LottoDraw = {
      id: Math.random().toString(),
      date: newDate,
      numbers: sortedDraw
    };

    setDraws(prev => [item, ...prev]);
    setNewNumbers('');
    setDrawError(null);

    // Prompt Jarvis to comment on user added draw
    const msg = `System update: I added a new Lotto 6/49 drawing on ${newDate} representing coordinates: ${sortedDraw.join(', ')}. Please analyze system recalibration.`;
    sendJarvisMessage(msg);
  };

  const handleResetDraws = () => {
    if (window.confirm("Restore Lotto 649 database to historical presets?")) {
      setDraws(DEFAULT_DRAWS);
    }
  };

  const handleDeleteDraw = (id: string) => {
    setDraws(prev => prev.filter(d => d.id !== id));
  };

  const handleTriggerRandomScroll = () => {
    if (isRandomizing) return;
    setIsRandomizing(true);
    let counter = 0;
    const interval = setInterval(() => {
      // Stream rapid raw random grids
      setProposedNumbers(Array.from({ length: 6 }, () => Math.floor(Math.random() * 49) + 1).sort((a,b)=>a-b));
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        calculateProposedNumbers();
        setIsRandomizing(false);
      }
    }, 70);
  };

  const handleCopyNumbers = () => {
    navigator.clipboard.writeText(proposedNumbers.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToDatabase = () => {
    const today = new Date().toISOString().split('T')[0];
    const item: LottoDraw = {
      id: Math.random().toString(),
      date: today,
      numbers: [...proposedNumbers]
    };
    setDraws(prev => [item, ...prev]);
    alert(`Proposed numbers [${proposedNumbers.join(', ')}] applied to draw database for date ${today}!`);
  };

  // Toggle individual offsets in 369 cascade mode
  const handleToggleOffsetDirection = (index: number) => {
    setOffsets369(prev => {
      const copy = [...prev];
      copy[index] = -copy[index]; // reverse polarities of the offset
      return copy;
    });
  };

  const handleCycleOffsetValue = (index: number) => {
    setOffsets369(prev => {
      const copy = [...prev];
      const sign = Math.sign(copy[index]) || 1;
      const absVal = Math.abs(copy[index]);
      let nextVal = 3;
      if (absVal === 3) nextVal = 6;
      else if (absVal === 6) nextVal = 9;
      else if (absVal === 9) nextVal = 3;
      copy[index] = nextVal * sign;
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Background Matrix Starfield effect using CSS */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(15,23,42,0.8),rgba(2,6,23,1))] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none z-0"></div>

      {/* TOP DECK HEADER */}
      <header className="z-10 bg-slate-900/85 backdrop-blur-md border-b border-cyan-500/20 py-3.5 px-6 flex justify-between items-center relative">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center bg-cyan-950 rounded-lg border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <Cpu className="text-cyan-400 w-5 h-5 animate-pulse" />
            <div className="absolute inset-0 rounded-lg bg-cyan-400/10 animate-ping pointer-events-none duration-1000"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">bet49</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">Jarvis vTC-649</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight">LOTTO 649 MULTI-STRATEGY AI TACTICAL HUB</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button 
            id="tts-toggle-btn"
            onClick={() => {
              const nextState = !isTTSEnabled;
              setIsTTSEnabled(nextState);
              if (nextState) {
                playSpeech("J.A.R.V.I.S. voice synchronizer activated. Central diagnostics at your service.");
              } else {
                window.speechSynthesis.cancel();
              }
            }}
            className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-300 ${
              isTTSEnabled 
                ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {isTTSEnabled ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>VOICE: {isTTSEnabled ? 'ONLINE' : 'MUTED'}</span>
          </button>

          {/* Swipe Portal button */}
          <button 
            id="menu-wclc-btn"
            onClick={() => setIsWCLCStreamOpen(!isWCLCStreamOpen)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-mono px-4 py-2 rounded-lg shadow-lg border border-cyan-400/20 transition-all duration-300"
          >
            <Menu className="w-4 h-4" />
            <span>OFFICIAL TRANSCRIPT PANEL</span>
          </button>
        </div>
      </header>

      {/* CORE DISPLAY FLOOR */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 z-10 overflow-hidden relative">

        {/* LEFT COLUMN: SYSTEM DATA HUB & DRAW MANAGER */}
        <section className="xl:col-span-1 flex flex-col gap-5 max-h-[85vh] overflow-y-auto pr-1">
          
          {/* Jarvis Pulsing Sphere Container */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-xl p-5 flex flex-col items-center justify-center relative group shadow-[inset_0_2px_15px_rgba(6,182,212,0.02)]">
            <span className="text-[10px] font-mono text-cyan-500/60 tracking-wider absolute top-3 left-4 uppercase">SYSTEM CORE PULSE</span>
            
            <div className="relative mt-2">
              <canvas 
                id="jarvisBrainCanvas" 
                ref={jarvisBrainCanvasRef} 
                width={150} 
                height={150} 
                className="cursor-pointer"
                onClick={() => {
                  playSpeech("Brain diagnostics running at full capacity. Super-dimensional calculations synchronized.");
                  sendJarvisMessage("Run systematic check on node convergence.");
                }}
              />
            </div>

            <div className="text-center mt-3">
              <h3 className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">J.A.R.V.I.S. DIAGNOSTICS</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-1 px-4 leading-relaxed">
                Click neural ring to prompt diagnostics sequence. Standard calculations optimized across {draws.length} past drawings.
              </p>
            </div>
          </div>

          {/* Lotto 649 Historical Data Panel */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-mono font-bold tracking-wider text-cyan-400">DRAW CORRELATOR ({draws.length})</h2>
              </div>
              <button 
                id="reset-draw-btn"
                onClick={handleResetDraws}
                className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-colors"
                title="Restore default parameters"
              >
                RESTORE DEFAULT
              </button>
            </div>

            {/* Quick Draw Addition Form */}
            <form onSubmit={handleAddDraw} className="flex flex-col gap-2.5 bg-slate-950/80 p-3 rounded-lg border border-cyan-500/10">
              <span className="text-[10px] font-mono text-cyan-500/70 tracking-wider">APPEND ACTUAL DRAWING RECORD</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1">RECORD DATE :</label>
                  <input 
                    id="new-date-input"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded text-xs px-2 py-1 text-slate-200 outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-500 block mb-1">NUMBERS (6):</label>
                  <input 
                    id="new-numbers-input"
                    type="text"
                    placeholder="e.g. 5,12,23,31,44,48"
                    value={newNumbers}
                    onChange={(e) => setNewNumbers(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded text-xs px-2 py-1 text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {drawError && <p className="text-[10px] text-red-400 font-mono">{drawError}</p>}

              <button 
                id="submit-draw-btn"
                type="submit"
                className="w-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 text-[10px] font-mono py-1 rounded border border-cyan-500/20 transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>APPEND TO DATABASE</span>
              </button>
            </form>

            {/* Draw Database List */}
            <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-800">
              {draws.map((d, index) => (
                <div 
                  key={d.id} 
                  className={`flex justify-between items-center p-2 rounded text-xs font-mono border transition-colors ${
                    index === 0 ? 'bg-cyan-950/20 border-cyan-500/25' : 'bg-slate-950/60 border-slate-900'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{d.date}</span>
                      {index === 0 && <span className="text-[8px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1 py-0.2 rounded font-mono">LASTEST DATA</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {d.numbers.map((n, i) => (
                        <span 
                          key={i} 
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-900/90 text-cyan-300 font-bold border border-slate-800 text-[10px]"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    id={`delete-draw-btn-${d.id}`}
                    onClick={() => handleDeleteDraw(d.id)}
                    className="text-slate-600 hover:text-red-400 p-1.5 transition-colors"
                    title="Remove draw"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MIDDLE TWO COLUMNS: THE STRATEGY MATRIX & INTERACTIVE COMPUTATION TAB */}
        <section className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Active Navigation Options Tab Rack */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-2.5 grid grid-cols-3 md:grid-cols-5 xl:grid-cols-3 gap-2 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
            {STRATEGIES.map((strat) => (
              <button
                key={strat.id}
                id={`strategy-tab-${strat.id}`}
                onClick={() => setSelectedStrategy(strat.id)}
                className={`p-2 rounded-lg text-left transition-all duration-300 flex flex-col justify-between h-[68px] border ${
                  selectedStrategy === strat.id
                    ? 'bg-gradient-to-br from-cyan-950 to-slate-950 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/40 hover:bg-slate-900 text-slate-400 border-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="text-[10px] font-mono leading-tight font-bold tracking-tight uppercase line-clamp-1">{strat.name}</span>
                  {selectedStrategy === strat.id && <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />}
                </div>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2 mt-1">{strat.desc}</p>
              </button>
            ))}
          </div>

          {/* MASTER VISUAL COMPUTATION DECK */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col flex-1 shadow-xl min-h-[460px] justify-between relative overflow-hidden">
            <span className="text-[10px] font-mono text-cyan-400/50 absolute top-4 right-6 tracking-widest">VISUAL METRIC CORE</span>
            
            {/* Strategy Title Display */}
            <div className="border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-mono font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-widest flex items-center justify-between">
                <span>{STRATEGIES.find(s => s.id === selectedStrategy)?.name}</span>
                <span className="text-[10px] text-slate-500 font-normal">VOLATILITY OVERLAY ACTIVE</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {STRATEGIES.find(s => s.id === selectedStrategy)?.desc}
              </p>
            </div>

            {/* VOLATILITY TREND CHART (Recharts) */}
            <div className="w-full h-[260px] mb-4 bg-slate-950 rounded-xl p-3 border border-slate-800/80 relative overflow-hidden shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
              
              {/* HUD Decorative Elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-500/50 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500/50 rounded-br-xl"></div>

              <div className="flex justify-between items-center mb-4 z-10 relative px-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  LAST 10 DRAWS TRAJECTORY / VOLATILITY
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase">
                  Y-AXIS: SUM
                </span>
              </div>

              <ResponsiveContainer width="100%" height="85%">
                {(() => {
                  const chartDraws = draws.slice(0, 10).reverse();
                  const data = chartDraws.map((d, i) => ({
                    name: `D-${i + 1}`,
                    sum: d.numbers.reduce((acc, c) => acc + c, 0)
                  }));
                  const proposedSum = proposedNumbers.reduce((acc, c) => acc + c, 0);

                  return (
                    <RechartsLineChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={true} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        fontFamily="monospace"
                        dy={5}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        stroke="#64748b" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        fontFamily="monospace"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                          border: '1px solid #06b6d4', 
                          fontSize: '11px', 
                          color: '#fff', 
                          padding: '6px 10px',
                          borderRadius: '6px',
                          boxShadow: '0 0 10px rgba(6,182,212,0.2)'
                        }}
                        itemStyle={{ color: '#22d3ee', fontFamily: 'monospace' }}
                        labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', marginBottom: '4px' }}
                        cursor={{ stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <ReferenceLine 
                        y={proposedSum} 
                        stroke="#f59e0b" 
                        strokeDasharray="4 4" 
                        opacity={0.8}
                        label={{ 
                           position: 'top', 
                           value: 'PROPOSED SUM', 
                           fill: '#fcd34d', 
                           fontSize: 9, 
                           fontFamily: 'monospace' 
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sum" 
                        stroke="#22d3ee" 
                        strokeWidth={2.5} 
                        isAnimationActive={true}
                        animationDuration={1500}
                        dot={{ r: 4, fill: '#0f172a', stroke: '#22d3ee', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#f59e0b', stroke: '#f59e0b', strokeWidth: 2, className: "animate-pulse" }}
                      >
                        <LabelList dataKey="sum" position="top" offset={10} fill="#f8fafc" fontSize={10} fontFamily="monospace" />
                      </Line>
                    </RechartsLineChart>
                  );
                })()}
              </ResponsiveContainer>
            </div>

            {/* STRATEGY SPECIFIC GRAPH VISUALIZERS */}
            <div className="flex-1 flex flex-col justify-center items-center py-4 relative">
              
              {/* Option 1: Past 10 Likely Frequency Graph */}
              {selectedStrategy === 'freq-10' && (
                <div className="w-full flex flex-col gap-4">
                  <div className="h-[200px] flex items-end justify-between px-2 pt-6 border-b border-slate-800 relative">
                    {/* Render visual frequency bars for numbers 1 to 49 frequency */}
                    {(() => {
                      const pool = draws.slice(0, 10);
                      const freq: { [key: number]: number } = {};
                      for (let i = 1; i <= 49; i++) freq[i] = 0;
                      pool.forEach(d => d.numbers.forEach(n => freq[n]++));

                      // Find max count for scaling
                      const maxCount = Math.max(...Object.values(freq)) || 1;

                      // Display a beautiful selective subset of values on a chart for space
                      const samples = Array.from({ length: 49 }, (_, i) => i + 1);
                      return samples.map((num) => {
                        const count = freq[num];
                        const isProposed = proposedNumbers.includes(num);
                        const heightPercent = `${(count / maxCount) * 100}%`;

                        return (
                          <div key={num} className="group flex-1 flex flex-col items-center justify-end h-full relative" style={{ minWidth: '4px' }}>
                            <div className="absolute bottom-full mb-1 bg-slate-950 text-cyan-300 text-[8px] font-mono px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                              N-{num}: {count} draws
                            </div>
                            
                            <div 
                              className={`w-full rounded-t transition-all duration-300 ${
                                isProposed
                                  ? 'bg-gradient-to-t from-cyan-500 to-blue-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                                  : count > 0 ? 'bg-slate-700 group-hover:bg-cyan-500/40' : 'bg-slate-900'
                              }`} 
                              style={{ height: heightPercent || '4%' }}
                            />
                            
                            {/* Accent indicators on x-axis labels */}
                            {num % 10 === 0 && (
                              <span className="text-[8px] font-mono text-slate-600 mt-1 absolute top-full">{num}</span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-xs mt-2 relative">
                    <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                      Bar graphs show relative occurrences across past 10 drawings. The glowing vectors highlight the top 6 peaks selected for strategic grouping.
                    </p>
                  </div>
                </div>
              )}

              {/* Option 2: Past 6 Draws Spatial averages */}
              {selectedStrategy === 'avg-6' && (
                <div className="w-full flex flex-col gap-4">
                  <div className="grid grid-cols-6 gap-3">
                    {proposedNumbers.map((num, idx) => {
                      // Grab averages history over 6 draws
                      const positionPoints = draws.slice(0, 6).map(d => {
                        const sorted = [...d.numbers].sort((a,b)=>a-b);
                        return sorted[idx] || 0;
                      });

                      const avgVal = Math.round(positionPoints.reduce((s,a)=>s+a,0) / positionPoints.length) || 1;

                      return (
                        <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center relative flex flex-col items-center">
                          <span className="text-[10px] font-mono text-slate-500 block">POS {idx + 1}</span>
                          <span className="text-2xl font-bold font-mono text-cyan-400 mt-2 block">{num}</span>
                          
                          <div className="w-full flex flex-col gap-1.5 mt-3 text-[9px] font-mono border-t border-slate-800/60 pt-2 text-slate-400">
                            <div className="flex justify-between">
                              <span>AVG:</span>
                              <span className="text-cyan-400 font-bold">{avgVal}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>PREV:</span>
                              <span className="text-slate-500">{positionPoints[0] || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono bg-slate-950 p-3 rounded border border-slate-900 leading-relaxed text-center">
                    These metrics display node projections calculated strictly by position-specific weights derived as values are averaged over historical indexes.
                  </p>
                </div>
              )}

              {/* Option 3: 369 Offset cascade interactive options */}
              {selectedStrategy === '369-offset' && (
                <div className="w-full flex flex-col gap-4">
                  <div className="grid grid-cols-6 gap-3">
                    {draws[0]?.numbers.map((baseNum, idx) => {
                      const offsetValue = offsets369[idx] || 3;
                      const activeResult = proposedNumbers[idx];

                      return (
                        <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col items-center relative">
                          <span className="text-[9px] font-mono text-slate-500">LAST NUM {baseNum}</span>
                          
                          {/* Large Interactive Results Node card */}
                          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg font-mono text-cyan-300 border border-cyan-500/20 bg-cyan-950/10 shadow-[0_0_12px_rgba(6,182,212,0.05)] mt-2">
                            {activeResult}
                          </div>

                          <div className="flex flex-col gap-1.5 w-full mt-3">
                            <button
                              id={`toggle-polarity-btn-${idx}`}
                              onClick={() => handleToggleOffsetDirection(idx)}
                              className="w-full border border-slate-800 hover:border-cyan-500/40 bg-slate-900/60 transition text-[9px] font-mono py-1 rounded select-none uppercase"
                            >
                              sgn: {offsetValue > 0 ? '+ (Shift Up)' : '- (Shift Down)'}
                            </button>
                            <button
                              id={`cycle-val-btn-${idx}`}
                              onClick={() => handleCycleOffsetValue(idx)}
                              className="w-full border border-slate-800 hover:border-cyan-500/40 bg-slate-950 transition text-[9px] font-mono py-1 rounded text-cyan-400 font-semibold"
                            >
                              offset: {Math.abs(offsetValue)}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono text-center bg-slate-950 p-3 rounded-lg border border-slate-900 leading-relaxed mt-1">
                    Toggle signs or cycle offsets to manually sculpt the wave path! Offsets cycle recursively through [3, 6, 9] relative to coordinates drawn last.
                  </p>
                </div>
              )}

              {/* Option 4: 49 Square Triangulation custom spiral grid */}
              {selectedStrategy === 'tri-grid' && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                  
                  {/* Grid Renderer */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 relative">
                    <div className="grid grid-cols-7 gap-1.5 max-w-[270px] mx-auto relative">
                      {/* Top banner tag for heatmap */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-400 font-bold tracking-widest whitespace-nowrap z-10">
                        HISTORICAL HEAT MAP ACTIVE
                      </div>
                      {(() => {
                        const freq: Record<number, number> = {};
                        const trace = draws.slice(0, lookbackDepth);
                        trace.forEach(d => d.numbers.forEach(n => { freq[n] = (freq[n] || 0) + 1; }));
                        const maxFreq = Math.max(1, ...Object.values(freq));

                        return Array.from({ length: 49 }, (_, idx) => {
                          const num = idx + 1;
                          const count = freq[num] || 0;
                          const heatRatio = count / maxFreq;
                          // Heat hue: from 220 (blue) to 0 (red)
                          const hue = 220 * (1 - heatRatio);
                          
                          const isProposed = proposedNumbers.includes(num);
                          const isCenter = num === 1;

                          return (
                            <div 
                              key={num} 
                              style={{ 
                                gridRowStart: SPIRAL_MAP[num].r + 1, 
                                gridColumnStart: SPIRAL_MAP[num].c + 1,
                                backgroundColor: isProposed ? undefined : count > 0 ? `hsla(${hue}, 80%, 40%, 0.25)` : undefined,
                                borderColor: isProposed ? undefined : count > 0 ? `hsla(${hue}, 80%, 50%, 0.8)` : undefined,
                              }}
                              className={`aspect-square flex flex-col items-center justify-center rounded text-[9px] font-mono font-bold transition-all relative ${
                                isProposed 
                                  ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_8px_#06b6d4]'
                                  : count > 0
                                    ? 'text-white border'
                                    : isCenter
                                      ? 'bg-slate-800 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-slate-900 text-slate-600 hover:text-slate-400 border border-slate-800/30'
                              }`}
                              title={`Freq: ${count} | Ring ${Math.max(Math.abs(SPIRAL_MAP[num].r-3), Math.abs(SPIRAL_MAP[num].c-3))}`}
                            >
                              <span>{num}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Calculations breakdown side-panel */}
                  <div className="flex flex-col gap-3">
                    <div className="border border-slate-800 bg-slate-950/60 p-4 rounded-xl flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest block uppercase">CENTROID TRIANGULATION SUMMARY</span>
                      
                      <div className="text-[11px] font-mono text-slate-400 flex flex-col gap-2 mt-1 leading-relaxed">
                        <div className="flex justify-between border-b border-slate-800/60 pb-1">
                          <span>GRID SYSTEM SIZE:</span>
                          <span className="text-slate-200">7 x 7 CONCENTRIC</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-1">
                          <span>GRID CORE NODE [1]:</span>
                          <span className="text-yellow-400">CENTER AXIS (3,3)</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span>METHODOLOGY:</span>
                          <span className="text-cyan-400">PERFECT BOX INTERSECT</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-500 italic mt-1.5 pt-1.5 border-t border-slate-800">
                          Polygonal centroid calculates standard geometric weights before locating nearest nodes conforming to perfect squared geometric vectors.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 5: Secured randomizer scroll wheel with neon roulette effect */}
              {selectedStrategy === 'secure-rand' && (
                <div className="flex flex-col items-center justify-center p-6 text-center w-full">
                  <div className="flex items-center gap-3.5 mb-8">
                    {proposedNumbers.map((num, i) => (
                      <div 
                        key={i} 
                        className={`w-14 h-14 rounded-xl bg-slate-950 flex items-center justify-center text-xl font-mono font-extrabold border shadow-lg ${
                          isRandomizing 
                            ? 'text-cyan-400 border-cyan-500/50 animate-bounce' 
                            : 'text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-blue-400 border-slate-800'
                        }`}
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        {num}
                      </div>
                    ))}
                  </div>

                  <button
                    id="randomize-trigger-btn"
                    onClick={handleTriggerRandomScroll}
                    disabled={isRandomizing}
                    className="bg-slate-900 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 font-mono text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 tracking-wider hover:bg-cyan-950/20 active:scale-95 transition-all outline-none"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRandomizing ? 'animate-spin' : ''}`} />
                    <span>{isRandomizing ? 'SCROLLING SYLVESTER SEED...' : 'PROJECTION ENTROPY ENGINE'}</span>
                  </button>
                </div>
              )}

              {/* Option 6: Sandbox Cluster Agents monitor scan */}
              {selectedStrategy === 'cluster-agents' && (
                <div className="w-full flex flex-col gap-4">
                  <div className="grid grid-cols-5 gap-3">
                    {['Delta', 'Sigma', 'Theta', 'Omega', 'Psi'].map((agentName, idx) => {
                      const agentClassVal = proposedNumbers[idx % proposedNumbers.length] || 1;
                      return (
                        <div key={agentName} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex flex-col justify-between relative group overflow-hidden">
                          {/* Scan Sweep overlay line */}
                          <div className="absolute inset-x-0 h-0.5 bg-cyan-400/30 top-0 animate-pulse pointer-events-none"></div>
                          
                          <div className="flex items-center justify-between w-full pb-1 border-b border-slate-800">
                            <span className="text-[9px] font-mono font-bold text-purple-400">{agentName.toUpperCase()}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          </div>
                          
                          <div className="my-3 hover:scale-105 transition-transform">
                            <span className="text-xs text-slate-500 font-mono block">GAP COORD</span>
                            <span className="text-2xl font-bold font-mono text-cyan-300 mt-1 block">{agentClassVal}</span>
                          </div>

                          <div className="text-[9px] font-mono text-slate-600 border-t border-slate-800 pt-1.5 select-none leading-none">
                            SCAN ACTIVE
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono text-center leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-900 mt-1">
                    Multi-agent sandbox represents background clustering threads running across data parameters. Calculations pinpoint historical numeric gaps.
                  </p>
                </div>
              )}

              {/* Option 7: 3-Month sequence weights */}
              {selectedStrategy === 'chain-3m' && (
                <div className="w-full flex flex-col gap-4">
                  <div className="h-[200px] flex items-center justify-center p-2 relative">
                    {/* Render elegant interconnected network path links */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {proposedNumbers.map((num, idx) => {
                        if (idx === proposedNumbers.length - 1) return null;
                        const x1 = 50 + idx * 80;
                        const y1 = 100 + Math.sin(idx) * 35;
                        const x2 = 50 + (idx + 1) * 80;
                        const y2 = 100 + Math.sin(idx + 1) * 35;
                        return (
                          <line 
                            key={idx} 
                            x1={x1} 
                            y1={y1} 
                            x2={x2} 
                            y2={y2} 
                            stroke="rgba(6, 182, 212, 0.25)" 
                            strokeWidth="1.5" 
                            strokeDasharray="4 2" 
                          />
                        );
                      })}
                    </svg>

                    <div className="flex items-center justify-between w-full px-8 relative">
                      {proposedNumbers.map((num, idx) => {
                        const styleY = Math.sin(idx) * 35;
                        return (
                          <div 
                            key={idx} 
                            className="flex flex-col items-center relative" 
                            style={{ transform: `translateY(${styleY}px)` }}
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border border-purple-500/30 bg-purple-950/20 text-purple-300 font-bold font-mono text-xs shadow-md">
                              {num}
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 mt-1">step-{idx + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono bg-slate-950 p-3 rounded-xl border border-slate-900 leading-relaxed text-center">
                    Chain path maps continuous sequence probabilities calculated by feeding the last 24 bi-weekly drawing records into chronological Markov transition maps.
                  </p>
                </div>
              )}

              {/* Option 8: 5D Quantum Swarm canvas renderer */}
              {selectedStrategy === 'swarm-5d' && (
                <div className="w-full flex flex-col gap-3">
                  <div className="w-full h-[220px] bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative">
                    <canvas 
                      id="quantumSwarmCanvas"
                      ref={quantumSwarmCanvasRef} 
                      width={480} 
                      height={220} 
                      className="w-full h-full block"
                    />
                    <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-500 tracking-wider">
                      5D PARTICLE COGNITION DENSITY GRAPH
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono text-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 leading-relaxed select-none">
                    Swarm matrices calculate coordinates by observing particles orbiting gravity fields to construct optimal topological probability waves.
                  </p>
                </div>
              )}

              {/* Option 9: Alpha Peptide Fold AI model alpha ribbbon */}
              {selectedStrategy === 'peptide-fold' && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  
                  {/* Peptide Strand Renderer */}
                  <div className="bg-slate-950 h-[210px] rounded-xl border border-slate-900 overflow-hidden relative flex items-center justify-center">
                    <svg className="w-full h-full p-2" viewBox="0 0 200 120">
                      {/* Bounding spiral chain */}
                      <path 
                        d="M 20 60 Q 50 20 80 60 T 140 60 T 180 60" 
                        fill="none" 
                        stroke="url(#helixGrad)" 
                        strokeWidth="5" 
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                      
                      <defs>
                        <linearGradient id="helixGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#c084fc" />
                          <stop offset="50%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>

                      {/* Display residue anchors */}
                      {proposedNumbers.map((num, idx) => {
                        // Position algorithm along path
                        const px = 20 + idx * 30;
                        const py = 60 + Math.sin(idx * 1.5) * 22;
                        const aminoLetters = 'ARNDCEQGHILKMFPSTWYV';
                        const residueLetter = aminoLetters[num % 20] || 'A';

                        return (
                          <g key={idx}>
                            <circle cx={px} cy={py} r="10" fill="#090d16" stroke="#22d3ee" strokeWidth="1.5" />
                            <text x={px} y={py + 3} fill="#22d3ee" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                              {residueLetter}
                            </text>
                            <text x={px} y={py + 15} fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">
                              {num}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Ribbon explanation panel */}
                  <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-xl border border-slate-900 h-full justify-center">
                    <span className="text-[10px] font-mono text-purple-400 font-bold tracking-widest block uppercase">PEPTIDE ALIGNMENT DATA MAP</span>
                    <div className="text-[11px] font-mono text-slate-400 space-y-1 mt-1 leading-relaxed">
                      <p>
                        Nodes correspond to target Amino Acid chain locks mapped by Alpha-helix constraints. 
                      </p>
                      <p className="pt-2 text-[10px] text-slate-500 italic border-t border-slate-800">
                        Biological sequences (ARNDCEQGHILKMFPSTWYV) map to rotational angles for optimized geometric fold dispersion.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 10: 4D Tesseract Projection canvas renderer */}
              {selectedStrategy === 'tesseract-4d' && (
                <div className="w-full flex flex-col gap-3">
                  <div className="w-full h-[230px] bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative flex justify-center items-center">
                    <canvas 
                      id="tesseractCanvas animate-pulse"
                      ref={tesseractCanvasRef} 
                      width={480} 
                      height={230} 
                      className="w-full h-full block"
                    />
                    <div className="absolute top-2 left-3 text-[9px] font-mono text-cyan-400 tracking-wider flex items-center gap-1.5 uppercase select-none">
                      <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>ROTATING TESSERACT 4D WAVE TRAJECTORY</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono text-center bg-slate-950/80 p-2 rounded-lg border border-slate-900 leading-relaxed select-none">
                    Hypercube projection maps numbers 1-49 to multi-dimensional coordinate fields, tracing a continuous path sequence across past drawings to extrapolate the nearest future barycenter prediction.
                  </p>
                </div>
              )}

              {/* Option 11: Cyclic Prime Reciprocals canvas renderer */}
              {selectedStrategy === 'cyclic-primes' && (
                <div className="w-full flex flex-col gap-3">
                  <div className="w-full h-[230px] bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative flex justify-center items-center">
                    <canvas 
                      id="cyclicCanvas"
                      ref={cyclicCanvasRef} 
                      width={480} 
                      height={230} 
                      className="w-full h-full block"
                    />
                    <div className="absolute top-2 left-3 text-[9px] font-mono text-cyan-400 tracking-wider flex items-center gap-1.5 uppercase select-none">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>HOLOGRAPHIC CYCLIC PRIME DIVISION FIELD</span>
                    </div>
                  </div>

                  {/* Prime Selector Tabs */}
                  <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-900">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">CHOOSE ACTIVE FULL REPTEND PRIME GENERATOR:</span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[7, 17, 19, 23, 29, 47].map((prime) => (
                        <button
                          key={prime}
                          onClick={() => setSelectedCyclicPrime(prime)}
                          className={`py-1.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition focus:outline-none ${
                            selectedCyclicPrime === prime 
                              ? 'bg-cyan-950 border-cyan-500/40 text-cyan-400' 
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          P = {prime}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono text-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 leading-relaxed select-none">
                    Treating the lotto field as a cyclic array. The recurring decimal of <span className="text-cyan-400 font-semibold">1/{selectedCyclicPrime}</span> possesses premium shift-invariance. Shifting the digit cycle based on historical sums extracts perfect balanced future combinations.
                  </p>
                </div>
              )}

              {/* Option 12: E8 Lattice Katha Grid canvas renderer */}
              {selectedStrategy === 'e8-katha' && (
                <div className="w-full flex flex-col gap-3">
                  <div className="w-full h-[230px] bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative flex justify-center items-center">
                    <canvas 
                      id="e8KathaCanvas"
                      ref={e8KathaCanvasRef} 
                      width={480} 
                      height={230} 
                      className="w-full h-full block"
                    />
                    <div className="absolute top-2 left-3 text-[9px] font-mono text-cyan-400 tracking-wider flex items-center gap-1.5 uppercase select-none">
                      <Network className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                      <span>E8 QUASI-CRYSTAL LATTICE / KATHA 1.414 GRID</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono text-center bg-slate-950/80 p-2 rounded-lg border border-slate-900 leading-relaxed select-none">
                    Calculates an 8-dimensional sphere packing lattice (E8) projected into 2D quasi-crystal space using the Katha grid offset of 1.414 (√2). Integrates quantum holographic 0/1 array mapping.
                  </p>
                </div>
              )}

              {/* Option 13: NEYƎИ Sequence canvas renderer */}
              {selectedStrategy === 'neyen-seq' && (
                <div className="w-full flex flex-col gap-3">
                  <div className="w-full h-[230px] bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative flex justify-center items-center shadow-[inset_0_0_30px_rgba(34,211,238,0.05)]">
                    <canvas 
                      id="neyenCanvas"
                      ref={neyenCanvasRef} 
                      width={480} 
                      height={230} 
                      className="w-full h-full block"
                    />
                    <div className="absolute top-2 left-3 text-[9px] font-mono text-cyan-400 tracking-wider flex items-center gap-1.5 uppercase select-none">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" style={{ animation: 'spin 4s linear infinite' }} />
                      <span>NEYƎИ Flower Of Life Base-9 Mapping</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono text-center bg-slate-950/80 p-2 rounded-lg border border-slate-900 leading-relaxed select-none">
                    Maps the perfectly numbered 1, 2, 4, 8, 7, 5 sequence against root Triadic harmonics (3, 6, 9) embedded in sacred geometry to plot convergences.
                  </p>
                </div>
              )}

              {/* Option 14: Numeric Word Value Root */}
              {selectedStrategy === 'numeric-word-value' && (
                <div className="w-full flex flex-col gap-3">
                  <div className="w-full h-[230px] bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative flex justify-center items-center">
                    <canvas 
                      id="wordCanvas"
                      ref={wordCanvasRef} 
                      width={480} 
                      height={230} 
                      className="w-full h-full block"
                    />
                    <div className="absolute top-2 left-3 text-[9px] font-mono text-purple-400 tracking-wider flex items-center gap-1.5 uppercase select-none">
                      <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Recursive Triadic Base-9 Loops</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono text-center bg-slate-950/80 p-2 rounded-lg border border-slate-900 leading-relaxed select-none">
                    Tracking the linguistic convergence of numbers spelled into english. Example: Six=7, Seven=2, Two=4, Four=6, proving the eternal base-9 sum loop.
                  </p>
                </div>
              )}

              {/* Option 15: Omni-Quantum Nexus */}
              {selectedStrategy === 'omni-quantum-nexus' && (
                <div className="w-full flex flex-col gap-3">
                  <div className="w-full h-[250px] bg-slate-950 border border-cyan-500/30 rounded-xl overflow-hidden relative flex justify-center items-center shadow-[inset_0_0_40px_rgba(6,182,212,0.15)]">
                    <canvas 
                      id="omniCanvas"
                      ref={omniCanvasRef} 
                      width={480} 
                      height={250} 
                      className="w-full h-full block"
                    />
                    {/* Corner HUD Details */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-purple-500/50 rounded-br-xl pointer-events-none"></div>
                    
                    <div className="absolute top-2 right-3 flex flex-col items-end pointer-events-none">
                        <span className="text-[8px] font-mono text-cyan-400 anim-pulse">LIVE OMNI-RECURSION</span>
                        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-cyan-400 mt-1"></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono text-center bg-slate-950/80 p-2 rounded-lg border border-cyan-900/50 leading-relaxed select-none">
                    <strong className="text-cyan-400">AUTONOMOUS OMNI-QUANTUM SYNTHESIS:</strong> Merging E8 lattice mappings, NEYƎИ root projections, and dynamic temporal entanglement arrays to synthesize the absolute probability set.
                  </p>
                </div>
              )}
            </div>

            {/* Glowing Tactical Decisive Block */}
            <div className="border-t border-slate-800/80 pt-4 mt-4 bg-slate-950/60 p-4 rounded-xl border border-slate-900/60 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider">CALCULATED TARGET COORDINATES</span>
                <div className="flex items-center gap-2 mt-2">
                  {proposedNumbers.map((num) => (
                    <div 
                      key={num} 
                      className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-bold text-sm font-mono text-cyan-300 border border-cyan-500/40 shadow-[inset_0_2px_8px_rgba(6,182,212,0.1)] transition-transform duration-300 hover:scale-110"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              {/* Deck actions click panel */}
              <div className="flex gap-2.5 w-full md:w-auto">
                <button
                  id="copy-numbers-btn"
                  onClick={handleCopyNumbers}
                  className="flex-1 md:flex-none border border-slate-800 hover:border-cyan-500/40 bg-slate-900 px-4 py-2 rounded-lg text-xs font-mono text-slate-300 hover:text-cyan-400 transition flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COMPLETED' : 'COPY'}</span>
                </button>
                <button
                  id="apply-draw-btn"
                  onClick={handleApplyToDatabase}
                  className="flex-1 md:flex-none bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-5 py-2 rounded-lg text-xs font-mono transition shadow-lg border border-cyan-400/20 focus:outline-none"
                >
                  LOCK RECORD
                </button>
              </div>
            </div>

          </div>

          {/* Card: Python Core Filter System */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-cyan-500/10 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs font-mono font-bold tracking-wider text-cyan-400">PYTHON CORE // 6-49 REGRESSION FILTERS</h3>
                  <p className="text-[10px] font-mono text-slate-500">Filters configuration linked to 6-49-Processing-System.py analysis models</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 uppercase tracking-widest">v2.1 SECURE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Sliders / Controls */}
              <div className="md:col-span-1 flex flex-col gap-4 justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 flex justify-between uppercase">
                      <span>Historical Depth (Draws)</span>
                      <span className="text-cyan-400 font-bold">{lookbackDepth === draws.length ? 'ALL' : lookbackDepth}</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max={draws.length > 50 ? draws.length : 50} 
                      value={lookbackDepth}
                      onChange={(e) => setLookbackDepth(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-slate-400 flex justify-between uppercase">
                      <span>Min Sum Bound</span>
                      <span className="text-cyan-400 font-bold">{minSumFilter}</span>
                    </div>
                    <input 
                      type="range" 
                      min="60" 
                      max="140" 
                      value={minSumFilter}
                      onChange={(e) => setMinSumFilter(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-slate-400 flex justify-between uppercase">
                      <span>Max Sum Bound</span>
                      <span className="text-cyan-400 font-bold">{maxSumFilter}</span>
                    </div>
                    <input 
                      type="range" 
                      min="150" 
                      max="240" 
                      value={maxSumFilter}
                      onChange={(e) => setMaxSumFilter(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 mt-1 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-slate-400 flex justify-between uppercase">
                      <span>Max Consecutive Limit</span>
                      <span className="text-cyan-400 font-bold">{maxConsecutiveFilter}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {[1, 2, 3, 4].map(val => (
                        <button
                          key={val}
                          onClick={() => setMaxConsecutiveFilter(val)}
                          className={`flex-1 py-1 rounded text-[10px] font-mono border focus:outline-none transition cursor-pointer ${
                            maxConsecutiveFilter === val 
                              ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40 font-bold' 
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                  <input 
                    id="avoidExtremeRatios"
                    type="checkbox"
                    checked={avoidExtremeRatios}
                    onChange={(e) => setAvoidExtremeRatios(e.target.checked)}
                    className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500/40 bg-slate-950 w-3.5 h-3.5 cursor-pointer"
                  />
                  <label htmlFor="avoidExtremeRatios" className="text-[10px] font-mono text-slate-400 cursor-pointer select-none uppercase">
                    Avoid Symmetrical Ratios
                  </label>
                </div>
              </div>

              {/* Terminal Logs Block */}
              <div className="md:col-span-2 flex flex-col gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-900 relative">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1.5 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    6-49 REGRESSION LOG CONSOLE
                  </span>
                  <button
                    onClick={runPythonDiagnostics}
                    disabled={isTerminalRunning}
                    className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/50 text-[9px] font-mono text-cyan-300 disabled:opacity-50 transition flex items-center gap-1 uppercase font-bold focus:outline-none cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 hover:rotate-12 duration-200" />
                    <span>{isTerminalRunning ? "PROCESS RUNNING" : "FORCE CHECK"}</span>
                  </button>
                </div>

                <div className="flex-1 min-h-[130px] max-h-[145px] overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5 p-1 select-all bg-slate-950/80 rounded scrollbar-thin scrollbar-thumb-slate-800 leading-relaxed">
                  {terminalLogs.map((log, idx) => {
                    if (!log || typeof log !== 'string') return null;
                    let color = "text-slate-400";
                    if (log.startsWith("$")) color = "text-yellow-400 font-bold";
                    else if (log.includes("✔")) color = "text-emerald-400 font-bold";
                    else if (log.includes("✘")) color = "text-rose-500 font-bold";
                    else if (log.includes("[SUCCESS]")) color = "text-cyan-400 font-bold bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/20";
                    else if (log.includes("[FILTER FAILED]")) color = "text-rose-400 font-bold bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-800/20";
                    else if (log.includes("[TELEMETRY")) color = "text-slate-500";
                    return (
                      <div key={idx} className={color}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: REASSURING J.A.R.V.I.S CONVERSATIONAL CONSOLE */}
        <section className="xl:col-span-1 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
          
          <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-2xl p-4 flex flex-col flex-1 h-full shadow-lg justify-between relative overflow-hidden">
            <span className="text-[10px] font-mono text-cyan-500/50 absolute top-4 right-4 tracking-widest uppercase">TACTICAL COMMUNICATOR</span>
            
            <div className="border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">SYNAPSE TERMINAL</h2>
              </div>
            </div>

            {/* Chat Messages Frame list */}
            <div className="flex-1 min-h-[300px] max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex flex-col max-w-[85%] ${
                    m.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <span className="text-[8px] font-mono text-slate-500 mb-0.5">{m.role.toUpperCase()} // {m.timestamp}</span>
                  <div 
                    className={`rounded-xl p-3 text-xs leading-relaxed font-mono ${
                      m.role === 'user' 
                        ? 'bg-cyan-950/40 text-cyan-200 border border-cyan-500/30 rounded-tr-none' 
                        : 'bg-slate-950 text-slate-300 border border-slate-900 rounded-tl-none shadow-[0_4px_12px_rgba(2,6,23,0.3)]'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isJarvisThinking && (
                <div className="self-start flex flex-col items-start max-w-[85%]">
                  <span className="text-[8px] font-mono text-slate-500 mb-0.5">JARVIS // THINKING...</span>
                  <div className="bg-slate-950 border border-slate-900 rounded-xl rounded-tl-none p-3 text-xs font-mono text-cyan-400/70 flex items-center gap-2.5 shadow-md">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing dimensional variables...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick pre-defined synapse queries */}
            <div className="mt-4 border-t border-slate-800/60 pt-3 flex flex-wrap gap-1.5">
              <span className="text-[8px] font-mono text-slate-500 w-full mb-1">SYSTEM INSTANT COMMANDS:</span>
              {[
                { label: 'Verify 3-6-9 pattern limits', prompt: 'JARVIS, inspect limits of 369 sequence shifts.' },
                { label: '5D Swarm Diagnostics', prompt: 'J.A.R.V.I.S., compute 5D quantum gravity cluster.' },
                { label: 'Review Peptide folding', prompt: 'Tell me how Peptide Folding locks to Lotto sequence.' },
                { label: 'Calculate most frequent', prompt: 'Analyze top frequencies over previous drawings.' }
              ].map((query, i) => (
                <button
                  key={i}
                  id={`quick-query-btn-${i}`}
                  onClick={() => sendJarvisMessage(query.prompt)}
                  className="text-[9px] font-mono bg-slate-950 hover:bg-cyan-950/30 text-slate-400 hover:text-cyan-400 border border-slate-900 hover:border-cyan-500/20 px-2 py-1.5 rounded transition-all outline-none"
                >
                  {query.label}
                </button>
              ))}
            </div>

            {/* Interactive User message entry input bar */}
            <div className="mt-4 flex gap-2">
              <input 
                id="chat-user-input"
                type="text"
                placeholder="Direct voice-to-text queries..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendJarvisMessage()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 outline-none placeholder-slate-600 focus:border-cyan-500/50"
              />
              <button 
                id="send-chat-btn"
                onClick={() => sendJarvisMessage()}
                disabled={!userInput.trim() || isJarvisThinking}
                className="bg-cyan-950 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 p-2.5 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed outline-none focus:outline-none"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER COGNITIVE DISCLAIMER BAR */}
      <footer className="z-10 bg-slate-950 border-t border-slate-900 py-3 px-6 text-center text-[10px] font-mono text-slate-500 select-none">
        <p className="max-w-4xl mx-auto leading-relaxed">
          [COGNITIVE DISCLAIMER] bet49 is an advanced visual modeling simulator designed strictly for strategic mathematical analysis and entertainment. Under mathematical proof, lottery drawings represent isolated, high-entropy random distributions. J.A.R.V.I.S. calculations do not guarantee outcome performance. Act responsibly.
        </p>
      </footer>

      {/* SWIPE SIDE MENU: OFFICIAL TRANSCRIPT PANEL */}
      <div 
        id="wclc-matrix-sidebar"
        className={`fixed top-0 right-0 h-full w-[380px] sm:w-[480px] bg-slate-950 border-l border-cyan-500/20 shadow-2xl z-50 transition-transform duration-500 transform ${
          isWCLCStreamOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col justify-between">
          
          <div className="p-4 bg-slate-900 border-b border-cyan-500/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Network className="text-cyan-400 w-4 h-4" />
              <div className="text-left">
                <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">OFFICIAL TRANSCRIPT</h3>
                <p className="text-[9px] text-slate-500 font-mono uppercase">WCLC live communication portal</p>
              </div>
            </div>
            
            <button 
              id="close-wclc-btn"
              onClick={() => setIsWCLCStreamOpen(false)}
              className="text-slate-400 hover:text-cyan-400 p-1 rounded-lg transition-colors border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connected Stream Content */}
          <div className="flex-1 bg-slate-950 p-4 flex flex-col gap-4 relative overflow-y-auto">
            <div className="bg-cyan-950/20 border border-cyan-500/20 p-3.5 rounded-xl text-left">
              <span className="text-[9.5px] font-mono text-cyan-400 font-bold block uppercase tracking-wider">HURRICANE OVERRIDE PORTAL INFO</span>
              <p className="text-[11px] font-mono text-slate-400 mt-1 px-0.5 leading-normal">
                If the embedded browser frame restricts rendering due to security CSP guidelines: Click the link below to open results securely in a standalone tab.
              </p>
              <a 
                id="wclc-external-link"
                href="https://www.wclc.com/mobile/home.htm?mobileredirect=true&langid=42"
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 rounded transition duration-200"
              >
                <span>OPEN PORTAL SECURELY</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Embedded Mobile IFrame results view */}
            <div className="flex-1 border border-slate-900 rounded-xl overflow-hidden bg-slate-900/50 min-h-[350px]">
              <iframe 
                id="wclc-iframe"
                src="https://www.wclc.com/mobile/home.htm?mobileredirect=true&langid=42" 
                title="WCLC Mobile Dashboard Portal"
                className="w-full h-full border-0 bg-slate-900"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-900 border-t border-slate-800 text-center text-[10px] font-mono text-slate-500">
            SECURE LINK COMPLETED AT {new Date().toLocaleDateString()}
          </div>

        </div>
      </div>

    </div>
  );
}
