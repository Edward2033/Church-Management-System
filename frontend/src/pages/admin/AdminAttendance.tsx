import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '@/lib/api';
import { Calendar, Plus, Edit, Trash2, Send, Eye, Loader2, Save, X, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

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
                <button onClick={() => setViewingDetails(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
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
