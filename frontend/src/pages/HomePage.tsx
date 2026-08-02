import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroSlider from '@/components/HeroSlider';
import SectionWrapper, { fadeUp, stagger } from '@/components/SectionWrapper';
import { get, Announcement, Activity, CHURCH_NAME, DEFAULT_CHURCH_ID } from '@/lib/api';
import {
  Users, Music2, Bell, Heart, Cake, ShieldCheck,
  Calendar, MapPin, ArrowRight, Sparkles,
} from 'lucide-react';

const SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1600&q=85',
    tag: '✦ Welcome to Our Family',
    title: 'Where Faith Meets Community',
    subtitle: 'A place to worship, grow, and belong — together in God\'s love and purpose.',
  },
  {
    img: 'https://images.unsplash.com/photo-1526308182012-7b28b74f67e9?w=1600&q=85',
    tag: '✦ Worship in Spirit & Truth',
    title: 'Lift Your Voice to Heaven',
    subtitle: 'Experience powerful worship that transforms hearts and draws you closer to God.',
  },
  {
    img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1600&q=85',
    tag: '✦ Grow in Purpose',
    title: 'Your Gifts Matter Here',
    subtitle: 'Discover and deploy your God-given gifts to serve and transform lives.',
  },
  {
    img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1600&q=85',
    tag: '✦ One Family',
    title: 'Built on Love & Grace',
    subtitle: 'Join thousands of believers walking together in faith, hope, and community.',
  },
];

const FEATURES = [
  { icon: Heart, title: 'Worship & Praise', desc: 'Experience powerful, spirit-filled worship every Sunday with our dedicated choir and worship team.' },
  { icon: Music2, title: 'Choir Ministry', desc: 'Join our vibrant choir — soprano, alto, tenor, and bass voices united in praise and harmony.' },
  { icon: Users, title: 'Community & Fellowship', desc: 'Build lasting friendships and grow together through life groups, events, and shared ministry.' },
  { icon: Bell, title: 'Stay Connected', desc: 'Receive announcements, event reminders, and birthday celebrations directly to your dashboard.' },
  { icon: Cake, title: 'Celebrate Together', desc: 'We honour every member on their birthday and celebrate life milestones as one family.' },
  { icon: ShieldCheck, title: 'Safe & Welcoming', desc: 'A secure, inclusive space where every person is known, valued, and cared for by name.' },
];

const SERVICE_TIMES = [
  { day: 'Sunday', times: ['First Service 8:00 AM', 'Second Service 10:00 AM', 'Evening Service 5:00 PM'] },
  { day: 'Wednesday', times: ['Bible Study 6:30 PM'] },
  { day: 'Friday', times: ['Prayer Meeting 7:00 PM', 'Choir Rehearsal 6:00 PM'] },
];

const catBadge = (cat: string) => {
  const map: Record<string, string> = {
    church: 'bg-brand-600/20 text-brand-300 border-brand-500/30',
    choir: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    events: 'bg-gold/20 text-gold border-gold/30',
    general: 'bg-white/10 text-slate-300 border-white/20',
  };
  return map[cat] || map.general;
};

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  { id: 'd1', church_id: DEFAULT_CHURCH_ID, title: 'Sunday Service — All Are Welcome!', content: 'Join us this Sunday for powerful worship, prayer, and the Word. Services at 8AM, 10AM, and 5PM.', category: 'church', pinned: true, is_active: true, audience: 'all', published_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd2', church_id: DEFAULT_CHURCH_ID, title: 'Choir Rehearsal — Friday 6:00 PM', content: 'All choir members are reminded of the weekly rehearsal this Friday at 6PM in the main hall.', category: 'choir', pinned: false, is_active: true, audience: 'all', published_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'd3', church_id: DEFAULT_CHURCH_ID, title: 'Annual Thanksgiving Service', content: 'Our Annual Thanksgiving Service is coming up! Mark your calendars for a special day of praise and celebration.', category: 'events', pinned: false, is_active: true, audience: 'all', published_at: new Date(Date.now() - 2 * 86400000).toISOString(), created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date(Date.now() - 2 * 86400000).toISOString() },
];

