import React, { useEffect, useState } from 'react';
import { get, put } from '@/lib/api';
import { Bell, Check, Loader2, Calendar, Image as ImageIcon, Paperclip, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  image_url?: string;
  attachment_url?: string;
  publish_date: string;
  delivered_at?: string;
  read_at?: string;
  sender_first_name?: string;
  sender_last_name?: string;
}

const MemberNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await get<{ notifications: Notification[], unread_count: number }>(
        `/notifications?limit=50&unread_only=${filter === 'unread'}`
      );
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await put(`/notifications/${id}/read`, {});
      loadNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as read');
    }
  };

  const handleViewNotification = async (notification: Notification) => {
    setViewingNotification(notification);
    // Mark as read when viewing
    if (!notification.read_at) {
      await handleMarkAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await put('/notifications/read-all', {});
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark all as read');
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'normal': return '📢';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'normal': return 'border-l-blue-500 bg-white';
      case 'low': return 'border-l-gray-500 bg-white';
      default: return 'border-l-blue-500 bg-white';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Stay updated with church announcements and events</p>
      </div>

      {/* Notification Details Modal */}
      {viewingNotification && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getPriorityIcon(viewingNotification.priority)}</span>
                    <h2 className="text-xl font-bold text-gray-900">{viewingNotification.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(viewingNotification.publish_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="capitalize px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {viewingNotification.type}
                    </span>
                    <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${
                      viewingNotification.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      viewingNotification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      viewingNotification.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {viewingNotification.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingNotification(null)}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Image */}
              {viewingNotification.image_url && (
                <div className="mb-6">
                  <img
                    src={viewingNotification.image_url}
                    alt="Notification"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* Message */}
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                {viewingNotification.message}
              </div>

              {/* Attachment */}
              {viewingNotification.attachment_url && (
                <div className="mt-6">
                  <a
                    href={viewingNotification.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Paperclip size={16} />
                    View Attachment
                  </a>
                </div>
              )}

              {/* Sender Info */}
              {(viewingNotification.sender_first_name || viewingNotification.sender_last_name) && (
                <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
                  Sent by: {viewingNotification.sender_first_name} {viewingNotification.sender_last_name}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setViewingNotification(null)}
                className="w-full btn-primary"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              filter === 'unread'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            <Check size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-purple-600" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification, idx) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleViewNotification(notification)}
              className={`relative border-l-4 rounded-lg p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(notification.priority)} ${
                !notification.read_at ? 'ring-2 ring-purple-200' : ''
              }`}
            >
              {/* Unread Badge */}
              {!notification.read_at && (
                <div className="absolute top-3 right-3">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl shrink-0">
                    {getPriorityIcon(notification.priority)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(notification.publish_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="capitalize px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {notification.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image */}
              {notification.image_url && (
                <div className="mb-3">
                  <img
                    src={notification.image_url}
                    alt="Notification"
                    className="w-full max-w-2xl rounded-lg"
                  />
                </div>
              )}

              {/* Message */}
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                {notification.message.length > 200 ? `${notification.message.substring(0, 200)}...` : notification.message}
              </div>
              
              {notification.message.length > 200 && (
                <div className="text-sm text-purple-600 font-medium mb-3">
                  Click to read full message →
                </div>
              )}

              {/* Attachment */}
              {notification.attachment_url && (
                <a
                  href={notification.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Paperclip size={14} />
                  View Attachment
                </a>
              )}

              {/* Mark as Read Button */}
              {!notification.read_at && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Check size={16} />
                    Mark as read
                  </button>
                </div>
              )}

              {/* Read indicator */}
              {notification.read_at && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  ✓ Read on {new Date(notification.read_at).toLocaleDateString('en-US', {
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
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">No notifications</p>
          <p className="text-sm">
            {filter === 'unread' ? 'You have no unread notifications' : 'Check back later for updates'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MemberNotifications;
