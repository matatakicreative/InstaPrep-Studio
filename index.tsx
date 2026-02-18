
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Languages, Clock, Phone, Hash, Sparkles, Copy, Check, Instagram, 
  Settings, Send, ArrowRight, Trash2, Plus
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- constants ---
const COLORS = {
  BABY_BLUE: '#C1E1DC',
  PEACH: '#FFCCAC',
  BUTTER: '#FFEB94',
  BUTTERSCOTCH: '#FDD475'
};

const DEFAULT_TAGS = ['Vernon', 'BC', 'Okanagan', 'ExploreBC', 'LocalBusiness'];
const DEFAULT_PHONE = "778-475-6191";

// --- components ---
const CopyButton = ({ text, label, baseColor }: { text: string, label?: string, baseColor: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      style={{ backgroundColor: copied ? '#10b981' : baseColor }}
      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-slate-800 transition-all active:scale-95 shadow-sm border-b-4 border-black/10 active:border-b-0 active:translate-y-1"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "COPIED!" : (label || "COPY")}
    </button>
  );
};

const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: color + '80' }}>
      <Icon size={20} className="text-slate-700" />
    </div>
    <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">{title}</h2>
  </div>
);

// --- main application ---
const App = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [hours, setHours] = useState({ open: "12:00 PM", close: "6:30 PM" });
  const [tags, setTags] = useState(() => {
    const s = localStorage.getItem('insta-tags-v4');
    return s ? JSON.parse(s) : DEFAULT_TAGS.map(t => ({ id: Math.random().toString(), text: t, active: false }));
  });

  useEffect(() => { localStorage.setItem('insta-tags-v4', JSON.stringify(tags)); }, [tags]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: `あなたはInstagramの投稿支援エキスパートです。
日本語の入力内容から、以下の4点を英語と日本語で作成し、JSONで返してください。
1. imagePhrase: 画像内に大きく載せる短い英語フレーズ（3〜5語）
2. imagePhrase_jp: その日本語訳
3. caption: 投稿本文（魅力的な英語）
4. caption_jp: 本文の日本語訳

JSON Schema:
{
  "imagePhrase": "string",
  "imagePhrase_jp": "string",
  "caption": "string",
  "caption_jp": "string"
}`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              imagePhrase: { type: Type.STRING },
              imagePhrase_jp: { type: Type.STRING },
              caption: { type: Type.STRING },
              caption_jp: { type: Type.STRING }
            },
            required: ["imagePhrase", "imagePhrase_jp", "caption", "caption_jp"]
          }
        }
      });
      
      const data = JSON.parse(response.text);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("AIの生成中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (id: string) => setTags(tags.map(t => t.id === id ? { ...t, active: !t.active } : t));
  
  const activeTagsStr = tags.filter(t => t.active).map(t => `#${t.text}`).join(' ');
  const hoursStr = `We're open from ${hours.open} to ${hours.close} today.`;
  const finalContent = result ? `【${result.imagePhrase}】\n${result.caption}\n\n📞 ${phone}\n⏰ ${hoursStr}\n\n${activeTagsStr}` : "";

  return (
    <div className="max-w-xl mx-auto px-5 py-8 md:py-12">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-londrina text-slate-900 tracking-tighter mb-1">InstaPrep</h1>
        <p className="font-caveat text-xl text-orange-400">Smart Post Assistant</p>
      </header>

      <div className="space-y-8">
        {/* Input Box */}
        <section className="card-ios p-6">
          <SectionHeader icon={Languages} title="Draft Input" color={COLORS.BABY_BLUE} />
          <textarea 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="今日伝えたい内容を日本語で入力してください..."
            className="w-full h-32 p-4 rounded-2xl bg-white/50 border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-700 font-medium resize-none"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full mt-4 py-4 rounded-2xl bg-[#FDD475] text-slate-800 font-black text-lg shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {loading ? "Generating..." : <><Sparkles size={22} className="text-orange-500" /> 文章を生成する</>}
          </button>
        </section>

        {/* AI Output Cards */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            <div className="card-ios p-6 border-orange-200">
               <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Visual Phrase</span>
               <p className="text-2xl font-black text-slate-800 leading-tight mb-4">{result.imagePhrase}</p>
               <div className="flex justify-between items-center">
                 <span className="text-xs text-slate-400 italic">"{result.imagePhrase_jp}"</span>
                 <CopyButton text={result.imagePhrase} baseColor={COLORS.PEACH} />
               </div>
            </div>
            
            <div className="card-ios p-6 border-blue-200">
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">English Caption</span>
               <p className="text-sm leading-relaxed text-slate-700 font-medium mb-4 whitespace-pre-wrap">{result.caption}</p>
               <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                 <span className="text-[10px] text-slate-400 max-w-[60%] line-clamp-1">{result.caption_jp}</span>
                 <CopyButton text={result.caption} baseColor={COLORS.BABY_BLUE} />
               </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-ios p-5">
            <SectionHeader icon={Clock} title="Hours" color={COLORS.BUTTER} />
            <div className="flex gap-2 mb-3">
              <input type="text" value={hours.open} onChange={e => setHours({...hours, open: e.target.value})} className="w-1/2 bg-white/50 p-2 rounded-lg text-xs font-bold border border-slate-100" />
              <input type="text" value={hours.close} onChange={e => setHours({...hours, close: e.target.value})} className="w-1/2 bg-white/50 p-2 rounded-lg text-xs font-bold border border-slate-100" />
            </div>
            <CopyButton text={hoursStr} baseColor={COLORS.BUTTER} label="COPY HOURS" />
          </div>
          
          <div className="card-ios p-5">
            <SectionHeader icon={Phone} title="Contact" color={COLORS.PEACH} />
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/50 p-2 rounded-lg text-xs font-bold mb-3 border border-slate-100" />
            <CopyButton text={phone} baseColor={COLORS.PEACH} />
          </div>
        </div>

        {/* Hashtags */}
        <section className="card-ios p-6">
          <SectionHeader icon={Hash} title="Hashtags" color={COLORS.BABY_BLUE} />
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map(t => (
              <button 
                key={t.id} 
                onClick={() => toggleTag(t.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${t.active ? 'bg-slate-800 text-white shadow-md scale-105' : 'bg-white border border-slate-100 text-slate-400'}`}
              >
                #{t.text}
              </button>
            ))}
            <button className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-400 flex items-center gap-1">
              <Plus size={12} />
            </button>
          </div>
          <CopyButton text={activeTagsStr} baseColor={COLORS.BABY_BLUE} label="COPY ALL SELECTED TAGS" />
        </section>

        {/* Final Preview */}
        <section className="card-ios p-6 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Instagram size={100} />
          </div>
          <h2 className="text-lg font-black flex items-center gap-2 mb-4 relative z-10"><Instagram size={20} className="text-pink-500" /> FINAL PREVIEW</h2>
          <div className="bg-slate-800/50 rounded-2xl p-4 text-[11px] font-mono leading-relaxed text-slate-300 min-h-[120px] whitespace-pre-wrap mb-6 border border-white/5 relative z-10">
            {finalContent || "生成を開始するとここにプレビューが表示されます。"}
          </div>
          {result && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(finalContent);
                alert("クリップボードにコピーしました！");
              }}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-300 to-yellow-300 text-slate-900 font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 relative z-10"
            >
              Copy to Clipboard
            </button>
          )}
        </section>
      </div>

      <footer className="mt-16 text-center opacity-30 text-[9px] font-black uppercase tracking-[0.3em]">
        © 2025 InstaPrep Studio • Designed for local Business
      </footer>
    </div>
  );
};

// --- start ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
