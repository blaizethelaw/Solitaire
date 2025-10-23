
import React from 'react';
import { AlertTriangle, Sparkles, ChevronRight, LoaderCircle } from 'lucide-react';

interface SuggestionBoxProps {
  currentSuggestions: string[];
  isLoading: boolean;
  isInitialAnalysis: boolean;
  hasNextMoves: boolean;
  onNextMoves: () => void;
  error: string | null;
}

const LoadingIndicator: React.FC<{text: string}> = ({ text }) => (
    <div className="flex items-center space-x-2 text-sm text-gray-400">
        <LoaderCircle className="w-4 h-4 animate-spin text-indigo-400"/>
        <span>{text}</span>
    </div>
);


const SuggestionBox: React.FC<SuggestionBoxProps> = ({
    currentSuggestions,
    isLoading,
    isInitialAnalysis,
    hasNextMoves,
    onNextMoves,
    error
}) => {
  const hasSuggestions = currentSuggestions.length > 0;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-grow flex flex-col">
        <h2 className="text-xl font-semibold text-indigo-400 mb-4 flex items-center">
            <Sparkles className="mr-2 h-5 w-5"/>
            AI Suggestions
        </h2>
        <div className="flex-grow bg-gray-900/50 p-4 rounded-md min-h-[220px]">
            {error && (
                <div className="text-red-400 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {error}
                </div>
            )}
            {!error && isInitialAnalysis && (
                <div className="text-center text-gray-400">
                    <LoaderCircle className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3"/>
                    <p>Performing initial board analysis...</p>
                </div>
            )}
            {!error && !isInitialAnalysis && hasSuggestions && (
                 <ol className="text-cyan-300 space-y-2">
                    {currentSuggestions.map((move, index) => (
                        <li key={index} className="flex items-start">
                            <span className="mr-2 text-indigo-400 font-semibold">{index + 1}.</span>
                            {move.replace(/^\d+\.\s*/, '')}
                        </li>
                    ))}
                </ol>
            )}
            {!error && !isInitialAnalysis && !hasSuggestions && (
                <p className="text-gray-400">Start a session to get AI suggestions.</p>
            )}
        </div>

        {hasSuggestions && (
            <div className="pt-4 mt-4 border-t border-gray-700/50 flex items-center justify-between">
                <div>
                    {isLoading && <LoadingIndicator text="Preparing next moves..." />}
                </div>
                <button
                    onClick={onNextMoves}
                    disabled={!hasNextMoves || isLoading}
                    className="flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Next Moves
                    <ChevronRight className="ml-2 h-5 w-5" />
                </button>
            </div>
        )}
    </div>
  );
};

export default SuggestionBox;
