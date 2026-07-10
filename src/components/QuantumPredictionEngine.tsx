import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Brain, Activity } from 'lucide-react';

export default function QuantumPredictionEngine({ particles }: { particles: any[] }) {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [model, setModel] = useState<tf.LayersModel | null>(null);

  useEffect(() => {
    // Initialize simple model
    const m = tf.sequential();
    m.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [2] }));
    m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    m.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    setModel(m);
  }, []);

  const runPrediction = () => {
    if (!model || particles.length === 0) return;
    
    // Use first particle as input features (x, y)
    const input = tf.tensor2d([[particles[0].x, particles[0].y]]);
    const output = model.predict(input) as tf.Tensor;
    output.data().then(data => {
      setPrediction(data[0]);
    });
  };

  return (
    <div className="bg-black/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
      <h3 className="text-sm font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
        <Brain className="w-4 h-4 text-purple-400" />
        Quantum Prediction Engine
      </h3>
      <button
        onClick={runPrediction}
        className="px-4 py-2 bg-purple-900 text-purple-300 border border-purple-700 rounded-lg text-xs font-mono font-bold uppercase transition"
      >
        Predict Collapse State
      </button>
      <div className="text-center font-mono text-xl text-emerald-400">
        {prediction !== null ? `Probability: ${(prediction * 100).toFixed(2)}%` : 'No Prediction'}
      </div>
    </div>
  );
}
