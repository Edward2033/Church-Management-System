import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { get, CHURCH_NAME } from '@/lib/api';
import {
  Church, LayoutDashboard, Users, Music2, Megaphone, Activity,
  Images, DollarSign, Bell, LogOut, Menu, X, Cake, BarChart2,
  Settings, Send, UserCog, Mail, Presentation, Shield,
} from 'lucide-react';
import AdminOverview      from './admin/AdminOverview';
import AdminMembers       from './admin/AdminMembers';
import AdminChoir         from './admin/AdminChoir';
import AdminAnnouncements from './admin/AdminAnnouncements';
import AdminActivities    from './admin/AdminActivities';
import AdminGallery       from './admin/AdminGallery';
import AdminDonations     from './admin/AdminDonations';
import AdminNotifications from './admin/AdminNotifications';

const NAV = [
  { to: '/admin',               label: 'Overview',       icon: LayoutDashboard, end: true },
  { to: '/admin/members',       label: 'Members',        icon: Users },
  { to: '/admin/choir',         label: 'Choir',          icon: Music2 },
  { to: '/admin/announcements', label: 'Announcements',  icon: Megaphone },
  { to: '/admin/activities',    label: 'Activities',     icon: Activity },
  { to: '/admin/gallery',       label: 'Gallery',        icon: Images },
  { to: '/admin/donations',     label: 'Donations',      icon: DollarSign },
  { to: '/admin/hero-slider',   label: 'Hero Slider',    icon: Presentation },
  { to: '/admin/contacts',      label: 'Contact Messages', icon: Mail },
  { to: '/admin/subadmins',     label: 'Sub-Admins',     icon: UserCog },
  { to: '/admin/profile',       label: 'Profile Settings', icon: Settings },
];

const AdminDashboard: React.FC = () => {
  const { member, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [birthdays, setBirthdays] = useState<{ first_name: string }[]>([]);
  const location  = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    get<{ birthdays: { first_name: string }[] }>('/members/birthdays')
      .then((r) => setBirthdays(r.birthdays || []))
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-purple-900 text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-purple-700">
          <div className="h-9 w-9 bg-amber-400 rounded-lg flex items-center justify-center shrink-0">
            <Church size={20} className="text-purple-900" />
          </div>
          <div>
            <div className="font-serif font-bold text-sm leading-tight">{CHURCH_NAME}</div>
            <div className="text-xs text-purple-300">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = n.end ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-white/15 text-white' : 'text-purple-200 hover:bg-white/10 hover:text-white'}`}>
                <n.icon size={18} /> {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-purple-700">
          {member && (
            <div className="flex items-center gap-3 mb-3">
              <img src={member.profile_photo_url || 'https://placehold.co/40'} className="h-9 w-9 rounded-full object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{member.first_name} {member.last_name}</div>
                <div className="text-xs text-purple-300 uppercase">{member.role}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-purple-300 hover:bg-white/10 hover:text-white">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"><Menu size={22} /></button>
          {birthdays.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 hidden sm:flex">
              <Cake size={15} /> 🎉 Birthday today: {birthdays.map((b) => b.first_name).join(', ')}
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-gray-600 hidden sm:block">Welcome, <strong>{member?.first_name}</strong></span>
            <img src={member?.profile_photo_url || 'https://placehold.co/40'} className="h-9 w-9 rounded-full object-cover" alt="" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="members/*" element={<AdminMembers />} />
            <Route path="choir/*" element={<AdminChoir />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
