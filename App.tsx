import React, { useState, useEffect } from 'react';
import { SourceManager } from './components/SourceManager';
import { ChatArea } from './components/ChatArea';
import { AudioPlayer } from './components/AudioPlayer';
import { MindMapView } from './components/MindMapView';
import { AppState, Source, ChatMessage, ViewType } from './types';
import { streamChatResponse, generateAudioOverview } from './services/geminiService';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [state, setState] = useState<AppState>({
    sources: [],
    messages: [],
    isChatLoading: false,
    audioState: {
      isLoading: false,
      isPlaying: false,
      audioUrl: null,
      transcript: null,
      error: null
    }
  });

  const handleAddSource = (source: Source) => {
    setState(prev => ({
      ...prev,
      sources: [...prev.sources, source]
    }));
  };

  const handleRemoveSource = (id: string) => {
    setState(prev => ({
      ...prev,
      sources: prev.sources.filter(s => s.id !== id)
    }));
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isChatLoading: true
    }));

    try {
      const history = state.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      let fullResponse = "";
      const botMessageId = crypto.randomUUID();

      // Add placeholder bot message
      setState(prev => ({
          ...prev,
          messages: [...prev.messages, { id: botMessageId, role: 'model', text: '' }]
      }));

      await streamChatResponse(
        state.sources, 
        history, 
        text, 
        (chunk) => {
          fullResponse += chunk;
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(m => 
              m.id === botMessageId ? { ...m, text: fullResponse } : m
            )
          }));
        }
      );
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Sorry, I encountered an error while processing your request. Please ensure your API Key is valid and try again.",
        isError: true
      };
       setState(prev => ({
        ...prev,
        messages: [...prev.messages.filter(m => m.text !== ''), errorMessage]
      }));
    } finally {
      setState(prev => ({ ...prev, isChatLoading: false }));
    }
  };

  const handleGenerateAudio = async () => {
    setState(prev => ({
      ...prev,
      audioState: { ...prev.audioState, isLoading: true, error: null }
    }));

    try {
      const result = await generateAudioOverview(state.sources);
      setState(prev => ({
        ...prev,
        audioState: {
          isLoading: false,
          isPlaying: false,
          audioUrl: result.audioUrl,
          transcript: result.transcript,
          error: null
        }
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({
        ...prev,
        audioState: {
          ...prev.audioState,
          isLoading: false,
          error: "Failed to generate audio overview."
        }
      }));
    }
  };

  return (
    <div className="flex flex-col h-screen text-slate-800">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <BookOpen size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">NoteMinds</h1>
            </div>
            <div className="ml-auto flex items-center gap-4">
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200">Gemini 2.5 Flash</span>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
            <SourceManager 
                sources={state.sources}
                onAddSource={handleAddSource}
                onRemoveSource={handleRemoveSource}
                activeView={activeView}
                onViewChange={setActiveView}
            />
            
            <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
                {activeView === 'chat' ? (
                    <ChatArea 
                        messages={state.messages}
                        sources={state.sources}
                        onSendMessage={handleSendMessage}
                        isLoading={state.isChatLoading}
                        headerComponent={
                            state.sources.length > 0 ? (
                                <AudioPlayer 
                                    audioUrl={state.audioState.audioUrl}
                                    isLoading={state.audioState.isLoading}
                                    transcript={state.audioState.transcript}
                                    onGenerate={handleGenerateAudio}
                                    hasSources={state.sources.length > 0}
                                />
                            ) : undefined
                        }
                    />
                ) : (
                  <MindMapView sources={state.sources} />
                )}
            </div>
        </main>
    </div>
  );
};

export default App;
