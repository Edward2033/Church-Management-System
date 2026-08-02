import React, { useEffect, useState } from 'react';
import { get, post, Member } from '@/lib/api';
import { Users, Music2, Clock, Cake, Loader2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats { total: number; choir: number; pending: number; birthdaysToday: number;
  totalMembers?: number; choirMembers?: number; }

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

  const load = async () => {
    setLoading(true);
    try {
      const [s, m, b] = await Promise.all([
        get<Stats>('/members/stats'),
        get<{ members: Member[] }>('/members?status=pending'),
        get<{ birthdays: { first_name: string; last_name: string; member_code: string; profile_photo_url?: string }[] }>('/members/birthdays'),
      ]);
      setStats({
        total:         s.total         ?? s.totalMembers  ?? 0,
        choir:         s.choir         ?? s.choirMembers  ?? 0,
        pending:       s.pending       ?? 0,
        birthdaysToday:s.birthdaysToday ?? 0,
      });
      setPending(m.members || []);
      setBirthdays(b.birthdays || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setApproving(id);
    try { await post(`/auth/approve/${id}`, {}); load(); }
    catch {}
    finally { setApproving(null); }
  };

  const CHART_DATA = [
    { name: 'Members', value: stats.total - stats.choir },
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} className="text-white" />} label="Total Members" value={stats.total} color="bg-purple-600" />
        <StatCard icon={<Music2 size={22} className="text-white" />} label="Choir Members" value={stats.choir} color="bg-indigo-500" />
        <StatCard icon={<Clock size={22} className="text-white" />} label="Pending Approvals" value={stats.pending} color="bg-amber-500" />
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
                <th className="pb-2">Action</th>
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
                      <button onClick={() => approve(m.id)} disabled={approving === m.id}
                        className="btn-primary py-1.5 text-xs disabled:opacity-60">
                        {approving === m.id ? <Loader2 size={13} className="animate-spin" /> : null} Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
