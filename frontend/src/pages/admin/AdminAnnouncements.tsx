import React, { useEffect, useState } from 'react';
import { get, post, del, put, Announcement } from '@/lib/api';
import { Plus, Trash2, Loader2, Pin, Edit, X } from 'lucide-react';
import { toast } from 'sonner';

const BLANK = { title: '', content: '', category: 'general', image_url: '', pinned: false, is_active: true };

const AdminAnnouncements: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<typeof BLANK>(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    get<{ announcements: Announcement[] }>('/announcements?all=1').then((r) => setItems(r.announcements || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, category: a.category, image_url: a.image_url || '', pinned: a.pinned, is_active: a.is_active });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await put(`/announcements/${editing.id}`, form); toast.success('Updated'); }
      else { await post('/announcements', form); toast.success('Created'); }
      setShowForm(false); setEditing(null); setForm(BLANK); load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try { await del(`/announcements/${id}`); toast.success('Deleted'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Announcements</h1><p className="text-sm text-gray-500">{items.length} announcements</p></div>
        <button onClick={() => { setEditing(null); setForm(BLANK); setShowForm(true); }} className="btn-primary"><Plus size={18} /> New</button>
      </div>

      {loading ? <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div> : (
        <div className="space-y-4">
          {items.map((a) => (
            <div key={a.id} className={`card p-5 flex gap-4 ${!a.is_active ? 'opacity-60' : ''}`}>
              {a.image_url && <img src={a.image_url} className="h-20 w-28 rounded-lg object-cover hidden sm:block shrink-0" alt={a.title} />}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {a.pinned && <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold"><Pin size={10} /> Pinned</span>}
                  <span className="text-xs capitalize text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-semibold">{a.category}</span>
                  {!a.is_active && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                <h3 className="font-bold text-gray-900">{a.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg"><Edit size={16} /></button>
                <button onClick={() => remove(a.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="card p-16 text-center text-gray-400">No announcements yet. Create one!</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit' : 'New'} Announcement</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-base">
                  {['church', 'choir', 'events', 'general'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Content *</label><textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-base resize-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-base" placeholder="https://..." /></div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="accent-purple-700" /> Pinned
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-purple-700" /> Active
                </label>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-5">
              {saving && <Loader2 size={16} className="animate-spin" />} {editing ? 'Update' : 'Create'} Announcement
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
