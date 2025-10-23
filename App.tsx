import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BrainCircuit, PlayCircle, StopCircle, AlertTriangle, Sparkles, ChevronRight, Gamepad2 } from 'lucide-react';

export default function SolitaireAIGuide() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [nextSuggestions, setNextSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialAnalysis, setIsInitialAnalysis] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [lastSuggestion, setLastSuggestion] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !videoRef.current.srcObject) {
      return null;
    }
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  }, []);

  const getSolitaireMove = async (imageBase64, lastMoves) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: `You are a world-class AI assistant for Klondike Solitaire. Your most important task is accuracy. An invalid move suggestion is a critical failure.

Analyze the provided game screenshot by following these steps methodically:
1. **Internal Analysis (Do not output this part):**
   * First, identify every single face-up card in the seven Tableau columns. Note their suit, rank, and which column they are in.
   * Second, identify the top card of each of the four Foundation piles.
   * Third, identify the top card of the Waste pile (next to the Stockpile).
   * Fourth, verify the game rules for each potential move:
     - Tableau: Cards must be placed on a card of the next-highest rank and opposite color (e.g., Red 5 on Black 6).
     - Foundations: Cards must be placed on a card of the same suit and next-lowest rank (e.g., 2 of Hearts on Ace of Hearts). Aces start new piles.
     - Only Kings can move to empty Tableau columns.

2. **Strategic Move Selection:** Based on your internal analysis, determine the best sequence of moves. Use this strict priority order:
   * **Priority 1 (Foundations):** Can any card from the Tableau or Waste pile be moved to a Foundation pile? Do this first.
   * **Priority 2 (Reveal Cards):** Are there moves within the Tableau that will expose a new face-down card? This is the next highest priority.
   * **Priority 3 (Consolidate Tableau):** Are there other valid moves within the Tableau that improve the board state, such as freeing a column for a King?
   * **Priority 4 (Stockpile):** If and only if no other moves are possible or beneficial, suggest drawing from the stockpile.

3. **Final Output:**
   * Your response MUST BE ONLY a numbered list of the moves you selected.
   * CRITICAL: Before outputting, re-verify every single move against the image to ensure it is 100% valid and possible on the current board.
   * Do not add any intro, outro, or commentary.
   * If no moves are possible, respond with the exact text: "No moves available."

${lastMoves ? `\n\nThe previous suggestions were:\n${lastMoves}\n\nAnalyze the new board state and provide the next sequence of optimal moves based on the same strict rules and priorities.` : ''}`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.find(c => c.type === 'text')?.text || '';
      return text.trim();
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw new Error('Failed to communicate with the AI API.');
    }
  };

  const handleStopSession = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsSessionActive(false);
    setCurrentSuggestions([]);
    setNextSuggestions([]);
    setLastSuggestion('');
    setError(null);
    setIsLoading(false);
    setIsInitialAnalysis(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const prepareNextSuggestions = useCallback(async () => {
    const imageBase64 = captureFrame();
    if (!imageBase64) return;

    setIsLoading(true);
    try {
      const rawSuggestion = await getSolitaireMove(imageBase64, lastSuggestion);
      if (rawSuggestion && rawSuggestion.toLowerCase() !== "no moves available.") {
        const moves = rawSuggestion.split('\n').filter(move => move.trim().length > 0);
        setNextSuggestions(moves);
      } else {
        setNextSuggestions([rawSuggestion || "No new moves found."]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to get next suggestion. The session may be stopped.');
    } finally {
      setIsLoading(false);
    }
  }, [captureFrame, lastSuggestion]);

  const runInitialAnalysis = useCallback(async () => {
    setIsInitialAnalysis(true);
    setIsLoading(true);
    setError(null);
    const imageBase64 = captureFrame();
    if (!imageBase64) {
      setError("Could not capture screen for analysis.");
      setIsLoading(false);
      setIsInitialAnalysis(false);
      return;
    }

    try {
      const rawSuggestion = await getSolitaireMove(imageBase64, '');
      if (rawSuggestion && rawSuggestion.toLowerCase() !== "no moves available.") {
        const moves = rawSuggestion.split('\n').filter(move => move.trim().length > 0);
        setCurrentSuggestions(moves);
        setLastSuggestion(rawSuggestion);
        prepareNextSuggestions();
      } else {
        setCurrentSuggestions([rawSuggestion || "No moves available."]);
        setLastSuggestion(rawSuggestion);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to get initial suggestion. Stopping session.');
      handleStopSession();
    } finally {
      setIsInitialAnalysis(false);
    }
  }, [captureFrame, handleStopSession, prepareNextSuggestions]);

  const handleNextMoves = () => {
    if (nextSuggestions.length > 0) {
      setCurrentSuggestions(nextSuggestions);
      setLastSuggestion(nextSuggestions.join('\n'));
      setNextSuggestions([]);
      prepareNextSuggestions();
    }
  };

  const handleStartSession = async () => {
    try {
      setError(null);
      
      // Check if getDisplayMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setError('Screen sharing is not supported in this browser. Please use Chrome, Edge, or Firefox.');
        return;
      }
      
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      // Check if we actually got a video track
      if (!displayStream || displayStream.getVideoTracks().length === 0) {
        setError('No video track received. Please try again.');
        return;
      }
      
      setStream(displayStream);
      setIsSessionActive(true);
      setCurrentSuggestions([]);
      setNextSuggestions([]);
      
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        handleStopSession();
      });
    } catch (err) {
      console.error('Error starting screen share:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('You cancelled screen sharing. Click "Start Session" and select your solitaire window when prompted.');
      } else if (err.name === 'NotFoundError') {
        setError('No screen was selected. Please try again and choose a window to share.');
      } else if (err.name === 'AbortError') {
        setError('Screen sharing was cancelled. Please try again.');
      } else {
        setError(`Screen sharing error: ${err.message || 'Unknown error'}. Please try again.`);
      }
      setIsSessionActive(false);
      setStream(null);
    }
  };

  useEffect(() => {
    if (isSessionActive && stream && videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.srcObject = stream;

      const onMetadataLoaded = () => {
        videoElement.play().catch(e => {
          console.error('Video play failed:', e);
          setError('Could not display screen preview.');
        });
        runInitialAnalysis();
      };

      videoElement.addEventListener('loadedmetadata', onMetadataLoaded);

      return () => {
        videoElement.removeEventListener('loadedmetadata', onMetadataLoaded);
      };
    }
  }, [isSessionActive, stream, runInitialAnalysis]);

  const hasSuggestions = currentSuggestions.length > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center">
          <div className="flex items-center justify-center gap-4">
            <BrainCircuit className="w-10 h-10 text-indigo-400" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
              Solitaire AI Guide
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-300">
            Let AI help you master Solitaire. Share your screen and get real-time winning moves.
          </p>
        </header>

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-6">
            {/* Controls */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
              <h2 className="text-xl font-semibold text-indigo-400 mb-4">Session Control</h2>
              <div className="flex space-x-4">
                <button
                  onClick={handleStartSession}
                  disabled={isSessionActive}
                  className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Start Session
                </button>
                <button
                  onClick={handleStopSession}
                  disabled={!isSessionActive}
                  className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  <StopCircle className="mr-2 h-5 w-5" />
                  Stop Session
                </button>
              </div>
              <p className={`mt-4 text-sm font-medium ${isSessionActive ? 'text-green-400' : 'text-red-400'}`}>
                Status: {isSessionActive ? 'Active' : 'Inactive'}
              </p>
            </div>

            {/* Suggestion Box */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-grow flex flex-col">
              <h2 className="text-xl font-semibold text-indigo-400 mb-4 flex items-center">
                <Sparkles className="mr-2 h-5 w-5"/>
                AI Suggestions
              </h2>
              <div className="flex-grow flex flex-col justify-between bg-gray-900/50 p-4 rounded-md min-h-[220px]">
                <div className="flex-grow flex items-center justify-center">
                  {error && (
                    <div className="text-red-400 flex items-center text-center">
                      <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}
                  {!error && isInitialAnalysis && (
                    <div className="text-center text-gray-400">
                      <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p>Performing initial board analysis...</p>
                    </div>
                  )}
                  {!error && !isInitialAnalysis && hasSuggestions && (
                    <ol className="text-cyan-300 space-y-2 w-full">
                      {currentSuggestions.map((move, index) => (
                        <li key={index} className="flex items-start text-base">
                          <span className="mr-3 text-indigo-400 font-semibold">{index + 1}.</span>
                          <span className="flex-1">{move.replace(/^\d+\.\s*/, '')}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {!error && !isInitialAnalysis && !hasSuggestions && (
                    <p className="text-gray-400 text-center">Start a session to get AI suggestions.</p>
                  )}
                </div>
                
                {hasSuggestions && (
                  <div className="pt-4 mt-4 border-t border-gray-700/50 flex items-center justify-between">
                    <div>
                      {isLoading && (
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Preparing next moves...</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleNextMoves}
                      disabled={nextSuggestions.length === 0 || isLoading}
                      className="flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      Next Moves
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Screen Preview */}
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-indigo-400 mb-4">Live Screen Preview</h2>
            {isSessionActive ? (
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-indigo-500/50">
                <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
              </div>
            ) : (
              <div className="aspect-video w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center">
                <Gamepad2 className="w-16 h-16 text-gray-500 mb-4" />
                <p className="text-gray-400">Your game preview will appear here</p>
                <p className="text-sm text-gray-500">Start a session to begin</p>
              </div>
            )}
          </div>
        </main>

        {/* Instructions */}
        <div className="mt-8 bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-indigo-300 mb-3">How to Use</h3>
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-md p-4 mb-4">
            <p className="text-yellow-200 text-sm font-semibold mb-2">⚠️ Important: Screen Sharing Limitation</p>
            <p className="text-yellow-100 text-sm">
              Screen sharing is not available in Claude artifacts. To use this app with full screen sharing capabilities, you'll need to run it in a regular browser environment or copy the code to your own project.
            </p>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Open your solitaire game in a browser tab or application</li>
            <li>Click <strong>"Start Session"</strong> and select the window/tab with your game</li>
            <li>Wait for the initial AI analysis to complete</li>
            <li>Follow the numbered move suggestions in priority order</li>
            <li>Click <strong>"Next Moves"</strong> after completing the current suggestions</li>
            <li>The AI will continuously prepare the next best moves for you</li>
          </ol>
          <div className="mt-4 bg-blue-900/30 border border-blue-600/50 rounded-md p-4">
            <p className="text-blue-200 text-sm font-semibold mb-2">💡 Alternative Solution</p>
            <p className="text-blue-100 text-sm">
              You can use your existing GitHub code which is already set up correctly! The code you shared uses React + TypeScript + Vite and will work perfectly in your local environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
