import React, { useEffect, useState } from 'react';
import { get, post, del, Activity } from '@/lib/api';
import { Plus, Trash2, Loader2, Calendar, MapPin, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

const BLANK = { title: '', description: '', category: 'church', image_url: '', event_date: '', start_time: '', end_time: '', location: '', audience: 'all' };

const AdminActivities: React.FC = () => {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    get<{ activities: Activity[] }>('/activities').then((r) => setItems(r.activities || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await post('/activities', form); toast.success('Activity created'); setShowForm(false); setForm(BLANK); load(); }
    catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await del(`/activities/${id}`); toast.success('Deleted'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Activities</h1><p className="text-sm text-gray-500">{items.length} activities</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> New Activity</button>
      </div>

      {loading ? <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="card overflow-hidden">
              {a.image_url ? <img src={a.image_url} className="h-40 w-full object-cover" alt={a.title} /> : <div className="h-40 bg-gradient-to-br from-purple-100 to-indigo-100" />}
              <div className="p-4">
                <span className="text-xs font-semibold capitalize bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{a.category}</span>
                <h3 className="font-bold text-gray-900 mt-2">{a.title}</h3>
                {a.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.description}</p>}
                <div className="mt-3 space-y-1 text-xs text-gray-400">
                  {a.event_date && <p className="flex items-center gap-1"><Calendar size={11} />{new Date(a.event_date + 'T00:00:00').toLocaleDateString()}</p>}
                  {a.start_time && <p className="flex items-center gap-1"><Clock size={11} />{a.start_time}{a.end_time ? ` — ${a.end_time}` : ''}</p>}
                  {a.location && <p className="flex items-center gap-1"><MapPin size={11} />{a.location}</p>}
                </div>
                <button onClick={() => remove(a.id)} className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="card p-16 text-center text-gray-400 col-span-3">No activities. Create one!</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">New Activity</h2><button type="button" onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-base">
                    {['church','choir','worship','outreach','youth','general'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="input-base">
                    {['all','member','choir'].map((a) => <option key={a} value={a} className="capitalize">{a}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-base resize-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-base" placeholder="https://..." /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start</label><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End</label><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input-base" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-base" placeholder="Main Hall" /></div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-5">
              {saving && <Loader2 size={16} className="animate-spin" />} Create Activity
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminActivities;
