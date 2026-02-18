
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Download, Upload, Type, Move, Palette, Video, 
  Image as ImageIcon, Sliders, Check, Layers, Play, Square,
  Eye, EyeOff, Minus, Plus, Maximize2
} from 'lucide-react';
import { StoryElement, StoryFont, FilterState } from '../types.ts';

interface StoryDesignerProps {
  onClose: () => void;
  initialPhrase: string;
  initialHours: string;
  initialPhone: string;
}

const FONTS: { id: StoryFont; name: string; class: string }[] = [
  { id: 'font-strong', name: 'STRONG', class: 'font-strong' },
  { id: 'font-modern', name: 'MODERN', class: 'font-modern' },
  { id: 'font-serif', name: 'SERIF', class: 'font-serif' },
  { id: 'font-casual', name: 'CASUAL', class: 'font-casual' },
  { id: 'font-sans', name: 'CLASSIC', class: 'font-sans' },
];

const FILTERS = [
  { name: 'Normal', filter: 'none' },
  { name: 'Warm', filter: 'sepia(0.5) saturate(1.4)' },
  { name: 'Cool', filter: 'hue-rotate(180deg) saturate(1.2)' },
  { name: 'Vivid', filter: 'saturate(2) contrast(1.1)' },
  { name: 'B&W', filter: 'grayscale(1) contrast(1.2)' },
  { name: 'Dreamy', filter: 'blur(2px) brightness(1.1) saturate(1.3)' },
];

