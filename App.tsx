
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getSolitaireMove } from './services/geminiService';
import Header from './components/Header';
import Controls from './components/Controls';
import SuggestionBox from './components/SuggestionBox';
import ScreenCapture from './components/ScreenCapture';
import { Gamepad2 } from 'lucide-react';

const App: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [nextSuggestions, setNextSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialAnalysis, setIsInitialAnalysis] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastSuggestion, setLastSuggestion] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureFrame = useCallback((): string | null => {
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
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

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
    };

    try {
      const rawSuggestion = await getSolitaireMove(imageBase64, '');
      if (rawSuggestion && rawSuggestion.toLowerCase() !== "no moves available.") {
        const moves = rawSuggestion.split('\n').filter(move => move.trim().length > 0);
        setCurrentSuggestions(moves);
        setLastSuggestion(rawSuggestion);
        // Immediately start preparing the next move
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
      // Loading is handled by prepareNextSuggestions
    }
  }, [captureFrame, handleStopSession, prepareNextSuggestions]);

  const handleNextMoves = () => {
    if (nextSuggestions.length > 0) {
      setCurrentSuggestions(nextSuggestions);
      setLastSuggestion(nextSuggestions.join('\n'));
      setNextSuggestions([]);
      // Start preparing the next set immediately
      prepareNextSuggestions();
    }
  };

  const handleStartSession = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false,
      });
      setStream(displayStream);
      setIsSessionActive(true);
      setError(null);
      setCurrentSuggestions([]);
      setNextSuggestions([]);
      displayStream.getVideoTracks()[0].addEventListener('ended', handleStopSession);
    } catch (err) {
      console.error('Error starting screen share:', err);
      setError('Could not start screen sharing. Please grant permission and try again.');
      setIsSessionActive(false);
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
        // Start the analysis chain
        runInitialAnalysis();
      };

      videoElement.addEventListener('loadedmetadata', onMetadataLoaded);

      return () => {
        videoElement.removeEventListener('loadedmetadata', onMetadataLoaded);
      };
    }
  }, [isSessionActive, stream, runInitialAnalysis]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="w-full max-w-5xl mx-auto">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-6">
            <Controls
              isSessionActive={isSessionActive}
              onStart={handleStartSession}
              onStop={handleStopSession}
            />
            <SuggestionBox
              currentSuggestions={currentSuggestions}
              isLoading={isLoading}
              isInitialAnalysis={isInitialAnalysis}
              hasNextMoves={nextSuggestions.length > 0}
              onNextMoves={handleNextMoves}
              error={error}
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-indigo-400 mb-4">Live Screen Preview</h2>
            {isSessionActive ? (
              <ScreenCapture ref={videoRef} />
            ) : (
              <div className="aspect-video w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center">
                <Gamepad2 className="w-16 h-16 text-gray-500 mb-4" />
                <p className="text-gray-400">Your game preview will appear here</p>
                <p className="text-sm text-gray-500">Start a session to begin</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
