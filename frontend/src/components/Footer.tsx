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

// TikTok icon (not in lucide)
const TikTokIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

// WhatsApp icon
const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const Footer: React.FC = () => {
  const [s, setS] = useState<Settings>({});

  useEffect(() => {
    Promise.all([
      get<{ settings: Settings }>(`/cms/settings?church_id=${DEFAULT_CHURCH_ID}&group=footer`),
      get<{ settings: Settings }>(`/cms/settings?church_id=${DEFAULT_CHURCH_ID}&group=social`),
    ])
      .then(([footerRes, socialRes]) => {
        setS({ ...(footerRes.settings || {}), ...(socialRes.settings || {}) });
      })
      .catch(() => {});
  }, []);

  const churchName  = s.church_name    || CHURCH_NAME;
  const address     = s.church_address || '12 Grace Avenue, Accra';
  const email       = s.church_email   || 'admin@lus4g.org';
  const phone       = s.church_phone   || '+233 20 000 0001';
  const tagline     = s.church_tagline || 'One Family. One Faith. One Purpose.';
  const sundayTimes = s.sunday_service_times || '8AM · 10AM · 5PM';
  const midweek     = s.midweek_service      || 'Wednesday 6:30 PM';
  const prayer      = s.prayer_meeting       || 'Friday 7:00 PM';

  const SOCIALS = [
    { Icon: Facebook,    href: s.social_facebook,  label: 'Facebook'  },
    { Icon: Instagram,   href: s.social_instagram, label: 'Instagram' },
    { Icon: Twitter,     href: s.social_twitter,   label: 'Twitter'   },
    { Icon: Youtube,     href: s.social_youtube,   label: 'YouTube'   },
    { Icon: TikTokIcon,  href: s.social_tiktok,    label: 'TikTok'    },
    { Icon: WhatsAppIcon,href: s.social_whatsapp,  label: 'WhatsApp'  },
  ].filter((soc) => soc.href && soc.href !== '#' && soc.href.trim() !== '');

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
          {SOCIALS.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                  className="h-9 w-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-600/40 transition-all duration-200">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          )}
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
