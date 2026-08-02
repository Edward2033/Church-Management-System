// ─────────────────────────────────────────────────────────────
//  API client + full type definitions
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || '/api';

export const CHURCH_NAME       = import.meta.env.VITE_CHURCH_NAME       || 'LUS4G Church';
export const DEFAULT_CHURCH_ID = import.meta.env.VITE_DEFAULT_CHURCH_ID || '00000000-0000-0000-0000-000000000001';

function getToken() { return localStorage.getItem('cms_token'); }

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `HTTP ${res.status}`);
  return data as T;
}

export const get  = <T>(path: string)                   => api<T>(path);
export const post = <T>(path: string, body: unknown)    => api<T>(path, { method: 'POST',   body: JSON.stringify(body) });
export const put  = <T>(path: string, body: unknown)    => api<T>(path, { method: 'PUT',    body: JSON.stringify(body) });
export const patch= <T>(path: string, body: unknown)    => api<T>(path, { method: 'PATCH',  body: JSON.stringify(body) });
export const del  = <T>(path: string)                   => api<T>(path, { method: 'DELETE' });

// ─────────────────────────────────────────────────────────────
//  Core types (aligned with database/schema.sql)
// ─────────────────────────────────────────────────────────────

export type UserRole =
  | 'superadmin' | 'admin' | 'pastor' | 'elder' | 'deacon'
  | 'leader' | 'choir_member' | 'choir' | 'member' | 'visitor';

