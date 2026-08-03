import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserCog, Plus, Loader2, Edit2, Shield, Mail, Trash2 } from 'lucide-react';

interface SubAdmin {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  phone?: string;
  permission_count: number;
  last_login?: string;
  created_at: string;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
}

const AdminSubAdmins: React.FC = () => {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SubAdmin | null>(null);
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
      setPermissions(data.permissions || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
    fetchPermissions();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        permissions: selectedPermissions,
      };

      const url = editingAdmin ? `${API_URL}/subadmin/${editingAdmin.id}` : `${API_URL}/subadmin`;
      const method = editingAdmin ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingAdmin ? 'Sub-admin updated!' : 'Sub-admin created! Setup email sent.');
      setShowForm(false);
      setEditingAdmin(null);
      resetForm();
      fetchSubAdmins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (admin: SubAdmin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      firstName: admin.first_name,
      lastName: admin.last_name,
      phone: admin.phone || '',
      role: admin.role,
      gender: 'Male',
      dateOfBirth: '',
    });

    // Fetch user's permissions
    try {
      const res = await fetch(`${API_URL}/permissions/user/${admin.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedPermissions(data.permissions.map((p: Permission) => p.id));
    } catch (err: any) {
      console.error(err);
    }

    setShowForm(true);
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
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

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
          <p className="text-sm text-gray-600">Manage administrative users and permissions</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingAdmin(null);
            resetForm();
          }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} /> Add Sub-Admin
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingAdmin ? 'Edit Sub-Admin' : 'New Sub-Admin'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={!!editingAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
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
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions <Shield size={16} className="inline ml-1" />
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="mb-4">
                    <h3 className="font-semibold text-gray-900 capitalize mb-2">{category}</h3>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="mt-1 rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                            <div className="text-xs text-gray-600">{perm.description}</div>
                          </div>
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
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <UserCog size={18} />
                )}
                {submitting ? 'Saving...' : editingAdmin ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAdmin(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {subAdmins.map((admin) => (
          <div key={admin.id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold">
              {admin.first_name[0]}
              {admin.last_name[0]}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {admin.first_name} {admin.last_name}
              </h3>
              <p className="text-sm text-gray-600">{admin.email}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded capitalize">
                  {admin.role}
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {admin.permission_count} permissions
                </span>
                {!admin.is_active && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Inactive</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(admin)}
                className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(admin.id)}
                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {subAdmins.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <UserCog size={48} className="mx-auto mb-3 opacity-50" />
            <p>No sub-admins yet. Click "Add Sub-Admin" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubAdmins;
