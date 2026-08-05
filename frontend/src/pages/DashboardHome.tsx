import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get, DEFAULT_CHURCH_ID } from '@/lib/api';
import { Link } from 'react-router-dom';
import { 
  Calendar, Bell, Users, Music2, BookOpen, Heart, 
  Sparkles, Loader2, Clock, MapPin, TrendingUp, DollarSign 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DailyVerse {
  id: string;
  verse_text: string;
  reference: string;
  encouragement: string;
  date: string;
}

interface PrayerVerse {
  id: string;
  verse_text: string;
  reference: string;
  explanation: string;
  prayer_text: string;
  date: string;
}

interface Stats {
  totalMembers: number;
  upcomingEvents: number;
  unreadNotifications: number;
  recentAnnouncements: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

interface Activity {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  location?: string;
  category: string;
}

interface Rehearsal {
  id: string;
  title: string;
  rehearsal_date: string;
  start_time?: string;
  location?: string;
}

const DashboardHome: React.FC = () => {
  const { member } = useAuth();
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [prayerVerse, setPrayerVerse] = useState<PrayerVerse | null>(null);
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, upcomingEvents: 0, unreadNotifications: 0, recentAnnouncements: 0 });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [loading, setLoading] = useState(true);

  const isChoirMember = member?.role === 'choir_member' || member?.role === 'choir';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [verseRes, prayerRes, membersRes, notifRes, announcementsRes, activitiesRes] = await Promise.all([
          get<{ verse: DailyVerse }>(`/verses/daily?church_id=${DEFAULT_CHURCH_ID}`).catch(() => ({ verse: null })),
          get<{ verse: PrayerVerse }>(`/verses/prayer?church_id=${DEFAULT_CHURCH_ID}`).catch(() => ({ verse: null })),
          get<{ total: number }>('/members/stats').catch(() => ({ total: 0 })),
          get<{ notifications: any[] }>('/notifications').catch(() => ({ notifications: [] })),
          get<{ announcements: Announcement[] }>(`/announcements?church_id=${DEFAULT_CHURCH_ID}&limit=3`).catch(() => ({ announcements: [] })),
          get<{ activities: Activity[] }>(`/activities?church_id=${DEFAULT_CHURCH_ID}&limit=3`).catch(() => ({ activities: [] })),
        ]);

        setDailyVerse(verseRes.verse);
        setPrayerVerse(prayerRes.verse);
        
        const upcomingEvents = (activitiesRes.activities || []).filter(
          a => new Date(a.event_date) >= new Date()
        ).length;

        setStats({
          totalMembers: (membersRes as any).totalMembers || (membersRes as any).total || 0,
          upcomingEvents,
          unreadNotifications: (notifRes.notifications || []).filter((n: any) => !n.read_by?.includes(member?.id)).length,
          recentAnnouncements: (announcementsRes.announcements || []).length,
        });

        setAnnouncements(announcementsRes.announcements || []);
        setActivities((activitiesRes.activities || []).slice(0, 3));

        // Fetch rehearsals if choir member
        if (isChoirMember) {
          const rehearsalsRes = await get<{ rehearsals: Rehearsal[] }>('/choir/rehearsals').catch(() => ({ rehearsals: [] }));
          setRehearsals((rehearsalsRes.rehearsals || []).filter(r => new Date(r.rehearsal_date) >= new Date()).slice(0, 3));
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [member?.id, isChoirMember]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={48} className="animate-spin text-purple-600" />
      </div>
    );
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {member?.first_name}! 👋
            </h1>
            <p className="text-purple-100 text-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-purple-200 mt-1">Member ID: <span className="font-mono font-semibold">{member?.member_code}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <img 
              src={member?.profile_photo_url || 'https://placehold.co/100'} 
              alt={member?.first_name}
              className="w-20 h-20 rounded-full border-4 border-white/30 object-cover shadow-lg"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Members', value: stats.totalMembers, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
          { icon: Calendar, label: 'Upcoming Events', value: stats.upcomingEvents, color: 'from-green-500 to-green-600', textColor: 'text-green-600', bgColor: 'bg-green-50' },
          { icon: Bell, label: 'Unread Notifications', value: stats.unreadNotifications, color: 'from-amber-500 to-amber-600', textColor: 'text-amber-600', bgColor: 'bg-amber-50' },
          { icon: Sparkles, label: 'New Announcements', value: stats.recentAnnouncements, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-600', bgColor: 'bg-purple-50' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon size={28} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Verse of the Day */}
      {dailyVerse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg">
              <BookOpen size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                Verse of the Day
              </h2>
              <blockquote className="text-gray-700 italic text-lg leading-relaxed mb-3 border-l-4 border-amber-400 pl-4">
                "{dailyVerse.verse_text}"
              </blockquote>
              <p className="font-semibold text-amber-700 mb-3">— {dailyVerse.reference}</p>
              {dailyVerse.encouragement && (
                <div className="bg-white/60 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm font-medium text-gray-600 mb-1">Encouragement:</p>
                  <p className="text-gray-800">{dailyVerse.encouragement}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Prayer Verse */}
      {prayerVerse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
              <Heart size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Prayer Verse</h2>
              <blockquote className="text-gray-700 italic text-base leading-relaxed mb-2 border-l-4 border-purple-400 pl-4">
                "{prayerVerse.verse_text}"
              </blockquote>
              <p className="font-semibold text-purple-700 mb-3">— {prayerVerse.reference}</p>
              
              {prayerVerse.explanation && (
                <div className="bg-white/60 rounded-lg p-4 mb-3 border border-purple-200">
                  <p className="text-sm font-medium text-gray-600 mb-1">What this verse teaches:</p>
                  <p className="text-gray-800 text-sm">{prayerVerse.explanation}</p>
                </div>
              )}

              {prayerVerse.prayer_text && (
                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 border border-purple-300">
                  <p className="text-sm font-medium text-purple-700 mb-2">🙏 Suggested Prayer:</p>
                  <p className="text-gray-800 text-sm leading-relaxed italic">{prayerVerse.prayer_text}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={20} className="text-purple-600" />
              Recent Announcements
            </h2>
            <Link to="/dashboard/notifications" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{ann.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2">{ann.content}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize shrink-0 ${
                      ann.category === 'church' ? 'bg-purple-100 text-purple-700' :
                      ann.category === 'choir' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ann.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent announcements</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Events/Activities */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-green-600" />
              Upcoming Events
            </h2>
            <Link to="/activities" className="text-sm text-green-600 hover:text-green-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="p-4 bg-green-50 rounded-lg border border-green-200 hover:border-green-400 transition-colors">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{act.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(act.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {act.event_time && ` • ${act.event_time}`}
                    </span>
                    {act.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {act.location}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Choir Rehearsals (Choir Members Only) */}
      {isChoirMember && rehearsals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Music2 size={20} className="text-indigo-600" />
              Upcoming Choir Rehearsals
            </h2>
            <Link to="/dashboard/choir" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {rehearsals.map((reh) => (
              <div key={reh.id} className="p-4 bg-white rounded-lg border border-indigo-200">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{reh.title}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(reh.rehearsal_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {reh.start_time && ` • ${reh.start_time}`}
                  </span>
                  {reh.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {reh.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Membership Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">Your Membership</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="font-bold text-purple-700 capitalize">{member?.role?.replace('_', ' ')}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <p className="font-bold text-green-700 capitalize">{member?.approval_status}</p>
          </div>
          {isChoirMember && member?.voice_group && (
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Voice Group</p>
              <p className="font-bold text-indigo-700">{member.voice_group}</p>
            </div>
          )}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Member Since</p>
            <p className="font-bold text-blue-700">
              {member?.created_at ? new Date(member.created_at).getFullYear() : 'N/A'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
