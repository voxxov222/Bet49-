import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { motion } from 'motion/react';
import { Network, Plus, Trash2 } from 'lucide-react';

interface Node {
  id: number;
  x: number;
  y: number;
  z: number;
  isActive: boolean;
  connections: number[];
  number: number;
}

export default function QuantumTetrahedronSandbox() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [prediction, setPrediction] = useState<number>(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [dragNode, setDragNode] = useState<number | null>(null);
  const [connectStartNode, setConnectStartNode] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });

  // Initialize 64 nodes (representing a 64-tetrahedron grid or 64 number sets)
  useEffect(() => {
    const newNodes: Node[] = Array.from({ length: 64 }, (_, i) => {
      // Create a somewhat structured spherical or tetrahedral distribution
      const phi = Math.acos(-1 + (2 * i) / 64);
      const theta = Math.sqrt(64 * Math.PI) * phi;
      const r = 200;
      return {
        id: i,
        number: i + 1, // Number set 1-64
        x: r * Math.cos(theta) * Math.sin(phi),
        y: r * Math.sin(theta) * Math.sin(phi),
        z: r * Math.cos(phi),
        isActive: false,
        connections: [],
      };
    });
    setNodes(newNodes);
  }, []);

  // Simple prediction engine
  useEffect(() => {
    const m = tf.sequential();
    m.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [64] }));
    m.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    m.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
    setModel(m);
  }, []);

  const runPrediction = useCallback((activeNodes: boolean[]) => {
    if (!model) return;
    const input = tf.tensor2d([activeNodes.map(a => a ? 1 : 0)]);
    const output = model.predict(input) as tf.Tensor;
    output.data().then(data => {
      setPrediction(data[0]);
    });
  }, [model]);

  const toggleNode = (id: number) => {
    const newNodes = nodes.map(n => n.id === id ? { ...n, isActive: !n.isActive } : n);
    setNodes(newNodes);
    runPrediction(newNodes.map(n => n.isActive));
  };

  const connectNodes = (id1: number, id2: number) => {
    if (id1 === id2) return;
    setNodes(prev => prev.map(n => {
      if (n.id === id1 && !n.connections.includes(id2)) return { ...n, connections: [...n.connections, id2] };
      if (n.id === id2 && !n.connections.includes(id1)) return { ...n, connections: [...n.connections, id1] };
      return n;
    }));
  };

  const clearConnections = () => {
    setNodes(prev => prev.map(n => ({ ...n, connections: [] })));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (isRotating && !dragNode && !connectStartNode) {
        rotationRef.current.y += 0.005;
        rotationRef.current.x += 0.002;
      }

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);

      // Project 3D to 2D
      const projectedNodes = nodes.map(n => {
        // Rotate Y
        let x1 = n.x * cosY - n.z * sinY;
        let z1 = n.z * cosY + n.x * sinY;
        // Rotate X
        let y2 = n.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + n.y * sinX;
        
        // Perspective
        const scale = 400 / (400 + z2);
        
        return {
          ...n,
          projX: cx + x1 * scale,
          projY: cy + y2 * scale,
          scale: scale,
          zDepth: z2
        };
      });

      // Sort by depth for proper rendering order
      projectedNodes.sort((a, b) => b.zDepth - a.zDepth);

      // Draw connections
      ctx.lineWidth = 1;
      projectedNodes.forEach(node => {
        node.connections.forEach(connId => {
          const target = projectedNodes.find(n => n.id === connId);
          if (target) {
            ctx.beginPath();
            ctx.moveTo(node.projX, node.projY);
            ctx.lineTo(target.projX, target.projY);
            
            // Gradient line based on activity
            const grad = ctx.createLinearGradient(node.projX, node.projY, target.projX, target.projY);
            grad.addColorStop(0, node.isActive ? 'rgba(168, 85, 247, 0.5)' : 'rgba(51, 65, 85, 0.3)');
            grad.addColorStop(1, target.isActive ? 'rgba(168, 85, 247, 0.5)' : 'rgba(51, 65, 85, 0.3)');
            ctx.strokeStyle = grad;
            ctx.stroke();
          }
        });
      });

      // Draw active drag connection
      if (connectStartNode !== null) {
        const startNode = projectedNodes.find(n => n.id === connectStartNode);
        if (startNode) {
          ctx.beginPath();
          ctx.moveTo(startNode.projX, startNode.projY);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw nodes
      projectedNodes.forEach(node => {
        const radius = (node.isActive ? 12 : 8) * node.scale;
        
        // Glow for active
        if (node.isActive) {
          ctx.shadowBlur = 15 * node.scale;
          ctx.shadowColor = '#a855f7';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = node.isActive ? '#a855f7' : '#0f172a';
        ctx.strokeStyle = node.isActive ? '#d8b4fe' : '#334155';
        ctx.lineWidth = 2 * node.scale;
        
        ctx.beginPath();
        ctx.arc(node.projX, node.projY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;

        // Draw numbers
        ctx.fillStyle = node.isActive ? '#ffffff' : '#64748b';
        ctx.font = `${Math.max(8, 10 * node.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.number.toString(), node.projX, node.projY);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [nodes, isRotating, connectStartNode, mousePos]);

  const getCanvasMousePos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const getClosestNode = (x: number, y: number, cx: number, cy: number) => {
    const cosX = Math.cos(rotationRef.current.x);
    const sinX = Math.sin(rotationRef.current.x);
    const cosY = Math.cos(rotationRef.current.y);
    const sinY = Math.sin(rotationRef.current.y);

    let closest = null;
    let minDist = Infinity;

    nodes.forEach(n => {
      let x1 = n.x * cosY - n.z * sinY;
      let z1 = n.z * cosY + n.x * sinY;
      let y2 = n.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + n.y * sinX;
      const scale = 400 / (400 + z2);
      const projX = cx + x1 * scale;
      const projY = cy + y2 * scale;
      
      const dist = Math.hypot(projX - x, projY - y);
      if (dist < 20 * scale && dist < minDist) {
        minDist = dist;
        closest = n.id;
      }
    });

    return closest;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getCanvasMousePos(e, canvas);
    setMousePos(pos);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const closest = getClosestNode(pos.x, pos.y, cx, cy);

    if (closest !== null) {
      // If pressing a node, prepare for connection drag
      setConnectStartNode(closest);
      setIsRotating(false);
    } else {
      // If empty space, drag to rotate
      setIsRotating(false);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getCanvasMousePos(e, canvas);
    const isLeftClick = 'buttons' in e ? (e as any).buttons === 1 : true;
    
    if (connectStartNode === null && !isRotating && isLeftClick) {
      // Manual rotation
      rotationRef.current.y += (pos.x - mousePos.x) * 0.01;
      rotationRef.current.x += (pos.y - mousePos.y) * 0.01;
    }
    
    setMousePos(pos);
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (connectStartNode !== null) {
      const pos = getCanvasMousePos(e, canvas);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const endNode = getClosestNode(pos.x, pos.y, cx, cy);

      if (endNode !== null && endNode !== connectStartNode) {
        connectNodes(connectStartNode, endNode);
      } else if (endNode === connectStartNode) {
        // Just a click on a node
        toggleNode(connectStartNode);
      }
      
      setConnectStartNode(null);
    }
    
    setIsRotating(true);
  };

  return (
    <div className="bg-black/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
          <Network className="w-5 h-5 text-purple-400" />
          Quantum 64 Tetrahedron Sandbox
        </h3>
        <div className="flex gap-4 items-center">
          <button 
            onClick={clearConnections}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-400 transition"
          >
            <Trash2 className="w-3 h-3" /> Clear Links
          </button>
          <div className="px-4 py-2 bg-slate-950 rounded-lg text-emerald-400 font-mono text-sm border border-slate-900 shadow-inner">
            State Collapse Probability: <span className="font-bold">{(prediction * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500} 
          className="w-full bg-slate-950/50 rounded-lg border border-slate-900 touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        <div className="absolute bottom-4 left-4 flex gap-2">
           <div className="bg-slate-900/80 backdrop-blur text-slate-400 text-[10px] font-mono px-2 py-1 rounded border border-slate-800">
             Click: Toggle Node
           </div>
           <div className="bg-slate-900/80 backdrop-blur text-slate-400 text-[10px] font-mono px-2 py-1 rounded border border-slate-800">
             Drag Node: Connect
           </div>
           <div className="bg-slate-900/80 backdrop-blur text-slate-400 text-[10px] font-mono px-2 py-1 rounded border border-slate-800">
             Drag Space: Rotate
           </div>
        </div>
      </div>
    </div>
  );
}
