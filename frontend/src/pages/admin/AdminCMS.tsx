import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Edit2, Loader2, Upload, FileText } from 'lucide-react';
import { apiFetch, api } from '@/lib/api';

const API = import.meta.env.VITE_API_URL || '/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('cms_token')}` });

type Tab = 'about' | 'values' | 'footer' | 'social' | 'contact' | 'branding';

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

function Textarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
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
      const res = await apiFetch('/cms/settings/upload', { method: 'POST', body: fd });
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
      await api('/cms/settings', { method: 'PUT', body: JSON.stringify({ settings: s, group: 'about' }) });
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
      const url = editing ? `/cms/about-values/${editing.id}` : `/cms/about-values`;
      await api(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
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
      await api(`/cms/about-values/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (v: Value) => {
    try {
      await api(`/cms/about-values/${v.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !v.is_active }) });
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
    // Load both footer group and legacy church_* keys (no group filter — get all footer-related)
    Promise.all([
      fetch(`${API}/cms/settings?group=footer`).then((r) => r.json()),
      fetch(`${API}/cms/settings?group=branding`).then((r) => r.json()),
    ]).then(([footerData, brandingData]) => {
      const flat: Record<string, string> = {};
      // Load legacy church_* keys first as fallback values
      (footerData.raw || []).forEach((r: any) => { flat[r.key] = r.value ?? ''; });
      // Branding logo
      (brandingData.raw || []).forEach((r: any) => { flat[r.key] = r.value ?? ''; });
      // Populate footer_* fields from legacy church_* if footer_* not set
      if (!flat.footer_church_name && flat.church_name) flat.footer_church_name = flat.church_name;
      if (!flat.footer_tagline && flat.church_tagline) flat.footer_tagline = flat.church_tagline;
      if (!flat.footer_address && flat.church_address) flat.footer_address = flat.church_address;
      if (!flat.footer_phone && flat.church_phone) flat.footer_phone = flat.church_phone;
      if (!flat.footer_email && flat.church_email) flat.footer_email = flat.church_email;
      if (!flat.footer_sunday_service && flat.sunday_service_times) flat.footer_sunday_service = flat.sunday_service_times;
      if (!flat.footer_wednesday_service && flat.midweek_service) flat.footer_wednesday_service = flat.midweek_service;
      if (!flat.footer_friday_service && flat.prayer_meeting) flat.footer_friday_service = flat.prayer_meeting;
      setS(flat);
    });
  }, []);

  const set = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api('/cms/settings', { method: 'PUT', body: JSON.stringify({ settings: s, group: 'footer' }) });
      toast.success('Footer settings saved');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
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
      await api('/cms/settings', { method: 'PUT', body: JSON.stringify({ settings: s, group: 'social' }) });
      toast.success('Social links saved');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
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

// ── Tab: Branding / Logo ──────────────────────────────────────

