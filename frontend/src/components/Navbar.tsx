import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { CHURCH_NAME } from '@/lib/api';
import { Church, Menu, X, LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/activities', label: 'Activities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

const Navbar: React.FC = () => {
  const { member, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const dashUrl = member && ['admin','superadmin','pastor','elder'].includes(member.role as string) ? '/admin' : '/dashboard';

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-glass'
            : 'bg-transparent'
        }`}
      >
        <div className="container-pad flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-glow group-hover:shadow-glow transition-shadow duration-300">
              <Church size={22} className="text-white" />
            </div>
            <span className="font-serif text-lg font-bold text-white hidden sm:block">
              {CHURCH_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => {
              const active = l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to);
              return (
                <Link key={l.to} to={l.to}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {active && (
                    <motion.span layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-brand-600/30 border border-brand-500/40"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {member ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
                  <img src={member.profile_photo_url || 'https://placehold.co/32'} className="h-7 w-7 rounded-full object-cover" alt="" />
                  <span className="text-sm font-medium text-white">{member.first_name}</span>
                </div>
                <Link to={dashUrl} className="btn-outline py-2 text-sm">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/8 transition-all">
                  <LogIn size={16} /> Login
                </Link>
                <Link to="/register" className="btn-primary py-2 text-sm">
                  <UserPlus size={16} /> Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)}
            className="lg:hidden p-2.5 rounded-xl glass text-white transition-all">
            <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </motion.div>
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 lg:hidden overflow-hidden"
          >
            <div className="container-pad py-4 space-y-1">
              {NAV_LINKS.map((l, i) => {
                const active = l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to);
                return (
                  <motion.div key={l.to}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={l.to}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active ? 'bg-brand-600/25 text-white border border-brand-500/30' : 'text-slate-300 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                );
              })}
              <div className="border-t border-white/10 pt-3 mt-3 grid grid-cols-2 gap-2">
                {member ? (
                  <>
                    <Link to={dashUrl} className="btn-outline py-2.5 text-sm">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <button onClick={handleLogout} className="btn-primary py-2.5 text-sm bg-red-600 hover:bg-red-700 from-red-600 to-red-500">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-outline py-2.5 text-sm"><LogIn size={15} /> Login</Link>
                    <Link to="/register" className="btn-primary py-2.5 text-sm"><UserPlus size={15} /> Register</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
