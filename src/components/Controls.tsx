
import React from 'react';
import { PlayCircle, StopCircle } from 'lucide-react';

interface ControlsProps {
  isSessionActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

const Controls: React.FC<ControlsProps> = ({ isSessionActive, onStart, onStop }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
      <h2 className="text-xl font-semibold text-indigo-400 mb-4">Session Control</h2>
      <div className="flex space-x-4">
        <button
          onClick={onStart}
          disabled={isSessionActive}
          className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-200 ease-in-out"
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          Start Session
        </button>
        <button
          onClick={onStop}
          disabled={!isSessionActive}
          className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all duration-200 ease-in-out"
        >
          <StopCircle className="mr-2 h-5 w-5" />
          Stop Session
        </button>
      </div>
       <p className={`mt-4 text-sm font-medium ${isSessionActive ? 'text-green-400' : 'text-red-400'}`}>
        Status: {isSessionActive ? 'Active' : 'Inactive'}
      </p>
    </div>
  );
};

export default Controls;
