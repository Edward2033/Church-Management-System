import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { get } from '@/lib/api';
import { Cake, PartyPopper, X } from 'lucide-react';

const BirthdayBanner: React.FC = () => {
  const [list, setList] = useState<{ first_name: string; last_name: string }[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Fetch all birthdays this month, then filter to show ONLY today's birthdays
    get<{ birthdays: { first_name: string; last_name: string; date_of_birth: string }[] }>('/members/birthdays')
      .then((r) => {
        const all = r.birthdays || [];
        const today = new Date();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();
        // Filter to show ONLY members with birthdays TODAY
        const todayBirthdays = all.filter((b) => {
          if (!b.date_of_birth) return false;
          const [, month, day] = b.date_of_birth.slice(0, 10).split('-').map(Number);
          return month === todayMonth && day === todayDay;
        });
        setList(todayBirthdays);
      })
      .catch(() => {});
  }, []);

  if (!list.length || !visible) return null;

  const names = list.map((b) => `${b.first_name} ${b.last_name}`).join(', ');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-50 overflow-hidden"
      >
        <div style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b, #d97706)' }}
          className="relative py-3 px-4">
          {/* shimmer overlay */}
          <div className="absolute inset-0 shimmer pointer-events-none" />

          <div className="container-pad flex items-center justify-center gap-3 relative">
            <motion.div
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="shrink-0"
            >
              <Cake size={18} className="text-slate-900" />
            </motion.div>

            <p className="text-sm sm:text-base font-bold text-slate-900 text-center">
              🎉 Happy Birthday to{' '}
              <span className="underline decoration-dotted underline-offset-2">{names}</span>
              {' '}— May God bless you abundantly! 🎂
            </p>

            <motion.div
              animate={{ rotate: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              className="shrink-0"
            >
              <PartyPopper size={18} className="text-slate-900" />
            </motion.div>

            <button
              onClick={() => setVisible(false)}
              className="absolute right-0 p-1.5 rounded-lg hover:bg-black/10 text-slate-800 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BirthdayBanner;
