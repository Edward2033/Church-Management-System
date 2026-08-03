import React, { useEffect, useRef, useState } from 'react';
import { get, post, del, patch, API_BASE_URL } from '@/lib/api';
import type { ChoirMember } from '@/lib/api';
import { Music2, Check, Ban, Trash2, Eye, Loader2, X, Plus, Mic, BookOpen, Send, Printer, Mail, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import PrintableRegistrationForm from '@/components/PrintableRegistrationForm';

const VOICE_GROUPS = ['Soprano', 'Alto', 'Tenor', 'Bass'];
const TABS = ['Members', 'Rehearsals', 'Music Library', 'Broadcasts'] as const;
type Tab = typeof TABS[number];

const STATUS_COLOR: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
};

// ── Edit Choir Member Modal ───────────────────────────────────
const EditChoirMemberModal: React.FC<{ member: ChoirMember; onClose: () => void; onSuccess: () => void }> = ({ member: m, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    first_name: m.first_name || '',
    middle_name: m.middle_name || '',
    last_name: m.last_name || '',
    phone: m.phone || '',
    whatsapp_number: m.whatsapp_number || '',
    address: m.address || '',
    city: m.city || '',
    occupation: m.occupation || '',
    marital_status: m.marital_status || '',
    bio: m.bio || '',
  });
  const [choirForm, setChoirForm] = useState({
    voice_group: m.voice_group || '',
    choir_role: m.choir_role || '',
    experience_level: m.experience_level || '',
    main_role: m.main_role || '',
    notes: m.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all([
        patch(`/members/${m.member_id}`, personalForm),
        patch(`/choir/${m.id}`, choirForm),
      ]);
      toast.success('Choir member updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-indigo-700 to-purple-800 px-6 py-4 text-white relative sticky top-0 z-10">
          <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20"><X size={20} /></button>
          <h3 className="text-xl font-bold flex items-center gap-2"><Pencil size={22} /> Edit Choir Member</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Info Section */}
          <div className="border-b pb-6">
            <h4 className="font-semibold text-gray-800 mb-4">Personal Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="First Name *" value={personalForm.first_name} required
                  onChange={(e) => setPersonalForm({ ...personalForm, first_name: e.target.value })} className="input-base" />
                <input placeholder="Middle Name" value={personalForm.middle_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, middle_name: e.target.value })} className="input-base" />
                <input placeholder="Last Name *" value={personalForm.last_name} required
                  onChange={(e) => setPersonalForm({ ...personalForm, last_name: e.target.value })} className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="tel" placeholder="Phone *" value={personalForm.phone} required
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} className="input-base" />
                <input type="tel" placeholder="WhatsApp" value={personalForm.whatsapp_number}
                  onChange={(e) => setPersonalForm({ ...personalForm, whatsapp_number: e.target.value })} className="input-base" />
              </div>
              <input placeholder="Address" value={personalForm.address}
                onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })} className="input-base" />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="City" value={personalForm.city}
                  onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })} className="input-base" />
                <input placeholder="Occupation" value={personalForm.occupation}
                  onChange={(e) => setPersonalForm({ ...personalForm, occupation: e.target.value })} className="input-base" />
              </div>
              <select value={personalForm.marital_status} onChange={(e) => setPersonalForm({ ...personalForm, marital_status: e.target.value })} className="input-base">
                <option value="">Marital Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
              <textarea placeholder="Bio" value={personalForm.bio} rows={2}
                onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })} className="input-base"></textarea>
            </div>
          </div>

          {/* Choir Info Section */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Music2 size={18} /> Choir Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voice Group *</label>
                  <select value={choirForm.voice_group} required onChange={(e) => setChoirForm({ ...choirForm, voice_group: e.target.value })} className="input-base">
                    <option value="">Select Voice Group</option>
                    <option value="Soprano">Soprano</option>
                    <option value="Alto">Alto</option>
                    <option value="Tenor">Tenor</option>
                    <option value="Bass">Bass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Choir Role *</label>
                  <select value={choirForm.choir_role} required onChange={(e) => setChoirForm({ ...choirForm, choir_role: e.target.value })} className="input-base">
                    <option value="">Select Role</option>
                    <option value="choir_member">Choir Member</option>
                    <option value="worship_leader">Worship Leader</option>
                    <option value="secretary">Secretary</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="organist">Organist</option>
                    <option value="pianist">Pianist</option>
                    <option value="drummer">Drummer</option>
                    <option value="assistant_director">Assistant Director</option>
                    <option value="choir_director">Choir Director</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select value={choirForm.experience_level} onChange={(e) => setChoirForm({ ...choirForm, experience_level: e.target.value })} className="input-base">
                    <option value="">Select Experience</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Role</label>
                  <input value={choirForm.main_role} onChange={(e) => setChoirForm({ ...choirForm, main_role: e.target.value })} className="input-base" placeholder="e.g. Lead Singer, Instrumentalist" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={choirForm.notes} rows={3} onChange={(e) => setChoirForm({ ...choirForm, notes: e.target.value })} className="input-base resize-none" placeholder="Additional notes or special instructions"></textarea>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Check size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Choir Member Profile Modal ────────────────────────────────
const ChoirProfileModal: React.FC<{
  member: ChoirMember;
  onClose: () => void;
  onApprove: (id: string) => void;
  onGrantAccount: (memberId: string) => void;
  onDisable: (memberId: string) => void;
  onEdit: (m: ChoirMember) => void;
  onDelete: (id: string) => void;
}> = ({ member: m, onClose, onApprove, onGrantAccount, onDisable, onEdit, onDelete }) => {
  const printRef = useRef<HTMLDivElement>(null);
  // Build a User-compatible object for the print form
  const memberAsUser = {
    ...m,
    id: m.member_id || m.id,
    approval_status: m.member_approval_status || m.approval_status,
    role: m.role || 'choir_member',
    voice_type: m.voice_group,
    created_at: m.registered_at || m.created_at || new Date().toISOString(),
  } as any;
  const verificationUrl = `${window.location.origin}/verify/${m.member_code}`;
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Choir_${m.member_code}_${m.first_name}_${m.last_name}`,
  });

  const isPending          = m.approval_status === 'pending';
  const isApprovedNoPwd    = m.approval_status === 'approved' && !m.password_set;
  const isApprovedWithPwd  = m.approval_status === 'approved' && m.password_set;

  const rows: [string, string | undefined][] = [
    ['Full Name',       `${m.first_name}${m.middle_name ? ' ' + m.middle_name : ''} ${m.last_name}`],
    ['Member Code',     m.member_code],
    ['Email',           m.email],
    ['Phone',           m.phone],
    ['WhatsApp',        m.whatsapp_number],
    ['Gender',          m.gender],
    ['Date of Birth',   m.date_of_birth ? new Date(m.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined],
    ['Address',         m.address],
    ['City',            m.city],
    ['Occupation',      m.occupation],
    ['Marital Status',  m.marital_status],
    ['Baptized',        m.baptism_status === true ? 'Yes' : m.baptism_status === false ? 'No' : undefined],
    ['Voice Group',     m.voice_group],
    ['Choir Role',      m.choir_role],
    ['Experience',      m.experience_level],
    ['Main Role',       m.main_role],
    ['Instruments',     (m.instruments || []).join(', ') || undefined],
    ['Activities',      (m.choir_activities || []).join(', ') || undefined],
    ['Join Date',       m.join_date ? new Date(m.join_date).toLocaleDateString() : undefined],
    ['Emergency',       m.emergency_name ? `${m.emergency_name} · ${m.emergency_phone}` : undefined],
    ['Registered',      m.registered_at ? new Date(m.registered_at).toLocaleDateString() : undefined],
    ['Approved',        m.approved_at ? new Date(m.approved_at).toLocaleDateString() : undefined],
    ['Last Login',      m.last_login ? new Date(m.last_login).toLocaleDateString() : 'Never'],
  ];

  return (
    <>
      <div style={{ display: 'none' }}>
        <PrintableRegistrationForm ref={printRef} member={memberAsUser} verificationUrl={verificationUrl} />
      </div>
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-br from-indigo-700 to-purple-800 px-6 pb-14 pt-6 text-center text-white relative">
            <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20"><X size={20} /></button>
            <p className="text-xs uppercase tracking-widest text-indigo-200">Choir Member Profile</p>
          </div>
          <div className="-mt-10 flex flex-col items-center px-6">
            <img src={m.profile_photo_url || 'https://placehold.co/200x200?text=No+Photo'}
              className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg" alt="" />
            <h3 className="mt-3 text-xl font-bold text-gray-900">{m.first_name} {m.last_name}</h3>
            <span className="text-sm font-bold text-purple-700">{m.member_code || 'Pending ID'}</span>
            <div className="mt-2 flex gap-2 flex-wrap justify-center">
              {m.voice_group && <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">{m.voice_group}</span>}
              <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700 capitalize">{m.choir_role}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase ${STATUS_COLOR[m.approval_status] || 'bg-gray-100 text-gray-600'}`}>
                {m.approval_status}
              </span>
            </div>
          </div>
          <div className="px-6 py-4">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-100 py-2.5">
                <span className="text-sm text-gray-500">{k}</span>
                <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
            {m.bio && <div className="pt-3"><p className="text-sm font-medium text-gray-500 mb-1">Bio</p><p className="text-sm text-gray-700">{m.bio}</p></div>}
            {m.notes && <div className="pt-3"><p className="text-sm font-medium text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-700">{m.notes}</p></div>}
          </div>
          <div className="flex flex-wrap gap-2 border-t bg-gray-50 px-6 py-4">
            <button onClick={handlePrint} className="btn-primary py-2 text-sm flex-1 justify-center"><Printer size={15} /> Print Form</button>
            <button onClick={() => onEdit(m)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Pencil size={15} /> Edit</button>
            {isPending && (
              <>
                <button onClick={() => onApprove(m.id)} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"><Check size={15} /> Approve</button>
                <button onClick={() => onDelete(m.id)} className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"><Ban size={15} /> Reject</button>
              </>
            )}
            {isApprovedNoPwd && (
              <button onClick={() => onGrantAccount(m.member_id || m.id)} className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"><Mail size={15} /> Grant Account</button>
            )}
            {isApprovedWithPwd && (
              <button onClick={() => onDisable(m.member_id || m.id)} className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"><Ban size={15} /> Disable</button>
            )}
            <button onClick={() => onDelete(m.id)} className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Choir Members Tab ─────────────────────────────────────────
const ChoirMembersTab: React.FC = () => {
  const [members, setMembers] = useState<ChoirMember[]>([]);
  const [filter, setFilter] = useState('');
  const [voiceFilter, setVoiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<ChoirMember | null>(null);
  const [editing, setEditing] = useState<ChoirMember | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (voiceFilter)  params.set('voice_group',     voiceFilter);
      if (statusFilter) params.set('approval_status', statusFilter);
      const { choir } = await get<{ choir: ChoirMember[] }>(`/choir?${params}`);
      setMembers(choir || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [voiceFilter, statusFilter]);

  const approve = async (id: string) => {
    try { await post(`/choir/${id}/approve`, {}); toast.success('Choir member approved'); setSelected(null); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const grantAccount = async (memberId: string) => {
    try {
      await post(`/auth/grant-account/${memberId}`, {});
      toast.success('Account setup email sent');
      setSelected(null);
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const disable = async (memberId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/members/${memberId}/disable`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('cms_token')}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setSelected(null);
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this choir member?')) return;
    try { await del(`/choir/${id}`); toast.success('Removed'); setSelected(null); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const filtered = members.filter((m) => {
    const q = filter.toLowerCase();
    return !q || `${m.first_name} ${m.last_name} ${m.member_code} ${m.email}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder="Search name, email, code..." className="input-base flex-1 min-w-48" />
        <select value={voiceFilter} onChange={(e) => setVoiceFilter(e.target.value)} className="input-base w-auto">
          <option value="">All Voice Groups</option>
          {VOICE_GROUPS.map((v) => <option key={v}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-auto">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Photo', 'Name', 'Email', 'Voice', 'Role', 'Experience', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img src={m.profile_photo_url || 'https://placehold.co/36'} className="h-9 w-9 rounded-lg object-cover" alt="" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {m.first_name} {m.last_name}
                      <div className="text-xs text-purple-600 font-mono">{m.member_code || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.email}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs font-semibold">{m.voice_group || '—'}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{m.choir_role}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.experience_level || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLOR[m.approval_status] || 'bg-gray-100 text-gray-600'}`}>
                        {m.approval_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setSelected(m)} className="p-1.5 rounded-lg text-gray-500 hover:bg-purple-50 hover:text-purple-700" title="View"><Eye size={15} /></button>
                        {m.approval_status === 'pending' && (
                          <button onClick={() => approve(m.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" title="Approve"><Check size={15} /></button>
                        )}
                        {m.approval_status === 'approved' && !m.password_set && (
                          <button onClick={() => grantAccount(m.member_id || m.id)} className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50" title="Grant Account"><Mail size={15} /></button>
                        )}
                        <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">No choir members found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <ChoirProfileModal
          member={selected}
          onClose={() => setSelected(null)}
          onApprove={approve}
          onGrantAccount={grantAccount}
          onDisable={disable}
          onEdit={(m) => { setSelected(null); setEditing(m); }}
          onDelete={remove}
        />
      )}

      {editing && (
        <EditChoirMemberModal
          member={editing}
          onClose={() => setEditing(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
};

// ── Rehearsals Tab ────────────────────────────────────────────
const RehearsalsTab: React.FC = () => {
  const [rehearsals, setRehearsals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', rehearsal_date: '', start_time: '', end_time: '', location: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { rehearsals: r } = await get<any>('/choir/rehearsals'); setRehearsals(r || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await post('/choir/rehearsals', form);
      toast.success('Rehearsal scheduled'); setShowForm(false);
      setForm({ title: '', rehearsal_date: '', start_time: '', end_time: '', location: '', notes: '' });
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await del(`/choir/rehearsals/${id}`); toast.success('Deleted'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="btn-primary py-2 text-sm"><Plus size={16} /> Schedule Rehearsal</button>
      </div>

      {loading ? <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div> : (
        <div className="space-y-3">
          {rehearsals.map((r) => (
            <div key={r.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Mic size={18} className="text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{r.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(r.rehearsal_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {r.start_time && ` · ${r.start_time}`}
                    {r.location && ` · ${r.location}`}
                  </div>
                </div>
              </div>
              <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 shrink-0"><Trash2 size={15} /></button>
            </div>
          ))}
          {rehearsals.length === 0 && <div className="card p-16 text-center text-gray-400"><Mic size={36} className="mx-auto mb-3 opacity-30" /><p>No rehearsals scheduled</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Schedule Rehearsal</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" placeholder="Sunday Rehearsal" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input required type="date" value={form.rehearsal_date} onChange={(e) => setForm({ ...form, rehearsal_date: e.target.value })} className="input-base" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input-base" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-base" placeholder="Main Auditorium" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-base resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving && <Loader2 size={16} className="animate-spin" />} Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ── Music Library Tab ─────────────────────────────────────────
const MusicLibraryTab: React.FC = () => {
  const [music, setMusic] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', genre: '', key_note: '', lyrics: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const { music: m } = await get<any>(`/choir/music${params}`);
      setMusic(m || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await post('/choir/music', form);
      toast.success('Song added'); setShowForm(false);
      setForm({ title: '', artist: '', genre: '', key_note: '', lyrics: '' });
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await del(`/choir/music/${id}`); toast.success('Deleted'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs..." className="input-base flex-1 min-w-48" />
        <button onClick={() => setShowForm(true)} className="btn-primary py-2 text-sm"><Plus size={16} /> Add Song</button>
      </div>

      {loading ? <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {music.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{s.title}</div>
                    {s.artist && <div className="text-xs text-gray-500">{s.artist}</div>}
                  </div>
                </div>
                <button onClick={() => remove(s.id)} className="p-1 rounded text-red-400 hover:bg-red-50 shrink-0"><Trash2 size={14} /></button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {s.genre && <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs">{s.genre}</span>}
                {s.key_note && <span className="rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5 text-xs">Key: {s.key_note}</span>}
              </div>
            </div>
          ))}
          {music.length === 0 && <div className="card p-16 text-center text-gray-400 col-span-3"><BookOpen size={36} className="mx-auto mb-3 opacity-30" /><p>No songs in library</p></div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Song</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
                  <input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                  <input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="input-base" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Key Note</label>
                <input value={form.key_note} onChange={(e) => setForm({ ...form, key_note: e.target.value })} className="input-base" placeholder="e.g. C, G, Bb" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Lyrics</label>
                <textarea rows={4} value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })} className="input-base resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving && <Loader2 size={16} className="animate-spin" />} Add Song
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ── Broadcasts Tab ────────────────────────────────────────────
const BroadcastsTab: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('choir');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { broadcasts: b } = await get<any>('/broadcasts'); setBroadcasts(b || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await post<any>('/broadcasts', { message, audience });
      toast.success(res.message || 'Broadcast sent!');
      setMessage('');
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
  };

  const remove = async (id: string) => {
    try { await del(`/broadcasts/${id}`); toast.success('Deleted'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      {/* Compose */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Send size={18} className="text-purple-600" /> Send Broadcast</h3>
        <form onSubmit={send} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="input-base w-auto">
              <option value="choir">Choir Members Only</option>
              <option value="all">All Members</option>
              <option value="leaders">Leaders Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
              className="input-base resize-none" placeholder="Type your message to the choir..." />
          </div>
          <button type="submit" disabled={sending || !message.trim()} className="btn-primary py-2.5">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Sending...' : 'Send Broadcast'}
          </button>
        </form>
      </div>

      {/* History */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">Broadcast History</h3>
        {loading ? <div className="flex justify-center p-8"><Loader2 size={28} className="animate-spin text-purple-700" /></div> : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div key={b.id} className="card p-4 flex gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{b.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-semibold capitalize">{b.audience}</span>
                    <span className="text-xs text-gray-400">{new Date(b.created_at).toLocaleString()}</span>
                    {b.sender_name && <span className="text-xs text-gray-400">by {b.sender_name}</span>}
                  </div>
                </div>
                <button onClick={() => remove(b.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 shrink-0"><Trash2 size={15} /></button>
              </div>
            ))}
            {broadcasts.length === 0 && <div className="card p-12 text-center text-gray-400"><Send size={32} className="mx-auto mb-3 opacity-30" /><p>No broadcasts sent yet</p></div>}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main AdminChoir ───────────────────────────────────────────
const AdminChoir: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Members');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Choir Management</h1>
        <p className="text-sm text-gray-500">Manage choir members, rehearsals, music library, and broadcasts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'bg-white border border-b-white border-gray-200 -mb-px text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'Members' && <Music2 size={14} className="inline mr-1.5" />}
            {tab === 'Rehearsals' && <Mic size={14} className="inline mr-1.5" />}
            {tab === 'Music Library' && <BookOpen size={14} className="inline mr-1.5" />}
            {tab === 'Broadcasts' && <Send size={14} className="inline mr-1.5" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Members' && <ChoirMembersTab />}
      {activeTab === 'Rehearsals' && <RehearsalsTab />}
      {activeTab === 'Music Library' && <MusicLibraryTab />}
      {activeTab === 'Broadcasts' && <BroadcastsTab />}
    </div>
  );
};

export default AdminChoir;
