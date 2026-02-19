
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Languages, Clock, Phone, Hash, Sparkles, Copy, Check, 
  Plus, Settings, AlertCircle, X, Loader2, Trash2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const COLORS = {
  BABY_BLUE: '#C1E1DC',
  PEACH: '#FFCCAC',
  BUTTER: '#FFEB94',
  BUTTERSCOTCH: '#FDD475'
};

const DEFAULT_TAGS = ['Sushi', 'Ramen', 'shopLocal'];

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
  const [hours, setHours] = useState({ 
    openTime: "12:00", 
    openPeriod: "PM", 
    closeTime: "06:30", 
    closePeriod: "PM" 
  });
  const [hasKey, setHasKey] = useState(true);
  const [mainCopied, setMainCopied] = useState(false);
  
  const [tagInput, setTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const tagInputRef = useRef(null);
  
  const TAG_STORAGE_KEY = 'insta-tags-master-v12-stable';
  
  const [tags, setTags] = useState(() => {
    const saved = localStorage.getItem(TAG_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_TAGS.map(t => ({ id: Math.random().toString(), text: t, active: true }));
      }
    }
    return DEFAULT_TAGS.map(t => ({ id: Math.random().toString(), text: t, active: true }));
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

  useEffect(() => { 
    localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(tags)); 
  }, [tags]);

  useEffect(() => {
    if (isAddingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isAddingTag]);

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
        contents: `以下の内容で魅力的なInstagram投稿を英語で作成してください。英語の本文は125文字から250文字の範囲で作成してください。また、本文の内容に合ったハッシュタグを3つ生成してください。日本語の指示は次の通り：\n${prompt}`,
        config: {
          systemInstruction: `あなたはプロフェッショナルなInstagramマーケターです。
          入力内容を元に以下のJSONを返してください。
          1. caption: 英語の投稿本文。長さは必ず125文字以上、250文字以内にしてください。
          2. caption_jp: 投稿本文の丁寧な日本語訳（省略しないでください）。
          3. imagePhrase: 画像に入れる3-5単語の短いキャッチコピー（英語）。
          4. imagePhrase_jp: そのキャッチコピーの日本語訳。
          5. hashtags: 内容に合ったハッシュタグを3つ生成（#は含めず単語のみ）。`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING },
              caption_jp: { type: Type.STRING },
              imagePhrase: { type: Type.STRING },
              imagePhrase_jp: { type: Type.STRING },
              hashtags: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["caption", "caption_jp", "imagePhrase", "imagePhrase_jp", "hashtags"]
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

  const hoursSentence = useMemo(() => 
    `⏰ We're open from ${hours.openTime} ${hours.openPeriod} to ${hours.closeTime} ${hours.closePeriod} today.`, 
    [hours]
  );
  const phoneText = useMemo(() => `📞 ${phone}`, [phone]);
  const contactBlock = useMemo(() => `${phoneText}\n${hoursSentence}`, [phoneText, hoursSentence]);

  const finalContent = useMemo(() => {
    const aiTagsStr = result?.hashtags ? result.hashtags.map(t => `#${t.trim()}`).join(' ') : "";
    const manualTagsStr = tags.filter(t => t.active).map(t => `#${t.text}`).join(' ');
    
    let content = "";
    if (result) {
      content += `【 ${result.imagePhrase} 】\n`;
      content += `${result.caption}\n\n`;
    } else {
      content += `[ AI Generated Caption will appear here ]\n\n`;
    }
    content += `${phoneText}\n${hoursSentence}\n\n${aiTagsStr} ${manualTagsStr}`.trim();
    return content;
  }, [result, phoneText, hoursSentence, tags]);

  const handleMainCopy = () => {
    navigator.clipboard.writeText(finalContent);
    setMainCopied(true);
    setTimeout(() => setMainCopied(false), 2000);
  };

  const confirmAddTag = () => {
    const cleanText = tagInput.trim().replace(/^#+/, "");
    if (cleanText === "") {
      setIsAddingTag(false);
      setTagInput("");
      return;
    }

    if (tags.some(t => t.text.toLowerCase() === cleanText.toLowerCase())) {
      alert("既に登録されています");
      return;
    }

    const newTag = {
      id: `tag-${Date.now()}`,
      text: cleanText,
      active: true
    };

    setTags(prev => [...prev, newTag]);
    setTagInput("");
    setIsAddingTag(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') confirmAddTag();
    if (e.key === 'Escape') {
      setTagInput("");
      setIsAddingTag(false);
    }
  };

  const toggleTag = (id) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const removeTag = (e, id) => {
    e.stopPropagation();
    setTags(prev => prev.filter(t => t.id !== id));
  };

  const handleClearPrompt = () => {
    setPrompt("");
    setResult(null); 
  };

  const toggleOpenPeriod = () => {
    setHours(prev => ({ ...prev, openPeriod: prev.openPeriod === "AM" ? "PM" : "AM" }));
  };

  const toggleClosePeriod = () => {
    setHours(prev => ({ ...prev, closePeriod: prev.closePeriod === "AM" ? "PM" : "AM" }));
  };

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
    <div className="max-w-xl mx-auto px-6 py-2 md:py-6">
      <header className="text-center mb-10 pt-4 flex flex-col items-center">
        <h1 className="text-5xl sm:text-7xl font-londrina text-slate-900 mb-0 leading-[1.0] whitespace-nowrap">InstaPrep Studio</h1>
        <p className="font-caveat text-xl sm:text-2xl text-orange-400 leading-none mt-[14px]">Create Once, Post Everywhere</p>
      </header>

      <div className="flex flex-col gap-6">
        <section className="card-ios p-6 shadow-xl flex flex-col">
          <SectionHeader icon={Languages} title="Draft Input" color={COLORS.BABY_BLUE} />
          <div className="relative">
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="日本語で投稿内容を自由入力してください..."
              className="w-full h-32 p-4 pr-12 rounded-[20px] bg-white/40 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100/50 transition-all text-slate-700 font-medium text-base resize-none"
            />
            {prompt && (
              <button 
                onClick={handleClearPrompt}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-200/50 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all z-10"
                title="Clear draft"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className={`w-full mt-4 py-4 rounded-[20px] ${loading ? 'bg-orange-100 animate-pulse' : 'bg-[#FDD475]'} text-slate-800 font-black text-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 relative overflow-hidden`}
          >
            {loading ? (
              <><Loader2 size={24} className="animate-spin text-orange-500" /> GENERATING...</>
            ) : (
              <>
                <Sparkles size={24} className="text-orange-500" /> 
                {result ? "もう一度生成" : "AIで文章を作る"}
              </>
            )}
          </button>
        </section>

        {result && (
          <div className="space-y-4 animate-in">
            <div className="card-ios p-6 border-orange-100">
               <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Image Text (Overlay)</span>
               <p className="text-2xl font-black text-slate-800 leading-tight mb-4 italic">"{result.imagePhrase}"</p>
               <div className="flex justify-between items-center pt-3 border-t border-slate-100/50">
                  <span className="text-xs text-slate-400 italic font-medium">訳: {result.imagePhrase_jp}</span>
                  <CopyButton text={result.imagePhrase} baseColor={COLORS.PEACH} />
               </div>
            </div>
            <div className="card-ios p-6 border-blue-100">
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">English Caption</span>
               <p className="text-base leading-relaxed text-slate-700 font-medium mb-4 whitespace-pre-wrap">{result.caption}</p>
               
               <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 mb-4">
                  <span className="font-black text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Japanese Translation:</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          <div className="card-ios p-6 flex flex-col h-full">
            <div className="flex-grow">
              <SectionHeader icon={Clock} title="Business Hours" color={COLORS.BUTTER} />
              <div className="flex gap-2 mb-2">
                 <div className="w-1/2 flex border border-slate-100 rounded-xl bg-white/50 overflow-hidden shadow-sm group">
                   <input 
                     type="text" 
                     value={hours.openTime} 
                     onChange={e => setHours({...hours, openTime: e.target.value})} 
                     className="w-full bg-transparent p-2 text-xs font-bold text-slate-800 outline-none text-center" 
                   />
                   <button 
                     type="button"
                     onClick={toggleOpenPeriod}
                     className={`px-3 transition-all font-black text-[10px] border-l border-slate-100 ${hours.openPeriod === 'AM' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}
                   >
                     {hours.openPeriod}
                   </button>
                 </div>
                 <div className="w-1/2 flex border border-slate-100 rounded-xl bg-white/50 overflow-hidden shadow-sm group">
                   <input 
                     type="text" 
                     value={hours.closeTime} 
                     onChange={e => setHours({...hours, closeTime: e.target.value})} 
                     className="w-full bg-transparent p-2 text-xs font-bold text-slate-800 outline-none text-center" 
                   />
                   <button 
                     type="button"
                     onClick={toggleClosePeriod}
                     className={`px-3 transition-all font-black text-[10px] border-l border-slate-100 ${hours.closePeriod === 'AM' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}
                   >
                     {hours.closePeriod}
                   </button>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic mt-2">"{hoursSentence}"</p>
            </div>
          </div>

          <div className="card-ios p-6 flex flex-col h-full">
            <div className="flex-grow">
              <SectionHeader icon={Phone} title="Phone Number" color={COLORS.PEACH} />
              <div className="mb-2">
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/50 p-2 rounded-xl text-lg font-black text-slate-800 border border-slate-100 text-center outline-none shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center -mt-2">
           <CopyButton text={contactBlock} baseColor={COLORS.BUTTERSCOTCH} label="COPY PHONE & HOURS" className="w-full sm:w-auto" />
        </div>

        <section className="card-ios p-6 shadow-lg">
          <SectionHeader icon={Hash} title="Hashtags" color={COLORS.BABY_BLUE} />
          <div className="flex flex-wrap gap-2 mb-2 max-h-48 overflow-y-auto no-scrollbar">
            {tags.map(t => (
              <div key={t.id} className="relative group">
                <button 
                  onClick={() => toggleTag(t.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${t.active ? 'bg-slate-800 text-white shadow-lg' : 'bg-white/40 text-slate-400 border border-slate-100'}`}
                >
                  #{t.text}
                </button>
                <button 
                  type="button"
                  onClick={(e) => removeTag(e, t.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-md scale-75 group-hover:scale-100"
                >
                  <X size={10} strokeWidth={4} />
                </button>
              </div>
            ))}
            
            {isAddingTag ? (
              <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                <input 
                  ref={tagInputRef}
                  type="text" 
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={confirmAddTag}
                  placeholder="tag..."
                  className="px-3 py-1.5 rounded-xl border-2 border-slate-800 bg-white text-slate-800 font-black text-[10px] outline-none w-24"
                />
                <button onClick={confirmAddTag} className="p-1.5 bg-slate-800 text-white rounded-lg"><Check size={12} /></button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="px-4 py-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 font-black text-[10px] flex items-center gap-2 hover:border-slate-800 hover:text-slate-800 hover:bg-white/50 transition-all active:scale-95"
              >
                <Plus size={14} /> ADD NEW
              </button>
            )}
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-3 opacity-60">Click to Toggle / Hover to Delete</p>
        </section>

        <section className="card-ios p-6 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]">
          <h2 className="text-xl font-black flex items-center gap-3 mb-4 relative z-10 text-orange-400 tracking-wider">
            POST PREVIEW
          </h2>
          <div className="flex-grow bg-slate-800/60 backdrop-blur-md rounded-[20px] p-4 text-[12px] font-mono leading-relaxed text-slate-300 mb-4 border border-white/5 relative z-10 whitespace-pre-wrap overflow-y-auto max-h-[350px]">
            {finalContent}
          </div>
          <button 
            onClick={handleMainCopy} 
            style={{ backgroundColor: mainCopied ? '#10b981' : undefined }}
            className={`w-full py-5 rounded-[20px] ${mainCopied ? '' : 'bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-300'} text-slate-900 font-black text-base uppercase tracking-widest shadow-2xl active:scale-95 transition-all relative z-10 flex items-center justify-center gap-2`}
          >
            {mainCopied ? <><Check size={20}/> COPIED!</> : "Copy Everything"}
          </button>
        </section>
      </div>

      <footer className="mt-4 text-center pb-8 border-t border-slate-200/50 pt-6">
        <div className="flex flex-col gap-1">
          <a 
            href="https://www.instagram.com/matataki.creative/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] hover:text-orange-600 transition-colors"
          >
            Built by @matataki.creative
          </a>
          <p className="text-slate-600 opacity-60 text-[9px] font-bold uppercase tracking-[0.1em]">©️Sakura saku enterprise LTD.</p>
        </div>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
