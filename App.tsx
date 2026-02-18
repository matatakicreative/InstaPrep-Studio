
import React, { useState, useEffect, useRef } from 'react';
import { 
  Languages, Clock, Phone, Hash, Plus, Trash2, ClipboardCheck,
  Image as ImageIcon, Type as TypeIcon, Sparkles, CheckCircle2,
  ChevronDown, ChevronUp, Instagram
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
    try {
      const stored = localStorage.getItem('insta-hashtags');
      return stored ? JSON.parse(stored) : DEFAULT_HASHTAGS.map(tag => ({ id: Math.random().toString(), tag, selected: false }));
    } catch (e) {
      return DEFAULT_HASHTAGS.map(tag => ({ id: Math.random().toString(), tag, selected: false }));
    }
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
    try {
      const data = await translateAndGenerateCaption(prompt);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
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
          
          <SectionHeader icon={Languages} title="投稿文を自動作成" color="#C1E1DC" />
          
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
            style={{ backgroundColor: '#FDD475' }}
          >
            {isTranslating ? (
              <div className="animate-spin rounded-full h-7 w-7 border-4 border-white border-t-transparent" />
            ) : (
              <><Sparkles size={24} fill="currentColor" /><span>AIで文章を生成する</span></>
            )}
          </button>
          
          {result && (
            <div ref={resultRef} className="flex flex-col gap-8 mt-4 pt-10 border-t-2 border-dashed border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-white/90 border-2 border-[#FFCCAC]/20 rounded-[32px] p-7 shadow-sm">
                <p className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{result.imagePhrase}</p>
                <p className="text-sm text-slate-400 italic mt-2">{result.imagePhrase_jp}</p>
                <CopyButton text={result.imagePhrase} baseColor="#FFCCAC" className="mt-4" />
              </div>

              <div className="bg-white/90 border-2 border-[#C1E1DC]/20 rounded-[32px] p-7 shadow-sm">
                <p className="text-[17px] leading-relaxed text-slate-700 font-semibold whitespace-pre-wrap">{result.caption}</p>
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400">{result.caption_jp}</p>
                </div>
                <CopyButton text={result.caption} baseColor="#C1E1DC" className="mt-4" />
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch">
          <section className="card-ios p-7 flex flex-col h-full">
            <SectionHeader icon={Clock} title="営業時間" color="#FDD475" />
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-2">
                 <input type="text" value={hours.open} onChange={e => setHours({...hours, open: e.target.value})} className="bg-white/50 p-3 rounded-xl w-full font-bold" />
                 <button onClick={() => togglePeriod('open')} className="bg-slate-100 p-3 rounded-xl font-black text-[10px]">{hours.openPeriod}</button>
               </div>
               <div className="flex items-center gap-2">
                 <input type="text" value={hours.close} onChange={e => setHours({...hours, close: e.target.value})} className="bg-white/50 p-3 rounded-xl w-full font-bold" />
                 <button onClick={() => togglePeriod('close')} className="bg-slate-100 p-3 rounded-xl font-black text-[10px]">{hours.closePeriod}</button>
               </div>
               <CopyButton text={formatHoursString()} baseColor="#FDD475" className="w-full" label="営業時間をコピー" />
            </div>
          </section>

          <section className="card-ios p-7 flex flex-col h-full">
            <SectionHeader icon={Phone} title="連絡先" color="#FF8A65" />
            <div className="flex flex-col gap-4">
              <input type="text" value={editablePhone} onChange={e => setEditablePhone(e.target.value)} className="bg-white/50 p-3 rounded-xl w-full font-black text-xl" />
              <CopyButton text={editablePhone} baseColor="#FF8A65" className="w-full" label="電話番号をコピー" />
            </div>
          </section>
        </div>

        <section className="card-ios p-7">
          <SectionHeader icon={Hash} title="ハッシュタグ" color="#C1E1DC" />
          <div className="flex flex-wrap gap-2 mb-6">
            {hashtags.map(h => (
              <button 
                key={h.id} onClick={() => toggleTag(h.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-b-4 ${h.selected ? 'bg-white border-[#C1E1DC] text-[#4E8D85]' : 'bg-slate-50 border-transparent text-slate-400'}`}
              >
                #{h.tag}
              </button>
            ))}
          </div>
          <CopyButton text={selectedTagsString} label="全タグをコピー" className="w-full" baseColor="#C1E1DC" />
        </section>

        <section className="card-ios p-8 bg-slate-900 border-none shadow-2xl">
           <h2 className="text-2xl font-black text-white mb-6">Final Preview</h2>
           <div className="bg-slate-800 rounded-3xl p-6 text-slate-100 font-mono text-sm min-h-[200px] whitespace-pre-wrap">
              {fullOverview || "生成された文章がここに表示されます"}
           </div>
           <CopyButton text={fullOverview} label="全てをコピーして投稿" className="w-full mt-6 !py-6 !text-lg" baseColor="#FDD475" />
        </section>
      </main>

      <footer className="py-10 text-center opacity-30 font-bold text-[10px] uppercase tracking-widest">
        © 2025 InstaPrep Studio by Matataki
      </footer>
    </div>
  );
};

export default App;
