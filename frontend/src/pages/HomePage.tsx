import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroSlider from '@/components/HeroSlider';
import SectionWrapper, { fadeUp, stagger } from '@/components/SectionWrapper';
import { get, Announcement, Activity, DEFAULT_CHURCH_ID } from '@/lib/api';
import {
  Users, Music2, Bell, Heart, Cake, ShieldCheck,
  Calendar, MapPin, ArrowRight, Sparkles, Loader2,
  BookOpen, Church, Star, Zap, Shield, Globe,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface HeroSlide { id: string; title: string; subtitle: string; image_url: string; cta_label?: string; cta_url?: string; }
interface Stat      { id: string; value: string; label: string; icon: string; sort_order: number; }
interface Feature   { id: string; icon: string; title: string; description: string; sort_order: number; }
interface Service   { id: string; day: string; name: string; times: string[]; icon: string; sort_order: number; }
type S = Record<string, string>;

// ── Icon map ───────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  users: Users, music: Music2, bell: Bell, heart: Heart, cake: Cake,
  'shield-check': ShieldCheck, calendar: Calendar, book: BookOpen,
  church: Church, star: Star, zap: Zap, shield: Shield, globe: Globe,
  sparkles: Sparkles, music2: Music2,
};
const Icon = ({ name, size = 26, className = '' }: { name: string; size?: number; className?: string }) => {
  const C = ICON_MAP[name?.toLowerCase()] || Heart;
  return <C size={size} className={className} />;
};

const catBadge = (cat: string) => {
  const map: Record<string, string> = {
    church: 'bg-brand-600/20 text-brand-300 border-brand-500/30',
    choir: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    events: 'bg-gold/20 text-gold border-gold/30',
    general: 'bg-white/10 text-slate-300 border-white/20',
  };
  return map[cat] || map.general;
};

// ── Component ──────────────────────────────────────────────────

