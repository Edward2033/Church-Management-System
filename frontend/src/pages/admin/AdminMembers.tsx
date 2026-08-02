import React, { useEffect, useState } from 'react';
import { get, del, post, User } from '@/lib/api';
import { printMember, printMemberList, exportCSV } from '@/lib/print';
import { Search, Printer, FileSpreadsheet, Check, Ban, Trash2, Eye, Loader2, X, Music2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLOR: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-700',
};

const ProfileModal: React.FC<{ member: User; onClose: () => void; onApprove: (id: string) => void; onReject: (id: string) => void; onDelete: (id: string) => void }> = ({ member: m, onClose, onApprove, onReject, onDelete }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="bg-gradient-to-br from-purple-700 to-indigo-800 px-6 pb-14 pt-6 text-center text-white relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20"><X size={20} /></button>
        <p className="text-xs uppercase tracking-widest text-purple-200">Member Profile</p>
      </div>
      <div className="-mt-10 flex flex-col items-center px-6">
        <img src={m.profile_photo_url || 'https://placehold.co/200x200?text=No+Photo'} className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg" alt="" />
        <h3 className="mt-3 text-xl font-bold text-gray-900">{m.first_name} {m.last_name}</h3>
        <span className="text-sm font-bold text-purple-700">{m.member_code || 'Pending ID'}</span>
        <div className="mt-2 flex gap-2 flex-wrap justify-center">
          <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold uppercase text-purple-700">{m.role}</span>
          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase ${STATUS_COLOR[m.approval_status || m.status || '']}`}>{m.approval_status || m.status}</span>
        </div>
      </div>
      <div className="px-6 py-4 space-y-0">
        {[
          ['Gender', m.gender], ['Date of Birth', m.date_of_birth ? new Date(m.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined],
          ['Phone', m.phone], ['WhatsApp', m.whatsapp_number], ['Email', m.email], ['Address', m.address],
          m.role === 'choir_member' || m.role === 'choir' ? ['Voice Group', m.voice_group || m.voice_type] : null,
          m.role === 'choir_member' || m.role === 'choir' ? ['Main Role', m.main_role] : null,
          m.role === 'choir_member' || m.role === 'choir' ? ['Experience', m.experience_level] : null,
          m.role === 'choir_member' || m.role === 'choir' ? ['Instruments', (m.instruments || []).join(', ')] : null,
          m.role === 'choir_member' || m.role === 'choir' ? ['Activities', (m.choir_activities || []).join(', ')] : null,
          ['Department', m.department_name || m.department],
          ['Baptized', (m.baptism_status ?? m.baptized) === true ? 'Yes' : (m.baptism_status ?? m.baptized) === false ? 'No' : undefined],
          ['Emergency', (m.emergency_name || m.emergency_contact_name) ? `${m.emergency_name || m.emergency_contact_name} · ${m.emergency_phone || m.emergency_contact_phone}` : undefined],
          ['Registered', new Date(m.created_at).toLocaleDateString()],
        ].filter((x): x is [string, string | undefined] => x !== null).map(([k, v]) => v ? (
          <div key={k as string} className="flex justify-between border-b border-gray-100 py-2.5">
            <span className="text-sm text-gray-500">{k}</span>
            <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
          </div>
        ) : null)}
        {m.bio && <div className="pt-3"><p className="text-sm font-medium text-gray-500 mb-1">Bio</p><p className="text-sm text-gray-700">{m.bio}</p></div>}
      </div>
      <div className="flex flex-wrap gap-2 border-t bg-gray-50 px-6 py-4">
        <button onClick={() => printMember(m)} className="btn-primary py-2 text-sm flex-1 justify-center"><Printer size={15} /> Print / PDF</button>
        {(m.status === 'pending' || m.approval_status === 'pending') ? (
          <>
            <button onClick={() => onApprove(m.id)} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"><Check size={15} /> Approve</button>
            <button onClick={() => onReject(m.id)} className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"><Ban size={15} /> Reject</button>
          </>
        ) : null}
        <button onClick={() => onDelete(m.id)} className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
      </div>
    </div>
  </div>
);

const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { members: data } = await get<{ members: User[] }>(`/members?${params}`);
      setMembers(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, roleFilter, statusFilter]);

  const approve = async (id: string) => {
    try { await post(`/auth/approve/${id}`, {}); toast.success('Member approved & email sent'); setSelected(null); load(); }
    catch (err: any) { toast.error(err.message); }
  };
  const reject = async (id: string) => {
    try { await post(`/auth/reject/${id}`, {}); toast.success('Member rejected'); setSelected(null); load(); }
    catch (err: any) { toast.error(err.message); }
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this member permanently?')) return;
    try { await del(`/members/${id}`); toast.success('Member deleted'); setSelected(null); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">{members.length} records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportCSV(members)} className="btn-outline py-2 text-sm"><FileSpreadsheet size={15} /> Export CSV</button>
          <button onClick={() => printMemberList(members)} className="btn-outline py-2 text-sm"><Printer size={15} /> Print List</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, code..."
            className="input-base pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-base w-auto">
          <option value="">All Roles</option>
          {['member', 'choir', 'admin'].map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-auto">
          <option value="">All Status</option>
          {['pending', 'approved', 'rejected', 'inactive'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Photo', 'Member Code', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><img src={m.profile_photo_url || 'https://placehold.co/36'} className="h-9 w-9 rounded-lg object-cover" alt="" /></td>
                    <td className="px-4 py-3 font-mono text-purple-700 font-semibold text-xs">{m.member_code || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{m.first_name} {m.last_name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.email}</td>
                    <td className="px-4 py-3 text-gray-500">{m.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 capitalize text-xs font-semibold">
                        {(m.role === 'choir_member' || m.role === 'choir') && <Music2 size={12} className="text-indigo-600" />}{m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLOR[m.approval_status || m.status || '']}`}>{m.approval_status || m.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setSelected(m)} className="p-1.5 rounded-lg text-gray-500 hover:bg-purple-50 hover:text-purple-700"><Eye size={15} /></button>
                        <button onClick={() => printMember(m)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><Printer size={15} /></button>
                        {m.status === 'pending' || m.approval_status === 'pending' ? (
                          <>
                            <button onClick={() => approve(m.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><Check size={15} /></button>
                            <button onClick={() => reject(m.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Ban size={15} /></button>
                          </>
                        ) : null}
                        <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">No members found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <ProfileModal member={selected} onClose={() => setSelected(null)} onApprove={approve} onReject={reject} onDelete={remove} />}
    </div>
  );
};

export default AdminMembers;
