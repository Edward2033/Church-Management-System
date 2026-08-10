import React, { useEffect, useState, useRef } from 'react';
import { get, del, post, patch, User, API_BASE_URL, MemberStats } from '@/lib/api';
import { printIDCard, printMemberProfile, printMemberList, exportCSV } from '@/lib/print';
import { Search, Printer, FileSpreadsheet, Check, Ban, Trash2, Eye, Loader2, X, Music2, UserPlus, QrCode, Mail, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import PrintableRegistrationForm from '@/components/PrintableRegistrationForm';

// ── Safe date formatter: prevents UTC-to-local timezone shift ──
function fmtDate(dateStr?: string): string {
  if (!dateStr) return '';
  const part = dateStr.slice(0, 10); // '2001-12-25'
  const [year, month, day] = part.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day); // local midnight — no UTC shift
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const STATUS_COLOR: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-700',
};

const CreateUserModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', middle_name: '', last_name: '', gender: '', date_of_birth: '',
    email: '', phone: '', whatsapp_number: '', address: '', city: '', occupation: '',
    marital_status: '', baptism_status: false, emergency_name: '', emergency_phone: '',
    emergency_relation: '', bio: '', role: 'member', voice_group: '', is_director: false,
  });
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null) data.append(key, String(value));
      });
      if (photo) data.append('profilePhoto', photo);

      const response = await fetch(`${API_BASE_URL}/members/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('cms_token')}` },
        body: data,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create user');
      }
      toast.success('User created successfully! Password setup email sent.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isChoir = formData.role === 'choir_member';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-purple-700 to-indigo-800 px-6 py-4 text-white relative sticky top-0 z-10">
          <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20"><X size={20} /></button>
          <h3 className="text-xl font-bold flex items-center gap-2"><UserPlus size={22} /> Create New User</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Photo *</label>
            <input type="file" accept="image/*" required onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="input-base" />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-base" required>
              <option value="member">Member</option>
              <option value="choir_member">Choir Member</option>
              <option value="admin">Admin</option>
              <option value="pastor">Pastor</option>
              <option value="elder">Elder</option>
              <option value="deacon">Deacon</option>
              <option value="leader">Leader</option>
            </select>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="First Name *" value={formData.first_name} required
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="input-base" />
            <input placeholder="Middle Name" value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} className="input-base" />
            <input placeholder="Last Name *" value={formData.last_name} required
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="input-base" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select value={formData.gender} required onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="input-base">
              <option value="">Select Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="date" placeholder="Date of Birth *" value={formData.date_of_birth} required
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="input-base" />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <input type="email" placeholder="Email *" value={formData.email} required
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-base" />
            <input type="tel" placeholder="Phone *" value={formData.phone} required
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-base" />
            <input type="tel" placeholder="WhatsApp" value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })} className="input-base" />
            <input placeholder="City" value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input-base" />
          </div>

          <input placeholder="Address *" value={formData.address} required
            onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-base" />

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Occupation" value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} className="input-base" />
            <select value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
              className="input-base">
              <option value="">Marital Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formData.baptism_status}
              onChange={(e) => setFormData({ ...formData, baptism_status: e.target.checked })} />
            <span className="text-sm font-medium text-gray-700">Baptized</span>
          </label>

          {/* Choir Fields */}
          {isChoir && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Music2 size={18} /> Choir Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.voice_group} required={isChoir}
                  onChange={(e) => setFormData({ ...formData, voice_group: e.target.value })} className="input-base">
                  <option value="">Select Voice Group *</option>
                  <option value="Soprano">Soprano</option>
                  <option value="Alto">Alto</option>
                  <option value="Tenor">Tenor</option>
                  <option value="Bass">Bass</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_director}
                  onChange={(e) => setFormData({ ...formData, is_director: e.target.checked })} />
                <span className="text-sm font-medium text-gray-700">This person is the Choir Director</span>
              </label>
            </div>
          )}

          {/* Emergency Contact */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold text-gray-800">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-4">
              <input placeholder="Name" value={formData.emergency_name}
                onChange={(e) => setFormData({ ...formData, emergency_name: e.target.value })} className="input-base" />
              <input placeholder="Phone" value={formData.emergency_phone}
                onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })} className="input-base" />
              <input placeholder="Relationship" value={formData.emergency_relation}
                onChange={(e) => setFormData({ ...formData, emergency_relation: e.target.value })} className="input-base" />
            </div>
          </div>

          <textarea placeholder="Bio / Additional Information" value={formData.bio} rows={3}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="input-base"></textarea>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><UserPlus size={16} /> Create User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditMemberModal: React.FC<{ member: User; onClose: () => void; onSuccess: () => void }> = ({ member: m, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: m.first_name || '',
    middle_name: m.middle_name || '',
    last_name: m.last_name || '',
    gender: m.gender || '',
    date_of_birth: m.date_of_birth || '',
    phone: m.phone || '',
    whatsapp_number: m.whatsapp_number || '',
    address: m.address || '',
    city: m.city || '',
    occupation: m.occupation || '',
    marital_status: m.marital_status || '',
    baptism_status: m.baptism_status || false,
    emergency_name: m.emergency_name || '',
    emergency_phone: m.emergency_phone || '',
    emergency_relation: m.emergency_relation || '',
    bio: m.bio || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await patch(`/members/${m.member_id || m.id}`, form);
      toast.success('Member updated successfully');
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
        <div className="bg-gradient-to-br from-purple-700 to-indigo-800 px-6 py-4 text-white relative sticky top-0 z-10">
          <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20"><X size={20} /></button>
          <h3 className="text-xl font-bold flex items-center gap-2"><Pencil size={22} /> Edit Member</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="First Name *" value={form.first_name} required
              onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input-base" />
            <input placeholder="Middle Name" value={form.middle_name}
              onChange={(e) => setForm({ ...form, middle_name: e.target.value })} className="input-base" />
            <input placeholder="Last Name *" value={form.last_name} required
              onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input-base" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select value={form.gender} required onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-base">
              <option value="">Select Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="date" value={form.date_of_birth} required
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="input-base" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="tel" placeholder="Phone *" value={form.phone} required
              onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-base" />
            <input type="tel" placeholder="WhatsApp" value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className="input-base" />
          </div>

          <input placeholder="Address *" value={form.address} required
            onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-base" />

          <div className="grid grid-cols-2 gap-4">
            <input placeholder="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-base" />
            <input placeholder="Occupation" value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="input-base" />
          </div>

          <select value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} className="input-base">
            <option value="">Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.baptism_status}
              onChange={(e) => setForm({ ...form, baptism_status: e.target.checked })} />
            <span className="text-sm font-medium text-gray-700">Baptized</span>
          </label>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold text-gray-800">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-4">
              <input placeholder="Name" value={form.emergency_name}
                onChange={(e) => setForm({ ...form, emergency_name: e.target.value })} className="input-base" />
              <input placeholder="Phone" value={form.emergency_phone}
                onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} className="input-base" />
              <input placeholder="Relationship" value={form.emergency_relation}
                onChange={(e) => setForm({ ...form, emergency_relation: e.target.value })} className="input-base" />
            </div>
          </div>

          <textarea placeholder="Bio / Additional Information" value={form.bio} rows={3}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input-base"></textarea>

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

