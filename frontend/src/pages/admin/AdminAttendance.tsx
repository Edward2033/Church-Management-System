import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '@/lib/api';
import { Calendar, Plus, Edit, Trash2, Send, Eye, Loader2, Save, X, Users, CheckCircle, XCircle, Clock, FileSpreadsheet, Printer } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { CHURCH_NAME } from '@/lib/api';

interface AttendanceSession {
  id: string;
  title: string;
  attendance_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  description?: string;
  status: 'draft' | 'open' | 'closed';
  invitation_sent: boolean;
  invitation_sent_at?: string;
  created_at: string;
  response_count?: number;
  confirmed_count?: number;
  declined_count?: number;
}

interface SessionDetails {
  session: AttendanceSession;
  responses: any[];
  stats: {
    total_responses: number;
    confirmed_count: number;
    declined_count: number;
    pending_count: number;
    attendance_percentage: number;
  };
}

const ATTENDANCE_TYPES = [
  { value: 'sunday_service', label: 'Sunday Service' },
  { value: 'midweek_service', label: 'Midweek Service' },
  { value: 'friday_prayer', label: 'Friday Prayer' },
  { value: 'choir_practice', label: 'Choir Practice' },
  { value: 'choir_rehearsal', label: 'Choir Rehearsal' },
  { value: 'bible_study', label: 'Bible Study' },
  { value: 'evangelism', label: 'Evangelism' },
  { value: 'youth_meeting', label: 'Youth Meeting' },
  { value: 'special_program', label: 'Special Program' },
  { value: 'other', label: 'Other' }
];

