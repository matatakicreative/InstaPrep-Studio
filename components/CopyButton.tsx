
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  baseColor?: string;
  textColor?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ 
  text, 
  label, 
  className = "", 
  style, 
  baseColor = "#FFFFFF",
  textColor = "#2D3436"
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  // Extract a darker version for the 3D border effect if it's a custom hex
  // Simple darkening logic: we'll just use a semi-transparent black overlay for the border style
  const borderStyle = copied ? 'transparent' : 'rgba(0,0,0,0.1)';

  return (
    <button
      onClick={handleCopy}
      style={{ 
        ...style, 
        backgroundColor: copied ? '#10b981' : baseColor,
        borderColor: borderStyle,
        color: copied ? '#FFFFFF' : textColor
      }}
      className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-300 active:scale-95 font-black text-[10px] shadow-md overflow-hidden border-b-4 active:border-b-0 active:translate-y-1 ${className}`}
    >
      {copied ? (
        <Check size={14} className="animate-in zoom-in duration-300" />
      ) : (
        <Copy size={14} className="opacity-60" />
      )}
      <span className="uppercase tracking-[0.2em] whitespace-nowrap">
        {copied ? "COPIED!" : (label || "COPY")}
      </span>
      
      {/* Glossy effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      
      {copied && (
        <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></div>
      )}
    </button>
  );
};

export default CopyButton;