const HomePage: React.FC = () => {
  const [slides,        setSlides]        = useState<{ img: string; tag?: string; title: string; subtitle: string }[]>([]);
  const [settings,      setSettings]      = useState<S>({});
  const [stats,         setStats]         = useState<Stat[]>([]);
  const [features,      setFeatures]      = useState<Feature[]>([]);
  const [services,      setServices]      = useState<Service[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activities,    setActivities]    = useState<Activity[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const cid = DEFAULT_CHURCH_ID;
    Promise.all([
      get<{ slides: HeroSlide[] }>(`/hero?church_id=${cid}`).catch(() => ({ slides: [] })),
      fetch(`/api/cms/settings?group=home`).then((r) => r.json()).catch(() => ({ raw: [] })),
      fetch(`/api/cms/homepage-stats?church_id=${cid}`).then((r) => r.json()).catch(() => ({ stats: [] })),
      fetch(`/api/cms/homepage-features?church_id=${cid}`).then((r) => r.json()).catch(() => ({ features: [] })),
      fetch(`/api/cms/homepage-services?church_id=${cid}`).then((r) => r.json()).catch(() => ({ services: [] })),
      get<{ announcements: Announcement[] }>(`/announcements?church_id=${cid}`).catch(() => ({ announcements: [] })),
      get<{ activities: Activity[] }>(`/activities?church_id=${cid}`).catch(() => ({ activities: [] })),
    ]).then(([heroRes, settingsRes, statsRes, featuresRes, servicesRes, annRes, actRes]) => {
      // Slides
      if (heroRes.slides?.length) {
        setSlides(heroRes.slides.map((s) => ({
          img: s.image_url, title: s.title || 'Welcome',
          subtitle: s.subtitle || '', tag: s.cta_label || undefined,
        })));
      } else {
        setSlides([{
          img: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1600&q=85',
          tag: '✦ Welcome to Our Family',
          title: 'Where Faith Meets Community',
          subtitle: "A place to worship, grow, and belong — together in God's love and purpose.",
        }]);
      }
      // Settings flat map
      const flat: S = {};
      (settingsRes.raw || []).forEach((r: { key: string; value: string }) => { flat[r.key] = r.value ?? ''; });
      setSettings(flat);
      setStats(statsRes.stats || []);
      setFeatures(featuresRes.features || []);
      setServices(servicesRes.services || []);
      const annLimit = parseInt(flat.home_announce_limit || '3');
      const actLimit = parseInt(flat.home_events_limit   || '3');
      setAnnouncements((annRes.announcements || []).slice(0, annLimit));
      setActivities((actRes.activities || []).slice(0, actLimit));
    }).finally(() => setLoading(false));
  }, []);

  const s = settings;
  const enabled = (key: string) => s[key] !== 'false';

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 size={48} className="animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="bg-slate-950">

      {/* ── HERO ── */}
      <HeroSlider slides={slides} interval={5000}>
        <div className="flex flex-wrap gap-4">
          <Link to={s.home_welcome_btn1_url || '/register'} className="btn-gold text-base px-8 py-3.5">
            <Heart size={18} /> {s.home_welcome_btn1_label || 'Become a Member'}
          </Link>
          <Link to={s.home_welcome_btn2_url || '/login'} className="btn-outline text-base px-8 py-3.5">
            {s.home_welcome_btn2_label || 'Member Login'} <ArrowRight size={18} />
          </Link>
        </div>
      </HeroSlider>

      {/* ── STATS STRIP ── */}
      {enabled('home_stats_enabled') && stats.length > 0 && (
        <div className="relative -mt-1 bg-gradient-to-r from-brand-900/80 via-brand-800/80 to-brand-900/80 border-y border-brand-700/40 backdrop-blur-sm">
          <div className={`container-pad py-6 grid grid-cols-2 gap-4 ${stats.length <= 2 ? 'lg:grid-cols-2' : stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
            {stats.map((st) => (
              <motion.div key={st.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gradient-gold">{st.value}</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">{st.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── WELCOME SECTION ── */}
      {enabled('home_welcome_enabled') && (s.home_welcome_title || s.home_welcome_text) && (
        <SectionWrapper className="section-py">
          <div className="container-pad">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeUp}>
                {s.home_welcome_tag && <span className="section-tag mb-4 block w-fit">{s.home_welcome_tag}</span>}
                <h2 className="heading-md text-white mt-3">{s.home_welcome_title}</h2>
                <p className="mt-5 text-slate-400 text-lg leading-relaxed">{s.home_welcome_text}</p>
                <div className="flex flex-wrap gap-4 mt-8">
                  {s.home_welcome_btn1_label && (
                    <Link to={s.home_welcome_btn1_url || '/register'} className="btn-gold px-7 py-3">
                      <Heart size={17} /> {s.home_welcome_btn1_label}
                    </Link>
                  )}
                  {s.home_welcome_btn2_label && (
                    <Link to={s.home_welcome_btn2_url || '/about'} className="btn-outline px-7 py-3">
                      {s.home_welcome_btn2_label} <ArrowRight size={17} />
                    </Link>
                  )}
                </div>
              </motion.div>
              {s.home_welcome_image && (
                <motion.div variants={fadeUp} custom={1} className="relative">
                  <div className="absolute -inset-4 bg-brand-600/10 rounded-3xl blur-2xl" />
                  <img src={s.home_welcome_image} alt="Welcome"
                    className="relative rounded-2xl w-full h-80 object-cover shadow-2xl" />
                </motion.div>
              )}
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* ── FEATURES ── */}
      {enabled('home_features_enabled') && features.length > 0 && (
        <SectionWrapper className="section-py">
          <div className="container-pad">
            <motion.div variants={fadeUp} className="text-center mb-16">
              {s.home_features_tag && <span className="section-tag mb-4">{s.home_features_tag}</span>}
              <h2 className="heading-md text-white mt-3">{s.home_features_title || 'Why Join Our Church Family?'}</h2>
              {s.home_features_subtitle && (
                <p className="mt-4 text-slate-400 max-w-xl mx-auto text-lg">{s.home_features_subtitle}</p>
              )}
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <motion.div key={f.id} variants={fadeUp} custom={i}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="card-solid rounded-2xl p-7 group"
                >
                  <div className="h-14 w-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mb-5 group-hover:bg-brand-600/40 group-hover:border-brand-400/50 transition-all duration-300">
                    <Icon name={f.icon} size={26} className="text-brand-400 group-hover:text-brand-300 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                  <div className="mt-4 h-px bg-gradient-to-r from-brand-600/0 via-brand-500/40 to-brand-600/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </motion.div>
              ))}
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* ── SERVICE TIMES ── */}
      {enabled('home_services_enabled') && services.length > 0 && (
        <SectionWrapper className="section-py relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 to-slate-950" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-700/10 blur-3xl rounded-full pointer-events-none" />
          <div className="container-pad relative">
            <motion.div variants={fadeUp} className="text-center mb-14">
              {s.home_services_tag && <span className="section-tag mb-4">{s.home_services_tag}</span>}
              <h2 className="heading-md text-white mt-3">{s.home_services_title || 'Service Times'}</h2>
            </motion.div>
            <div className={`grid gap-6 max-w-4xl mx-auto ${services.length === 1 ? 'sm:grid-cols-1 max-w-sm' : services.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              {services.map((sv, i) => (
                <motion.div key={sv.id} variants={fadeUp} custom={i} className="glass rounded-2xl p-7 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-brand-600/30 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
                    <Icon name={sv.icon} size={24} className="text-brand-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{sv.name}</h3>
                  <p className="text-brand-400 text-sm font-medium mb-3">{sv.day}</p>
                  {sv.times.map((t) => <p key={t} className="text-slate-400 text-sm mb-1">{t}</p>)}
                </motion.div>
              ))}
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {enabled('home_announce_enabled') && announcements.length > 0 && (
        <SectionWrapper className="section-py">
          <div className="container-pad">
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <div>
                {s.home_announce_tag && <span className="section-tag mb-3">{s.home_announce_tag}</span>}
                <h2 className="heading-md text-white mt-3">{s.home_announce_title || 'Latest Announcements'}</h2>
              </div>
              <Link to="/announcements" className="btn-outline py-2.5 text-sm">View All <ArrowRight size={16} /></Link>
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
      )}

      {/* ── ACTIVITIES ── */}
      {enabled('home_events_enabled') && activities.length > 0 && (
        <SectionWrapper className="section-py">
          <div className="container-pad">
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <div>
                {s.home_events_tag && <span className="section-tag mb-3">{s.home_events_tag}</span>}
                <h2 className="heading-md text-white mt-3">{s.home_events_title || 'Church Activities'}</h2>
              </div>
              <Link to="/activities" className="btn-outline py-2.5 text-sm">View All <ArrowRight size={16} /></Link>
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
      )}

      {/* ── CTA ── */}
      {enabled('home_cta_enabled') && (
        <SectionWrapper className="section-py relative overflow-hidden">
          {s.home_cta_image ? (
            <>
              <div className="absolute inset-0">
                <img src={s.home_cta_image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/75" />
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-brand opacity-90" />
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </>
          )}
          <div className="container-pad relative text-center">
            <motion.div variants={fadeUp}>
              {s.home_cta_tag && <span className="section-tag border-white/20 bg-white/10 text-white/90 mb-6">{s.home_cta_tag}</span>}
              <h2 className="heading-lg text-white mt-4 mb-5">
                {s.home_cta_title
                  ? s.home_cta_title.includes('Something Greater')
                    ? <>Ready to Be Part of{' '}<span className="text-gradient-gold">Something Greater?</span></>
                    : s.home_cta_title
                  : <>Ready to Be Part of{' '}<span className="text-gradient-gold">Something Greater?</span></>
                }
              </h2>
              {s.home_cta_text && (
                <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">{s.home_cta_text}</p>
              )}
              <div className="flex flex-wrap gap-4 justify-center">
                {s.home_cta_btn1_label && (
                  <Link to={s.home_cta_btn1_url || '/register'} className="btn-gold text-base px-9 py-4">
                    <Heart size={18} /> {s.home_cta_btn1_label}
                  </Link>
                )}
                {s.home_cta_btn2_label && (
                  <Link to={s.home_cta_btn2_url || '/contact'}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-9 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all">
                    {s.home_cta_btn2_label} <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </SectionWrapper>
      )}

    </div>
  );
};

export default HomePage;
