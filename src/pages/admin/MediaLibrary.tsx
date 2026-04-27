import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { NewsArticle } from '../../types';
import { 
  Image as ImageIcon, 
  Search, 
  ExternalLink,
  Copy,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function MediaLibrary() {
  const [images, setImages] = useState<{url: string, title: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const allImages: {url: string, title: string}[] = [];
        snap.forEach(doc => {
          const data = doc.data() as NewsArticle;
          if (data.featuredImage) {
            allImages.push({ url: data.featuredImage, title: data.title });
          }
        });
        setImages(allImages);
      } catch (error) {
        toast.error('Failed to load media');
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  if (loading) return <div className="p-12 text-center text-[#0A2A43]/40 font-black uppercase tracking-[0.4em] animate-pulse">Scanning Media Assets...</div>;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0A2A43] uppercase tracking-tighter">Media Repository</h1>
          <p className="text-[#1E90FF] font-black text-[10px] uppercase tracking-[0.3em] mt-1">Central Asset Stream</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {images.map((img, i) => (
          <div key={i} className="group bg-white border-2 border-gray-50 rounded-[2rem] overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-500">
            <div className="aspect-square relative overflow-hidden bg-[#F1F5F9]">
              <img 
                src={img.url} 
                alt="" 
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-[#0A2A43]/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                <button 
                  onClick={() => copyToClipboard(img.url)}
                  className="p-4 bg-white text-[#0A2A43] hover:bg-[#1E90FF] hover:text-white rounded-2xl shadow-2xl transition-all hover:scale-110"
                  title="Copy URL"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <a 
                  href={img.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-4 bg-white text-[#0A2A43] hover:bg-[#1E90FF] hover:text-white rounded-2xl shadow-2xl transition-all hover:scale-110"
                  title="Open full size"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="p-5 bg-white">
              <p className="text-[9px] text-[#0A2A43]/60 font-black truncate uppercase tracking-widest" title={img.title}>
                {img.title}
              </p>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-full p-32 text-center border-4 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30">
            <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-[#0A2A43]/40 font-black uppercase tracking-[0.2em] text-xs">No media assets indexed in the news stream.</p>
          </div>
        )}
      </div>
    </div>
  );
}
