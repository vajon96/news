import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { NewsArticle } from '../../types';
import { 
  Users, 
  Newspaper, 
  Eye, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    publishedPosts: 0,
    recentPosts: [] as NewsArticle[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const newsRef = collection(db, 'news');
    const q = query(newsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let views = 0;
      let published = 0;
      const articles: NewsArticle[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data() as NewsArticle;
        views += (data.views || 0);
        if (data.status === 'published') published++;
        articles.push({ ...data, id: doc.id });
      });

      // Get 5 most recent
      const sorted = [...articles].sort((a, b) => 
        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      ).slice(0, 5);

      setStats({
        totalPosts: snapshot.size,
        totalViews: views,
        publishedPosts: published,
        recentPosts: sorted
      });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'news');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading dashboard stats...</div>;

  const statCards = [
    { label: 'Total Articles', value: stats.totalPosts, icon: Newspaper, border: 'border-[#0A2A43]' },
    { label: 'Total Page Views', value: stats.totalViews.toLocaleString(), icon: Eye, border: 'border-[#1E90FF]' },
    { label: 'Active Editors', value: 1, icon: Users, border: 'border-[#0A2A43]/20' },
    { label: 'Live Broadcasts', value: stats.publishedPosts, icon: TrendingUp, border: 'border-[#E63946]' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-white p-8 rounded-2xl shadow-sm border-t-[6px] transition-all hover:shadow-xl hover:-translate-y-1",
              stat.border
            )}
          >
            <div className="text-[10px] text-[#0A2A43]/40 mb-2 font-black uppercase tracking-widest">{stat.label}</div>
            <div className="text-4xl font-black tracking-tighter text-[#0A2A43] flex items-center gap-3">
              {stat.value}
              {i === 2 && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E90FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1E90FF]"></span>
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#1E90FF] mt-3 flex items-center font-black uppercase tracking-[0.2em]">
              {i === 0 ? `+${stats.totalPosts > 0 ? (stats.totalPosts > 12 ? '12' : stats.totalPosts) : '0'} THIS WEEK` : i === 1 ? '+5.2% VS LAST MONTH' : i === 2 ? 'SESSION ACTIVE' : 'NETWORK STABLE'}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent News Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border-2 border-gray-50 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b-2 border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-black text-[#0A2A43] uppercase tracking-tight">Recent Editorial Activity</h3>
            <Link to="/admin/manage" className="text-[#1E90FF] text-[10px] font-black uppercase tracking-widest hover:underline">
              Access Full Archive
            </Link>
          </div>
          <div className="flex-1 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#0A2A43] text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">
                <tr>
                  <th className="px-8 py-4">Headline</th>
                  <th className="px-8 py-4">Category</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">Views</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y-2 divide-gray-50">
                {stats.recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-[#F1F5F9]/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-[#0A2A43] truncate max-w-[300px]">
                      {post.title}
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-[#F1F5F9] text-[#0A2A43] text-[9px] font-black rounded-md border border-[#0A2A43]/5 uppercase tracking-widest">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "font-black text-[10px] uppercase tracking-widest",
                        post.status === 'published' ? "text-[#1E90FF]" : "text-orange-400"
                      )}>
                        {post.status === 'published' ? 'Live' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right tabular-nums text-[#0A2A43]/60 font-black">
                      {post.views?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Social Gen Preview Card */}
        <div className="bg-[#0A2A43] text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col border-b-[12px] border-[#1E90FF]">
          <h3 className="text-[10px] font-black uppercase text-[#1E90FF] mb-8 tracking-[0.3em]">Social Dispatch Preview</h3>
          
          <div className="flex flex-col gap-6 flex-1">
            <div className="bg-black/20 rounded-2xl overflow-hidden aspect-square border-2 border-white/5 flex flex-col relative group">
              {stats.recentPosts[0] && (
                <>
                  <img 
                    src={stats.recentPosts[0].featuredImage} 
                    alt="" 
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A43] via-[#0A2A43]/20 to-transparent flex flex-col justify-end p-6">
                    <span className="bg-[#E63946] text-white text-[9px] font-black px-3 py-1 rounded-md self-start mb-3 uppercase tracking-widest">
                      New Report
                    </span>
                    <h4 className="text-lg font-black leading-tight line-clamp-2 uppercase">
                      {stats.recentPosts[0].title}
                    </h4>
                  </div>
                </>
              )}
            </div>

            <Link 
              to="/admin/generator"
              className="w-full mt-auto py-5 bg-[#1E90FF] text-white font-black text-[11px] uppercase rounded-2xl hover:bg-white hover:text-[#0A2A43] transition-all flex items-center justify-center gap-3 tracking-[0.3em] shadow-xl"
            >
              Launch Generator
            </Link>
          </div>
          <TrendingUp className="absolute -bottom-20 -right-20 w-80 h-80 text-white opacity-[0.02] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

// Helper function for class names
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
