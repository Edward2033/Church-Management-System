import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { get, CHURCH_NAME, DEFAULT_CHURCH_ID } from '@/lib/api';
import {
  Church, LayoutDashboard, Users, Music2, Megaphone, Activity,
  Images, DollarSign, Bell, LogOut, Menu, X, Cake, BarChart2,
  Settings, Send, UserCog, Mail, Presentation, Shield, FileText, Home, BookOpen, Calendar, Award,
} from 'lucide-react';
import AdminOverview      from './admin/AdminOverview';
import AdminMembers       from './admin/AdminMembers';
import AdminChoir         from './admin/AdminChoir';
import AdminAnnouncements from './admin/AdminAnnouncements';
import AdminActivities    from './admin/AdminActivities';
import AdminGallery       from './admin/AdminGallery';
import AdminDonations     from './admin/AdminDonations';
import AdminNotifications from './admin/AdminNotifications';
import AdminHeroSlider    from './admin/AdminHeroSlider';
import AdminContacts      from './admin/AdminContacts';
import AdminSubAdmins     from './admin/AdminSubAdmins';
import AdminProfile       from './admin/AdminProfile';
import AdminLeadership    from './admin/AdminLeadership';
import AdminCMS           from './admin/AdminCMS';
import AdminHomePage      from './admin/AdminHomePage';
import AdminVerses        from './admin/AdminVerses';
import AdminAttendance    from './admin/AdminAttendance';
import AdminRecognition   from './admin/AdminRecognition';

const NAV = [
  { to: '/admin',               label: 'Overview',         icon: LayoutDashboard, end: true },
  { to: '/admin/members',       label: 'Members',          icon: Users },
  { to: '/admin/choir',         label: 'Choir',            icon: Music2 },
  { to: '/admin/announcements', label: 'Announcements',    icon: Megaphone },
  { to: '/admin/activities',    label: 'Activities',       icon: Activity },
  { to: '/admin/attendance',    label: 'Attendance',       icon: Calendar },
  { to: '/admin/recognition',   label: 'Recognition',      icon: Award },
  { to: '/admin/gallery',       label: 'Gallery',          icon: Images },
  { to: '/admin/leadership',    label: 'Leadership',       icon: Shield },
  { to: '/admin/verses',        label: 'Daily Verses',     icon: BookOpen },
  { to: '/admin/cms',           label: 'CMS Settings',     icon: FileText },
  { to: '/admin/donations',     label: 'Donations',        icon: DollarSign },
  { to: '/admin/hero-slider',   label: 'Hero Slider',      icon: Presentation },
  { to: '/admin/homepage',      label: 'Homepage',         icon: Home },
  { to: '/admin/contacts',      label: 'Contact Messages', icon: Mail },
  { to: '/admin/subadmins',     label: 'Sub-Admins',       icon: UserCog },
  { to: '/admin/profile',       label: 'Profile Settings', icon: Settings },
];

const AdminDashboard: React.FC = () => {
  const { member, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [birthdays, setBirthdays] = useState<{ first_name: string }[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [churchName, setChurchName] = useState(CHURCH_NAME);
  const location  = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    get<{ birthdays: { first_name: string }[] }>('/members/birthdays')
      .then((r) => setBirthdays(r.birthdays || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Fetch logo and church name from CMS settings
    get<{ settings: Record<string, string> }>(`/cms/settings?church_id=${DEFAULT_CHURCH_ID}&group=branding`)
      .then((data) => {
        if (data.settings.site_logo_url) setLogo(data.settings.site_logo_url);
        if (data.settings.site_church_name) setChurchName(data.settings.site_church_name);
      })
      .catch(() => {}); // Silently fail, use defaults
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-purple-900 text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-purple-700">
          {logo ? (
            <img src={logo} alt={churchName} className="h-12 w-auto object-contain max-w-[160px]" />
          ) : (
            <>
              <div className="h-9 w-9 bg-amber-400 rounded-lg flex items-center justify-center shrink-0">
                <Church size={20} className="text-purple-900" />
              </div>
              <div>
                <div className="font-serif font-bold text-sm leading-tight">{churchName}</div>
                <div className="text-xs text-purple-300">Admin Panel</div>
              </div>
            </>
          )}
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
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="recognition" element={<AdminRecognition />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="leadership" element={<AdminLeadership />} />
            <Route path="verses" element={<AdminVerses />} />
            <Route path="cms" element={<AdminCMS />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="hero-slider" element={<AdminHeroSlider />} />
            <Route path="homepage" element={<AdminHomePage />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="subadmins" element={<AdminSubAdmins />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
