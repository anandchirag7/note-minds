import React, { useState } from 'react';
import { Source, MindMapData } from '../types';
import { generateMindMap } from '../services/geminiService';
import { Loader2, Sparkles, Network, Info, X } from 'lucide-react';

interface MindMapViewProps {
  sources: Source[];
}

// Recursive node renderer for Horizontal Layout
const MindMapNode: React.FC<{ data: MindMapData; depth?: number }> = ({ data, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close popup when clicking outside or pressing X (handled by local state logic)
  // For this simple implementation, clicking the node toggles the state.

  return (
    <div className="flex items-center">
      <div className="relative group">
        {/* Node Card */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`
            relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-all text-left
            ${depth === 0 ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-100' : ''}
            ${depth === 1 ? 'bg-white border-indigo-200 text-indigo-900' : ''}
            ${depth > 1 ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200' : ''}
            hover:shadow-md hover:scale-[1.02] active:scale-95
            `}
        >
            <span className={`font-medium ${depth === 0 ? 'text-base' : 'text-sm'}`}>
                {data.label}
            </span>
            {depth > 0 && <Info size={14} className="opacity-40" />}
        </button>

        {/* Popup / Popover */}
        {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-800 text-sm">{data.label}</h4>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={14} />
                    </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    {data.description || "No description available."}
                </p>
                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-slate-100 transform rotate-45"></div>
            </div>
        )}
      </div>

      {/* Children & Connectors */}
      {data.children && data.children.length > 0 && (
        <div className="flex items-center">
            {/* Horizontal Stem from Parent */}
            <div className="w-8 h-px bg-slate-300"></div>

            {/* Vertical Spine Container */}
            <div className="flex flex-col relative">
                {/* 
                   We draw the vertical line using a border on a container, 
                   but we need to mask the top and bottom excess to create the "tree" look 
                   where the line stops at the first and last child.
                   
                   A simpler robust way for variable height children:
                   Render a vertical bar that spans everything, but use CSS to hide ends?
                   
                   Or simply: Each child has a left border and we align them.
                   
                   Let's use the individual 'bracket' approach:
                */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-300 my-auto h-[calc(100%-2.5rem)] translate-y-[1.25rem]"></div>
                
                {data.children.map((child, idx, arr) => (
                    <div key={idx} className="flex items-center relative py-3">
                         {/* 
                            Logic for vertical line connection:
                            The parent stem hits the vertical line.
                            Horizontal branches go right from vertical line.
                            
                            We need a vertical line segment that connects this child to the sibling "spine".
                            
                            The `absolute` div above tries to draw a single line. 
                            However, calculating height strictly in CSS is hard.
                            
                            Alternative Visual: Just use simple horizontal connectors and a vertical border.
                         */}
                         
                         {/* Connector from spine to child */}
                         <div className="w-6 h-px bg-slate-300 relative">
                             {/* Small dot at intersection for style */}
                             <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                         </div>
                         
                         <MindMapNode data={child} depth={depth + 1} />
                         
                         {/* 
                            Draw vertical line segments for specific nodes to form the tree?
                            Actually, the absolute bar approach:
                            `h-[calc(100%-some_offset)]` works if items are same height.
                            
                            Let's use the simplest CSS Tree Method:
                            A left border on the container of children? No, that looks like a block quote.
                            
                            Let's use the visual trick: 
                            A vertical border on the Wrapper of the children.
                         */}
                    </div>
                ))}
                
                {/* 
                    Patch: The vertical line needs to stop at the center of the first child 
                    and center of the last child. 
                    We can cover the excess line with white boxes if background is solid.
                */}
                <div className="absolute left-[-1px] top-0 h-1/2 w-1 bg-slate-50" style={{ height: '28px' }}></div>
                <div className="absolute left-[-1px] bottom-0 w-1 bg-slate-50" style={{ height: '28px' }}></div>
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
                 <h2 className="font-semibold text-slate-800">Mind Map Generator</h2>
                 <p className="text-xs text-slate-500">Visualize concepts from your sources</p>
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
      <div className="flex-1 overflow-auto p-8 relative bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
         {isLoading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
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

         {mindMapData && (
             <div className="min-w-max min-h-max p-12">
                 <MindMapNode data={mindMapData} />
             </div>
         )}
      </div>
    </div>
  );
};
