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
  Eye,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { generateImageVariants, isValidImageFormat } from '../../lib/imageUtils';
import { generateAIExtras, aiGenerateDraft } from '../../services/geminiService';
import confetti from 'canvas-confetti';

export default function AddNews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiDraftPrompt, setAiDraftPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: NEWS_CATEGORIES[0],
    content: '',
    status: 'draft' as NewsStatus,
    featuredImage: '',
    featuredImageThumb: '',
    featuredImageMedium: '',
    excerpt: '',
    tags: [] as string[]
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [altTextSuggestion, setAltTextSuggestion] = useState('');

  const handleAIDraft = async () => {
    if (!aiDraftPrompt) return;
    setAiProcessing(true);
    try {
      const draft = await aiGenerateDraft(aiDraftPrompt);
      setFormData(prev => ({
        ...prev,
        title: draft.title || prev.title,
        content: draft.content || prev.content,
        excerpt: draft.excerpt || prev.excerpt,
        category: draft.category || prev.category
      }));
      setShowAiModal(false);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1E90FF', '#00B894', '#0A2A43']
      });
      toast.success('AI Journalist Draft Generated');
    } catch (e) {
      toast.error('AI Draft frequency failed');
    } finally {
      setAiProcessing(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and Content required for AI analysis');
      return;
    }

    setAiProcessing(true);
    try {
      const aiData = await generateAIExtras(formData.title, formData.content);
      setFormData(prev => ({
        ...prev,
        excerpt: aiData.excerpt || prev.excerpt,
        category: aiData.category || prev.category,
      }));
      setAltTextSuggestion(aiData.altText || '');
      toast.success('AI Data Synthesis Complete');
    } catch (error) {
      toast.error('AI Processing encountered a frequency error');
    } finally {
      setAiProcessing(false);
    }
  };

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
              featuredImageThumb: data.featuredImageThumb || '',
              featuredImageMedium: data.featuredImageMedium || '',
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

    if (!isValidImageFormat(file)) {
      toast.error('Supported formats: JPG, PNG, WEBP');
      return;
    }

    setUploadProgress(true);
    try {
      const { thumbnail, medium, full } = await generateImageVariants(file);
      const timestamp = Date.now();
      
      const uploadVariant = async (blob: Blob, name: string) => {
        const storageRef = ref(storage, `news_images/${timestamp}_${name}.webp`);
        const snapshot = await uploadBytes(storageRef, blob);
        return getDownloadURL(snapshot.ref);
      };

      const [thumbUrl, medUrl, fullUrl] = await Promise.all([
        uploadVariant(thumbnail, 'thumb'),
        uploadVariant(medium, 'medium'),
        uploadVariant(full, 'full')
      ]);
      
      setFormData(prev => ({ 
        ...prev, 
        featuredImage: fullUrl,
        featuredImageThumb: thumbUrl,
        featuredImageMedium: medUrl
      }));
      setImagePreview(fullUrl);
      toast.success('Optimized multi-variant assets synchronized');
    } catch (error) {
      console.error('Final upload error:', error);
      toast.error(`Upload Error: Processing failed`);
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
            onClick={() => setShowAiModal(true)}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#0A2A43] text-white hover:bg-[#1E90FF] transition-all text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95"
          >
            <Zap className="w-4 h-4 text-[#00B894]" /> Write with AI
          </button>
          <button
            onClick={handleAIEnhance}
            disabled={aiProcessing || loading}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 group ${
              aiProcessing 
                ? 'bg-[#1E90FF]/10 text-[#1E90FF]' 
                : 'bg-gradient-to-r from-[#1E90FF] to-[#00B894] text-white'
            }`}
          >
            {aiProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
            )}
            AI Assistant
          </button>
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
                {imagePreview && imagePreview.trim() !== "" ? (
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
              {altTextSuggestion && (
                <div className="mt-4 p-4 bg-[#1E90FF]/5 rounded-xl border border-[#1E90FF]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#1E90FF]" />
                    <span className="text-[9px] font-black uppercase text-[#1E90FF] tracking-widest">AI SEO Alt Text</span>
                  </div>
                  <p className="text-[11px] font-medium text-[#0A2A43] leading-relaxed italic">{altTextSuggestion}</p>
                </div>
              )}
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

      {/* AI Draft Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-[#0A2A43]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-[#0A2A43] uppercase tracking-tighter">AI Editorial Draft</h3>
                  <p className="text-[10px] font-black uppercase text-[#1E90FF] tracking-widest mt-1">Direct Neural Dispatch</p>
                </div>
                <button onClick={() => setShowAiModal(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-[#0A2A43]" />
                </button>
              </div>
              
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 tracking-widest px-1">Describe the story in 1 sentence</label>
                <textarea
                  value={aiDraftPrompt}
                  onChange={(e) => setAiDraftPrompt(e.target.value)}
                  placeholder="e.g. A new luxury hotel opening in Cox's Bazar near Kola Toli beach with sustainable features..."
                  className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-2xl p-6 text-sm font-bold text-[#0A2A43] focus:border-[#1E90FF] focus:bg-white focus:outline-none transition-all h-32 resize-none shadow-inner"
                />
              </div>

              <div className="flex items-center gap-4 bg-[#1E90FF]/5 p-5 rounded-2xl border border-[#1E90FF]/10">
                <div className="w-10 h-10 rounded-full bg-[#1E90FF] flex items-center justify-center shadow-lg shadow-[#1E90FF]/20">
                   <Zap className="w-5 h-5 text-white" />
                </div>
                <p className="text-[11px] font-bold text-[#0A2A43]/60 leading-relaxed">
                  Our AI will synthesize a complete journalistic report including headline, content, and categories optimized for global reach.
                </p>
              </div>

              <button
                onClick={handleAIDraft}
                disabled={aiProcessing || !aiDraftPrompt}
                className="w-full bg-[#0A2A43] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-[#1E90FF] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {aiProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Initiate Generation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
