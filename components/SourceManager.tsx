import React, { useState, useRef, useEffect } from 'react';
import { Plus, FileText, Trash2, X, Upload, Loader2, MessageSquare, Network } from 'lucide-react';
import { Source, ViewType } from '../types';
import { SOURCE_COLORS } from '../constants';
import * as pdfjsLib from 'pdfjs-dist';

// Resolve the module export (handle esm.sh default export wrapping)
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;

interface SourceManagerProps {
  sources: Source[];
  onAddSource: (source: Source) => void;
  onRemoveSource: (id: string) => void;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const SourceManager: React.FC<SourceManagerProps> = ({ 
  sources, 
  onAddSource, 
  onRemoveSource,
  activeView,
  onViewChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [pastedText, setPastedText] = useState('');
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize PDF.js Worker using Blob URL to avoid CORS issues
  useEffect(() => {
    const loadWorker = async () => {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        try {
          // Use unpkg for a stable build file
          const workerUrl = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
          const response = await fetch(workerUrl);
          const workerScript = await response.text();
          const blob = new Blob([workerScript], { type: "text/javascript" });
          pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        } catch (error) {
          console.error("Failed to load PDF worker:", error);
        }
      }
    };
    loadWorker();
  }, []);

  const handleAddText = () => {
    if (!pastedText.trim() || !title.trim()) return;
    const newSource: Source = {
      id: crypto.randomUUID(),
      title,
      content: pastedText,
      type: 'text',
      color: SOURCE_COLORS[Math.floor(Math.random() * SOURCE_COLORS.length)],
    };
    onAddSource(newSource);
    resetModal();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      let text = '';

      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        
        // Pass cMapUrl and standardFontDataUrl to avoid network errors for fonts/maps
        const loadingTask = pdfjs.getDocument({ 
            data: arrayBuffer,
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
        });

        const pdf = await loadingTask.promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          text += pageText + '\n\n';
        }
      } else {
        text = await file.text();
      }

      if (!text.trim()) {
        alert("Could not extract text from this file.");
        setIsProcessing(false);
        return;
      }

      const newSource: Source = {
        id: crypto.randomUUID(),
        title: file.name,
        content: text,
        type: 'file',
        color: SOURCE_COLORS[Math.floor(Math.random() * SOURCE_COLORS.length)],
      };
      onAddSource(newSource);
      resetModal();
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process the file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setPastedText('');
    setTitle('');
    setIsModalOpen(false);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-80 shrink-0">
      
      {/* Navigation Options */}
      <div className="p-3 border-b border-slate-200 space-y-1">
        <button 
          onClick={() => onViewChange('chat')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'chat' ? 'bg-indigo-50 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <MessageSquare size={18} />
          Chat & Q&A
        </button>
        <button 
          onClick={() => onViewChange('mindmap')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'mindmap' ? 'bg-indigo-50 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Network size={18} />
          Mind Map
        </button>
      </div>

      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
        <h2 className="font-semibold text-slate-800">Sources</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
          title="Add Source"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sources.length === 0 && (
          <div className="text-center p-6 border-2 border-dashed border-slate-300 rounded-xl text-slate-500">
            <p className="text-sm">No sources yet.</p>
            <p className="text-xs mt-1">Add text or files to get started.</p>
          </div>
        )}
        {sources.map((source) => (
          <div key={source.id} className={`p-4 rounded-xl border ${source.color} relative group transition-all hover:shadow-sm`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 bg-white/50 rounded-lg shrink-0">
                    <FileText size={16} />
                </div>
                <h3 className="font-medium text-sm truncate" title={source.title}>{source.title}</h3>
              </div>
              <button 
                onClick={() => onRemoveSource(source.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-2 text-xs opacity-70 truncate">
               {source.type === 'file' ? 'File' : 'Text'} • {source.content.length} chars
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Add Source</h3>
              <button onClick={resetModal} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-2 flex gap-2 border-b border-slate-100 bg-slate-50">
                <button 
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'text' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Paste Text
                </button>
                <button 
                    onClick={() => setActiveTab('file')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'file' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Upload File
                </button>
            </div>

            <div className="p-6 overflow-y-auto">
                {activeTab === 'text' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Title</label>
                            <input 
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="My Document"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Content</label>
                            <textarea 
                                className="w-full h-48 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                placeholder="Paste your text here..."
                                value={pastedText}
                                onChange={e => setPastedText(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleAddText}
                            disabled={!title || !pastedText}
                            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                        >
                            Add Source
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12 relative">
                         {isProcessing ? (
                           <div className="flex flex-col items-center justify-center animate-pulse">
                              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                              <p className="text-slate-600 font-medium">Processing file...</p>
                           </div>
                         ) : (
                           <>
                              <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Upload size={24} />
                              </div>
                              <h4 className="text-slate-900 font-medium mb-1">Select a file</h4>
                              <p className="text-slate-500 text-sm mb-6">Supports .txt, .md, .json, .pdf</p>
                              <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors inline-block">
                                  Choose File
                                  <input 
                                      type="file" 
                                      className="hidden" 
                                      accept=".txt,.md,.json,.csv,.pdf"
                                      ref={fileInputRef}
                                      onChange={handleFileUpload}
                                  />
                              </label>
                           </>
                         )}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
