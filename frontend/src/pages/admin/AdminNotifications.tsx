import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '@/lib/api';
import { Bell, Plus, Edit, Trash2, Send, Eye, Loader2, Save, X, Calendar, Users, AlertCircle, Image as ImageIcon, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  image_url?: string;
  attachment_url?: string;
  publish_date: string;
  expiry_date?: string;
  status: 'draft' | 'scheduled' | 'published' | 'expired';
  delivered_count: number;
  read_count: number;
  created_at: string;
  sender_first_name?: string;
  sender_last_name?: string;
  delivery_count?: number;
}

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewingDetails, setViewingDetails] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    audience: 'all',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    image_url: '',
    attachment_url: '',
    publish_date: new Date().toISOString().slice(0, 16),
    expiry_date: '',
    status: 'draft' as 'draft' | 'scheduled' | 'published'
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await get<{ notifications: Notification[] }>('/notifications/admin/all?limit=100');
      setNotifications(res.notifications || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await put(`/notifications/admin/${editing}`, form);
        toast.success('Notification updated!');
      } else {
        await post('/notifications/admin', form);
        toast.success('Notification created!');
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notification');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditing(notification.id);
    setShowForm(true);
    setForm({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      audience: notification.audience,
      priority: notification.priority,
      image_url: notification.image_url || '',
      attachment_url: notification.attachment_url || '',
      publish_date: notification.publish_date ? new Date(notification.publish_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      expiry_date: notification.expiry_date ? new Date(notification.expiry_date).toISOString().slice(0, 16) : '',
      status: notification.status as any
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await del(`/notifications/admin/${id}`);
      toast.success('Notification deleted');
      loadNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm('Publish this notification now? It will be sent to all targeted users via email.')) return;
    try {
      const res = await post<{ delivered: number }>(`/notifications/admin/${id}/publish`, {});
      toast.success(`Notification published and sent to ${res.delivered || 0} users!`);
      loadNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      type: 'announcement',
      audience: 'all',
      priority: 'normal',
      image_url: '',
      attachment_url: '',
      publish_date: new Date().toISOString().slice(0, 16),
      expiry_date: '',
      status: 'draft'
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    resetForm();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'normal': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Notification Management</h1>
        <p className="text-gray-600">Create and manage notifications for members and choir</p>
      </div>

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="btn-primary mb-6">
          <Plus size={18} />
          Create Notification
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editing ? 'Edit' : 'Create'} Notification
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
                placeholder="Notification title"
                maxLength={300}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="input-base resize-none"
                placeholder="Enter notification message..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input-base"
                >
                  <option value="announcement">Announcement</option>
                  <option value="alert">Alert</option>
                  <option value="event">Event</option>
                  <option value="birthday">Birthday</option>
                  <option value="choir">Choir</option>
                  <option value="finance">Finance</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  className="input-base"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="input-base"
              >
                <option value="all">All Approved Users</option>
                <option value="members">Members Only</option>
                <option value="choir">Choir Members Only</option>
                <option value="leaders">Church Leaders Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ImageIcon size={14} className="inline mr-1" />
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="input-base"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Paperclip size={14} className="inline mr-1" />
                  Attachment URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.attachment_url}
                  onChange={(e) => setForm({ ...form, attachment_url: e.target.value })}
                  className="input-base"
                  placeholder="https://example.com/document.pdf"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                <input
                  type="datetime-local"
                  value={form.publish_date}
                  onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="input-base"
              >
                <option value="draft">Draft (Not Sent)</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Publish Now</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleCancel} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={18} className="animate-spin" />}
                <Save size={18} />
                {editing ? 'Update' : 'Create'} Notification
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-purple-600" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-gray-900">{notification.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(notification.status)}`}>
                      {notification.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                      <Users size={10} className="inline mr-1" />
                      {notification.audience}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      <Calendar size={12} className="inline mr-1" />
                      {new Date(notification.publish_date).toLocaleDateString()}
                    </span>
                    {notification.status === 'published' && (
                      <>
                        <span>Delivered: {notification.delivered_count || 0}</span>
                        <span>Read: {notification.read_count || 0}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {notification.status !== 'published' && (
                    <button
                      onClick={() => handlePublish(notification.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Publish Now"
                    >
                      <Send size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(notification)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(notification.id)}
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
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p>No notifications yet. Create your first notification!</p>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
