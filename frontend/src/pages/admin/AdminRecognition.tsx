import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '@/lib/api';
import { Award, Plus, Edit, Trash2, Send, Loader2, Save, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Recognition {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  recognition_month: string;
  attendance_percentage?: number;
  is_published: boolean;
  is_featured: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_photo_url?: string;
  role?: string;
}

const CATEGORIES = [
  { value: 'highest_attendance_member', label: 'Highest Attendance Member' },
  { value: 'highest_attendance_choir', label: 'Highest Attendance Choir' },
  { value: 'most_consistent_member', label: 'Most Consistent Member' },
  { value: 'most_active_choir_member', label: 'Most Active Choir Member' },
  { value: 'most_dedicated_volunteer', label: 'Most Dedicated Volunteer' },
  { value: 'custom', label: 'Custom Recognition' }
];

const AdminRecognition: React.FC = () => {
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const [form, setForm] = useState({
    user_id: '',
    title: '',
    category: 'custom',
    description: '',
    recognition_month: new Date().toISOString().substring(0, 7) + '-01',
    attendance_percentage: ''
  });

  useEffect(() => {
    loadRecognitions();
    loadUsers();
  }, []);

  const loadRecognitions = async () => {
    setLoading(true);
    try {
      const res = await get<{ recognitions: Recognition[] }>('/recognition/admin/all?limit=100');
      setRecognitions(res.recognitions || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load recognitions');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await get<{ members: any[] }>('/members?limit=500');
      setUsers(res.members || []);
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        attendance_percentage: form.attendance_percentage ? parseFloat(form.attendance_percentage) : null
      };
      
      if (editing) {
        await put(`/recognition/admin/${editing}`, data);
        toast.success('Recognition updated!');
      } else {
        await post('/recognition/admin', data);
        toast.success('Recognition created!');
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadRecognitions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save recognition');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (recognition: Recognition) => {
    setEditing(recognition.id);
    setShowForm(true);
    setForm({
      user_id: recognition.user_id,
      title: recognition.title,
      category: recognition.category,
      description: recognition.description,
      recognition_month: recognition.recognition_month,
      attendance_percentage: recognition.attendance_percentage?.toString() || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recognition?')) return;
    try {
      await del(`/recognition/admin/${id}`);
      toast.success('Recognition deleted');
      loadRecognitions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm('Publish this recognition? It will notify all users and appear on the public site.')) return;
    try {
      await post(`/recognition/admin/${id}/publish`, {});
      toast.success('Recognition published!');
      loadRecognitions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish');
    }
  };

  const handleToggleFeatured = async (recognition: Recognition) => {
    try {
      await put(`/recognition/admin/${recognition.id}`, { is_featured: !recognition.is_featured });
      toast.success(recognition.is_featured ? 'Removed from featured' : 'Featured!');
      loadRecognitions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const handleAutoGenerate = async () => {
    if (!confirm('Auto-generate recognitions based on attendance data for this month?')) return;
    try {
      const res = await post<{ recognitions: Recognition[] }>('/recognition/admin/generate', {});
      toast.success(`Generated ${res.recognitions.length} recognitions!`);
      loadRecognitions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate');
    }
  };

  const resetForm = () => {
    setForm({
      user_id: '',
      title: '',
      category: 'custom',
      description: '',
      recognition_month: new Date().toISOString().substring(0, 7) + '-01',
      attendance_percentage: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recognition Management</h1>
        <p className="text-gray-600">Recognize and celebrate outstanding members</p>
      </div>

      {!showForm && (
        <div className="flex gap-3 mb-6">
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={18} />
            Create Recognition
          </button>
          <button onClick={handleAutoGenerate} className="btn-outline">
            <Sparkles size={18} />
            Auto-Generate from Attendance
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editing ? 'Edit' : 'Create'} Recognition
            </h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Member *</label>
              <select
                required
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="input-base"
              >
                <option value="">-- Select a member --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-base"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recognition Month *</label>
                <input
                  required
                  type="date"
                  value={form.recognition_month}
                  onChange={(e) => setForm({ ...form, recognition_month: e.target.value })}
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-base"
                placeholder="e.g., Highest Attendance Member"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-base resize-none"
                placeholder="Describe why this member is being recognized..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Percentage (Optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.attendance_percentage}
                onChange={(e) => setForm({ ...form, attendance_percentage: e.target.value })}
                className="input-base"
                placeholder="e.g., 95.50"
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleCancel} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={18} className="animate-spin" />}
                <Save size={18} />
                {editing ? 'Update' : 'Create'} Recognition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {!showForm && (
        loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-purple-600" />
          </div>
        ) : recognitions.length > 0 ? (
          <div className="space-y-3">
            {recognitions.map((recognition) => (
              <div key={recognition.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <img 
                      src={recognition.profile_photo_url || 'https://placehold.co/60'} 
                      alt={recognition.first_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-bold text-gray-900">{recognition.title}</h3>
                        {recognition.is_published && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                            Published
                          </span>
                        )}
                        {recognition.is_featured && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                            ⭐ Featured
                          </span>
                        )}
                        {!recognition.is_published && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-purple-700 mb-1">
                        {recognition.first_name} {recognition.last_name}
                        {recognition.attendance_percentage && ` • ${recognition.attendance_percentage}%`}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{recognition.description}</p>
                      <div className="text-xs text-gray-500">
                        {new Date(recognition.recognition_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!recognition.is_published && (
                      <button
                        onClick={() => handlePublish(recognition.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Publish"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    {recognition.is_published && (
                      <button
                        onClick={() => handleToggleFeatured(recognition)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title={recognition.is_featured ? 'Remove from Featured' : 'Feature'}
                      >
                        <Award size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(recognition)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(recognition.id)}
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
            <Award size={48} className="mx-auto mb-3 opacity-30" />
            <p>No recognitions yet. Create your first recognition!</p>
          </div>
        )
      )}
    </div>
  );
};

export default AdminRecognition;
