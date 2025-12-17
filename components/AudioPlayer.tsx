import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Loader2, Headphones } from 'lucide-react';
import { playRawAudio } from '../services/geminiService';

interface AudioPlayerProps {
  audioUrl: string | null;
  isLoading: boolean;
  transcript: string | null;
  onGenerate: () => void;
  hasSources: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  isLoading, 
  transcript, 
  onGenerate,
  hasSources
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
      if (audioContextRef.current) {
         audioContextRef.current.close();
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!audioUrl) return;
    
    // Initialize AudioContext on user gesture
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }

    if (isPlaying) {
      // Stop
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
      setIsPlaying(false);
    } else {
      // Play
      try {
        setIsPlaying(true);
        // Fetch raw data from the blob URL
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const source = await playRawAudio(arrayBuffer, audioContextRef.current);
        sourceRef.current = source;
        
        source.onended = () => setIsPlaying(false);
      } catch (err) {
        console.error("Audio playback failed", err);
        setIsPlaying(false);
      }
    }
  };

  if (!hasSources) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-primary rounded-lg">
                <Headphones size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">Audio Overview</h3>
                <p className="text-sm text-slate-500">Deep Dive Podcast</p>
            </div>
        </div>
        
        {isLoading ? (
            <div className="flex items-center gap-2 text-primary bg-indigo-50 px-4 py-2 rounded-full">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm font-medium">Generating...</span>
            </div>
        ) : !audioUrl ? (
            <button 
                onClick={onGenerate}
                className="text-sm bg-primary text-white px-4 py-2 rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
                Generate
            </button>
        ) : (
            <button 
                onClick={handlePlay}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition-all ${
                    isPlaying 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
            >
                {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                <span>{isPlaying ? 'Stop' : 'Play'}</span>
            </button>
        )}
      </div>

      {/* Transcript / Placeholder */}
      <div className="relative mt-4">
        {transcript ? (
             <div className="text-sm text-slate-600 max-h-32 overflow-y-auto pr-2 custom-scrollbar italic leading-relaxed">
                "{transcript.substring(0, 300)}..."
                <span className="text-xs text-slate-400 block mt-1">(Transcript snippet)</span>
             </div>
        ) : (
            <div className="h-12 bg-slate-50 rounded-lg flex items-center justify-center text-xs text-slate-400">
                Generate an audio overview to listen to a conversation about your sources.
            </div>
        )}
      </div>
    </div>
  );
};
