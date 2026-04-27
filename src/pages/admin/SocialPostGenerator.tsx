import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { NewsArticle, SiteSettings } from '../../types';
import { toPng } from 'html-to-image';
import { 
  Download, 
  RotateCcw, 
  Type, 
  Layout, 
  Image as ImageIcon,
  Loader2,
  Share2,
  Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function SocialPostGenerator() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [customHeadline, setCustomHeadline] = useState('');
  const [bgColor, setBgColor] = useState('#0A2A43');
  const [templateId, setTemplateId] = useState('modern');
  const [generating, setGenerating] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      const q = query(collection(db, 'news'), where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(15));
      const newsSnap = await getDocs(q);
      setArticles(newsSnap.docs.map(d => ({ ...d.data(), id: d.id } as NewsArticle)));

      const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as SiteSettings;
        setSettings(data);
      }
    }
    fetchData();
  }, []);

  const templates = [
    { id: 'modern', name: 'Modern Clean', icon: Layout },
    { id: 'dramatic', name: 'Dramatic Hero', icon: ImageIcon },
    { id: 'editorial', name: 'Classic Editorial', icon: Newspaper }
  ];

  useEffect(() => {
    if (selectedArticle) {
      setCustomHeadline(selectedArticle.title);
    }
  }, [selectedArticle]);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `cbt-dispatch-${selectedArticle?.slug || 'custom'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Social graphic exported');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-[#0A2A43] uppercase tracking-tighter">Visual Dispatch Generator</h1>
        <p className="text-[#1E90FF] font-black text-[10px] uppercase tracking-[0.3em] mt-1">Branding & Social Presence Suite</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Editor Controls */}
        <div className="space-y-10">
          <div className="bg-white border-2 border-gray-50 rounded-[2rem] p-10 space-y-8 shadow-sm">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-3 tracking-[0.2em]">Select Reference Story</label>
              <div className="relative">
                <select
                  onChange={(e) => setSelectedArticle(articles.find(a => a.id === e.target.value) || null)}
                  className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-xl p-4 text-sm font-black text-[#0A2A43] focus:border-[#1E90FF] focus:bg-white focus:outline-none appearance-none transition-all shadow-inner"
                >
                  <option value="">-- CHOOSE FROM RECENT STREAM --</option>
                  {articles.map(article => (
                    <option key={article.id} value={article.id}>{article.title.toUpperCase()}</option>
                  ))}
                </select>
                <Layout className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E90FF] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-3 tracking-[0.2em]">Broadcast Headline</label>
              <textarea
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                rows={3}
                className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-2xl p-5 text-sm font-bold text-[#0A2A43] focus:border-[#1E90FF] focus:bg-white focus:outline-none resize-none shadow-inner transition-all placeholder:text-[#0A2A43]/20"
                placeholder="Adjust headline for visual impact..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-4 tracking-[0.2em]">Select Template</label>
              <div className="grid grid-cols-3 gap-4">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${templateId === t.id ? 'border-[#1E90FF] bg-[#1E90FF]/5 text-[#1E90FF]' : 'border-gray-100 bg-white text-gray-400'}`}
                  >
                    <t.icon className="w-6 h-6" />
                    <span className="text-[8px] font-black uppercase tracking-widest">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-4 tracking-[0.2em]">Theme Identity</label>
              <div className="flex gap-4">
                {['#0A2A43', '#1E90FF', '#E63946', '#2D3436', '#00B894'].map(color => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={`w-10 h-10 rounded-xl border-4 transition-all hover:scale-110 shadow-lg ${bgColor === color ? 'border-white ring-4 ring-[#1E90FF]' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button
                onClick={downloadImage}
                disabled={generating || !selectedArticle}
                className="flex-1 bg-[#0A2A43] hover:bg-[#1E90FF] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all text-xs tracking-[0.2em] shadow-2xl active:scale-95 transform"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                EXPORT DISPATCH
              </button>
              <button 
                onClick={() => { setSelectedArticle(null); setCustomHeadline(''); }}
                className="bg-[#F1F5F9] text-[#0A2A43] p-5 rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-8 bg-[#F1F5F9] border-2 border-gray-100 rounded-[2rem] flex gap-6">
            <Layout className="w-8 h-8 text-[#1E90FF] shrink-0" />
            <p className="text-xs text-[#0A2A43]/50 font-medium leading-relaxed">
              The generator produces a high-fidelity 1080x1080 square dispatch. 
              Designed for Instagram, WhatsApp status, and high-impact social sharing. 
              Branding assets are pulled automatically from the system manifest.
            </p>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 text-center mb-2 tracking-[0.3em]">
            Export Stream Preview
          </label>
          <div className="flex justify-center">
            {/* The actual element to be grabbed */}
            <div 
              ref={cardRef}
              className={`w-[450px] h-[450px] relative overflow-hidden flex flex-col shadow-2xl rounded-2xl border-2 border-gray-50 transition-all duration-500`}
              style={{ backgroundColor: bgColor }}
            >
              {/* Background Layer */}
              <div className="absolute inset-0 overflow-hidden">
                {selectedArticle?.featuredImage && (
                  <img 
                    src={selectedArticle.featuredImage} 
                    alt="" 
                    className={`w-full h-full object-cover transition-all duration-700 ${templateId === 'dramatic' ? 'scale-110' : 'scale-100 opacity-60'}`} 
                    crossOrigin="anonymous" 
                  />
                )}
                {/* Overlays */}
                {templateId === 'modern' && <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A43] via-transparent to-[#0A2A43]/40" />}
                {templateId === 'dramatic' && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />}
                {templateId === 'editorial' && <div className="absolute inset-0 bg-white/10" />}
              </div>

              {/* Template: Modern */}
              {templateId === 'modern' && (
                <div className="relative z-10 flex flex-col h-full p-8">
                  <div className="flex justify-between items-start">
                    {settings?.logoUrl ? <img src={settings.logoUrl} className="h-10 filter brightness-0 invert" crossOrigin="anonymous" /> : <span className="font-black text-white text-xl">CBT</span>}
                    <div className="bg-[#E63946] text-white text-[10px] font-black px-4 py-1.5 rounded-lg tracking-widest uppercase">DISPATCH</div>
                  </div>
                  <div className="mt-auto">
                    <h2 className="text-4xl font-black text-white leading-none uppercase tracking-tighter mb-6">{customHeadline || 'HEADLINE'}</h2>
                    <div className="pt-6 border-t border-white/20 text-[9px] font-black text-white/60 uppercase tracking-widest flex justify-between">
                      <span>{selectedArticle?.category}</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Template: Dramatic */}
              {templateId === 'dramatic' && (
                <div className="relative z-10 flex flex-col h-full items-center justify-center p-12 text-center">
                  <div className="w-12 h-1 bg-[#1E90FF] mb-10" />
                  <h2 className="text-4xl font-black text-white leading-[0.9] uppercase tracking-tighter mb-8 italic">{customHeadline || 'HEADLINE'}</h2>
                  <div className="flex flex-col items-center gap-4">
                     <div className="bg-[#E63946] text-white text-[10px] font-black px-6 py-2 tracking-[0.2em] rounded-full uppercase">Breaking Alert</div>
                     <span className="text-[10px] font-black text-[#1E90FF] uppercase tracking-[0.3em]">COX BAZAR TIMES HQ</span>
                  </div>
                </div>
              )}

              {/* Template: Editorial */}
              {templateId === 'editorial' && (
                <div className="relative z-10 flex flex-col h-full bg-white/95 m-6 rounded-xl border-t-[10px] border-[#0A2A43] overflow-hidden">
                   <div className="p-8 border-b-4 border-[#0A2A43]/5 flex justify-between items-center">
                      <span className="font-black text-[#0A2A43] text-lg tracking-tighter">THE GAZETTE</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#1E90FF]">{new Date().toLocaleDateString()}</span>
                   </div>
                   <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                      <h2 className="text-3xl font-black text-[#0A2A43] leading-tight uppercase tracking-tight mb-8 underline decoration-[#1E90FF] decoration-8 underline-offset-8">{customHeadline || 'HEADLINE'}</h2>
                      <p className="text-xs font-bold text-[#0A2A43]/60 italic leading-relaxed">"Delivering the coastal perspective with unwavering authority and professional depth."</p>
                   </div>
                   <div className="bg-[#0A2A43] text-white p-4 text-center text-[8px] font-black tracking-widest uppercase">
                      Cox Bazar Official Broadcast System
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
