import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '@/lib/api';
import { BookOpen, Heart, Plus, Edit, Trash2, Loader2, Save, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface DailyVerse {
  id: string;
  verse_text: string;
  reference: string;
  book?: string;
  chapter?: number;
  verse_number?: number;
  encouragement?: string;
  date: string;
  is_active: boolean;
}

interface PrayerVerse {
  id: string;
  verse_text: string;
  reference: string;
  book?: string;
  chapter?: number;
  verse_number?: number;
  explanation?: string;
  prayer_text: string;
  date: string;
  is_active: boolean;
}

const AdminVerses: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'prayer'>('daily');
  const [dailyVerses, setDailyVerses] = useState<DailyVerse[]>([]);
  const [prayerVerses, setPrayerVerses] = useState<PrayerVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [dailyForm, setDailyForm] = useState<Partial<DailyVerse>>({
    verse_text: '',
    reference: '',
    book: '',
    encouragement: '',
    date: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  const [prayerForm, setPrayerForm] = useState<Partial<PrayerVerse>>({
    verse_text: '',
    reference: '',
    book: '',
    explanation: '',
    prayer_text: '',
    date: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  useEffect(() => {
    loadVerses();
  }, [activeTab]);

  const loadVerses = async () => {
    setLoading(true);
    try {
      if (activeTab === 'daily') {
        const res = await get<{ verses: DailyVerse[] }>('/verses/daily/all?limit=100');
        setDailyVerses(res.verses || []);
      } else {
        const res = await get<{ verses: PrayerVerse[] }>('/verses/prayer/all?limit=100');
        setPrayerVerses(res.verses || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load verses');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await put(`/verses/daily/${editing}`, dailyForm);
        toast.success('Daily verse updated!');
      } else {
        await post('/verses/daily', dailyForm);
        toast.success('Daily verse created!');
      }
      setShowForm(false);
      setEditing(null);
      resetDailyForm();
      loadVerses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save verse');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await put(`/verses/prayer/${editing}`, prayerForm);
        toast.success('Prayer verse updated!');
      } else {
        await post('/verses/prayer', prayerForm);
        toast.success('Prayer verse created!');
      }
      setShowForm(false);
      setEditing(null);
      resetPrayerForm();
      loadVerses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save verse');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, type: 'daily' | 'prayer') => {
    if (!confirm('Are you sure you want to delete this verse?')) return;
    
    try {
      await del(`/verses/${type}/${id}`);
      toast.success('Verse deleted');
      loadVerses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete verse');
    }
  };

  const handleEdit = (verse: DailyVerse | PrayerVerse, type: 'daily' | 'prayer') => {
    setEditing(verse.id);
    setShowForm(true);
    if (type === 'daily') {
      setDailyForm(verse as DailyVerse);
    } else {
      setPrayerForm(verse as PrayerVerse);
    }
  };

  const resetDailyForm = () => {
    setDailyForm({
      verse_text: '',
      reference: '',
      book: '',
      encouragement: '',
      date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
  };

  const resetPrayerForm = () => {
    setPrayerForm({
      verse_text: '',
      reference: '',
      book: '',
      explanation: '',
      prayer_text: '',
      date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    resetDailyForm();
    resetPrayerForm();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Daily Verses</h1>
        <p className="text-gray-600">Create and manage Bible verses and prayer verses for member dashboards</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b">
          <button
            onClick={() => { setActiveTab('daily'); setShowForm(false); }}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'daily'
                ? 'border-b-2 border-amber-600 text-amber-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen size={18} /> Daily Verses
          </button>
          <button
            onClick={() => { setActiveTab('prayer'); setShowForm(false); }}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'prayer'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart size={18} /> Prayer Verses
          </button>
        </div>
      </div>

      {/* Action Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary mb-6"
        >
          <Plus size={18} />
          Add {activeTab === 'daily' ? 'Daily Verse' : 'Prayer Verse'}
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editing ? 'Edit' : 'Create'} {activeTab === 'daily' ? 'Daily Verse' : 'Prayer Verse'}
            </h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {activeTab === 'daily' ? (
            <form onSubmit={handleSaveDaily} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference *</label>
                  <input
                    required
                    value={dailyForm.reference || ''}
                    onChange={(e) => setDailyForm({ ...dailyForm, reference: e.target.value })}
                    className="input-base"
                    placeholder="e.g., Psalm 23:1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    required
                    type="date"
                    value={dailyForm.date || ''}
                    onChange={(e) => setDailyForm({ ...dailyForm, date: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verse Text *</label>
                <textarea
                  required
                  rows={4}
                  value={dailyForm.verse_text || ''}
                  onChange={(e) => setDailyForm({ ...dailyForm, verse_text: e.target.value })}
                  className="input-base resize-none"
                  placeholder="Enter the complete verse text..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Encouragement (Optional)</label>
                <textarea
                  rows={3}
                  value={dailyForm.encouragement || ''}
                  onChange={(e) => setDailyForm({ ...dailyForm, encouragement: e.target.value })}
                  className="input-base resize-none"
                  placeholder="A short encouragement message based on this verse..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="daily-active"
                  checked={dailyForm.is_active ?? true}
                  onChange={(e) => setDailyForm({ ...dailyForm, is_active: e.target.checked })}
                  className="accent-amber-600"
                />
                <label htmlFor="daily-active" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  <Save size={18} />
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSavePrayer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference *</label>
                  <input
                    required
                    value={prayerForm.reference || ''}
                    onChange={(e) => setPrayerForm({ ...prayerForm, reference: e.target.value })}
                    className="input-base"
                    placeholder="e.g., Philippians 4:6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    required
                    type="date"
                    value={prayerForm.date || ''}
                    onChange={(e) => setPrayerForm({ ...prayerForm, date: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verse Text *</label>
                <textarea
                  required
                  rows={4}
                  value={prayerForm.verse_text || ''}
                  onChange={(e) => setPrayerForm({ ...prayerForm, verse_text: e.target.value })}
                  className="input-base resize-none"
                  placeholder="Enter the complete verse text..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                <textarea
                  rows={3}
                  value={prayerForm.explanation || ''}
                  onChange={(e) => setPrayerForm({ ...prayerForm, explanation: e.target.value })}
                  className="input-base resize-none"
                  placeholder="What this verse teaches us..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Prayer *</label>
                <textarea
                  required
                  rows={4}
                  value={prayerForm.prayer_text || ''}
                  onChange={(e) => setPrayerForm({ ...prayerForm, prayer_text: e.target.value })}
                  className="input-base resize-none"
                  placeholder="A suggested prayer based on this verse..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prayer-active"
                  checked={prayerForm.is_active ?? true}
                  onChange={(e) => setPrayerForm({ ...prayerForm, is_active: e.target.checked })}
                  className="accent-purple-600"
                />
                <label htmlFor="prayer-active" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  <Save size={18} />
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'daily' ? (
            dailyVerses.length > 0 ? (
              dailyVerses.map((verse) => (
                <div key={verse.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-amber-700">{verse.reference}</span>
                        <span className="text-xs text-gray-500">
                          <Calendar size={12} className="inline mr-1" />
                          {new Date(verse.date).toLocaleDateString()}
                        </span>
                        {!verse.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-gray-700 italic mb-2 line-clamp-2">"{verse.verse_text}"</p>
                      {verse.encouragement && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          💡 {verse.encouragement}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(verse, 'daily')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(verse.id, 'daily')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-12 text-center text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                <p>No daily verses yet. Create your first verse!</p>
              </div>
            )
          ) : (
            prayerVerses.length > 0 ? (
              prayerVerses.map((verse) => (
                <div key={verse.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-purple-700">{verse.reference}</span>
                        <span className="text-xs text-gray-500">
                          <Calendar size={12} className="inline mr-1" />
                          {new Date(verse.date).toLocaleDateString()}
                        </span>
                        {!verse.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-gray-700 italic mb-2 line-clamp-2">"{verse.verse_text}"</p>
                      {verse.explanation && (
                        <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                          📖 {verse.explanation}
                        </p>
                      )}
                      <p className="text-sm text-purple-700 line-clamp-1">
                        🙏 {verse.prayer_text}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(verse, 'prayer')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(verse.id, 'prayer')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-12 text-center text-gray-400">
                <Heart size={48} className="mx-auto mb-3 opacity-30" />
                <p>No prayer verses yet. Create your first prayer verse!</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default AdminVerses;