const ProfileModal: React.FC<{ 
  member: User; 
  onClose: () => void; 
  onApprove: (id: string) => void; 
  onReject: (id: string) => void; 
  onGrantAccount: (id: string) => void;
  onDisable: (id: string) => void;
  onEdit: (m: User) => void;
  onDelete: (id: string) => void;
  onRoleChange: (id: string, role: string) => void;
}> = ({ member: m, onClose, onApprove, onReject, onGrantAccount, onDisable, onEdit, onDelete, onRoleChange }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>(m.role);
  const [changingRole, setChangingRole] = React.useState(false);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Registration_${m.member_code}_${m.first_name}_${m.last_name}`,
  });

  const handleRoleChange = async () => {
    if (selectedRole === m.role) return;
    if (!confirm(`Change ${m.first_name} ${m.last_name}'s role to ${selectedRole}?`)) return;
    setChangingRole(true);
    await onRoleChange(m.id, selectedRole);
    setChangingRole(false);
  };

  const verificationUrl = `${window.location.origin}/verify/${m.member_code}`;

  const isPending = m.status === 'pending' || m.approval_status === 'pending';
  const isApprovedNoPassword = (m.status === 'approved' || m.approval_status === 'approved') && !m.password_set;
  const isApprovedWithPassword = (m.status === 'approved' || m.approval_status === 'approved') && m.password_set;

  return (
    <>
      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <PrintableRegistrationForm ref={printRef} member={m} verificationUrl={verificationUrl} />
      </div>

      {/* Modal Display */}
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
            {/* Role Management Section */}
            <div className="mb-4 pb-4 border-b-2 border-purple-100 bg-purple-50/50 -mx-6 px-6 py-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Change Member Role</label>
              <div className="flex gap-2">
                <select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="member" className="text-gray-900 bg-white">Member</option>
                  <option value="choir_member" className="text-gray-900 bg-white">Choir Member</option>
                  <option value="choir_director" className="text-gray-900 bg-white">Choir Director</option>
                  <option value="leader" className="text-gray-900 bg-white">Leader</option>
                  <option value="pastor" className="text-gray-900 bg-white">Pastor</option>
                  <option value="elder" className="text-gray-900 bg-white">Elder</option>
                  <option value="deacon" className="text-gray-900 bg-white">Deacon</option>
                  <option value="admin" className="text-gray-900 bg-white">Admin</option>
                </select>
                <button 
                  onClick={handleRoleChange}
                  disabled={changingRole || selectedRole === m.role}
                  className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
                >
                  {changingRole ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : 'Update Role'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Current role: <span className="font-semibold text-purple-700">{m.role}</span></p>
            </div>

            {[
              ['Email', m.email],
              ['Phone', m.phone],
              ['WhatsApp', m.whatsapp_number],
              ['Gender', m.gender],
              ['Date of Birth', fmtDate(m.date_of_birth)],
              ['Address', m.address],
              ['City', m.city],
              ['Occupation', m.occupation],
              ['Marital Status', m.marital_status],
              ['Baptized', (m.baptism_status ?? m.baptized) === true ? 'Yes' : (m.baptism_status ?? m.baptized) === false ? 'No' : undefined],
              ['Baptism Date', m.baptism_date ? new Date(m.baptism_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined],
              ['Membership Status', m.membership_status],
              ['Role', m.role],
              ['Department', m.department_name || m.department],
              m.role === 'choir_member' || m.role === 'choir' ? ['Voice Group', m.voice_group || m.voice_type] : null,
              m.role === 'choir_member' || m.role === 'choir' ? ['Choir Role', m.choir_role] : null,
              m.role === 'choir_member' || m.role === 'choir' ? ['Experience', m.experience_level] : null,
              m.role === 'choir_member' || m.role === 'choir' ? ['Instruments', (m.instruments || []).join(', ')] : null,
              m.role === 'choir_member' || m.role === 'choir' ? ['Activities', (m.choir_activities || []).join(', ')] : null,
              ['Emergency', (m.emergency_name || m.emergency_contact_name) ? `${m.emergency_name || m.emergency_contact_name} · ${m.emergency_phone || m.emergency_contact_phone}` : undefined],
              ['Registered', new Date(m.created_at).toLocaleDateString()],
              ['Date Joined', m.date_joined ? new Date(m.date_joined).toLocaleDateString() : undefined],
              ['Approved', m.approved_at ? new Date(m.approved_at).toLocaleDateString() : undefined],
              ['Last Login', m.last_login ? new Date(m.last_login).toLocaleDateString() : 'Never'],
            ].filter((x): x is [string, string | undefined] => x !== null).map(([k, v]) => v ? (
              <div key={k as string} className="flex justify-between border-b border-gray-100 py-2.5">
                <span className="text-sm text-gray-500">{k}</span>
                <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
              </div>
            ) : null)}
            {m.bio && <div className="pt-3"><p className="text-sm font-medium text-gray-500 mb-1">Bio</p><p className="text-sm text-gray-700">{m.bio}</p></div>}
          </div>
          <div className="flex flex-wrap gap-2 border-t bg-gray-50 px-6 py-4">
            <button onClick={() => printMemberProfile(m)} className="btn-primary py-2 text-sm flex-1 justify-center"><Printer size={15} /> Print Profile</button>
            <button onClick={() => printIDCard(m)} className="btn-outline py-2 text-sm flex-1 justify-center"><Printer size={15} /> Print ID Card</button>
            <button onClick={() => onEdit(m)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Pencil size={15} /> Edit
            </button>
            
            {/* Pending: Show Approve and Reject */}
            {isPending && (
              <>
                <button onClick={() => onApprove(m.id)} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  <Check size={15} /> Approve
                </button>
                <button onClick={() => onReject(m.id)} className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600">
                  <Ban size={15} /> Reject
                </button>
              </>
            )}
            
            {/* Approved but no password: Show Grant Account */}
            {isApprovedNoPassword && (
              <button onClick={() => onGrantAccount(m.id)} className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                <Mail size={15} /> Grant Account
              </button>
            )}
            
            {/* Approved with password: Show Disable/Enable */}
            {isApprovedWithPassword && (
              <button onClick={() => onDisable(m.id)} className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                <Ban size={15} /> {m.is_active ? 'Disable' : 'Enable'}
              </button>
            )}
            
            <button onClick={() => onDelete(m.id)} className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MemberStats | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { members: data } = await get<{ members: User[] }>(`/members?${params}`);
      setMembers(data || []);
    } catch (err: any) {
      toast.error(`Failed to load members: ${err.message}`);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    get<MemberStats>('/members/stats')
      .then((s) => setStats(s))
      .catch(() => {});
  }, []);

  // In the members list, m.id = members.id (the member table primary key).
  // All auth/approve, auth/reject, auth/grant-account, members/:id endpoints
  // expect the members.id — which is m.id from the list query.

  const approve = async (id: string) => {
    try { 
      await post(`/auth/approve/${id}`, {}); 
      toast.success('Member approved'); 
      setSelected(null); 
      load(); 
    }
    catch (err: any) { toast.error(err.message); }
  };
  
  const reject = async (id: string) => {
    try { 
      await post(`/auth/reject/${id}`, {}); 
      toast.success('Member rejected'); 
      setSelected(null); 
      load(); 
    }
    catch (err: any) { toast.error(err.message); }
  };
  
  const grantAccount = async (id: string) => {
    try {
      await post(`/auth/grant-account/${id}`, {});
      toast.success('Account setup email sent');
      setSelected(null);
      load();
    } catch (err: any) { toast.error(err.message); }
  };
  
  const disable = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/members/${id}/disable`, {
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
    if (!confirm('Delete this member permanently?')) return;
    try { 
      await del(`/members/${id}`); 
      toast.success('Member deleted'); 
      setSelected(null); 
      load(); 
    }
    catch (err: any) { toast.error(err.message); }
  };

  const changeRole = async (memberId: string, role: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-role/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token')}`
        },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Role updated successfully');
      setSelected(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update role');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">
            {stats ? `${stats.totalAll ?? stats.totalMembers ?? stats.total} total · ${stats.pending} pending · ${stats.choirMembers ?? stats.choir} choir` : `${members.length} records`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary py-2 text-sm"><UserPlus size={15} /> Create User</button>
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
          <option value="member">Member</option>
          <option value="choir_member">Choir Member</option>
          <option value="pastor">Pastor</option>
          <option value="elder">Elder</option>
          <option value="deacon">Deacon</option>
          <option value="leader">Leader</option>
          <option value="admin">Admin</option>
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
                        <button onClick={() => printIDCard(m)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Print ID Card"><Printer size={15} /></button>
                        {m.status === 'pending' || m.approval_status === 'pending' ? (
                          <>
                            <button onClick={() => approve(m.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><Check size={15} /></button>
                            <button onClick={() => reject(m.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Ban size={15} /></button>
                          </>
                        ) : null}
                        {(m.approval_status === 'approved' && !m.password_set) && (
                          <button onClick={() => grantAccount(m.id)} className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50" title="Grant Account"><Mail size={15} /></button>
                        )}
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

      {selected && <ProfileModal member={selected} onClose={() => setSelected(null)} onApprove={approve} onReject={reject} onGrantAccount={grantAccount} onDisable={disable} onEdit={(m) => { setSelected(null); setEditing(m); }} onDelete={remove} onRoleChange={changeRole} />}
      {editing && <EditMemberModal member={editing} onClose={() => setEditing(null)} onSuccess={load} />}
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={load} />}
    </div>
  );
};

export default AdminMembers;
