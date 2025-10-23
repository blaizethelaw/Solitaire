
import React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
      <h2 className="text-xl font-semibold text-indigo-400 mb-4">How to Use</h2>
      <div className="space-y-4 text-gray-300">
        <div className="p-4 rounded-lg bg-yellow-900/50 border border-yellow-700">
            <h3 className="font-semibold text-yellow-300">⚠️ Important: Screen Sharing Limitation</h3>
            <p className="text-sm text-yellow-400">
                Screen sharing is not available in Claude artifacts. To use this app with full screen sharing capabilities, you'll need to run it in a regular browser environment or copy the code to your own project.
            </p>
        </div>
        <ol className="list-decimal list-inside space-y-2">
            <li>Open your solitaire game in a browser tab or application</li>
            <li>Click "Start Session" and select the window/tab with your game</li>
            <li>Wait for the initial AI analysis to complete</li>
            <li>Follow the numbered move suggestions in priority order</li>
            <li>Click "Next Moves" after completing the current suggestions</li>
            <li>The AI will continuously prepare the next best moves for you</li>
        </ol>
        <div className="p-4 rounded-lg bg-blue-900/50 border border-blue-700">
            <h3 className="font-semibold text-blue-300">💡 Alternative Solution</h3>
            <p className="text-sm text-blue-400">
                You can use your existing GitHub code which is already set up correctly! The code you shared uses React + TypeScript + Vite and will work perfectly in your local environment.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
