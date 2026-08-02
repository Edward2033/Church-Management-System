import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { get, CHURCH_NAME, DEFAULT_CHURCH_ID } from '@/lib/api';
import { Church, Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { fadeUp, stagger } from './SectionWrapper';

const LINKS = [
  { label: 'Home', to: '/' }, { label: 'About', to: '/about' },
  { label: 'Announcements', to: '/announcements' }, { label: 'Activities', to: '/activities' },
  { label: 'Gallery', to: '/gallery' }, { label: 'Contact', to: '/contact' },
];

interface Settings { [k: string]: string }

const Footer: React.FC = () => {
  const [s, setS] = useState<Settings>({});

  useEffect(() => {
    get<{ settings: Settings }>(`/cms/settings?church_id=${DEFAULT_CHURCH_ID}`)
      .then((r) => setS(r.settings || {}))
      .catch(() => {});
  }, []);

  const churchName    = s.church_name    || CHURCH_NAME;
  const address       = s.church_address || '12 Grace Avenue, Accra';
  const email         = s.church_email   || 'admin@lus4g.org';
  const phone         = s.church_phone   || '+233 20 000 0001';
  const tagline       = s.church_tagline || 'One Family. One Faith. One Purpose.';
  const sundayTimes   = s.sunday_service_times || '8AM · 10AM · 5PM';
  const midweek       = s.midweek_service || 'Wednesday 6:30 PM';
  const prayer        = s.prayer_meeting  || 'Friday 7:00 PM';
  const fbUrl         = s.social_facebook  || '#';
  const igUrl         = s.social_instagram || '#';
  const twUrl         = s.social_twitter   || '#';
  const ytUrl         = s.social_youtube   || '#';

  const SOCIALS = [
    { Icon: Facebook,  href: fbUrl, label: 'Facebook' },
    { Icon: Instagram, href: igUrl, label: 'Instagram' },
    { Icon: Twitter,   href: twUrl, label: 'Twitter' },
    { Icon: Youtube,   href: ytUrl, label: 'YouTube' },
  ];

  const ministries = s.footer_ministries
    ? s.footer_ministries.split('|')
    : ['Choir & Worship', 'Youth Fellowship', "Children's Church", 'Outreach', 'Prayer Ministry', 'Evangelism'];

  const serviceTimes = [
    ['Sunday',    sundayTimes],
    ['Wednesday', midweek],
    ['Friday',    prayer],
  ];

  return (
    <footer className="relative overflow-hidden bg-slate-950 border-t border-white/10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-700/5 blur-3xl rounded-full pointer-events-none" />

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={stagger}
        className="container-pad py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Brand */}
        <motion.div variants={fadeUp}>
          <Link to="/" className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
              <Church size={20} className="text-white" />
            </div>
            <span className="font-serif text-lg font-bold text-white">{churchName}</span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed mb-5">{tagline}</p>
          <div className="flex gap-3">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-600/40 transition-all duration-200">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={fadeUp} custom={1}>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Quick Links</h4>
          <ul className="space-y-2">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-slate-400 hover:text-brand-300 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="h-px w-4 bg-brand-500/0 group-hover:bg-brand-500/60 transition-all duration-300" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Ministries */}
        <motion.div variants={fadeUp} custom={2}>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Ministries</h4>
          <ul className="space-y-2">
            {ministries.map((m) => (
              <li key={m} className="text-sm text-slate-400 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-500/60" />
                {m.trim()}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Contact */}
        <motion.div variants={fadeUp} custom={3}>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest">Contact</h4>
          <ul className="space-y-3">
            {[{ Icon: MapPin, text: address }, { Icon: Mail, text: email }, { Icon: Phone, text: phone }]
              .map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-slate-400">
                  <Icon size={15} className="text-brand-400 mt-0.5 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
          </ul>
          <div className="mt-4 glass rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium mb-1.5">Service Times</p>
            {serviceTimes.map(([day, time]) => (
              <div key={day} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                <span className="text-slate-400">{day}</span>
                <span className="text-white font-medium">{time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="border-t border-white/8">
        <div className="container-pad py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} {churchName}. All rights reserved.</span>
          <span>{s.footer_copyright || 'Built with faith & purpose'}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
