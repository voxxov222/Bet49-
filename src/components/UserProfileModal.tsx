import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogIn, 
  LogOut, 
  User, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  Camera, 
  Check, 
  Save, 
  RefreshCw,
  Globe,
  Lock
} from 'lucide-react';
import { auth, db, doc, setDoc, getDoc, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from '../lib/firebase';

// Neon Avatar Presets
const AVATAR_PRESETS = [
  { id: 'neon_vortex', emoji: '🌀', color: 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)] bg-cyan-950/40 text-cyan-400' },
  { id: 'neon_star', emoji: '⭐', color: 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)] bg-amber-950/40 text-amber-400' },
  { id: 'neon_atom', emoji: '⚛️', color: 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)] bg-purple-950/40 text-purple-400' },
  { id: 'neon_phoenix', emoji: '🔥', color: 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] bg-rose-950/40 text-rose-400' },
  { id: 'neon_matrix', emoji: '🧬', color: 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] bg-emerald-950/40 text-emerald-400' },
  { id: 'neon_quasar', emoji: '🌌', color: 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)] bg-pink-950/40 text-pink-400' }
];

interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl: string; // id of preset or custom image url
  bio: string;
  role: 'user' | 'moderator' | 'admin';
  quantumRank: string;
  createdAt: string;
  isGuest: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  playSpeech?: (text: string) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  addToast,
  playSpeech
}: UserProfileModalProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('neon_vortex');

  // Trigger speech helper
  const triggerSpeech = (text: string) => {
    if (playSpeech) {
      playSpeech(text);
    }
  };

  // Monitor Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setCurrentUser(user);
      
      if (user) {
        // Logged in user - fetch profile from Firestore
        await fetchProfile(user.uid, user.displayName || 'Alchemist Operator', user.photoURL, false);
      } else {
        // Check if there is a guest profile saved in localStorage
        const savedGuest = localStorage.getItem('quantum_guest_profile');
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            setProfile(parsed);
            setDisplayName(parsed.displayName);
            setBio(parsed.bio);
            setSelectedAvatar(parsed.avatarUrl);
          } catch (e) {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (uid: string, fallbackName: string, fallbackAvatar: string | null, forceGuest: boolean) => {
    try {
      if (forceGuest) {
        return;
      }

      const docRef = doc(db, 'profiles', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        setDisplayName(data.displayName);
        setBio(data.bio);
        setSelectedAvatar(data.avatarUrl);
      } else {
        // Create initial profile in Firestore
        const newProfile: UserProfile = {
          uid,
          displayName: fallbackName,
          avatarUrl: fallbackAvatar || 'neon_vortex',
          bio: 'Authorized Quantum Lotto Operator.',
          role: 'user',
          quantumRank: 'Spacetime Initiate',
          createdAt: new Date().toISOString(),
          isGuest: false
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
        setDisplayName(newProfile.displayName);
        setBio(newProfile.bio);
        setSelectedAvatar(newProfile.avatarUrl);
      }
    } catch (error) {
      console.error("Error fetching Firestore profile:", error);
      // Fallback to locally managed state
      const mockProfile: UserProfile = {
        uid,
        displayName: fallbackName,
        avatarUrl: 'neon_vortex',
        bio: 'Authorized Quantum Lotto Operator (Offline Mode).',
        role: 'user',
        quantumRank: 'Local Operator',
        createdAt: new Date().toISOString(),
        isGuest: false
      };
      setProfile(mockProfile);
      setDisplayName(mockProfile.displayName);
      setBio(mockProfile.bio);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    triggerSpeech("Initializing secure authorization portal.");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      addToast("ACCESS AUTHORIZED", `Welcome back, ${result.user.displayName || 'Operator'}!`, "success");
      triggerSpeech(`Mainframe synchronization complete. Operators credentials confirmed.`);
    } catch (error: any) {
      console.error("Google Auth error:", error);
      addToast("AUTHORIZATION FAILED", error.message || "Failed to log in with Google.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Create/Update Guest Profile Handler
  const handleGuestSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast("VALIDATION ERROR", "Display name cannot be empty.", "warning");
      return;
    }

    setIsLoading(true);
    const guestUid = profile?.uid || 'guest_' + Math.random().toString(36).substr(2, 9);
    
    const newGuestProfile: UserProfile = {
      uid: guestUid,
      displayName: displayName.trim(),
      avatarUrl: selectedAvatar,
      bio: bio.trim() || 'Offline guest investigator.',
      role: 'user',
      quantumRank: 'Vortex Initiate',
      createdAt: profile?.createdAt || new Date().toISOString(),
      isGuest: true
    };

    localStorage.setItem('quantum_guest_profile', JSON.stringify(newGuestProfile));
    setProfile(newGuestProfile);
    setIsEditing(false);
    setIsLoading(false);
    
    addToast("PROFILE UPDATED", `Guest settings locked: ${newGuestProfile.displayName}`, "success");
    triggerSpeech(`Guest credentials authorized under temporary node ID.`);
  };

  // Save changes for regular Google-authenticated user
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!displayName.trim()) {
      addToast("VALIDATION ERROR", "Display name cannot be empty.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      if (profile.isGuest) {
        handleGuestSetup(e);
        return;
      }

      const updated: Partial<UserProfile> = {
        displayName: displayName.trim(),
        avatarUrl: selectedAvatar,
        bio: bio.trim(),
        // Derive rank based on simple criteria or keep existing
        quantumRank: profile.quantumRank
      };

      const docRef = doc(db, 'profiles', profile.uid);
      await setDoc(docRef, updated, { merge: true });

      setProfile(prev => prev ? { ...prev, ...updated } : null);
      setIsEditing(false);
      addToast("PROFILE LOCK COMPLETE", "User parameters written to permanent ledger.", "success");
      triggerSpeech("Profile synchronized and locked on Firestore blockchain.");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      addToast("ERROR SAVING PROFILE", "Could not commit profile changes to Firestore.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    triggerSpeech("Dumping active session credentials.");
    try {
      if (profile?.isGuest) {
        // Clear guest
        localStorage.removeItem('quantum_guest_profile');
        setProfile(null);
        setDisplayName('');
        setBio('');
        setSelectedAvatar('neon_vortex');
        addToast("GUEST LOGGED OUT", "Temporary security coordinates wiped.", "info");
      } else {
        await signOut(auth);
        addToast("DISCONNECTED", "Secure mainframe connection dissolved.", "info");
      }
      setIsEditing(false);
    } catch (error: any) {
      addToast("LOGOUT ERROR", "Failed to dissolve session credentials.", "error");
    }
  };

  // Select Avatar helper
  const getAvatarPreset = (id: string) => {
    return AVATAR_PRESETS.find(a => a.id === id) || AVATAR_PRESETS[0];
  };

  // Expose user state globally
  useEffect(() => {
    (window as any).currentUserProfile = profile;
  }, [profile]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-950 border border-slate-900 rounded-3xl p-6 max-w-md w-full relative overflow-hidden shadow-2xl font-mono text-slate-300"
        >
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-black tracking-widest text-white uppercase">
                COGNITIVE IDENTITY PROFILE
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition"
              aria-label="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Accessing ledger records...</span>
            </div>
          ) : !profile ? (
            /* SIGN IN CORE PANEL */
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-lg">
                <Lock className="w-8 h-8 text-slate-600 animate-pulse" />
              </div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider">SECURE ENTRY PROTOCOL</h4>
              <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
                Unlock full access to the **Lottery Forum & Blog**, share your predictions, read strategies, and build permanent credentials.
              </p>

              {/* AUTH BUTTONS */}
              <div className="w-full space-y-3 mt-6">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white text-black font-sans font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  AUTHENTICATE WITH GOOGLE
                </button>

                <div className="flex items-center gap-2 text-[10px] text-slate-600 uppercase font-black py-1">
                  <div className="h-[1px] flex-1 bg-slate-900" />
                  <span>OR CREATE GUEST CARD</span>
                  <div className="h-[1px] flex-1 bg-slate-900" />
                </div>

                {/* Local Guest Creation */}
                <form onSubmit={handleGuestSetup} className="space-y-3 bg-slate-900/30 border border-slate-900 p-4 rounded-2xl text-left">
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">GUEST NICKNAME</label>
                    <input
                      type="text"
                      maxLength={15}
                      required
                      placeholder="e.g. Alchemist_99"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-xs text-white px-3 py-2 rounded-xl font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition"
                  >
                    DEPLOY GUEST CREDENTIALS
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ACTIVE PROFILE DISPLAY */
            <div>
              {isEditing ? (
                /* EDITING VIEW */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Select Avatar presets */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1.5">CHOOSE COGNITIVE NEON SIGN</label>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedAvatar(preset.id)}
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-lg border transition-all ${
                            selectedAvatar === preset.id 
                              ? `${preset.color} scale-110` 
                              : 'border-slate-850 hover:border-slate-700 bg-slate-950 text-slate-400 opacity-60'
                          }`}
                        >
                          {preset.emoji}
                          {selectedAvatar === preset.id && (
                            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">DISPLAY NICKNAME</label>
                      <input
                        type="text"
                        maxLength={25}
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-xs text-white px-3 py-2.5 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">COGNITIVE BIOGRAPHY</label>
                      <textarea
                        maxLength={150}
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 outline-none text-xs text-white px-3 py-2 rounded-xl font-mono resize-none"
                        placeholder="Brief background profile..."
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider transition border border-slate-850"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-950 to-purple-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 font-bold text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    >
                      <Save className="w-3.5 h-3.5" />
                      SAVE LEDGER
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW PROFILE CARD */
                <div className="flex flex-col items-center">
                  
                  {/* Neon Avatar Display */}
                  <div className="relative mb-3.5">
                    <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl select-none ${getAvatarPreset(profile.avatarUrl).color}`}>
                      {getAvatarPreset(profile.avatarUrl).emoji}
                    </div>
                    {profile.role === 'admin' && (
                      <div className="absolute -bottom-1 -right-1 bg-rose-500/90 border border-rose-400 text-white font-black text-[7px] tracking-widest px-1.5 py-0.5 rounded uppercase shadow-md">
                        ADMIN
                      </div>
                    )}
                  </div>

                  {/* Nickname and Rank */}
                  <h4 className="text-white font-black text-base uppercase tracking-wider">{profile.displayName}</h4>
                  
                  <div className="flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mt-1">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{profile.quantumRank}</span>
                  </div>

                  {/* Description bio */}
                  <p className="text-[11.5px] text-slate-400 mt-4 leading-relaxed bg-slate-900/20 border border-slate-900/60 p-3 rounded-2xl w-full text-center italic">
                    "{profile.bio}"
                  </p>

                  {/* Profile properties */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[9px] font-mono">
                    <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl flex flex-col justify-center">
                      <span className="text-slate-500 uppercase font-bold">LEDGER STATUS</span>
                      <span className="text-white font-bold text-[10.5px] mt-0.5 uppercase flex items-center gap-1">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        {profile.isGuest ? 'LOCAL GUEST' : 'FIRESTORE NODE'}
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl flex flex-col justify-center">
                      <span className="text-slate-500 uppercase font-bold">OPERATIONAL SINCE</span>
                      <span className="text-white font-bold text-[10.5px] mt-0.5">
                        {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Action controls */}
                  <div className="w-full flex gap-2 mt-6 pt-5 border-t border-slate-900">
                    <button
                      onClick={() => {
                        setDisplayName(profile.displayName);
                        setBio(profile.bio);
                        setSelectedAvatar(profile.avatarUrl);
                        setIsEditing(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850 hover:border-slate-700 text-[10px] font-bold uppercase tracking-wider transition"
                    >
                      EDIT DETAILS
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex-1 py-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/30 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      TERMINATE CARD
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
