import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SectionWrapper, { fadeUp, stagger } from '@/components/SectionWrapper';
import { get, Leader, DEFAULT_CHURCH_ID } from '@/lib/api';
import { Heart, Users, BookOpen, Music2, Target, Eye, ArrowRight, Loader2 } from 'lucide-react';

interface CmsSettings { [key: string]: string }
interface AboutValue {
  id: string;
  title: string;
  description: string;
  color_class: string;
  sort_order: number;
}

// Fallback color palette cycling for values without a stored color
const FALLBACK_COLORS = [
  'from-rose-600/30 to-rose-500/10 border-rose-500/30 text-rose-400',
  'from-blue-600/30 to-blue-500/10 border-blue-500/30 text-blue-400',
  'from-brand-600/30 to-brand-500/10 border-brand-500/30 text-brand-400',
  'from-gold/30 to-gold/10 border-gold/30 text-gold',
  'from-green-600/30 to-green-500/10 border-green-500/30 text-green-400',
  'from-purple-600/30 to-purple-500/10 border-purple-500/30 text-purple-400',
];

const AboutPage: React.FC = () => {
  const [s, setS] = useState<CmsSettings>({});
  const [values, setValues] = useState<AboutValue[]>([]);
  const [leadership, setLeadership] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cid = DEFAULT_CHURCH_ID;
    Promise.all([
      get<{ settings: CmsSettings }>(`/cms/settings?church_id=${cid}&group=about`),
      get<{ values: AboutValue[] }>(`/cms/about-values?church_id=${cid}`),
      get<{ leadership: Leader[] }>(`/leadership?church_id=${cid}`),
    ])
      .then(([settingsRes, valuesRes, leadersRes]) => {
        setS(settingsRes.settings || {});
        setValues(valuesRes.values || []);
        setLeadership(leadersRes.leadership || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const t = (key: string, fallback = '') => (s[key] as string) || fallback;

  const heroImage = t('about_hero_image');
  const introImage = t('about_intro_image', 'https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=800&q=80');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="bg-slate-950">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden pt-24 pb-20">
        {heroImage ? (
          <>
            <img src={heroImage} alt="About" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 to-slate-950" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-brand opacity-20" />
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          </>
        )}
        <div className="container-pad relative text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="section-tag mb-5">{t('about_hero_tag', 'Our Story')}</span>
            <h1 className="heading-lg text-white mt-4">{t('about_hero_title', 'About Our Church')}</h1>
            <p className="mt-5 text-xl text-slate-300 max-w-2xl mx-auto">{t('about_hero_subtitle', 'A community of faith, love, and purpose.')}</p>
          </motion.div>
        </div>
      </div>

      {/* ── INTRO / STORY ── */}
      <SectionWrapper className="section-py">
        <div className="container-pad grid gap-14 lg:grid-cols-2 items-center">
          <motion.div variants={fadeUp}>
            <span className="section-tag mb-5">{t('about_intro_tag', 'Who We Are')}</span>
            <h2 className="heading-md text-white mt-4 mb-6">{t('about_intro_title', 'Our Journey of Faith')}</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              {[t('about_intro_p1'), t('about_intro_p2'), t('about_intro_p3')]
                .filter(Boolean)
                .map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <div className="mt-8 flex gap-4">
              <Link to="/register" className="btn-primary">Join Us <ArrowRight size={16} /></Link>
              <Link to="/contact" className="btn-outline">Get in Touch</Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img src={introImage} className="w-full object-cover h-[480px]" alt="Church" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
            </div>
            {t('about_stat1_value') && (
              <motion.div whileHover={{ scale: 1.05 }}
                className="absolute -bottom-6 -left-6 glass rounded-2xl p-5 shadow-xl">
                <div className="text-3xl font-bold text-gradient">{t('about_stat1_value', '38+')}</div>
                <div className="text-sm text-slate-300">{t('about_stat1_label', 'Years of Ministry')}</div>
              </motion.div>
            )}
            {t('about_stat2_value') && (
              <motion.div whileHover={{ scale: 1.05 }}
                className="absolute -top-6 -right-6 glass rounded-2xl p-5 shadow-xl">
                <div className="text-3xl font-bold text-gradient-gold">{t('about_stat2_value', '2K+')}</div>
                <div className="text-sm text-slate-300">{t('about_stat2_label', 'Active Members')}</div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </SectionWrapper>

      {/* ── MISSION & VISION ── */}
      <SectionWrapper className="section-py">
        <div className="container-pad">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="section-tag mb-4">Our Purpose</span>
            <h2 className="heading-md text-white mt-3">Mission &amp; Vision</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Target, label: t('about_mission_title', 'Our Mission'), text: t('about_mission_text'), color: 'from-brand-600/20 border-brand-500/30 text-brand-400' },
              { icon: Eye,    label: t('about_vision_title',  'Our Vision'),  text: t('about_vision_text'),  color: 'from-gold/20 border-gold/30 text-gold' },
            ].map((item, i) => (
              <motion.div key={item.label} variants={fadeUp} custom={i}
                className={`glass rounded-2xl p-8 bg-gradient-to-br ${item.color}`}>
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.color} border flex items-center justify-center mb-5`}>
                  <item.icon size={26} className={item.color.split(' ').at(-1)} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{item.label}</h3>
                <p className="text-slate-300 leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ── CORE VALUES ── */}
      {values.length > 0 && (
        <SectionWrapper className="section-py">
          <div className="container-pad">
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="section-tag mb-4">{t('about_values_tag', 'What Drives Us')}</span>
              <h2 className="heading-md text-white mt-3">{t('about_values_title', 'Core Values')}</h2>
            </motion.div>
            <motion.div variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v, i) => {
                const color = v.color_class || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const textColor = color.split(' ').at(-1) || 'text-brand-400';
                return (
                  <motion.div key={v.id} variants={fadeUp} custom={i}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`glass rounded-2xl p-7 text-center bg-gradient-to-br ${color}`}
                  >
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${color} border flex items-center justify-center mx-auto mb-5`}>
                      <Heart size={30} className={textColor} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{v.title}</h3>
                    <p className="text-slate-400 text-sm">{v.description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </SectionWrapper>
      )}

      {/* ── LEADERSHIP ── */}
      <SectionWrapper className="section-py">
        <div className="container-pad">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="section-tag mb-4">{t('about_leadership_tag', 'Meet the Team')}</span>
            <h2 className="heading-md text-white mt-3">{t('about_leadership_title', 'Our Leadership')}</h2>
            {t('about_leadership_sub') && (
              <p className="mt-3 text-slate-400">{t('about_leadership_sub')}</p>
            )}
          </motion.div>
          {leadership.length === 0 ? (
            <p className="text-center text-slate-500 py-12">Leadership information coming soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {leadership.map((l, i) => (
                <motion.div key={l.id} variants={fadeUp} custom={i}
                  whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="card-solid rounded-2xl overflow-hidden group"
                >
                  <div className="relative overflow-hidden h-64">
                    {l.photo_url ? (
                      <img src={l.photo_url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt={l.name} />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-brand-900/60 to-slate-800 flex items-center justify-center">
                        <Users size={48} className="text-brand-500/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white">{l.name}</h3>
                    <p className="text-sm text-brand-400 font-medium mt-1">{l.title}</p>
                    {l.bio && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{l.bio}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </SectionWrapper>

    </div>
  );
};

export default AboutPage;