const today = new Date();
const fmtDate = (d: Date) => d.toISOString().split('T')[0];

const DEMO_ACTIVITIES: Activity[] = [
  { id: 'a1', church_id: DEFAULT_CHURCH_ID, title: 'Sunday Worship Service', description: 'A powerful Sunday worship experience with praise, prayer, and the Word.', category: 'worship', image_url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&q=80', event_date: fmtDate(new Date(today.getTime() + 2 * 86400000)), start_time: '8:00 AM', location: 'Main Sanctuary', audience: 'all', is_active: true, requires_registration: false, created_at: new Date().toISOString() },
  { id: 'a2', church_id: DEFAULT_CHURCH_ID, title: 'Choir Rehearsal', description: 'Weekly choir rehearsal for all voice groups. New members welcome.', category: 'choir', image_url: 'https://images.unsplash.com/photo-1526308182012-7b28b74f67e9?w=600&q=80', event_date: fmtDate(new Date(today.getTime() + 4 * 86400000)), start_time: '6:00 PM', location: 'Choir Hall', audience: 'choir', is_active: true, requires_registration: false, created_at: new Date().toISOString() },
  { id: 'a3', church_id: DEFAULT_CHURCH_ID, title: 'Community Outreach', description: 'Serving our community with food, clothing, and the love of Christ.', category: 'outreach', image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80', event_date: fmtDate(new Date(today.getTime() + 7 * 86400000)), start_time: '9:00 AM', location: 'Community Centre', audience: 'all', is_active: true, requires_registration: false, created_at: new Date().toISOString() },
];

const HomePage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEMO_ANNOUNCEMENTS);
  const [activities, setActivities] = useState<Activity[]>(DEMO_ACTIVITIES);

  useEffect(() => {
    get<{ announcements: Announcement[] }>(`/announcements?church_id=${DEFAULT_CHURCH_ID}`)
      .then((r) => setAnnouncements(r.announcements?.length ? r.announcements.slice(0, 3) : DEMO_ANNOUNCEMENTS))
      .catch(() => setAnnouncements(DEMO_ANNOUNCEMENTS));
    get<{ activities: Activity[] }>(`/activities?church_id=${DEFAULT_CHURCH_ID}`)
      .then((r) => setActivities(r.activities?.length ? r.activities.slice(0, 3) : DEMO_ACTIVITIES))
      .catch(() => setActivities(DEMO_ACTIVITIES));
  }, []);

  return (
    <div className="bg-slate-950">
      {/* ── HERO ── */}
      <HeroSlider slides={SLIDES} interval={5000}>
        <div className="flex flex-wrap gap-4">
          <Link to="/register" className="btn-gold text-base px-8 py-3.5">
            <Heart size={18} /> Become a Member
          </Link>
          <Link to="/login" className="btn-outline text-base px-8 py-3.5">
            Member Login <ArrowRight size={18} />
          </Link>
        </div>
      </HeroSlider>

      {/* ── STATS STRIP ── */}
      <div className="relative -mt-1 bg-gradient-to-r from-brand-900/80 via-brand-800/80 to-brand-900/80 border-y border-brand-700/40 backdrop-blur-sm">
        <div className="container-pad py-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[['2,000+', 'Active Members'], ['38+', 'Years of Ministry'], ['12+', 'Ministries'], ['1', 'Church Family']].map(([v, l]) => (
            <motion.div key={l} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient-gold">{v}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">{l}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <SectionWrapper className="section-py">
        <div className="container-pad">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="section-tag mb-4">Our Ministries</span>
            <h2 className="heading-md text-white mt-3">Why Join Our Church Family?</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto text-lg">
              A place to worship, grow, serve, and belong — rooted in God's word and love.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="card-solid rounded-2xl p-7 group"
              >
                <div className="h-14 w-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mb-5 group-hover:bg-brand-600/40 group-hover:border-brand-400/50 transition-all duration-300">
                  <f.icon size={26} className="text-brand-400 group-hover:text-brand-300 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                <div className="mt-4 h-px bg-gradient-to-r from-brand-600/0 via-brand-500/40 to-brand-600/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ── SERVICE TIMES ── */}
      <SectionWrapper className="section-py relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 to-slate-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-700/10 blur-3xl rounded-full pointer-events-none" />
        <div className="container-pad relative">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <span className="section-tag mb-4">Come Worship With Us</span>
            <h2 className="heading-md text-white mt-3">Service Times</h2>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {SERVICE_TIMES.map((s, i) => (
              <motion.div key={s.day} variants={fadeUp} custom={i}
                className="glass rounded-2xl p-7 text-center"
              >
                <div className="h-14 w-14 rounded-2xl bg-brand-600/30 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
                  <Calendar size={24} className="text-brand-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{s.day}</h3>
                {s.times.map((t) => <p key={t} className="text-slate-400 text-sm mb-1">{t}</p>)}
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ── ANNOUNCEMENTS ── */}
      <SectionWrapper className="section-py">
          <div className="container-pad">
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <div>
                <span className="section-tag mb-3">Stay Informed</span>
                <h2 className="heading-md text-white mt-3">Latest Announcements</h2>
              </div>
              <Link to="/announcements" className="btn-outline py-2.5 text-sm">
                View All <ArrowRight size={16} />
              </Link>
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-3">
              {announcements.map((a, i) => (
                <motion.div key={a.id} variants={fadeUp} custom={i}
                  whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="card-solid rounded-2xl overflow-hidden group"
                >
                  {a.image_url ? (
                    <div className="h-48 overflow-hidden">
                      <img src={a.image_url} alt={a.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-brand-900/60 to-slate-800 flex items-center justify-center">
                      <Sparkles size={40} className="text-brand-500/50" />
                    </div>
                  )}
                  <div className="p-5">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize mb-3 ${catBadge(a.category)}`}>{a.category}</span>
                    <h3 className="font-bold text-white text-base leading-snug">{a.title}</h3>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">{a.content}</p>
                    <p className="mt-3 text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </SectionWrapper>

      {/* ── ACTIVITIES ── */}
      <SectionWrapper className="section-py">
          <div className="container-pad">
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <div>
                <span className="section-tag mb-3">What's Happening</span>
                <h2 className="heading-md text-white mt-3">Church Activities</h2>
              </div>
              <Link to="/activities" className="btn-outline py-2.5 text-sm">
                View All <ArrowRight size={16} />
              </Link>
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-3">
              {activities.map((a, i) => (
                <motion.div key={a.id} variants={fadeUp} custom={i}
                  whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="card-solid rounded-2xl overflow-hidden group"
                >
                  {a.image_url ? (
                    <div className="h-44 overflow-hidden">
                      <img src={a.image_url} alt={a.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-indigo-900/60 to-slate-800 flex items-center justify-center">
                      <Music2 size={36} className="text-indigo-500/50" />
                    </div>
                  )}
                  <div className="p-5">
                    <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold capitalize text-indigo-300 mb-3">{a.category}</span>
                    <h3 className="font-bold text-white">{a.title}</h3>
                    {a.description && <p className="mt-1.5 text-sm text-slate-400 line-clamp-2">{a.description}</p>}
                    {a.event_date && (
                      <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} className="text-brand-400" />
                        {new Date(a.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {a.location && <><span className="mx-1">·</span><MapPin size={11} className="text-brand-400" />{a.location}</>}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </SectionWrapper>

      {/* ── CTA ── */}
      <SectionWrapper className="section-py relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand opacity-90" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="container-pad relative text-center">
          <motion.div variants={fadeUp}>
            <span className="section-tag border-white/20 bg-white/10 text-white/90 mb-6">Join Our Family</span>
            <h2 className="heading-lg text-white mt-4 mb-5">
              Ready to Be Part of{' '}
              <span className="text-gradient-gold">Something Greater?</span>
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">
              Register today and become part of a vibrant, loving community of believers growing together in faith.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="btn-gold text-base px-9 py-4">
                <Heart size={18} /> Register Now
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-9 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all">
                Contact Us <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </SectionWrapper>
    </div>
  );
};

export default HomePage;
