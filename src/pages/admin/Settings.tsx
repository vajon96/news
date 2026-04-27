import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { SiteSettings } from '../../types';
import { 
  Save, 
  Globe, 
  Mail, 
  Image as ImageIcon, 
  Upload,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, isValidImageFormat } from '../../lib/imageUtils';

export default function Settings() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Cox Bazar Times',
    logoUrl: '',
    contactEmail: 'contact@coxbazartimes.com',
    accentColor: '#1E90FF'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings(snap.data() as SiteSettings);
        }
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      toast.success('Site settings updated');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFormat(file)) {
      toast.error('Please use JPG, PNG, or WEBP');
      return;
    }

    setUploading(true);
    try {
      const compressedBlob = await compressImage(file, 600); // Logo can be smaller
      const storageRef = ref(storage, `site_assets/logo_${Date.now()}.webp`);
      const snapshot = await uploadBytes(storageRef, compressedBlob);
      const url = await getDownloadURL(snapshot.ref);
      setSettings({ ...settings, logoUrl: url });
      toast.success('Branding asset optimized');
    } catch (error) {
      toast.error('Logo processing failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-[#0A2A43]/40 font-black uppercase tracking-[0.4em] animate-pulse">Syncing System Manifest...</div>;

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-3xl font-black text-[#0A2A43] uppercase tracking-tighter">System Configuration</h1>
        <p className="text-[#1E90FF] font-black text-[10px] uppercase tracking-[0.3em] mt-1">Global Application Manifest</p>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        <div className="bg-white border-2 border-gray-50 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b-2 border-gray-50 bg-gray-50/30">
            <h2 className="text-[10px] font-black uppercase text-[#0A2A43] tracking-[0.2em]">Identity & Branding</h2>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 tracking-widest">Network Title</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-[#0A2A43] focus:border-[#1E90FF] focus:bg-white focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 tracking-widest">HQ Contact</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-[#0A2A43] focus:border-[#1E90FF] focus:bg-white focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t-2 border-gray-50">
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 tracking-widest">Network Mark (Logo)</label>
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-40 h-40 bg-[#F1F5F9] border-4 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                  {settings.logoUrl && settings.logoUrl.trim() !== "" ? (
                    <>
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-6" />
                      <div className="absolute inset-0 bg-[#0A2A43]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                        <label className="cursor-pointer bg-white text-[#0A2A43] p-4 rounded-2xl shadow-2xl hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                          <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center group-hover:scale-110 transition-transform">
                      <div className="p-4 bg-white rounded-2xl shadow-lg mb-4">
                        <ImageIcon className="w-8 h-8 text-[#1E90FF]" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#0A2A43]/30">UPLOAD</span>
                      <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                    </label>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-[#0A2A43]/90 backdrop-blur-md flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4 py-4 text-center md:text-left">
                  <p className="text-lg font-black text-[#0A2A43] uppercase tracking-tight">Broadcast Logo</p>
                  <p className="text-sm text-[#0A2A43]/50 font-medium leading-relaxed max-w-sm">
                    This visual asset will be displayed across the global network headers, footer navigation, and social dispatch cards.
                  </p>
                  {settings.logoUrl && (
                    <button 
                      type="button"
                      onClick={() => setSettings({ ...settings, logoUrl: '' })}
                      className="text-[10px] text-[#E63946] hover:bg-red-50 px-4 py-2 rounded-lg transition-all font-black uppercase tracking-widest flex items-center gap-2 mx-auto md:mx-0"
                    >
                      <Trash2 className="w-4 h-4" /> Purge Asset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-3 bg-[#0A2A43] hover:bg-[#1E90FF] text-white font-black py-5 px-12 rounded-2xl shadow-2xl transition-all duration-300 disabled:opacity-50 uppercase text-xs tracking-[0.25em] active:scale-95 transform"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            COMMIT MANIFEST
          </button>
        </div>
      </form>

      <div className="p-10 bg-[#E63946]/5 border-2 border-[#E63946]/10 rounded-[2rem] relative overflow-hidden">
        <h3 className="text-xs font-black uppercase text-[#E63946] mb-3 tracking-[0.2em] relative z-10">Editorial Restriction</h3>
        <p className="text-sm text-[#0A2A43]/60 font-medium leading-relaxed relative z-10">
          Modifying the manifest will alter the identity of the entire Cox Bazar Times network. 
          Expect a propagation delay of up to 300ms across live streaming nodes.
        </p>
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#E63946] opacity-[0.03] rounded-full translate-x-12 -translate-y-12 blur-3xl"></div>
      </div>
    </div>
  );
}
