import React, { useEffect, useState } from 'react';
import { get, del, Leader } from '@/lib/api';
import { Plus, Trash2, Loader2, X, Upload, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';

const BLANK = { name: '', title: '', bio: '', email: '', phone: '', sort_order: 0 };

const AdminLeadership: React.FC = () => {
  const [items, setItems] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Leader | null>(null);
  const [form, setForm] = useState(BLANK);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('cms_token');

  const load = () => {
    setLoading(true);
    get<{ leadership: Leader[] }>('/leadership')
      .then((r) => setItems(r.leadership || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Photo must be less than 10MB'); return; }
    if (!file.type.match(/^image\//)) { toast.error('Only image files are allowed'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const openEdit = (l: Leader) => {
    setEditing(l);
    setForm({ name: l.name, title: l.title, bio: l.bio || '', email: l.email || '', phone: l.phone || '', sort_order: l.sort_order });
    setPhotoPreview(l.photo_url || '');
    setPhotoFile(null);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      if (photoFile) formData.append('photo', photoFile);
      formData.append('name', form.name);
      formData.append('title', form.title);
      formData.append('bio', form.bio);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('sort_order', String(form.sort_order));

      const url = editing ? `${API_URL}/leadership/${editing.id}` : `${API_URL}/leadership`;
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editing ? 'Updated' : 'Added');
      setShowForm(false);
      setEditing(null);
      setForm(BLANK);
      setPhotoFile(null);
      setPhotoPreview('');
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this leader?')) return;
    try {
      await del(`/leadership/${id}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Leadership</h1>
          <p className="text-sm text-gray-500">{items.length} leaders</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(BLANK); setPhotoFile(null); setPhotoPreview(''); setShowForm(true); }} className="btn-primary">
          <Plus size={18} /> Add Leader
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 size={32} className="animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((l) => (
            <div key={l.id} className="card overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-purple-100 to-indigo-100">
                {l.photo_url ? (
                  <img src={l.photo_url} className="h-full w-full object-cover" alt={l.name} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Users size={48} className="text-purple-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{l.name}</h3>
                <p className="text-sm text-purple-600 font-medium">{l.title}</p>
                {l.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{l.bio}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(l)} className="flex-1 flex items-center justify-center gap-1 text-xs text-purple-600 hover:bg-purple-50 rounded-lg py-1.5 border border-purple-200">
                    <Edit size={13} /> Edit
                  </button>
                  <button onClick={() => remove(l.id)} className="flex items-center justify-center gap-1 text-xs text-red-500 hover:bg-red-50 rounded-lg py-1.5 px-3 border border-red-200">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="card p-16 text-center text-gray-400 col-span-4">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>No leaders yet. Add one!</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? 'Edit' : 'Add'} Leader</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo {!editing && '(optional)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
                {photoPreview && (
                  <img src={photoPreview} className="mt-2 h-32 w-32 object-cover rounded-xl" alt="preview" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title / Role <span className="text-red-500">*</span></label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" placeholder="e.g. Senior Pastor" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input-base resize-none" placeholder="Short biography" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="input-base" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-5">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {saving ? 'Saving...' : editing ? 'Update Leader' : 'Add Leader'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminLeadership;
