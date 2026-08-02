import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Mail, Search, Loader2, Eye, Trash2, CheckCircle, X, Filter } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [stats, setStats] = useState({ total: 0, unread: 0, pending: 0, replied: 0 });

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('cms_token');

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

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
  }, [search, statusFilter]);

  const handleMarkRead = async (id: string) => {
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

  const handleMarkReplied = async (id: string) => {
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

  const handleDelete = async (id: string) => {
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <p className="text-sm text-gray-600">Manage messages from the contact form</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Messages</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
          <div className="text-sm text-gray-600">Unread</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending Reply</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
          <div className="text-sm text-gray-600">Replied</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="pending">Pending Reply</option>
            <option value="replied">Replied</option>
          </select>
        </div>
      </div>

      {/* Messages Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedMessage?.id === msg.id ? 'ring-2 ring-purple-500' : ''
              } ${!msg.is_read ? 'border-l-4 border-purple-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{msg.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{msg.email}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  {!msg.is_read && (
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                      New
                    </span>
                  )}
                  {msg.is_replied && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      Replied
                    </span>
                  )}
                </div>
              </div>
              {msg.subject && (
                <p className="text-sm font-medium text-gray-700 mb-1">{msg.subject}</p>
              )}
              <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
              <p className="text-xs text-gray-500 mt-2">{formatDate(msg.created_at)}</p>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Mail size={48} className="mx-auto mb-3 opacity-50" />
              <p>No messages found</p>
            </div>
          )}
        </div>

        {/* Detail View */}
        <div className="lg:sticky lg:top-6">
          {selectedMessage ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMessage.name}</h2>
                  <p className="text-sm text-gray-600">{selectedMessage.email}</p>
                  {selectedMessage.phone && (
                    <p className="text-sm text-gray-600">{selectedMessage.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedMessage.subject && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Subject</h3>
                  <p className="text-gray-900">{selectedMessage.subject}</p>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Message</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500">
                  Received on {formatDate(selectedMessage.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!selectedMessage.is_read && (
                  <button
                    onClick={() => handleMarkRead(selectedMessage.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    <Eye size={16} /> Mark Read
                  </button>
                )}
                {!selectedMessage.is_replied && (
                  <button
                    onClick={() => handleMarkReplied(selectedMessage.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    <CheckCircle size={16} /> Mark Replied
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedMessage.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 ml-auto"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>

              {/* Reply Hint */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>To reply:</strong> Send an email to{' '}
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Your Message'}`}
                    className="underline"
                  >
                    {selectedMessage.email}
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
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
