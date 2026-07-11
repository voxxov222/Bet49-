import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  ThumbsUp, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Send, 
  Plus, 
  Search, 
  X, 
  User, 
  ChevronLeft, 
  Clock, 
  Tag, 
  Filter, 
  Sparkles,
  Award,
  BookOpen,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import { db, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, setDoc } from '../lib/firebase';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  videoUrl?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string; // Avatar ID
  likesCount: number;
  likedBy: string[]; // List of user IDs
  repliesCount: number;
  createdAt: string;
}

interface ForumComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
}

interface BlogForumSectionProps {
  currentUserProfile: {
    uid: string;
    displayName: string;
    avatarUrl: string;
    role: string;
    quantumRank: string;
    isGuest: boolean;
  } | null;
  addToast: (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning') => void;
  playSpeech?: (text: string) => void;
  triggerUpgradeModal?: () => void;
}

const CATEGORIES = [
  { id: 'all', label: '🌐 ALL TOPICS', color: 'text-cyan-400 bg-cyan-950/25 border-cyan-500/20' },
  { id: 'blog', label: '📰 SYSTEM BLOG', color: 'text-rose-400 bg-rose-950/25 border-rose-500/20' },
  { id: 'strategy', label: '🚀 STRATEGIES', color: 'text-amber-400 bg-amber-950/25 border-amber-500/20' },
  { id: 'success', label: '✨ WIN PROOF', color: 'text-emerald-400 bg-emerald-950/25 border-emerald-500/20' },
  { id: 'general', label: '💬 DISCUSSION', color: 'text-purple-400 bg-purple-950/25 border-purple-500/20' },
  { id: 'algorithms', label: '💻 MATH & QUANTUM', color: 'text-pink-400 bg-pink-950/25 border-pink-500/20' }
];

const AVATAR_PRESETS: Record<string, { emoji: string; color: string }> = {
  'neon_vortex': { emoji: '🌀', color: 'border-cyan-500 bg-cyan-950/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]' },
  'neon_star': { emoji: '⭐', color: 'border-amber-500 bg-amber-950/40 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]' },
  'neon_atom': { emoji: '⚛️', color: 'border-purple-500 bg-purple-950/40 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)]' },
  'neon_phoenix': { emoji: '🔥', color: 'border-rose-500 bg-rose-950/40 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]' },
  'neon_matrix': { emoji: '🧬', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' },
  'neon_quasar': { emoji: '🌌', color: 'border-pink-500 bg-pink-950/40 text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.3)]' }
};

// Seeding standard high quality posts so there's active and vibrant content out-of-the-box
const PRE_SEEDED_POSTS: ForumPost[] = [
  {
    id: 'seed-1',
    title: 'Inter-dimensional recurrence mapping of 6/49 coordinate spacetime geometry',
    content: `Under rigorous mathematical scrutiny, lottery sequences are isolated high-entropy events. However, our coordinate geometry models have identified fascinating recurrent convergence patterns. 
    
Using **concentric-vTC wave vectors**, we mapped the last 1500 drawings. The results demonstrate a significant clustering of numbers around the golden spiral node boundaries (Specifically, **Primes 11, 23, 29, 41, 47**).

Has anyone experimented with combining the **369-Offset Strategy** together with the **Tesseract 4D manifold**? The overlapping harmonic resonance looks incredibly clean this week! Let's map coordinates in this thread.`,
    category: 'algorithms',
    authorId: 'system_alchemist',
    authorName: 'Master Alchemist (Dev)',
    authorAvatar: 'neon_atom',
    likesCount: 24,
    likedBy: [],
    repliesCount: 4,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    id: 'seed-2',
    title: 'OFFICIAL SYSTEM UPDATE: Deploying Alchemist Pro Manifold 4.0',
    content: `We are thrilled to officially deploy **Alchemist Pro Manifold v4.0**! 

This system release brings our most advanced modeling structures directly to your active browser frame:
*   **Conscious J.A.R.V.I.S. Agent**: Multi-threaded neural processing with unguided cognitive analysis.
*   **4D Hyper Wave Collapser**: Dynamically tracks coordinate drift across multiple spacetime timelines.
*   **SVD & Chebyshev Polynomials**: Mathematical curve-fitting models inside the Multivariate ML Deck.

*Check out our demo system video walkthrough below and leave comments on features you want to see next!*`,
    category: 'blog',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder secure embed
    authorId: 'system_admin',
    authorName: 'Admin Mainframe',
    authorAvatar: 'neon_vortex',
    likesCount: 38,
    likedBy: [],
    repliesCount: 2,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'seed-3',
    title: 'PROVEN SUCCESS: Hit 5 numbers yesterday using Falken Loto AI algorithm!',
    content: `I am absolutely speechless. Yesterday evening, I ran a multi-layered simulation using the **Falken Loto AI Predictor** after loading the latest datasets. 

I filtered the sequence using a **Min/Max Sum of 115-165** and an extreme ratio restriction. 
The generated system proposal was: **[8, 14, 21, 25, 33, 44]**.

The actual drawing matched **8, 14, 25, 33, and 44**! Missed the 6th number (21 instead of 23), but secured a massive division payout. This is the closest I have ever gotten! Proof uploaded below. Highly recommend locking your neural parameters in early!`,
    category: 'success',
    imageUrl: 'https://images.unsplash.com/photo-1518135714426-c18f5ffb6f4d?auto=format&fit=crop&q=80&w=600',
    authorId: 'operator_lucky',
    authorName: 'Resonance Pioneer',
    authorAvatar: 'neon_star',
    likesCount: 42,
    likedBy: [],
    repliesCount: 3,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  }
];

const PRE_SEEDED_COMMENTS: Record<string, ForumComment[]> = {
  'seed-1': [
    {
      id: 'c1',
      postId: 'seed-1',
      content: 'I loaded the Golden Spiral node numbers into the 3D Wireframe module, and the density spikes perfectly match your coordinate claims. Outstanding work!',
      authorId: 'user_a',
      authorName: 'Quantum Nomad',
      authorAvatar: 'neon_vortex',
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      id: 'c2',
      postId: 'seed-1',
      content: 'Wait, did you apply the prime divisor calculations to the concentric-vTC wave? Or is that strictly raw coordinate distribution?',
      authorId: 'user_b',
      authorName: 'Drift Explorer',
      authorAvatar: 'neon_matrix',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    }
  ],
  'seed-2': [
    {
      id: 'c3',
      postId: 'seed-2',
      content: 'The Chebyshev regression models are super responsive. The ML predictor deck loads immediately now. Thank you Dev Team!',
      authorId: 'user_c',
      authorName: 'Polynomial Alchemist',
      authorAvatar: 'neon_quasar',
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    }
  ],
  'seed-3': [
    {
      id: 'c4',
      postId: 'seed-3',
      content: 'Wow!! That is legendary! Did you use the premium neural swarm settings or standard AI model parameters?',
      authorId: 'user_d',
      authorName: 'Vortex Seeker',
      authorAvatar: 'neon_phoenix',
      createdAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString()
    }
  ]
};

export default function BlogForumSection({
  currentUserProfile,
  addToast,
  playSpeech,
  triggerUpgradeModal
}: BlogForumSectionProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Compose states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Comment state
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Sync with Firestore, fallback to pre-seeded posts if offline or empty
  useEffect(() => {
    try {
      const q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: ForumPost[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ForumPost);
        });
        
        // Merge list with pre-seeded posts (avoiding duplicate IDs)
        const merged = [...list];
        PRE_SEEDED_POSTS.forEach(seeded => {
          if (!merged.some(p => p.id === seeded.id)) {
            merged.push(seeded);
          }
        });

        // Sort merged list by createdAt desc
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(merged);
      }, (error) => {
        console.warn("Firestore access restricted, displaying offline seed posts:", error);
        setPosts(PRE_SEEDED_POSTS);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore unavailable, defaulting to local cache:", e);
      setPosts(PRE_SEEDED_POSTS);
    }
  }, []);

