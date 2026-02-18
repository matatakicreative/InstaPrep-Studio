import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Languages, Clock, Phone, Hash, Sparkles, Copy, Check, Instagram, 
  Plus, Settings, AlertCircle
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const COLORS = {
  BABY_BLUE: '#C1E1DC',
  PEACH: '#FFCCAC',
  BUTTER: '#FFEB94',
  BUTTERSCOTCH: '#FDD475'
};

const DEFAULT_TAGS = ['Vernon', 'BC', 'Okanagan', 'ShopLocal'];

const CopyButton = ({ text, label = "", baseColor, className = "" }) => {
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
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black text-slate-800 transition-all active:scale-95 shadow-sm border-b-4 border-black/10 active:border-b-0 active:translate-y-1 ${className}`}
    >
      {copied ? <Check size={14}/> : <Copy size={14}/>}
      {copied ? "COPIED!" : (label || "COPY")}
    </button>
  );
};

const SectionHeader = ({ icon: Icon, title, color }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-12 h-12 rounded-[20px] flex items-center justify-center shadow-inner" style={{ backgroundColor: color + '90' }}>
      <Icon size={24} className="text-slate-700" />
    </div>
    <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">{title}</h2>
  </div>
);

const App = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [phone, setPhone] = useState("778-475-6191");
  const [hours, setHours] = useState({ open: "12:00 PM", close: "6:30 PM" });
  const [hasKey, setHasKey] = useState(true);
  const [tags, setTags] = useState(() => {
    const saved = localStorage.getItem('insta-tags-final-v2');
    return saved ? JSON.parse(saved) : DEFAULT_TAGS.map(t => ({ id: Math.random().toString(), text: t, active: true }));
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        if (!process.env.API_KEY && !selected) {
          setHasKey(false);
        }
      }
    };
    checkKey();
  }, []);

  useEffect(() => { localStorage.setItem('insta-tags-final-v2', JSON.stringify(tags)); }, [tags]);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `以下の内容で魅力的なInstagram投稿を英語で作成してください。日本語の指示は次の通り：\n${prompt}`,
        config: {
          systemInstruction: `あなたはプロフェッショナルなInstagramマーケターです。
          入力内容を元に以下のJSONを返してください。
          1. caption: 英語の投稿本文。
          2. caption_jp: 投稿本文の丁寧な日本語訳（省略しないでください）。
          3. imagePhrase: 画像に入れる3-5単語の短いキャッチコピー（英語）。
          4. imagePhrase_jp: そのキャッチコピーの日本語訳。`,
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
      
      const data = JSON.parse(response.text);
      setResult(data);
    } catch (e) {
      console.error("AI Error:", e);
      if (e.message?.includes("API key") || e.message?.includes("entity was not found")) {
        setHasKey(false);
      } else {
        alert("文章の生成に失敗しました。APIキーの設定や通信環境を確認してください。");
      }
    } finally {
      setLoading(false);
    }
  };

  const finalContent = useMemo(() => {
    const activeTagsStr = tags.filter(t => t.active).map(t => `#${t.text}`).join(' ');
    const hoursStr = `⏰ Today: ${hours.open} - ${hours.close}`;
    const phoneStr = `📞 ${phone}`;
    
    let content = "";
    if (result) {
      content += `【 ${result.imagePhrase} 】\n\n`;
      content += `${result.caption}\n\n`;
    } else {
      content += `[ AI Generated Caption will appear here ]\n\n`;
    }
    content += `${phoneStr}\n${hoursStr}\n\n${activeTagsStr}`;
    return content;
  }, [result, phone, hours, tags]);

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="card-ios p-10 max-w-sm w-full border-orange-200 shadow-2xl animate-in">
          <div className="w-20 h-20 bg-orange-50 rounded-[30px] flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-orange-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">APIキーが必要です</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
            GitHub環境で動作させるには、Google AI StudioのAPIキーを選択してください。
            <br />
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500 underline text-[10px] mt-4 inline-block font-black tracking-widest uppercase">Billing Docs</a>
          </p>
          <button 
            onClick={handleOpenKey}
            className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Settings size={18} /> APIキーを選択
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 md:py-20">
      <header className="text-center mb-12">
        <h1 className="text-6xl font-londrina text-slate-900 mb-2">InstaPrep</h1>
        <p className="font-caveat text-2xl text-orange-400">Smart Creator Studio</p>
      </header>

      <div className="flex flex-col gap-10">
        <section className="card-ios p-8 shadow-2xl flex flex-col">
          <SectionHeader icon={Languages} title="Draft Input" color={COLORS.BABY_BLUE} />
          <textarea 
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="日本語で投稿内容を自由に入力してください..."
            className="w-full h-36 p-5 rounded-[24px] bg-white/40 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100/50 transition-all text-slate-700 font-medium text-base resize-none"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full mt-6 py-5 rounded-[24px] bg-[#FDD475] text-slate-800 font-black text-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {loading ? "GENERATING..." : <><Sparkles size={24} className="text-orange-500" /> AIで文章を作る</>}
          </button>
        </section>

        {result && (
          <div className="space-y-6 animate-in">
            <div className="card-ios p-8 border-orange-100">
               <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-3">Image Text (Overlay)</span>
               <p className="text-3xl font-black text-slate-800 leading-tight mb-6 italic">"{result.imagePhrase}"</p>
               <div className="flex justify-between items-center pt-4 border-t border-slate-100/50">
                  <span className="text-xs text-slate-400 italic font-medium">訳: {result.imagePhrase_jp}</span>
                  <CopyButton text={result.imagePhrase} baseColor={COLORS.PEACH} />
               </div>
            </div>
            <div className="card-ios p-8 border-blue-100">
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-3">English Caption</span>
               <p className="text-base leading-relaxed text-slate-700 font-medium mb-6 whitespace-pre-wrap">{result.caption}</p>
               
               <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 mb-6">
                  <span className="font-black text-[9px] text-slate-400 uppercase tracking-wider block mb-2 underline decoration-blue-200 underline-offset-4 tracking-widest">Japanese Translation:</span>
                  <div className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                    {result.caption_jp}
                  </div>
               </div>
               <div className="flex justify-end">
                  <CopyButton text={result.caption} baseColor={COLORS.BABY_BLUE} label="COPY CAPTION" />
               </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
          <div className="card-ios p-6 flex flex-col h-full">
            <div className="flex-grow">
              <SectionHeader icon={Clock} title="Hours Today" color={COLORS.BUTTER} />
              <div className="flex gap-2 mb-4">
                 <input type="text" value={hours.open} onChange={e => setHours({...hours, open: e.target.value})} className="w-1/2 bg-white/50 p-3 rounded-xl text-xs font-bold border border-slate-100 outline-none" />
                 <input type="text" value={hours.close} onChange={e => setHours({...hours, close: e.target.value})} className="w-1/2 bg-white/50 p-3 rounded-xl text-xs font-bold border border-slate-100 outline-none" />
              </div>
            </div>
            <div className="mt-auto">
               <CopyButton text={`Today: ${hours.open} - ${hours.close}`} baseColor={COLORS.BUTTER} label="COPY HOURS" className="w-full" />
            </div>
          </div>

          <div className="card-ios p-6 flex flex-col h-full">
            <div className="flex-grow">
              <SectionHeader icon={Phone} title="Phone Number" color={COLORS.PEACH} />
              <div className="mb-4">
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/50 p-3 rounded-xl text-lg font-black text-slate-800 border border-slate-100 text-center outline-none" />
              </div>
            </div>
            <div className="mt-auto">
              <CopyButton text={phone} baseColor={COLORS.PEACH} label="COPY PHONE" className="w-full" />
            </div>
          </div>
        </div>

        <section className="card-ios p-8">
          <SectionHeader icon={Hash} title="Hashtags" color={COLORS.BABY_BLUE} />
          <div className="flex flex-wrap gap-2.5 mb-8 max-h-48 overflow-y-auto no-scrollbar">
            {tags.map(t => (
              <button key={t.id} onClick={() => setTags(tags.map(tag => tag.id === t.id ? {...tag, active: !tag.active} : tag))}
                className={`px-4 py-2 rounded-2xl text-[11px] font-black transition-all ${t.active ? 'bg-slate-800 text-white shadow-xl scale-105' : 'bg-white text-slate-400 border border-slate-100'}`}>
                #{t.text}
              </button>
            ))}
            <button onClick={() => {const text = prompt("新規タグ名:"); if(text) setTags([...tags, {id: Math.random().toString(), text, active: true}])}}
              className="px-4 py-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 font-bold text-[11px] flex items-center gap-1">
              <Plus size={14} /> ADD
            </button>
          </div>
          <CopyButton text={tags.filter(t => t.active).map(t => `#${t.text}`).join(' ')} baseColor={COLORS.BABY_BLUE} label="COPY TAGS" className="w-full" />
        </section>

        <section className="card-ios p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden flex flex-col min-h-[450px]">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Instagram size={150} /></div>
          <h2 className="text-xl font-black flex items-center gap-3 mb-6 relative z-10"><Instagram size={24} className="text-pink-500" /> POST PREVIEW</h2>
          <div className="flex-grow bg-slate-800/60 backdrop-blur-md rounded-[24px] p-6 text-[12px] font-mono leading-relaxed text-slate-300 mb-8 border border-white/5 relative z-10 whitespace-pre-wrap overflow-y-auto max-h-[400px]">
            {finalContent}
          </div>
          <button 
            onClick={() => {navigator.clipboard.writeText(finalContent); alert("コピーしました！")}} 
            className="w-full py-6 rounded-[24px] bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-300 text-slate-900 font-black text-base uppercase tracking-widest shadow-2xl active:scale-95 transition-transform relative z-10"
          >
            Copy Everything
          </button>
        </section>
      </div>

      <footer className="mt-24 text-center">
        <p className="opacity-20 text-[10px] font-black uppercase tracking-[0.4em]">© 2025 InstaPrep Studio • Vernorn BC</p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);