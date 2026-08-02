import React, { useEffect, useState } from 'react';
import { get, post, Donation } from '@/lib/api';
import { Plus, DollarSign, Loader2, X, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_COLOR: Record<string, string> = {
  tithe: 'bg-purple-100 text-purple-700', offering: 'bg-blue-100 text-blue-700',
  special: 'bg-amber-100 text-amber-700', building_fund: 'bg-green-100 text-green-700',
  missions: 'bg-rose-100 text-rose-700', other: 'bg-gray-100 text-gray-700',
};

const BLANK = { donor_name: '', donor_email: '', amount: '', currency: 'NGN', type: 'offering', payment_method: 'cash', note: '' };

const AdminDonations: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<{ type: string; total: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const load = () => {
    setLoading(true);
    const q = typeFilter ? `?type=${typeFilter}` : '';
    get<{ donations: Donation[]; summary: { type: string; total: string }[] }>(`/donations${q}`)
      .then((r) => { setDonations(r.donations || []); setSummary(r.summary || []); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [typeFilter]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await post('/donations', form); toast.success('Donation recorded'); setShowForm(false); setForm(BLANK); load(); }
    catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const totalAll = summary.reduce((a, s) => a + parseFloat(s.total || '0'), 0);

  const exportDonations = () => {
    const headers = ['Donor', 'Email', 'Amount', 'Currency', 'Type', 'Method', 'Status', 'Date', 'Note'];
    const rows = donations.map((d) => [
      d.donor_name || d.member_name || '', d.donor_email || '',
      d.amount, d.currency, d.type, d.payment_method, d.payment_status,
      new Date(d.donated_at || d.transaction_date).toLocaleDateString(), d.note || '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `donations-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Donations</h1><p className="text-sm text-gray-500">{donations.length} records</p></div>
        <div className="flex gap-2">
          <button onClick={exportDonations} className="btn-outline py-2 text-sm"><FileSpreadsheet size={15} /> Export</button>
          <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Record</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-green-600" /><span className="text-xs font-semibold text-gray-500 uppercase">Total</span></div>
          <div className="text-2xl font-bold text-gray-900">₦{totalAll.toLocaleString()}</div>
        </div>
        {summary.map((s) => (
          <div key={s.type} className="card p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1 capitalize">{s.type.replace('_', ' ')}</div>
            <div className="text-xl font-bold text-gray-900">₦{parseFloat(s.total).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card p-4 mb-5">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base w-auto">
          <option value="">All Types</option>
          {['tithe','offering','special','building_fund','missions','other'].map((t) => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Donor', 'Amount', 'Type', 'Method', 'Status', 'Date', 'Note'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.donor_name || d.member_name || 'Anonymous'}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{d.currency} {Number(d.amount).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`capitalize rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[d.type] || TYPE_COLOR.other}`}>{d.type.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{d.payment_method.replace('_', ' ')}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{d.payment_status}</span></td>
                    <td className="px-4 py-3 text-gray-400">{new Date(d.donated_at || d.transaction_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{d.note || '—'}</td>
                  </tr>
                ))}
                {donations.length === 0 && <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">No donations recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><DollarSign size={20} className="text-purple-700" /> Record Donation</h2><button type="button" onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label><input value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.donor_email} onChange={(e) => setForm({ ...form, donor_email: e.target.value })} className="input-base" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-base" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input-base">
                    {['NGN','USD','GBP','EUR','GHS'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-base">
                    {['tithe','offering','special','building_fund','missions','other'].map((t) => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="input-base">
                    {['cash','bank_transfer','card','mobile_money'].map((m) => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Note</label><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input-base" /></div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center mt-5">
              {saving && <Loader2 size={16} className="animate-spin" />} Record Donation
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDonations;
