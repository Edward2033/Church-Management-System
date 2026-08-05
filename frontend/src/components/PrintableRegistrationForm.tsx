import React, { forwardRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, get, DEFAULT_CHURCH_ID, CHURCH_NAME } from '@/lib/api';

interface Props { member: User; verificationUrl: string; }
interface Leader { id: string; name: string; title: string; }

const Field: React.FC<{ label: string; value?: string | null; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={wide ? 'col-span-2' : ''} style={{ marginBottom: '12px' }}>
    <div style={{ fontSize: '9px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
      {label}
    </div>
    <div style={{ fontSize: '12px', color: '#1f2937', fontWeight: 500, borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', minHeight: '20px' }}>
      {value || '—'}
    </div>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = '#5b21b6' }) => (
  <div style={{
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px',
    color: '#fff', background: color, padding: '6px 14px', borderRadius: '4px',
    marginBottom: '14px', marginTop: '20px',
  }}>
    {children}
  </div>
);

const PrintableRegistrationForm = forwardRef<HTMLDivElement, Props>(({ member: m, verificationUrl }, ref) => {
  const [pastor,        setPastor]        = useState<Leader | null>(null);
  const [choirDirector, setChoirDirector] = useState<Leader | null>(null);
  const [logo,          setLogo]          = useState<string | null>(null);
  const isChoir = m.role === 'choir_member' || m.role === 'choir';

  useEffect(() => {
    get<{ settings: Record<string, string> }>(`/cms/settings?church_id=${DEFAULT_CHURCH_ID}&group=branding`)
      .then((d) => { if (d.settings?.site_logo_url) setLogo(d.settings.site_logo_url); })
      .catch(() => {});

    const API = import.meta.env.VITE_API_URL || '/api';
    fetch(`${API}/leadership`)
      .then((r) => r.json())
      .then(({ leadership = [] }: { leadership: Leader[] }) => {
        setPastor(leadership.find((l) => /pastor|overseer|bishop/i.test(l.title)) || null);
        setChoirDirector(leadership.find((l) => /choir\s*director|music\s*director/i.test(l.title)) || null);
      })
      .catch(() => {});
  }, []);

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const baptized = (m.baptism_status ?? (m as any).baptized);

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', background: '#fff', color: '#1f2937', maxWidth: '800px', margin: '0 auto', padding: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '4px solid #7c3aed', paddingBottom: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {logo
            ? <img src={logo} alt="logo" style={{ height: '72px', width: 'auto', objectFit: 'contain', maxWidth: '160px' }} />
            : <img src="/church-logo.png" alt="logo" style={{ height: '72px', width: '72px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          }
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#5b21b6', lineHeight: 1.2 }}>{CHURCH_NAME}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              {isChoir ? 'Choir Member Registration Form' : 'Member Registration Form'}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Official Church Document — Confidential</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#6b7280' }}>
          <div style={{ marginBottom: '4px' }}><strong>Form No:</strong> {m.member_code || 'PENDING'}</div>
          <div style={{ marginBottom: '4px' }}><strong>Registered:</strong> {fmt(m.created_at)}</div>
          {m.approved_at && <div style={{ marginBottom: '4px' }}><strong>Approved:</strong> {fmt(m.approved_at)}</div>}
          <div>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
              background: m.approval_status === 'approved' ? '#dcfce7' : m.approval_status === 'pending' ? '#fef3c7' : '#fee2e2',
              color: m.approval_status === 'approved' ? '#166534' : m.approval_status === 'pending' ? '#92400e' : '#991b1b',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {m.approval_status || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* ── PHOTO + IDENTITY ── */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}>
        <div style={{ flexShrink: 0 }}>
          <img
            src={m.profile_photo_url || 'https://placehold.co/160x200?text=No+Photo'}
            alt="Profile"
            style={{ width: '150px', height: '185px', objectFit: 'cover', borderRadius: '10px', border: '3px solid #e9d5ff' }}
          />
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#7c3aed', letterSpacing: '1px' }}>
              {m.member_code || 'PENDING'}
            </div>
            <div style={{
              display: 'inline-block', marginTop: '4px', background: '#7c3aed', color: '#fff',
              fontSize: '9px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}>
              {(m.role || 'member').replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <SectionTitle>Personal Information</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <Field label="First Name"    value={m.first_name} />
            <Field label="Middle Name"   value={m.middle_name} />
            <Field label="Last Name"     value={m.last_name} />
            <Field label="Gender"        value={m.gender} />
            <Field label="Date of Birth" value={fmt(m.date_of_birth)} />
            <Field label="Marital Status" value={m.marital_status} />
            <Field label="Occupation"    value={m.occupation} />
            <Field label="Baptized"      value={baptized === true ? 'Yes' : baptized === false ? 'No' : '—'} />
          </div>
        </div>
      </div>

      {/* ── CONTACT INFORMATION ── */}
      <SectionTitle>Contact Information</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Email Address"  value={m.email} />
        <Field label="Phone Number"   value={m.phone} />
        <Field label="WhatsApp Number" value={m.whatsapp_number} />
        <Field label="City / Region"  value={m.city} />
        <Field label="Home Address"   value={m.address} wide />
      </div>

      {/* ── CHURCH MEMBERSHIP ── */}
      <SectionTitle>Church Membership</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Membership Status" value={m.membership_status} />
        <Field label="Department"        value={m.department_name || m.department} />
        <Field label="Date Joined"       value={fmt(m.date_joined)} />
        <Field label="Baptism Date"      value={fmt((m as any).baptism_date)} />
      </div>

      {/* ── CHOIR INFORMATION (choir only) ── */}
      {isChoir && (
        <>
          <SectionTitle color="#4f46e5">Choir Information</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <Field label="Voice Group"      value={m.voice_group || m.voice_type} />
            <Field label="Choir Role"       value={m.choir_role} />
            <Field label="Main Role"        value={m.main_role} />
            <Field label="Experience Level" value={m.experience_level} />
            <Field label="Instruments"      value={(m.instruments || []).join(', ') || undefined} />
            <Field label="Choir Activities" value={(m.choir_activities || []).join(', ') || undefined} />
          </div>
        </>
      )}

      {/* ── EMERGENCY CONTACT ── */}
      <SectionTitle color="#dc2626">Emergency Contact</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>
        <Field label="Contact Name"     value={m.emergency_name || (m as any).emergency_contact_name} />
        <Field label="Contact Phone"    value={m.emergency_phone || (m as any).emergency_contact_phone} />
        <Field label="Relationship"     value={m.emergency_relation} />
      </div>

      {/* ── BIO ── */}
      {m.bio && (
        <>
          <SectionTitle>Biography / Additional Information</SectionTitle>
          <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.7, borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
            {m.bio}
          </div>
        </>
      )}

      {/* ── QR CODE + ACCOUNT STATUS ── */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '24px', marginBottom: '24px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Verification QR Code
          </div>
          <div style={{ border: '3px solid #e9d5ff', borderRadius: '10px', padding: '10px', display: 'inline-block', background: '#fff' }}>
            <QRCodeSVG value={verificationUrl} size={110} level="H" includeMargin />
          </div>
          <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '6px', maxWidth: '140px', wordBreak: 'break-all' }}>
            {verificationUrl}
          </div>
        </div>

        <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Account & Membership Record
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            {[
              ['Member Code',       m.member_code || 'Pending'],
              ['Role',              (m.role || '').replace(/_/g, ' ')],
              ['Approval Status',   m.approval_status || 'Pending'],
              ['Password Set',      (m as any).password_set ? 'Yes' : 'No'],
              ['Account Active',    (m as any).is_active !== false ? 'Yes' : 'No'],
              ['Last Login',        m.last_login ? new Date(m.last_login).toLocaleDateString() : 'Never'],
              ['Registered',        fmt(m.created_at)],
              ['Approved',          m.approved_at ? fmt(m.approved_at) : 'Pending'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: '9px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
                <div style={{ fontWeight: 600, color: '#1f2937', textTransform: 'capitalize' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SIGNATURES ── */}
      <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          Official Approval Signatures
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isChoir ? '1fr 1fr 1fr' : '1fr 1fr', gap: '24px' }}>

          {/* Member signature */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Member Signature</div>
            <div style={{ height: '50px', borderBottom: '2px solid #374151' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
              <span>{m.first_name} {m.last_name}</span>
              <span>Date: ___________</span>
            </div>
          </div>

          {/* Pastor signature */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>
              Pastor / Overseer Approval
            </div>
            {pastor && (
              <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '4px' }}>{pastor.name} — {pastor.title}</div>
            )}
            <div style={{ height: '50px', borderBottom: '2px solid #374151' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
              <span>{pastor ? pastor.name : 'Pastor / Overseer'}</span>
              <span>Date: ___________</span>
            </div>
          </div>

          {/* Choir Director signature (choir only) */}
          {isChoir && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>
                Choir Director Approval
              </div>
              {choirDirector && (
                <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '4px' }}>{choirDirector.name} — {choirDirector.title}</div>
              )}
              <div style={{ height: '50px', borderBottom: '2px solid #374151' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
                <span>{choirDirector ? choirDirector.name : 'Choir Director'}</span>
                <span>Date: ___________</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
          <strong style={{ color: '#6b7280' }}>{CHURCH_NAME}</strong> — Official Registration Document<br />
          This document is confidential and the property of {CHURCH_NAME}.<br />
          Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

    </div>
  );
});

PrintableRegistrationForm.displayName = 'PrintableRegistrationForm';
export default PrintableRegistrationForm;
