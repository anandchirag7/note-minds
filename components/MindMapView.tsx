import React, { useState, useRef, useEffect } from 'react';
import { Source, MindMapData } from '../types';
import { generateMindMap } from '../services/geminiService';
import { Loader2, Sparkles, Network, Info, X, ZoomIn, ZoomOut, Maximize, ChevronRight, ChevronDown, Minus, Plus } from 'lucide-react';

interface MindMapViewProps {
  sources: Source[];
}

// Decomposition Tree Node Component
const MindMapNode: React.FC<{ 
  data: MindMapData; 
  depth?: number; 
  isRoot?: boolean;
}> = ({ data, depth = 0, isRoot }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Close info popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };
    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  const hasChildren = data.children && data.children.length > 0;

  return (
    <div className="flex items-center">
        
      {/* NODE CARD */}
      <div className="relative flex items-center" ref={nodeRef}>
        <div 
            className={`
            relative z-10 flex flex-col justify-center px-4 py-3 rounded-xl border shadow-sm transition-all select-none
            ${isRoot 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-200 shadow-lg min-w-[180px]' 
                : 'bg-white hover:border-indigo-300 hover:shadow-md min-w-[160px] max-w-[240px]'
            }
            ${depth === 1 && !isRoot ? 'border-indigo-100 text-indigo-900' : ''}
            ${depth > 1 ? 'border-slate-200 text-slate-700' : ''}
            `}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={`font-semibold text-sm ${isRoot ? 'text-base' : ''} leading-tight`}>
                    {data.label}
                </span>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                    className={`shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors ${isRoot ? 'text-indigo-100' : 'text-slate-400'}`}
                >
                    <Info size={14} />
                </button>
            </div>
        </div>

        {/* Info Popup */}
        {showInfo && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200/60 p-5 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{data.label}</h4>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowInfo(false); }}
                        className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {data.description || "No specific details available."}
                </p>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-200/60 transform rotate-45"></div>
            </div>
        )}

        {/* Expand/Collapse Toggle Button (Right side of card) */}
        {hasChildren && (
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center border z-20 transition-colors
                    ${isExpanded 
                        ? 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700' 
                        : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                    }
                `}
            >
                {isExpanded ? <Minus size={12} /> : <Plus size={12} />}
            </button>
        )}
      </div>

      {/* CHILDREN SECTION */}
      {hasChildren && isExpanded && (
        <div className="flex items-center">
             {/* 
                Horizontal Line from Parent to Spine 
                Length: 32px (w-8)
             */}
             <div className="w-8 h-px bg-slate-300"></div>
             
             {/* Children Column */}
             <div className="flex flex-col">
                {data.children!.map((child, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === data.children!.length - 1;
                    const isOnly = data.children!.length === 1;

                    return (
                        <div key={idx} className="flex">
                            {/* 
                                Connector Block (Left of Child) 
                                - Width: 20px
                                - Contains the "Spine" (Vertical) and "Branch" (Horizontal)
                            */}
                            <div className="w-6 relative shrink-0">
                                {/* Horizontal Line to Child (Centered vertically in this row) */}
                                <div className="absolute top-1/2 right-0 w-3 h-px bg-slate-300"></div>

                                {/* Vertical Spine Logic */}
                                {!isOnly && (
                                    <>
                                        {/* Upper Half Line: For everyone except First child */}
                                        {!isFirst && (
                                            <div className="absolute top-0 left-0 w-px h-1/2 bg-slate-300"></div>
                                        )}
                                        {/* Lower Half Line: For everyone except Last child */}
                                        {!isLast && (
                                            <div className="absolute top-1/2 left-0 w-px h-1/2 bg-slate-300"></div>
                                        )}
                                        
                                        {/* Corner Curves for smooth Decomposition Tree look */}
                                        {/* If first, curve from Bottom to Right */}
                                        {isFirst && (
                                            <div className="absolute top-1/2 left-0 w-3 h-3 border-t border-l border-slate-300 rounded-tl-xl"></div>
                                        )}
                                        {/* If last, curve from Top to Right */}
                                        {isLast && (
                                            <div className="absolute top-1/2 left-0 w-3 h-px bg-slate-300"></div> // Flat line for last? Or curve?
                                            // Actually standard decomp trees often use square corners or small curves.
                                            // Let's do the curve:
                                        )}
                                        {isLast && (
                                             <div className="absolute bottom-1/2 left-0 w-3 h-3 border-b border-l border-slate-300 rounded-bl-xl"></div>
                                        )}
                                        
                                        {/* For middle nodes, we need the horizontal connection to the spine */}
                                        {!isFirst && !isLast && (
                                             <div className="absolute top-1/2 left-0 w-3 h-px bg-slate-300"></div>
                                        )}
                                    </>
                                )}
                                {isOnly && (
                                    <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300"></div>
                                )}
                            </div>

                            {/* Recursive Child Node */}
                            <MindMapNode 
                                data={child} 
                                depth={depth + 1} 
                            />
                        </div>
                    );
                })}
             </div>
        </div>
      )}
    </div>
  );
};

export const MindMapView: React.FC<MindMapViewProps> = ({ sources }) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!selectedSourceId) return;
    
    // Find content
    let contentToAnalyze = '';
    if (selectedSourceId === 'all') {
      contentToAnalyze = sources.map(s => s.content).join('\n\n');
    } else {
      const source = sources.find(s => s.id === selectedSourceId);
      if (source) contentToAnalyze = source.content;
    }

    if (!contentToAnalyze.trim()) return;

    setIsLoading(true);
    setError(null);
    setMindMapData(null);
    setZoom(1);

    try {
      const data = await generateMindMap(contentToAnalyze);
      setMindMapData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate mind map. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sources.length === 0) {
     return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
             <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Network className="text-slate-400" size={32} />
              </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No sources available</h3>
            <p>Add a source to generate a mind map.</p>
        </div>
     )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 bg-white border-b border-slate-200 shadow-sm z-20 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                 <Network size={20} />
             </div>
             <div>
                 <h2 className="font-semibold text-slate-800">Decomposition Tree</h2>
                 <p className="text-xs text-slate-500">Hierarchical breakdown of concepts</p>
             </div>
         </div>

         <div className="flex items-center gap-2 w-full md:w-auto">
             <select 
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="flex-1 md:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
             >
                 <option value="" disabled>Select a source...</option>
                 <option value="all">All Sources (Combined)</option>
                 {sources.map(s => (
                     <option key={s.id} value={s.id}>{s.title}</option>
                 ))}
             </select>
             <button 
                onClick={handleGenerate}
                disabled={!selectedSourceId || isLoading}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
             >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate
             </button>
         </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-8 relative bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] cursor-grab active:cursor-grabbing"
      >
         {isLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-30">
                 <Loader2 size={40} className="text-primary animate-spin mb-4" />
                 <p className="text-slate-600 font-medium">Analyzing content and structuring ideas...</p>
             </div>
         )}
         
         {error && (
             <div className="flex flex-col items-center justify-center h-full text-red-500">
                 <p>{error}</p>
             </div>
         )}

         {!mindMapData && !isLoading && !error && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                 <Network size={64} className="mb-4 opacity-20" />
                 <p>Select a source and click Generate to see the visualization.</p>
             </div>
         )}

         {/* Zoom Controls */}
         {mindMapData && (
             <div className="absolute bottom-8 right-8 flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-slate-100 p-1 z-30">
                 <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                     <ZoomIn size={20} />
                 </button>
                 <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                     <ZoomOut size={20} />
                 </button>
                 <button onClick={() => setZoom(1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600" title="Reset">
                     <Maximize size={20} />
                 </button>
             </div>
         )}

         {mindMapData && (
             <div 
                className="min-w-max min-h-max p-20 flex items-center justify-center transition-transform origin-top-left ease-out duration-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
             >
                 <MindMapNode data={mindMapData} isRoot={true} />
             </div>
         )}
      </div>
    </div>
  );
};
