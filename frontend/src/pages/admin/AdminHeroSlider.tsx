import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Upload, Trash2, Eye, EyeOff, GripVertical, Loader2, Edit2 } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
  sort_order: number;
  is_active: boolean;
}

const AdminHeroSlider: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaUrl: '',
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('cms_token');

  const fetchSlides = async () => {
    try {
      const res = await fetch(`${API_URL}/hero/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlides(data.slides || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSlide && !imageFile) {
      toast.error('Please select an image');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      if (imageFile) form.append('image', imageFile);
      form.append('title', formData.title);
      form.append('subtitle', formData.subtitle);
      form.append('ctaLabel', formData.ctaLabel);
      form.append('ctaUrl', formData.ctaUrl);
      form.append('isActive', String(formData.isActive));

      const url = editingSlide 
        ? `${API_URL}/hero/${editingSlide.id}`
        : `${API_URL}/hero`;
      
      const res = await fetch(url, {
        method: editingSlide ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingSlide ? 'Slide updated!' : 'Slide created!');
      setShowForm(false);
      setEditingSlide(null);
      resetForm();
      fetchSlides();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', subtitle: '', ctaLabel: '', ctaUrl: '', isActive: true });
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      ctaLabel: slide.cta_label || '',
      ctaUrl: slide.cta_url || '',
      isActive: slide.is_active,
    });
    setImagePreview(slide.image_url);
    setShowForm(true);
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/hero/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Slide status updated');
      fetchSlides();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    try {
      const res = await fetch(`${API_URL}/hero/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Slide deleted');
      fetchSlides();
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slider</h1>
          <p className="text-sm text-gray-600">Manage homepage hero slides</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingSlide(null); resetForm(); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} /> Add Slide
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingSlide ? 'Edit Slide' : 'New Slide'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image {!editingSlide && <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-32 rounded-lg object-cover" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Label</label>
                <input
                  type="text"
                  value={formData.ctaLabel}
                  onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Learn More"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
                <input
                  type="text"
                  value={formData.ctaUrl}
                  onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., /about"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm text-gray-700">Active</label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {submitting ? 'Saving...' : editingSlide ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingSlide(null); resetForm(); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {slides.map((slide) => (
          <div key={slide.id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
            <img src={slide.image_url} alt={slide.title} className="w-32 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{slide.title || 'Untitled'}</h3>
              <p className="text-sm text-gray-600">{slide.subtitle}</p>
              {slide.cta_label && (
                <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {slide.cta_label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(slide.id)}
                className={`p-2 rounded-lg ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                title={slide.is_active ? 'Active' : 'Inactive'}
              >
                {slide.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button
                onClick={() => handleEdit(slide)}
                className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(slide.id)}
                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Presentation size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hero slides yet. Click "Add Slide" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeroSlider;
