import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  Layers, 
  Sparkles, 
  RotateCw, 
  Plus, 
  X, 
  Copy, 
  Shuffle, 
  Eye, 
  EyeOff, 
  Activity, 
  Grid, 
  Tv, 
  Trash2, 
  Globe, 
  Zap,
  Info,
  ExternalLink,
  Sliders,
  Play
} from 'lucide-react';

interface NumberStringTab {
  id: string;
  name: string;
  numbers: number[];
  color: 'cyan' | 'fuchsia' | 'amber' | 'emerald' | 'rose';
  visible: boolean;
  viewStyle: 'line' | 'ribbon' | 'glowing';
}

interface QuantumStringTabSpaceProps {
  draws: { id: string; date: string; numbers: number[] }[];
  activeProposedNumbers: number[];
  onApplyNumbers: (nums: number[]) => void;
  playSpeech: (text: string) => void;
  isTTSEnabled: boolean;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
}

export default function QuantumStringTabSpace({
  draws,
  activeProposedNumbers,
  onApplyNumbers,
  playSpeech,
  isTTSEnabled,
  addToast
}: QuantumStringTabSpaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Default number strings (pre-seeded high-probability matrices and spatial sets)
  const [tabs, setTabs] = useState<NumberStringTab[]>([
    {
      id: 'tab-1',
      name: 'Chronos Quantum Alpha',
      numbers: [4, 15, 23, 27, 33, 41],
      color: 'cyan',
      visible: true,
      viewStyle: 'glowing'
    },
    {
      id: 'tab-2',
      name: 'E8 Dimensional String',
      numbers: [8, 12, 19, 31, 38, 48],
      color: 'fuchsia',
      visible: true,
      viewStyle: 'ribbon'
    },
    {
      id: 'tab-3',
      name: 'Fibonacci Resonance Thread',
      numbers: [1, 2, 3, 5, 8, 13, 21, 34],
      color: 'amber',
      visible: true,
      viewStyle: 'glowing'
    },
    {
      id: 'tab-4',
      name: 'Nodal Prime Wave',
      numbers: [11, 13, 17, 19, 23, 29, 31, 37, 41, 43],
      color: 'emerald',
      visible: true,
      viewStyle: 'line'
    }
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [isStacked, setIsStacked] = useState<boolean>(true); // Stacked overlays multiple strings together!
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showWireMesh, setShowWireMesh] = useState<boolean>(true);
  const [meshType, setMeshType] = useState<'lattice' | 'vortex' | 'geometric' | 'none'>('lattice');
  const [newTabName, setNewTabName] = useState<string>('');
  const [newTabNumbers, setNewTabNumbers] = useState<string>('');
  const [newTabColor, setNewTabColor] = useState<'cyan' | 'fuchsia' | 'amber' | 'emerald' | 'rose'>('cyan');
  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(false);

  // Interactive node wave pulsation state
  const [pulsingNode, setPulsingNode] = useState<{ tabId: string; nodeIdx: number; time: number } | null>(null);

  // 3D rotations angles
  const yawRef = useRef<number>(0.5);
  const pitchRef = useRef<number>(0.2);
  const zoomRef = useRef<number>(1.0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Floating coordinates display telemetry text
  const yawTextRef = useRef<HTMLSpanElement | null>(null);
  const pitchTextRef = useRef<HTMLSpanElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ num: number; x: number; y: number; tabName: string; color: string } | null>(null);

  // Color mapping variables
  const colorMap = useMemo(() => ({
    cyan: {
      accent: 'rgb(34, 211, 238)',
      glow: 'rgba(6, 182, 212, 0.45)',
      deep: 'rgba(8, 145, 178, 0.2)',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/45',
      text: 'text-cyan-400',
    },
    fuchsia: {
      accent: 'rgb(244, 63, 94)',
      glow: 'rgba(236, 72, 153, 0.45)',
      deep: 'rgba(190, 24, 74, 0.2)',
      bg: 'bg-fuchsia-500/10',
      border: 'border-fuchsia-500/45',
      text: 'text-fuchsia-400',
    },
    amber: {
      accent: 'rgb(245, 158, 11)',
      glow: 'rgba(245, 158, 11, 0.45)',
      deep: 'rgba(180, 83, 9, 0.2)',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/45',
      text: 'text-amber-400',
    },
    emerald: {
      accent: 'rgb(16, 185, 129)',
      glow: 'rgba(52, 211, 153, 0.45)',
      deep: 'rgba(4, 120, 87, 0.2)',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/45',
      text: 'text-emerald-400',
    },
    rose: {
      accent: 'rgb(244, 63, 94)',
      glow: 'rgba(244, 63, 94, 0.45)',
      deep: 'rgba(159, 18, 57, 0.2)',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/45',
      text: 'text-rose-400',
    }
  }), []);

  // Compute 3D node coordinates mapping procedurally based on tab specifics
  // and number assignments
  const activeDraws = draws || [];

  // Drag and drop / Rotate controls inside canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      yawRef.current += deltaX * 0.005;
      pitchRef.current = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitchRef.current + deltaY * 0.005));
      setAutoRotate(false);
      return;
    }

    // Detect node hovering dynamically by projecting 3D nodes coordinates
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fov = 350;

    let closest: { num: number; x: number; y: number; tabName: string; color: string; dist: number } | null = null;

    // Run same projections to see if hovering over nodes
    const cosY = Math.cos(yawRef.current);
    const sinY = Math.sin(yawRef.current);
    const cosP = Math.cos(pitchRef.current);
    const sinP = Math.sin(pitchRef.current);

    // Filter visible tabs to project nodes
    const visibleTabs = isStacked ? tabs.filter(t => t.visible) : tabs.filter(t => t.id === activeTabId);

    visibleTabs.forEach((tab, tIdx) => {
      // Space offset or phase rotation offset unique to each tab so they weave
      const phaseOffset = (tIdx * Math.PI * 2) / tabs.length;
      
      tab.numbers.forEach((num, nIdx) => {
        // Spatial map: spirals around radius
        const angle = (num / 49) * Math.PI * 5 + phaseOffset;
        const height = ((num - 25) / 24) * 110;
        const radius = 80 + Math.sin(angle * 1.5) * 15;

        // Coordinates in 3D
        const xVal = Math.cos(angle) * radius;
        const zVal = Math.sin(angle) * radius;
        const yVal = height;

        // Apply Yaw (rot around Y)
        const x1 = xVal * cosY - zVal * sinY;
        const z1 = xVal * sinY + zVal * cosY;

        // Apply Pitch (rot around X)
        const y2 = yVal * cosP - z1 * sinP;
        const z2 = yVal * sinP + z1 * cosP;

        const dScale = fov / (fov + z2 * zoomRef.current);
        const px = cx + x1 * zoomRef.current * dScale;
        const py = cy + y2 * zoomRef.current * dScale;

        const d = Math.hypot(px - mouseX, py - mouseY);
        if (d < 15) {
          if (!closest || d < closest.dist) {
            closest = {
              num,
              x: px,
              y: py,
              tabName: tab.name,
              color: colorMap[tab.color].accent,
              dist: d
            };
          }
        }
      });
    });

    if (closest) {
      setHoveredNode(closest);
    } else {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomRef.current = Math.max(0.4, Math.min(2.5, zoomRef.current - e.deltaY * 0.001));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (hoveredNode) {
      // Speak node number if user clicked on it
      if (isTTSEnabled) {
        playSpeech(`Interrogating node ${hoveredNode.num} in sequence ${hoveredNode.tabName}`);
      }
      
      // Pulse node triggers shockwave propagation. Find the hovered node index and tab key
      const activeTabObj = tabs.find(t => t.name === hoveredNode.tabName);
      if (activeTabObj) {
        const idx = activeTabObj.numbers.indexOf(hoveredNode.num);
        if (idx !== -1) {
          setPulsingNode({
            tabId: activeTabObj.id,
            nodeIdx: idx,
            time: Date.now()
          });
          
          addToast(
            `NODE OSCILLATION engaged: ${hoveredNode.num}`,
            `Electromagnetic wave surge propagating sequentially along the vertices of ${hoveredNode.tabName}.`,
            'info'
          );
        }
      }
    }
  };

  // Main canvas rendering effect loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Resize to bounds
      const container = containerRef.current;
      if (container) {
        if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const fov = 350;

      // Telemetries updates
      if (yawTextRef.current) {
        yawTextRef.current.textContent = `YAW_VORTEX: ${yawRef.current.toFixed(4)} RAD`;
      }
      if (pitchTextRef.current) {
        pitchTextRef.current.textContent = `PITCH_VORTEX: ${pitchRef.current.toFixed(4)} RAD`;
      }

      // Autoration sweeps 
      if (autoRotate && !isDraggingRef.current) {
        yawRef.current = (yawRef.current + 0.0022) % (Math.PI * 2);
      }

      const cosY = Math.cos(yawRef.current);
      const sinY = Math.sin(yawRef.current);
      const cosP = Math.cos(pitchRef.current);
      const sinP = Math.sin(pitchRef.current);

      // Rendering Mesh/Lattice references
      if (showWireMesh && meshType !== 'none') {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
        ctx.lineWidth = 0.5;

        if (meshType === 'lattice') {
          // Grid layers inside sphere boundaries
          for (let radiusVal = 50; radiusVal <= 150; radiusVal += 50) {
            ctx.beginPath();
            let started = false;
            for (let angle = 0; angle <= Math.PI * 2 + 0.1; angle += 0.15) {
              const rx = Math.cos(angle) * radiusVal;
              const rz = Math.sin(angle) * radiusVal;

              const x1 = rx * cosY - rz * sinY;
              const z1 = rx * sinY + rz * cosY;
              const y2 = -30 * cosP - z1 * sinP;
              const z2 = -30 * sinP + z1 * cosP;

              const dScale = fov / (fov + z2 * zoomRef.current);
              const px = cx + x1 * zoomRef.current * dScale;
              const py = cy + y2 * zoomRef.current * dScale;

              if (!started) {
                ctx.moveTo(px, py);
                started = true;
              } else {
                ctx.lineTo(px, py);
              }
            }
            ctx.stroke();
          }
        } else if (meshType === 'vortex') {
          // Double Helix Conical funnel mesh
          ctx.beginPath();
          let started = false;
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.06)';
          for (let indexVal = 1; indexVal <= 49; indexVal++) {
            const angle = (indexVal / 49) * Math.PI * 8;
            const height = ((indexVal - 25) / 24) * 110;
            const radius = (indexVal / 49) * 110 + 20;

            const xVal = Math.cos(angle) * radius;
            const zVal = Math.sin(angle) * radius;

            const x1 = xVal * cosY - zVal * sinY;
            const z1 = xVal * sinY + zVal * cosY;
            const y2 = height * cosP - z1 * sinP;
            const z2 = height * sinP + z1 * cosP;

            const dScale = fov / (fov + z2 * zoomRef.current);
            const px = cx + x1 * zoomRef.current * dScale;
            const py = cy + y2 * zoomRef.current * dScale;

            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        } else if (meshType === 'geometric') {
          // Simple wireframes bounding cube
          const size = 110;
          const cubeCoords = [
            [-size, -size, -size], [size, -size, -size], [size, size, -size], [-size, size, -size],
            [-size, -size, size], [size, -size, size], [size, size, size], [-size, size, size]
          ];
          const cubeProj = cubeCoords.map(coord => {
            const x1 = coord[0] * cosY - coord[2] * sinY;
            const z1 = coord[0] * sinY + coord[2] * cosY;
            const y2 = coord[1] * cosP - z1 * sinP;
            const z2 = coord[1] * sinP + z1 * cosP;
            const dScale = fov / (fov + z2 * zoomRef.current);
            return { x: cx + x1 * zoomRef.current * dScale, y: cy + y2 * zoomRef.current * dScale };
          });

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
          const edges = [
            [0,1], [1,2], [2,3], [3,0],
            [4,5], [5,6], [6,7], [7,4],
            [0,4], [1,5], [2,6], [3,7]
          ];
          edges.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(cubeProj[edge[0]].x, cubeProj[edge[0]].y);
            ctx.lineTo(cubeProj[edge[1]].x, cubeProj[edge[1]].y);
            ctx.stroke();
          });
        }
      }

      // Filter visible tabs to project nodes
      const visibleTabs = isStacked ? tabs.filter(t => t.visible) : tabs.filter(t => t.id === activeTabId);

      // We collect all projected nodes from all visible tabs to render chronologically and sort by depth
      interface ProjectedNode {
        num: number;
        px: number;
        py: number;
        pz: number;
        dScale: number;
        colorKey: 'cyan' | 'fuchsia' | 'amber' | 'emerald' | 'rose';
        tabId: string;
        tabName: string;
        index: number;
        isLast: boolean;
        isFirst: boolean;
      }

      const allProjectedNodes: ProjectedNode[] = [];
      const stringsLines: { tabId: string; colorKey: 'cyan' | 'fuchsia' | 'amber' | 'emerald' | 'rose'; points: ProjectedNode[] }[] = [];

      visibleTabs.forEach((tab, tIdx) => {
        // Distinct rotation offset phase per tab so stacked strings hover elegantly
        const phaseOffset = (tIdx * Math.PI * 2) / (tabs.length || 1);
        const currentTabPoints: ProjectedNode[] = [];

        tab.numbers.forEach((num, nIdx) => {
          // Node 3D mapping formula
          const angle = (num / 49) * Math.PI * 5 + phaseOffset;
          const height = ((num - 25) / 24) * 110;
          const radius = 80 + Math.sin(angle * 1.5) * 15;

          const xVal = Math.cos(angle) * radius;
          const zVal = Math.sin(angle) * radius;
          const yVal = height;

          // Apply rotations
          const x1 = xVal * cosY - zVal * sinY;
          const z1 = xVal * sinY + zVal * cosY;
          const y2 = yVal * cosP - z1 * sinP;
          const z2 = yVal * sinP + z1 * cosP;

          const dScale = fov / (fov + z2 * zoomRef.current);
          const px = cx + x1 * zoomRef.current * dScale;
          const py = cy + y2 * zoomRef.current * dScale;

          const prjNode: ProjectedNode = {
            num,
            px,
            py,
            pz: z2,
            dScale,
            colorKey: tab.color,
            tabId: tab.id,
            tabName: tab.name,
            index: nIdx,
            isFirst: nIdx === 0,
            isLast: nIdx === tab.numbers.length - 1
          };

          allProjectedNodes.push(prjNode);
          currentTabPoints.push(prjNode);
        });

        stringsLines.push({
          tabId: tab.id,
          colorKey: tab.color,
          points: currentTabPoints
        });
      });

      // 1. Draw connecting Strings of Numbers (Bridges/Ribbons)
      stringsLines.forEach(stringObj => {
        const clr = colorMap[stringObj.colorKey];
        if (stringObj.points.length < 2) return;

        // Path styling
        ctx.beginPath();
        ctx.moveTo(stringObj.points[0].px, stringObj.points[0].py);
        
        for (let idx = 1; idx < stringObj.points.length; idx++) {
          ctx.lineTo(stringObj.points[idx].px, stringObj.points[idx].py);
        }

        const viewStyle = tabs.find(t => t.id === stringObj.tabId)?.viewStyle || 'line';
        
        if (viewStyle === 'line') {
          ctx.strokeStyle = clr.accent;
          ctx.lineWidth = stringObj.tabId === activeTabId ? 2 : 1;
          ctx.stroke();
        } else if (viewStyle === 'ribbon') {
          // Double strand ribbon
          ctx.strokeStyle = clr.accent;
          ctx.lineWidth = stringObj.tabId === activeTabId ? 3 : 1.8;
          ctx.stroke();

          // Outer shadow glow ribbon
          ctx.strokeStyle = clr.deep;
          ctx.lineWidth = 14;
          ctx.stroke();
        } else {
          // Glowing/Pulsating path
          ctx.shadowColor = clr.accent;
          ctx.shadowBlur = 8;
          ctx.strokeStyle = clr.accent;
          ctx.lineWidth = stringObj.tabId === activeTabId ? 3.5 : 1.5;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }

        // Animated traveling node photon wave down the string sequential lines
        // Animate a flowing particle traveling chronologically
        const speedFactor = 0.0012;
        const totalSegs = stringObj.points.length - 1;
        const tProgress = (Date.now() * speedFactor) % totalSegs;
        const segIdx = Math.floor(tProgress);
        const segRatio = tProgress - segIdx;

        if (segIdx < totalSegs) {
          const ptA = stringObj.points[segIdx];
          const ptB = stringObj.points[segIdx + 1];

          // Interpolated traveler
          const travelerX = ptA.px + (ptB.px - ptA.px) * segRatio;
          const travelerY = ptA.py + (ptB.py - ptA.py) * segRatio;

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = clr.accent;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(travelerX, travelerY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Outer ripple circle around traveler
          ctx.strokeStyle = clr.accent;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(travelerX, travelerY, 8 + segRatio * 15, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Active node oscillation propagating ripple shockwave
        if (pulsingNode && pulsingNode.tabId === stringObj.tabId) {
          const elapsed = Date.now() - pulsingNode.time;
          const waveRadiusIndex = elapsed * 0.0028; // Speed of propagation
          
          stringObj.points.forEach((node, nIdx) => {
            const indexDist = Math.abs(nIdx - pulsingNode.nodeIdx);
            // Wavefront match
            if (indexDist < waveRadiusIndex && indexDist > waveRadiusIndex - 2.0) {
              const pulseFactor = 1 - (indexDist / 8); // damp intensity
              if (pulseFactor > 0) {
                ctx.strokeStyle = clr.accent;
                ctx.lineWidth = 1.8 * pulseFactor;
                ctx.beginPath();
                ctx.arc(node.px, node.py, 10 + 25 * (elapsed % 500) / 500, 0, Math.PI * 2);
                ctx.stroke();
              }
            }
          });

          // Timeout pulsar logic after 3 seconds
          if (elapsed > 3000) {
            setPulsingNode(null);
          }
        }
      });

      // 2. Draw Nodes sorted by depth (painter sorting: back to front)
      const sortedProjectedNodes = [...allProjectedNodes].sort((a, b) => b.pz - a.pz);

      sortedProjectedNodes.forEach(node => {
        const radius = Math.max(5, 11 * node.dScale);
        const clr = colorMap[node.colorKey];

        // Is node highlighted?
        const isHovered = hoveredNode && hoveredNode.num === node.num && hoveredNode.tabName === node.tabName;
        const isActiveTabNode = node.tabId === activeTabId;

        // Custom theme color based on tab selections
        let nodeFill = 'rgba(15, 23, 42, 0.9)';
        let nodeStroke = clr.accent;
        let nodeTextColor = 'rgba(255, 255, 255, 0.85)';

        if (isHovered) {
          nodeFill = clr.accent;
          nodeStroke = '#ffffff';
          nodeTextColor = '#020617';
          ctx.shadowColor = clr.accent;
          ctx.shadowBlur = radius * 2;
        } else if (isActiveTabNode) {
          nodeFill = 'rgba(15, 23, 42, 0.95)';
          nodeStroke = clr.accent;
          ctx.shadowColor = clr.accent;
          ctx.shadowBlur = radius * 0.6;
        } else {
          // Dim non-active lines nodes
          nodeFill = 'rgba(15, 23, 42, 0.5)';
          nodeStroke = clr.accent + '22'; // low alpha hex
          nodeTextColor = 'rgba(148, 163, 184, 0.35)';
        }

        // Node base drop circle
        ctx.fillStyle = nodeFill;
        ctx.strokeStyle = nodeStroke;
        ctx.lineWidth = isHovered ? 2.5 : isActiveTabNode ? 1.8 : 0.8;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Center index badge label indicator (Sequential index marker inside the string)
        if (node.isFirst || node.isLast) {
          ctx.fillStyle = clr.accent;
          ctx.font = 'bold 7px monospace';
          ctx.fillText(node.isFirst ? 'START' : 'END', node.px, node.py - radius - 5);
        }

        // Node value digital marker overlay text
        if (node.dScale > 0.4) {
          ctx.font = `bold ${Math.max(7, 10 * node.dScale)}px monospace`;
          ctx.fillStyle = nodeTextColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(node.num), node.px, node.py);
        }
      });

      // Ambient background sweepers
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [tabs, activeTabId, isStacked, autoRotate, showWireMesh, meshType, hoveredNode, pulsingNode]);

  // Tab configurations additions
  const handleCreateTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabNumbers) {
      addToast('INPUT REQUIRED', 'Please specify coordinate values or integers.', 'warning');
      return;
    }

    // Parse values from commas or whitespace
    const parsed = newTabNumbers
      .split(/[\s,]+/ )
      .map(v => parseInt(v.trim()))
      .filter(v => !isNaN(v) && v > 0 && v <= 49);

    if (parsed.length === 0) {
      addToast('PARSING FAILURE', 'No valid numbers found matching range 1 to 49.', 'error');
      return;
    }

    const name = newTabName.trim() || `Tactical Matrix ${tabs.length + 1}`;
    const newTabObj: NumberStringTab = {
      id: `tab-user-${Date.now()}`,
      name,
      numbers: parsed,
      color: newTabColor,
      visible: true,
      viewStyle: 'glowing'
    };

    setTabs(prev => [...prev, newTabObj]);
    setActiveTabId(newTabObj.id);
    setNewTabName('');
    setNewTabNumbers('');
    setIsCreatorOpen(false);

    addToast(
      'STRING TAB CREATED: ' + name.toUpperCase(),
      `Custom node sequence coordinates assigned. Automatically linked ${parsed.length} vertices into connected strings.`,
      'success'
    );

    if (isTTSEnabled) {
      playSpeech(`Successfully created string tab ${name} with ${parsed.length} automated connections.`);
    }
  };

  const handleCloneTab = (tab: NumberStringTab) => {
    const clone: NumberStringTab = {
      ...tab,
      id: `tab-clon-${Date.now()}`,
      name: `${tab.name} [CLONE]`,
      visible: true
    };
    setTabs(prev => [...prev, clone]);
    addToast('TAB CLONED', `Successfully duplicated ${tab.name}.`, 'success');
  };

  const handleDeleteTab = (id: string, name: string) => {
    if (tabs.length <= 1) {
      addToast('ACTION FORBIDDEN', 'At least one active node-string tab is required.', 'warning');
      return;
    }
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTabId === id) {
      const remaining = tabs.filter(t => t.id !== id);
      setActiveTabId(remaining[0].id);
    }
    addToast('TAB DISCARDED', `Cleaned tab memory index for ${name}.`, 'info');
  };

  const handleRandomizeNumbers = (id: string) => {
    // Generate 6 random non duplicate numbers
    const rSet = new Set<number>();
    while (rSet.size < 6) {
      rSet.add(Math.floor(Math.random() * 49) + 1);
    }
    const numbersArray = Array.from(rSet).sort((a,b) => a-b);
    setTabs(prev => prev.map(t => t.id === id ? { ...t, numbers: numbersArray } : t));
    addToast('RANDOMIZED VERTICES', 'Numbers successfully swept across modular deciles.', 'info');
  };

  const handleToggleVisibility = (id: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
  };

  const handleStyleChange = (id: string, style: 'line' | 'ribbon' | 'glowing') => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, viewStyle: style } : t));
  };

  const handleApplyToDeck = (tabNumbers: number[], tabName: string) => {
    onApplyNumbers(tabNumbers);
    addToast(
      'DECK SYNCHRONIZED',
      `Engaged tactical system. Mapped ${tabNumbers.length} node coordinates into main prediction deck arrays.`,
      'success'
    );
    if (isTTSEnabled) {
      playSpeech(`Numbers synchronized with tactical sequence: ${tabName}`);
    }
  };

  const currentActiveTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-slate-800/85 rounded-2xl p-5 flex flex-col gap-5 shadow-[0_4px_30px_rgba(0,0,0,0.55)] relative overflow-hidden">
      
      {/* Upper Information Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-4 gap-3">
        <div className="flex gap-2.5 items-center select-none">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-950/40 to-blue-950/40 border border-cyan-500/15">
            <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[7px] font-mono tracking-widest text-cyan-500 font-extrabold uppercase bg-cyan-950/30 border border-cyan-500/10 px-1 py-0.5 rounded leading-none block w-max">SYSTEM WIREFRAME WORKSPACE</span>
            <h2 className="text-sm font-sans font-black tracking-tight text-slate-100 uppercase mt-1 leading-none">Quantum Nodes & Connected Strings</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">Interactive 3D Universe weaving multi-point number sets as physical paths</p>
          </div>
        </div>

        <div className="flex gap-2 self-stretch md:self-auto select-none">
          <button
            onClick={() => {
              setIsStacked(prev => !prev);
              addToast(
                isStacked ? 'SINGLE VIEW DECK ACTIVE' : 'MULTI STRINGS STACKED ACTIVE',
                isStacked 
                  ? 'Showing only the current active tab string in isolation' 
                  : 'Overlapping and rendering multiple color coded string sets in parallel',
                'info'
              );
            }}
            className={`flex-1 md:flex-none px-3.5 py-2 font-mono text-[9px] font-black border uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isStacked 
                ? 'border-fuchsia-500/40 bg-fuchsia-950/20 text-fuchsia-400 font-black shadow-[0_0_10px_rgba(236,72,153,0.1)]' 
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-705'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isStacked ? 'STAKED TABS: ACTIVE' : 'STACK TABS'}</span>
          </button>

          <button
            onClick={() => setIsCreatorOpen(true)}
            className="px-3.5 py-2 font-mono text-[9px] font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/20 uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NEW STRING</span>
          </button>
        </div>
      </div>

      {/* Wireframe Workspace Tabbed Header Selection List */}
      <div className="flex flex-col gap-2 select-none">
        <div className="flex flex-wrap gap-1 border-b border-slate-900 pb-1 overflow-x-auto">
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId;
            const clrInfo = colorMap[tab.color];
            return (
              <div 
                key={tab.id}
                className="flex items-center gap-0.5 shrink-0"
              >
                <button
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-3 py-2 text-[9px] font-mono font-bold tracking-wider uppercase border-t border-x rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? `bg-slate-950/70 border-slate-800/80 ${clrInfo.text} font-black border-b border-b-slate-950 shadow-[inset_0_2px_4px_rgba(255,255,255,0.03)]` 
                      : 'bg-black/40 border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-ping' : ''}`} style={{ backgroundColor: clrInfo.accent }} />
                  <span>{tab.name}</span>
                  <span className="text-[8px] bg-slate-900 border border-slate-800/80 px-1 py-0.2 rounded text-slate-400 leading-none">
                    ({tab.numbers.length})
                  </span>
                </button>

                {/* Tab auxiliary options */}
                <div className="flex items-center border border-transparent bg-black/10 px-1 rounded-t-lg gap-0.5">
                  <button
                    onClick={() => handleToggleVisibility(tab.id)}
                    title={tab.visible ? 'Hide string overlay' : 'Show string overlay'}
                    className={`p-1 hover:bg-slate-950/50 rounded transition ${tab.visible ? 'text-slate-400 hover:text-slate-200' : 'text-slate-750 hover:text-slate-650'}`}
                  >
                    {tab.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleCloneTab(tab)}
                    title="Clone string configuration"
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-950/50 rounded transition"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteTab(tab.id, tab.name)}
                    title="Delete tab"
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-950/50 rounded transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid containing 3D Canvas area on left and Controls of active tab on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[440px]">
        
        {/* Playable and Interactive 3D space canvas Viewport map */}
        <div className="lg:col-span-8 flex flex-col bg-black/85 border border-slate-900 rounded-2xl relative overflow-hidden min-h-[380px]" ref={containerRef}>
          {/* Subtle sci-fi overlay grids */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.1px,transparent_1.1px)] [background-size:20px_20px] opacity-[0.06] pointer-events-none" />

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
            className="w-full h-full block flex-1 cursor-grab active:cursor-grabbing"
          />

          {/* Float Angle Telemetries */}
          <div className="absolute top-4 left-4 font-mono text-[8px] text-slate-500 pointer-events-none select-none flex flex-col gap-0.5 leading-normal bg-slate-950/65 p-2 rounded border border-slate-900/40">
            <span ref={yawTextRef}>YAW_VORTEX: 0.000 RAD</span>
            <span ref={pitchTextRef}>PITCH_VORTEX: 0.000 RAD</span>
            <span>MAG_ZOOM: {(zoomRef.current * 100).toFixed(0)}%</span>
            <span>MAPPED_NODES: {isStacked ? tabs.filter(t => t.visible).reduce((sum, t) => sum + t.numbers.length, 0) : currentActiveTab.numbers.length} ACTIVE</span>
          </div>

          {/* Instruction Tooltip floating */}
          <div className="absolute bottom-4 left-4 font-mono text-[8px] leading-normal pointer-events-none select-none text-slate-500 flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 border border-slate-900/60 rounded-lg">
            <Info className="w-3.5 h-3.5 text-cyan-500" />
            <span>DRAG TO ROTATE DECK | CLICK NODES TO TRIGGER RESONANCE SHOCKWAVE Propagation</span>
          </div>

          {/* Interactive node hover tooltip */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ left: hoveredNode.x + 12, top: hoveredNode.y - 12 }}
                className="absolute pointer-events-none bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-[8px] sm:text-[9px] shadow-[0_0_15px_rgba(0,0,0,0.8)] z-30 flex flex-col gap-0.5 select-none"
              >
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
                  <span className="font-extrabold text-white">NODAL INTERCEPT: {hoveredNode.num}</span>
                </div>
                <span className="text-slate-500">SET: {hoveredNode.tabName}</span>
                <span className="text-cyan-400 font-extrabold uppercase text-[7px] mt-0.5 animate-pulse">Click to emit electro pulse</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Speed rotates / Auto sweep switches inside canvas bottom right */}
          <div className="absolute bottom-4 right-4 flex gap-2 select-none">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2 py-1 border font-mono text-[7px] md:text-[8px] font-black rounded uppercase tracking-wider transition cursor-pointer ${
                autoRotate ? 'border-cyan-500/20 bg-cyan-950/20 text-cyan-400' : 'border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              ROTATION sweep: {autoRotate ? 'AUTO' : 'STEADY'}
            </button>
          </div>
        </div>

        {/* Tab configuration control sidebar column */}
        <div className="lg:col-span-4 flex flex-col gap-4 bg-slate-950/45 border border-slate-900 p-4.5 rounded-2xl select-none">
          <div className="border-b border-slate-900 pb-2.5">
            <span className="text-[7.5px] font-mono tracking-widest text-[#a855f7] font-black uppercase bg-[#a855f7]/10 border border-[#a855f7]/20 px-1.5 py-0.5 rounded leading-none">ACTIVE WORKSPACE DECK</span>
            <h3 className="text-xs font-sans font-black text-slate-100 uppercase tracking-tight mt-1.5">
              {currentActiveTab.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">Customize sequence properties and topological display modes</p>
          </div>

          {/* Connected list of numbers preview in active tab */}
          <div className="flex flex-col gap-2">
            <span className="text-[8.5px] font-mono text-slate-405 font-bold uppercase tracking-wider">STRING SEQUENTIAL NODES:</span>
            <div className="flex flex-wrap gap-1.5 bg-black/60 border border-slate-900/60 p-3 rounded-xl min-h-[50px] items-center">
              {currentActiveTab.numbers.length === 0 ? (
                <span className="text-[10px] font-mono text-slate-600">No nodes in string</span>
              ) : (
                currentActiveTab.numbers.map((num, idx) => {
                  const isOscillating = pulsingNode && pulsingNode.tabId === currentActiveTab.id && pulsingNode.nodeIdx === idx;
                  return (
                    <div key={idx} className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setPulsingNode({
                            tabId: currentActiveTab.id,
                            nodeIdx: idx,
                            time: Date.now()
                          });
                          if (isTTSEnabled) {
                            playSpeech(`Surging pulse wave on node index ${idx + 1}, value ${num}.`);
                          }
                        }}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center font-sans font-extrabold text-[10px] transition-all cursor-pointer shadow-sm relative group active:scale-90 ${
                          isOscillating 
                            ? 'bg-white text-slate-950 border-white ring-2 ring-cyan-500/80 animate-bounce' 
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300'
                        }`}
                      >
                        {num}
                        <span className="absolute bottom-full inset-x-0 hidden group-hover:block bg-black text-[6.5px] text-slate-405 border border-slate-800 px-1 py-0.5 rounded mb-1 text-center font-bold">
                          IDX {idx}
                        </span>
                      </button>
                      {idx < currentActiveTab.numbers.length - 1 && (
                        <span className="text-slate-700 font-mono text-xs font-bold leading-none select-none">→</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modifiers Toolbar */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => handleRandomizeNumbers(currentActiveTab.id)}
              className="py-2.5 border border-slate-800 hover:border-slate-720 bg-slate-950/45 rounded-xl text-slate-350 hover:text-slate-100 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-450" />
              <span>RANDOMIZE STRING</span>
            </button>

            <button
              onClick={() => {
                const isVis = currentActiveTab.visible;
                handleToggleVisibility(currentActiveTab.id);
                addToast(
                  isVis ? 'STRING HIDDEN' : 'STRING EXPOSED',
                  `Successfully toggled dimensional footprint of ${currentActiveTab.name}.`,
                  'info'
                );
              }}
              className="py-2.5 border border-slate-800 hover:border-slate-720 bg-slate-950/45 rounded-xl text-slate-350 hover:text-slate-100 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {currentActiveTab.visible ? <EyeOff className="w-3.5 h-3.5 text-rose-450" /> : <Eye className="w-3.5 h-3.5 text-emerald-450" />}
              <span>{currentActiveTab.visible ? 'HIDE OVERLAY' : 'SHOW OVERLAY'}</span>
            </button>
          </div>

          {/* Stylings selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[8.5px] font-mono text-slate-405 font-bold uppercase tracking-wider">Topological visual theme:</span>
            <div className="grid grid-cols-3 gap-1 bg-black/40 border border-slate-900 rounded-xl p-1 font-mono text-[8.5px] font-bold uppercase text-center text-slate-500">
              {(['line', 'ribbon', 'glowing'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => handleStyleChange(currentActiveTab.id, style)}
                  className={`py-1.5 rounded-lg cursor-pointer transition ${
                    currentActiveTab.viewStyle === style 
                      ? 'bg-slate-905 border border-slate-800 text-cyan-400 font-extrabold shadow-sm' 
                      : 'hover:text-slate-300'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Background/Mesh type controls */}
          <div className="flex flex-col gap-2">
            <span className="text-[8.5px] font-mono text-slate-405 font-bold uppercase tracking-wider">Spatial Reference Mesh:</span>
            <div className="grid grid-cols-4 gap-1 bg-black/40 border border-slate-900 rounded-xl p-1 font-mono text-[8px] font-bold uppercase text-center text-slate-500">
              {(['lattice', 'vortex', 'geometric', 'none'] as const).map(mesh => (
                <button
                  key={mesh}
                  onClick={() => {
                    setMeshType(mesh);
                    if (mesh === 'none') setShowWireMesh(false);
                    else setShowWireMesh(true);
                  }}
                  className={`py-1 rounded-md cursor-pointer transition ${
                    showWireMesh && meshType === mesh 
                      ? 'bg-slate-905 border border-slate-800 text-[#a855f7] font-extrabold' 
                      : !showWireMesh && mesh === 'none'
                        ? 'bg-slate-905 border border-slate-800 text-slate-400 font-extrabold'
                        : 'hover:text-slate-300'
                  }`}
                >
                  {mesh}
                </button>
              ))}
            </div>
          </div>

          {/* Engage prediction algorithms button */}
          <div className="mt-auto pt-3 border-t border-slate-900/60">
            <button
              onClick={() => handleApplyToDeck(currentActiveTab.numbers, currentActiveTab.name)}
              className="w-full py-4 text-[10px] font-mono font-black text-slate-950 uppercase tracking-widest bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 hover:from-cyan-300 hover:to-fuchsia-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer transition hover:scale-[1.01]"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
              <span>POLARIZE SYSTEM TO THESE VECTORS</span>
            </button>
            <span className="text-[7.5px] font-mono text-slate-500 tracking-wide text-center uppercase mt-2 block select-none">
              Applies string sequence to global lottery prediction deck
            </span>
          </div>
        </div>

      </div>

      {/* Floating creation modal/panel inner component inside overlay */}
      <AnimatePresence>
        {isCreatorOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleCreateTab}
              className="w-full max-w-md bg-slate-950 border border-slate-850/80 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.85)] font-mono text-[10px]"
            >
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div className="flex gap-2 items-center">
                  <Layers className="w-4 h-4 text-cyan-450 animate-pulse" />
                  <span className="font-extrabold text-slate-100 uppercase tracking-tight">MANUAL GRID CO-ORDINATION CARDS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-extrabold uppercase">String name reference:</label>
                <input
                  type="text"
                  value={newTabName}
                  onChange={e => setNewTabName(e.target.value)}
                  placeholder="e.g. My Prime Vector"
                  className="w-full bg-black border border-slate-800 p-2.5 rounded-lg text-slate-200 tracking-wide font-mono focus:border-cyan-500/50 outline-none uppercase"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-extrabold uppercase flex justify-between">
                  <span>Input sequence: (Numbers 1-49)</span>
                  <span className="text-[8px] text-slate-500 font-bold">Separated by commas/whitespace</span>
                </label>
                <textarea
                  value={newTabNumbers}
                  onChange={e => setNewTabNumbers(e.target.value)}
                  placeholder="e.g. 7, 14, 21, 28, 35, 42"
                  rows={3}
                  className="w-full bg-black border border-slate-800 p-2.5 rounded-lg text-slate-200 tracking-wide font-mono focus:border-cyan-500/50 outline-none uppercase resize-none leading-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-extrabold uppercase">Topological theme color:</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['cyan', 'fuchsia', 'amber', 'emerald', 'rose'] as const).map(color => {
                    const clrInfo = colorMap[color];
                    const isSel = newTabColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTabColor(color)}
                        className={`py-2 border rounded-lg uppercase text-[8px] font-black cursor-pointer transition-all ${
                          isSel 
                            ? `${clrInfo.border} ${clrInfo.bg} ${clrInfo.text} font-black shadow-sm` 
                            : 'border-slate-850 hover:border-slate-800 text-slate-550 hover:text-slate-350'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="py-3 border border-slate-850 hover:border-slate-800 bg-slate-900/40 rounded-xl text-slate-400 hover:text-slate-250 hover:bg-slate-900 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  DISCARD STRING
                </button>
                
                <button
                  type="submit"
                  className="py-3 font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                >
                  INITIATE STRING
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
