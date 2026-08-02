import React, { useEffect, useState } from 'react';
import { get, Announcement, DEFAULT_CHURCH_ID } from '@/lib/api';
import { Megaphone, Pin, Loader2, Calendar } from 'lucide-react';

const CATS = ['all', 'church', 'choir', 'events', 'general'];

const catColors: Record<string, string> = {
  church: 'bg-purple-100 text-purple-700',
  choir: 'bg-indigo-100 text-indigo-700',
  events: 'bg-amber-100 text-amber-700',
  general: 'bg-gray-100 text-gray-700',
};

const DEMO: Announcement[] = [
  {
    id: '1', church_id: DEFAULT_CHURCH_ID, title: 'Sunday Service — All Are Welcome!',
    content: 'Join us this Sunday for a powerful time of worship, prayer, and the Word. Services at 8:00 AM, 10:00 AM, and 5:00 PM. Come as you are — everyone is welcome in God\'s house.',
    category: 'church', pinned: true, is_active: true, audience: 'all',
    published_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: '2', church_id: DEFAULT_CHURCH_ID, title: 'Choir Rehearsal — Friday 6:00 PM',
    content: 'All choir members are reminded of the weekly rehearsal this Friday at 6:00 PM in the main hall. New members interested in joining the choir are also welcome to attend.',
    category: 'choir', pinned: false, is_active: true, audience: 'all',
    published_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3', church_id: DEFAULT_CHURCH_ID, title: 'Annual Thanksgiving Service',
    content: 'Our Annual Thanksgiving Service is coming up! Mark your calendars for a special day of praise, testimonies, and celebration of God\'s faithfulness throughout the year.',
    category: 'events', pinned: false, is_active: true, audience: 'all',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(), created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '4', church_id: DEFAULT_CHURCH_ID, title: 'New Member Registration Now Open',
    content: 'We are excited to welcome new members into our church family! If you\'ve been attending and would like to officially join, please register online or speak to any of our ushers.',
    category: 'general', pinned: false, is_active: true, audience: 'all',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(), created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const AnnouncementsPage: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = cat !== 'all' ? `&category=${cat}` : '';
    get<{ announcements: Announcement[] }>(`/announcements?church_id=${DEFAULT_CHURCH_ID}${q}`)
      .then((r) => setItems(r.announcements?.length ? r.announcements : DEMO))
      .catch(() => setItems(DEMO))
      .finally(() => setLoading(false));
  }, [cat]);

  const filtered = cat === 'all' ? items : items.filter((a) => a.category === cat);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 bg-gradient-brand opacity-20" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="container-pad relative text-center">
          <span className="section-tag mb-5">Stay Updated</span>
          <h1 className="heading-lg text-white mt-4 flex items-center justify-center gap-3">
            <Megaphone size={36} /> Announcements
          </h1>
          <p className="mt-5 text-xl text-slate-300 max-w-2xl mx-auto">Latest news and updates from the church</p>
        </div>
      </div>

      {/* Filters */}
      <div className="container-pad mb-12">
        <div className="flex flex-wrap gap-3 justify-center">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold capitalize transition-all ${
                cat === c 
                  ? 'bg-brand-600 text-white shadow-glow' 
                  : 'glass text-slate-300 hover:text-white hover:bg-white/10'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container-pad pb-20">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-brand-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Megaphone size={48} className="mx-auto mb-3 opacity-30" />
            <p>No announcements in this category.</p>
          </div>
        ) : (
          <div className="grid gap-6 max-w-5xl mx-auto">
            {filtered.map((a) => (
              <div key={a.id} className={`card-solid rounded-2xl overflow-hidden ${a.pinned ? 'ring-2 ring-gold/50' : ''}`}>
                <div className="flex flex-col sm:flex-row gap-4">
                  {a.image_url && (
                    <div className="sm:w-48 h-48 sm:h-auto shrink-0">
                      <img src={a.image_url} className="w-full h-full object-cover" alt={a.title} />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {a.pinned && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/30">
                          <Pin size={11} /> Pinned
                        </span>
                      )}
                      <span className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-full ${
                        a.category === 'church' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        a.category === 'choir' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        a.category === 'events' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}>
                        {a.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{a.title}</h3>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">{a.content}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      {a.author_name && <span className="text-slate-400">by {a.author_name}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
