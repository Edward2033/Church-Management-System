import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Edit2, Loader2, Upload, FileText } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';
const token = () => localStorage.getItem('cms_token');
const authH = () => ({ Authorization: `Bearer ${token()}` });

type Tab = 'about' | 'values' | 'footer' | 'social';

interface Value {
  id: string;
  title: string;
  description: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

const COLOR_OPTIONS = [
  { label: 'Purple', value: 'from-purple-600/30 to-purple-500/10 border-purple-500/30 text-purple-400' },
  { label: 'Amber',  value: 'from-amber-600/30 to-amber-500/10 border-amber-500/30 text-amber-400' },
  { label: 'Blue',   value: 'from-blue-600/30 to-blue-500/10 border-blue-500/30 text-blue-400' },
  { label: 'Green',  value: 'from-green-600/30 to-green-500/10 border-green-500/30 text-green-400' },
  { label: 'Rose',   value: 'from-rose-600/30 to-rose-500/10 border-rose-500/30 text-rose-400' },
  { label: 'Teal',   value: 'from-teal-600/30 to-teal-500/10 border-teal-500/30 text-teal-400' },
];

// ── Reusable field components ──────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
    />
  );
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
    />
  );
}

// ── Image upload helper ────────────────────────────────────────

function ImageUpload({ settingKey, group, currentUrl, label }: {
  settingKey: string; group: string; currentUrl: string; label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);

  useEffect(() => setPreview(currentUrl), [currentUrl]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('key', settingKey);
      fd.append('group', group);
      fd.append('folder', 'lus4g-church/cms');
      const res = await fetch(`${API}/cms/settings/upload`, { method: 'POST', headers: authH(), body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.url);
      toast.success(`${label} updated`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {preview && <img src={preview} alt={label} className="h-24 rounded-lg object-cover mb-2" />}
      <label className="flex items-center gap-2 cursor-pointer text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg w-fit">
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? 'Uploading…' : 'Upload Image'}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}

// ── Tab: About Page ────────────────────────────────────────────

function AboutTab() {
  const [s, setS] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/cms/settings?group=about`);
    const data = await res.json();
    const flat: Record<string, string> = {};
    (data.raw || []).forEach((r: any) => { flat[r.key] = r.value ?? ''; });
    setS(flat);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/cms/settings`, {
        method: 'PUT',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('About page settings saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Hero Section</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hero Title"><Input value={s.about_hero_title || ''} onChange={(v) => set('about_hero_title', v)} /></Field>
          <Field label="Hero Subtitle"><Input value={s.about_hero_subtitle || ''} onChange={(v) => set('about_hero_subtitle', v)} /></Field>
        </div>
        <ImageUpload settingKey="about_hero_image" group="about" currentUrl={s.about_hero_image || ''} label="Hero Background Image" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Our Story</h2>
        <Field label="Section Title"><Input value={s.about_story_title || ''} onChange={(v) => set('about_story_title', v)} /></Field>
        <Field label="Paragraph 1"><Textarea value={s.about_story_p1 || ''} onChange={(v) => set('about_story_p1', v)} rows={4} /></Field>
        <Field label="Paragraph 2"><Textarea value={s.about_story_p2 || ''} onChange={(v) => set('about_story_p2', v)} rows={4} /></Field>
        <ImageUpload settingKey="about_story_image" group="about" currentUrl={s.about_story_image || ''} label="Story Image" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Mission & Vision</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mission Title"><Input value={s.about_mission_title || ''} onChange={(v) => set('about_mission_title', v)} /></Field>
          <Field label="Vision Title"><Input value={s.about_vision_title || ''} onChange={(v) => set('about_vision_title', v)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mission Text"><Textarea value={s.about_mission_text || ''} onChange={(v) => set('about_mission_text', v)} /></Field>
          <Field label="Vision Text"><Textarea value={s.about_vision_text || ''} onChange={(v) => set('about_vision_text', v)} /></Field>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Core Values Section</h2>
        <Field label="Section Title"><Input value={s.about_values_title || ''} onChange={(v) => set('about_values_title', v)} /></Field>
        <Field label="Section Subtitle"><Input value={s.about_values_subtitle || ''} onChange={(v) => set('about_values_subtitle', v)} /></Field>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Leadership Section</h2>
        <Field label="Section Title"><Input value={s.about_leadership_title || ''} onChange={(v) => set('about_leadership_title', v)} /></Field>
        <Field label="Section Subtitle"><Input value={s.about_leadership_subtitle || ''} onChange={(v) => set('about_leadership_subtitle', v)} /></Field>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving…' : 'Save About Settings'}
      </button>
    </div>
  );
}

// ── Tab: Core Values ───────────────────────────────────────────

function ValuesTab() {
  const [values, setValues] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Value | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', color_class: COLOR_OPTIONS[0].value, sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API}/cms/about-values/all`, { headers: authH() });
      const data = await res.json();
      setValues(data.values || []);
    } catch { toast.error('Failed to load values'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', color_class: COLOR_OPTIONS[0].value, sort_order: values.length, is_active: true });
    setShowForm(true);
  };

  const openEdit = (v: Value) => {
    setEditing(v);
    setForm({ title: v.title, description: v.description, color_class: v.color_class, sort_order: v.sort_order, is_active: v.is_active });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `${API}/cms/about-values/${editing.id}` : `${API}/cms/about-values`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? 'Value updated' : 'Value created');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this core value?')) return;
    try {
      await fetch(`${API}/cms/about-values/${id}`, { method: 'DELETE', headers: authH() });
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (v: Value) => {
    try {
      const res = await fetch(`${API}/cms/about-values/${v.id}`, {
        method: 'PUT',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !v.is_active }),
      });
      if (!res.ok) throw new Error();
      load();
    } catch { toast.error('Update failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{values.length} core value(s)</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
          <Plus size={16} /> Add Value
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold mb-4">{editing ? 'Edit Value' : 'New Core Value'}</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title *"><Input value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} /></Field>
              <Field label="Sort Order">
                <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: +e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </Field>
            </div>
            <Field label="Description *"><Textarea value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} /></Field>
            <Field label="Color Theme">
              <select value={form.color_class} onChange={(e) => setForm((p) => ({ ...p, color_class: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {COLOR_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
              Active (visible on site)
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {values.map((v) => (
          <div key={v.id} className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-4">
            <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 bg-gradient-to-br ${v.color_class.split(' ')[0]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{v.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {v.is_active ? 'Active' : 'Hidden'}
                </span>
                <span className="text-xs text-gray-400">Order: {v.sort_order}</span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{v.description}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => toggleActive(v)} className="p-1.5 rounded text-gray-500 hover:bg-gray-100" title="Toggle active">
                {v.is_active ? '👁' : '🙈'}
              </button>
              <button onClick={() => openEdit(v)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50"><Edit2 size={15} /></button>
              <button onClick={() => del(v.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {values.length === 0 && (
          <div className="text-center py-10 text-gray-400">No core values yet. Click "Add Value" to create one.</div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Footer ────────────────────────────────────────────────

function FooterTab() {
  const [s, setS] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/cms/settings?group=footer`)
      .then((r) => r.json())
      .then((data) => {
        const flat: Record<string, string> = {};
        (data.raw || []).forEach((r: any) => { flat[r.key] = r.value ?? ''; });
        setS(flat);
      });
  }, []);

  const set = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/cms/settings`, {
        method: 'PUT',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Footer settings saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Church Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Church Name"><Input value={s.footer_church_name || ''} onChange={(v) => set('footer_church_name', v)} /></Field>
          <Field label="Tagline"><Input value={s.footer_tagline || ''} onChange={(v) => set('footer_tagline', v)} /></Field>
        </div>
        <Field label="Description"><Textarea value={s.footer_description || ''} onChange={(v) => set('footer_description', v)} /></Field>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Contact Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address"><Input value={s.footer_address || ''} onChange={(v) => set('footer_address', v)} /></Field>
          <Field label="City / Region"><Input value={s.footer_city || ''} onChange={(v) => set('footer_city', v)} /></Field>
          <Field label="Phone"><Input value={s.footer_phone || ''} onChange={(v) => set('footer_phone', v)} /></Field>
          <Field label="Email"><Input value={s.footer_email || ''} onChange={(v) => set('footer_email', v)} /></Field>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Service Times</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sunday Service"><Input value={s.footer_sunday_service || ''} onChange={(v) => set('footer_sunday_service', v)} placeholder="e.g. 9:00 AM & 11:00 AM" /></Field>
          <Field label="Wednesday Service"><Input value={s.footer_wednesday_service || ''} onChange={(v) => set('footer_wednesday_service', v)} placeholder="e.g. 6:30 PM" /></Field>
          <Field label="Friday Service"><Input value={s.footer_friday_service || ''} onChange={(v) => set('footer_friday_service', v)} placeholder="e.g. 7:00 PM" /></Field>
          <Field label="Copyright Text"><Input value={s.footer_copyright || ''} onChange={(v) => set('footer_copyright', v)} /></Field>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving…' : 'Save Footer Settings'}
      </button>
    </div>
  );
}

// ── Tab: Social Media ──────────────────────────────────────────

function SocialTab() {
  const [s, setS] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/cms/settings?group=social`)
      .then((r) => r.json())
      .then((data) => {
        const flat: Record<string, string> = {};
        (data.raw || []).forEach((r: any) => { flat[r.key] = r.value ?? ''; });
        setS(flat);
      });
  }, []);

  const set = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/cms/settings`, {
        method: 'PUT',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Social links saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const SOCIALS = [
    { key: 'social_facebook',  label: 'Facebook URL',  placeholder: 'https://facebook.com/yourpage' },
    { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/yourpage' },
    { key: 'social_twitter',   label: 'Twitter / X URL', placeholder: 'https://twitter.com/yourpage' },
    { key: 'social_youtube',   label: 'YouTube URL',   placeholder: 'https://youtube.com/@yourchannel' },
    { key: 'social_tiktok',    label: 'TikTok URL',    placeholder: 'https://tiktok.com/@yourpage' },
    { key: 'social_whatsapp',  label: 'WhatsApp URL',  placeholder: 'https://wa.me/233XXXXXXXXX' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Social Media Links</h2>
        <p className="text-sm text-gray-500">Leave blank to hide the icon in the footer.</p>
        <div className="grid grid-cols-2 gap-4">
          {SOCIALS.map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <Input value={s[key] || ''} onChange={(v) => set(key, v)} placeholder={placeholder} />
            </Field>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving…' : 'Save Social Links'}
      </button>
    </div>
  );
}

// ── Main AdminCMS ──────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'about',  label: 'About Page' },
  { id: 'values', label: 'Core Values' },
  { id: 'footer', label: 'Footer' },
  { id: 'social', label: 'Social Media' },
];

const AdminCMS: React.FC = () => {
  const [tab, setTab] = useState<Tab>('about');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText size={24} className="text-purple-600" /> CMS Settings
        </h1>
        <p className="text-sm text-gray-600">Manage About page content, core values, footer, and social links</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'about'  && <AboutTab />}
      {tab === 'values' && <ValuesTab />}
      {tab === 'footer' && <FooterTab />}
      {tab === 'social' && <SocialTab />}
    </div>
  );
};

export default AdminCMS;