  // Fetch comments for selected post
  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }

    // Load pre-seeded comments if any
    const seedReplies = PRE_SEEDED_COMMENTS[selectedPost.id] || [];

    try {
      const commentsRef = collection(db, 'forum_posts', selectedPost.id, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: ForumComment[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as ForumComment);
        });

        // Merge and deduplicate
        const merged = [...fetched];
        seedReplies.forEach(seeded => {
          if (!merged.some(c => c.id === seeded.id)) {
            merged.push(seeded);
          }
        });

        setComments(merged);
      }, (error) => {
        setComments(seedReplies);
      });

      return () => unsubscribe();
    } catch (e) {
      setComments(seedReplies);
    }
  }, [selectedPost]);

  // Handle Likes
  const handleLike = async (post: ForumPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserProfile) {
      addToast("SIGN IN REQUIRED", "Please sign in or set up a Guest Card to like threads.", "warning");
      return;
    }

    const uid = currentUserProfile.uid;
    const isLiked = post.likedBy?.includes(uid);
    const updatedLikedBy = isLiked
      ? (post.likedBy || []).filter(id => id !== uid)
      : [...(post.likedBy || []), uid];
    
    const increment = isLiked ? -1 : 1;
    const updatedCount = Math.max(0, post.likesCount + increment);

    // Update state locally first for snappy UI feel
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likesCount: updatedCount, likedBy: updatedLikedBy } : p));
    if (selectedPost?.id === post.id) {
      setSelectedPost(prev => prev ? { ...prev, likesCount: updatedCount, likedBy: updatedLikedBy } : null);
    }

    try {
      // Sync to Firestore if not a seeded post
      if (!post.id.startsWith('seed-')) {
        const postRef = doc(db, 'forum_posts', post.id);
        await updateDoc(postRef, {
          likesCount: updatedCount,
          likedBy: updatedLikedBy
        });
      } else {
        addToast("SEED THREAD LIKED", "Seeded threads are modified in local cache.", "info");
      }
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  // Submit Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      addToast("ACCESS DENIED", "Please initialize a profile to compose threads.", "error");
      return;
    }

    if (!newTitle.trim() || !newContent.trim()) {
      addToast("VALIDATION ERROR", "Title and content threads cannot be blank.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        imageUrl: newImageUrl.trim() || null,
        videoUrl: newVideoUrl.trim() || null,
        authorId: currentUserProfile.uid,
        authorName: currentUserProfile.displayName,
        authorAvatar: currentUserProfile.avatarUrl,
        likesCount: 0,
        likedBy: [],
        repliesCount: 0,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'forum_posts'), payload);
      
      addToast("THREAD DEPLOYED", "Your post has been securely added to the ledger.", "success");
      if (playSpeech) {
        playSpeech("Community thread added successfully. Synchronizing spectrum grid.");
      }

      // Reset
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      setNewImageUrl('');
      setNewVideoUrl('');
      setShowCreateModal(false);
    } catch (error: any) {
      console.error("Error creating post:", error);
      addToast("SUBMISSION FAILED", "Could not synchronize post with Firestore.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Comment
  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (!currentUserProfile) {
      addToast("SIGN IN REQUIRED", "Please sign in or set up a Guest Card to comment.", "warning");
      return;
    }

    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = {
        postId: selectedPost.id,
        content: commentText.trim(),
        authorId: currentUserProfile.uid,
        authorName: currentUserProfile.displayName,
        authorAvatar: currentUserProfile.avatarUrl,
        createdAt: new Date().toISOString()
      };

      if (!selectedPost.id.startsWith('seed-')) {
        // Log to Firebase Subcollection
        const commentsRef = collection(db, 'forum_posts', selectedPost.id, 'comments');
        await addDoc(commentsRef, newComment);

        // Update comment counter in parent document
        const postRef = doc(db, 'forum_posts', selectedPost.id);
        await updateDoc(postRef, {
          repliesCount: (selectedPost.repliesCount || 0) + 1
        });
      } else {
        // Seed post comments appended locally
        const mockCommentId = 'local_' + Math.random().toString(36).substr(2, 9);
        const fullComment: ForumComment = { id: mockCommentId, ...newComment };
        
        if (!PRE_SEEDED_COMMENTS[selectedPost.id]) {
          PRE_SEEDED_COMMENTS[selectedPost.id] = [];
        }
        PRE_SEEDED_COMMENTS[selectedPost.id].push(fullComment);
        setComments(prev => [...prev, fullComment]);
        
        // Update reply counter locally
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, repliesCount: p.repliesCount + 1 } : p));
        selectedPost.repliesCount += 1;
      }

      setCommentText('');
      addToast("REPLY SYNCHRONIZED", "Your message is live on the thread loop.", "success");
    } catch (error) {
      console.error("Failed to post comment:", error);
      addToast("COMMENT ERROR", "Could not save reply.", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Filter posts based on tab and search
  const filteredPosts = posts.filter(post => {
    const matchesTab = activeTab === 'all' || post.category === activeTab;
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Get Category Styling
  const getCategoryMeta = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[4];
  };

  // Helper to format video embeds
  const cleanEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtu.be/')) {
      const id = url.split('/').pop()?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  return (
    <div className="w-full flex flex-col gap-6 font-mono text-slate-300">
      
      {/* LANDING / BANNER */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              Mainframe Quantum Space
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              ALCHEMIST FORUM & BLOG
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Explore advanced forecasting, share custom coordinates, verify hit proofs, or discuss multi-dimensional recurrence formulas with other operators.
            </p>
          </div>

          <button
            onClick={() => {
              if (!currentUserProfile) {
                addToast("SIGN IN REQUIRED", "Please open the User Profile (top right) and authorize a profile to create threads.", "warning");
              } else {
                setShowCreateModal(true);
              }
            }}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-950 to-purple-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.15)] self-start md:self-center"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            CREATE NEW THREAD
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between border-b border-slate-900 pb-4">
        
        {/* Category Pill Filters */}
        <div className="flex gap-2 py-1 overflow-x-auto scrollbar-hide shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition border ${
                activeTab === cat.id 
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' 
                  : 'bg-slate-950/20 border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search threads, posts, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500/50 outline-none text-xs text-slate-300 px-10 py-3 rounded-2xl font-mono"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* VIEW SPLIT (LIST vs EXPANDED DETAILS) */}
      <div className="w-full min-h-[500px]">
        {!selectedPost ? (
          /* THREAD LIST VIEW */
          filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-950/20 border border-slate-900 border-dashed rounded-3xl text-center gap-2">
              <Filter className="w-8 h-8 text-slate-600 animate-pulse" />
              <h4 className="text-white font-bold text-sm uppercase mt-2">No threads detected</h4>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                No signal matched your current search vectors or category filter. Try clearing filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map((post, idx) => {
                const catMeta = getCategoryMeta(post.category);
                const avatar = AVATAR_PRESETS[post.authorAvatar] || AVATAR_PRESETS['neon_vortex'];
                const hasLiked = currentUserProfile && post.likedBy?.includes(currentUserProfile.uid);

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => {
                      setSelectedPost(post);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-slate-950/40 border border-slate-900 hover:border-cyan-500/20 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-sm group hover:shadow-[0_0_15px_rgba(6,182,212,0.02)]"
                  >
                    <div>
                      {/* Meta top */}
                      <div className="flex items-center justify-between mb-3 text-[9px] font-bold">
                        <span className={`px-2 py-0.5 rounded border ${catMeta.color}`}>
                          {catMeta.label}
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-white uppercase group-hover:text-cyan-300 transition-colors tracking-tight line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Content Snippet */}
                      <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed line-clamp-3">
                        {post.content.replace(/[#*`_]/g, '')}
                      </p>
                    </div>

                    {/* Bottom profile and stats */}
                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-900/60">
                      
                      {/* User Info */}
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-sm ${avatar.color}`}>
                          {avatar.emoji}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10.5px] font-bold text-slate-300">{post.authorName}</span>
                          <span className="text-[7.5px] text-slate-500 tracking-wider">MEMBER OPERATOR</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        {post.imageUrl && <ImageIcon className="w-3.5 h-3.5 text-slate-600" />}
                        {post.videoUrl && <VideoIcon className="w-3.5 h-3.5 text-slate-600" />}

                        <button
                          onClick={(e) => handleLike(post, e)}
                          className={`flex items-center gap-1 px-2 py-1 rounded bg-slate-950/60 border hover:border-cyan-500/20 transition ${
                            hasLiked ? 'text-cyan-400 border-cyan-500/30' : 'text-slate-500 border-transparent'
                          }`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${hasLiked ? 'fill-cyan-500/10' : ''}`} />
                          <span>{post.likesCount}</span>
                        </button>

                        <div className="flex items-center gap-1 text-slate-500 px-2 py-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{post.repliesCount || 0}</span>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          /* DETAILED THREAD VIEW */
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Primary content Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* BACK BUTTON */}
              <button
                onClick={() => setSelectedPost(null)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300 transition-colors uppercase self-start"
              >
                <ChevronLeft className="w-4 h-4" />
                RETURN TO LISTINGS
              </button>

              {/* THREAD CORE CARD */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 rounded border text-[9px] font-bold ${getCategoryMeta(selectedPost.category).color}`}>
                    {getCategoryMeta(selectedPost.category).label}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(selectedPost.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <h1 className="text-base md:text-lg font-black text-white uppercase tracking-tight leading-tight">
                  {selectedPost.title}
                </h1>

                {/* Author row */}
                <div className="flex items-center gap-2.5 my-5 pb-4 border-b border-slate-900/60">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-lg ${AVATAR_PRESETS[selectedPost.authorAvatar]?.color || AVATAR_PRESETS['neon_vortex'].color}`}>
                    {AVATAR_PRESETS[selectedPost.authorAvatar]?.emoji || '🌀'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      {selectedPost.authorName}
                      {selectedPost.authorId === 'system_alchemist' && <Award className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-[8.5px] text-slate-500 tracking-wider">QUANTUM SYSTEM OPERATOR</div>
                  </div>
                </div>

                {/* Main Body content with markdown support */}
                <div className="text-xs text-slate-300 leading-relaxed font-sans prose prose-invert max-w-none mt-4">
                  <Markdown>{selectedPost.content}</Markdown>
                </div>

                {/* Optional Media Attachments */}
                {selectedPost.imageUrl && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-slate-900 max-h-96">
                    <img 
                      src={selectedPost.imageUrl} 
                      alt="Forum Attachment" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}

                {selectedPost.videoUrl && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-slate-900 aspect-video bg-slate-950">
                    <iframe 
                      src={cleanEmbedUrl(selectedPost.videoUrl)}
                      title="Forum Embedded Player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}

                {/* Likes engagement bar */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-900/60">
                  <button
                    onClick={(e) => handleLike(selectedPost, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:border-cyan-500/20 text-xs font-bold transition ${
                      currentUserProfile && selectedPost.likedBy?.includes(currentUserProfile.uid) 
                        ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/10 shadow-[0_0_10px_rgba(6,182,212,0.05)]' 
                        : 'text-slate-500 border-transparent'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{selectedPost.likesCount} UPVOTE REAX</span>
                  </button>
                  
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    ID: {selectedPost.id}
                  </div>
                </div>

              </div>
              
              {/* COMMENTS LOG SECTION */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6">
                <h3 className="text-xs font-black text-white tracking-widest uppercase mb-4 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  RESPONSES ({comments.length})
                </h3>

                {/* Comments stack */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {comments.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-6">No localized comments yet. Be the first to synchronize a response!</p>
                  ) : (
                    comments.map(comment => {
                      const cAvatar = AVATAR_PRESETS[comment.authorAvatar] || AVATAR_PRESETS['neon_vortex'];
                      return (
                        <div key={comment.id} className="p-3 bg-slate-900/30 border border-slate-900/60 rounded-xl flex gap-3 text-xs">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-base shrink-0 ${cAvatar.color}`}>
                            {cAvatar.emoji}
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-[10.5px]">{comment.authorName}</span>
                              <span className="text-[8px] text-slate-500">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment composer */}
                <form onSubmit={handleCreateComment} className="mt-5 pt-4 border-t border-slate-900/60">
                  {currentUserProfile ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={500}
                        required
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a constructive reply..."
                        className="flex-1 bg-slate-950 border border-slate-900 focus:border-cyan-500/50 outline-none text-xs text-slate-300 px-4 py-2.5 rounded-xl font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="px-4 py-2.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 rounded-xl hover:border-cyan-400 transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-3 bg-slate-900/20 border border-slate-900 rounded-xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Authorize your profile to join the discussion</p>
                    </div>
                  )}
                </form>

              </div>

            </div>

            {/* Sidebar Guidelines Column */}
            <div className="space-y-6">
              
              {/* OPERATIONAL NOTICE */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 text-xs space-y-3">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[10.5px] tracking-wider border-b border-slate-900 pb-2">
                  <BookOpen className="w-4 h-4" />
                  Forum Codex
                </div>
                <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                  Welcome to the Lotto Alchemist Community. Here, high-dimensional calculation concepts are openly explored. Please maintain mathematical respect.
                </p>
                <div className="space-y-2 pt-1 font-mono text-[9px] uppercase font-bold text-slate-500">
                  <div className="flex justify-between">
                    <span>Active Moderators:</span>
                    <span className="text-white">Admin Core</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocol:</span>
                    <span className="text-cyan-400">Ledger-Safe</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Rules:</span>
                    <span className="text-slate-300">Keep it constructive</span>
                  </div>
                </div>
              </div>

              {/* HELPFUL MATH FORMULAS */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 text-xs space-y-3">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold uppercase text-[10.5px] tracking-wider border-b border-slate-900 pb-2">
                  <HelpCircle className="w-4 h-4" />
                  Quick Formulas
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  Common equations utilized in lottery spatial modeling and recurring wave breakdowns:
                </p>
                
                <div className="space-y-2 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                  <div>
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Sum Distribution Mean</span>
                    <code className="text-white text-[10px] font-mono">μ = n * (N + 1) / 2 = 150.0</code>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Golden Vortex Vector</span>
                    <code className="text-purple-350 text-[10px] font-mono">R_n = (φ^n - ψ^n) / √5</code>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Hyper-Entropy Coeff</span>
                    <code className="text-cyan-350 text-[10px] font-mono">H = - Σ P(x_i) log_2 P(x_i)</code>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* CREATE THREAD MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-900 rounded-3xl p-6 max-w-lg w-full relative overflow-hidden shadow-2xl font-mono text-slate-300"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 pb-3 border-b border-slate-900 mb-5">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black tracking-widest text-white uppercase">
                  COMPOSE QUANTUM THREAD
                </h3>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                
                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">THREAD TITLE</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    placeholder="e.g., My Golden Vortex backtest findings..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500/50 outline-none text-xs text-white px-3.5 py-2.5 rounded-xl font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">CATEGORY</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500/50 outline-none text-xs text-white px-3 py-2.5 rounded-xl font-mono"
                    >
                      <option value="general">💬 General Talk</option>
                      <option value="strategy">🚀 Strategy</option>
                      <option value="success">✨ Success Story</option>
                      <option value="algorithms">💻 Algorithms & Math</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">ATTACH IMAGE URL (OPTIONAL)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500/50 outline-none text-xs text-white px-3 py-2.5 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">ATTACH VIDEO EMBED URL (OPTIONAL)</label>
                  <input
                    type="url"
                    placeholder="e.g., https://www.youtube.com/watch?v=..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500/50 outline-none text-xs text-white px-3 py-2.5 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">THREAD BODY DESCRIPTION</label>
                  <textarea
                    required
                    rows={6}
                    maxLength={3000}
                    placeholder="Discuss findings, parameters, or strategies. Supports rich Markdown formatting."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500/50 outline-none text-xs text-white p-3 rounded-xl font-mono resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider transition border border-slate-850"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950 to-purple-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 font-bold text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  >
                    {isSubmitting ? 'DEPLOYING LEDGER...' : 'DEPLOY THREAD'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
