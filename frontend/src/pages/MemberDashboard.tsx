import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { get, patch, post, del, api, apiFetch, User, Notification, CHURCH_NAME } from '@/lib/api';
import { printIDCard, printMemberProfile } from '@/lib/print';
import { Church, UserIcon, Users, Bell, DollarSign, LogOut, Menu, X, Printer, Pencil, Upload, Loader2, Music2, Cake, Mic, BookOpen, Lock, Home, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import DashboardHome from './DashboardHome';
import MemberNotifications from './MemberNotifications';
import MemberAttendance from './MemberAttendance';

// ── Sub-pages ───────────────────────────────────────────────

const MemberProfile: React.FC = () => {
  const { member, setMember, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<User>>(member || {});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Debug: Log member data on mount and when it changes
  useEffect(() => {
    console.log('MemberProfile member data:', member);
    console.log('Member fields check:', {
      hasFirstName: !!member?.first_name,
      hasMiddleName: !!member?.middle_name,
      hasLastName: !!member?.last_name,
      hasPhone: !!member?.phone,
      hasEmail: !!member?.email,
      hasAddress: !!member?.address,
      hasGender: !!member?.gender,
      hasOccupation: !!member?.occupation,
      hasMaritalStatus: !!member?.marital_status,
      hasDOB: !!member?.date_of_birth,
      hasEmergencyName: !!member?.emergency_name,
    });
  }, [member]);

  // Ensure we have full profile data on mount
  useEffect(() => {
    if (member && !member.middle_name && !member.occupation) {
      console.log('Member data seems incomplete, refreshing from API...');
      refresh();
    }
  }, []);

  if (!member) return null;
  const upd = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => upd('profile_photo_url', reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      // Build FormData so photo upload works
      const fd = new FormData();
      if (photoFile) fd.append('profilePhoto', photoFile);
      
      // Send ALL profile fields
      fd.append('firstName', form.first_name || member.first_name || '');
      fd.append('middleName', form.middle_name || member.middle_name || '');
      fd.append('lastName', form.last_name || member.last_name || '');
      fd.append('gender', form.gender || member.gender || '');
      fd.append('phone', form.phone || member.phone || '');
      fd.append('whatsappNumber', form.whatsapp_number || member.whatsapp_number || '');
      fd.append('address', form.address || member.address || '');
      fd.append('city', form.city || member.city || '');
      fd.append('dateOfBirth', form.date_of_birth || member.date_of_birth || '');
      fd.append('occupation', form.occupation || member.occupation || '');
      fd.append('maritalStatus', form.marital_status || member.marital_status || '');
      fd.append('emergencyName', form.emergency_name || member.emergency_name || '');
      fd.append('emergencyPhone', form.emergency_phone || member.emergency_phone || '');
      fd.append('emergencyRelation', form.emergency_relation || member.emergency_relation || '');
      fd.append('bio', form.bio || member.bio || '');
      if (form.voice_group) fd.append('voiceGroup', form.voice_group);

      const res = await apiFetch('/profile', { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      // Re-fetch full profile from /auth/me to refresh all fields
      const meRes = await api<{ user: User }>('/auth/me');
      setMember(meRes.user);
      setForm(meRes.user); // Also update form state
      setEditing(false);
      setPhotoFile(null);
      toast.success('Profile updated!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwordData.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setSaving(true);
    try {
      await api('/profile/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('profile');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const m = editing ? { ...member, ...form } : member;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 font-medium ${
              activeTab === 'profile'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserIcon size={18} /> Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 px-6 py-3 font-medium ${
              activeTab === 'password'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock size={18} /> Change Password
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative shrink-0">
            <img src={m.profile_photo_url || 'https://placehold.co/120'} className="h-28 w-28 rounded-2xl object-cover border-4 border-purple-100 shadow" alt="" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{m.first_name} {m.last_name}</h2>
            <p className="font-mono text-purple-700 font-bold">{m.member_code}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="rounded-full bg-purple-100 text-purple-700 px-3 py-0.5 text-xs font-semibold uppercase">{m.role}</span>
              {(m.role === 'choir_member' || m.role === 'choir') && (m.voice_group || m.voice_type) && <span className="flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-3 py-0.5 text-xs font-semibold"><Music2 size={11} />{m.voice_group || m.voice_type}</span>}
              <span className="rounded-full bg-green-100 text-green-700 px-3 py-0.5 text-xs font-semibold">{m.approval_status || m.status}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setForm(member); setEditing(true); }} className="btn-outline py-2 text-sm"><Pencil size={14} /> Edit</button>
              <button onClick={() => printMemberProfile(member)} className="btn-primary py-2 text-sm"><Printer size={14} /> Print Profile</button>
              <button onClick={() => printIDCard(member)} className="btn-outline py-2 text-sm"><Printer size={14} /> Print ID Card</button>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">Member Information</h3>
        <div className="grid gap-y-3">
          {[
            ['Gender', m.gender], ['Date of Birth', m.date_of_birth ? new Date(m.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined],
            ['Email', m.email], ['Phone', m.phone], ['WhatsApp', m.whatsapp_number], ['Address', m.address],
            (m.role === 'choir_member' || m.role === 'choir') ? ['Voice Group', m.voice_group || m.voice_type] : null,
            (m.role === 'choir_member' || m.role === 'choir') ? ['Main Role', m.main_role] : null,
            (m.role === 'choir_member' || m.role === 'choir') ? ['Experience', m.experience_level] : null,
            (m.role === 'choir_member' || m.role === 'choir') ? ['Instruments', (m.instruments || []).join(', ')] : null,
            (m.role === 'choir_member' || m.role === 'choir') ? ['Activities', (m.choir_activities || []).join(', ')] : null,
            ['Department', m.department_name || m.department],
            ['Baptized', (m.baptism_status ?? m.baptized) === true ? 'Yes' : (m.baptism_status ?? m.baptized) === false ? 'No' : undefined],
            ['Emergency', (m.emergency_name || m.emergency_contact_name) ? `${m.emergency_name || m.emergency_contact_name} · ${m.emergency_phone || m.emergency_contact_phone}` : undefined],
          ].filter((x): x is [string, string] => x !== null && !!x[1]).map(([k, v]) => (
            <div key={k as string} className="flex justify-between border-b border-gray-50 pb-3">
              <span className="text-sm text-gray-500">{k}</span>
              <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
            </div>
          ))}
          {m.bio && <div className="pt-2"><p className="text-sm text-gray-500 mb-1">Bio</p><p className="text-sm text-gray-700">{m.bio}</p></div>}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditing(false)}>
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Edit Profile</h2><button type="button" onClick={() => setEditing(false)}><X size={20} className="text-gray-400" /></button></div>
            <div className="mb-4 flex items-center gap-4">
              <img src={form.profile_photo_url || 'https://placehold.co/80'} className="h-16 w-16 rounded-xl object-cover" alt="" />
              <label className="cursor-pointer btn-outline py-2 text-sm">
                <span className="flex items-center gap-1"><Upload size={14} />{uploading ? 'Processing...' : 'Change Photo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[['first_name','First Name'],['middle_name','Middle Name'],['last_name','Last Name']].map(([k,l]) => (
                  <div key={k} className={k === 'last_name' ? 'col-span-2' : ''}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label><input value={(form as any)[k] || ''} onChange={(e) => upd(k, e.target.value)} className="input-base" /></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={form.gender || ''} onChange={(e) => upd('gender', e.target.value)} className="input-base">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" value={(form.date_of_birth || '').slice(0, 10)} onChange={(e) => upd('date_of_birth', e.target.value)} className="input-base" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['phone','Phone'],['whatsapp_number','WhatsApp']].map(([k,l]) => (
                  <div key={k}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label><input type="tel" value={(form as any)[k] || ''} onChange={(e) => upd(k, e.target.value)} className="input-base" /></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label><input value={form.occupation || ''} onChange={(e) => upd('occupation', e.target.value)} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select value={form.marital_status || ''} onChange={(e) => upd('marital_status', e.target.value)} className="input-base">
                    <option value="">Select status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea rows={2} value={form.address || ''} onChange={(e) => upd('address', e.target.value)} className="input-base resize-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city || ''} onChange={(e) => upd('city', e.target.value)} className="input-base" /></div>
              {(member.role === 'choir_member' || member.role === 'choir') && (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Voice Group</label>
                    <select value={(form as any).voice_group || (form as any).voice_type || ''} onChange={(e) => upd('voice_group', e.target.value)} className="input-base">
                      <option value="">Select voice group</option>
                      {['Soprano','Alto','Tenor','Bass'].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label><input value={(form as any).emergency_name || (form as any).emergency_contact_name || ''} onChange={(e) => upd('emergency_name', e.target.value)} className="input-base" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label><input type="tel" value={(form as any).emergency_phone || (form as any).emergency_contact_phone || ''} onChange={(e) => upd('emergency_phone', e.target.value)} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label><input value={form.emergency_relation || ''} onChange={(e) => upd('emergency_relation', e.target.value)} className="input-base" placeholder="e.g., Spouse, Parent" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label><textarea rows={3} value={form.bio || ''} onChange={(e) => upd('bio', e.target.value)} className="input-base resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setEditing(false)} className="btn-outline flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving && <Loader2 size={16} className="animate-spin" />} Save Changes</button>
            </div>
          </form>
        </div>
      )}
      </>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 mb-4">Change Password</h3>
          <form onSubmit={changePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="input-base"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="input-base"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="input-base"
                placeholder="Re-enter new password"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary justify-center w-full">
              {saving && <Loader2 size={18} className="animate-spin" />}
              <Lock size={18} /> Change Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const MemberDirectory: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [choirOnly, setChoirOnly] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<{ members: User[] }>('/members?status=approved').then((r) => setMembers(r.members || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const match = !q || `${m.first_name} ${m.last_name} ${m.member_code}`.toLowerCase().includes(q);
    return match && (!choirOnly || m.role === 'choir_member' || m.role === 'choir');
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Church Directory</h1>
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." className="input-base flex-1 min-w-48" />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={choirOnly} onChange={(e) => setChoirOnly(e.target.checked)} className="accent-purple-700" /> Choir only
        </label>
        <span className="text-sm text-gray-400">{filtered.length} members</span>
      </div>

      {loading ? <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <div key={m.id} onClick={() => setSelected(m)} className="card p-4 cursor-pointer hover:shadow-md transition-shadow text-center">
              <img src={m.profile_photo_url || 'https://placehold.co/80'} className="h-16 w-16 rounded-xl object-cover mx-auto mb-3" alt="" />
              <div className="font-semibold text-gray-900 text-sm">{m.first_name} {m.last_name}</div>
              <div className="font-mono text-xs text-purple-700 mt-0.5">{m.member_code}</div>
              <div className="flex justify-center gap-1 mt-2">
                <span className="rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xs capitalize">{m.role}</span>
                {(m.voice_group || m.voice_type) && <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs">{m.voice_group || m.voice_type}</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="card p-16 text-center text-gray-400 col-span-4">No members found</div>}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <img src={selected.profile_photo_url || 'https://placehold.co/100'} className="h-20 w-20 rounded-2xl object-cover mx-auto mb-3 shadow" alt="" />
            <h3 className="text-lg font-bold text-gray-900">{selected.first_name} {selected.last_name}</h3>
            <p className="font-mono text-sm text-purple-700 font-bold">{selected.member_code}</p>
            <div className="flex justify-center gap-2 mt-2">
              <span className="rounded-full bg-purple-100 text-purple-700 px-3 py-0.5 text-xs capitalize font-semibold">{selected.role}</span>
              {(selected.voice_group || selected.voice_type) && <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-0.5 text-xs font-semibold">{selected.voice_group || selected.voice_type}</span>}
            </div>
            <div className="mt-4 text-sm text-gray-500 space-y-1 text-left">
              {selected.phone && <div className="flex justify-between"><span>Phone</span><span className="font-medium text-gray-800">{selected.phone}</span></div>}
              {(selected.department_name || selected.department) && <div className="flex justify-between"><span>Department</span><span className="font-medium text-gray-800">{selected.department_name || selected.department}</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberDonate: React.FC = () => {
  const { member } = useAuth();
  const [form, setForm] = useState({ amount: '', currency: 'NGN', type: 'offering', payment_method: 'bank_transfer', note: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await post('/donations', { ...form, member_id: member?.id, donor_name: `${member?.first_name} ${member?.last_name}`, donor_email: member?.email });
      setDone(true); toast.success('Thank you for your donation!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Give / Donate</h1>
      {done ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="text-xl font-bold text-gray-900">Thank You!</h2>
          <p className="mt-2 text-gray-500">Your generous giving is greatly appreciated. God bless you!</p>
          <button onClick={() => setDone(false)} className="mt-6 btn-primary justify-center">Give Again</button>
        </div>
      ) : (
        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[['tithe','Tithe'],['offering','Offering'],['special','Special']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setForm({ ...form, type: v })}
                    className={`rounded-xl border-2 py-3 text-sm font-semibold transition-all ${form.type === v ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-base" placeholder="1000.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-base">
                  {['NGN','USD','GBP','EUR','GHS'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="input-base">
                {[['bank_transfer','Bank Transfer'],['card','Card'],['cash','Cash'],['mobile_money','Mobile Money']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note / Purpose</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input-base" placeholder="e.g. For building fund" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
              {saving && <Loader2 size={18} className="animate-spin" />} <DollarSign size={18} /> Submit Donation
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ── Choir Portal (choir members only) ───────────────────────
const ChoirPortal: React.FC = () => {
  const { member } = useAuth();
  const [rehearsals, setRehearsals] = useState<any[]>([]);
  const [music, setMusic] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      get<any>('/choir/rehearsals').then((r) => setRehearsals(r.rehearsals || [])).catch(() => {}),
      get<any>('/choir/music').then((r) => setMusic(r.music || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Choir Portal</h1>
        <p className="text-sm text-gray-500">Your choir schedule and music library</p>
      </div>
      {(member?.voice_group || (member as any)?.voice_type) && (
        <div className="card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Music2 size={20} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Voice Group: {member?.voice_group || (member as any)?.voice_type}</div>
            {member?.main_role && <div className="text-sm text-gray-500">Role: {member.main_role}</div>}
          </div>
        </div>
      )}
      <div>
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Mic size={18} className="text-indigo-600" /> Upcoming Rehearsals</h2>
        <div className="space-y-2">
          {rehearsals.filter((r) => new Date(r.rehearsal_date) >= new Date()).map((r) => (
            <div key={r.id} className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><Mic size={16} className="text-indigo-600" /></div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{r.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(r.rehearsal_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  {r.start_time && ` · ${r.start_time}`}{r.location && ` · ${r.location}`}
                </div>
              </div>
            </div>
          ))}
          {rehearsals.filter((r) => new Date(r.rehearsal_date) >= new Date()).length === 0 && (
            <div className="card p-8 text-center text-gray-400 text-sm">No upcoming rehearsals</div>
          )}
        </div>
      </div>
      <div>
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><BookOpen size={18} className="text-purple-600" /> Music Library</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {music.map((s) => (
            <div key={s.id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSong(s)}>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{s.title}</div>
                  {s.artist && <div className="text-xs text-gray-500 mt-0.5">{s.artist}</div>}
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {s.genre && <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs">{s.genre}</span>}
                {s.key_note && <span className="rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5 text-xs">Key: {s.key_note}</span>}
                {s.lyrics && <span className="rounded-full bg-green-50 text-green-600 px-2 py-0.5 text-xs">Lyrics</span>}
              </div>
            </div>
          ))}
          {music.length === 0 && <div className="card p-8 text-center text-gray-400 text-sm col-span-3">No songs in library yet</div>}
        </div>
      </div>

      {/* Song Lyrics Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedSong(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-purple-700 to-indigo-800 px-6 py-4 text-white relative">
              <button onClick={() => setSelectedSong(null)} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20"><X size={20} /></button>
              <h3 className="text-lg font-bold pr-8">{selectedSong.title}</h3>
              {selectedSong.artist && <p className="text-sm text-purple-200 mt-0.5">{selectedSong.artist}</p>}
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4 flex-wrap">
                {selectedSong.genre && <span className="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium">{selectedSong.genre}</span>}
                {selectedSong.key_note && <span className="rounded-full bg-indigo-50 text-indigo-600 px-3 py-1 text-xs font-medium">Key: {selectedSong.key_note}</span>}
                {selectedSong.bpm && <span className="rounded-full bg-amber-50 text-amber-600 px-3 py-1 text-xs font-medium">{selectedSong.bpm} BPM</span>}
              </div>
              {selectedSong.lyrics ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Lyrics</h4>
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-4">{selectedSong.lyrics}</pre>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No lyrics available for this song</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Choir Director Portal ──────────────────────────────────
const ChoirDirectorPortal: React.FC = () => {
  const { member } = useAuth();
  const [tab, setTab] = useState<'members' | 'music' | 'rehearsals' | 'broadcasts'>('members');
  const [choir, setChoir] = useState<any[]>([]);
  const [music, setMusic] = useState<any[]>([]);
  const [rehearsals, setRehearsals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSong, setShowAddSong] = useState(false);
  const [showAddRehearsal, setShowAddRehearsal] = useState(false);
  const [songForm, setSongForm] = useState({ title: '', artist: '', genre: '', key_note: '', lyrics: '', bpm: '' });
  const [rehearsalForm, setRehearsalForm] = useState({ title: '', rehearsal_date: '', start_time: '', end_time: '', location: '', notes: '' });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      get<any>('/choir?approval_status=approved').then(r => setChoir(r.choir || [])).catch(() => {}),
      get<any>('/choir/music').then(r => setMusic(r.music || [])).catch(() => {}),
      get<any>('/choir/rehearsals').then(r => setRehearsals(r.rehearsals || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const addSong = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await post<any>('/choir/music', { ...songForm, bpm: songForm.bpm ? parseInt(songForm.bpm) : undefined });
      setMusic(prev => [res.music, ...prev]);
      setSongForm({ title: '', artist: '', genre: '', key_note: '', lyrics: '', bpm: '' });
      setShowAddSong(false);
      toast.success('Song added!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const deleteSong = async (id: string) => {
    if (!confirm('Delete this song?')) return;
    try {
      await del(`/choir/music/${id}`);
      setMusic(prev => prev.filter(s => s.id !== id));
      toast.success('Song deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  const addRehearsal = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await post<any>('/choir/rehearsals', rehearsalForm);
      setRehearsals(prev => [res.rehearsal, ...prev]);
      setRehearsalForm({ title: '', rehearsal_date: '', start_time: '', end_time: '', location: '', notes: '' });
      setShowAddRehearsal(false);
      toast.success('Rehearsal scheduled!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const deleteRehearsal = async (id: string) => {
    if (!confirm('Delete this rehearsal?')) return;
    try {
      await del(`/choir/rehearsals/${id}`);
      setRehearsals(prev => prev.filter(r => r.id !== id));
      toast.success('Rehearsal deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault(); if (!broadcastMsg.trim()) return;
    setSaving(true);
    try {
      await post('/broadcasts', { message: broadcastMsg, audience: 'choir' });
      setBroadcastMsg('');
      toast.success('Broadcast sent to choir!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div>;

  const tabs = [
    { id: 'members', label: `Members (${choir.length})` },
    { id: 'music', label: `Music Library (${music.length})` },
    { id: 'rehearsals', label: `Rehearsals (${rehearsals.length})` },
    { id: 'broadcasts', label: 'Broadcasts' },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Choir Management</h1>
        <p className="text-sm text-gray-500">Director: {member?.first_name} {member?.last_name} · {member?.voice_group || member?.choir_role || 'Choir Director'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Total Members', choir.length, 'bg-purple-50 text-purple-700'], ['Songs', music.length, 'bg-indigo-50 text-indigo-700'], ['Rehearsals', rehearsals.length, 'bg-green-50 text-green-700'], ['Upcoming', rehearsals.filter(r => new Date(r.rehearsal_date) >= new Date()).length, 'bg-amber-50 text-amber-700']].map(([l, v, c]) => (
          <div key={l as string} className={`card p-4 text-center ${c}`}><div className="text-2xl font-bold">{v}</div><div className="text-xs mt-1">{l}</div></div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="space-y-2">
          {choir.map(m => (
            <div key={m.id} className="card p-4 flex items-center gap-4">
              <img src={m.profile_photo_url || 'https://placehold.co/40'} className="h-10 w-10 rounded-full object-cover" alt="" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{m.first_name} {m.last_name}</div>
                <div className="text-xs text-gray-500">{m.voice_group} · {m.choir_role?.replace(/_/g, ' ')} · {m.phone || m.email}</div>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">{m.voice_group}</span>
            </div>
          ))}
          {choir.length === 0 && <div className="card p-12 text-center text-gray-400">No choir members yet</div>}
        </div>
      )}

      {/* Music Tab */}
      {tab === 'music' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddSong(true)} className="btn-primary"><Music2 size={16} /> Add Song</button>
          {showAddSong && (
            <form onSubmit={addSong} className="card p-5 space-y-3">
              <h3 className="font-bold text-gray-900">Add New Song</h3>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Title *" value={songForm.title} onChange={e => setSongForm({...songForm, title: e.target.value})} className="input-base" />
                <input placeholder="Artist" value={songForm.artist} onChange={e => setSongForm({...songForm, artist: e.target.value})} className="input-base" />
                <input placeholder="Genre" value={songForm.genre} onChange={e => setSongForm({...songForm, genre: e.target.value})} className="input-base" />
                <input placeholder="Key (e.g. C, G, Bb)" value={songForm.key_note} onChange={e => setSongForm({...songForm, key_note: e.target.value})} className="input-base" />
                <input placeholder="BPM" type="number" value={songForm.bpm} onChange={e => setSongForm({...songForm, bpm: e.target.value})} className="input-base" />
              </div>
              <textarea placeholder="Lyrics" rows={5} value={songForm.lyrics} onChange={e => setSongForm({...songForm, lyrics: e.target.value})} className="input-base resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddSong(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving && <Loader2 size={14} className="animate-spin" />} Save Song</button>
              </div>
            </form>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {music.map(s => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{s.title}</div>
                    {s.artist && <div className="text-xs text-gray-500">{s.artist}</div>}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {s.genre && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.genre}</span>}
                      {s.key_note && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">Key: {s.key_note}</span>}
                      {s.lyrics && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Lyrics</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteSong(s.id)} className="p-1 text-red-400 hover:text-red-600 shrink-0"><X size={14} /></button>
                </div>
              </div>
            ))}
            {music.length === 0 && <div className="card p-12 text-center text-gray-400 col-span-3">No songs yet</div>}
          </div>
        </div>
      )}

      {/* Rehearsals Tab */}
      {tab === 'rehearsals' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddRehearsal(true)} className="btn-primary"><Calendar size={16} /> Schedule Rehearsal</button>
          {showAddRehearsal && (
            <form onSubmit={addRehearsal} className="card p-5 space-y-3">
              <h3 className="font-bold text-gray-900">Schedule Rehearsal</h3>
              <input required placeholder="Title *" value={rehearsalForm.title} onChange={e => setRehearsalForm({...rehearsalForm, title: e.target.value})} className="input-base" />
              <div className="grid grid-cols-3 gap-3">
                <input required type="date" value={rehearsalForm.rehearsal_date} onChange={e => setRehearsalForm({...rehearsalForm, rehearsal_date: e.target.value})} className="input-base" />
                <input type="time" value={rehearsalForm.start_time} onChange={e => setRehearsalForm({...rehearsalForm, start_time: e.target.value})} className="input-base" />
                <input type="time" value={rehearsalForm.end_time} onChange={e => setRehearsalForm({...rehearsalForm, end_time: e.target.value})} className="input-base" />
              </div>
              <input placeholder="Location" value={rehearsalForm.location} onChange={e => setRehearsalForm({...rehearsalForm, location: e.target.value})} className="input-base" />
              <textarea placeholder="Notes" rows={3} value={rehearsalForm.notes} onChange={e => setRehearsalForm({...rehearsalForm, notes: e.target.value})} className="input-base resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddRehearsal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving && <Loader2 size={14} className="animate-spin" />} Schedule</button>
              </div>
            </form>
          )}
          <div className="space-y-2">
            {rehearsals.map(r => (
              <div key={r.id} className="card p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0"><Mic size={16} className="text-indigo-600" /></div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{r.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(r.rehearsal_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    {r.start_time && ` · ${r.start_time}`}{r.location && ` · ${r.location}`}
                  </div>
                </div>
                <button onClick={() => deleteRehearsal(r.id)} className="p-1 text-red-400 hover:text-red-600"><X size={14} /></button>
              </div>
            ))}
            {rehearsals.length === 0 && <div className="card p-12 text-center text-gray-400">No rehearsals scheduled</div>}
          </div>
        </div>
      )}

      {/* Broadcasts Tab */}
      {tab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-3">Send Choir Broadcast</h3>
            <form onSubmit={sendBroadcast} className="space-y-3">
              <textarea required rows={4} placeholder="Type your message to all choir members..." value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className="input-base resize-none" />
              <button type="submit" disabled={saving} className="btn-primary">{saving && <Loader2 size={14} className="animate-spin" />} Send to Choir</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Leader Portal ────────────────────────────────────────────────
const LeaderPortal: React.FC = () => {
  const { member } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      get<any>('/announcements?limit=10').then(r => setAnnouncements(r.announcements || [])).catch(() => {}),
      get<any>('/members?status=approved&limit=50').then(r => setMembers(r.members || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault(); if (!broadcastMsg.trim()) return;
    setSaving(true);
    try {
      await post('/broadcasts', { message: broadcastMsg, audience: 'all' });
      setBroadcastMsg('');
      toast.success('Broadcast sent!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div>;

  const roleLabel = (member?.role || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leadership Tools</h1>
        <p className="text-sm text-gray-500">{roleLabel} · {member?.first_name} {member?.last_name}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Send Broadcast */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-3">Send Broadcast</h3>
          <form onSubmit={sendBroadcast} className="space-y-3">
            <textarea required rows={4} placeholder="Type your message..." value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className="input-base resize-none" />
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">{saving && <Loader2 size={14} className="animate-spin" />} Send Broadcast</button>
          </form>
        </div>
        {/* Member Overview */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-3">Members ({members.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.slice(0, 20).map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <img src={m.profile_photo_url || 'https://placehold.co/32'} className="h-8 w-8 rounded-full object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{m.first_name} {m.last_name}</div>
                  <div className="text-xs text-gray-500 capitalize">{m.role?.replace(/_/g, ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Recent Announcements */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-900 mb-3">Recent Announcements</h3>
        <div className="space-y-2">
          {announcements.slice(0, 5).map(a => (
            <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 text-sm">{a.title}</div>
              <div className="text-xs text-gray-500 mt-1">{new Date(a.created_at).toLocaleDateString()}</div>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-sm text-gray-400">No announcements</p>}
        </div>
      </div>
    </div>
  );
};

// ── Main Member Dashboard ───────────────────────────────────

const MEMBER_NAV: { to: string; label: string; icon: any; end?: boolean }[] = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/dashboard/profile', label: 'Profile', icon: UserIcon },
  { to: '/dashboard/directory', label: 'Directory', icon: Users },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/attendance', label: 'Attendance', icon: Calendar },
  { to: '/dashboard/donate', label: 'Give', icon: DollarSign },
];

const CHOIR_NAV: { to: string; label: string; icon: any; end?: boolean }[] = [{ to: '/dashboard/choir', label: 'Choir Portal', icon: Music2 }];
const DIRECTOR_NAV: { to: string; label: string; icon: any }[] = [{ to: '/dashboard/choir-director', label: 'Choir Management', icon: Music2 }];
const LEADER_NAV: { to: string; label: string; icon: any }[] = [{ to: '/dashboard/leader', label: 'Leadership Tools', icon: Users }];

const MemberDashboard: React.FC = () => {
  const { member, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [birthdays, setBirthdays] = useState<{ first_name: string }[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    get<{ birthdays: { first_name: string }[] }>('/members/birthdays').then((r) => setBirthdays(r.birthdays || [])).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const role = member?.role || 'member';
  const isChoir = role === 'choir_member' || role === 'choir';
  const isDirector = (member as any)?.is_choir_director === true || (member as any)?.choir_role === 'choir_director';
  const isLeader = ['pastor', 'elder', 'deacon', 'leader'].includes(role);

  const navItems: { to: string; label: string; icon: any; end?: boolean }[] = [
    ...MEMBER_NAV,
    ...(isChoir && !isDirector ? CHOIR_NAV : []),
    ...(isDirector ? DIRECTOR_NAV : []),
    ...(isLeader ? LEADER_NAV : []),
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-purple-900 text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-purple-700">
          <div className="h-9 w-9 bg-amber-400 rounded-lg flex items-center justify-center shrink-0">
            <Church size={20} className="text-purple-900" />
          </div>
          <div>
            <div className="font-serif font-bold text-sm leading-tight">{CHURCH_NAME}</div>
            <div className="text-xs text-purple-300">
              {isDirector ? 'Choir Director Portal' : isLeader ? 'Leadership Portal' : 'Member Portal'}
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((n) => {
            const active = n.end ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-white/15 text-white' : 'text-purple-200 hover:bg-white/10 hover:text-white'}`}>
                <n.icon size={18} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-purple-700">
          {member && (
            <div className="flex items-center gap-3 mb-3">
              <img src={member.profile_photo_url || 'https://placehold.co/40'} className="h-9 w-9 rounded-full object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{member.first_name} {member.last_name}</div>
                <div className="text-xs text-purple-300">{member.member_code}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-purple-300 hover:bg-white/10 hover:text-white">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"><Menu size={22} /></button>
          {birthdays.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 hidden sm:flex">
              <Cake size={15} /> 🎂 {birthdays.map((b) => b.first_name).join(', ')}'s birthday today!
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-gray-600 hidden sm:block">Welcome, <strong>{member?.first_name}</strong></span>
            <img src={member?.profile_photo_url || 'https://placehold.co/40'} className="h-9 w-9 rounded-full object-cover" alt="" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<MemberProfile />} />
            <Route path="directory" element={<MemberDirectory />} />
            <Route path="notifications" element={<MemberNotifications />} />
            <Route path="attendance" element={<MemberAttendance />} />
            <Route path="donate" element={<MemberDonate />} />
            {/* Choir member portal */}
            <Route path="choir" element={<ChoirPortal />} />
            {/* Choir director management portal */}
            <Route path="choir-director" element={<ChoirDirectorPortal />} />
            {/* Leader portal */}
            <Route path="leader" element={<LeaderPortal />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default MemberDashboard;
