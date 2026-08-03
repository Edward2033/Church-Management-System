import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Mail, Loader2, Check, Trash2, Eye, Search, Filter } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  is_replied: boolean;
  created_at: string;
}

const AdminContacts: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, pending: 0, replied: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pending' | 'replied'>('all');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

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

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/contact/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Marked as read');
      fetchMessages();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const markAsReplied = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/contact/${id}/reply`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Marked as replied');
      fetchMessages();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-sm text-gray-600">Manage contact form submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Unread</div>
          <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Replied</div>
          <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(['all', 'unread', 'pending', 'replied'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition ${
                selectedMessage?.id === msg.id ? 'ring-2 ring-purple-600' : ''
              } ${!msg.is_read ? 'border-l-4 border-l-orange-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{msg.name}</h3>
                  <p className="text-sm text-gray-600">{msg.email}</p>
                </div>
                <div className="flex gap-1">
                  {!msg.is_read && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">New</span>
                  )}
                  {msg.is_replied && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Replied</span>
                  )}
                </div>
              </div>
              {msg.subject && <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>}
              <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(msg.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Mail size={48} className="mx-auto mb-3 opacity-50" />
              <p>No messages found</p>
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div>
          {selectedMessage ? (
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMessage.name}</h2>
                  <p className="text-sm text-gray-600">{selectedMessage.email}</p>
                  {selectedMessage.phone && (
                    <p className="text-sm text-gray-600">{selectedMessage.phone}</p>
                  )}
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
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Subject</h3>
                  <p className="text-gray-900">{selectedMessage.subject}</p>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Message</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500">
                  Received on{' '}
                  {new Date(selectedMessage.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {!selectedMessage.is_read && (
                  <button
                    onClick={() => markAsRead(selectedMessage.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Eye size={18} /> Mark as Read
                  </button>
                )}
                {!selectedMessage.is_replied && (
                  <button
                    onClick={() => markAsReplied(selectedMessage.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check size={18} /> Mark as Replied
                  </button>
                )}
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Your Message'}`}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Mail size={18} /> Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center text-gray-500">
              <Mail size={48} className="mx-auto mb-3 opacity-50" />
              <p>Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContacts;
