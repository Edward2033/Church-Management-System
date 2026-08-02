import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post, DEFAULT_CHURCH_ID } from '@/lib/api';
import { toast } from 'sonner';
import { UserPlus, Upload, Loader2, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

const INSTRUMENTS = ['Piano', 'Drums', 'Guitar', 'Organ', 'Bass Guitar'];
const CHOIR_ACTIVITIES = ['Worship Leading', 'Music Arrangement', 'Choir Training', 'Stage Setup', 'Sound Management', 'Choreography'];
const VOICE_TYPES = ['Soprano', 'Alto', 'Tenor', 'Bass', 'Mezzo-Soprano', 'Baritone'];
const DEPARTMENTS = ['Choir', 'Ushering', 'Media', 'Welfare', 'Youth', 'Children', 'Prayer', 'Evangelism', 'Administration'];

interface FormData {
  reg_type: 'member' | 'choir';
  first_name: string; last_name: string; gender: string; date_of_birth: string;
  profile_photo_url: string;
  email: string; phone: string; whatsapp_number: string; address: string;
  voice_type: string; department: string; baptized: string; status_note: string;
  main_role: string; experience_level: string;
  instruments: string[]; choir_activities: string[];
  emergency_contact_name: string; emergency_contact_phone: string;
  bio: string; terms: boolean;
}

const INITIAL: FormData = {
  reg_type: 'member',
  first_name: '', last_name: '', gender: '', date_of_birth: '',
  profile_photo_url: '',
  email: '', phone: '', whatsapp_number: '', address: '',
  voice_type: '', department: '', baptized: '', status_note: '',
  main_role: '', experience_level: '',
  instruments: [], choir_activities: [],
  emergency_contact_name: '', emergency_contact_phone: '',
  bio: '', terms: false,
};

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1">{label}{required && ' *'}</label>
    {children}
  </div>
);

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const upd = (k: keyof FormData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleArr = (k: 'instruments' | 'choir_activities', val: string) => {
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(val) ? f[k].filter((x) => x !== val) : [...f[k], val],
    }));
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    setUploading(true);
    // Convert to base64 data URL for display; in production send to server/cloud storage
    const reader = new FileReader();
    reader.onload = () => { upd('profile_photo_url', reader.result as string); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const STEPS = [
    { title: 'Registration Type', icon: '1' },
    { title: 'Personal Info', icon: '2' },
    { title: 'Contact Info', icon: '3' },
    { title: 'Church Info', icon: '4' },
    ...(form.reg_type === 'choir' ? [{ title: 'Musical Role', icon: '5' }] : []),
    { title: 'Emergency & Bio', icon: form.reg_type === 'choir' ? '6' : '5' },
    { title: 'Review & Submit', icon: form.reg_type === 'choir' ? '7' : '6' },
  ];

  const isLast = step === STEPS.length - 1;

  const validate = () => {
    if (step === 1 && (!form.first_name.trim() || !form.last_name.trim() || !form.gender)) {
      toast.error('First name, last name and gender are required'); return false;
    }
    if (step === 2 && (!form.email.trim() || !form.phone.trim())) {
      toast.error('Email and phone are required'); return false;
    }
    if (step === 3 && form.reg_type === 'choir' && !form.voice_type) {
      toast.error('Voice type is required for choir members'); return false;
    }
    if (step === 4 && form.reg_type === 'choir' && !form.main_role) {
      toast.error('Main role is required for choir members'); return false;
    }
    if (isLast && !form.terms) {
      toast.error('Please accept the terms and conditions'); return false;
    }
    return true;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await post('/auth/register', {
        church_id: DEFAULT_CHURCH_ID,
        first_name: form.first_name, last_name: form.last_name,
        gender: form.gender, date_of_birth: form.date_of_birth || undefined,
        profile_photo_url: form.profile_photo_url || undefined,
        email: form.email, phone: form.phone,
        whatsapp_number: form.whatsapp_number || undefined,
        address: form.address || undefined,
        membership_type: form.reg_type,
        // voice — send both names for backend compatibility
        voice_group: form.voice_type || undefined,
        voice_type: form.voice_type || undefined,
        // department
        department: form.department || undefined,
        // baptism — send both names
        baptism_status: form.baptized === 'yes',
        baptized: form.baptized === 'yes',
        main_role: form.main_role || undefined,
        experience_level: form.experience_level || undefined,
        instruments: form.instruments,
        choir_activities: form.choir_activities,
        // emergency — send both names
        emergency_name: form.emergency_contact_name || undefined,
        emergency_contact_name: form.emergency_contact_name || undefined,
        emergency_phone: form.emergency_contact_phone || undefined,
        emergency_contact_phone: form.emergency_contact_phone || undefined,
        bio: form.bio || undefined,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-10 text-center">
          <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Registration Submitted!</h2>
          <p className="mt-3 text-slate-400">Your registration is under review. An admin will approve your account and send a setup email.</p>
          <button onClick={() => navigate('/login')} className="mt-6 btn-primary w-full justify-center">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20 mb-4">
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-serif">Member Registration</h1>
          <p className="mt-2 text-slate-400">Fill out the form below to register with our church</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {i < step ? '✓' : s.icon}
                </div>
                <span className="text-xs mt-1 text-slate-400 whitespace-nowrap hidden sm:block">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-8 shrink-0 ${i < step ? 'bg-green-500' : 'bg-slate-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-bold text-white mb-6">{STEPS[step].title}</h2>

          {/* Step 0 – Registration Type */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              {(['member', 'choir'] as const).map((t) => (
                <button key={t} onClick={() => upd('reg_type', t)}
                  className={`rounded-xl border-2 p-6 text-left transition-all ${form.reg_type === t ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
                  <div className="text-2xl mb-2">{t === 'member' ? '👤' : '🎵'}</div>
                  <div className="font-bold text-white capitalize">{t === 'member' ? 'Regular Member' : 'Choir Member'}</div>
                  <div className="text-sm text-slate-400 mt-1">{t === 'member' ? 'Join as a regular church member' : 'Join the music and worship team'}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1 – Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required><input required value={form.first_name} onChange={(e) => upd('first_name', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="John" /></Field>
                <Field label="Last Name" required><input required value={form.last_name} onChange={(e) => upd('last_name', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Mensah" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Gender" required>
                  <select value={form.gender} onChange={(e) => upd('gender', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    <option value="">Select gender</option>
                    {['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Date of Birth"><input type="date" value={form.date_of_birth} onChange={(e) => upd('date_of_birth', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" /></Field>
              </div>
              <Field label="Profile Photo">
                <div className="flex items-center gap-4">
                  {form.profile_photo_url ? (
                    <img src={form.profile_photo_url} className="h-20 w-20 rounded-xl object-cover border-2 border-brand-400" alt="Preview" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-slate-800 flex items-center justify-center"><Upload size={22} className="text-slate-500" /></div>
                  )}
                  <div>
                    <label className="cursor-pointer btn-outline py-2 text-sm">
                      {uploading ? 'Processing...' : 'Choose Photo'}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Max 5MB · JPG, PNG, WEBP</p>
                  </div>
                </div>
              </Field>
            </div>
          )}

          {/* Step 2 – Contact Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email Address" required><input required type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="john@example.com" /></Field>
                <Field label="Phone Number" required><input required type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="+234..." /></Field>
              </div>
              <Field label="WhatsApp Number"><input type="tel" value={form.whatsapp_number} onChange={(e) => upd('whatsapp_number', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="+234... (if different)" /></Field>
              <Field label="Home Address"><textarea rows={3} value={form.address} onChange={(e) => upd('address', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" placeholder="123 Faith Street, Lagos" /></Field>
            </div>
          )}

          {/* Step 3 – Church Info */}
          {step === 3 && (
            <div className="space-y-4">
              {form.reg_type === 'choir' && (
                <Field label="Voice Type" required>
                  <select value={form.voice_type} onChange={(e) => upd('voice_type', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    <option value="">Select voice type</option>
                    {VOICE_TYPES.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Department">
                <select value={form.department} onChange={(e) => upd('department', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Baptized?">
                <select value={form.baptized} onChange={(e) => upd('baptized', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>
          )}

          {/* Step 4 – Musical Role (choir only) */}
          {step === 4 && form.reg_type === 'choir' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Main Role" required>
                  <select value={form.main_role} onChange={(e) => upd('main_role', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    <option value="">Select role</option>
                    {['Vocalist', 'Instrumentalist', 'Choir Director', 'Worship Leader', 'Backup Singer'].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Experience Level">
                  <select value={form.experience_level} onChange={(e) => upd('experience_level', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    <option value="">Select level</option>
                    {['Beginner', 'Intermediate', 'Advanced', 'Professional'].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Instruments (select all that apply)">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {INSTRUMENTS.map((inst) => (
                    <label key={inst} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${form.instruments.includes(inst) ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
                      <input type="checkbox" checked={form.instruments.includes(inst)} onChange={() => toggleArr('instruments', inst)} className="accent-brand-600" />
                      <span className="text-sm font-medium text-white">{inst}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Choir Activities (select all that apply)">
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {CHOIR_ACTIVITIES.map((act) => (
                    <label key={act} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${form.choir_activities.includes(act) ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
                      <input type="checkbox" checked={form.choir_activities.includes(act)} onChange={() => toggleArr('choir_activities', act)} className="accent-brand-600" />
                      <span className="text-sm font-medium text-white">{act}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* Emergency & Bio */}
          {((step === 4 && form.reg_type === 'member') || (step === 5 && form.reg_type === 'choir')) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Emergency Contact Name"><input value={form.emergency_contact_name} onChange={(e) => upd('emergency_contact_name', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Jane Mensah" /></Field>
                <Field label="Emergency Contact Phone"><input type="tel" value={form.emergency_contact_phone} onChange={(e) => upd('emergency_contact_phone', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="+234..." /></Field>
              </div>
              <Field label="Bio / Motivation">
                <textarea rows={4} value={form.bio} onChange={(e) => upd('bio', e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" placeholder="Tell us a little about yourself and why you want to join..." />
              </Field>
            </div>
          )}

          {/* Review & Submit */}
          {isLast && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-800/50 p-5 text-sm space-y-2">
                <h3 className="font-bold text-white mb-3">Review Your Information</h3>
                {[
                  ['Type', form.reg_type === 'choir' ? 'Choir Member' : 'Regular Member'],
                  ['Name', `${form.first_name} ${form.last_name}`],
                  ['Gender', form.gender],
                  ['Date of Birth', form.date_of_birth],
                  ['Email', form.email],
                  ['Phone', form.phone],
                  ['WhatsApp', form.whatsapp_number],
                  ['Address', form.address],
                  form.reg_type === 'choir' ? ['Voice Type', form.voice_type] : null,
                  ['Department', form.department],
                  ['Baptized', form.baptized],
                  form.reg_type === 'choir' ? ['Main Role', form.main_role] : null,
                  form.reg_type === 'choir' ? ['Experience', form.experience_level] : null,
                  form.reg_type === 'choir' ? ['Instruments', form.instruments.join(', ')] : null,
                  form.reg_type === 'choir' ? ['Activities', form.choir_activities.join(', ')] : null,
                  ['Emergency Contact', `${form.emergency_contact_name} · ${form.emergency_contact_phone}`],
                ].filter((x): x is [string, string] => x !== null && !!x[1]).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-medium text-white text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.terms} onChange={(e) => upd('terms', e.target.checked)} className="mt-1 accent-brand-600" />
                <span className="text-sm text-slate-400">
                  I agree to the <a href="#" className="text-brand-400 font-semibold hover:text-brand-300">Terms & Conditions</a> and consent to the church storing my information for membership purposes.
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button onClick={prev} disabled={step === 0} className="btn-outline py-2.5 disabled:opacity-40"><ChevronLeft size={18} /> Back</button>
            {isLast ? (
              <button onClick={submit} disabled={loading || !form.terms} className="btn-primary">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} Submit Registration
              </button>
            ) : (
              <button onClick={next} className="btn-primary">Next <ChevronRight size={18} /></button>
            )}
          </div>
        </div>

        <p className="text-center mt-4 text-sm text-slate-400">
          Already registered? <Link to="/login" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