const AdminAttendance: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewingDetails, setViewingDetails] = useState<SessionDetails | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [responseFilter, setResponseFilter] = useState<'all' | 'attending' | 'not_attending' | 'pending'>('all');

  const [form, setForm] = useState({
    title: '',
    attendance_type: 'sunday_service',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    venue: '',
    description: '',
    status: 'draft' as 'draft' | 'open' | 'closed'
  });

  useEffect(() => {
    loadSessions();
    loadStats();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await get<{ sessions: AttendanceSession[] }>('/attendance/admin/sessions?limit=100');
      setSessions(res.sessions || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await get<{ stats: any }>('/attendance/admin/stats');
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadSessionDetails = async (id: string) => {
    try {
      const res = await get<SessionDetails>(`/attendance/admin/sessions/${id}`);
      setViewingDetails(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load session details');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await put(`/attendance/admin/sessions/${editing}`, form);
        toast.success('Session updated!');
      } else {
        await post('/attendance/admin/sessions', form);
        toast.success('Session created!');
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadSessions();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (session: AttendanceSession) => {
    setEditing(session.id);
    setShowForm(true);
    setForm({
      title: session.title,
      attendance_type: session.attendance_type,
      event_date: session.event_date,
      start_time: session.start_time || '',
      end_time: session.end_time || '',
      venue: session.venue || '',
      description: session.description || '',
      status: session.status
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await del(`/attendance/admin/sessions/${id}`);
      toast.success('Session deleted');
      loadSessions();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleSendInvitation = async (id: string) => {
    if (!confirm('Send attendance invitation to all approved users? This will generate a Bible verse and send emails to everyone.')) return;
    try {
      const res = await post<{ sent_count: number }>(`/attendance/admin/sessions/${id}/send-invitation`, {});
      toast.success(`Invitation sent to ${res.sent_count} users!`);
      loadSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      attendance_type: 'sunday_service',
      event_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      venue: '',
      description: '',
      status: 'draft'
    });
  };

  const exportToExcel = () => {
    if (!viewingDetails) return;
    const { session, responses, stats } = viewingDetails;
    const typeLabel = ATTENDANCE_TYPES.find(t => t.value === session.attendance_type)?.label || session.attendance_type;
    const eventDate = new Date(session.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const wb = XLSX.utils.book_new();

    // ── Summary sheet ──────────────────────────────────────────
    const summaryWs = XLSX.utils.aoa_to_sheet([
      [CHURCH_NAME + ' — ATTENDANCE REPORT'],
      [],
      ['Session Title:',    session.title],
      ['Attendance Type:',  typeLabel],
      ['Event Date:',       eventDate],
      ['Start Time:',       session.start_time  || 'N/A'],
      ['End Time:',         session.end_time    || 'N/A'],
      ['Venue:',            session.venue       || 'N/A'],
      ['Description:',      session.description || 'N/A'],
      ['Session Status:',   session.status.toUpperCase()],
      ['Generated On:',     new Date().toLocaleString()],
      [],
      ['── STATISTICS ──'],
      ['Total Invited:',          stats.total_responses],
      ['Present (Attending):',    stats.confirmed_count],
      ['Absent (Declined):',      stats.declined_count],
      ['Pending / No Response:',  stats.pending_count],
      ['Attendance Rate:',        `${stats.attendance_percentage || 0}%`],
    ]);
    summaryWs['!cols'] = [{ wch: 28 }, { wch: 55 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // ── helper to build a row from a response ──────────────────
    const toRow = (r: any, i: number, includeAbsence: boolean) => {
      const base: Record<string, any> = {
        '#':                i + 1,
        'Member ID':        r.member_code        || 'N/A',
        'Full Name':        `${r.first_name || ''} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name || ''}`.trim() || 'N/A',
        'Gender':           r.gender             || 'N/A',
        'Date of Birth':    r.date_of_birth      ? new Date(r.date_of_birth).toLocaleDateString() : 'N/A',
        'Phone':            r.phone              || 'N/A',
        'WhatsApp':         r.whatsapp_number    || 'N/A',
        'Email':            r.email              || 'N/A',
        'Address':          r.address            || 'N/A',
        'City':             r.city               || 'N/A',
        'Occupation':       r.occupation         || 'N/A',
        'Marital Status':   r.marital_status     || 'N/A',
        'Membership Status':r.membership_status  || 'N/A',
        'Baptized':         r.baptism_status     ? 'Yes' : 'No',
        'Date Joined':      r.date_joined        ? new Date(r.date_joined).toLocaleDateString() : 'N/A',
        'Role':             (r.role || '').replace(/_/g, ' ').toUpperCase(),
        'Voice Group':      r.voice_group        || 'N/A',
        'Choir Role':       r.choir_role         || 'N/A',
        'Status':           r.response === 'attending' ? 'PRESENT' : r.response === 'not_attending' ? 'ABSENT' : 'PENDING',
        'Responded At':     r.responded_at       ? new Date(r.responded_at).toLocaleString() : 'Not responded',
      };
      if (includeAbsence) {
        base['Reason for Absence'] = r.response === 'not_attending' ? (r.reason || 'No reason provided') : '—';
        base['Comment']            = r.comment || '—';
      }
      return base;
    };

    const colWidths = [
      { wch: 4 }, { wch: 14 }, { wch: 28 }, { wch: 8 }, { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 14 },
      { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
      { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 20 },
    ];

    // ── Present sheet ──────────────────────────────────────────
    const presentData = responses.filter((r: any) => r.response === 'attending').map((r: any, i: number) => toRow(r, i, false));
    const presentWs = XLSX.utils.json_to_sheet(
      presentData.length ? presentData : [{ '#': '', 'Member ID': 'No members present', 'Full Name': '', 'Gender': '', 'Date of Birth': '', 'Phone': '', 'WhatsApp': '', 'Email': '', 'Address': '', 'City': '', 'Occupation': '', 'Marital Status': '', 'Membership Status': '', 'Baptized': '', 'Date Joined': '', 'Role': '', 'Voice Group': '', 'Choir Role': '', 'Status': '', 'Responded At': '' }]
    );
    presentWs['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, presentWs, 'Present');

    // ── Absent sheet ───────────────────────────────────────────
    const absentData = responses.filter((r: any) => r.response !== 'attending').map((r: any, i: number) => toRow(r, i, true));
    const absentWs = XLSX.utils.json_to_sheet(
      absentData.length ? absentData : [{ '#': '', 'Member ID': 'No absent members', 'Full Name': '', 'Gender': '', 'Date of Birth': '', 'Phone': '', 'WhatsApp': '', 'Email': '', 'Address': '', 'City': '', 'Occupation': '', 'Marital Status': '', 'Membership Status': '', 'Baptized': '', 'Date Joined': '', 'Role': '', 'Voice Group': '', 'Choir Role': '', 'Status': '', 'Responded At': '', 'Reason for Absence': '', 'Comment': '' }]
    );
    absentWs['!cols'] = [...colWidths, { wch: 40 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, absentWs, 'Absent');

    // ── All Members sheet ──────────────────────────────────────
    const allData = responses.map((r: any, i: number) => toRow(r, i, true));
    const allWs = XLSX.utils.json_to_sheet(allData.length ? allData : [{}]);
    allWs['!cols'] = [...colWidths, { wch: 40 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, allWs, 'All Members');

    const filename = `Attendance_${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success('Excel file downloaded successfully!');
  };

  const handlePrint = () => {
    if (!viewingDetails) return;
    const { session, responses, stats } = viewingDetails;
    const typeLabel = ATTENDANCE_TYPES.find(t => t.value === session.attendance_type)?.label || session.attendance_type;
    const eventDate = new Date(session.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

    const rows = responses.map((r: any, i: number) => {
      const fullName = `${r.first_name || ''} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name || ''}`.trim() || 'N/A';
      const statusColor = r.response === 'attending' ? '#16a34a' : r.response === 'not_attending' ? '#dc2626' : '#d97706';
      const statusText  = r.response === 'attending' ? '✓ PRESENT' : r.response === 'not_attending' ? '✗ ABSENT' : '⏳ PENDING';
      const reason = r.response === 'not_attending' ? (r.reason || 'No reason provided') : '—';
      const choir = r.voice_group || r.choir_role ? `${r.voice_group || ''}${r.voice_group && r.choir_role ? ' · ' : ''}${r.choir_role || ''}` : '—';
      return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td style="font-family:monospace;color:#7c3aed;font-weight:700">${r.member_code || 'N/A'}</td>
        <td><strong>${fullName}</strong><br><span style="font-size:10px;color:#6b7280">${(r.role || '').replace(/_/g, ' ').toUpperCase()}</span></td>
        <td>${r.gender || '—'}</td>
        <td>${fmtDate(r.date_of_birth)}</td>
        <td>${r.phone || '—'}${r.whatsapp_number && r.whatsapp_number !== r.phone ? '<br><span style="font-size:10px;color:#6b7280">WA: ' + r.whatsapp_number + '</span>' : ''}</td>
        <td style="font-size:10px">${r.email || '—'}</td>
        <td style="font-size:10px">${r.address ? r.address + (r.city ? ', ' + r.city : '') : (r.city || '—')}</td>
        <td style="font-size:10px">${choir}</td>
        <td style="color:${statusColor};font-weight:700;white-space:nowrap">${statusText}</td>
        <td style="font-size:10px;color:#374151">${reason}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${CHURCH_NAME} — Attendance Report — ${session.title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#111;padding:20px;background:#fff}
  .header{border-bottom:3px solid #7c3aed;padding-bottom:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start}
  .header h1{font-size:20px;color:#5b21b6;margin-bottom:2px}
  .header h2{font-size:13px;color:#374151;font-weight:500}
  .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 20px;margin-bottom:16px;background:#f9fafb;padding:12px;border-radius:6px;border:1px solid #e5e7eb}
  .meta-item .label{font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px}
  .meta-item .value{font-size:11px;color:#1f2937;font-weight:600;margin-top:2px}
  .stats{display:flex;gap:12px;margin-bottom:16px}
  .stat{flex:1;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;text-align:center}
  .stat .n{font-size:20px;font-weight:800}
  .stat .l{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:10px}
  thead th{background:#7c3aed;color:#fff;padding:7px 6px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap}
  td{padding:5px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  .footer{margin-top:16px;text-align:center;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}
  @media print{body{padding:10px}.stat{break-inside:avoid}}
</style></head><body>
<div class="header">
  <div>
    <h1>${CHURCH_NAME}</h1>
    <h2>Attendance Report — ${session.title}</h2>
  </div>
  <div style="text-align:right;font-size:10px;color:#6b7280">
    Generated: ${new Date().toLocaleString()}
  </div>
</div>
<div class="meta">
  <div class="meta-item"><div class="label">Type</div><div class="value">${typeLabel}</div></div>
  <div class="meta-item"><div class="label">Date</div><div class="value">${eventDate}</div></div>
  <div class="meta-item"><div class="label">Time</div><div class="value">${session.start_time || 'N/A'}${session.end_time ? ' – ' + session.end_time : ''}</div></div>
  <div class="meta-item"><div class="label">Venue</div><div class="value">${session.venue || 'N/A'}</div></div>
  <div class="meta-item"><div class="label">Status</div><div class="value">${session.status.toUpperCase()}</div></div>
  ${session.description ? `<div class="meta-item" style="grid-column:span 1"><div class="label">Description</div><div class="value">${session.description}</div></div>` : ''}
</div>
<div class="stats">
  <div class="stat"><div class="n" style="color:#3b82f6">${stats.total_responses}</div><div class="l">Total Invited</div></div>
  <div class="stat"><div class="n" style="color:#16a34a">${stats.confirmed_count}</div><div class="l">Present</div></div>
  <div class="stat"><div class="n" style="color:#dc2626">${stats.declined_count}</div><div class="l">Absent</div></div>
  <div class="stat"><div class="n" style="color:#d97706">${stats.pending_count}</div><div class="l">Pending</div></div>
  <div class="stat"><div class="n" style="color:#7c3aed">${stats.attendance_percentage || 0}%</div><div class="l">Attendance Rate</div></div>
</div>
<table>
  <thead><tr>
    <th>#</th><th>Member ID</th><th>Name / Role</th><th>Gender</th><th>Date of Birth</th>
    <th>Phone / WhatsApp</th><th>Email</th><th>Address</th><th>Choir</th>
    <th>Status</th><th>Reason for Absence</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">
  ${CHURCH_NAME} — Attendance Report · ${session.title} · ${eventDate}<br>
  This document is confidential and intended for church administrative use only.
</div>
<script>window.onload = () => setTimeout(() => window.print(), 500);<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    resetForm();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance Management</h1>
        <p className="text-gray-600">Create sessions and track member attendance</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
            <div className="text-2xl font-bold text-purple-600">{stats.total_sessions || 0}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Open Sessions</div>
            <div className="text-2xl font-bold text-green-600">{stats.open_sessions || 0}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Total Responses</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_responses || 0}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
            <div className="text-2xl font-bold text-amber-600">{stats.overall_attendance_percentage || 0}%</div>
          </div>
        </div>
      )}

      {!showForm && !viewingDetails && (
        <button onClick={() => setShowForm(true)} className="btn-primary mb-6">
          <Plus size={18} />
          Create Attendance Session
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editing ? 'Edit' : 'Create'} Attendance Session
            </h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-base"
                placeholder="e.g., Sunday Service - December 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Type *</label>
                <select
                  required
                  value={form.attendance_type}
                  onChange={(e) => setForm({ ...form, attendance_type: e.target.value })}
                  className="input-base"
                >
                  {ATTENDANCE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                <input
                  required
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="input-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="input-base"
                placeholder="e.g., Main Sanctuary, Fellowship Hall"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-base resize-none"
                placeholder="Optional details about this session..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="input-base"
              >
                <option value="draft">Draft (Not Open)</option>
                <option value="open">Open for Responses</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleCancel} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={18} className="animate-spin" />}
                <Save size={18} />
                {editing ? 'Update' : 'Create'} Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Session Details Modal */}
      {viewingDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{viewingDetails.session.title}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Print Attendance"
                  >
                    <Printer size={18} />
                    Print
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Export to Excel"
                  >
                    <FileSpreadsheet size={18} />
                    Export Excel
                  </button>
                  <button onClick={() => setViewingDetails(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{viewingDetails.stats.total_responses}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{viewingDetails.stats.confirmed_count}</div>
                  <div className="text-sm text-gray-600">Attending</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{viewingDetails.stats.declined_count}</div>
                  <div className="text-sm text-gray-600">Declined</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{viewingDetails.stats.attendance_percentage || 0}%</div>
                  <div className="text-sm text-gray-600">Rate</div>
                </div>
              </div>

              {/* Responses */}
              <h3 className="font-bold text-gray-900 mb-3">Responses ({viewingDetails.responses.length})</h3>
              
              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setResponseFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    responseFilter === 'all'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({viewingDetails.responses.length})
                </button>
                <button
                  onClick={() => setResponseFilter('attending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    responseFilter === 'attending'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Attending ({viewingDetails.stats.confirmed_count})
                </button>
                <button
                  onClick={() => setResponseFilter('not_attending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    responseFilter === 'not_attending'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Declined ({viewingDetails.stats.declined_count})
                </button>
                <button
                  onClick={() => setResponseFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    responseFilter === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pending ({viewingDetails.stats.pending_count})
                </button>
              </div>

              <div className="space-y-2">
                {viewingDetails.responses
                  .filter((r: any) => responseFilter === 'all' || r.response === responseFilter)
                  .map((response: any) => (
                  <div key={response.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <img 
                          src={response.profile_photo_url || 'https://placehold.co/40'} 
                          alt={response.first_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{response.first_name} {response.last_name}</div>
                          <div className="text-xs text-gray-500 capitalize">{response.role.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {response.response === 'attending' ? (
                          <span className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                            <CheckCircle size={14} /> Attending
                          </span>
                        ) : response.response === 'not_attending' ? (
                          <span className="flex items-center gap-1 text-sm font-medium text-red-700 bg-red-100 px-3 py-1 rounded-full">
                            <XCircle size={14} /> Declined
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                            <Clock size={14} /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Show decline reason if applicable */}
                    {response.response === 'not_attending' && response.reason && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Reason for declining:</div>
                        <div className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                          {response.reason}
                        </div>
                      </div>
                    )}
                    
                    {/* Show comment if available */}
                    {response.comment && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Comment:</div>
                        <div className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                          {response.comment}
                        </div>
                      </div>
                    )}
                    
                    {/* Response timestamp */}
                    {response.responded_at && (
                      <div className="mt-2 text-xs text-gray-500">
                        Responded: {new Date(response.responded_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {!showForm && !viewingDetails && (
        loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-purple-600" />
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-gray-900">{session.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                        {ATTENDANCE_TYPES.find(t => t.value === session.attendance_type)?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>
                        <Calendar size={14} className="inline mr-1" />
                        {new Date(session.event_date).toLocaleDateString()}
                      </span>
                      {session.start_time && <span>{session.start_time}</span>}
                      {session.venue && <span>📍 {session.venue}</span>}
                    </div>
                    {session.invitation_sent && (
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Responses: {session.response_count || 0}</span>
                        <span className="text-green-600">✓ {session.confirmed_count || 0}</span>
                        <span className="text-red-600">✗ {session.declined_count || 0}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!session.invitation_sent && session.status !== 'closed' && (
                      <button
                        onClick={() => handleSendInvitation(session.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Send Invitation"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    {session.invitation_sent && (
                      <button
                        onClick={() => loadSessionDetails(session.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(session)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p>No attendance sessions yet. Create your first session!</p>
          </div>
        )
      )}
    </div>
  );
};

export default AdminAttendance;
