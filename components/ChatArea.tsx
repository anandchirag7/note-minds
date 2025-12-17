import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Source } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  sources: Source[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, sources, onSendMessage, isLoading }) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  if (sources.length === 0) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Start by adding sources</h3>
              <p className="max-w-md">Upload text files or paste content to create your personalized notebook assistant.</p>
          </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && (
            <div className="mt-12 text-center space-y-4">
                <div className="inline-block p-3 bg-indigo-50 text-primary rounded-2xl mb-2">
                    <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">What would you like to know?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {['Summarize the key points', 'What are the main arguments?', 'List any dates mentions', 'Explain the conclusion'].map((suggestion) => (
                        <button 
                            key={suggestion}
                            onClick={() => onSendMessage(suggestion)}
                            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 text-left transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
             {msg.role === 'model' && (
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                     <Bot size={16} className="text-primary" />
                 </div>
             )}
             
             <div className={`flex-1 overflow-hidden ${msg.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%]' : ''}`}>
                {msg.isError ? (
                     <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg">
                        <AlertCircle size={16} />
                        <p>{msg.text}</p>
                     </div>
                ) : (
                    <div className={`prose prose-sm prose-slate max-w-none ${msg.role === 'user' ? 'text-right' : ''}`}>
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                )}
             </div>

             {msg.role === 'user' && (
                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                     <User size={16} className="text-slate-500" />
                 </div>
             )}
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-4 max-w-3xl mx-auto">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                     <Bot size={16} className="text-primary" />
                 </div>
                 <div className="flex items-center gap-1.5 p-4">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your sources..."
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:bg-slate-300 hover:bg-primary/90 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">
                Gemini can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
