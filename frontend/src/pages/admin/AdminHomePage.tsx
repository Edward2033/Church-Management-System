import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Edit2, Loader2, Upload, Home, Eye, EyeOff } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';
const token = () => localStorage.getItem('cms_token');
const authH = () => ({ Authorization: `Bearer ${token()}` });

type Tab = 'hero' | 'welcome' | 'stats' | 'features' | 'services' | 'featured';

interface Stat {
  id: string;
  value: string;
  label: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface Service {
  id: string;
  day: string;
  name: string;
  times: string[];
  description?: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
  sort_order: number;
  is_active: boolean;
}

// ── Reusable field components ──────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
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

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded" />
      <span>{label}</span>
    </label>
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

// ── Tab 1: Hero Slider ─────────────────────────────────────────

function HeroTab() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`${API}/hero/all`, { headers: authH() });
      const data = await res.json();
      setSlides(data.slides || []);
    } catch { toast.error('Failed to load hero slides'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string) => {
    try {
      await fetch(`${API}/hero/${id}/toggle`, { method: 'PATCH', headers: authH() });
      toast.success('Slide status updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    try {
      await fetch(`${API}/hero/${id}`, { method: 'DELETE', headers: authH() });
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{slides.length} slide(s) - Manage at <a href="/admin/hero-slider" className="text-purple-600 hover:underline">Hero Slider page</a></p>
      </div>
      <div className="space-y-3">
        {slides.map((s) => (
          <div key={s.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
            <img src={s.image_url} alt={s.title} className="w-32 h-20 object-cover rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{s.title || 'Untitled'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_active ? 'Active' : 'Hidden'}
                </span>
                <span className="text-xs text-gray-400">Order: {s.sort_order}</span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{s.subtitle}</p>
              {s.cta_label && <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{s.cta_label}</span>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => toggle(s.id)} className="p-2 rounded text-gray-500 hover:bg-gray-100">
                {s.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button onClick={() => del(s.id)} className="p-2 rounded text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {slides.length === 0 && (
          <div className="text-center py-10 text-gray-400">No hero slides yet. <a href="/admin/hero-slider" className="text-purple-600 hover:underline">Add one</a></div>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Welcome & CTA ───────────────────────────────────────

function WelcomeTab() {
  const [s, setS] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/cms/settings?group=home`);
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
      toast.success('Welcome & CTA settings saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Welcome Section</h2>
        <Checkbox checked={s.home_welcome_enabled === 'true'} onChange={(v) => set('home_welcome_enabled', String(v))} label="Enable Welcome Section" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tag Line"><Input value={s.home_welcome_tag || ''} onChange={(v) => set('home_welcome_tag', v)} placeholder="WELCOME" /></Field>
          <Field label="Title"><Input value={s.home_welcome_title || ''} onChange={(v) => set('home_welcome_title', v)} placeholder="Join Our Community" /></Field>
        </div>
        <Field label="Text"><Textarea value={s.home_welcome_text || ''} onChange={(v) => set('home_welcome_text', v)} rows={4} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Button 1 Label"><Input value={s.home_welcome_btn1_label || ''} onChange={(v) => set('home_welcome_btn1_label', v)} placeholder="Join Us" /></Field>
          <Field label="Button 1 URL"><Input value={s.home_welcome_btn1_url || ''} onChange={(v) => set('home_welcome_btn1_url', v)} placeholder="/register" /></Field>
          <Field label="Button 2 Label"><Input value={s.home_welcome_btn2_label || ''} onChange={(v) => set('home_welcome_btn2_label', v)} placeholder="Learn More" /></Field>
          <Field label="Button 2 URL"><Input value={s.home_welcome_btn2_url || ''} onChange={(v) => set('home_welcome_btn2_url', v)} placeholder="/about" /></Field>
        </div>
        <ImageUpload settingKey="home_welcome_image" group="home" currentUrl={s.home_welcome_image || ''} label="Welcome Section Image" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Call-to-Action Section</h2>
        <Checkbox checked={s.home_cta_enabled === 'true'} onChange={(v) => set('home_cta_enabled', String(v))} label="Enable CTA Section" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tag Line"><Input value={s.home_cta_tag || ''} onChange={(v) => set('home_cta_tag', v)} placeholder="GET INVOLVED" /></Field>
          <Field label="Title"><Input value={s.home_cta_title || ''} onChange={(v) => set('home_cta_title', v)} placeholder="Ready to Start?" /></Field>
        </div>
        <Field label="Text"><Textarea value={s.home_cta_text || ''} onChange={(v) => set('home_cta_text', v)} rows={4} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Button 1 Label"><Input value={s.home_cta_btn1_label || ''} onChange={(v) => set('home_cta_btn1_label', v)} placeholder="Get Started" /></Field>
          <Field label="Button 1 URL"><Input value={s.home_cta_btn1_url || ''} onChange={(v) => set('home_cta_btn1_url', v)} placeholder="/register" /></Field>
          <Field label="Button 2 Label"><Input value={s.home_cta_btn2_label || ''} onChange={(v) => set('home_cta_btn2_label', v)} placeholder="Contact Us" /></Field>
          <Field label="Button 2 URL"><Input value={s.home_cta_btn2_url || ''} onChange={(v) => set('home_cta_btn2_url', v)} placeholder="/contact" /></Field>
        </div>
        <ImageUpload settingKey="home_cta_image" group="home" currentUrl={s.home_cta_image || ''} label="CTA Section Image" />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving…' : 'Save Welcome & CTA Settings'}
      </button>
    </div>
  );
}

// ── Tab 3: Statistics ──────────────────────────────────────────

function StatsTab() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Stat | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ value: '', label: '', icon: 'users', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API}/cms/homepage-stats/all`, { headers: authH() });
      const data = await res.json();
      setStats(data.stats || []);
    } catch { toast.error('Failed to load stats'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ value: '', label: '', icon: 'users', sort_order: stats.length, is_active: true });
    setShowForm(true);
  };

  const openEdit = (st: Stat) => {
    setEditing(st);
    setForm({ value: st.value, label: st.label, icon: st.icon, sort_order: st.sort_order, is_active: st.is_active });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `${API}/cms/homepage-stats/${editing.id}` : `${API}/cms/homepage-stats`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? 'Stat updated' : 'Stat created');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this stat?')) return;
    try {
      await fetch(`${API}/cms/homepage-stats/${id}`, { method: 'DELETE', headers: authH() });
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{stats.length} stat(s)</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
          <Plus size={16} /> Add Stat
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold mb-4">{editing ? 'Edit Stat' : 'New Stat'}</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Value *"><Input value={form.value} onChange={(v) => setForm((p) => ({ ...p, value: v }))} placeholder="500+" /></Field>
              <Field label="Label *"><Input value={form.label} onChange={(v) => setForm((p) => ({ ...p, label: v }))} placeholder="Members" /></Field>
              <Field label="Icon"><Input value={form.icon} onChange={(v) => setForm((p) => ({ ...p, icon: v }))} placeholder="users" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sort Order">
                <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: +e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Checkbox checked={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} label="Active (visible on site)" />
            </div>
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
        {stats.map((st) => (
          <div key={st.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-700">{st.value}</span>
                <span className="text-sm text-gray-700">{st.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${st.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {st.is_active ? 'Active' : 'Hidden'}
                </span>
                <span className="text-xs text-gray-400">Icon: {st.icon} | Order: {st.sort_order}</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(st)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50"><Edit2 size={15} /></button>
              <button onClick={() => del(st.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <div className="text-center py-10 text-gray-400">No stats yet. Click "Add Stat" to create one.</div>
        )}
      </div>
    </div>
  );
}

// ── Tab 4: Features (Why Join) ─────────────────────────────────

function FeaturesTab() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [s, setS] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Feature | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ icon: 'heart', title: '', description: '', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [featRes, setRes] = await Promise.all([
        fetch(`${API}/cms/homepage-features/all`, { headers: authH() }),
        fetch(`${API}/cms/settings?group=home`)
      ]);
      const [featData, setData] = await Promise.all([featRes.json(), setRes.json()]);
      setFeatures(featData.features || []);
      const flat: Record<string, string> = {};
      (setData.raw || []).forEach((r: any) => { flat[r.key] = r.value ?? ''; });
      setS(flat);
    } catch { toast.error('Failed to load features'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }));

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/cms/settings`, {
        method: 'PUT',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Section settings saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ icon: 'heart', title: '', description: '', sort_order: features.length, is_active: true });
    setShowForm(true);
  };

  const openEdit = (f: Feature) => {
    setEditing(f);
    setForm({ icon: f.icon, title: f.title, description: f.description, sort_order: f.sort_order, is_active: f.is_active });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `${API}/cms/homepage-features/${editing.id}` : `${API}/cms/homepage-features`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? 'Feature updated' : 'Feature created');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this feature?')) return;
    try {
      await fetch(`${API}/cms/homepage-features/${id}`, { method: 'DELETE', headers: authH() });
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Section Settings</h2>
        <Checkbox checked={s.home_features_enabled === 'true'} onChange={(v) => set('home_features_enabled', String(v))} label="Enable Features Section" />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tag Line"><Input value={s.home_features_tag || ''} onChange={(v) => set('home_features_tag', v)} placeholder="WHY JOIN" /></Field>
          <Field label="Title"><Input value={s.home_features_title || ''} onChange={(v) => set('home_features_title', v)} placeholder="What We Offer" /></Field>
          <Field label="Subtitle"><Input value={s.home_features_subtitle || ''} onChange={(v) => set('home_features_subtitle', v)} placeholder="Discover our community" /></Field>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save Section Settings'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">{features.length} feature(s)</p>
          <button onClick={openNew} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
            <Plus size={16} /> Add Feature
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">{editing ? 'Edit Feature' : 'New Feature'}</h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Icon"><Input value={form.icon} onChange={(v) => setForm((p) => ({ ...p, icon: v }))} placeholder="heart" /></Field>
                <Field label="Title *"><Input value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} /></Field>
                <Field label="Sort Order">
                  <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: +e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </Field>
              </div>
              <Field label="Description *"><Textarea value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} /></Field>
              <Checkbox checked={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} label="Active (visible on site)" />
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
          {features.map((f) => (
            <div key={f.id} className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{f.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {f.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <span className="text-xs text-gray-400">Icon: {f.icon} | Order: {f.sort_order}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{f.description}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(f)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50"><Edit2 size={15} /></button>
                <button onClick={() => del(f.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {features.length === 0 && (
            <div className="text-center py-10 text-gray-400">No features yet. Click "Add Feature" to create one.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Service Times ───────────────────────────────────────

function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [s, setS] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ day: '', name: '', times: '', description: '', icon: 'calendar', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [servRes, setRes] = await Promise.all([
        fetch(`${API}/cms/homepage-services/all`, { headers: authH() }),
        fetch(`${API}/cms/settings?group=home`)
      ]);
      const [servData, setData] = await Promise.all([servRes.json(), setRes.json()]);
      setServices(servData.services || []);
      const flat: Record<string, string> = {};
      (setData.raw || []).forEach((r: any) => { flat[r.key] = r.value ?? ''; });
      setS(flat);
    } catch { toast.error('Failed to load services'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setS((p) => ({ ...p, [k]: v }));

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/cms/settings`, {
        method: 'PUT',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: s }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Section settings saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ day: '', name: '', times: '', description: '', icon: 'calendar', sort_order: services.length, is_active: true });
    setShowForm(true);
  };

  const openEdit = (srv: Service) => {
    setEditing(srv);
    setForm({ day: srv.day, name: srv.name, times: srv.times.join('\n'), description: srv.description || '', icon: srv.icon, sort_order: srv.sort_order, is_active: srv.is_active });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `${API}/cms/homepage-services/${editing.id}` : `${API}/cms/homepage-services`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, times: form.times }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? 'Service updated' : 'Service created');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      await fetch(`${API}/cms/homepage-services/${id}`, { method: 'DELETE', headers: authH() });
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Section Settings</h2>
        <Checkbox checked={s.home_services_enabled === 'true'} onChange={(v) => set('home_services_enabled', String(v))} label="Enable Service Times Section" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tag Line"><Input value={s.home_services_tag || ''} onChange={(v) => set('home_services_tag', v)} placeholder="SERVICE TIMES" /></Field>
          <Field label="Title"><Input value={s.home_services_title || ''} onChange={(v) => set('home_services_title', v)} placeholder="Join Us for Worship" /></Field>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save Section Settings'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">{services.length} service(s)</p>
          <button onClick={openNew} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
            <Plus size={16} /> Add Service
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">{editing ? 'Edit Service' : 'New Service'}</h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Field label="Day *"><Input value={form.day} onChange={(v) => setForm((p) => ({ ...p, day: v }))} placeholder="Sunday" /></Field>
                <Field label="Name *"><Input value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Morning Service" /></Field>
                <Field label="Icon"><Input value={form.icon} onChange={(v) => setForm((p) => ({ ...p, icon: v }))} placeholder="calendar" /></Field>
                <Field label="Sort Order">
                  <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: +e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </Field>
              </div>
              <Field label="Times (one per line) *"><Textarea value={form.times} onChange={(v) => setForm((p) => ({ ...p, times: v }))} rows={3} placeholder="9:00 AM&#10;11:00 AM" /></Field>
              <Field label="Description"><Textarea value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} rows={2} /></Field>
              <Checkbox checked={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} label="Active (visible on site)" />
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
          {services.map((srv) => (
            <div key={srv.id} className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{srv.day} - {srv.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${srv.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {srv.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <span className="text-xs text-gray-400">Icon: {srv.icon} | Order: {srv.sort_order}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">Times: {srv.times.join(', ')}</p>
                {srv.description && <p className="text-xs text-gray-500 mt-0.5">{srv.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(srv)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50"><Edit2 size={15} /></button>
                <button onClick={() => del(srv.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="text-center py-10 text-gray-400">No services yet. Click "Add Service" to create one.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 6: Featured Content ────────────────────────────────────

function FeaturedTab() {
  const [s, setS] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/cms/settings?group=home`);
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
      toast.success('Featured content settings saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Announcements Section</h2>
        <Checkbox checked={s.home_announce_enabled === 'true'} onChange={(v) => set('home_announce_enabled', String(v))} label="Enable Announcements Section" />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tag Line"><Input value={s.home_announce_tag || ''} onChange={(v) => set('home_announce_tag', v)} placeholder="LATEST NEWS" /></Field>
          <Field label="Title"><Input value={s.home_announce_title || ''} onChange={(v) => set('home_announce_title', v)} placeholder="Announcements" /></Field>
          <Field label="Limit (1-10)">
            <input type="number" min={1} max={10} value={s.home_announce_limit || '3'} onChange={(e) => set('home_announce_limit', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Events Section</h2>
        <Checkbox checked={s.home_events_enabled === 'true'} onChange={(v) => set('home_events_enabled', String(v))} label="Enable Events Section" />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Tag Line"><Input value={s.home_events_tag || ''} onChange={(v) => set('home_events_tag', v)} placeholder="UPCOMING" /></Field>
          <Field label="Title"><Input value={s.home_events_title || ''} onChange={(v) => set('home_events_title', v)} placeholder="Events & Activities" /></Field>
          <Field label="Limit (1-10)">
            <input type="number" min={1} max={10} value={s.home_events_limit || '3'} onChange={(e) => set('home_events_limit', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </Field>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving…' : 'Save Featured Content Settings'}
      </button>
    </div>
  );
}

// ── Main AdminHomePage ─────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'hero',     label: 'Hero Slider' },
  { id: 'welcome',  label: 'Welcome & CTA' },
  { id: 'stats',    label: 'Statistics' },
  { id: 'features', label: 'Features (Why Join)' },
  { id: 'services', label: 'Service Times' },
  { id: 'featured', label: 'Featured Content' },
];

const AdminHomePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('hero');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Home size={24} className="text-purple-600" /> Homepage Manager
        </h1>
        <p className="text-sm text-gray-600">Manage all homepage content, sections, and settings</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero'     && <HeroTab />}
      {tab === 'welcome'  && <WelcomeTab />}
      {tab === 'stats'    && <StatsTab />}
      {tab === 'features' && <FeaturesTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'featured' && <FeaturedTab />}
    </div>
  );
};

export default AdminHomePage;