function BrandingTab() {
  const [s, setS] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/cms/settings?group=branding`)
      .then((r) => r.json())
      .then((data) => {
        const flat: Record<string, string> = {};
        (data.raw || []).forEach((r: any) => { flat[r.key] = r.value ?? ''; });
        setS(flat);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-gray-800 mb-2">Website Logo</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload your church logo. It will appear in the navigation bar, footer, and throughout the website.
            Recommended size: 200x200 pixels or larger (square format works best).
          </p>
          <ImageUpload
            settingKey="site_logo_url"
            group="branding"
            currentUrl={s.site_logo_url || ''}
            label="Main Logo"
          />
        </div>

        <div className="border-t pt-6">
          <h2 className="font-semibold text-gray-800 mb-2">Logo Preview</h2>
          <p className="text-sm text-gray-600 mb-4">This is how your logo will appear across the site:</p>
          {s.site_logo_url ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img src={s.site_logo_url} alt="Logo Preview" className="h-12 w-12 object-contain" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Navigation Bar (48px height)</p>
                  <p className="text-xs text-gray-500">Logo appears in the top navigation</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg">
                <img src={s.site_logo_url} alt="Logo Preview" className="h-10 w-10 object-contain" />
                <div>
                  <p className="text-sm font-medium text-white">Footer (40px height)</p>
                  <p className="text-xs text-slate-400">Logo appears in the footer section</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-purple-900 rounded-lg">
                <img src={s.site_logo_url} alt="Logo Preview" className="h-12 w-12 object-contain" />
                <div>
                  <p className="text-sm font-medium text-white">Admin Dashboard (48px height)</p>
                  <p className="text-xs text-purple-200">Logo appears in the admin sidebar</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No logo uploaded yet. Upload a logo above to see the preview.</p>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="font-semibold text-gray-800 mb-2">Church Name</h2>
          <p className="text-sm text-gray-600 mb-4">
            The church name appears next to the logo in the navigation and in various parts of the site.
          </p>
          <input
            type="text"
            value={s.site_church_name || ''}
            onChange={(e) => setS((p) => ({ ...p, site_church_name: e.target.value }))}
            placeholder="LUS4G Church"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={async () => {
              if (!s.site_church_name?.trim()) { toast.error('Please enter a church name'); return; }
              try {
                await api('/cms/settings', { method: 'PUT', body: JSON.stringify({ settings: { site_church_name: s.site_church_name.trim() } }) });
                toast.success('Church name updated');
              } catch (err: any) { toast.error(err.message); }
            }}
            className="mt-3 flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
          >
            <Save size={15} /> Save Church Name
          </button>
        </div>

        <div className="border-t pt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Logo Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use PNG format with transparent background for best results</li>
            <li>• Square or horizontal logos work best</li>
            <li>• Minimum recommended size: 200x200 pixels</li>
            <li>• Logo will be automatically resized to fit different areas</li>
            <li>• If no logo is uploaded, a default icon will be shown</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Contact Page ──────────────────────────────────────────

function ContactTab() {
  const [s, setS] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/cms/settings?group=contact`)
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
      await api('/cms/settings', { method: 'PUT', body: JSON.stringify({ settings: s, group: 'contact' }) });
      toast.success('Contact page settings saved');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Page Header</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Page Title"><Input value={s.contact_page_title || ''} onChange={(v) => set('contact_page_title', v)} placeholder="Contact Us" /></Field>
          <Field label="Page Subtitle"><Input value={s.contact_page_subtitle || ''} onChange={(v) => set('contact_page_subtitle', v)} placeholder="We'd love to hear from you" /></Field>
        </div>
        <Field label="Page Description"><Textarea value={s.contact_page_description || ''} onChange={(v) => set('contact_page_description', v)} placeholder="Reach out any time..." /></Field>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address"><Input value={s.contact_address || ''} onChange={(v) => set('contact_address', v)} placeholder="12 Grace Avenue, Accra, Ghana" /></Field>
          <Field label="Phone"><Input value={s.contact_phone || ''} onChange={(v) => set('contact_phone', v)} placeholder="+233 20 000 0001" /></Field>
          <Field label="Email"><Input value={s.contact_email || ''} onChange={(v) => set('contact_email', v)} placeholder="admin@lus4g.org" /></Field>
          <Field label="Office Hours"><Input value={s.contact_office_hours || ''} onChange={(v) => set('contact_office_hours', v)} placeholder="Mon – Fri: 9AM – 5PM" /></Field>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Service Times Display</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="First Service Label"><Input value={s.contact_service1_label || ''} onChange={(v) => set('contact_service1_label', v)} placeholder="First Service" /></Field>
          <Field label="First Service Time"><Input value={s.contact_service1_time || ''} onChange={(v) => set('contact_service1_time', v)} placeholder="8:00 AM" /></Field>
          <Field label="Second Service Label"><Input value={s.contact_service2_label || ''} onChange={(v) => set('contact_service2_label', v)} placeholder="Second Service" /></Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Second Service Time"><Input value={s.contact_service2_time || ''} onChange={(v) => set('contact_service2_time', v)} placeholder="10:00 AM" /></Field>
          <Field label="Third Service Label"><Input value={s.contact_service3_label || ''} onChange={(v) => set('contact_service3_label', v)} placeholder="Evening Service" /></Field>
          <Field label="Third Service Time"><Input value={s.contact_service3_time || ''} onChange={(v) => set('contact_service3_time', v)} placeholder="5:00 PM" /></Field>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Midweek Services</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bible Study Label"><Input value={s.contact_midweek1_label || ''} onChange={(v) => set('contact_midweek1_label', v)} placeholder="Bible Study" /></Field>
          <Field label="Bible Study Time"><Input value={s.contact_midweek1_time || ''} onChange={(v) => set('contact_midweek1_time', v)} placeholder="Wednesday 6:30 PM" /></Field>
          <Field label="Prayer Meeting Label"><Input value={s.contact_midweek2_label || ''} onChange={(v) => set('contact_midweek2_label', v)} placeholder="Prayer Meeting" /></Field>
          <Field label="Prayer Meeting Time"><Input value={s.contact_midweek2_time || ''} onChange={(v) => set('contact_midweek2_time', v)} placeholder="Friday 7:00 PM" /></Field>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Form Settings</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.contact_form_enabled !== 'false'} 
            onChange={(e) => set('contact_form_enabled', e.target.checked ? 'true' : 'false')} />
          Enable Contact Form
        </label>
        <Field label="Success Message"><Textarea value={s.contact_success_message || ''} onChange={(v) => set('contact_success_message', v)} 
          placeholder="Thank you for reaching out. We'll get back to you within 24 hours." /></Field>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving…' : 'Save Contact Settings'}
      </button>
    </div>
  );
}

// ── Main AdminCMS ──────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'branding', label: 'Logo & Branding' },
  { id: 'about',   label: 'About Page' },
  { id: 'values',  label: 'Core Values' },
  { id: 'contact', label: 'Contact Page' },
  { id: 'footer',  label: 'Footer' },
  { id: 'social',  label: 'Social Media' },
];

const AdminCMS: React.FC = () => {
  const [tab, setTab] = useState<Tab>('branding');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText size={24} className="text-purple-600" /> CMS Settings
        </h1>
        <p className="text-sm text-gray-600">Manage website content, core values, contact info, footer, and social links</p>
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

      {tab === 'branding' && <BrandingTab />}
      {tab === 'about'   && <AboutTab />}
      {tab === 'values'  && <ValuesTab />}
      {tab === 'contact' && <ContactTab />}
      {tab === 'footer'  && <FooterTab />}
      {tab === 'social'  && <SocialTab />}
    </div>
  );
};

export default AdminCMS;
