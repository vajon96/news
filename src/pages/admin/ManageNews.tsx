import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { NewsArticle } from '../../types';
import { 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink, 
  MoreHorizontal,
  Eye,
  Clock,
  Filter
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export default function ManageNews() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNews = async () => {
    const path = 'news';
    try {
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as NewsArticle));
      setNews(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDelete = async (id: string) => {
    const path = `news/${id}`;
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteDoc(doc(db, 'news', id));
      toast.success('Article deleted');
      setNews(news.filter(n => n.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      toast.error('Failed to delete article');
    }
  };

  const toggleStatus = async (article: NewsArticle) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    const path = `news/${article.id}`;
    try {
      await updateDoc(doc(db, 'news', article.id!), { status: newStatus });
      toast.success(`Succesfully set to ${newStatus}`);
      setNews(news.map(n => n.id === article.id ? { ...n, status: newStatus as any } : n));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      toast.error('Failed to update status');
    }
  };

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-[#0A2A43]/40 font-black uppercase tracking-[0.4em] animate-pulse">Accessing Archive Registry...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0A2A43] uppercase tracking-tighter">Editorial Archive</h1>
          <p className="text-[#1E90FF] font-black text-[10px] uppercase tracking-[0.3em] mt-1">Story Distribution Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#1E90FF] transition-colors" />
            <input
              type="text"
              placeholder="Search news records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-2 border-gray-50 rounded-2xl px-6 py-4 pl-12 text-sm font-bold text-[#0A2A43] focus:border-[#1E90FF] focus:outline-none w-full md:w-80 shadow-sm transition-all"
            />
          </div>
          <button className="bg-white border-2 border-gray-50 p-4 rounded-2xl hover:border-[#1E90FF] transition-all shadow-sm group">
            <Filter className="w-5 h-5 text-gray-400 group-hover:text-[#1E90FF]" />
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-50 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A2A43] text-white">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Story Identification</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Classification</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-center">Broadcast status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Impact score</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-50">
              {filteredNews.map((article) => (
                <tr key={article.id} className="hover:bg-[#F1F5F9]/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-12 rounded-xl bg-[#F1F5F9] overflow-hidden shrink-0 border-2 border-gray-100 shadow-inner">
                        {article.featuredImage && (
                          <img src={article.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        )}
                      </div>
                      <div className="max-w-xs xl:max-w-md">
                        <p className="font-black text-[#0A2A43] text-base uppercase tracking-tight truncate group-hover:text-[#1E90FF] transition-colors">{article.title}</p>
                        <div className="flex items-center gap-2 text-[9px] text-[#0A2A43]/40 mt-1 uppercase font-black tracking-widest">
                          <Clock className="w-3.5 h-3.5 text-[#1E90FF]" /> {article.createdAt?.toDate ? formatDate(article.createdAt.toDate()) : 'Recently'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-black uppercase bg-[#F1F5F9] text-[#0A2A43]/60 px-3 py-1 rounded-lg border border-[#0A2A43]/5 tracking-widest">
                      {article.category}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <button
                      onClick={() => toggleStatus(article)}
                      className={cn(
                        "text-[9px] font-black uppercase px-4 py-2 rounded-xl flex items-center gap-2 mx-auto transition-all transform active:scale-95 border-2",
                        article.status === 'published' 
                          ? "bg-[#1E90FF]/10 text-[#1E90FF] border-[#1E90FF]/20 hover:bg-[#1E90FF] hover:text-white" 
                          : "bg-orange-50 text-orange-400 border-orange-100 hover:bg-orange-400 hover:text-white shadow-sm"
                      )}
                    >
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        article.status === 'published' ? "bg-current animate-pulse" : "bg-current"
                      )}></span>
                      {article.status}
                    </button>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3 text-xs font-black text-[#0A2A43]/60">
                      <Eye className="w-5 h-5 text-[#1E90FF]/40" />
                      <span>{article.views || 0}</span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/news/${article.slug}`}
                        target="_blank"
                        className="p-3 bg-[#F1F5F9] hover:bg-[#0A2A43] rounded-xl text-[#0A2A43] hover:text-white transition-all shadow-sm"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/admin/edit/${article.id}`}
                        className="p-3 bg-[#F1F5F9] hover:bg-[#1E90FF] rounded-xl text-[#0A2A43] hover:text-white transition-all shadow-sm"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id!)}
                        className="p-3 bg-red-50 hover:bg-[#E63946] rounded-xl text-[#E63946] hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredNews.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-24 text-center text-[#0A2A43]/30 font-black uppercase tracking-[0.2em]">
                    No matching records found in the newsroom archives.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
