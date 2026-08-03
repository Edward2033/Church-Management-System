import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SectionWrapper, { fadeUp, stagger } from '@/components/SectionWrapper';
import { CHURCH_NAME, get, Leader, DEFAULT_CHURCH_ID } from '@/lib/api';
import { Heart, Users, BookOpen, Music2, Target, Eye, ArrowRight, Loader2 } from 'lucide-react';

const VALUES = [
  { icon: Heart, title: 'Love', desc: 'We love God and each other unconditionally.', color: 'from-rose-600/30 to-rose-500/10 border-rose-500/30 text-rose-400' },
  { icon: BookOpen, title: 'Word', desc: 'Built on the foundation of scripture.', color: 'from-blue-600/30 to-blue-500/10 border-blue-500/30 text-blue-400' },
  { icon: Users, title: 'Community', desc: 'We do life together as one family.', color: 'from-brand-600/30 to-brand-500/10 border-brand-500/30 text-brand-400' },
  { icon: Music2, title: 'Worship', desc: 'Cultivating authentic praise and presence.', color: 'from-gold/30 to-gold/10 border-gold/30 text-gold' },
];

const AboutPage: React.FC = () => {
  const [leadership, setLeadership] = useState<Leader[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);

  useEffect(() => {
    get<{ leadership: Leader[] }>(`/leadership?church_id=${DEFAULT_CHURCH_ID}`)
      .then((r) => setLeadership(r.leadership || []))
      .catch(() => {})
      .finally(() => setLoadingLeaders(false));
  }, []);

  return (
  <div className="bg-slate-950">
    {/* Hero */}
    <div className="relative overflow-hidden pt-24 pb-20">
      <div className="absolute inset-0 bg-gradient-brand opacity-20" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="container-pad relative text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="section-tag mb-5">Our Story</span>
          <h1 className="heading-lg text-white mt-4">About {CHURCH_NAME}</h1>
          <p className="mt-5 text-xl text-slate-300 max-w-2xl mx-auto">A community of faith, love, and purpose — rooted in God's word since 1985.</p>
        </motion.div>
      </div>
    </div>

    {/* Story */}
    <SectionWrapper className="section-py">
      <div className="container-pad grid gap-14 lg:grid-cols-2 items-center">
        <motion.div variants={fadeUp}>
          <span className="section-tag mb-5">Who We Are</span>
          <h2 className="heading-md text-white mt-4 mb-6">Our Journey of Faith</h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Founded in 1985 by a small group of believers with a vision to see a generation transformed by the power of the Gospel, {CHURCH_NAME} has grown into a vibrant, multi-generational family of faith.</p>
            <p>Over the decades we've remained committed to our founding values — authentic worship, sound biblical teaching, genuine community, and compassionate outreach. Today we have over 2,000 active members across all age groups.</p>
            <p>We believe the church is not a building but a people, and we invite you to be part of this family.</p>
          </div>
          <div className="mt-8 flex gap-4">
            <Link to="/register" className="btn-primary">Join Us <ArrowRight size={16} /></Link>
            <Link to="/contact" className="btn-outline">Get in Touch</Link>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} custom={1} className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=800&q=80" className="w-full object-cover h-[480px]" alt="Church" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
          </div>
          <motion.div whileHover={{ scale: 1.05 }}
            className="absolute -bottom-6 -left-6 glass rounded-2xl p-5 shadow-xl">
            <div className="text-3xl font-bold text-gradient">38+</div>
            <div className="text-sm text-slate-300">Years of Ministry</div>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }}
            className="absolute -top-6 -right-6 glass rounded-2xl p-5 shadow-xl">
            <div className="text-3xl font-bold text-gradient-gold">2K+</div>
            <div className="text-sm text-slate-300">Active Members</div>
          </motion.div>
        </motion.div>
      </div>
    </SectionWrapper>

    {/* Mission & Vision */}
    <SectionWrapper className="section-py">
      <div className="container-pad">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <span className="section-tag mb-4">Our Purpose</span>
          <h2 className="heading-md text-white mt-3">Mission & Vision</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Target, label: 'Our Mission', color: 'from-brand-600/20 border-brand-500/30 text-brand-400',
              text: 'To make disciples of all people, building them up in the knowledge and love of God, and sending them out to transform every sphere of society with the Gospel.' },
            { icon: Eye, label: 'Our Vision', color: 'from-gold/20 border-gold/30 text-gold',
              text: 'A church that reflects the diversity of heaven — every nation, tribe, and tongue worshipping and advancing God\'s kingdom together.' },
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

    {/* Core Values */}
    <SectionWrapper className="section-py">
      <div className="container-pad">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <span className="section-tag mb-4">What Drives Us</span>
          <h2 className="heading-md text-white mt-3">Core Values</h2>
        </motion.div>
        <motion.div variants={stagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <motion.div key={v.title} variants={fadeUp} custom={i}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`glass rounded-2xl p-7 text-center bg-gradient-to-br ${v.color}`}
            >
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${v.color} border flex items-center justify-center mx-auto mb-5`}>
                <v.icon size={30} className={v.color.split(' ').at(-1)} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{v.title}</h3>
              <p className="text-slate-400 text-sm">{v.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>

    {/* Leadership */}
    <SectionWrapper className="section-py">
      <div className="container-pad">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <span className="section-tag mb-4">Meet the Team</span>
          <h2 className="heading-md text-white mt-3">Our Leadership</h2>
          <p className="mt-3 text-slate-400">Serving with humility, vision, and a heart for God's people.</p>
        </motion.div>
        {loadingLeaders ? (
          <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-brand-400" /></div>
        ) : leadership.length === 0 ? (
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
