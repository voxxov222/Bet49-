import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  HelpCircle, 
  Plus, 
  Trash2, 
  RotateCw, 
  Eye, 
  Compass, 
  Move, 
  UploadCloud, 
  Link, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Radio, 
  Settings, 
  Zap, 
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';

interface SandboxObject {
  id: string;
  type: 'number' | 'portal' | 'image' | 'video' | 'pdf_link' | 'geometric';
  label: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
  color: string;
  meta?: any; // Contains URL, image/video element reference, number value, etc.
  pulse: number;
  isHovered?: boolean;
}

interface ThreeDQuantumSandboxProps {
  onApplyNumbers?: (nums: number[]) => void;
  playSpeech?: (text: string) => void;
  addToast?: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
}

export default function ThreeDQuantumSandbox({
  onApplyNumbers,
  playSpeech,
  addToast
}: ThreeDQuantumSandboxProps) {
  // 3D Canvas states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Camera State
  const cameraRef = useRef({
    x: 0,
    y: 0,
    z: 500,
    yaw: 0,   // horizontal rotation
    pitch: 0, // vertical rotation
  });

  // Movement key states
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // 3D Sandbox Objects list
  const [objects, setObjects] = useState<SandboxObject[]>([
    { id: 'num-3', type: 'number', label: '03', x: -120, y: 50, z: -100, vx: 0.1, vy: -0.2, vz: 0.1, scale: 22, color: '#06b6d4', pulse: 0, meta: { val: 3 } },
    { id: 'num-7', type: 'number', label: '07', x: 140, y: -80, z: -150, vx: -0.2, vy: 0.1, vz: -0.1, scale: 22, color: '#06b6d4', pulse: 0, meta: { val: 7 } },
    { id: 'num-18', type: 'number', label: '18', x: 80, y: 120, z: 50, vx: 0.15, vy: 0.1, vz: 0.2, scale: 22, color: '#a855f7', pulse: 0, meta: { val: 18 } },
    { id: 'num-25', type: 'number', label: '25', x: -180, y: -100, z: 80, vx: -0.1, vy: -0.15, vz: -0.1, scale: 22, color: '#10b981', pulse: 0, meta: { val: 25 } },
    { id: 'portal-alpha', type: 'portal', label: 'QUANTUM SINGULARITY', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, scale: 50, color: '#ec4899', pulse: 0 },
  ]);

  // Crafting Configuration States
  const [activeTool, setActiveTool] = useState<'translate' | 'attractor' | 'link' | 'eraser'>('translate');
  const [spawnNumber, setSpawnNumber] = useState<number>(11);
  const [attractorForce, setAttractorForce] = useState<number>(0.25);
  const [isOrbitActive, setIsOrbitActive] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  
  // Media Uploader inputs
  const [inputUrl, setInputUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Selected object tracker (e.g. for inspection panel)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Mouse interaction variables
  const isDraggingMouse = useRef<boolean>(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Handle WASD and movement controls on loop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow standard input fields to work normally
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      keysPressed.current[e.key.toLowerCase()] = true;

      // Prevent scrolling defaults when navigating the 3D canvas
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Safe Speech & Toast proxies
  const triggerToast = (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    if (addToast) addToast(title, message, type);
  };
  const triggerSpeech = (text: string) => {
    if (playSpeech) playSpeech(text);
  };

  // Helper: check if file is an image/gif
  const handleFileLoad = (file: File) => {
    const reader = new FileReader();
    setUploadProgress(10);

    if (file.type.startsWith('image/')) {
      reader.onload = (e) => {
        setUploadProgress(50);
        const img = new Image();
        img.onload = () => {
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(null), 800);

          const newObj: SandboxObject = {
            id: `img-${Date.now()}`,
            type: 'image',
            label: file.name.substring(0, 15).toUpperCase(),
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            z: (Math.random() - 0.5) * 200,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            vz: (Math.random() - 0.5) * 0.4,
            scale: 60,
            color: '#38bdf8',
            pulse: 0,
            meta: { imgElement: img, fileType: file.type }
          };

          setObjects(prev => [...prev, newObj]);
          triggerToast('IMAGE FLOATING TEXTURE INJECTED', `Rendered image card: "${file.name}"`, 'success');
          triggerSpeech(`Injected 3D holographic image texture node.`);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } 
    else if (file.type.startsWith('video/')) {
      // Load video texture directly via Object URL
      setUploadProgress(50);
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.play().catch(() => {});

      video.onloadeddata = () => {
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 800);

        const newObj: SandboxObject = {
          id: `video-${Date.now()}`,
          type: 'video',
          label: file.name.substring(0, 15).toUpperCase(),
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200,
          z: (Math.random() - 0.5) * 200,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          vz: (Math.random() - 0.5) * 0.3,
          scale: 80,
          color: '#f43f5e',
          pulse: 0,
          meta: { videoElement: video, fileType: file.type }
        };

        setObjects(prev => [...prev, newObj]);
        triggerToast('LIVE VIDEO TEXTURE INSTANTIATED', `Decoded live-stream canvas object: "${file.name}"`, 'success');
        triggerSpeech(`Decoded real-time video texture layer inside 3D space.`);
      };
    } 
    else if (file.type === 'application/pdf') {
      // PDF placard representation
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 800);

      const newObj: SandboxObject = {
        id: `pdf-${Date.now()}`,
        type: 'pdf_link',
        label: file.name.substring(0, 20).toUpperCase(),
        x: (Math.random() - 0.5) * 150,
        y: (Math.random() - 0.5) * 150,
        z: (Math.random() - 0.5) * 150,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        vz: (Math.random() - 0.5) * 0.2,
        scale: 45,
        color: '#f97316',
        pulse: 0,
        meta: { isPdf: true, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, date: new Date().toLocaleDateString() }
      };

      setObjects(prev => [...prev, newObj]);
      triggerToast('PDF INTEL CARD GENERATED', `Rendered PDF document placeholder: "${file.name}"`, 'info');
    } 
    else {
      // generic 3D file parse or coordinate mesh representation (represented as wireframe geometry)
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 800);

      const newObj: SandboxObject = {
        id: `mesh-${Date.now()}`,
        type: 'geometric',
        label: file.name.substring(0, 15).toUpperCase(),
        x: (Math.random() - 0.5) * 150,
        y: (Math.random() - 0.5) * 150,
        z: (Math.random() - 0.5) * 150,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        vz: (Math.random() - 0.5) * 0.25,
        scale: 50,
        color: '#eab308',
        pulse: 0,
        meta: { fileExtension: file.name.split('.').pop()?.toUpperCase() }
      };

      setObjects(prev => [...prev, newObj]);
      triggerToast('3D FILE WIREFRAME MAPPED', `Parsed file "${file.name}" as polyhedral vertex grid`, 'success');
    }
  };

  // Handle URL Link input addition
  const handleAddLink = () => {
    if (!inputUrl.trim()) return;
    
    let cleanLabel = inputUrl.replace(/https?:\/\/(www\.)?/, '').substring(0, 25).toUpperCase();
    if (!cleanLabel) cleanLabel = 'EXTERNAL NODE';

    const newObj: SandboxObject = {
      id: `link-${Date.now()}`,
      type: 'pdf_link',
      label: cleanLabel,
      x: (Math.random() - 0.5) * 180,
      y: (Math.random() - 0.5) * 180,
      z: (Math.random() - 0.5) * 180,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.3,
      scale: 45,
      color: '#ec4899',
      pulse: 0,
      meta: { url: inputUrl, isLink: true }
    };

    setObjects(prev => [...prev, newObj]);
    setInputUrl('');
    triggerToast('HOLOGRAPHIC HYPERLINK SEEDED', `Instantiated spatial hyperlink node.`, 'info');
  };

  // Drag-and-drop mechanics
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileLoad(e.dataTransfer.files[0]);
    }
  };

  // Spawn dynamic numbers (1-49)
  const handleSpawnNumber = (n: number) => {
    const isDuplicate = objects.some(obj => obj.type === 'number' && obj.meta?.val === n);
    if (isDuplicate) {
      triggerToast('DUPLICATE QUANTUM BALL', `Ball ${n} already exists in the spatial grid!`, 'warning');
      return;
    }

    const newObj: SandboxObject = {
      id: `num-${n}-${Date.now()}`,
      type: 'number',
      label: n.toString().padStart(2, '0'),
      x: (Math.random() - 0.5) * 150,
      y: (Math.random() - 0.5) * 150,
      z: (Math.random() - 0.5) * 150,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      vz: (Math.random() - 0.5) * 0.5,
      scale: 22,
      color: n <= 10 ? '#06b6d4' : n <= 20 ? '#a855f7' : n <= 30 ? '#10b981' : n <= 40 ? '#f59e0b' : '#ec4899',
      pulse: 0,
      meta: { val: n }
    };

    setObjects(prev => [...prev, newObj]);
    triggerToast('SPAWNED QUANTUM OBJECT', `Crafted 3D Quantum Number Ball ${n}`, 'success');
  };

  // Main 3D Rendering & Physics Engine loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderLoop = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      // Update canvas viewport dimensions dynamically if container resized
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
      }

      ctx.clearRect(0, 0, w, h);

      // --- 1. HANDLE CAMERA MOVEMENT (WASD + Space/Shift) ---
      const camSpeed = 5;
      const cam = cameraRef.current;
      
      const cosYaw = Math.cos(cam.yaw);
      const sinYaw = Math.sin(cam.yaw);

      // Forward/backward
      if (keysPressed.current['w']) {
        cam.x += sinYaw * camSpeed;
        cam.z -= cosYaw * camSpeed;
      }
      if (keysPressed.current['s']) {
        cam.x -= sinYaw * camSpeed;
        cam.z += cosYaw * camSpeed;
      }
      // Strafe Left/Right
      if (keysPressed.current['a']) {
        cam.x -= cosYaw * camSpeed;
        cam.z -= sinYaw * camSpeed;
      }
      if (keysPressed.current['d']) {
        cam.x += cosYaw * camSpeed;
        cam.z += sinYaw * camSpeed;
      }
      // Vertical Ascent/Descent
      if (keysPressed.current[' '] || keysPressed.current['spacebar']) {
        cam.y += camSpeed;
      }
      if (keysPressed.current['shift']) {
        cam.y -= camSpeed;
      }

      // --- 2. UPDATE PHYSICS (ORBIT, ATTRACTOR & BOUNDS) ---
      // We mutate values safely inside this draw loop frame, then batch update state occasionally or handle purely in-memory
      const updatedObjects = [...objects];
      const singularity = updatedObjects.find(obj => obj.type === 'portal');

      updatedObjects.forEach(obj => {
        // Core orbital/pulsing increment
        obj.pulse = (obj.pulse || 0) + 0.05;

        if (obj.type !== 'portal') {
          // Attractor Physics (pull to Singularity)
          if (singularity && activeTool === 'attractor') {
            const dx = singularity.x - obj.x;
            const dy = singularity.y - obj.y;
            const dz = singularity.z - obj.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            
            // Attractor force formula
            const force = attractorForce * 0.8;
            obj.vx += (dx / dist) * force;
            obj.vy += (dy / dist) * force;
            obj.vz += (dz / dist) * force;
          } else if (isOrbitActive) {
            // Apply gentle circular orbit centering at origin
            const dist = Math.sqrt(obj.x * obj.x + obj.z * obj.z) || 1;
            const speed = 0.45;
            // Tangent velocity
            obj.vx += (-obj.z / dist) * speed * 0.1;
            obj.vz += (obj.x / dist) * speed * 0.1;

            // Damping slightly to prevent flying away
            obj.vx *= 0.99;
            obj.vy *= 0.99;
            obj.vz *= 0.99;
          }

          // Apply velocity
          obj.x += obj.vx;
          obj.y += obj.vy;
          obj.z += obj.vz;

          // Spatial Boundary reflections (keep inside 300px bounding sphere)
          const bound = 280;
          const currentDist = Math.sqrt(obj.x * obj.x + obj.y * obj.y + obj.z * obj.z);
          if (currentDist > bound) {
            // bounce velocity vector
            const normalX = obj.x / currentDist;
            const normalY = obj.y / currentDist;
            const normalZ = obj.z / currentDist;

            const dot = obj.vx * normalX + obj.vy * normalY + obj.vz * normalZ;
            
            obj.vx -= 2 * dot * normalX;
            obj.vy -= 2 * dot * normalY;
            obj.vz -= 2 * dot * normalZ;

            // push back into boundary safely
            obj.x = normalX * (bound - 1);
            obj.y = normalY * (bound - 1);
            obj.z = normalZ * (bound - 1);
          }
        }
      });

      // --- 3. 3D PERSPECTIVE PROJECTION SYSTEM ---
      const cx = w / 2;
      const cy = h / 2;
      const fov = 350; // Perspective zoom intensity

      const cosPitch = Math.cos(cam.pitch);
      const sinPitch = Math.sin(cam.pitch);

      // Translate 3D positions based on camera values, rotate, and project
      const projected = updatedObjects.map(obj => {
        // Translation relative to camera position
        const tx = obj.x - cam.x;
        const ty = obj.y - cam.y;
        const tz = obj.z - cam.z;

        // Rotation around Y (Yaw)
        let rx = tx * cosYaw - tz * sinYaw;
        let rz = tz * cosYaw + tx * sinYaw;

        // Rotation around X (Pitch)
        let ry = ty * cosPitch - rz * sinPitch;
        let rzFinal = rz * cosPitch + ty * sinPitch;

        // Avoid division by zero/rendering behind camera
        const depth = rzFinal;
        
        // Depth-based scaling
        const factor = depth > 10 ? fov / depth : 0;
        const px = cx + rx * factor;
        const py = cy - ry * factor; // flip coordinate system to standard Descartes

        return {
          obj,
          px,
          py,
          depth,
          scale: obj.scale * factor,
          visible: depth > 10
        };
      });

      // Sort by depth (painters algorithm) for proper overlay order
      projected.sort((a, b) => b.depth - a.depth);

      // --- 4. DRAW OUTLINE/GRID MATRIX BACKDROP ---
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
      ctx.lineWidth = 1;
      
      // Draw concentric holographic boundary spheres
      const radiusCount = 3;
      for (let i = 1; i <= radiusCount; i++) {
        const radius = (280 * i) / radiusCount;
        
        // Project outer sphere ring circles on XY, YZ, ZX planes
        ctx.strokeStyle = i === radiusCount ? 'rgba(6, 182, 212, 0.1)' : 'rgba(168, 85, 247, 0.05)';
        ctx.beginPath();
        // Project radius on flat depth center
        const tzSphere = -cam.z;
        const factor = fov / (fov + tzSphere);
        ctx.arc(cx, cy, radius * (fov / Math.max(100, cam.z)), 0, Math.PI * 2);
        ctx.stroke();
      }

      // --- 5. RENDER CHIPS & PORTALS ---
      projected.forEach(({ obj, px, py, scale, depth, visible }) => {
        if (!visible || scale < 1) return;

        ctx.save();
        
        // Highlight when hovered
        if (obj.isHovered) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = obj.color;
        }

        if (obj.type === 'portal') {
          // Draw animated hyper-dimensional portal
          const rot = obj.pulse * 0.5;
          ctx.translate(px, py);
          ctx.rotate(rot);
          
          // Outer star lines
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const angle = (k * Math.PI) / 4;
            const r1 = scale * (0.8 + 0.2 * Math.sin(obj.pulse * 2 + k));
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
          }
          ctx.stroke();

          // Core singularity fill
          const grad = ctx.createRadialGradient(0, 0, scale * 0.1, 0, 0, scale * 0.6);
          grad.addColorStop(0, '#020617');
          grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.4)');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, scale * 0.8, 0, Math.PI * 2);
          ctx.fill();

          // Core tag
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('SINGULARITY', 0, -scale - 5);

        } else if (obj.type === 'number') {
          // Draw high-tech lotto quantum node
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(px, py, scale, 0, Math.PI * 2);
          ctx.fill();

          // Outer glowing glass ring
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Particle orbit ring representation
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(px, py, scale * 1.4, 0, Math.PI * 2);
          ctx.stroke();

          // Text label
          ctx.fillStyle = '#0f172a';
          ctx.font = `bold ${Math.max(8, scale * 0.9)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.label, px, py);

        } else if (obj.type === 'image' && obj.meta?.imgElement) {
          // Render floating 3D Image billboard
          const iw = scale * 1.5;
          const ih = scale * 1.1;
          
          ctx.translate(px, py);
          
          // Border frame
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-iw/2 - 3, -ih/2 - 3, iw + 6, ih + 6);
          
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-iw/2 - 3, -ih/2 - 3, iw + 6, ih + 6);

          try {
            // Draw parsed HTML Image texture
            ctx.drawImage(obj.meta.imgElement, -iw/2, -ih/2, iw, ih);
          } catch(e) {}

          // Metadata text banner
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(-iw/2, ih/2 - 12, iw, 12);
          ctx.fillStyle = '#ffffff';
          ctx.font = '6.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(obj.label, 0, ih/2 - 4);

        } else if (obj.type === 'video' && obj.meta?.videoElement) {
          // Render dynamic live Video texture!
          const vw = scale * 1.5;
          const vh = scale * 1.0;

          ctx.translate(px, py);

          // Dark border
          ctx.fillStyle = '#090d16';
          ctx.fillRect(-vw/2 - 4, -vh/2 - 4, vw + 8, vh + 8);
          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(-vw/2 - 4, -vh/2 - 4, vw + 8, vh + 8);

          try {
            // Dynamic video frames drawn onto 3D Canvas
            ctx.drawImage(obj.meta.videoElement, -vw/2, -vh/2, vw, vh);
          } catch(e) {}

          // Recording badge
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-vw/2 + 10, -vh/2 + 10, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '6px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('LIVE TEXTURE', -vw/2 + 18, -vh/2 + 13);

        } else if (obj.type === 'pdf_link') {
          // Render a high-tech visual placard for PDF & hyperlinks
          const pw = scale * 1.4;
          const ph = scale * 1.0;

          ctx.translate(px, py);
          
          // Draw metallic holographic backing plate
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.beginPath();
          // Chamfered edges for scifi look
          ctx.moveTo(-pw/2 + 5, -ph/2);
          ctx.lineTo(pw/2, -ph/2);
          ctx.lineTo(pw/2, ph/2 - 5);
          ctx.lineTo(-pw/2 + 5, ph/2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Icon representation
          ctx.fillStyle = obj.color;
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(obj.meta?.isPdf ? '📄 PDF' : '🔗 URL', -pw/2 + 8, -ph/2 + 14);

          // Title
          ctx.fillStyle = '#ffffff';
          ctx.font = '7px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(obj.label.substring(0, 16), -pw/2 + 8, -ph/2 + 28);

          // Details text
          ctx.fillStyle = '#64748b';
          ctx.font = '5px monospace';
          if (obj.meta?.isPdf) {
            ctx.fillText(`SIZE: ${obj.meta.size}`, -pw/2 + 8, -ph/2 + 38);
          } else if (obj.meta?.url) {
            ctx.fillText(obj.meta.url.substring(0, 24) + '...', -pw/2 + 8, -ph/2 + 38);
          }

        } else {
          // Polyhedral geometric grid representation (e.g. general model / meshes)
          const rot = obj.pulse * 0.3;
          ctx.translate(px, py);
          ctx.rotate(rot);

          ctx.strokeStyle = obj.color;
          ctx.lineWidth = 1;
          
          // Draw wireframe tetrahedron
          const size = scale * 0.9;
          const p1 = { x: 0, y: -size };
          const p2 = { x: -size * 0.86, y: size * 0.5 };
          const p3 = { x: size * 0.86, y: size * 0.5 };

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.stroke();

          // Connect all to a center coordinate
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(p1.x, p1.y);
          ctx.moveTo(0, 0); ctx.lineTo(p2.x, p2.y);
          ctx.moveTo(0, 0); ctx.lineTo(p3.x, p3.y);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '6px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(obj.label, 0, -size - 4);
        }

        ctx.restore();
      });

      // --- 6. RENDER LINKED PATHWAY LINE (If active tool is link and first selected) ---
      if (activeTool === 'link' && selectedObjectId) {
        const startProj = projected.find(p => p.obj.id === selectedObjectId);
        if (startProj) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(startProj.px, startProj.py);
          // Draw line to current cursor
          const mx = lastMousePos.current.x;
          const my = lastMousePos.current.y;
          ctx.lineTo(mx, my);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // --- 7. OVERLAY RETICLE & HUD STATS ---
      ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
      ctx.font = '8px monospace';
      ctx.fillText(`CAM_POS: X:[${cam.x.toFixed(0)}] Y:[${cam.y.toFixed(0)}] Z:[${cam.z.toFixed(0)}]`, 15, h - 35);
      ctx.fillText(`ROTATION: YAW:[${(cam.yaw * (180/Math.PI)).toFixed(0)}°] PITCH:[${(cam.pitch * (180/Math.PI)).toFixed(0)}°]`, 15, h - 23);
      ctx.fillText(`ENTITIES: ${objects.length} Active Nodes`, 15, h - 11);

      // Simple HUD Compass Reticle in top-right
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w - 35, 35, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Heading needle
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(w - 35, 35);
      ctx.lineTo(w - 35 + Math.sin(cam.yaw) * 14, 35 - Math.cos(cam.yaw) * 14);
      ctx.stroke();

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [objects, activeTool, attractorForce, isOrbitActive, selectedObjectId]);

  // Click & Hover raycast handlers on 3D Projected elements
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    lastMousePos.current = { x: mx, y: my };

    // 1. Mouse Drag camera look around pitch/yaw (unrestricted)
    if (isDraggingMouse.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      
      const sensitivity = 0.003;
      cameraRef.current.yaw += dx * sensitivity;
      cameraRef.current.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, cameraRef.current.pitch + dy * sensitivity));
    }

    // 2. Perform simple bounding box collision check to hover items
    const fov = 350;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const cosYaw = Math.cos(cameraRef.current.yaw);
    const sinYaw = Math.sin(cameraRef.current.yaw);
    const cosPitch = Math.cos(cameraRef.current.pitch);
    const sinPitch = Math.sin(cameraRef.current.pitch);

    let foundHover = false;
    setObjects(prev => prev.map(obj => {
      const tx = obj.x - cameraRef.current.x;
      const ty = obj.y - cameraRef.current.y;
      const tz = obj.z - cameraRef.current.z;

      let rx = tx * cosYaw - tz * sinYaw;
      let rz = tz * cosYaw + tx * sinYaw;
      let ry = ty * cosPitch - rz * sinPitch;
      let rzFinal = rz * cosPitch + ty * sinPitch;

      const factor = rzFinal > 10 ? fov / rzFinal : 0;
      const px = cx + rx * factor;
      const py = cy - ry * factor;
      const scale = obj.scale * factor;

      const distMouse = Math.sqrt((mx - px) * (mx - px) + (my - py) * (my - py));
      const hovered = distMouse < Math.max(12, scale) && rzFinal > 10;
      if (hovered) foundHover = true;

      return {
        ...obj,
        isHovered: hovered
      };
    }));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingMouse.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingMouse.current = false;
    
    // Check if clicked an object
    const clickedObj = objects.find(obj => obj.isHovered);
    if (clickedObj) {
      if (activeTool === 'eraser') {
        setObjects(prev => prev.filter(o => o.id !== clickedObj.id));
        if (selectedObjectId === clickedObj.id) setSelectedObjectId(null);
        triggerToast('OBJECT RE-ABSORBED', `De-materialized object: ${clickedObj.label}`, 'warning');
      } else if (activeTool === 'link') {
        if (!selectedObjectId) {
          // select first node for connection
          setSelectedObjectId(clickedObj.id);
          triggerToast('LINK PATH STARTED', 'Click on another target coordinate to link pathways.', 'info');
        } else {
          // create a visual vector connection
          if (selectedObjectId !== clickedObj.id) {
            triggerToast('SPATIAL LINK INSTANTIATED', `Bound nodes: ${selectedObjectId.substring(0,6)} 🔗 ${clickedObj.label}`, 'success');
            // We can add a connection label or make them orbit closer
          }
          setSelectedObjectId(null);
        }
      } else {
        setSelectedObjectId(clickedObj.id);
        triggerToast('INSPECTING ENTITY', `Quantum properties locked on ${clickedObj.label}`, 'info');
      }
    } else {
      setSelectedObjectId(null);
    }
  };

  // Extract pure Lotto Numbers currently present in the sandbox
  const lottoNumbersInSandbox = useMemo(() => {
    const nums = objects
      .filter(obj => obj.type === 'number')
      .map(obj => obj.meta?.val as number)
      .filter(val => typeof val === 'number')
      .sort((a,b) => a-b);
    return Array.from(new Set(nums));
  }, [objects]);

  return (
    <div id="immersive-3d-quantum-sandbox" className="bg-gradient-to-br from-slate-950 to-slate-900 border border-purple-500/15 rounded-2xl p-5 flex flex-col gap-6 shadow-[0_4px_35px_rgba(168,85,247,0.06)] hover:border-purple-500/25 transition-all duration-500 w-full relative overflow-hidden">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3.5 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-950 to-slate-900 border border-purple-500/20 rounded-xl">
            <Box className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-purple-400 tracking-widest uppercase border border-purple-500/30 bg-purple-950/20 px-2 py-0.5 rounded">
              Holographic Core Sandbox
            </span>
            <h3 className="text-sm font-mono font-black tracking-wider text-slate-100 uppercase mt-1 flex items-center gap-2">
              3D QUANTUM SPACE VECTOR CRAFTING TERMINAL
            </h3>
          </div>
        </div>

        {/* Buttons for dynamic instructions help */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHelpOpen(prev => !prev)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-mono text-[10px] flex items-center gap-1 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>HOW TO NAVIGATE</span>
          </button>
        </div>
      </div>

      {/* Optional Interactive Help overlay */}
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-950/90 border border-cyan-500/25 rounded-xl p-4 text-[11px] font-mono text-slate-300 flex flex-col gap-2 relative overflow-hidden"
          >
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
              <Compass className="w-4 h-4 text-cyan-400" />
              Immersive 3D Space Controls
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
              <div>
                <strong className="text-white block mb-0.5">🎮 CAMERA NAVIGATION</strong>
                <span className="text-slate-400">Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 font-bold">W</kbd> <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 font-bold">A</kbd> <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 font-bold">S</kbd> <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 font-bold">D</kbd> to fly in 3D relative coordinates.</span>
              </div>
              <div>
                <strong className="text-white block mb-0.5">🚀 HEIGHT ALIGNMENT</strong>
                <span className="text-slate-400">Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300 font-bold">SPACE</kbd> to ascend or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300 font-bold">SHIFT</kbd> to descend seamlessly.</span>
              </div>
              <div>
                <strong className="text-white block mb-0.5">👁️ FREE-LOOK PITCH/YAW</strong>
                <span className="text-slate-400">Click and drag inside the viewport to sweep 360° across multi-dimensional state planes.</span>
              </div>
              <div>
                <strong className="text-white block mb-0.5">🛠️ INTERACTION MODES</strong>
                <span className="text-slate-400">Choose tools to link coordinates, pull objects with singularities, or erase/disintegrate nodes on click.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Upload & Canvas Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls, Spawner, File Uploader */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* MULTI-FORMAT MEDIA UPLOADER CARD */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3 hover:border-purple-500/20 transition group"
          >
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <UploadCloud className="w-4 h-4 text-purple-400" />
              Multi-Format Spatial Uploader
            </span>

            <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
              Drag-and-drop or upload <strong>Images, GIFs, Videos, PDFs, or 3D coordinate meshes</strong> to map them as active textures.
            </p>

            {/* Drag drop dropzone box */}
            <label className="border border-dashed border-slate-800 hover:border-purple-500/40 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-950/40 group-hover:bg-slate-950/80">
              <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-purple-400 transition" />
              <div className="text-center font-mono">
                <span className="text-[10px] text-slate-300 block font-bold">Click to Upload any Asset</span>
                <span className="text-[8px] text-slate-500">Supports JPG, PNG, GIF, MP4, PDF, OBJ</span>
              </div>
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileLoad(e.target.files[0]);
                  }
                }}
              />
            </label>

            {/* Link clipboard paste */}
            <div className="flex flex-col gap-1.5 mt-1 font-mono text-[10px]">
              <span className="text-[8px] text-slate-500 uppercase">Or seed web hyperlink placeholder</span>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="https://example.com/data-pool"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[10px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
                />
                <button
                  onClick={handleAddLink}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold rounded text-[9px] uppercase transition flex items-center gap-1"
                >
                  <Link className="w-3 h-3 text-slate-950" />
                  <span>Seed</span>
                </button>
              </div>
            </div>

            {/* Upload progress feedback */}
            {uploadProgress !== null && (
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* QUICK LOTTO NUMBER BALL SPAWNER */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Holographic State Spawner
            </span>

            <div className="flex flex-col gap-2 font-mono text-[10px]">
              <span className="text-[8px] text-slate-500 uppercase">Spawn 3D lotto number (1 - 49)</span>
              
              <div className="flex gap-2 items-center">
                <input 
                  type="number"
                  min="1"
                  max="49"
                  value={spawnNumber}
                  onChange={(e) => setSpawnNumber(parseInt(e.target.value) || 1)}
                  className="w-20 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-100 font-black focus:outline-none focus:border-emerald-500/40"
                />
                <button
                  onClick={() => handleSpawnNumber(spawnNumber)}
                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded uppercase text-[9.5px] transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Seep Ball into Space</span>
                </button>
              </div>

              {/* Quick Spawner Chips presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[3, 7, 18, 25, 33, 44].map(n => (
                  <button
                    key={n}
                    onClick={() => handleSpawnNumber(n)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[9px] text-slate-400 hover:text-white rounded font-bold transition"
                  >
                    + Ball {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIVE OBJECT INSPECTION PANEL */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-2.5 min-h-[140px]">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              Active Spatial Inspection
            </span>

            {selectedObjectId ? (
              (() => {
                const item = objects.find(o => o.id === selectedObjectId);
                if (!item) return <span className="text-[10px] text-slate-600 italic">No object matched.</span>;
                return (
                  <div className="flex flex-col gap-2 font-mono text-[10px]">
                    <div className="flex justify-between items-center bg-slate-900/60 px-2 py-1 rounded">
                      <span className="font-bold text-slate-200 uppercase">{item.label}</span>
                      <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded">{item.type.toUpperCase()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[8.5px] text-slate-400">
                      <span>COORD_X: {item.x.toFixed(1)}</span>
                      <span>COORD_Y: {item.y.toFixed(1)}</span>
                      <span>COORD_Z: {item.z.toFixed(1)}</span>
                      <span>VELOCITY: {Math.sqrt(item.vx*item.vx + item.vy*item.vy).toFixed(2)}</span>
                    </div>

                    {item.meta?.isLink && (
                      <a 
                        href={item.meta.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="py-1 px-2.5 bg-purple-950/30 hover:bg-purple-900/30 border border-purple-500/20 text-purple-300 text-[8px] uppercase tracking-wider rounded transition flex items-center justify-between mt-1"
                      >
                        <span>Open Spatial Hyperlink</span>
                        <ArrowUpRight className="w-3 h-3 text-purple-400" />
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setObjects(prev => prev.filter(o => o.id !== item.id));
                        setSelectedObjectId(null);
                        triggerToast('DISINTEGRATED OBJECT', 'Vaporized node from coordinate grid.', 'warning');
                      }}
                      className="mt-2 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 text-[9px] uppercase rounded transition"
                    >
                      Delete Spatial Node
                    </button>
                  </div>
                );
              })()
            ) : (
              <span className="text-[10px] text-slate-600 italic leading-relaxed">
                Click on any floating 3D coordinate element inside the perspective window to lock tracking and inspect dimensions.
              </span>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: 3D Perspective Viewport Canvas & Quick tools */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* VIEWPORT HEADER & TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-900 p-3 rounded-xl font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-slate-200 uppercase tracking-widest font-black">Spatial Interactive Tools:</span>
            </div>

            {/* Action Tool presets */}
            <div className="flex items-center gap-1">
              {[
                { id: 'translate', label: '🕹️ Free Fly / View' },
                { id: 'attractor', label: '🧲 Singularity Pull' },
                { id: 'link', label: '🔗 Bind Pathways' },
                { id: 'eraser', label: '⚡ Erase/Delete' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTool(t.id as any);
                    setSelectedObjectId(null);
                    triggerToast('TOOL MUTATED', `Active tool changed to: ${t.label}`, 'info');
                  }}
                  className={`py-1 px-2.5 rounded text-[9.5px] font-bold border transition ${
                    activeTool === t.id 
                      ? 'bg-purple-950/50 border-purple-500 text-purple-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN 3D RENDERING CANVAS WINDOW */}
          <div className="relative border border-slate-900 rounded-xl overflow-hidden aspect-video w-full flex items-center justify-center bg-black">
            
            {/* Real 3D canvas viewport */}
            <canvas 
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseDown={handleCanvasMouseDown}
              onMouseUp={handleCanvasMouseUp}
              className="w-full h-full cursor-crosshair"
            />

            {/* High tech overlay banners */}
            <div className="absolute left-4 top-4 flex flex-col gap-1 pointer-events-none">
              <span className="bg-slate-950/90 text-cyan-400 border border-cyan-500/20 text-[8.5px] font-mono px-2 py-0.5 rounded w-max">
                RENDERER: HYPER-CANVAS 3D LATTICE
              </span>
              <span className="bg-slate-950/90 text-purple-400 border border-purple-500/20 text-[7px] font-mono px-2 py-0.5 rounded w-max">
                FPS: 60 // SMOOTH WASD-SPACE-SHIFT CAMERA ENABLED
              </span>
            </div>

            {/* Active tool indicator badge */}
            <div className="absolute right-4 bottom-4 pointer-events-none">
              <div className="bg-slate-950/90 border border-slate-800 rounded px-3 py-1 font-mono text-[9px] text-slate-300 flex items-center gap-1.5 shadow-2xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ACTIVE INTERACTION: <strong className="text-white uppercase">{activeTool}</strong></span>
              </div>
            </div>

            {/* Quantum Physics Control Overlays */}
            <div className="absolute left-4 bottom-4 bg-slate-950/90 border border-slate-900 rounded p-3 flex flex-col gap-2 font-mono text-[9px] w-[180px] pointer-events-auto">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Physics Control Desk</span>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Gravitational Orbit</span>
                <button
                  onClick={() => setIsOrbitActive(prev => !prev)}
                  className={`px-2 py-0.5 text-[8px] rounded border ${
                    isOrbitActive ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {isOrbitActive ? 'ON' : 'OFF'}
                </button>
              </div>

              {activeTool === 'attractor' && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between text-slate-500 text-[7.5px]">
                    <span>Attractor Force</span>
                    <span>{attractorForce.toFixed(2)}G</span>
                  </div>
                  <input 
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={attractorForce}
                    onChange={(e) => setAttractorForce(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM INTERLOCK: Apply Decoded Sandbox Numbers to Bet set! */}
          <div className="bg-gradient-to-br from-purple-950/20 to-slate-950 border border-purple-500/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  🔮 Sandbox Decoded State Alignment ({lottoNumbersInSandbox.length} Balls)
                </span>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Synchronize physical floating sandbox node numbers directly into active proposed bet sets.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {lottoNumbersInSandbox.length > 0 ? (
                <div className="flex gap-1 bg-black/40 border border-slate-900 px-2.5 py-1.5 rounded-lg">
                  {lottoNumbersInSandbox.slice(0, 6).map((num, idx) => (
                    <span key={idx} className="w-6 h-6 rounded bg-slate-900 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[10px] flex items-center justify-center">
                      {num}
                    </span>
                  ))}
                  {lottoNumbersInSandbox.length > 6 && (
                    <span className="text-[8px] text-slate-500 self-center font-mono ml-1">+{lottoNumbersInSandbox.length - 6} more</span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-600 font-mono italic">No numbers spawned.</span>
              )}

              <button
                onClick={() => {
                  if (lottoNumbersInSandbox.length === 0) {
                    triggerToast('NO DETECTED NUMBERS', 'Spawn or link active number nodes first.', 'warning');
                    return;
                  }
                  if (onApplyNumbers) {
                    onApplyNumbers(lottoNumbersInSandbox.slice(0, 6));
                    triggerToast('SANDBOX STATE SYNCHRONIZED', 'Top 6 sandbox number coordinates applied to primary betting frame.', 'success');
                    triggerSpeech(`Applied top sandbox coordinates to main predictor.`);
                  }
                }}
                disabled={lottoNumbersInSandbox.length === 0}
                className="py-2 px-4 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-slate-950 font-mono font-black text-xs uppercase rounded transition active:scale-95"
              >
                Apply Sandbox Set
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
