cat << 'INNER_EOF' >> src/index.css

/* Dashy Themes */
.theme-dracula {
  --app-bg: #282a36;
  --app-text: #f8f8f2;
  --color-slate-950: #282a36;
  --color-slate-900: #44475a;
  --color-slate-800: #6272a4;
  --color-cyan-500: #8be9fd;
  --color-cyan-400: #8be9fd;
  --color-cyan-950: rgba(139, 233, 253, 0.1);
  --color-indigo-500: #bd93f9;
  --color-rose-500: #ff5555;
  --color-emerald-500: #50fa7b;
  --color-amber-500: #f1fa8c;
  background-color: var(--app-bg);
  color: var(--app-text);
}

.theme-cyberpunk {
  --app-bg: #0f0f1b;
  --app-text: #00ffcc;
  --color-slate-950: #0f0f1b;
  --color-slate-900: #1a1a2e;
  --color-slate-800: #16213e;
  --color-cyan-500: #00ffcc;
  --color-cyan-400: #00ffcc;
  --color-cyan-950: rgba(0, 255, 204, 0.15);
  --color-indigo-500: #ff007f;
  --color-rose-500: #ff007f;
  --color-emerald-500: #00ffcc;
  --color-amber-500: #f39c12;
  background-color: var(--app-bg);
  color: var(--app-text);
}

.theme-hacker {
  --app-bg: #000000;
  --app-text: #00ff00;
  --color-slate-950: #000000;
  --color-slate-900: #001100;
  --color-slate-800: #002200;
  --color-slate-300: #00ff00;
  --color-cyan-500: #00ff00;
  --color-cyan-400: #00cc00;
  --color-cyan-300: #009900;
  --color-cyan-950: rgba(0, 255, 0, 0.1);
  --color-indigo-500: #00ff00;
  --color-rose-500: #ff0000;
  --color-emerald-500: #00ff00;
  --color-amber-500: #00ff00;
  background-color: var(--app-bg);
  color: var(--app-text);
}
INNER_EOF
