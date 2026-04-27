import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { db } from '../../lib/firebase';
import { NewsArticle } from '../../types';
import { formatDate } from '../../lib/utils';
import { 
  Clock, 
  Eye, 
  Share2, 
  Link as LinkIcon, 
  Facebook, 
  Twitter as TwitterIcon,
  MessageCircle,
  ChevronLeft,
  Calendar,
  User,
  ArrowRight,
  Newspaper,
  Loader2,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { translateContent } from '../../services/geminiService';

export default function ArticleView() {
  const { slug } = useParams();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const handleTranslate = async (lang: string) => {
    if (!article) return;
    setTranslating(true);
    try {
      const result = await translateContent(article.content, lang);
      setTranslatedContent(result);
      toast.success(`Broadcasting in ${lang}`);
    } catch (e) {
      toast.error('Translation network failure');
    } finally {
      setTranslating(false);
    }
  };

  const handleAiSummary = async () => {
    if (!article) return;
    setGeneratingSummary(true);
    try {
      const result = await translateContent(article.content, "English (Concise Bullet Points Summary)");
      setSummary(result);
      toast.success('AI Briefing Ready');
    } catch (e) {
      toast.error('Briefing generation error');
    } finally {
      setGeneratingSummary(false);
    }
  };

  useEffect(() => {
    if (!slug) return;

    window.scrollTo(0, 0);

    const q = query(
      collection(db, 'news'),
      where('slug', '==', slug),
      where('status', '==', 'published')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data() as NewsArticle;
        setArticle({ ...data, id: snap.docs[0].id });
        
        // Fetch related articles
        async function fetchRelated() {
          const rq = query(
            collection(db, 'news'),
            where('category', '==', data.category),
            where('status', '==', 'published'),
            where('slug', '!=', slug)
          );
          const rs = await getDocs(rq);
          setRelated(rs.docs.map(d => ({ ...d.data(), id: d.id } as NewsArticle)));
        }
        fetchRelated();
      }
      setLoading(false);
    });

    // Increment view count
    const incrementView = async () => {
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, 'news', snap.docs[0].id), {
          views: increment(1)
        });
      }
    };
    incrementView();

    return () => unsubscribe();
  }, [slug]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Secure link generated and copied');
    setShowShareModal(false);
  };

  const shareWA = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${article?.title} - ${window.location.href}`)}`;
    window.open(url, '_blank');
  };

  const shareFB = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareTW = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article?.title || '')}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-12 py-24 px-4">
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 rounded-full w-1/4 animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-2xl w-full animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-xl w-3/4 animate-pulse" />
      </div>
      <div className="aspect-video bg-gray-50 rounded-[40px] animate-pulse" />
      <div className="space-y-4">
        <div className="h-6 bg-gray-50 rounded-lg w-full animate-pulse" />
        <div className="h-6 bg-gray-50 rounded-lg w-full animate-pulse" />
        <div className="h-6 bg-gray-50 rounded-lg w-2/3 animate-pulse" />
      </div>
    </div>
  );
  
  if (!article) return (
    <div className="max-w-4xl mx-auto p-12 text-center py-40">
      <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter text-[#0A2A43]">ARCHIVED OR MISSING</h2>
      <p className="text-[#0A2A43]/60 mb-8 font-medium">The requested publication path does not exist in our current frequency.</p>
      <Link to="/" className="inline-flex items-center gap-3 bg-[#1E90FF] text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#0A2A43] transition-all shadow-xl">
        <ChevronLeft className="w-4 h-4" /> Reset Frequency
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 px-4 lg:px-0">
      <Helmet>
        <title>{article.title} | Cox Bazar Times</title>
        <meta name="description" content={article.excerpt || article.title} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.featuredImage} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Back navigation */}
      <Link to="/" className="inline-flex items-center gap-3 text-[10px] font-black text-[#0A2A43]/50 uppercase tracking-[0.3em] hover:text-[#1E90FF] transition-all group">
         <div className="w-10 h-10 rounded-full border-2 border-gray-100 flex items-center justify-center group-hover:border-[#1E90FF] transition-colors">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
         </div>
         Back to Newsroom
      </Link>

      {/* Header */}
      <header className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <span className="bg-[#0A2A43] text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl rounded-md border border-white/10">
              {article.category}
            </span>
            <div className="flex items-center gap-6 text-[10px] font-black text-[#0A2A43]/40 uppercase tracking-widest">
               <span className="flex items-center gap-2 lg:bg-[#F1F5F9] lg:px-4 lg:py-2 lg:rounded-full"><Calendar className="w-4 h-4 text-[#1E90FF]" /> {formatDate(article.createdAt?.toDate())}</span>
               <span className="flex items-center gap-2 lg:bg-[#F1F5F9] lg:px-4 lg:py-2 lg:rounded-full"><Eye className="w-4 h-4 text-[#1E90FF]" /> {article.views || 0} READS</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={handleAiSummary}
               disabled={generatingSummary}
               className="flex items-center gap-2 bg-[#0A2A43] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#1E90FF] transition-all shadow-lg shadow-[#0A2A43]/10"
             >
               {generatingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-[#00B894]" />}
               AI Briefing
             </button>
             <div className="relative group/translate">
                <button className="flex items-center gap-2 bg-white border border-gray-100 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#0A2A43] hover:border-[#1E90FF] transition-all shadow-sm">
                  {translating ? <Loader2 className="w-3 h-3 animate-spin text-[#1E90FF]" /> : <Globe className="w-3 h-3 text-[#1E90FF]" />}
                  Translate
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover/translate:opacity-100 group-hover/translate:visible transition-all z-50 p-2 space-y-1">
                   {['Bengali', 'Urdu', 'Hindi', 'Arabic', 'Chinese'].map(lang => (
                     <button 
                        key={lang}
                        onClick={() => handleTranslate(lang)}
                        className="w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-[#0A2A43] hover:bg-[#1E90FF]/5 hover:text-[#1E90FF] rounded-xl transition-colors"
                     >
                        {lang}
                     </button>
                   ))}
                   {translatedContent && (
                     <button 
                        onClick={() => setTranslatedContent(null)}
                        className="w-full text-center mt-2 pt-2 border-t border-gray-50 text-[8px] font-black text-[#E63946] uppercase"
                     >
                        Reset Language
                     </button>
                   )}
                </div>
             </div>
          </div>
        </div>
        <h1 className="text-4xl lg:text-7xl font-black leading-[0.95] tracking-tighter uppercase text-[#0A2A43]">
          {article.title}
        </h1>
        {summary && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-[#1E90FF]/5 border-l-[12px] border-[#00B894] p-8 rounded-r-3xl space-y-4"
          >
            <p className="text-[10px] font-black uppercase text-[#1E90FF] tracking-[0.3em]">AI Executive Briefing</p>
            <div className="text-sm font-bold text-[#0A2A43] leading-relaxed whitespace-pre-line">
              {summary}
            </div>
            <button onClick={() => setSummary(null)} className="text-[8px] font-black uppercase text-[#0A2A43]/30 hover:text-[#E63946]">Dismiss Briefing</button>
          </motion.div>
        )}
        <p className="text-xl lg:text-3xl text-[#0A2A43]/70 font-bold leading-relaxed border-l-[12px] border-[#1E90FF] pl-8 py-3">
          {article.excerpt}
        </p>
      </header>

      {/* Featured Image */}
      <figure className="relative rounded-3xl overflow-hidden shadow-3xl border-4 border-gray-50 bg-[#F1F5F9]">
         {article.featuredImage && article.featuredImage.trim() !== "" ? (
           <img 
             src={article.featuredImage} 
             alt={article.title} 
             loading="lazy"
             className="w-full h-auto object-cover max-h-[700px] hover:scale-[1.02] transition-transform duration-1000"
           />
         ) : (
           <div className="py-32 flex flex-col items-center justify-center space-y-6">
              <Newspaper className="w-24 h-24 text-[#0A2A43]/10" />
              <p className="text-[#0A2A43]/20 font-black uppercase tracking-[0.4em] text-xs leading-none">News Broadcast</p>
           </div>
         )}
         <div className="absolute top-8 right-8">
           <div className="w-14 h-14 bg-white/30 backdrop-blur-xl rounded-2xl flex items-center justify-center font-black italic text-white shadow-2xl border border-white/40">
             CBT
           </div>
         </div>
      </figure>

      {/* Social / Sharing */}
      <div className="flex items-center justify-between border-2 border-gray-50 py-10 bg-gray-50/30 px-8 rounded-3xl">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl border-4 border-[#1E90FF] p-1 flex items-center justify-center bg-white shadow-inner font-black text-[#0A2A43]">
             CBT
           </div>
           <div>
             <p className="text-sm font-black uppercase tracking-tight text-[#0A2A43]">Editorial Staff</p>
             <p className="text-[10px] text-[#1E90FF] font-black uppercase tracking-widest">COX BAZAR TIMES HQ</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowShareModal(true)}
             className="flex items-center gap-4 bg-[#0A2A43] text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#1E90FF] transition-all shadow-2xl active:scale-95 group"
           >
             <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Share Story
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-8 lg:p-16 rounded-3xl shadow-sm border-2 border-gray-50">
        <article 
          className="prose prose-xl max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-headings:text-[#0A2A43] prose-p:leading-relaxed prose-p:text-[#0A2A43]/80 prose-p:font-medium prose-strong:text-[#0A2A43] prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: translatedContent || article.content }}
        />
      </div>

      {/* Related News */}
      {related.length > 0 && (
        <section className="pt-24 border-t-8 border-[#0A2A43] space-y-12">
           <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black uppercase tracking-tighter text-[#0A2A43]">Related Coverage</h3>
              <div className="h-1 bg-[#F1F5F9] flex-1 mx-10 rounded-full" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {related.slice(0, 4).map(rel => (
                <motion.div key={rel.id} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                  <Link to={`/news/${rel.slug}`} className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all border-2 border-gray-50 hover:border-[#1E90FF]/20 overflow-hidden h-full">
                    <div className="aspect-[16/9] overflow-hidden bg-[#F1F5F9]">
                       {rel.featuredImage && rel.featuredImage.trim() !== "" ? (
                         <img 
                           src={rel.featuredImage} 
                           alt="" 
                           loading="lazy"
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="w-10 h-10 text-[#0A2A43]/10" />
                         </div>
                       )}
                    </div>
                    <div className="p-8 space-y-4">
                       <p className="text-[10px] font-black text-[#1E90FF] uppercase tracking-[0.2em]">{rel.category}</p>
                       <h4 className="font-black text-xl leading-tight uppercase text-[#0A2A43] group-hover:text-[#1E90FF] transition-colors line-clamp-2">{rel.title}</h4>
                       <div className="flex items-center justify-between mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <span>{formatDate(rel.createdAt?.toDate())}</span>
                         <ArrowRight className="w-5 h-5 text-[#1E90FF] opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                       </div>
                    </div>
                  </Link>
                </motion.div>
             ))}
           </div>
        </section>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0A2A43]/90 backdrop-blur-xl"
          >
             <div className="absolute inset-0" onClick={() => setShowShareModal(false)} />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 30 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               className="relative w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-[0_48px_96px_-12px_rgba(0,0,0,0.6)]"
             >
                <div className="bg-[#0A2A43] p-10 text-white relative">
                  <div className="flex justify-between items-center relative z-10">
                    <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">COX BAZAR<br/><span className="text-[#1E90FF]">TIMES</span></h3>
                    <button onClick={() => setShowShareModal(false)} className="p-3 border-2 border-white/20 rounded-2xl hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-6 relative z-10">Story Distribution Channel</p>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#1E90FF] opacity-10 rounded-full -translate-y-12 translate-x-12 blur-3xl"></div>
                </div>

                <div className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={shareFB}
                      className="flex flex-col items-center gap-4 p-8 bg-[#F1F5F9] rounded-2xl hover:bg-blue-600 hover:text-white transition-all group border-2 border-transparent"
                    >
                      <Facebook className="w-8 h-8 group-hover:scale-125 transition-transform duration-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Facebook</span>
                    </button>
                    <button 
                      onClick={shareWA}
                      className="flex flex-col items-center gap-4 p-8 bg-[#F1F5F9] rounded-2xl hover:bg-green-600 hover:text-white transition-all group border-2 border-transparent"
                    >
                      <MessageCircle className="w-8 h-8 group-hover:scale-125 transition-transform duration-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                    </button>
                  </div>
                  <button 
                    onClick={copyLink}
                    className="w-full flex items-center justify-center gap-4 py-6 bg-[#0A2A43] text-white hover:bg-[#1E90FF] rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] transition-all shadow-2xl active:scale-95"
                  >
                    <LinkIcon className="w-5 h-5" /> Copy Secure Link
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
