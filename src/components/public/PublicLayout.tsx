import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { NewsArticle, SiteSettings, NEWS_CATEGORIES } from '../../types';
import { 
  Menu, 
  X, 
  Search, 
  Newspaper, 
  Facebook, 
  Twitter as  TwitterIcon, // Actually user requested Lucide icons
  Instagram,
  Youtube,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function PublicLayout() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [breakingNews, setBreakingNews] = useState<NewsArticle[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setSettings(doc.data() as SiteSettings);
    });

    // Fetch breaking news (latest 5 published)
    const q = query(
      collection(db, 'news'),
      where('status', '==', 'published'),
      limit(5)
    );
    const unsubNews = onSnapshot(q, (snap) => {
      setBreakingNews(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as NewsArticle)));
    });

    return () => {
      unsubSettings();
      unsubNews();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0A2A43] font-sans selection:bg-[#1E90FF] selection:text-white">
      {/* Top Ticker */}
      <div className="bg-[#E63946] text-white py-2 text-[10px] uppercase font-bold tracking-widest overflow-hidden h-10 sticky top-0 z-[60] flex items-center shadow-lg">
        <div className="px-6 border-r border-white/20 whitespace-nowrap bg-[#E63946] z-10 hidden md:block">
          Breaking News
        </div>
        <div className="flex-1 whitespace-nowrap">
           <div className="animate-marquee inline-block">
             {breakingNews.map((news, i) => (
                <Link key={i} to={`/news/${news.slug}`} className="hover:underline mx-8 inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  {news.title}
                </Link>
             ))}
             {/* Duplicate for infinite effect */}
             {breakingNews.map((news, i) => (
                <Link key={`dup-${i}`} to={`/news/${news.slug}`} className="hover:underline mx-8 inline-flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  {news.title}
                </Link>
             ))}
           </div>
        </div>
        <div className="px-6 hidden xl:block border-l border-white/20 text-[8px] opacity-80">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Main Navigation */}
      <header className="border-b border-gray-100 bg-white sticky top-10 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4 group shrink-0">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.siteName} className="h-10 lg:h-14 w-auto object-contain" />
            ) : (
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter uppercase leading-none text-[#0A2A43]">
                  COX BAZAR
                </span>
                <span className="text-sm font-bold tracking-[0.25em] uppercase text-[#1E90FF] mt-1 flex items-center gap-2">
                  <span className="h-[2px] w-4 bg-[#E63946]"></span> TIMES
                </span>
              </div>
            )}
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {['Politics', 'Business', 'Technology', 'Sports', 'National', 'World'].map((cat) => (
              <Link 
                key={cat} 
                to={`/?category=${cat}`} 
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#0A2A43]/70 hover:text-[#1E90FF] transition-colors relative group"
              >
                {cat}
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#1E90FF] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors text-[#0A2A43]"
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-gray-100 hidden md:block"></div>
            <Link to="/admin/login" className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A2A43]/50 hover:text-[#1E90FF] transition-colors">
              Staff Portal <ArrowRight className="w-3 h-3" />
            </Link>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-30 left-0 right-0 bg-white border-b border-gray-200 z-[70] p-4 shadow-xl"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <Search className="w-6 h-6 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search articles, categories, editorial archives..." 
                className="flex-1 py-4 text-xl font-medium focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                      window.location.href = `/?search=${(e.target as HTMLInputElement).value}`;
                      setSearchOpen(false);
                   }
                }}
              />
              <button onClick={() => setSearchOpen(false)}>
                <X className="w-6 h-6 hover:text-red-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[100] p-8 lg:hidden flex flex-col"
          >
             <div className="flex justify-between items-center mb-12">
               <span className="font-black text-2xl tracking-tighter uppercase">MENU</span>
               <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                 <X className="w-8 h-8" />
               </button>
             </div>
             <nav className="flex flex-col gap-6 text-3xl font-black uppercase tracking-tighter">
               {['Politics', 'Business', 'Technology', 'Science', 'Sports', 'Lifestyle'].map((cat, i) => (
                 <motion.div
                   key={cat}
                   initial={{ x: -20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ delay: i * 0.05 }}
                 >
                   <Link onClick={() => setIsMenuOpen(false)} to={`/?category=${cat}`} className="hover:text-red-600">{cat}</Link>
                 </motion.div>
               ))}
               <Link onClick={() => setIsMenuOpen(false)} to="/admin/login" className="text-xl text-gray-400 mt-8">STAFF PORTAL</Link>
             </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer-gradient bg-[#0A2A43] text-white pt-24 pb-12 mt-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#E63946]"></div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-20">
          <div className="col-span-1 md:col-span-2 space-y-8">
             <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter uppercase leading-none">
                  COX BAZAR
                </span>
                <span className="text-sm font-bold tracking-[0.25em] uppercase text-[#1E90FF] mt-1 flex items-center gap-2">
                  <span className="h-[2px] w-4 bg-[#E63946]"></span> TIMES
                </span>
             </div>
             <p className="text-gray-300 max-w-sm leading-relaxed text-sm font-medium">
               Providing authoritative news, coastal insights, and global reporting from the world's longest natural sea beach. 
               Your reliable window to the world.
             </p>
             <div className="flex gap-4">
               <a href="#" className="p-3 bg-white/5 hover:bg-[#1E90FF] hover:scale-110 rounded-full transition-all duration-300"><Facebook className="w-5 h-5" /></a>
               <a href="#" className="p-3 bg-white/5 hover:bg-[#1E90FF] hover:scale-110 rounded-full transition-all duration-300"><Instagram className="w-5 h-5" /></a>
               <a href="#" className="p-3 bg-white/5 hover:bg-[#1E90FF] hover:scale-110 rounded-full transition-all duration-300"><Youtube className="w-5 h-5" /></a>
             </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold uppercase tracking-widest text-[10px] text-[#1E90FF]">Editorial Desk</h4>
            <nav className="flex flex-col gap-3 text-sm text-gray-300 font-medium">
              {['National', 'International', 'Business', 'Sports', 'Entertainment', 'Science'].map(cat => (
                <Link key={cat} to={`/?category=${cat}`} className="hover:text-[#1E90FF] transition-colors">{cat}</Link>
              ))}
            </nav>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold uppercase tracking-widest text-[10px] text-[#1E90FF]">Corporate Info</h4>
            <nav className="flex flex-col gap-3 text-sm text-gray-300 font-medium">
              <a href="#" className="hover:text-[#1E90FF] transition-colors">Coastal Subscriptions</a>
              <a href="#" className="hover:text-[#1E90FF] transition-colors">Privacy & Data Shield</a>
              <a href="#" className="hover:text-[#1E90FF] transition-colors">Editorial Guidelines</a>
              <a href="#" className="hover:text-[#1E90FF] transition-colors">Digital Ad Sales</a>
            </nav>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <p className="flex items-center gap-2">
            © {new Date().getFullYear()} {settings?.siteName || 'Cox Bazar Times'}. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8">
            <p>HQ: DHAKA / COX'S BAZAR</p>
            <p className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              NETWORK ACTIVE
            </p>
          </div>
        </div>
      </footer>

      {/* Styled Marquee Animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
