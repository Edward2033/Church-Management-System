import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserPlus, Loader2, Shield, Edit2, Trash2, Mail, Phone, Calendar } from 'lucide-react';

interface SubAdmin {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  phone: string;
  member_code: string;
  permission_count: number;
  created_at: string;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
}

const AdminSubAdmins: React.FC = () => {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [permissions, setPermissions] = useState<{ [category: string]: Permission[] }>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'leader',
    gender: 'Male',
    dateOfBirth: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('cms_token');

  const fetchSubAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/subadmin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubAdmins(data.subAdmins || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${API_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPermissions(data.grouped || {});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
    fetchPermissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Email, first name, and last name are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/subadmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Sub-admin created! Setup email sent.');
      setShowForm(false);
      resetForm();
      fetchSubAdmins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'leader',
      gender: 'Male',
      dateOfBirth: '',
    });
    setSelectedPermissions([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this sub-admin?')) return;
    try {
      const res = await fetch(`${API_URL}/subadmin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Sub-admin deactivated');
      fetchSubAdmins();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Admins</h1>
          <p className="text-sm text-gray-600">Manage administrators and their permissions</p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <UserPlus size={18} /> Add Sub-Admin
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create Sub-Admin</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="leader">Leader</option>
                  <option value="deacon">Deacon</option>
                  <option value="elder">Elder</option>
                  <option value="pastor">Pastor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Permissions ({selectedPermissions.length} selected)
              </h3>
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                {Object.entries(permissions).map(([category, perms]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 capitalize">
                      {category}
                    </h4>
                    <div className="space-y-1">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="rounded"
                          />
                          <span className="text-gray-700">{perm.name}</span>
                          <span className="text-gray-500 text-xs">- {perm.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                {submitting ? 'Creating...' : 'Create Sub-Admin'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Admins List */}
      <div className="grid gap-4">
        {subAdmins.map((admin) => (
          <div key={admin.id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="text-purple-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {admin.first_name} {admin.last_name}
              </h3>
              <div className="flex gap-3 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Mail size={14} /> {admin.email}
                </span>
                {admin.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} /> {admin.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium uppercase">
                {admin.role}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {admin.permission_count} permissions
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              admin.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {admin.is_active ? 'Active' : 'Inactive'}
            </div>
            <button
              onClick={() => handleDelete(admin.id)}
              className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {subAdmins.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Shield size={48} className="mx-auto mb-3 opacity-50" />
            <p>No sub-admins yet. Click "Add Sub-Admin" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubAdmins;