const StoryDesigner: React.FC<StoryDesignerProps> = ({ onClose, initialPhrase, initialHours, initialPhone }) => {
  const [background, setBackground] = useState<string | null>(null);
  const [bgType, setBgType] = useState<'image' | 'video' | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterState>({ name: 'Normal', filter: 'none', intensity: 100 });
  const [elements, setElements] = useState<StoryElement[]>([
    { id: 'phrase', text: initialPhrase, visible: true, x: 50, y: 30, size: 50, color: '#FFFFFF', font: 'font-strong', hasBackground: true, bgOpacity: 0.8, bgColor: '#000000' },
    { id: 'hours', text: initialHours, visible: true, x: 50, y: 75, size: 22, color: '#FFFFFF', font: 'font-sans', hasBackground: false, bgOpacity: 0.5, bgColor: '#000000' },
    { id: 'phone', text: initialPhone, visible: true, x: 50, y: 82, size: 22, color: '#FFFFFF', font: 'font-sans', hasBackground: false, bgOpacity: 0.5, bgColor: '#000000' },
  ]);
  const [selectedId, setSelectedId] = useState<'phrase' | 'hours' | 'phone' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'filter' | 'media'>('media');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>();

  const selectedElement = elements.find(e => e.id === selectedId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBgType(file.type.startsWith('video/') ? 'video' : 'image');
    setBackground(url);
    setActiveTab('filter');
  };

  const updateElement = (id: string, updates: Partial<StoryElement>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (background) {
      ctx.save();
      // Apply Filter Intensity
      if (activeFilter.name !== 'Normal') {
        ctx.filter = `${activeFilter.filter} opacity(${activeFilter.intensity}%)`;
      }
      
      if (bgType === 'image') {
        const img = new Image();
        img.src = background;
        if (img.complete) {
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width / 2) - (img.width / 2) * scale;
          const y = (canvas.height / 2) - (img.height / 2) * scale;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
      } else if (bgType === 'video' && videoRef.current) {
        const v = videoRef.current;
        const scale = Math.max(canvas.width / v.videoWidth, canvas.height / v.videoHeight);
        const x = (canvas.width / 2) - (v.videoWidth / 2) * scale;
        const y = (canvas.height / 2) - (v.videoHeight / 2) * scale;
        ctx.drawImage(v, x, y, v.videoWidth * scale, v.videoHeight * scale);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    elements.forEach(el => {
      if (!el.visible) return;
      ctx.save();
      
      let fontName = 'sans-serif';
      if (el.font === 'font-strong') fontName = 'Bebas Neue';
      if (el.font === 'font-modern') fontName = 'Outfit';
      if (el.font === 'font-serif') fontName = 'Playfair Display';
      if (el.font === 'font-casual') fontName = 'Damion';

      ctx.font = `bold ${el.size * 2}px "${fontName}", sans-serif`;
      const metrics = ctx.measureText(el.text);
      const textWidth = metrics.width;
      const textHeight = el.size * 2;
      const posX = (el.x / 100) * canvas.width;
      const posY = (el.y / 100) * canvas.height;

      // Draw Background Box
      if (el.hasBackground) {
        ctx.fillStyle = el.bgColor;
        ctx.globalAlpha = el.bgOpacity;
        const padding = el.size * 0.6;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = textHeight * 1.2;
        ctx.beginPath();
        ctx.roundRect(posX - boxWidth / 2, posY - boxHeight / 2, boxWidth, boxHeight, 15);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.fillStyle = el.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (!el.hasBackground) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      ctx.fillText(el.text, posX, posY);
      ctx.restore();
    });

    requestRef.current = requestAnimationFrame(draw);
  }, [background, elements, activeFilter, bgType]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [draw]);

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `insta-story-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      setIsExporting(false);
    }, 100);
  };

  const exportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;
    
    setIsRecording(true);
    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', bitsPerSecond: 8000000 });
    const chunks: Blob[] = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `insta-story-${Date.now()}.mp4`;
      link.click();
      setIsRecording(false);
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 8000); // 8 second capture
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!selectedId) return;
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    updateElement(selectedId, { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300 select-none">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-20">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
          <X size={24} />
        </button>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab('text')} 
             className={`p-2 rounded-full transition-all ${activeTab === 'text' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
           >
             <Type size={20} />
           </button>
           <button 
             onClick={() => setActiveTab('filter')} 
             className={`p-2 rounded-full transition-all ${activeTab === 'filter' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
           >
             <Maximize2 size={20} />
           </button>
           <button 
             onClick={() => setActiveTab('media')} 
             className={`p-2 rounded-full transition-all ${activeTab === 'media' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
           >
             <ImageIcon size={20} />
           </button>
        </div>

        <button 
          onClick={bgType === 'video' ? exportVideo : exportImage}
          disabled={isExporting || isRecording}
          className="px-5 py-2 bg-white text-black rounded-full font-black text-xs shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isRecording ? 'RECORDING...' : 'SAVE'}
        </button>
      </div>

      {/* Editor Canvas */}
      <div 
        className="relative aspect-[9/16] h-[70vh] max-h-[750px] shadow-2xl rounded-[40px] overflow-hidden border border-white/10"
        onTouchMove={handleTouchMove}
      >
        <canvas 
          ref={canvasRef} 
          width={1080} 
          height={1920} 
          className="w-full h-full object-contain"
          onMouseDown={() => setSelectedId(null)}
        />
        {bgType === 'video' && background && (
          <video ref={videoRef} src={background} className="hidden" autoPlay loop muted playsInline />
        )}
        
        {/* Visual Cues for Dragging */}
        <div className="absolute inset-0 pointer-events-none">
           {elements.map(el => el.visible && (
             <div 
               key={el.id}
               className={`absolute pointer-events-auto cursor-move transition-all ${selectedId === el.id ? 'ring-2 ring-white ring-offset-4 ring-offset-transparent' : ''}`}
               style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)', width: '80%', height: '10%' }}
               onMouseDown={(e) => { e.stopPropagation(); setSelectedId(el.id); setActiveTab('text'); }}
               onTouchStart={(e) => { e.stopPropagation(); setSelectedId(el.id); setActiveTab('text'); }}
             />
           ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full max-w-md p-6 pb-12 flex flex-col gap-6">
        
        {activeTab === 'media' && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-full py-8 border-2 border-dashed border-white/20 rounded-[32px] flex flex-col items-center gap-3 text-white/40 hover:text-white hover:border-white/40 transition-all bg-white/5"
             >
               <Upload size={32} />
               <span className="text-sm font-black tracking-widest uppercase">Select Photo or Video</span>
             </button>
             <div className="flex items-center gap-2">
                {elements.map(el => (
                  <button 
                    key={el.id}
                    onClick={() => updateElement(el.id, { visible: !el.visible })}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${el.visible ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
                  >
                    {el.visible ? <Eye size={14} /> : <EyeOff size={14} />} {el.id.toUpperCase()}
                  </button>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'filter' && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4">
             <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {FILTERS.map(f => (
                  <button 
                    key={f.name}
                    onClick={() => setActiveFilter({ ...activeFilter, name: f.name, filter: f.filter })}
                    className={`shrink-0 flex flex-col items-center gap-2 transition-all ${activeFilter.name === f.name ? 'scale-110' : 'opacity-40'}`}
                  >
                    <div className="w-16 h-16 rounded-2xl border-2 border-white/10 overflow-hidden bg-slate-800">
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500" style={{ filter: f.filter }} />
                    </div>
                    <span className="text-[10px] font-black text-white">{f.name.toUpperCase()}</span>
                  </button>
                ))}
             </div>
             {activeFilter.name !== 'Normal' && (
               <div className="flex flex-col gap-2">
                 <div className="flex justify-between text-[10px] font-black text-white/40 uppercase">
                    <span>Filter Intensity</span>
                    <span>{activeFilter.intensity}%</span>
                 </div>
                 <input 
                   type="range" min="0" max="100" 
                   value={activeFilter.intensity} 
                   onChange={(e) => setActiveFilter({ ...activeFilter, intensity: parseInt(e.target.value) })}
                   className="accent-white"
                 />
               </div>
             )}
          </div>
        )}

        {activeTab === 'text' && selectedElement && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-4 bg-white/10 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10">
             <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {FONTS.map(f => (
                    <button 
                      key={f.id}
                      onClick={() => updateElement(selectedId!, { font: f.id })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${selectedElement.font === f.id ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
                    >
                      {f.name[0]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                   {['#FFFFFF', '#000000', '#FFEB94', '#FFCCAC', '#C1E1DC'].map(c => (
                     <button 
                       key={c}
                       onClick={() => updateElement(selectedId!, { color: c })}
                       className={`w-6 h-6 rounded-full border-2 ${selectedElement.color === c ? 'border-white' : 'border-transparent'}`}
                       style={{ backgroundColor: c }}
                     />
                   ))}
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase">
                   <span>Size</span>
                   <div className="flex gap-3">
                      <button onClick={() => updateElement(selectedId!, { size: Math.max(10, selectedElement.size - 5) })} className="p-1"><Minus size={14}/></button>
                      <span>{selectedElement.size}</span>
                      <button onClick={() => updateElement(selectedId!, { size: Math.min(150, selectedElement.size + 5) })} className="p-1"><Plus size={14}/></button>
                   </div>
                </div>
                <input type="range" min="10" max="150" value={selectedElement.size} onChange={(e) => updateElement(selectedId!, { size: parseInt(e.target.value) })} />
             </div>

             <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <button 
                  onClick={() => updateElement(selectedId!, { hasBackground: !selectedElement.hasBackground })}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedElement.hasBackground ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
                >
                  BACKGROUND BOX
                </button>
                {selectedElement.hasBackground && (
                  <div className="flex gap-4 items-center">
                    <span className="text-[10px] font-black text-white/40">OPACITY</span>
                    <input type="range" min="0" max="1" step="0.1" value={selectedElement.bgOpacity} onChange={(e) => updateElement(selectedId!, { bgOpacity: parseFloat(e.target.value) })} className="w-20" />
                  </div>
                )}
             </div>
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
      </div>
    </div>
  );
};

export default StoryDesigner;
