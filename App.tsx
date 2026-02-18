
import React, { useState, useEffect, useRef } from 'react';
import { 
  Languages, 
  Clock, 
  Phone, 
  Hash, 
  Plus, 
  Trash2, 
  ClipboardCheck,
  Image as ImageIcon,
  Type as TypeIcon,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Instagram
} from 'lucide-react';
import { COLORS, DEFAULT_HASHTAGS, PHONE_NUMBER } from './constants.tsx';
import { Hashtag, GeneratedContent } from './types.ts';
import { translateAndGenerateCaption } from './services/geminiService.ts';
import CopyButton from './components/CopyButton.tsx';

const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
  <div className="flex items-center gap-3 mb-4 px-1">
    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: color + '50' }}>
      <Icon size={22} style={{ color: '#2D3436' }} />
    </div>
    <h2 className="text-lg font-black text-slate-800 tracking-tight">{title}</h2>
  </div>
);

const App: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  
  const [hashtags, setHashtags] = useState<Hashtag[]>(() => {
    const stored = localStorage.getItem('insta-hashtags');
    return stored ? JSON.parse(stored) : DEFAULT_HASHTAGS.map(tag => ({ id: Math.random().toString(), tag, selected: false }));
  });

  const [newTag, setNewTag] = useState("");
  const [hours, setHours] = useState({ 
    open: "12", 
    openPeriod: "PM", 
    close: "6:30", 
    closePeriod: "PM" 
  });
  
  const [editablePhone, setEditablePhone] = useState(PHONE_NUMBER);
  const [isHashtagsExpanded, setIsHashtagsExpanded] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('insta-hashtags', JSON.stringify(hashtags));
  }, [hashtags]);

  const handleTranslate = async () => {
    if (!prompt.trim()) return;
    setIsTranslating(true);
    const data = await translateAndGenerateCaption(prompt);
    setResult(data);
    setIsTranslating(false);
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const toggleTag = (id: string) => {
    setHashtags(hashtags.map(h => h.id === id ? { ...h, selected: !h.selected } : h));
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const cleanTag = newTag.replace('#', '').trim();
    if (hashtags.some(h => h.tag.toLowerCase() === cleanTag.toLowerCase())) {
        setNewTag("");
        return;
    }
    const tag: Hashtag = { id: Date.now().toString(), tag: cleanTag, selected: true };
    setHashtags([tag, ...hashtags]);
    setNewTag("");
  };

  const removeTag = (id: string) => {
    setHashtags(hashtags.filter(h => h.id !== id));
  };

  const formatHoursString = () => {
    return `We're open from ${hours.open} ${hours.openPeriod} to ${hours.close} ${hours.closePeriod} today.`;
  };

  const togglePeriod = (target: 'open' | 'close') => {
    const key = target === 'open' ? 'openPeriod' : 'closePeriod';
    setHours(prev => ({
      ...prev,
      [key]: prev[key] === 'AM' ? 'PM' : 'AM'
    }));
  };

  const selectedTagsString = hashtags
    .filter(h => h.selected)
    .map(h => `#${h.tag}`)
    .join(' ');

  const fullOverview = result ? `
【${result.imagePhrase}】
${result.caption}

📞 ${editablePhone}
⏰ ${formatHoursString()}

${selectedTagsString}
  `.trim() : "";

  return (
    <div className="min-h-screen pb-12 flex flex-col items-center">
      <header className="sticky top-0 z-50 w-full glass-nav px-6 py-5 flex flex-col items-center justify-center text-center shadow-sm">
        <h1 className="text-4xl sm:text-5xl font-londrina-shadow text-slate-900 leading-tight">
          InstaPrep Studio
        </h1>
        <p className="text-lg sm:text-xl font-caveat text-[#FFCCAC] font-bold">
          Create Once. Post Everywhere.
        </p>
      </header>

      <main className="w-full max-w-2xl px-5 py-8 flex flex-col gap-10">
        
        <section className="card-ios p-7 sm:p-9 flex flex-col gap-7 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-48 h-48 bg-[#FDD475] opacity-[0.15] rounded-full blur-3xl pointer-events-none"></div>
          
          <SectionHeader icon={Languages} title="投稿文を自動作成" color={COLORS.BABY_BLUE} />
          
          <div className="relative group">
            <textarea
              className="w-full p-6 bg-white/50 border-2 border-slate-100 rounded-[32px] focus:bg-white focus:border-[#C1E1DC] focus:outline-none min-h-[160px] text-slate-700 text-lg font-medium leading-relaxed placeholder:text-slate-400 resize-none transition-all shadow-sm group-hover:shadow-md"
              placeholder="投稿したい内容を日本語で入力してください..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            onClick={handleTranslate}
            disabled={isTranslating || !prompt.trim()}
            className="w-full py-6 rounded-[28px] text-white font-black text-xl btn-bounce shadow-2xl shadow-yellow-400/30 flex items-center justify-center gap-3 transition-all disabled:opacity-40 border-b-[6px] border-amber-600 active:border-b-0 active:translate-y-1"
            style={{ backgroundColor: COLORS.BUTTERSCOTCH }}
          >
            {isTranslating ? (
              <div className="animate-spin rounded-full h-7 w-7 border-4 border-white border-t-transparent" />
            ) : (
              <><Sparkles size={24} fill="currentColor" /><span>AIで文章を生成する</span></>
            )}
          </button>
          
          {result && (
            <div ref={resultRef} className="flex flex-col gap-8 mt-4 pt-10 border-t-2 border-dashed border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="bg-white/90 border-2 border-[#FFCCAC]/20 rounded-[32px] p-7 flex flex-col gap-5 shadow-sm relative group">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-[#FFCCAC] text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                   Image Text
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                     <ImageIcon size={14} /> Phrase
                  </div>
                  <CopyButton text={result.imagePhrase} baseColor="#FFCCAC" />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-3">
                    {result.imagePhrase}
                  </p>
                  <p className="text-sm font-bold text-slate-400/80 select-none italic bg-slate-50 px-4 py-2 rounded-xl inline-block border border-slate-100">
                    {result.imagePhrase_jp}
                  </p>
                </div>
              </div>

              <div className="bg-white/90 border-2 border-[#C1E1DC]/20 rounded-[32px] p-7 flex flex-col gap-5 shadow-sm relative group">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-[#C1E1DC] text-[#4E8D85] text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                   Caption Body
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                     <TypeIcon size={14} /> English
                  </div>
                  <CopyButton text={result.caption} baseColor="#C1E1DC" textColor="#4E8D85" />
                </div>
                <div className="flex flex-col gap-6">
                  <p className="text-[17px] leading-relaxed text-slate-700 font-semibold whitespace-pre-wrap">
                    {result.caption}
                  </p>
                  <div className="bg-[#F8F9FA] p-6 rounded-2xl select-none border border-slate-100 relative">
                    <span className="absolute -top-2.5 right-6 px-2 py-0.5 bg-slate-200 text-slate-500 text-[9px] font-black rounded uppercase">Translation</span>
                    <p className="text-[14px] leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">
                      {result.caption_jp}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch">
          <section className="card-ios p-7 flex flex-col h-full">
            <SectionHeader icon={Clock} title="営業時間" color={COLORS.BUTTERSCOTCH} />
            <div className="flex flex-col flex-grow gap-5 justify-between">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/70 rounded-2xl p-4 flex flex-col gap-1 ring-1 ring-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open</span>
                  <div className="flex items-center gap-2">
                    <input type="text" value={hours.open} onChange={e => setHours({...hours, open: e.target.value})} className="bg-transparent font-black text-slate-800 outline-none text-base w-full" />
                    <button onClick={() => togglePeriod('open')} className="shrink-0 bg-slate-100 hover:bg-slate-200 text-[10px] font-black px-2.5 py-1.5 rounded-lg text-slate-600 transition-colors uppercase">{hours.openPeriod}</button>
                  </div>
                </div>
                <div className="bg-white/70 rounded-2xl p-4 flex flex-col gap-1 ring-1 ring-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Close</span>
                  <div className="flex items-center gap-2">
                    <input type="text" value={hours.close} onChange={e => setHours({...hours, close: e.target.value})} className="bg-transparent font-black text-slate-800 outline-none text-base w-full" />
                    <button onClick={() => togglePeriod('close')} className="shrink-0 bg-slate-100 hover:bg-slate-200 text-[10px] font-black px-2.5 py-1.5 rounded-lg text-slate-600 transition-colors uppercase">{hours.closePeriod}</button>
                  </div>
                </div>
              </div>
              <CopyButton text={formatHoursString()} className="w-full !py-4" label="営業時間をコピー" baseColor={COLORS.BUTTERSCOTCH} />
            </div>
          </section>

          <section className="card-ios p-7 flex flex-col h-full">
            <SectionHeader icon={Phone} title="連絡先" color="#FF8A65" />
            <div className="flex flex-col flex-grow gap-5 justify-between">
              <div className="bg-white/70 rounded-2xl p-5 flex flex-col gap-1 ring-1 ring-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</span>
                <input 
                  type="text" 
                  value={editablePhone} 
                  onChange={e => setEditablePhone(e.target.value)}
                  className="bg-transparent font-mono font-black text-slate-800 leading-none py-1.5 outline-none text-xl w-full" 
                />
              </div>
              <CopyButton text={editablePhone} className="w-full !py-4" label="電話番号をコピー" baseColor="#FF8A65" textColor="#FFFFFF" />
            </div>
          </section>
        </div>

        <section className="card-ios overflow-hidden">
          <button 
            onClick={() => setIsHashtagsExpanded(!isHashtagsExpanded)}
            className="w-full p-7 flex items-center justify-between focus:outline-none bg-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: COLORS.BABY_BLUE + '60' }}>
                <Hash size={22} style={{ color: '#2D3436' }} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">ハッシュタグ管理</h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{hashtags.filter(h => h.selected).length} Selected</p>
              </div>
            </div>
            {isHashtagsExpanded ? <ChevronUp size={24} className="text-slate-400" /> : <ChevronDown size={24} className="text-slate-400" />}
          </button>
          
          <div className={`collapsible-content ${isHashtagsExpanded ? 'expanded' : ''}`}>
            <div className="p-7 pt-2 flex flex-col gap-7">
              <div className="flex items-center gap-3 bg-white/60 p-2.5 rounded-2xl border-2 border-slate-100 shadow-sm focus-within:border-[#C1E1DC] transition-all">
                <input 
                  type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                  placeholder="タグを入力..." className="bg-transparent border-none px-4 py-2 text-sm w-full outline-none font-bold placeholder:text-slate-300"
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                />
                <button onClick={addTag} className="w-11 h-11 rounded-xl text-white btn-bounce shadow-md flex items-center justify-center shrink-0 bg-[#4ADE80] border-b-4 border-green-600 active:border-b-0"><Plus size={22} /></button>
              </div>
              
              <div className="flex flex-wrap gap-3 max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                {hashtags.map(h => (
                  <button 
                    key={h.id} onClick={() => toggleTag(h.id)}
                    className={`group flex items-center gap-2.5 pl-5 pr-4 py-3.5 rounded-2xl text-[12px] font-black transition-all border-b-4 relative overflow-hidden ${h.selected ? 'bg-white border-[#C1E1DC] text-[#4E8D85] translate-y-[1px]' : 'bg-slate-50 border-transparent text-slate-400'}`}
                  >
                    {h.selected && <div className="absolute left-0 top-0 w-1.5 h-full bg-[#C1E1DC]"></div>}
                    <Hash size={13} className={h.selected ? 'text-[#C1E1DC]' : 'text-slate-200'} />
                    {h.tag}
                    <div onClick={(e) => { e.stopPropagation(); removeTag(h.id); }} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-rose-400"><Trash2 size={13} /></div>
                  </button>
                ))}
              </div>
              
              <CopyButton text={selectedTagsString} label="全タグを一括コピー" className="w-full !py-4" baseColor={COLORS.BABY_BLUE} textColor="#4E8D85" />
            </div>
          </div>
        </section>

        <section className="mt-8 animate-in fade-in zoom-in duration-1000">
            <div className="relative p-[2px] rounded-[48px] bg-gradient-to-br from-[#FDD475] via-[#FFCCAC] to-[#C1E1DC] shadow-2xl shadow-slate-400/30">
                <div className="bg-slate-900 rounded-[46px] p-8 sm:p-12 flex flex-col gap-10 overflow-hidden relative">
                    <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-[#FDD475] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[22px] bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                                <ClipboardCheck size={30} className="text-[#FDD475] float-anim" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-black text-white tracking-tight">Ready to Post</h2>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Final Master Preview</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase">Verified</span>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-md rounded-[38px] p-8 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar border border-white/10 italic text-[16px] text-slate-100 font-mono leading-relaxed shadow-inner group">
                        <pre className="whitespace-pre-wrap break-all selection:bg-[#FDD475] selection:text-slate-900">
                            {fullOverview || "Generate some magic first..."}
                        </pre>
                    </div>

                    <CopyButton 
                      text={fullOverview} 
                      label="Copy All" 
                      className="w-full !py-9 !text-3xl !rounded-[32px] !font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95" 
                      baseColor={COLORS.BUTTERSCOTCH}
                      textColor="#2D3436"
                    />
                </div>
            </div>
        </section>
      </main>

      <footer className="w-full flex flex-col items-center justify-center py-6 px-6 border-t border-slate-100/50">
        <div className="text-center flex flex-col items-center gap-2">
           <p className="text-[12px] font-londrina-shadow text-slate-300 uppercase tracking-[0.2em]">InstaPrep Studio</p>
           <div className="flex flex-col items-center gap-1.5">
             <a 
              href="https://www.instagram.com/matataki.creative/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-lg font-caveat text-[#FFCCAC] font-bold hover:text-slate-700 transition-all"
             >
               <Instagram size={16} className="text-[#FFCCAC] group-hover:text-slate-700" />
               designed by Matataki.creative
             </a>
             <p className="text-[9px] font-bold text-slate-300 tracking-[0.1em] uppercase">
               © 2025 Sakura Saku enterprise LTD
             </p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
