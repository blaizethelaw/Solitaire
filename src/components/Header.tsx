
import React from 'react';
import { BrainCircuit } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-4">
        <BrainCircuit className="w-10 h-10 text-indigo-400" />
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
          Solitaire AI Guide
        </h1>
      </div>
      <p className="mt-4 text-lg text-gray-300">
        Let AI help you master Solitaire. Share your screen and get real-time winning moves.
      </p>
    </header>
  );
};

export default Header;
