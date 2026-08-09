import React, { useEffect, useState } from 'react';
import { get, post, Member } from '@/lib/api';
import { Users, Music2, Clock, Cake, Loader2, TrendingUp, Eye, Ban, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ── Safe date formatter: prevents UTC-to-local timezone shift ──
function fmtDate(dateStr?: string): string {
  if (!dateStr) return '';
  const part = dateStr.slice(0, 10); // '2001-12-25'
  const [year, month, day] = part.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day); // local midnight — no UTC shift
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface Stats { total: number; choir: number; pending: number; birthdaysToday: number;
  totalMembers?: number; choirMembers?: number; totalAll?: number; totalUsers?: number; }

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string }> = ({ icon, label, value, color, sub }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  </div>
);

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ total: 0, choir: 0, pending: 0, birthdaysToday: 0 });
  const [birthdays, setBirthdays] = useState<{ first_name: string; last_name: string; member_code: string; profile_photo_url?: string }[]>([]);
  const [pending, setPending] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, m, b] = await Promise.all([
        get<Stats>('/members/stats'),
        get<{ members: Member[] }>('/members?approval_status=pending'),
        get<{ birthdays: { first_name: string; last_name: string; member_code: string; profile_photo_url?: string; date_of_birth?: string }[] }>('/members/birthdays'),
      ]);
      setStats({
        total:          s.total          ?? s.totalMembers  ?? 0,
        choir:          s.choir          ?? s.choirMembers  ?? 0,
        pending:        s.pending        ?? 0,
        birthdaysToday: s.birthdaysToday ?? 0,
        totalAll:       s.totalAll       ?? 0,
        totalUsers:     s.totalUsers     ?? 0,
      });
      setPending(m.members || []);
      
      // Filter to show ONLY today's birthdays (not all birthdays this month)
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      const todayBirthdays = (b.birthdays || []).filter((member) => {
        if (!member.date_of_birth) return false;
        const [, month, day] = member.date_of_birth.slice(0, 10).split('-').map(Number);
        return month === todayMonth && day === todayDay;
      });
      setBirthdays(todayBirthdays);
    } catch (err: any) {
      console.error('Overview load error:', err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setApproving(id);
    try { 
      await post(`/auth/approve/${id}`, {}); 
      load(); 
    }
    catch {}
    finally { setApproving(null); }
  };
  
  const reject = async (id: string) => {
    setRejecting(id);
    try {
      await post(`/auth/reject/${id}`, {});
      load();
    } catch {}
    finally { setRejecting(null); }
  };

  const CHART_DATA = [
    { name: 'Approved', value: stats.total - stats.choir },
    { name: 'Choir', value: stats.choir },
    { name: 'Pending', value: stats.pending },
    { name: 'Birthdays', value: stats.birthdaysToday },
  ];

  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 size={32} className="animate-spin text-purple-700" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Manage your church from one place</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={<Users size={22} className="text-white" />} label="Total Registered" value={stats.totalAll ?? stats.total} color="bg-gray-600" />
        <StatCard icon={<Users size={22} className="text-white" />} label="Approved Members" value={stats.total} color="bg-purple-600" />
        <StatCard icon={<Music2 size={22} className="text-white" />} label="Choir Members" value={stats.choir} color="bg-indigo-500" />
        <StatCard icon={<Clock size={22} className="text-white" />} label="Pending Approvals" value={stats.pending} color="bg-amber-500" />
        <StatCard icon={<Users size={22} className="text-white" />} label="Total Users" value={stats.totalUsers ?? 0} color="bg-teal-500" />
        <StatCard icon={<Cake size={22} className="text-white" />} label="Birthdays Today" value={stats.birthdaysToday} color="bg-rose-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-purple-700" /> Membership Summary</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6B46C1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Birthdays */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Cake size={18} className="text-rose-500" /> Today's Birthdays</h3>
          {birthdays.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No birthdays today</p>
          ) : (
            <div className="space-y-3">
              {birthdays.map((b: any) => (
                <div key={b.member_code || b.first_name} className="flex items-center gap-3">
                  <img src={b.profile_photo_url || 'https://placehold.co/40'} className="h-10 w-10 rounded-full object-cover" alt="" />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{b.first_name} {b.last_name}</div>
                    <div className="text-xs text-gray-400">{b.member_code}</div>
                  </div>
                  <span className="ml-auto text-lg">🎂</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" /> Pending Approvals ({pending.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 pr-4">Name</th><th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Role</th><th className="pb-2 pr-4">Registered</th>
                <th className="pb-2">Actions</th>
              </tr></thead>
              <tbody>
                {pending.slice(0, 8).map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <img src={m.profile_photo_url || 'https://placehold.co/32'} className="h-8 w-8 rounded-lg object-cover" alt="" />
                        <span className="font-medium text-gray-800">{m.first_name} {m.last_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">{m.email}</td>
                    <td className="py-2.5 pr-4"><span className="capitalize rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-semibold">{m.role}</span></td>
                    <td className="py-2.5 pr-4 text-gray-400">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setSelectedMember(m)} 
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => approve(m.id)} 
                          disabled={approving === m.id}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-50"
                          title="Approve"
                        >
                          {approving === m.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        </button>
                        <button 
                          onClick={() => reject(m.id)} 
                          disabled={rejecting === m.id}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                          title="Reject"
                        >
                          {rejecting === m.id ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-purple-700 to-indigo-800 px-6 pb-14 pt-6 text-center text-white relative">
              <button onClick={() => setSelectedMember(null)} className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20">
                <X size={20} />
              </button>
              <p className="text-xs uppercase tracking-widest text-purple-200">Member Profile</p>
            </div>
            <div className="-mt-10 flex flex-col items-center px-6">
              <img src={selectedMember.profile_photo_url || 'https://placehold.co/200x200?text=No+Photo'} 
                className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg" alt="" />
              <h3 className="mt-3 text-xl font-bold text-gray-900">
                {selectedMember.first_name} {selectedMember.last_name}
              </h3>
              <span className="text-sm font-bold text-purple-700">{selectedMember.member_code || 'Pending ID'}</span>
              <div className="mt-2 flex gap-2 flex-wrap justify-center">
                <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold uppercase text-purple-700">
                  {selectedMember.role}
                </span>
                <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-0.5 text-xs font-semibold uppercase">
                  {selectedMember.approval_status || selectedMember.status}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 space-y-0">
              {[
                ['Email', selectedMember.email],
                ['Phone', selectedMember.phone],
                ['Gender', selectedMember.gender],
                ['Date of Birth', fmtDate(selectedMember.date_of_birth)],
                ['Address', selectedMember.address],
                ['Registered', new Date(selectedMember.created_at).toLocaleDateString()],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between border-b border-gray-100 py-2.5">
                  <span className="text-sm text-gray-500">{k}</span>
                  <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t bg-gray-50 px-6 py-4">
              <button 
                onClick={() => { approve(selectedMember.id); setSelectedMember(null); }} 
                className="flex-1 btn-primary py-2 text-sm justify-center"
              >
                <Check size={15} /> Approve
              </button>
              <button 
                onClick={() => { reject(selectedMember.id); setSelectedMember(null); }} 
                className="flex-1 flex items-center gap-1 justify-center rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                <Ban size={15} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
