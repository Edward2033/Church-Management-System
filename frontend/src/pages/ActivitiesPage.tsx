import React, { useEffect, useState } from 'react';
import { get, Activity, DEFAULT_CHURCH_ID } from '@/lib/api';
import { Activity as ActivityIcon, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';

const CATS = ['all', 'church', 'choir', 'worship', 'outreach', 'youth'];

const catColors: Record<string, string> = {
  church: 'bg-purple-100 text-purple-700',
  choir: 'bg-indigo-100 text-indigo-700',
  worship: 'bg-rose-100 text-rose-700',
  outreach: 'bg-green-100 text-green-700',
  youth: 'bg-amber-100 text-amber-700',
  general: 'bg-gray-100 text-gray-700',
};

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];

const DEMO: Activity[] = [
  {
    id: '1', church_id: DEFAULT_CHURCH_ID, title: 'Sunday Worship Service',
    description: 'Join us for a powerful Sunday worship experience with praise, prayer, and the preaching of God\'s Word. All are welcome.',
    category: 'worship', image_url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&q=80',
    event_date: fmt(new Date(today.getTime() + 2 * 86400000)),
    start_time: '8:00 AM', end_time: '12:00 PM', location: 'Main Sanctuary',
    audience: 'all', is_active: true, requires_registration: false, created_at: new Date().toISOString(),
  },
  {
    id: '2', church_id: DEFAULT_CHURCH_ID, title: 'Choir Rehearsal',
    description: 'Weekly choir rehearsal for all voice groups. New members interested in joining the choir are welcome to attend.',
    category: 'choir', image_url: 'https://images.unsplash.com/photo-1526308182012-7b28b74f67e9?w=600&q=80',
    event_date: fmt(new Date(today.getTime() + 4 * 86400000)),
    start_time: '6:00 PM', end_time: '8:00 PM', location: 'Choir Hall',
    audience: 'choir', is_active: true, requires_registration: false, created_at: new Date().toISOString(),
  },
  {
    id: '3', church_id: DEFAULT_CHURCH_ID, title: 'Community Outreach Program',
    description: 'Serving our community with food, clothing, and the love of Christ. Volunteers are needed — come and be a blessing!',
    category: 'outreach', image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80',
    event_date: fmt(new Date(today.getTime() + 7 * 86400000)),
    start_time: '9:00 AM', end_time: '2:00 PM', location: 'Community Centre',
    audience: 'all', is_active: true, requires_registration: false, created_at: new Date().toISOString(),
  },
  {
    id: '4', church_id: DEFAULT_CHURCH_ID, title: 'Youth Fellowship Night',
    description: 'A fun-filled evening for young people with games, worship, and a powerful message. Ages 13–30 welcome.',
    category: 'youth', image_url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80',
    event_date: fmt(new Date(today.getTime() + 5 * 86400000)),
    start_time: '5:00 PM', end_time: '8:00 PM', location: 'Youth Hall',
    audience: 'youth', is_active: true, requires_registration: false, created_at: new Date().toISOString(),
  },
  {
    id: '5', church_id: DEFAULT_CHURCH_ID, title: 'Wednesday Bible Study',
    description: 'Deepen your understanding of God\'s Word in our midweek Bible study. Open to all members and visitors.',
    category: 'church', image_url: '',
    event_date: fmt(new Date(today.getTime() + 3 * 86400000)),
    start_time: '6:30 PM', end_time: '8:00 PM', location: 'Fellowship Hall',
    audience: 'all', is_active: true, requires_registration: false, created_at: new Date().toISOString(),
  },
  {
    id: '6', church_id: DEFAULT_CHURCH_ID, title: 'Friday Prayer Meeting',
    description: 'Come together for an evening of intercession, worship, and seeking God\'s face. All are welcome.',
    category: 'worship', image_url: '',
    event_date: fmt(new Date(today.getTime() + 6 * 86400000)),
    start_time: '7:00 PM', end_time: '9:00 PM', location: 'Prayer Room',
    audience: 'all', is_active: true, requires_registration: false, created_at: new Date().toISOString(),
  },
];

const ActivitiesPage: React.FC = () => {
  const [items, setItems] = useState<Activity[]>([]);
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = cat !== 'all' ? `&category=${cat}` : '';
    get<{ activities: Activity[] }>(`/activities?church_id=${DEFAULT_CHURCH_ID}${q}`)
      .then((r) => setItems(r.activities?.length ? r.activities : DEMO))
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
          <span className="section-tag mb-5">What's Happening</span>
          <h1 className="heading-lg text-white mt-4 flex items-center justify-center gap-3">
            <ActivityIcon size={36} /> Church Activities
          </h1>
          <p className="mt-5 text-xl text-slate-300 max-w-2xl mx-auto">Upcoming and recent church and choir activities</p>
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
            <ActivityIcon size={48} className="mx-auto mb-3 opacity-30" />
            <p>No activities in this category yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <div key={a.id} className="card-solid rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                {a.image_url ? (
                  <div className="relative h-48 overflow-hidden">
                    <img src={a.image_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" alt={a.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-brand-600/30 to-brand-400/10 flex items-center justify-center">
                    <ActivityIcon size={48} className="text-brand-400/50" />
                  </div>
                )}
                <div className="p-5">
                  <span className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-full border ${
                    a.category === 'church' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    a.category === 'choir' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                    a.category === 'worship' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                    a.category === 'outreach' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                    a.category === 'youth' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  }`}>
                    {a.category}
                  </span>
                  <h3 className="mt-3 font-bold text-white text-lg">{a.title}</h3>
                  {a.description && <p className="mt-2 text-sm text-slate-400 line-clamp-2">{a.description}</p>}
                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    {a.event_date && (
                      <p className="flex items-center gap-2">
                        <Calendar size={13} className="text-brand-400" />
                        <span className="text-slate-300">{new Date(a.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </p>
                    )}
                    {(a.start_time || a.end_time) && (
                      <p className="flex items-center gap-2">
                        <Clock size={13} className="text-brand-400" />
                        <span className="text-slate-300">{a.start_time}{a.end_time ? ` — ${a.end_time}` : ''}</span>
                      </p>
                    )}
                    {a.location && (
                      <p className="flex items-center gap-2">
                        <MapPin size={13} className="text-brand-400" />
                        <span className="text-slate-300">{a.location}</span>
                      </p>
                    )}
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

export default ActivitiesPage;
