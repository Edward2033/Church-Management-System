import React, { useEffect, useState } from 'react';
import { get, post, Notification } from '@/lib/api';
import { Bell, Send, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const BLANK = { title: '', message: '', type: 'system', audience: 'all' };

const AdminNotifications: React.FC = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    get<{ notifications: Notification[] }>('/notifications').then((r) => setItems(r.notifications || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await post('/notifications/broadcast', form); toast.success('Broadcast sent'); setShowForm(false); setForm(BLANK); load(); }
    catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const TYPE_ICON: Record<string, string> = { birthday: '🎂', system: '⚙️', alert: '⚠️', announcement: '📢', event: '📅' };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="text-sm text-gray-500">Manage broadcasts and alerts</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Send size={18} /> Broadcast</button>
      </div>

      {loading ? <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div> : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="card p-5 flex gap-4">
              <div className="text-2xl shrink-0">{TYPE_ICON[n.type] || '🔔'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{n.title}</h3>
                  <span className="text-xs capitalize bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{n.audience}</span>
                  <span className="text-xs capitalize bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{n.type}</span>
                </div>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="card p-16 text-center text-gray-400"><Bell size={36} className="mx-auto mb-3 opacity-30" /><p>No notifications yet</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={send} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><Bell size={20} className="text-purple-700" /> Broadcast Message</h2><button type="button" onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Message *</label><textarea required rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-base resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="input-base">
                    {[['all','Everyone'],['member','Members'],['choir','Choir'],['admin','Admins']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-base">
                    {['system','alert','announcement','event'].map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-5">
              {saving && <Loader2 size={16} className="animate-spin" />} <Send size={16} /> Send Broadcast
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
