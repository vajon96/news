import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { NEWS_CATEGORIES, NewsArticle, NewsStatus } from '../../types';
import { slugify } from '../../lib/utils';
import { 
  Save, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Send,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function AddNews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: NEWS_CATEGORIES[0],
    content: '',
    status: 'draft' as NewsStatus,
    featuredImage: '',
    excerpt: ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    if (id) {
      async function fetchArticle() {
        const path = `news/${id}`;
        try {
          const docRef = doc(db, 'news', id!);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as NewsArticle;
            setFormData({
              title: data.title,
              category: data.category,
              content: data.content,
              status: data.status,
              featuredImage: data.featuredImage,
              excerpt: data.excerpt || ''
            });
            setImagePreview(data.featuredImage);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
          toast.error('Failed to fetch article');
        } finally {
          setFetching(false);
        }
      }
      fetchArticle();
    }
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    try {
      const storageRef = ref(storage, `news_images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, featuredImage: url }));
      setImagePreview(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, forcedStatus?: NewsStatus) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    const slug = slugify(formData.title);
    const status = forcedStatus || formData.status;

    const postData = {
      ...formData,
      slug,
      status,
      updatedAt: serverTimestamp(),
      authorId: auth.currentUser?.uid || 'admin',
    };

    try {
      if (id) {
        await updateDoc(doc(db, 'news', id), postData);
        toast.success('Article updated');
      } else {
        await addDoc(collection(db, 'news'), {
          ...postData,
          createdAt: serverTimestamp(),
          views: 0,
          images: []
        });
        toast.success('Article created');
      }
      navigate('/admin/manage');
    } catch (error) {
      const path = id ? `news/${id}` : 'news';
      handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, path);
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-12 text-center text-[#0A2A43]/40 font-black uppercase tracking-[0.4em] animate-pulse">Accessing Archive...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border-2 border-gray-50">
        <div>
          <h1 className="text-3xl font-black text-[#0A2A43] uppercase tracking-tighter">{id ? 'Edit Report' : 'Draft New Story'}</h1>
          <p className="text-[#1E90FF] font-black text-[10px] uppercase tracking-[0.3em] mt-1">Editorial Content Engine</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={loading}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#F1F5F9] text-[#0A2A43] hover:bg-[#E2E8F0] transition-all text-xs font-black uppercase tracking-widest shadow-sm active:scale-95"
          >
            <Save className="w-5 h-5 text-[#1E90FF]" /> Save Draft
          </button>
          <button
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={loading}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#0A2A43] text-white hover:bg-[#1E90FF] transition-all text-xs font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transform"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Publish to Feed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border-2 border-gray-50 rounded-[2rem] p-10 space-y-8 shadow-sm">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-3 tracking-[0.2em]">Headline</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-2xl p-5 text-2xl font-black text-[#0A2A43] focus:border-[#1E90FF] focus:bg-white focus:outline-none transition-all shadow-inner placeholder:text-[#0A2A43]/20"
                placeholder="Story title goes here..."
              />
              <div className="mt-3 text-[9px] font-black text-[#0A2A43]/40 uppercase tracking-widest flex items-center gap-2">
                <span className="bg-[#1E90FF]/10 text-[#1E90FF] px-2 py-1 rounded">URL PATH:</span> 
                <span className="text-[#0A2A43]">/news/{slugify(formData.title) || '...'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-3 tracking-[0.2em]">Brief Synopsis (SEO)</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-2xl p-5 text-sm font-medium text-[#0A2A43] focus:border-[#1E90FF] focus:bg-white focus:outline-none h-28 resize-none shadow-inner transition-all placeholder:text-[#0A2A43]/20"
                placeholder="High-level summary for news cards and social feeds..."
              />
            </div>

            <div>
               <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-3 tracking-[0.2em]">Detailed Coverage</label>
               <div className="prose-editor">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Draft your full story here..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      ['blockquote', 'code-block'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                />
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          {/* Metadata */}
          <div className="bg-white border-2 border-gray-50 rounded-[2rem] p-10 space-y-10 shadow-sm">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-4 tracking-[0.2em]">Journalism Category</label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-xl p-4 text-sm font-black text-[#0A2A43] focus:border-[#1E90FF] focus:bg-white focus:outline-none appearance-none transition-all shadow-inner"
                >
                  {NEWS_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E90FF] rotate-90 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-4 tracking-[0.2em]">Featured Visual</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video bg-[#F1F5F9] border-4 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#1E90FF] transition-all group overflow-hidden relative shadow-inner"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#0A2A43]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                      <div className="bg-white text-[#0A2A43] p-4 rounded-2xl shadow-2xl">
                        <Upload className="w-6 h-6" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-5 bg-white rounded-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8 text-[#1E90FF]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0A2A43]/30 group-hover:text-[#1E90FF]">Upload Assets</span>
                  </>
                )}
                {uploadProgress && (
                  <div className="absolute inset-0 bg-[#0A2A43]/90 backdrop-blur-md flex items-center justify-center z-20">
                    <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              {imagePreview && (
                <button 
                  onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, featuredImage: '' })); }}
                  className="mt-4 text-[10px] font-black text-[#E63946] hover:bg-[#E63946]/5 px-4 py-2 rounded-lg uppercase tracking-widest flex items-center gap-2 transition-all mx-auto"
                >
                  <X className="w-4 h-4" /> Remove Visual
                </button>
              )}
            </div>
          </div>

          {/* Visibility Info */}
          <div className="bg-[#0A2A43] text-white rounded-[2rem] p-10 shadow-xl relative overflow-hidden">
            <div className="flex gap-5 relative z-10">
              <Eye className="w-8 h-8 text-[#1E90FF] shrink-0" />
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">Broadcast Status</p>
                <p className="text-[10px] text-white/40 mt-3 font-medium leading-relaxed tracking-wide">
                  This report is currently in <span className="text-[#1E90FF] font-black uppercase">{formData.status}</span> mode. 
                  Live publication will push this story to the top of the global stream immediately.
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#1E90FF] opacity-10 rounded-full translate-x-12 -translate-y-12 blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
