import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Slide {
  img: string;
  title: string;
  subtitle: string;
  tag?: string;
}

interface Props {
  slides: Slide[];
  interval?: number;
  children?: React.ReactNode;
}

const HeroSlider: React.FC<Props> = ({ slides, interval = 5000, children }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % slides.length);
    }, interval);
    return () => clearInterval(id);
  }, [slides.length, interval]);

  const go = (dir: number) => {
    setDirection(dir);
    setCurrent((c) => (c + dir + slides.length) % slides.length);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0, scale: 1.05 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
    exit: (d: number) => ({ x: d > 0 ? '-8%' : '8%', opacity: 0, scale: 0.97, transition: { duration: 0.6 } }),
  };

  const textVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.3 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="relative h-screen min-h-[600px] overflow-hidden bg-slate-950">
      {/* Slides */}
      <AnimatePresence custom={direction} mode="popLayout">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <img
            src={slides[current].img}
            alt={slides[current].title}
            className="h-full w-full object-cover"
            loading="eager"
          />
          {/* Multi-layer overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container-pad w-full">
          <div className="max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div key={`text-${current}`} initial="hidden" animate="visible">
                {slides[current].tag && (
                  <motion.span custom={0} variants={textVariants} className="section-tag mb-6 block w-fit">
                    {slides[current].tag}
                  </motion.span>
                )}
                <motion.h1 custom={1} variants={textVariants}
                  className="heading-xl text-white mb-6 [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">
                  {slides[current].title}
                </motion.h1>
                <motion.p custom={2} variants={textVariants}
                  className="text-lg sm:text-xl text-slate-200/90 mb-10 max-w-xl leading-relaxed">
                  {slides[current].subtitle}
                </motion.p>
                <motion.div custom={3} variants={textVariants}>{children}</motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="absolute z-20 top-1/2 -translate-y-1/2 left-4 sm:left-6">
        <button onClick={() => go(-1)} aria-label="Previous"
          className="h-11 w-11 rounded-full glass flex items-center justify-center text-white hover:bg-brand-600/40 transition-all duration-200 hover:scale-110">
          <ChevronLeft size={22} />
        </button>
      </div>
      <div className="absolute z-20 top-1/2 -translate-y-1/2 right-4 sm:right-6">
        <button onClick={() => go(1)} aria-label="Next"
          className="h-11 w-11 rounded-full glass flex items-center justify-center text-white hover:bg-brand-600/40 transition-all duration-200 hover:scale-110">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute z-20 bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
            style={{ width: i === current ? 28 : 8 }}
          >
            <span className="absolute inset-0 bg-white/30 rounded-full" />
            {i === current && (
              <motion.span layoutId="dot-active"
                className="absolute inset-0 bg-brand-400 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute z-20 bottom-8 right-8 hidden sm:flex flex-col items-center gap-2 text-slate-400"
      >
        <span className="text-xs uppercase tracking-widest rotate-90 origin-center">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="h-6 w-px bg-gradient-to-b from-brand-400 to-transparent" />
      </motion.div>
    </div>
  );
};

export default HeroSlider;
