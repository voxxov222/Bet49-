import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, Compass, Maximize2, Radio, Info, Activity, Layers, Target } from 'lucide-react';

interface LottoDraw {
  id: string;
  date: string;
  numbers: number[];
}

interface OmniQuantum3DSpaceProps {
  draws: LottoDraw[];
  activeProposedNumbers: number[];
  selectedStrategyName: string;
  onSelectProposedNumber: (n: number) => void;
}

export default function OmniQuantum3DSpace({
  draws,
  activeProposedNumbers,
  selectedStrategyName,
  onSelectProposedNumber
}: OmniQuantum3DSpaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Layout & 3D orientation states
  const [modelType, setModelType] = useState<'sphere' | 'helix' | 'cube' | 'kathara' | 'fibonacci' | 'pi' | 'tesseract' | 'solar'>('sphere');
  const yawRef = useRef(0.45);
  const pitchRef = useRef(0.25);
  const yawTextRef = useRef<HTMLSpanElement | null>(null);
  const pitchTextRef = useRef<HTMLSpanElement | null>(null);
  const [zoom, setZoom] = useState(1.1);
  const [isDragging, setIsDragging] = useState(false);
  const draggedRef = useRef({ lastX: 0, lastY: 0 });
  const [hoveredNode, setHoveredNode] = useState<{ num: number; x: number; y: number } | null>(null);
  const [showDrawLines, setShowDrawLines] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  // Base list of 3D node structural definitions
  const nodeCoordinates = useMemo(() => {
    const coords: { num: number; x: number; y: number; z: number }[] = [];
    
    if (modelType === 'sphere') {
      // Uniform Fibonacci Sphere allocation
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
      for (let i = 1; i <= 49; i++) {
        const y = 1 - ((i - 1) / 48) * 2; // y goes from 1 to -1
        const radius = Math.sqrt(1 - y * y); // radius at y
        const theta = phi * i; // Golden angle increment
        
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        
        coords.push({
          num: i,
          x: x * 150,
          y: y * 150,
          z: z * 150
        });
      }
    } else if (modelType === 'helix') {
      // Dynamic Double Helix model
      for (let i = 1; i <= 49; i++) {
        const spiralAngle = (i / 49) * Math.PI * 8; // Multiple rotations
        const h = (i / 49) * 240 - 120; // Vertical height span
        const radius = 65 + Math.sin(spiralAngle * 0.5) * 25;

        coords.push({
          num: i,
          x: Math.cos(spiralAngle) * radius,
          y: h,
          z: Math.sin(spiralAngle) * radius
        });
      }
    } else if (modelType === 'cube') {
      // 3D Grid coordinate space allocation
      // 49 nodes: 3x4x4 structure or math mapping
      for (let i = 1; i <= 49; i++) {
        const xIdx = (i - 1) % 4;
        const yIdx = Math.floor(((i - 1) % 16) / 4);
        const zIdx = Math.floor((i - 1) / 16);
        
        coords.push({
          num: i,
          x: (xIdx - 1.5) * 85,
          y: (yIdx - 1.5) * 85,
          z: (zIdx - 1) * 95
        });
      }
    } else if (modelType === 'kathara') {
      // Kathara Grid structure: levels spaced with root-2 layout (1.414)
      for (let i = 1; i <= 49; i++) {
        const level = Math.floor((i - 1) / 5);
        const positionInLevel = (i - 1) % 5;
        const angle = (positionInLevel / 5) * Math.PI * 2;
        const r = 95 * 1.414 * (level % 2 === 0 ? 1 : 0.65);
        coords.push({
          num: i,
          x: Math.cos(angle) * r,
          y: (level - 4) * 40 * 1.414,
          z: Math.sin(angle) * r
        });
      }
    } else if (modelType === 'fibonacci') {
      // Golden Ratio 1.618 spiral conical horn layout
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.399 rad
      for (let i = 1; i <= 49; i++) {
        const theta = i * goldenAngle;
        const r = 24 * Math.pow(1.055, i) * 1.618;
        coords.push({
          num: i,
          x: Math.cos(theta) * r,
          y: (i - 25) * 5.8,
          z: Math.sin(theta) * r
        });
      }
    } else if (modelType === 'pi') {
      // Pi 3.14 concentric sphere layers
      for (let i = 1; i <= 49; i++) {
        const ring = Math.floor((i - 1) / 8); 
        const rIndex = (i - 1) % 8;
        const angle = (rIndex / 8) * Math.PI * 2;
        const radius = (ring + 1) * 3.14 * 9.5;
        coords.push({
          num: i,
          x: Math.cos(angle) * radius * 1.3,
          y: Math.sin(ring * 3.14159) * 65,
          z: Math.sin(angle) * radius * 1.3
        });
      }
    } else if (modelType === 'tesseract') {
      // Double Loop Vortex Math 124857 and Tesseract structure
      const vortexSeq = [1, 2, 4, 8, 7, 5];
      for (let i = 1; i <= 49; i++) {
        const seqVal = vortexSeq[(i - 1) % 6];
        const angle = (seqVal / 9) * Math.PI * 2 + (i / 49) * Math.PI;
        const r = 110 + (seqVal * 7);
        coords.push({
          num: i,
          x: Math.cos(angle) * r,
          y: Math.sin(i * 1.24857) * 95,
          z: Math.sin(angle) * r
        });
      }
    } else if (modelType === 'solar') {
      // 8 Planetary orbits around center Sun
      for (let i = 1; i <= 49; i++) {
        if (i === 1) { // Sun at core center
          coords.push({ num: i, x: 0, y: 0, z: 0 });
        } else {
          const orbitIndex = Math.floor((i - 2) / 6) + 1; // 1 to 8 orbits
          const angle = ((i - 2) % 6) * (Math.PI / 3) + (orbitIndex * 0.7);
          const r = orbitIndex * 24 + 18;
          coords.push({
            num: i,
            x: Math.cos(angle) * r,
            y: Math.sin(orbitIndex * 1.5) * 12,
            z: Math.sin(angle) * r
          });
        }
      }
    }
    return coords;
  }, [modelType]);

  // Touch & drag events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    draggedRef.current = { lastX: e.clientX, lastY: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      // Detect node hovers on 2D project scale
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let closest: { num: number; x: number; y: number; dist: number } | null = null;

      // Access coordinates on actual display
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const fov = 350;

      nodeCoordinates.forEach(node => {
        // Apply Rotations to node
        const cosY = Math.cos(yawRef.current);
        const sinY = Math.sin(yawRef.current);
        const cosP = Math.cos(pitchRef.current);
        const sinP = Math.sin(pitchRef.current);

        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y2 = node.y * cosP - z1 * sinP;
        const z2 = node.y * sinP + z1 * cosP;

        const dScale = fov / (fov + z2 * zoom);
        const sx = cx + x1 * zoom * dScale;
        const sy = cy + y2 * zoom * dScale;

        const dist = Math.hypot(sx - mouseX, sy - mouseY);
        if (dist < 14) {
          if (!closest || dist < closest.dist) {
            closest = { num: node.num, x: sx, y: sy, dist };
          }
        }
      });

      if (closest) {
        setHoveredNode({ num: (closest as any).num, x: (closest as any).x, y: (closest as any).y });
      } else {
        setHoveredNode(null);
      }
      return;
    }

    const deltaX = e.clientX - draggedRef.current.lastX;
    const deltaY = e.clientY - draggedRef.current.lastY;
    draggedRef.current = { lastX: e.clientX, lastY: e.clientY };

    yawRef.current += deltaX * 0.005;
    pitchRef.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitchRef.current + deltaY * 0.005));
    setAutoRotate(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.4, Math.min(2.5, prev - e.deltaY * 0.001)));
  };

  // Setup the drawing loop inside the HTML Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Resize to container bounds
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

      // Autoration increment
      if (autoRotate && !isDragging) {
        yawRef.current = (yawRef.current + 0.0018) % (Math.PI * 2);
      }

      // Update telemetry text directly
      if (yawTextRef.current) {
        yawTextRef.current.textContent = `YAW_ANGLE: ${yawRef.current.toFixed(3)} RAD`;
      }
      if (pitchTextRef.current) {
        pitchTextRef.current.textContent = `PITCH_ANGLE: ${pitchRef.current.toFixed(3)} RAD`;
      }

      const cosY = Math.cos(yawRef.current);
      const sinY = Math.sin(yawRef.current);
      const cosP = Math.cos(pitchRef.current);
      const sinP = Math.sin(pitchRef.current);

      // Map out actual projected node locations
      const projectedNodes = nodeCoordinates.map(node => {
        // Yaw (rot around Y)
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        
        // Pitch (rot around X)
        const y2 = node.y * cosP - z1 * sinP;
        const z2 = node.y * sinP + z1 * cosP;

        const distanceScale = fov / (fov + z2 * zoom);
        const px = cx + x1 * zoom * distanceScale;
        const py = cy + y2 * zoom * distanceScale;

        // Flags
        const isProposed = activeProposedNumbers.includes(node.num);

        return {
          num: node.num,
          px,
          py,
          pz: z2, // store depth for painters sorting algorithm
          isProposed,
          dScale: distanceScale
        };
      });

      // Sort by depth (pz descending, so deeper elements are rendered first)
      const sortedNodes = [...projectedNodes].sort((a, b) => b.pz - a.pz);

      // 1. Draw connecting mesh network (Grid overlay)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.03)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const distVal = Math.hypot(
            nodeCoordinates[i].x - nodeCoordinates[j].x,
            nodeCoordinates[i].y - nodeCoordinates[j].y,
            nodeCoordinates[i].z - nodeCoordinates[j].z
          );
          if (distVal < 110) {
            ctx.beginPath();
            ctx.moveTo(projectedNodes[i].px, projectedNodes[i].py);
            ctx.lineTo(projectedNodes[j].px, projectedNodes[j].py);
            ctx.stroke();
          }
        }
      }

      // 2. Draw Past Draw Constellation Bridges
      if (showDrawLines && draws.length > 0) {
        draws.slice(0, 5).forEach((draw, drawIdx) => {
          // Opacity fades for older draws
          const drawAlpha = Math.max(0.04, 0.45 - drawIdx * 0.09);
          ctx.strokeStyle = drawIdx === 0 ? 'rgba(236, 72, 153, 0.5)' : `rgba(168, 85, 247, ${drawAlpha})`;
          ctx.lineWidth = drawIdx === 0 ? 2 : 1;

          ctx.beginPath();
          let drawingStarted = false;
          
          // Connect draw numbers sequentially
          draw.numbers.forEach(num => {
            const nodePrj = projectedNodes.find(n => n.num === num);
            if (nodePrj) {
              if (!drawingStarted) {
                ctx.moveTo(nodePrj.px, nodePrj.py);
                drawingStarted = true;
              } else {
                ctx.lineTo(nodePrj.px, nodePrj.py);
              }
            }
          });
          ctx.stroke();

          // Sparkle nodes on drawings path
          draw.numbers.forEach(num => {
            const nodePrj = projectedNodes.find(n => n.num === num);
            if (nodePrj) {
              ctx.fillStyle = drawIdx === 0 ? 'rgba(236, 72, 153, 0.4)' : 'rgba(168, 85, 247, 0.15)';
              ctx.beginPath();
              ctx.arc(nodePrj.px, nodePrj.py, drawIdx === 0 ? 8 : 4, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        });
      }

      // 2.5 Draw Futuristic Custom Mathematical Model Overlays
      if (modelType === 'kathara') {
        // Draw Kathara level links and the 1-3-7-6-4-9 Krystal Spiral
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < projectedNodes.length; i++) {
          for (let j = i + 1; j < projectedNodes.length; j++) {
            const diff = Math.abs(projectedNodes[i].num - projectedNodes[j].num);
            if (diff === 1 || diff === 5 || diff === 12) {
              ctx.beginPath();
              ctx.moveTo(projectedNodes[i].px, projectedNodes[i].py);
              ctx.lineTo(projectedNodes[j].px, projectedNodes[j].py);
              ctx.stroke();
            }
          }
        }
        
        const krystalPath = [1, 3, 7, 6, 4, 9, 13, 17, 26, 34, 49];
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.75)'; // Pink Krystal spiral sequence
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        krystalPath.forEach(num => {
          const nodePrj = projectedNodes.find(n => n.num === num);
          if (nodePrj) {
            if (!started) {
              ctx.moveTo(nodePrj.px, nodePrj.py);
              started = true;
            } else {
              ctx.lineTo(nodePrj.px, nodePrj.py);
            }
          }
        });
        ctx.stroke();
      } else if (modelType === 'fibonacci') {
        // Draw 1.618 logarithmic golden spiral connectors
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)'; // Amber/Gold spiral
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        const sortedSpiral = [...projectedNodes].sort((a,b) => a.num - b.num);
        sortedSpiral.forEach(nodePrj => {
          if (!started) {
            ctx.moveTo(nodePrj.px, nodePrj.py);
            started = true;
          } else {
            ctx.lineTo(nodePrj.px, nodePrj.py);
          }
        });
        ctx.stroke();
      } else if (modelType === 'pi') {
        // Nested sphere resonance hoops spaced by Pi 3.14
        for (let rFactor = 1; rFactor <= 5; rFactor++) {
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.4 - rFactor * 0.05})`; // Violet resonance harmonics
          ctx.lineWidth = 1;
          let angleStarted = false;
          ctx.beginPath();
          for (let angle = 0; angle <= Math.PI * 2 + 0.1; angle += 0.08) {
            const rx = Math.cos(angle) * rFactor * 3.14 * 9.5 * 1.3;
            const rz = Math.sin(angle) * rFactor * 3.14 * 9.5 * 1.3;
            const ry = Math.sin((rFactor - 1) * 3.14159) * 65;

            const x1 = rx * cosY - rz * sinY;
            const z1 = rx * sinY + rz * cosY;
            const y2 = ry * cosP - z1 * sinP;
            const z2 = ry * sinP + z1 * cosP;

            const dScale = fov / (fov + z2 * zoom);
            const px = cx + x1 * zoom * dScale;
            const py = cy + y2 * zoom * dScale;

            if (!angleStarted) {
              ctx.moveTo(px, py);
              angleStarted = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        }
      } else if (modelType === 'tesseract') {
        // Vortex Math infinity loops 1 -> 2 -> 4 -> 8 -> 7 -> 5 -> 1 & harmonics 124857
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.65)'; // Radiant Magenta
        ctx.lineWidth = 1.6;
        const baseVortex = [1, 2, 4, 8, 7, 5];
        for (let offset = 0; offset <= 7; offset++) {
          ctx.beginPath();
          let started = false;
          const shift = offset * 6;
          for (let k = 0; k <= 6; k++) {
            const baseNum = baseVortex[k % 6];
            const num = baseNum + shift;
            if (num <= 49) {
              const nodePrj = projectedNodes.find(n => n.num === num);
              if (nodePrj) {
                if (!started) {
                  ctx.moveTo(nodePrj.px, nodePrj.py);
                  started = true;
                } else {
                  ctx.lineTo(nodePrj.px, nodePrj.py);
                }
              }
            }
          }
          ctx.stroke();
        }
      } else if (modelType === 'solar') {
        // Render concentric orbital rings of planets
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)'; // Cyan orbits
        ctx.lineWidth = 1;
        for (let orbitIndex = 1; orbitIndex <= 8; orbitIndex++) {
          ctx.beginPath();
          let angleStarted = false;
          for (let angle = 0; angle <= Math.PI * 2 + 0.1; angle += 0.08) {
            const rx = Math.cos(angle) * (orbitIndex * 24 + 18);
            const rz = Math.sin(angle) * (orbitIndex * 24 + 18);
            const ry = Math.sin(orbitIndex * 1.5) * 12;

            const x1 = rx * cosY - rz * sinY;
            const z1 = rx * sinY + rz * cosY;
            const y2 = ry * cosP - z1 * sinP;
            const z2 = ry * sinP + z1 * cosP;

            const dScale = fov / (fov + z2 * zoom);
            const px = cx + x1 * zoom * dScale;
            const py = cy + y2 * zoom * dScale;

            if (!angleStarted) {
              ctx.moveTo(px, py);
              angleStarted = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        }
      }

      // 3. Draw Nodes (painter sorting: back to front)
      sortedNodes.forEach(node => {
        const radius = Math.max(4, 9 * node.dScale);
        
        // Dynamic node glows & themes
        let nodeFill = 'rgba(15, 23, 42, 0.85)';
        let nodeStroke = 'rgba(100, 116, 139, 0.4)';
        let nodeTextColor = 'rgba(148, 163, 184, 0.7)';
        ctx.shadowBlur = 0;

        if (node.isProposed) {
          // Highlight Active strategy predictions chosen inside the HUD
          nodeFill = 'rgba(6, 182, 212, 0.95)';
          nodeStroke = 'rgba(34, 211, 238, 1)';
          nodeTextColor = 'rgba(255, 255, 255, 1)';
          ctx.shadowColor = 'rgba(6, 182, 212, 0.9)';
          ctx.shadowBlur = radius * 1.5;
        } else if (draws[0]?.numbers.includes(node.num)) {
          // Highlight last drawing outcome
          nodeFill = 'rgba(236, 72, 153, 0.85)';
          nodeStroke = 'rgba(244, 63, 94, 1)';
          nodeTextColor = 'rgba(255, 255, 255, 0.95)';
        }

        // Drop circle node
        ctx.fillStyle = nodeFill;
        ctx.strokeStyle = nodeStroke;
        ctx.lineWidth = node.isProposed ? 2 : 1;
        ctx.beginPath();
        ctx.arc(node.px, node.pz, radius, 0, Math.PI * 2); // Wait, draw on projected x and projected y:
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // reset shader glow

        // Nodes numerical ID label overlay (when reasonably focused)
        if (node.dScale > 0.42) {
          ctx.font = `bold ${Math.max(6.5, 9 * node.dScale)}px monospace`;
          ctx.fillStyle = nodeTextColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(node.num), node.px, node.py);
        }
      });

      // 4. Render Active Strategy Sweeping Particle Rings
      activeProposedNumbers.forEach(num => {
        const matchingPrj = projectedNodes.find(n => n.num === num);
        if (matchingPrj) {
          const pulseSize = (Date.now() % 1600) / 1600; // loop factor
          ctx.strokeStyle = `rgba(34, 211, 238, ${1 - pulseSize})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(matchingPrj.px, matchingPrj.py, 12 + pulseSize * 30, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [nodeCoordinates, zoom, isDragging, activeProposedNumbers, draws, showDrawLines, autoRotate]);

  return (
    <div className="bg-black/45 border border-cyan-500/15 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden h-[460px] group/space">
      
      {/* 3D background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Cybernetic HUD overlay metrics */}
      <header className="flex justify-between items-start z-10">
        <div className="flex gap-2 items-center">
          <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">OMNI QUANTUM 3D HUD SPACE</h3>
            <p className="text-[10px] text-slate-500 font-mono">DRAG TO ROTATE | SCROLL TO EXTEND DEPTH ZOOM</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 md:gap-1.5 max-w-sm md:max-w-xl justify-end">
          {(['sphere', 'helix', 'cube', 'kathara', 'fibonacci', 'pi', 'tesseract', 'solar'] as const).map(m => (
            <button
              key={m}
              onClick={() => setModelType(m)}
              className={`px-2 py-0.5 rounded text-[8.5px] font-mono border tracking-widest font-bold uppercase cursor-pointer transition-all ${
                modelType === m
                  ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                  : 'border-slate-900 bg-slate-950/60 text-slate-400 hover:border-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {/* Primary 3D Space Canvas canvas viewport */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="flex-1 rounded-xl bg-black/90 border border-slate-950 relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Dynamic coordinate crosshairs */}
        <div className="absolute top-4 left-4 font-mono text-[8px] text-slate-500 pointer-events-none flex flex-col gap-0.5 select-none opacity-80">
          <span ref={yawTextRef}>YAW_ANGLE: {yawRef.current.toFixed(3)} RAD</span>
          <span ref={pitchTextRef}>PITCH_ANGLE: {pitchRef.current.toFixed(3)} RAD</span>
          <span>MAG_ZOOM: {(zoom * 100).toFixed(0)}%</span>
          <span>ACTIVE_VECTORS: {nodeCoordinates.length} / 49</span>
        </div>

        {/* Floating selected/proposed strategy tooltip indicator */}
        <div className="absolute top-4 right-4 font-mono text-[8px] border border-cyan-500/20 bg-slate-950/85 px-2.5 py-1.5 rounded pointer-events-none select-none flex flex-col items-end gap-1">
          <span className="text-slate-400 font-semibold uppercase">ACTIVE DECRYPT SEQUENCE:</span>
          <span className="text-cyan-400 font-black tracking-widest uppercase">{selectedStrategyName || 'NONE'}</span>
          <div className="flex gap-1 items-center mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-500 font-bold uppercase text-[7.5px]">Luminous Points mapped as cyan</span>
          </div>
        </div>

        {/* Hover-Node interactive feedback HUD card inside canvas */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ left: hoveredNode.x + 12, top: hoveredNode.y - 15 }}
              className="absolute pointer-events-none bg-slate-950/95 border border-cyan-400/40 rounded-lg p-2 font-mono text-[8.5px] shadow-[0_0_15px_rgba(6,182,212,0.25)] select-none z-20 flex flex-col gap-0.5"
            >
              <div className="flex items-center gap-1.5 text-cyan-450 font-extrabold">
                <Target className="w-3 h-3 text-cyan-400 animate-ping" />
                <span>NODE KEY: {hoveredNode.num}</span>
              </div>
              <span className="text-slate-500">
                Lattice coordinates: [{(hoveredNode.x).toFixed(1)}, {(hoveredNode.y).toFixed(1)}]
              </span>
              <span className="text-slate-400 font-bold uppercase mt-0.5 text-[7px] cursor-pointer">
                Click to highlight/select point
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Bottom Control Buttons Bar inside Viewport */}
        <div className="absolute bottom-4 inset-x-4 flex justify-between items-center bg-black/75 border border-slate-900 rounded-lg px-2.5 py-1.5 backdrop-blur-md select-none">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowDrawLines(prev => !prev)}
              className={`px-2 py-1 rounded text-[8px] font-mono uppercase font-black transition cursor-pointer border ${
                showDrawLines 
                  ? 'border-purple-500/45 text-purple-400 bg-purple-950/25' 
                  : 'border-slate-800 text-slate-500 bg-slate-950/60 hover:text-slate-400'
              }`}
            >
              Show Draw Constellations: {showDrawLines ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setAutoRotate(prev => !prev)}
              className={`px-2 py-1 rounded text-[8px] font-mono uppercase font-black transition cursor-pointer border ${
                autoRotate 
                  ? 'border-cyan-500/45 text-cyan-450 bg-cyan-950/25' 
                  : 'border-slate-800 text-slate-500 bg-slate-950/60 hover:text-slate-400'
              }`}
            >
              OS Rotation Sweep: {autoRotate ? 'AUTO' : 'MANUAL'}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-450 animate-pulse" />
            <span className="text-[7.5px] font-mono text-cyan-500 font-extrabold uppercase">3D PROJECTION ENGINE RUNNING</span>
          </div>
        </div>

      </div>

      {/* Coordinate Click Trigger Interactor List */}
      <footer className="z-10 flex gap-2 items-center flex-wrap select-none">
        <span className="text-[8px] font-mono text-slate-400 font-extrabold uppercase">ACTIVE ALGORITHM NUMBERS DECRYPTED:</span>
        <div className="flex gap-1 overflow-x-auto pr-1">
          {activeProposedNumbers.map(n => (
            <button
              key={n}
              onClick={() => onSelectProposedNumber(n)}
              className="w-6 h-6 rounded border border-cyan-400/35 bg-cyan-950/15 text-[10px] font-mono font-black text-cyan-300 hover:bg-cyan-500 hover:text-black transition cursor-pointer flex items-center justify-center relative group"
            >
              {n}
              <span className="absolute bottom-full inset-x-0 hidden group-hover:block bg-black px-1 py-0.5 text-[6.5px] text-cyan-400 border border-cyan-500/20 rounded mb-1 text-center font-bold">
                PROJ
              </span>
            </button>
          ))}
        </div>
      </footer>

    </div>
  );
}
