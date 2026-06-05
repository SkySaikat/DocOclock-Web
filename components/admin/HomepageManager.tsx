import React, { useState, useRef } from 'react';
import { Image, Upload, Trash2, ChevronUp, ChevronDown, Loader2, Monitor, Smartphone, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { supabase } from '../../supabase';

interface HeroBanner {
  id: string;
  desktop_image_url: string;
  mobile_image_url?: string;
  title?: string;
  subtitle?: string;
  sort_order: number;
  is_active: boolean;
}

interface HomepageManagerProps {
  banners: HeroBanner[];
  onCreate: (banner: { desktop_image_url: string; mobile_image_url?: string; title?: string; subtitle?: string }) => Promise<void>;
  onUpdate: (id: string, updates: Partial<HeroBanner>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

async function uploadHeroImage(file: File, prefix: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('hero-images').upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('hero-images').getPublicUrl(path).data.publicUrl;
}

export const HomepageManager: React.FC<HomepageManagerProps> = ({ banners, onCreate, onUpdate, onDelete }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState('');
  const [mobilePreview, setMobilePreview] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  const handleDesktopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setDesktopFile(f);
    setDesktopPreview(URL.createObjectURL(f));
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMobileFile(f);
    setMobilePreview(URL.createObjectURL(f));
  };

  const handleAdd = async () => {
    if (!desktopFile) return;
    setAdding(true);
    try {
      const desktopUrl = await uploadHeroImage(desktopFile, 'desktop');
      let mobileUrl: string | undefined;
      if (mobileFile) mobileUrl = await uploadHeroImage(mobileFile, 'mobile');
      await onCreate({ desktop_image_url: desktopUrl, mobile_image_url: mobileUrl, title: title || undefined, subtitle: subtitle || undefined });
      setTitle('');
      setSubtitle('');
      setDesktopFile(null);
      setMobileFile(null);
      setDesktopPreview('');
      setMobilePreview('');
      if (desktopRef.current) desktopRef.current.value = '';
      if (mobileRef.current) mobileRef.current.value = '';
    } catch (err: any) {
      alert(`Failed to add slide: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const a = banners[index];
    const b = banners[index - 1];
    await Promise.all([
      onUpdate(a.id, { sort_order: b.sort_order }),
      onUpdate(b.id, { sort_order: a.sort_order }),
    ]);
  };

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    const a = banners[index];
    const b = banners[index + 1];
    await Promise.all([
      onUpdate(a.id, { sort_order: b.sort_order }),
      onUpdate(b.id, { sort_order: a.sort_order }),
    ]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Image size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Homepage Slider</h2>
            <p className="text-sm font-bold text-slate-500">Manage hero banner slides shown to patients</p>
          </div>
        </div>

        {/* Add New Slide Form */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <Plus size={16} /> Add New Slide
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desktop Image */}
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Monitor size={12} /> Desktop Image <span className="text-red-500">*</span>
              </label>
              <input ref={desktopRef} type="file" accept="image/*" onChange={handleDesktopChange} className="hidden" />
              <button
                type="button"
                onClick={() => desktopRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 transition-colors group"
              >
                {desktopPreview ? (
                  <img src={desktopPreview} alt="Desktop preview" className="h-24 w-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">Click to upload</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Image */}
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Smartphone size={12} /> Mobile Image <span className="text-slate-400 font-medium">(optional)</span>
              </label>
              <input ref={mobileRef} type="file" accept="image/*" onChange={handleMobileChange} className="hidden" />
              <button
                type="button"
                onClick={() => mobileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 transition-colors group"
              >
                {mobilePreview ? (
                  <img src={mobilePreview} alt="Mobile preview" className="h-24 w-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">Falls back to desktop</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Find Your Doctor"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5">Subtitle (optional)</label>
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="e.g. Book top specialists instantly"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!desktopFile || adding}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-sm transition-colors"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {adding ? 'Uploading…' : 'Add Slide'}
          </button>
        </div>
      </div>

      {/* Slide List */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 mb-4">
          Current Slides <span className="text-slate-400 font-medium">({banners.length})</span>
        </h3>

        {banners.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Image size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No slides yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, index) => (
              <div key={banner.id} className="flex gap-4 items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/30 hover:bg-slate-50 transition-colors">
                {/* Thumbnails */}
                <div className="flex gap-2 shrink-0">
                  <div className="relative">
                    <img src={banner.desktop_image_url} alt="Desktop" className="w-24 h-14 object-cover rounded-xl border border-slate-200" />
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 rounded font-bold">Desktop</span>
                  </div>
                  {banner.mobile_image_url && (
                    <div className="relative hidden sm:block">
                      <img src={banner.mobile_image_url} alt="Mobile" className="w-14 h-14 object-cover rounded-xl border border-slate-200" />
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 rounded font-bold">Mob</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {banner.title ? (
                    <p className="font-black text-slate-800 text-sm truncate">{banner.title}</p>
                  ) : (
                    <p className="font-bold text-slate-400 text-sm italic">No title</p>
                  )}
                  {banner.subtitle && (
                    <p className="text-xs text-slate-500 truncate">{banner.subtitle}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">Slide {index + 1}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Active toggle */}
                  <button
                    onClick={() => onUpdate(banner.id, { is_active: !banner.is_active })}
                    className={`transition-colors ${banner.is_active ? 'text-blue-600' : 'text-slate-300'}`}
                    title={banner.is_active ? 'Active — click to hide' : 'Inactive — click to show'}
                  >
                    {banner.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>

                  {/* Move up */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors text-slate-600"
                    title="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>

                  {/* Move down */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === banners.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors text-slate-600"
                    title="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(banner.id)}
                    disabled={deletingId === banner.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                    title="Delete slide"
                  >
                    {deletingId === banner.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
