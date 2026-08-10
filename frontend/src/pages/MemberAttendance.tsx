import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '@/lib/api';
import { Calendar, CheckCircle, XCircle, Clock, Loader2, MapPin, BookOpen, Sparkles, Plus, Send, Users, Eye, Edit, Trash2, Save, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface AttendanceSession {
  id: string;
  title: string;
  attendance_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  description?: string;
  invitation_verse?: string;
  invitation_verse_reference?: string;
  encouragement_message?: string;
  response?: 'attending' | 'not_attending' | 'pending';
  reason?: string;
  comment?: string;
  responded_at?: string;
  status?: 'draft' | 'open' | 'closed';
  invitation_sent?: boolean;
  response_count?: number;
  confirmed_count?: number;
  declined_count?: number;
}

interface Stats {
  total_invitations: number;
  attended_count: number;
  declined_count: number;
  pending_count: number;
  attendance_percentage: number;
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

const MemberAttendance: React.FC = () => {
  const { member } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [createdSessions, setCreatedSessions] = useState<AttendanceSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [showDeclineForm, setShowDeclineForm] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineComment, setDeclineComment] = useState('');
  const [activeTab, setActiveTab] = useState<'invitations' | 'management'>('invitations');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    attendance_type: 'choir_practice',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    venue: '',
    description: '',
    status: 'draft' as 'draft' | 'open' | 'closed'
  });

  // Check if user is choir director
  const role = member?.role || '';
  const isDirector = role === 'choir_director' || member?.is_choir_director === true || member?.choir_role === 'director';

  useEffect(() => {
    loadSessions();
    loadStats();
    if (isDirector) {
      loadCreatedSessions();
    }
  }, [isDirector]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await get<{ sessions: AttendanceSession[] }>('/attendance/my-invitations?upcoming=true');
      setSessions(res.sessions || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const loadCreatedSessions = async () => {
    try {
      const res = await get<{ sessions: AttendanceSession[] }>('/attendance/my-created-sessions');
      setCreatedSessions(res.sessions || []);
    } catch (err: any) {
      console.error('Failed to load created sessions:', err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await get<{ stats: Stats }>('/attendance/my-stats');
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.attendance_type || !form.event_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      await post('/attendance/admin/sessions', form);
      toast.success('Attendance session created!');
      setShowCreateForm(false);
      setForm({
        title: '',
        attendance_type: 'choir_practice',
        event_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        venue: '',
        description: '',
        status: 'draft'
      });
      loadCreatedSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvitation = async (id: string) => {
    if (!confirm('Send attendance invitation to all approved choir members? This will generate a Bible verse and send emails to everyone.')) return;
    try {
      const res = await post<{ sent_count: number }>(`/attendance/admin/sessions/${id}/send-invitation`, {});
      toast.success(`Invitation sent to ${res.sent_count} members!`);
      loadCreatedSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance session?')) return;
    try {
      await del(`/attendance/admin/sessions/${id}`);
      toast.success('Session deleted');
      loadCreatedSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete session');
    }
  };

  const handleRespond = async (sessionId: string, response: 'attending' | 'not_attending', reason?: string, comment?: string) => {
    setResponding(sessionId);
    try {
      await post(`/attendance/${sessionId}/respond`, { response, reason, comment });
      toast.success(response === 'attending' ? 'Attendance confirmed!' : 'Response recorded');
      setShowDeclineForm(null);
      setDeclineReason('');
      setDeclineComment('');
      loadSessions();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to respond');
    } finally {
      setResponding(null);
    }
  };

  const handleDeclineSubmit = (sessionId: string) => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    handleRespond(sessionId, 'not_attending', declineReason, declineComment);
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isDirector ? 'Attendance Management' : 'My Attendance'}
        </h1>
        <p className="text-gray-600">
          {isDirector ? 'Create sessions and manage choir attendance' : 'View invitations and manage your attendance'}
        </p>
      </div>

      {/* Director Tabs */}
      {isDirector && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'invitations'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            My Invitations
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'management'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Session Management ({createdSessions.length})
          </button>
        </div>
      )}

      {/* Session Management Tab (Directors Only) */}
      {isDirector && activeTab === 'management' && (
        <>
          {!showCreateForm && (
            <button onClick={() => setShowCreateForm(true)} className="btn-primary mb-6">
              <Plus size={18} />
              Create Attendance Session
            </button>
          )}

          {/* Create Session Form */}
          {showCreateForm && (
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Create Attendance Session</h2>
                <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
                  <XIcon size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input-base"
                    placeholder="e.g., Choir Practice - December 2024"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
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
                    placeholder="e.g., Church Hall, Main Sanctuary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-base resize-none"
                    placeholder="Optional details about this session..."
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreateForm(false)} className="btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving && <Loader2 size={18} className="animate-spin" />}
                    <Save size={18} />
                    Create Session
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Created Sessions List */}
          {createdSessions.length > 0 ? (
            <div className="space-y-4">
              {createdSessions.map((session) => (
                <div key={session.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{session.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(session.event_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {session.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {session.start_time}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          session.status === 'open' ? 'bg-green-100 text-green-700' :
                          session.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {session.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  {session.invitation_sent && (
                    <div className="flex gap-4 text-sm mb-3">
                      <span className="text-gray-600">
                        <Users size={14} className="inline" /> {session.response_count || 0} responses
                      </span>
                      <span className="text-green-600">
                        <CheckCircle size={14} className="inline" /> {session.confirmed_count || 0} attending
                      </span>
                      <span className="text-red-600">
                        <XCircle size={14} className="inline" /> {session.declined_count || 0} declined
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    {!session.invitation_sent && session.status === 'draft' && (
                      <button
                        onClick={() => handleSendInvitation(session.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Send size={16} />
                        Send Invitation
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center text-gray-400">
              <Calendar size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">No sessions created yet</p>
              <p className="text-sm">Create your first attendance session for choir members</p>
            </div>
          )}
        </>
      )}

      {/* My Invitations Tab (for everyone, default for non-directors) */}
      {(!isDirector || activeTab === 'invitations') && (
        <>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Total Invitations</div>
            <div className="text-2xl font-bold text-purple-600">{stats.total_invitations}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Attended</div>
            <div className="text-2xl font-bold text-green-600">{stats.attended_count}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Declined</div>
            <div className="text-2xl font-bold text-red-600">{stats.declined_count}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 mb-1">Attendance Rate</div>
            <div className="text-2xl font-bold text-amber-600">{stats.attendance_percentage || 0}%</div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-purple-600" />
        </div>
      ) : sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`card p-6 ${
                session.response === 'attending' ? 'ring-2 ring-green-200 bg-green-50' :
                session.response === 'not_attending' ? 'ring-2 ring-red-200 bg-red-50' :
                'ring-2 ring-purple-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{session.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(session.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {session.start_time && (
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {session.start_time}{session.end_time && ` - ${session.end_time}`}
                      </span>
                    )}
                    {session.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin size={16} />
                        {session.venue}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                      {getTypeLabel(session.attendance_type)}
                    </span>
                  </div>
                </div>

                {/* Response Status */}
                {session.response && (
                  <div className="shrink-0">
                    {session.response === 'attending' ? (
                      <span className="flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-full font-medium">
                        <CheckCircle size={18} /> Attending
                      </span>
                    ) : session.response === 'not_attending' ? (
                      <span className="flex items-center gap-2 text-red-700 bg-red-100 px-4 py-2 rounded-full font-medium">
                        <XCircle size={18} /> Declined
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-gray-700 bg-gray-100 px-4 py-2 rounded-full font-medium">
                        <Clock size={18} /> Pending
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bible Verse */}
              {session.invitation_verse && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded">
                  <div className="flex items-start gap-3">
                    <BookOpen size={20} className="text-amber-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-gray-700 italic mb-2">"{session.invitation_verse}"</p>
                      <p className="text-amber-700 font-semibold text-sm">— {session.invitation_verse_reference}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Encouragement */}
              {session.encouragement_message && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded">
                  <div className="flex items-start gap-3">
                    <Sparkles size={20} className="text-blue-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Encouragement:</p>
                      <p className="text-gray-700">{session.encouragement_message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {session.description && (
                <div className="text-gray-700 mb-4 p-4 bg-gray-50 rounded">
                  {session.description}
                </div>
              )}

              {/* Response Actions */}
              {(!session.response || session.response === 'pending') && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleRespond(session.id, 'attending')}
                    disabled={responding === session.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {responding === session.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    I Will Attend
                  </button>
                  <button
                    onClick={() => setShowDeclineForm(session.id)}
                    disabled={responding === session.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={18} />
                    I Cannot Attend
                  </button>
                </div>
              )}

              {/* Decline Form */}
              {showDeclineForm === session.id && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-bold text-gray-900 mb-3">Please tell us why you cannot attend:</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                      <input
                        required
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        className="input-base"
                        placeholder="e.g., Work commitment, Family matter, Health issue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comment (Optional)</label>
                      <textarea
                        rows={2}
                        value={declineComment}
                        onChange={(e) => setDeclineComment(e.target.value)}
                        className="input-base resize-none"
                        placeholder="Any additional details..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeclineForm(null);
                          setDeclineReason('');
                          setDeclineComment('');
                        }}
                        className="flex-1 btn-outline"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeclineSubmit(session.id)}
                        disabled={responding === session.id}
                        className="flex-1 btn-primary bg-red-600 hover:bg-red-700"
                      >
                        {responding === session.id && <Loader2 size={18} className="animate-spin" />}
                        Submit Response
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Response Details */}
              {session.response === 'not_attending' && session.reason && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Your reason:</p>
                  <p className="text-gray-900">{session.reason}</p>
                  {session.comment && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mt-2 mb-1">Comment:</p>
                      <p className="text-gray-900">{session.comment}</p>
                    </>
                  )}
                </div>
              )}

              {session.responded_at && (
                <div className="mt-4 text-xs text-gray-500">
                  Responded on {new Date(session.responded_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">No upcoming invitations</p>
          <p className="text-sm">You'll be notified when new attendance sessions are created</p>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default MemberAttendance;
