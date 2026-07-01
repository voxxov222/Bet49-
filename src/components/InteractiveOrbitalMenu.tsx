import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Compass, ShieldCheck, Activity, Cpu, Sliders, Layers, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Strategy {
  id: string;
  name: string;
  desc: string;
}

interface StrategyHitRate {
  count: number;
  avgMatches: number;
  hitRate: number;
}

interface InteractiveOrbitalMenuProps {
  strategies: Strategy[];
  selectedStrategy: string;
  onSelectStrategy: (id: string) => void;
  strategyHitRates: Record<string, StrategyHitRate>;
  strategyWinningStreaks: Record<string, number>;
  strategyStreakHistories?: Record<string, number[]>;
  getStrategyCategory: (stratId: string) => {
    name: string;
    color: string;
    textClass: string;
    borderClass: string;
    glowClass: string;
  };
}

export default function InteractiveOrbitalMenu({
  strategies,
  selectedStrategy,
  onSelectStrategy,
  strategyHitRates,
  strategyWinningStreaks,
  strategyStreakHistories,
  getStrategyCategory
}: InteractiveOrbitalMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Statistical');
  const [hoveredStratId, setHoveredStratId] = useState<string | null>(null);
  
  // Track continuous angle for circular orbital rotation simulation
  const [rotationAngle, setRotationAngle] = useState(0);

  // Categories constant definitions
  const categories = [
    { name: 'Statistical', label: 'STATISTICAL DENSITY CORE', color: 'cyan', icon: Cpu, accent: 'from-cyan-400 to-blue-500' },
    { name: 'Chaos', label: 'CHAOS VECTOR CASCADE', color: 'purple', icon: Sliders, accent: 'from-purple-400 to-indigo-500' },
    { name: 'Hyper-Dimensional', label: 'HYPER-DIMENSION PROJECTS', color: 'magenta', icon: Layers, accent: 'from-pink-400 to-rose-500' },
    { name: 'Mystical', label: 'MYSTICAL BALANCING LOOPS', color: 'gold', icon: Sparkles, accent: 'from-amber-400 to-yellow-500' }
  ];

  // Rotate orbital elements slowly
  useEffect(() => {
    const handleAngle = setInterval(() => {
      setRotationAngle(prev => (prev + 0.006) % (Math.PI * 2));
    }, 30);
    return () => clearInterval(handleAngle);
  }, []);

  // Filter strategies matching category
  const activeChannelStrategies = useMemo(() => {
    return strategies.filter(s => getStrategyCategory(s.id).name === activeCategory);
  }, [strategies, activeCategory, getStrategyCategory]);

  // Synchronize category with active parent strategy selection changes
  useEffect(() => {
    const currentCategory = getStrategyCategory(selectedStrategy).name;
    if (currentCategory !== activeCategory) {
      setActiveCategory(currentCategory);
    }
  }, [selectedStrategy]);

  return (
    <div className="bg-black/32 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.04)] hover:border-cyan-500/25 transition-all duration-500 relative overflow-hidden">
      
      {/* Laser light sweep animation */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#06b6d4] opacity-35 animate-[scanline_6s_infinite] pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">Interactive Neural Synapse Matrix</h2>
            <p className="text-[10px] text-slate-500 font-mono font-bold">20 QUANTUM DECRYPTOR STRATEGIC ALGORITHMS</p>
          </div>
        </div>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono font-bold">CIRCULAR ORBITAL LAYER v2</span>
      </div>

      {/* Volumetric Channel Switcher HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {categories.map(cat => {
          const isActive = activeCategory === cat.name;
          const Icon = cat.icon;
          
          let btnColorClass = "border-slate-900 bg-slate-950/45 text-slate-400 hover:border-slate-800 hover:text-slate-200";
          if (isActive) {
            if (cat.color === 'cyan') btnColorClass = "border-cyan-500/40 bg-cyan-950/25 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]";
            else if (cat.color === 'purple') btnColorClass = "border-purple-500/40 bg-purple-950/25 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]";
            else if (cat.color === 'magenta') btnColorClass = "border-pink-500/40 bg-pink-950/25 text-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
            else btnColorClass = "border-amber-500/40 bg-amber-950/25 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
          }

          return (
            <button
              key={cat.name}
              onClick={() => {
                setActiveCategory(cat.name);
                // Also default to first strategy in this category
                const firstStrat = strategies.find(s => getStrategyCategory(s.id).name === cat.name);
                if (firstStrat) onSelectStrategy(firstStrat.id);
              }}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-300 font-mono relative group cursor-pointer ${btnColorClass}`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition duration-300'}`} />
                {isActive && (
                  <div className={`absolute inset-0 rounded-full blur-sm opacity-50 bg-current`} />
                )}
              </div>
              <span className="text-[9.5px] font-extrabold tracking-widest uppercase truncate max-w-full">
                {cat.name}
              </span>
              <p className="text-[7.5px] text-slate-500 line-clamp-1 leading-none uppercase">
                {cat.label.split(' ')[0]} channel
              </p>
              
              {isActive && (
                <div className={`absolute bottom-0 inset-x-4 h-[2px] bg-gradient-to-r ${cat.accent}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Cybernetic Floating Strategy Moons Array */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3 items-stretch relative min-h-[190px]">
        
        {/* Connection node layout details */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

        <AnimatePresence mode="popLayout">
          {activeChannelStrategies.map((strat, index) => {
            const isSelected = selectedStrategy === strat.id;
            const stats = strategyHitRate(strat.id);
            const catInfo = getStrategyCategory(strat.id);
            const isHovered = hoveredStratId === strat.id;

            // Generate slow-moving floating offset offsets based on index and angle
            const floatX = Math.sin(rotationAngle + (index * 1.5)) * 4;
            const floatY = Math.cos(rotationAngle + (index * 1.5)) * 4;

            let borderTheme = isSelected ? catInfo.borderClass : 'border-slate-900/80 hover:border-slate-800';
            let bgTheme = isSelected 
              ? `${catInfo.glowClass} border-opacity-70 bg-black/60` 
              : 'bg-slate-950/40 hover:bg-slate-900/60 text-slate-300';

            return (
              <motion.button
                key={strat.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  y: isSelected ? floatY : 0, 
                  boxShadow: isSelected ? '0 0 15px rgba(6,182,212,0.05)' : '' 
                }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                onClick={() => onSelectStrategy(strat.id)}
                onMouseEnter={() => setHoveredStratId(strat.id)}
                onMouseLeave={() => setHoveredStratId(null)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all duration-300 relative group cursor-pointer select-none overflow-hidden ${borderTheme} ${bgTheme}`}
              >
                {/* Horizontal scan line sweep for actively selected strategy card */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_90%,rgba(6,182,212,0.1)_100%)] bg-[size:100%_20px] pointer-events-none animate-[scanline_2.5s_linear_infinite]" />
                )}

                <div className="flex justify-between items-start w-full gap-2">
                  <div className="flex items-center gap-2 shrink truncate">
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'animate-ping' : ''} ${
                      catInfo.color === 'cyan' ? 'bg-cyan-400' :
                      catInfo.color === 'purple' ? 'bg-purple-400' :
                      catInfo.color === 'magenta' ? 'bg-pink-400' : 'bg-amber-400'
                    }`} />
                    <span className="text-[10.5px] font-mono leading-tight font-extrabold tracking-wide uppercase truncate">
                      {strat.name.replace(/^[0-9.]+\s*/, '')}
                    </span>
                  </div>
                  
                  {stats && stats.hitRate > 0 && (
                    <span className={`text-[8px] font-mono font-black border px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      stats.hitRate >= 45 
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' 
                        : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
                    }`}>
                      {stats.hitRate}% HIT
                    </span>
                  )}
                  {strategyWinningStreaks[strat.id] !== undefined && strategyWinningStreaks[strat.id] > 0 && (
                    <span className="text-[8px] font-mono font-black border px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 bg-amber-950/60 border-amber-500/30 text-amber-300">
                      {strategyWinningStreaks[strat.id]} STREAK
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed font-sans line-clamp-2 select-none">
                  {strat.desc}
                </p>

                {/* Consecutive Wins / Match History Bar Chart */}
                <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-900/40 pt-1.5 select-none">
                  <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest block font-bold leading-none">
                    STREAK HISTORY (LAST 5 RECORDS):
                  </span>
                  <div className="flex items-end gap-2 h-7 mt-0.5">
                    {(strategyStreakHistories?.[strat.id] || [0, 0, 0, 0, 0]).map((matches, i) => {
                      const percent = (matches / 6) * 100;
                      const isWin = matches >= 3;
                      const barColor = isWin 
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.35)]' 
                        : 'bg-slate-800/80 hover:bg-slate-750';
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group/bar relative">
                          <div 
                            className={`w-full rounded-sm min-h-[3px] transition-all duration-500 ${barColor}`}
                            style={{ height: `${Math.max(3, percent * 0.22)}px` }}
                          />
                          <span className="text-[6.5px] font-mono text-slate-500 leading-none group-hover/bar:text-cyan-400 transition-colors">
                            {matches}
                          </span>
                          
                          <div className="absolute bottom-6 scale-0 group-hover/bar:scale-100 transition-transform origin-bottom bg-slate-950 border border-slate-850 text-[6.5px] font-mono text-cyan-450 px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap z-20 pointer-events-none">
                            {isWin ? 'WIN' : 'LOSS'}: {matches} Matches
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Micro metrics tracking dashboard info */}
                <div className="flex justify-between items-center text-[8px] font-mono border-t border-slate-900/60 pt-2 select-none">
                  <span className="text-slate-500 uppercase tracking-widest leading-none">
                    ENGINE VECTOR KEY: <span className="text-slate-400 font-extrabold">{strat.id.toUpperCase()}</span>
                  </span>
                  <span className="text-slate-500 uppercase leading-none">
                    Status: <span className="text-emerald-400 font-bold">READY</span>
                  </span>
                </div>

                {/* Orbit beam lock visual decorator */}
                {isSelected && (
                  <div className={`absolute top-0 right-0 w-[4px] h-full ${
                    catInfo.color === 'cyan' ? 'bg-cyan-400' :
                    catInfo.color === 'purple' ? 'bg-purple-400' :
                    catInfo.color === 'magenta' ? 'bg-pink-400' : 'bg-amber-400'
                  }`} />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );

  // Quick safety mapper helper
  function strategyHitRate(id: string) {
    return strategyHitRates[id] || { count: 10, avgMatches: 2.3, hitRate: 35 };
  }
}
