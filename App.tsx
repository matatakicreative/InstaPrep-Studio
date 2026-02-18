
import React, { useState, useEffect, useRef } from 'react';
import { 
  Languages, Clock, Phone, Hash, Plus, Trash2, ClipboardCheck,
  Image as ImageIcon, Type as TypeIcon, Sparkles, CheckCircle2,
  ChevronDown, ChevronUp, Instagram
} from 'lucide-react';
import { translateAndGenerateCaption } from './services/geminiService.ts';
import CopyButton from './components/CopyButton.tsx';

// --- INLINED CONSTANTS ---
const COLORS = {
  BABY_BLUE: '#C1E1DC',
  PEACH: '#FFCCAC',
  BUTTER: '#FFEB94',
  BUTTERSCOTCH: '#FDD475',
  TEXT_DARK: '#2D3436'
};
const DEFAULT_HASHTAGS = ['Vernon', 'BC', 'Okanagan', 'ExploreBC'];
const PHONE_NUMBER = "778-475-6191";

// --- INLINED TYPES ---
interface Hashtag { id: string; tag: string; selected: boolean; }
interface GeneratedContent { caption: string; caption_jp: string; imagePhrase: string; imagePhrase_jp: string; }

const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
  <div className="flex items-center gap-3 mb-4 px-1">
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: color + '40' }}>
      <Icon size={20} className="text-slate-700" />
    </div>
    <h2 className="text-base font-black text-slate-800 tracking-tight uppercase">{title}</h2>
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
  const [hours, setHours] = useState({ open: "12", openPeriod: "PM", close: "6:30", closePeriod: "PM" });
  const [editablePhone, setEditablePhone] = useState(PHONE_NUMBER);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('insta-hashtags', JSON.stringify(hashtags)); }, [hashtags]);

  const handleTranslate = async () => {
    if (!prompt.trim()) return;
    setIsTranslating(true);
    try {
      const data = await translateAndGenerateCaption(prompt);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { console.error(err); } 
    finally { setIsTranslating(false); }
  };

  const toggleTag = (id: string) => setHashtags(hashtags.map(h => h.id === id ? { ...h, selected: !h.selected } : h));
  const formatHoursString = () => `We're open from ${hours.open} ${hours.openPeriod} to ${hours.close} ${hours.closePeriod} today.`;
  const selectedTagsString = hashtags.filter(h => h.selected).map(h => `#${h.tag}`).join(' ');

  const fullOverview = result ? `【${result.imagePhrase}】\n${result.caption}\n\n📞 ${editablePhone}\n⏰ ${formatHoursString()}\n\n${selectedTagsString}`.trim() : "";

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-50 glass-nav px-6 py-4 text-center">
        <h1 className="text-3xl font-londrina-shadow text-slate-900">InstaPrep Studio</h1>
        <p className="text-sm font-caveat text-orange-400 font-bold">Post Support Tool</p>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8 flex flex-col gap-8">
        <section className="card-ios p-6 flex flex-col gap-6">
          <SectionHeader icon={Languages} title="Create Content" color={COLORS.BABY_BLUE} />
          <textarea
            className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-baby-blue outline-none min-h-[120px] text-slate-700"
            placeholder="投稿内容を日本語で..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !prompt.trim()}
            className="w-full py-4 bg-[#FDD475] rounded-2xl text-white font-black shadow-lg shadow-yellow-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isTranslating ? "GENERATEING..." : <><Sparkles size={20} />文章を生成する</>}
          </button>
          
          {result && (
            <div ref={resultRef} className="flex flex-col gap-4 mt-4 animate-in slide-in-from-bottom-4">
              <div className="bg-white/80 p-4 rounded-2xl border border-orange-100">
                <p className="text-xl font-black text-slate-800">{result.imagePhrase}</p>
                <CopyButton text={result.imagePhrase} baseColor={COLORS.PEACH} className="mt-2" />
              </div>
              <div className="bg-white/80 p-4 rounded-2xl border border-blue-100">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">{result.caption}</p>
                <CopyButton text={result.caption} baseColor={COLORS.BABY_BLUE} className="mt-3" />
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-4">
          <section className="card-ios p-5">
            <SectionHeader icon={Clock} title="Hours" color={COLORS.BUTTER} />
            <div className="flex flex-col gap-2">
              <input type="text" value={hours.open} onChange={e => setHours({...hours, open: e.target.value})} className="bg-white/50 p-2 rounded-lg text-xs font-bold w-full" />
              <CopyButton text={formatHoursString()} baseColor={COLORS.BUTTER} label="COPY" className="w-full" />
            </div>
          </section>
          <section className="card-ios p-5">
            <SectionHeader icon={Phone} title="Contact" color="#FF8A65" />
            <div className="flex flex-col gap-2">
              <input type="text" value={editablePhone} onChange={e => setEditablePhone(e.target.value)} className="bg-white/50 p-2 rounded-lg text-xs font-bold w-full" />
              <CopyButton text={editablePhone} baseColor="#FF8A65" label="COPY" className="w-full" />
            </div>
          </section>
        </div>

        <section className="card-ios p-6">
          <SectionHeader icon={Hash} title="Hashtags" color={COLORS.BABY_BLUE} />
          <div className="flex flex-wrap gap-2 mb-4">
            {hashtags.map(h => (
              <button 
                key={h.id} onClick={() => toggleTag(h.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${h.selected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                #{h.tag}
              </button>
            ))}
          </div>
          <CopyButton text={selectedTagsString} label="COPY ALL TAGS" className="w-full" baseColor={COLORS.BABY_BLUE} />
        </section>

        <section className="card-ios p-6 bg-slate-900 text-white border-none shadow-xl">
           <h2 className="text-lg font-black mb-4 flex items-center gap-2"><Instagram size={20}/> PREVIEW</h2>
           <div className="bg-slate-800 rounded-xl p-4 text-[11px] font-mono leading-relaxed whitespace-pre-wrap text-slate-300">
              {fullOverview || "生成後にプレビューが表示されます"}
           </div>
           {result && <CopyButton text={fullOverview} label="COPY ALL" className="w-full mt-4 py-4 !text-sm" baseColor="#FDD475" />}
        </section>
      </main>
    </div>
  );
};

export default App;
