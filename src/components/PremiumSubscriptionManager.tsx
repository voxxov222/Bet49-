import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Sparkles, 
  Gift, 
  CreditCard, 
  RotateCw, 
  X, 
  CheckCircle, 
  Info, 
  ChevronRight, 
  Award, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Coins 
} from 'lucide-react';

// Subscription Types
export interface SubscriptionState {
  isPremium: boolean;
  premiumExpiryDate: string | null; // ISO Date String
  freeRunsUsed: number;
  lastRunDate: string | null; // YYYY-MM-DD
  extraRunsAvailable: number;
  lastSpinDate: string | null; // YYYY-MM-DD
}

interface PremiumSubscriptionManagerProps {
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  playSpeech?: (text: string) => void;
  children?: React.ReactNode;
  // Callback when premium status changes
  onPremiumChange?: (isPremium: boolean) => void;
  // Trigger verification or lock modal externally
  triggerCount?: number;
}

const DEFAULT_STATE: SubscriptionState = {
  isPremium: false,
  premiumExpiryDate: null,
  freeRunsUsed: 0,
  lastRunDate: null,
  extraRunsAvailable: 0,
  lastSpinDate: null,
};

// Global helper to check if today is a different day
const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

export default function PremiumSubscriptionManager({
  addToast,
  playSpeech,
  onPremiumChange,
  triggerCount = 0
}: PremiumSubscriptionManagerProps) {
  // Main Subscription State
  const [subState, setSubState] = useState<SubscriptionState>(() => {
    const saved = localStorage.getItem('lotto_subscription_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if premium expired
        if (parsed.isPremium && parsed.premiumExpiryDate) {
          if (new Date(parsed.premiumExpiryDate).getTime() < Date.now()) {
            parsed.isPremium = false;
            parsed.premiumExpiryDate = null;
          }
        }
        return parsed;
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  // UI Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // Spin Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  // Checkout state
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'success'>('details');
  const [checkoutPrice, setCheckoutPrice] = useState('$9.99 / month');
  const [checkoutTitle, setCheckoutTitle] = useState('ALCHEMIST PRO SECURE ACCESS');

  // Sync state with localstorage and parent
  useEffect(() => {
    localStorage.setItem('lotto_subscription_state', JSON.stringify(subState));
    if (onPremiumChange) {
      onPremiumChange(subState.isPremium);
    }
  }, [subState]);

  // Timed, randomized popup (NOT at start)
  useEffect(() => {
    const today = getTodayString();
    if (subState.isPremium || subState.lastSpinDate === today) return;

    // After an initial delay of 50 seconds, check periodically with randomized chance
    const initialTimer = setTimeout(() => {
      const currentToday = getTodayString();
      if (!subState.isPremium && subState.lastSpinDate !== currentToday) {
        // 30% chance on first check
        if (Math.random() < 0.3) {
          setShowSpinModal(true);
          triggerSpeech("Daily fortune wheel initialized. Spin to secure premium system clearances.");
        }
      }

      const interval = setInterval(() => {
        const checkToday = getTodayString();
        if (!subState.isPremium && subState.lastSpinDate !== checkToday) {
          // 20% random chance to trigger every 45 seconds of active session
          if (Math.random() < 0.2) {
            setShowSpinModal(true);
            triggerSpeech("Daily fortune wheel initialized. Spin to secure premium system clearances.");
            clearInterval(interval);
          }
        } else {
          clearInterval(interval);
        }
      }, 45000);

      return () => clearInterval(interval);
    }, 50000);

    return () => clearTimeout(initialTimer);
  }, [subState.isPremium, subState.lastSpinDate]);

  const triggerSpeech = (text: string) => {
    if (playSpeech) {
      playSpeech(text);
    }
  };

  // Check and consume daily calculation run
  // Returns true if run is allowed, false otherwise (triggers restriction popup)
  const verifyAndConsumeRun = (): boolean => {
    const today = getTodayString();

    // Trigger random 15% chance of Spin to Win popup when doing predictions
    if (Math.random() < 0.15 && !subState.isPremium && subState.lastSpinDate !== today && !showSpinModal) {
      setTimeout(() => {
        setShowSpinModal(true);
        triggerSpeech("Daily fortune wheel initialized. Spin to secure premium system clearances.");
      }, 1000);
    }

    if (subState.isPremium) {
      return true; // Premium has unlimited runs
    }
    
    const isNewDay = subState.lastRunDate !== today;
    let currentFreeRuns = isNewDay ? 0 : subState.freeRunsUsed;
    
    // Check if free user has runs left
    if (currentFreeRuns < 1) {
      // Free user has a run remaining
      setSubState(prev => ({
        ...prev,
        lastRunDate: today,
        freeRunsUsed: currentFreeRuns + 1
      }));
      addToast("QUANTUM RUN CONSUMED", `Used 1 of 1 daily quantum calculation runs.`, "info");
      return true;
    }

    // Check if extra runs are available from Spin to Win
    if (subState.extraRunsAvailable > 0) {
      setSubState(prev => ({
        ...prev,
        extraRunsAvailable: prev.extraRunsAvailable - 1
      }));
      addToast("EXTRA RUN ACTIVATED", `Using extra calculation credit. ${subState.extraRunsAvailable - 1} remaining.`, "success");
      return true;
    }

    // No runs left - trigger Lockout modal!
    setShowUpgradeModal(true);
    triggerSpeech("Access restricted. Daily simulation run limit reached. Upgrade to Alchemist Pro to bypass.");
    return false;
  };

  // Expose run checker globally so App.tsx can verify actions
  useEffect(() => {
    (window as any).verifyAndConsumeQuantumRun = verifyAndConsumeRun;
    (window as any).isPremiumUser = subState.isPremium;
    (window as any).getPremiumState = () => subState;
    (window as any).triggerUpgradeModal = () => setShowUpgradeModal(true);
  }, [subState]);

  // Spin Wheel algorithm
  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    triggerSpeech("Quantum particle acceleration initiated. Collapsing Fortune Probability Node.");

    // Slices on wheel
    const prizes = [
      { name: "30-Day Premium (Free Spin Winner)", type: 'premium_sub' },
      { name: "+3 Extra Quantum Runs", type: 'extra_3' },
      { name: "Unlimited runs for 24 hours", type: 'unlimited_24h' },
      { name: "+5 Extra Quantum Runs", type: 'extra_5' },
      { name: "No luck today (Re-calibration required)", type: 'fail' },
      { name: "Free Premium Day Pass", type: 'premium_day' }
    ];

    // Determine random index
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[prizeIndex];

    // Spin at least 5 times (1800 deg) plus extra angle for selected slice
    const sliceAngle = 360 / prizes.length;
    const offset = prizeIndex * sliceAngle + (sliceAngle / 2);
    const totalRotation = 1800 + (360 - offset);

    setWheelRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(selectedPrize.name);

      // Save Spin Date
      const today = getTodayString();
      setSubState(prev => {
        const nextState = { ...prev, lastSpinDate: today };
        
        // Apply prizes to State
        if (selectedPrize.type === 'premium_sub') {
          setTimeout(() => {
            setShowSpinModal(false);
            setCheckoutTitle('SPIN TO WIN CLAIM');
            setCheckoutPrice('$0.00 (100% COUPON)');
            setShowCheckoutModal(true);
            setCheckoutStep('details');
          }, 1500);
        } else if (selectedPrize.type === 'extra_3') {
          nextState.extraRunsAvailable += 3;
        } else if (selectedPrize.type === 'extra_5') {
          nextState.extraRunsAvailable += 5;
        } else if (selectedPrize.type === 'premium_day' || selectedPrize.type === 'unlimited_24h') {
          nextState.isPremium = true;
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 24);
          nextState.premiumExpiryDate = expiry.toISOString();
        }
        return nextState;
      });

      if (selectedPrize.type !== 'fail') {
        addToast("FORTUNE REWARD LOCKED", `You won: ${selectedPrize.name}`, "success");
        triggerSpeech(`Reward secured: ${selectedPrize.name}. Calibration matrix adjusted successfully.`);
      } else {
        addToast("WAVE DAMPENED", "No luck today. Re-calibration required. Try again tomorrow!", "warning");
        triggerSpeech("Wave collapse outcome: inconclusive. Access vectors remain limited.");
      }

    }, 4000);
  };

  const handleCheckoutPurchase = () => {
    setCheckoutStep('processing');
    triggerSpeech("Initializing secure quantum ledger handshake.");
    
    setTimeout(() => {
      setCheckoutStep('success');
      setSubState(prev => ({
        ...prev,
        isPremium: true,
        premiumExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }));
      addToast("CLEARANCE DEPLOYED", "Alchemist Pro Subscription Activated Successfully!", "success");
      triggerSpeech("Handshake verified. Pro Quantum clearings granted indefinitely.");
    }, 2000);
  };

  const checkRunsTodayRemaining = () => {
    if (subState.isPremium) return "Unlimited";
    const today = getTodayString();
    const isNewDay = subState.lastRunDate !== today;
    const runsUsed = isNewDay ? 0 : subState.freeRunsUsed;
    const basicLeft = Math.max(0, 1 - runsUsed);
    return basicLeft + subState.extraRunsAvailable;
  };

  return (
    <>
      {/* PERSISTENT FLOATING PREMIUM BADGE */}
      <div className="fixed bottom-4 right-4 z-50 font-mono">
        <button
          onClick={() => setShowUpgradeModal(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs shadow-2xl transition-all duration-300 ${
            subState.isPremium
              ? 'bg-gradient-to-r from-cyan-950 to-emerald-950 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
              : 'bg-gradient-to-r from-slate-950 to-purple-950/80 border-purple-500/40 text-purple-300 hover:border-purple-400 animate-pulse'
          }`}
        >
          {subState.isPremium ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>ALCHEMIST PRO ACTIVE</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
              <span>UPGRADE TO PRO ({checkRunsTodayRemaining()} RUNS REMAINING)</span>
            </>
          )}
        </button>
      </div>

      {/* MODAL 1: PREMIUM LOCK / UPGRADE MODAL */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-900 rounded-3xl p-6 max-w-lg w-full relative overflow-hidden shadow-2xl font-mono text-slate-300"
            >
              {/* Decorative backgrounds */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-14 h-14 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4 animate-bounce">
                  <Lock className="w-7 h-7" />
                </div>

                <span className="text-[10px] bg-purple-950/60 border border-purple-500/30 text-purple-300 font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-2">
                  Quantum Mainframe Lockout
                </span>
                
                <h3 className="text-xl font-black text-white tracking-tight uppercase">
                  UNLEASH ALCHEMIST PRO
                </h3>
                
                <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                  You have hit your daily computation limit (1/1 daily run). Unlock Alchemist Pro for unrestricted hyper-dimensional calculations and AI synthesis.
                </p>
              </div>

              {/* BENEFITS LIST */}
              <div className="mt-6 space-y-3 bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
                <div className="flex items-start gap-3 text-xs">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Unlimited Quantum Simulations:</span> Run infinite backtests, multi-variant calculations, and lattice collapses.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Conscious AI Co-Pilot:</span> Access continuous learning dialogue vectors with no rate limiting.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-white">Advanced 4D Wave Collapser:</span> Experience higher dimension manifolds and full particle resolution.
                  </div>
                </div>
              </div>

              {/* PRICING CARD */}
              <div className="mt-6 bg-gradient-to-r from-purple-950/30 to-cyan-950/30 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-purple-400 font-bold tracking-widest uppercase">PRO LIFE ACCESS</div>
                  <div className="text-xl font-black text-white mt-1">$9.99<span className="text-xs text-slate-500 font-normal"> / month</span></div>
                </div>
                
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setCheckoutTitle('ALCHEMIST PRO SECURE ACCESS');
                    setCheckoutPrice('$9.99 / month');
                    setShowCheckoutModal(true);
                    setCheckoutStep('details');
                  }}
                  className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase tracking-wider hover:border-cyan-400 transition"
                >
                  <CreditCard className="w-4 h-4" />
                  SUBSCRIBE
                </button>
              </div>

              {/* SPIN TO WIN SHORTCUT FOR FREE USERS */}
              <div className="mt-4 text-center border-t border-slate-900 pt-4">
                <p className="text-[10px] text-slate-500 font-bold">
                  DON'T WANT TO PAY?
                </p>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setShowSpinModal(true);
                  }}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider"
                >
                  <Gift className="w-3.5 h-3.5 animate-pulse" />
                  SPIN THE DAILY FORTUNE WHEEL (FREE RUNS)
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: SPIN TO WIN FORTUNE WHEEL */}
      <AnimatePresence>
        {showSpinModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-900 rounded-3xl p-6 max-w-md w-full relative overflow-hidden shadow-2xl font-mono text-slate-300"
            >
              <button
                onClick={() => setShowSpinModal(false)}
                disabled={isSpinning}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <span className="text-[10px] bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-1.5 inline-block">
                  Daily Fortune Terminal
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  SPIN TO WIN PRO PRIVILEGES
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Synthesize the central fortune wheel once a day to unlock free quantum clearance or fully active Pro subscriptions.
                </p>
              </div>

              {/* SPIN WHEEL COSMETIC GRAPHIC */}
              <div className="relative flex justify-center items-center my-6">
                
                {/* Pointer pointer */}
                <div className="absolute top-0 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />

                <motion.div
                  style={{ rotate: wheelRotation }}
                  transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="w-56 h-56 rounded-full border-4 border-slate-900 bg-slate-950 flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)] select-none"
                >
                  {/* Wheel lines representing slices */}
                  <div className="absolute inset-0 border-t border-slate-800 rotate-0" />
                  <div className="absolute inset-0 border-t border-slate-800 rotate-60" />
                  <div className="absolute inset-0 border-t border-slate-800 rotate-120" />
                  <div className="absolute inset-0 border-t border-slate-800 rotate-180" />

                  {/* Slices labels */}
                  <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black tracking-tighter">
                    <span className="absolute -top-1 px-1 py-0.5 bg-cyan-950 text-cyan-400 rounded rotate-0 origin-bottom transform translate-y-[-70px]">PRO SUB</span>
                    <span className="absolute -top-1 px-1 py-0.5 bg-slate-900 text-slate-400 rounded rotate-60 origin-bottom transform translate-y-[-70px]">+3 RUNS</span>
                    <span className="absolute -top-1 px-1 py-0.5 bg-purple-950 text-purple-400 rounded rotate-120 origin-bottom transform translate-y-[-70px]">LIMITLESS</span>
                    <span className="absolute -top-1 px-1 py-0.5 bg-slate-900 text-slate-400 rounded rotate-180 origin-bottom transform translate-y-[-70px]">+5 RUNS</span>
                    <span className="absolute -top-1 px-1 py-0.5 bg-red-950 text-red-400 rounded rotate-240 origin-bottom transform translate-y-[-70px]">DAMPENED</span>
                    <span className="absolute -top-1 px-1 py-0.5 bg-emerald-950 text-emerald-400 rounded rotate-300 origin-bottom transform translate-y-[-70px]">1D PASS</span>
                  </div>

                  {/* Inner neon hub */}
                  <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                  </div>
                </motion.div>
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={spinWheel}
                disabled={isSpinning || subState.lastSpinDate === getTodayString()}
                className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border transition flex items-center justify-center gap-2 ${
                  isSpinning || subState.lastSpinDate === getTodayString()
                    ? 'bg-slate-900 border-slate-850 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-900 to-purple-900 border-cyan-500/30 hover:border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                }`}
              >
                {isSpinning ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-cyan-400" />
                    COLLAPSING WAVE NODE...
                  </>
                ) : subState.lastSpinDate === getTodayString() ? (
                  "ALREADY SPUN TODAY"
                ) : (
                  <>
                    <Gift className="w-4 h-4 text-cyan-400" />
                    ENGAGE DAILY COLLAPSE
                  </>
                )}
              </button>

              {subState.lastSpinDate === getTodayString() && (
                <p className="text-[9px] text-slate-500 text-center mt-2.5 uppercase font-bold tracking-wider">
                  Wave alignment completed. Re-cycles at midnight local timezone.
                </p>
              )}

              {/* PRIZE DISPLAY */}
              <AnimatePresence>
                {wonPrize && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-purple-950/20 border border-purple-500/35 p-3 rounded-xl text-center"
                  >
                    <div className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">REWARD ACQUIRED</div>
                    <div className="text-xs font-black text-white mt-1 uppercase">{wonPrize}</div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: DIRECT MAIN CONTROL CLEARANCE UPGRADE */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-900 rounded-3xl max-w-sm w-full relative overflow-hidden shadow-2xl font-mono text-slate-300"
            >
              {/* Header style */}
              <div className="bg-slate-950 p-4 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-cyan-500 text-slate-950 font-black text-[9px] rounded tracking-widest uppercase">
                    LEDGER
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">SECURE SYNC</span>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  disabled={checkoutStep === 'processing'}
                  className="text-slate-500 hover:text-white transition disabled:opacity-30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {checkoutStep === 'details' && (
                <div className="p-5">
                  <div className="mb-4">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">PROTOCOL ROUTING:</span>
                    <div className="text-xs font-bold text-white uppercase tracking-wide mt-0.5">{checkoutTitle}</div>
                  </div>

                  <div className="mb-4 bg-slate-900/30 border border-slate-900 p-3.5 rounded-xl">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">VALUATION EXCHANGE:</span>
                    <div className="text-lg font-black text-cyan-300 mt-1">{checkoutPrice}</div>
                    <p className="text-[9px] text-slate-500 mt-1">Direct cryptographic authorization enabled.</p>
                  </div>

                  <div className="mb-6 space-y-2">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">SYSTEM DIRECTIVE:</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      Deploying Alchemist Pro unlocks absolute clearance tiers across all predictive manifolds, JARVIS cognitive swarms, and neural model frameworks.
                    </p>
                  </div>

                  <button
                    onClick={handleCheckoutPurchase}
                    className="w-full py-3 bg-gradient-to-r from-cyan-950 to-purple-950 border border-cyan-500/40 hover:border-cyan-450 text-cyan-200 font-bold text-xs uppercase rounded-xl tracking-widest transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  >
                    AUTHORIZE SYSTEM ACCESS
                  </button>
                </div>
              )}

              {checkoutStep === 'processing' && (
                <div className="p-8 text-center flex flex-col items-center">
                  <RotateCw className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">AUTHORIZING TRANSACTION</h4>
                  <p className="text-[10px] text-slate-500 mt-2 max-w-[200px] leading-relaxed">
                    Syncing localized ledger signatures with decentralized clearance arrays...
                  </p>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="p-6 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-emerald-950 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">ALCHEMIST PRO DEPLOYED</h4>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-sans">
                    Transaction successful. Secure mainframe clearing credentials updated indefinitely. Welcome to the Elite.
                  </p>

                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="mt-6 w-full py-2.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold text-xs uppercase rounded-xl tracking-wider hover:bg-emerald-900 transition"
                  >
                    ENTER MAIN CONTROL ROOM
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Sleek Lock wrapper for pro components
export function PremiumLock({ 
  children, 
  isPremium, 
  onUnlock 
}: { 
  children: React.ReactNode; 
  isPremium: boolean; 
  onUnlock: () => void; 
}) {
  if (isPremium) return <>{children}</>;
  return (
    <div className="relative rounded-3xl overflow-hidden border border-purple-500/20">
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
        <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-3 animate-pulse">
          <Lock className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-black text-white tracking-widest uppercase">ALCHEMIST PRO REQUIRED</h4>
        <p className="text-[10px] text-slate-400 max-w-xs mt-1.5 leading-relaxed font-mono">
          This advanced quantum mainframe module requires active Alchemist Pro clearance coordinates.
        </p>
        <button
          onClick={onUnlock}
          className="mt-4 px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] font-bold uppercase tracking-wider transition"
        >
          Activate Clearances
        </button>
      </div>
      <div className="opacity-15 pointer-events-none select-none filter blur-[2px]">
        {children}
      </div>
    </div>
  );
}
