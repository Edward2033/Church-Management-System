import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionWrapper, { fadeUp, stagger } from '@/components/SectionWrapper';
import Modal from '@/components/Modal';
import { get, GalleryItem, DEFAULT_CHURCH_ID } from '@/lib/api';
import { Images, ZoomIn, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const CATS = ['all', 'events', 'choir', 'worship', 'youth', 'general'];

const GalleryPage: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [cat, setCat] = useState('all');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const DEMO_GALLERY: GalleryItem[] = [
    { id: '1', church_id: '', title: 'Sunday Worship', image_url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&q=80', category: 'worship', sort_order: 1, created_at: '' },
    { id: '2', church_id: '', title: 'Choir Performance', image_url: 'https://images.unsplash.com/photo-1526308182012-7b28b74f67e9?w=600&q=80', category: 'choir', sort_order: 2, created_at: '' },
    { id: '3', church_id: '', title: 'Youth Fellowship', image_url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80', category: 'youth', sort_order: 3, created_at: '' },
    { id: '4', church_id: '', title: 'Community Outreach', image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80', category: 'events', sort_order: 4, created_at: '' },
    { id: '5', church_id: '', title: 'Prayer Meeting', image_url: 'https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=600&q=80', category: 'worship', sort_order: 5, created_at: '' },
    { id: '6', church_id: '', title: 'Church Family', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', category: 'general', sort_order: 6, created_at: '' },
    { id: '7', church_id: '', title: 'Choir Rehearsal', image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80', category: 'choir', sort_order: 7, created_at: '' },
    { id: '8', church_id: '', title: 'Annual Thanksgiving', image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80', category: 'events', sort_order: 8, created_at: '' },
  ];

  useEffect(() => {
    setLoading(true);
    const q = cat !== 'all' ? `&category=${cat}` : '';
    get<{ gallery: GalleryItem[] }>(`/gallery?church_id=${DEFAULT_CHURCH_ID}${q}`)
      .then((r) => setItems(r.gallery?.length ? r.gallery : DEMO_GALLERY))
      .catch(() => setItems(DEMO_GALLERY))
      .finally(() => setLoading(false));
  }, [cat]);

  const displayItems = cat === 'all' ? items : items.filter((i) => i.category === cat);

  const prev = () => setLightboxIdx((i) => i !== null ? (i - 1 + displayItems.length) % displayItems.length : null);
  const next = () => setLightboxIdx((i) => i !== null ? (i + 1) % displayItems.length : null);
  const current = lightboxIdx !== null ? displayItems[lightboxIdx] : null;

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lightboxIdx, displayItems.length]);

  return (
    <div className="bg-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 to-slate-950" />
        <div className="container-pad relative text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="section-tag mb-5">Visual Stories</span>
            <h1 className="heading-lg text-white mt-4 flex items-center justify-center gap-3">
              <Images size={40} className="text-brand-400" /> Photo Gallery
            </h1>
            <p className="mt-4 text-slate-400 text-lg">Moments of worship, community, and celebration captured.</p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="container-pad mb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 justify-center">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
                cat === c
                  ? 'bg-brand-600 text-white shadow-glow scale-105'
                  : 'glass text-slate-300 hover:bg-brand-600/20 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Grid */}
      <div className="container-pad pb-20">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={36} className="animate-spin text-brand-500" />
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <Images size={56} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">No photos in this category yet.</p>
          </div>
        ) : (
          <motion.div
            variants={stagger} initial="hidden" animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {displayItems.map((item, i) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                custom={i % 8}
                onClick={() => setLightboxIdx(i)}
                whileHover={{ scale: 1.03, zIndex: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-800"
              >
                <img src={item.image_url} alt={item.title || ''} loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-115" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-12 w-12 rounded-full glass flex items-center justify-center mb-2">
                    <ZoomIn size={22} className="text-white" />
                  </div>
                </div>
                {item.category && (
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="glass rounded-full px-2.5 py-1 text-xs font-semibold text-white capitalize">{item.category}</span>
                  </div>
                )}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {current && lightboxIdx !== null && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={current.image_url} alt={current.title || ''}
                className="w-full max-h-[80vh] object-contain rounded-2xl" />
              {(current.title || current.caption) && (
                <div className="mt-4 text-center">
                  {current.title && <p className="text-white font-bold text-lg">{current.title}</p>}
                  {current.caption && <p className="text-slate-400 text-sm mt-1">{current.caption}</p>}
                </div>
              )}
              <p className="text-center text-slate-500 text-xs mt-2">{lightboxIdx + 1} / {displayItems.length}</p>
            </motion.div>
            {/* Arrows */}
            <button onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 glass rounded-full flex items-center justify-center text-white hover:bg-brand-600/40 transition-all">
              <ChevronLeft size={26} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 glass rounded-full flex items-center justify-center text-white hover:bg-brand-600/40 transition-all">
              <ChevronRight size={26} />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
