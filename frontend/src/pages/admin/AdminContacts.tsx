import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Mail, Loader2, Check, Trash2, Eye, Search, X, Send } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  is_replied: boolean;
  reply_message?: string;
  created_at: string;
  replied_at?: string;
}

const AdminContacts: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, pending: 0, replied: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pending' | 'replied'>('all');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('cms_token');

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_URL}/contact?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(data.messages || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/contact/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [filter, search]);

  const openMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      await markAsRead(msg.id);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/contact/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchMessages();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedMessage) return;
    
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/contact/${selectedMessage.id}/reply`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replyMessage: replyMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Reply sent successfully!');
      setShowReplyForm(false);
      setReplyMessage('');
      setSelectedMessage(null);
      fetchMessages();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await fetch(`${API_URL}/contact/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Message deleted');
      setSelectedMessage(null);
      fetchMessages();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail size={24} className="text-purple-600" /> Contact Messages
        </h1>
        <p className="text-sm text-gray-600">Manage and respond to visitor inquiries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'purple' },
          { label: 'Unread', value: stats.unread, color: 'blue' },
          { label: 'Pending', value: stats.pending, color: 'amber' },
          { label: 'Replied', value: stats.replied, color: 'green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderColor: `var(--${color}-500)` }}>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {(['all', 'unread', 'pending', 'replied'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Messages List */}
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedMessage?.id === msg.id ? 'ring-2 ring-purple-500' : ''
                } ${!msg.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{msg.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{msg.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!msg.is_read && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        New
                      </span>
                    )}
                    {msg.is_replied && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Replied
                      </span>
                    )}
                  </div>
                </div>
                {msg.subject && <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>}
                <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Mail size={48} className="mx-auto mb-3 opacity-30" />
                <p>No messages found</p>
              </div>
            )}
          </div>

          {/* Message Detail */}
          <div className="sticky top-6">
            {selectedMessage ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedMessage.name}</h2>
                    <p className="text-sm text-gray-600">{selectedMessage.email}</p>
                    {selectedMessage.phone && <p className="text-sm text-gray-600">{selectedMessage.phone}</p>}
                  </div>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {selectedMessage.subject && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Subject:</h3>
                    <p className="text-gray-900">{selectedMessage.subject}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Message:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                {selectedMessage.is_replied && selectedMessage.reply_message && (
                  <div className="mb-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Reply:</h3>
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.reply_message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Sent on {selectedMessage.replied_at && new Date(selectedMessage.replied_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {!selectedMessage.is_replied && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700"
                  >
                    <Send size={18} /> Reply to {selectedMessage.name}
                  </button>
                )}

                {showReplyForm && !selectedMessage.is_replied && (
                  <form onSubmit={sendReply} className="mt-4 border-t pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Reply:
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={6}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Type your reply here..."
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        type="submit"
                        disabled={sending || !replyMessage.trim()}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {sending ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowReplyForm(false); setReplyMessage(''); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  Received on {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Mail size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContacts;
