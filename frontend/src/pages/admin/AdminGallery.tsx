import React, { useEffect, useState } from 'react';
import { get, del, GalleryItem } from '@/lib/api';
import { Plus, Trash2, Loader2, X, ZoomIn, Upload } from 'lucide-react';
import { toast } from 'sonner';

const AdminGallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'general', caption: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('cms_token');

  const load = () => {
    setLoading(true);
    get<{ gallery: GalleryItem[] }>('/gallery').then((r) => setItems(r.gallery || [])).catch(() => {}).finally(() => setLoading(false));
  };
  
  useEffect(() => { load(); }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      if (!file.type.match(/^image\//)) {
        toast.error('Only image files are allowed');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast.error('Please select an image');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('caption', form.caption);

      const res = await fetch(`${API_URL}/gallery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Image added');
      setShowForm(false);
      setForm({ title: '', category: 'general', caption: '' });
      setImageFile(null);
      setImagePreview('');
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this image?')) return;
    try {
      await del(`/gallery/${id}`);
      toast.success('Removed');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500">{items.length} images</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} /> Add Image
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 size={32} className="animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img src={item.image_url} alt={item.title || ''} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-2">
                <button onClick={() => setLightbox(item)} className="opacity-0 group-hover:opacity-100 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-all">
                  <ZoomIn size={20} />
                </button>
                <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
              {item.category && (
                <span className="absolute bottom-2 left-2 text-xs font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full capitalize">{item.category}</span>
              )}
            </div>
          ))}
          {items.length === 0 && <div className="card p-16 text-center text-gray-400 col-span-4">No images yet. Add some!</div>}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute -top-10 right-0 text-white p-2"><X size={28} /></button>
            <img src={lightbox.image_url} alt={lightbox.title || ''} className="w-full rounded-xl max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Image</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
                {imagePreview && (
                  <img src={imagePreview} className="mt-2 h-32 w-full object-cover rounded-lg" alt="preview" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" placeholder="Image title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-base">
                  {['events','choir','worship','youth','general'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="input-base" placeholder="Image description" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-5">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {saving ? 'Uploading...' : 'Add Image'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
