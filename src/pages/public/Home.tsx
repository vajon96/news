import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { NewsArticle } from '../../types';
import { formatDate } from '../../lib/utils';
import { 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  ChevronRight,
  Eye,
  FilterX,
  Newspaper
} from 'lucide-react';
import { motion } from 'motion/react';

import { aiSearchExpansion } from '../../services/geminiService';

export default function Home() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [featured, setFeatured] = useState<NewsArticle | null>(null);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'news'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );

        if (category) {
          q = query(q, where('category', '==', category));
        }

        const snap = await getDocs(q);
        const all = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as NewsArticle));
        
        let filtered = all;
        if (searchQuery) {
          // AI Search Expansion
          let queryTerms = [searchQuery.toLowerCase()];
          try {
            const extraTerms = await aiSearchExpansion(searchQuery);
            queryTerms = [...new Set([...queryTerms, ...extraTerms.map(t => t.toLowerCase())])];
            setSearchTerms(queryTerms);
          } catch (e) {
            console.warn("AI Search fallback to basic");
          }

          filtered = all.filter(a => 
            queryTerms.some(term => 
              a.title.toLowerCase().includes(term) ||
              a.content.toLowerCase().includes(term) ||
              a.excerpt.toLowerCase().includes(term) ||
              a.tags?.some(tag => tag.toLowerCase().includes(term))
            )
          );
        }

        setArticles(filtered.slice(1));
        setFeatured(filtered[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [category, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="h-[500px] bg-gray-100 rounded-2xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!featured && articles.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <FilterX className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold">No articles found</h2>
        <p className="text-gray-500">We couldn't find any news matches for "{searchQuery || category}".</p>
        <Link to="/" className="inline-flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest text-sm pt-4 hover:underline">
          Back to all news <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Featured Section */}
      {featured && !searchQuery && (
        <section className="relative group">
          <Link to={`/news/${featured.slug}`} className="block relative h-[450px] lg:h-[650px] overflow-hidden rounded-2xl shadow-3xl bg-[#F1F5F9]">
            {featured.featuredImage && featured.featuredImage.trim() !== "" ? (
              <img 
                src={featured.featuredImage} 
                alt={featured.title} 
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                 <Newspaper className="w-20 h-20 text-[#0A2A43]/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A43] via-[#0A2A43]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-16 text-white">
               <motion.div 
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6 max-w-4xl"
               >
                 <span className="bg-[#E63946] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md shadow-2xl flex items-center gap-2 w-fit">
                   <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                   Special Coverage
                 </span>
                 <h1 className="text-4xl lg:text-6xl font-black leading-[0.95] tracking-tighter uppercase">
                   {featured.title}
                 </h1>
                 <p className="text-white/90 line-clamp-2 text-xl max-w-3xl font-medium tracking-tight leading-relaxed">
                   {featured.excerpt}
                 </p>
                 <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.25em] text-white/60">
                    <span className="flex items-center gap-2 lg:bg-white/10 lg:px-4 lg:py-2 lg:rounded-full"><Clock className="w-4 h-4 text-[#1E90FF]" /> {formatDate(featured.createdAt?.toDate())}</span>
                    <span className="flex items-center gap-2 lg:bg-white/10 lg:px-4 lg:py-2 lg:rounded-full text-white/90"><TrendingUp className="w-4 h-4 text-[#1E90FF]" /> {featured.category}</span>
                 </div>
               </motion.div>
            </div>
          </Link>
        </section>
      )}

      {/* Grid Section */}
      <section className="space-y-12">
        <div className="flex items-center justify-between border-b-4 border-[#0A2A43] pb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#0A2A43]">
            {searchQuery ? `Search Results: ${searchQuery}` : category ? `${category} Pulse` : 'Coastal Reports'}
          </h2>
          {!searchQuery && !category && (
            <div className="hidden md:flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.4em] text-[#1E90FF]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E63946] animate-pulse shadow-[0_0_12px_rgba(230,57,70,0.6)]"></span>
              LIVE FEED
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {[...(searchQuery || category ? [featured, ...articles] : articles)].filter(Boolean).map((article, i) => (
            <motion.article 
              key={article!.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-50/50 hover:border-[#1E90FF]/20 overflow-hidden"
            >
              <Link to={`/news/${article!.slug}`} className="aspect-[16/10] overflow-hidden relative block bg-[#F1F5F9]">
                 {article!.featuredImage && article!.featuredImage.trim() !== "" ? (
                   <img 
                     src={article!.featuredImage} 
                     alt={article!.title} 
                     loading="lazy"
                     className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-12 h-12 text-[#0A2A43]/10" />
                   </div>
                 )}
                 <div className="absolute top-5 left-5 bg-[#0A2A43] text-white px-3 py-1 rounded shadow-xl text-[9px] font-black uppercase tracking-[0.2em] border border-white/10">
                   {article!.category}
                 </div>
              </Link>
              <div className="flex-1 p-7 space-y-5">
                 <div className="flex items-center gap-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#1E90FF]" /> {formatDate(article!.createdAt?.toDate())}</span>
                    <span className="flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-[#1E90FF]" /> {article!.views || 0}</span>
                 </div>
                 <Link to={`/news/${article!.slug}`} className="block">
                    <h3 className="text-2xl font-black tracking-tight leading-[1.1] group-hover:text-[#1E90FF] transition-colors uppercase text-[#0A2A43]">
                       {article!.title}
                    </h3>
                 </Link>
                 <p className="text-gray-500 text-base line-clamp-3 leading-relaxed font-medium">
                   {article!.excerpt}
                 </p>
              </div>
              <div className="px-7 pb-7 mt-auto">
                <Link 
                  to={`/news/${article!.slug}`} 
                  className="w-full flex items-center justify-between text-[12px] font-black uppercase tracking-[0.2em] bg-[#F1F5F9] text-[#0A2A43] group-hover:bg-[#0A2A43] group-hover:text-white px-5 py-4 rounded-xl transition-all duration-300 transform active:scale-95"
                >
                  Explore Story <ChevronRight className="w-5 h-5 text-[#1E90FF]" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Subscription Callout */}
      <section className="bg-[#0A2A43] text-white rounded-3xl p-10 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-16 border-t-[12px] border-[#1E90FF] shadow-3xl relative overflow-hidden">
         <div className="max-w-2xl space-y-8 text-center lg:text-left relative z-10">
           <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Coastal<br/>Newsletter</h2>
           <p className="text-gray-300 font-medium leading-relaxed text-xl max-w-lg">
             The most reliable coastal updates and global headlines delivered straight to your inbox every morning. 
           </p>
         </div>
         <div className="w-full lg:w-auto flex flex-col md:flex-row gap-5 relative z-10">
            <input 
              type="email" 
              placeholder="Your email address"
              className="bg-white/10 border-2 border-white/20 px-8 py-5 rounded-2xl text-white min-w-[340px] focus:outline-none focus:border-[#1E90FF] transition-all placeholder:text-white/30 font-bold text-lg shadow-inner"
            />
            <button className="bg-[#1E90FF] text-white hover:bg-white hover:text-[#0A2A43] px-12 py-5 rounded-2xl font-black uppercase transition-all shadow-2xl text-sm tracking-[0.2em] transform hover:-translate-y-1 active:translate-y-0">
              Subscribe
            </button>
         </div>
         <div className="absolute top-0 right-0 w-1/3 h-full bg-[#1E90FF] opacity-[0.03] skew-x-[15deg] translate-x-20"></div>
         <TrendingUp className="absolute -bottom-20 -right-20 w-80 h-80 text-white opacity-[0.03] pointer-events-none" />
      </section>
    </div>
  );
}
