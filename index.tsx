
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Languages, Clock, Phone, Hash, Sparkles, Copy, Check, Instagram, Trash2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- 1. SETTINGS & CONSTANTS ---
const COLORS = {
  BABY_BLUE: '#C1E1DC',
  PEACH: '#FFCCAC',
  BUTTER: '#FFEB94',
  BUTTERSCOTCH: '#FDD475'
};
const DEFAULT_TAGS = ['Vernon', 'BC', 'Okanagan', 'ExploreBC'];
const SHOP_PHONE = "778-475-6191";

// --- 2. GEMINI SERVICE ---
// Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function generateInstaPost(japaneseText: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: japaneseText,
      config: {
        systemInstruction: `あなたはInstagram投稿アシスタントです。入力された日本語から魅力的な英語投稿を作成してください。
        以下のJSON形式で返してください：
        {
          "caption": "英語の投稿本文",
          "caption_jp": "本文の日本語訳",
          "imagePhrase": "画像に入れる3-5語の英語フレーズ",
          "imagePhrase_jp": "フレーズの日本語訳"
        }`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            caption_jp: { type: Type.STRING },
            imagePhrase: { type: Type.STRING },
            imagePhrase_jp: { type: Type.STRING }
          },
          required: ["caption", "caption_jp", "imagePhrase", "imagePhrase_jp"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// --- 3. COMPONENTS ---
// Added className to props type and destructured it to fix assignment errors
const CopyButton = ({ text, label, baseColor, className = "" }: { text: string, label?: string, baseColor: string, className?: string }) => {
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
      // Applied className prop to the button element
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-slate-800 transition-all active:scale-95 shadow-sm border-b-4 border-black/10 active:border-b-0 active:translate-y-1 ${className}`}
    >
      {copied ? <Check size={14}/> : <Copy size={14}/>}
      {copied ? "COPIED!" : (label || "COPY")}
    </button>
  );
};

const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: color }}>
      <Icon size={20} className="text-slate-700" />
    </div>
    <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">{title}</h2>
  </div>
);

// --- 4. MAIN APP ---
const App = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [tags, setTags] = useState(() => {
    const s = localStorage.getItem('insta-tags-v2');
    return s ? JSON.parse(s) : DEFAULT_TAGS.map(t => ({ id: Math.random().toString(), text: t, active: false }));
  });
  const [hours, setHours] = useState({ open: "12:00 PM", close: "6:30 PM" });

  useEffect(() => { localStorage.setItem('insta-tags-v2', JSON.stringify(tags)); }, [tags]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await generateInstaPost(prompt);
      setResult(res);
    } catch (e) { alert("Error generating content"); }
    finally { setLoading(false); }
  };

  const toggleTag = (id: string) => setTags(tags.map(t => t.id === id ? { ...t, active: !t.active } : t));
  const activeTagsStr = tags.filter((t: any) => t.active).map((t: any) => `#${t.text}`).join(' ');
  const hoursStr = `We're open from ${hours.open} to ${hours.close} today.`;
  const finalContent = result ? `【${result.imagePhrase}】\n${result.caption}\n\n📞 ${SHOP_PHONE}\n⏰ ${hoursStr}\n\n${activeTagsStr}` : "";

  return (
    <div className="max-w-xl mx-auto px-5 py-10">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-londrina text-slate-900 mb-1">InstaPrep</h1>
        <p className="font-caveat text-xl text-orange-400">Professional Post Studio</p>
      </header>

      <div className="flex flex-col gap-8">
        {/* Input Section */}
        <section className="card-ios p-6 shadow-xl">
          <SectionHeader icon={Languages} title="Draft Creator" color={COLORS.BABY_BLUE} />
          <textarea 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="投稿したい内容を日本語で入力..."
            className="w-full h-32 p-4 rounded-2xl bg-white/50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 transition-all text-slate-700 font-medium"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full mt-4 py-4 rounded-2xl bg-[#FDD475] text-slate-800 font-black text-lg shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Generating..." : <><Sparkles size={20}/> 文章を生成する</>}
          </button>
        </section>

        {/* AI Result */}
        {result && (
          <section className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <div className="card-ios p-6 border-orange-100">
               <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Image Phrase</span>
               <p className="text-2xl font-black text-slate-800 mt-1 mb-4">{result.imagePhrase}</p>
               <CopyButton text={result.imagePhrase} baseColor={COLORS.PEACH} />
            </div>
            <div className="card-ios p-6 border-blue-100">
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Post Caption</span>
               <p className="text-sm leading-relaxed text-slate-700 font-medium mt-1 mb-4 whitespace-pre-wrap">{result.caption}</p>
               <CopyButton text={result.caption} baseColor={COLORS.BABY_BLUE} />
            </div>
          </section>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card-ios p-5">
            <SectionHeader icon={Clock} title="Business Hours" color={COLORS.BUTTER} />
            <input 
              type="text" value={hours.open} 
              onChange={e => setHours({...hours, open: e.target.value})}
              className="w-full bg-white/50 p-2 rounded-lg text-xs font-bold mb-2 outline-none"
            />
            <CopyButton text={hoursStr} baseColor={COLORS.BUTTER} className="w-full" label="COPY HOURS" />
          </div>
          <div className="card-ios p-5">
            <SectionHeader icon={Phone} title="Phone" color={COLORS.PEACH} />
            <div className="text-sm font-black text-slate-800 p-2 bg-white/50 rounded-lg mb-2">{SHOP_PHONE}</div>
            <CopyButton text={SHOP_PHONE} baseColor={COLORS.PEACH} className="w-full" />
          </div>
        </div>

        {/* Hashtags */}
        <section className="card-ios p-6">
          <SectionHeader icon={Hash} title="Hashtags" color={COLORS.BABY_BLUE} />
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((t: any) => (
              <button 
                key={t.id} onClick={() => toggleTag(t.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${t.active ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
              >
                #{t.text}
              </button>
            ))}
          </div>
          <CopyButton text={activeTagsStr} baseColor={COLORS.BABY_BLUE} label="COPY ALL ACTIVE TAGS" className="w-full" />
        </section>

        {/* Preview & Final Action */}
        <section className="card-ios p-6 bg-slate-900 text-white border-none shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2"><Instagram size={20}/> FINAL PREVIEW</h2>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-[10px] font-mono leading-relaxed text-slate-300 min-h-[100px] whitespace-pre-wrap mb-6">
            {finalContent || "文章を生成するとここにプレビューが表示されます"}
          </div>
          {result && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(finalContent);
                alert("Copied all content!");
              }}
              className="w-full py-5 rounded-2xl bg-[#FDD475] text-slate-900 font-black text-sm uppercase tracking-widest shadow-xl active:scale-95"
            >
              Copy Everything to Instagram
            </button>
          )}
        </section>
      </div>

      <footer className="mt-20 text-center opacity-20 text-[10px] font-black uppercase tracking-tighter">
        © 2025 InstaPrep Studio • Created for Vernon Local Business
      </footer>
    </div>
  );
};

// --- 5. RENDER ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