export interface User {
  id: string;
  church_id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  password_set: boolean;
  last_login?: string;
  created_at: string;
  // joined from members
  member_id?: string;
  member_code?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  profile_photo_url?: string;
  approval_status?: string;
  membership_status?: string;
  member_church_id?: string;
  phone?: string;
  whatsapp_number?: string;
  address?: string;
  city?: string;
  gender?: string;
  date_of_birth?: string;
  occupation?: string;
  marital_status?: string;
  baptism_status?: boolean;
  baptism_date?: string;
  date_joined?: string;
  department_id?: string;
  department_name?: string;
  emergency_name?: string;
  emergency_phone?: string;
  emergency_relation?: string;
  bio?: string;
  // choir fields (joined)
  voice_group?: string;
  voice_type?: string;
  choir_role?: string;
  experience_level?: string;
  instruments?: string[];
  choir_activities?: string[];
  choir_active?: boolean;
  main_role?: string;
  // legacy aliases
  status?: string;
  baptized?: boolean;
  department?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

// Member is a full alias of User — both types are interchangeable throughout the app
export type Member = User;

export interface ChoirMember {
  id: string;
  member_id: string;
  church_id: string;
  choir_role: string;
  voice_group?: string;
  experience_level?: string;
  instruments: string[];
  choir_activities: string[];
  main_role?: string;
  join_date?: string;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  notes?: string;
  created_at: string;
  // joined
  first_name?: string;
  last_name?: string;
  member_code?: string;
  profile_photo_url?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
}

export interface Department {
  id: string;
  church_id: string;
  name: string;
  description?: string;
  leader_id?: string;
  leader_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  church_id: string;
  title: string;
  description?: string;
  category: string;
  image_url?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  audience: string;
  capacity?: number;
  requires_registration: boolean;
  is_active: boolean;
  created_at: string;
}

// Activity maps to the events table (legacy name kept for existing pages)
export interface Activity extends Event {}

export interface Attendance {
  id: string;
  church_id: string;
  event_id?: string;
  member_id: string;
  date: string;
  type: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  check_in_method: string;
  notes?: string;
  created_at: string;
  // joined
  first_name?: string;
  last_name?: string;
  member_code?: string;
}

export interface Announcement {
  id: string;
  church_id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  is_active: boolean;
  pinned: boolean;
  audience: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  published_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  church_id: string;
  title?: string;
  image_url: string;
  category: string;
  caption?: string;
  sort_order: number;
  uploader_name?: string;
  created_at: string;
}

export interface Sermon {
  id: string;
  church_id: string;
  title: string;
  speaker?: string;
  description?: string;
  scripture?: string;
  audio_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  sermon_date?: string;
  duration_minutes?: number;
  series?: string;
  tags: string[];
  is_published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  church_id: string;
  member_id?: string;
  author_name?: string;
  content: string;
  photo_url?: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface PrayerRequest {
  id: string;
  church_id: string;
  member_id?: string;
  subject?: string;
  request: string;
  is_anonymous: boolean;
  is_answered: boolean;
  is_public: boolean;
  prayed_count: number;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

export interface Notification {
  id: string;
  church_id: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  sender_id?: string;
  read_by: string[];
  is_active: boolean;
  created_at: string;
}

// ── Finance ──────────────────────────────────────────────────

export interface FinanceTransaction {
  id: string;
  church_id: string;
  category_id?: string;
  category_name?: string;
  member_id?: string;
  member_name?: string;
  donor_name?: string;
  donor_email?: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  sub_type?: string;
  payment_method: string;
  payment_ref?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_date: string;
  description?: string;
  receipt_number?: string;
  created_at: string;
}

export interface FinanceCategory {
  id: string;
  church_id: string;
  name: string;
  type: 'income' | 'expense';
  description?: string;
  is_active: boolean;
}

export interface FinanceSummary {
  income: { total: number; count: number };
  expense: { total: number; count: number };
  balance: number;
  pending: number;
}

// Donation: legacy type for AdminDonations → maps to finance_transactions
export interface Donation {
  id: string;
  church_id: string;
  member_id?: string;
  member_name?: string;
  donor_name?: string;
  donor_email?: string;
  amount: number;
  currency: string;
  type: string;
  sub_type?: string;
  payment_method: string;
  payment_ref?: string;
  payment_status: string;
  transaction_date: string;
  donated_at?: string; // alias — may come from backend AS donated_at
  description?: string;
  note?: string;      // alias for description
  receipt_number?: string;
  category_name?: string;
  created_at: string;
}

// ── Documents ────────────────────────────────────────────────

export interface Document {
  id: string;
  church_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  category: string;
  version: string;
  is_public: boolean;
  uploaded_by?: string;
  created_at: string;
}

// ── Choir ────────────────────────────────────────────────────

export interface Rehearsal {
  id: string;
  church_id: string;
  title: string;
  description?: string;
  rehearsal_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface MusicTrack {
  id: string;
  church_id: string;
  title: string;
  artist?: string;
  genre?: string;
  key_note?: string;
  bpm?: number;
  file_url?: string;
  sheet_url?: string;
  lyrics?: string;
  duration_seconds?: number;
  tags: string[];
  created_at: string;
}

// ── CMS ──────────────────────────────────────────────────────

export interface CmsPage {
  id: string;
  church_id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  is_published: boolean;
  updated_at: string;
}

export interface CmsHeroSlide {
  id: string;
  church_id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  cta_label?: string;
  cta_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CmsSettings {
  [key: string]: string | boolean | number;
}

// ── Leadership ───────────────────────────────────────────────

export interface Leader {
  id: string;
  church_id: string;
  name: string;
  title: string;
  bio?: string;
  photo_url?: string;
  email?: string;
  phone?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ── Reports ──────────────────────────────────────────────────

export interface OverviewStats {
  members: {
    total: number; pending: number; male: number; female: number;
    birthdaysToday: number; newThisMonth: number;
  };
  finance: {
    totalIncome: number; totalExpense: number; balance: number;
    pendingAmount: number; incomeCount: number; expenseCount: number; period: string;
  };
  attendance: {
    totalCheckedIn: number; present: number; absent: number; late: number;
    lastServiceDate?: string;
  };
  choir: {
    total: number; active: number; pending: number;
    byVoice: { soprano: number; alto: number; tenor: number; bass: number };
  };
}

export interface MemberStats {
  totalMembers: number;
  choirMembers: number;
  pending: number;
  birthdaysToday: number;
  departmentsActive: number;
  // aliases from /members/stats
  total?: number;
  choir?: number;
}

// ─────────────────────────────────────────────────────────────
//  Helper: role checks
// ─────────────────────────────────────────────────────────────

export const ADMIN_ROLES: UserRole[] = ['superadmin', 'admin'];
export const LEADER_ROLES: UserRole[] = ['superadmin', 'admin', 'pastor', 'elder', 'deacon', 'leader'];
export const CHOIR_ROLES: UserRole[] = ['choir_member', 'choir', ...LEADER_ROLES];

export const isAdmin  = (role?: UserRole) => !!role && ADMIN_ROLES.includes(role);
export const isLeader = (role?: UserRole) => !!role && LEADER_ROLES.includes(role);
export const isChoir  = (role?: UserRole) => !!role && CHOIR_ROLES.includes(role);

// ─────────────────────────────────────────────────────────────
//  Formatting helpers
// ─────────────────────────────────────────────────────────────

export function fmtDate(d?: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return d; }
}

export function fmtCurrency(amount: number, currency = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}

export function fmtNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}
