import { User, CHURCH_NAME, API_BASE_URL } from './api';

function fmt(d?: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

// ── MEMBER PROFILE PRINT ──────────────────────────────────────
// Full profile sheet for records/archive
export async function printMemberProfile(m: User) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Please allow popups for this site to print profiles.'); return; }

  w.document.write('<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#6B46C1;font-size:16px"><p>⏳ Preparing profile…</p></body></html>');

  // Fetch church logo
  let logoUrl = '';
  try {
    const r = await fetch(`${API_BASE_URL}/cms/settings?group=branding`);
    const d = await r.json();
    logoUrl = d.settings?.site_logo_url || '';
  } catch { /* no logo */ }

  // Generate QR code URL for verification
  const verificationUrl = `${window.location.origin}/verify/${m.member_code || 'pending'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verificationUrl)}`;

  const photo = m.profile_photo_url || 'https://placehold.co/200x240?text=Photo';
  const roleLabel = (m.role || 'member').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const isChoir = m.role === 'choir_member' || m.role === 'choir';
  const fullName = `${m.first_name || ''} ${m.middle_name ? m.middle_name + ' ' : ''}${m.last_name || ''}`.trim();

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Member Profile – ${fullName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f3f4f6;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #5b21b6, #7c3aed);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .logo { width: 60px; height: 60px; margin: 0 auto 15px; border-radius: 10px; object-fit: contain; background: rgba(255,255,255,0.15); padding: 8px; }
    .logo-placeholder { width: 60px; height: 60px; margin: 0 auto 15px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 28px; }
    .header h1 { font-size: 18px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    .header .subtitle { font-size: 13px; opacity: 0.9; }
    .profile-section {
      padding: 30px;
      display: flex;
      gap: 30px;
      border-bottom: 2px solid #e5e7eb;
    }
    .profile-photo {
      width: 160px;
      height: 192px;
      object-fit: cover;
      border-radius: 12px;
      border: 4px solid #e9d5ff;
      flex-shrink: 0;
    }
    .profile-info { flex: 1; }
    .profile-name { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 5px; }
    .profile-code { font-family: 'Courier New', monospace; font-size: 16px; font-weight: 700; color: #7c3aed; letter-spacing: 2px; margin-bottom: 12px; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-role { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; }
    .badge-voice { background: #ede9fe; color: #5b21b6; }
    .badge-status { background: #d1fae5; color: #065f46; }
    .quick-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .quick-info-item { font-size: 12px; color: #6b7280; }
    .quick-info-item strong { color: #374151; font-weight: 600; }
    .details {
      padding: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section:last-child { margin-bottom: 0; }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #7c3aed;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 2px solid #e9d5ff;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .field-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px 20px;
    }
    .field-full {
      grid-column: span 2;
    }
    .field-label {
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 3px;
    }
    .field-value {
      font-size: 13px;
      color: #1f2937;
      font-weight: 500;
      line-height: 1.5;
    }
    .footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 20px 30px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
    .footer strong { color: #374151; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl
        ? `<img class="logo" src="${logoUrl}" alt="logo" />`
        : `<div class="logo-placeholder">✝</div>`}
      <h1>${CHURCH_NAME}</h1>
      <div class="subtitle">Member Profile Document</div>
    </div>

    <div class="profile-section">
      <img class="profile-photo" src="${photo}" alt="Photo" />
      <div class="profile-info">
        <div class="profile-name">${fullName}</div>
        <div class="profile-code">${m.member_code || 'PENDING'}</div>
        <div class="badges">
          <span class="badge badge-role">${roleLabel}</span>
          ${isChoir && (m.voice_group || m.voice_type) ? `<span class="badge badge-voice">🎵 ${m.voice_group || m.voice_type}</span>` : ''}
          <span class="badge badge-status">${(m.approval_status || 'Active').toUpperCase()}</span>
        </div>
        <div class="quick-info">
          <div class="quick-info-item"><strong>Gender:</strong> ${m.gender || '—'}</div>
          <div class="quick-info-item"><strong>DOB:</strong> ${fmt(m.date_of_birth)}</div>
          <div class="quick-info-item"><strong>Phone:</strong> ${m.phone || '—'}</div>
          <div class="quick-info-item"><strong>Email:</strong> ${m.email || '—'}</div>
          <div class="quick-info-item"><strong>Date Joined:</strong> ${fmt(m.date_joined)}</div>
          <div class="quick-info-item"><strong>Registered:</strong> ${fmt(m.created_at)}</div>
        </div>
      </div>
    </div>

    <div class="details">
      <div class="section">
        <div class="section-title">Contact Information</div>
        <div class="field-grid">
          <div>
            <div class="field-label">Phone Number</div>
            <div class="field-value">${m.phone || '—'}</div>
          </div>
          <div>
            <div class="field-label">WhatsApp Number</div>
            <div class="field-value">${m.whatsapp_number || '—'}</div>
          </div>
          <div class="field-full">
            <div class="field-label">Email Address</div>
            <div class="field-value">${m.email || '—'}</div>
          </div>
          <div class="field-full">
            <div class="field-label">Residential Address</div>
            <div class="field-value">${m.address || '—'}</div>
          </div>
          <div>
            <div class="field-label">City</div>
            <div class="field-value">${m.city || '—'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Personal Details</div>
        <div class="field-grid">
          <div>
            <div class="field-label">Gender</div>
            <div class="field-value">${m.gender || '—'}</div>
          </div>
          <div>
            <div class="field-label">Date of Birth</div>
            <div class="field-value">${fmt(m.date_of_birth)}</div>
          </div>
          <div>
            <div class="field-label">Marital Status</div>
            <div class="field-value">${m.marital_status || '—'}</div>
          </div>
          <div>
            <div class="field-label">Occupation</div>
            <div class="field-value">${m.occupation || '—'}</div>
          </div>
          <div>
            <div class="field-label">Baptism Status</div>
            <div class="field-value">${(m.baptism_status ?? (m as any).baptized) ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div class="field-label">Baptism Date</div>
            <div class="field-value">${fmt(m.baptism_date)}</div>
          </div>
          <div>
            <div class="field-label">Department</div>
            <div class="field-value">${m.department_name || m.department || '—'}</div>
          </div>
          <div>
            <div class="field-label">Membership Status</div>
            <div class="field-value">${m.membership_status || '—'}</div>
          </div>
          ${m.bio ? `
          <div class="field-full">
            <div class="field-label">Biography</div>
            <div class="field-value">${m.bio}</div>
          </div>` : ''}
        </div>
      </div>

      ${isChoir ? `
      <div class="section">
        <div class="section-title">Choir Information</div>
        <div class="field-grid">
          <div>
            <div class="field-label">Voice Group</div>
            <div class="field-value">${m.voice_group || m.voice_type || '—'}</div>
          </div>
          <div>
            <div class="field-label">Choir Role</div>
            <div class="field-value">${m.choir_role || '—'}</div>
          </div>
          <div>
            <div class="field-label">Experience Level</div>
            <div class="field-value">${m.experience_level || '—'}</div>
          </div>
          <div>
            <div class="field-label">Main Role</div>
            <div class="field-value">${m.main_role || '—'}</div>
          </div>
          <div class="field-full">
            <div class="field-label">Instruments</div>
            <div class="field-value">${(m.instruments || []).join(', ') || '—'}</div>
          </div>
          <div class="field-full">
            <div class="field-label">Choir Activities</div>
            <div class="field-value">${(m.choir_activities || []).join(', ') || '—'}</div>
          </div>
        </div>
      </div>` : ''}

      <div class="section">
        <div class="section-title">Emergency Contact</div>
        <div class="field-grid">
          <div>
            <div class="field-label">Name</div>
            <div class="field-value">${m.emergency_name || (m as any).emergency_contact_name || '—'}</div>
          </div>
          <div>
            <div class="field-label">Relationship</div>
            <div class="field-value">${m.emergency_relation || '—'}</div>
          </div>
          <div class="field-full">
            <div class="field-label">Phone Number</div>
            <div class="field-value">${m.emergency_phone || (m as any).emergency_contact_phone || '—'}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px;">
        <div style="flex: 1; text-align: left;">
          <strong>${CHURCH_NAME}</strong><br/>
          Member Profile Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
          This document is confidential and intended for church administrative use only.
        </div>
        <div style="text-align: center;">
          <img src="${qrCodeUrl}" alt="Verification QR" style="width: 100px; height: 100px; border: 2px solid #e9d5ff; border-radius: 8px;" />
          <div style="font-size: 9px; color: #9ca3af; margin-top: 4px;">Scan to Verify</div>
        </div>
      </div>
    </div>
  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 700);</script>
</body>
</html>`);
  w.document.close();
}

// ── ID CARD PRINT ─────────────────────────────────────────────
// Compact, professional ID card (front + back on one page)
export async function printIDCard(m: User) {
  // Open popup FIRST (synchronously) to avoid browser popup blockers
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Please allow popups for this site to print ID cards.'); return; }

  w.document.write('<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#6B46C1;font-size:16px"><p>⏳ Preparing ID card…</p></body></html>');

  // Fetch church logo
  let logoUrl = '';
  try {
    const r = await fetch(`${API_BASE_URL}/cms/settings?group=branding`);
    const d = await r.json();
    logoUrl = d.settings?.site_logo_url || '';
  } catch { /* no logo */ }

  // Generate QR code URL for verification
  const verificationUrl = `${window.location.origin}/verify/${m.member_code || 'pending'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  const photo    = m.profile_photo_url || 'https://placehold.co/160x180?text=Photo';
  const roleLabel = (m.role || 'member').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const isChoir  = m.role === 'choir_member' || m.role === 'choir';
  const fullName = `${m.first_name || ''} ${m.middle_name ? m.middle_name + ' ' : ''}${m.last_name || ''}`.trim();

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ID Card – ${fullName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f0f0f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 30px 20px;
      gap: 24px;
    }
    .page-title {
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    .cards-row {
      display: flex;
      gap: 32px;
      align-items: stretch;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* ── CARD BASE ── */
    .card {
      width: 340px;
      min-height: 480px;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      background: #fff;
      display: flex;
      flex-direction: column;
    }

    /* ── FRONT CARD ── */
    .front { background: #fff; }
    .front-header {
      background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #4f46e5 100%);
      padding: 18px 20px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .front-header-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: contain;
      background: rgba(255,255,255,0.15);
      padding: 4px;
      flex-shrink: 0;
    }
    .front-header-logo-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .front-header-text { flex: 1; }
    .front-church-name {
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }
    .front-card-type {
      color: rgba(255,255,255,0.75);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }
    .front-body {
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      flex: 1;
    }
    .front-photo {
      width: 90px;
      height: 108px;
      object-fit: cover;
      border-radius: 10px;
      border: 3px solid #e9d5ff;
      flex-shrink: 0;
    }
    .front-info { flex: 1; }
    .front-name {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      line-height: 1.3;
      margin-bottom: 4px;
    }
    .front-code {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: 700;
      color: #7c3aed;
      letter-spacing: 1.5px;
      margin-bottom: 8px;
    }
    .front-badge {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 10px;
    }
    .front-field { margin-bottom: 5px; }
    .front-field-label {
      font-size: 9px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .front-field-value {
      font-size: 11px;
      color: #374151;
      font-weight: 500;
    }
    .front-footer {
      background: linear-gradient(135deg, #5b21b6, #7c3aed);
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .front-footer-status {
      font-size: 9px;
      color: rgba(255,255,255,0.8);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .front-footer-status strong {
      color: #fbbf24;
      font-size: 10px;
    }
    .front-footer-valid {
      font-size: 9px;
      color: rgba(255,255,255,0.7);
      text-align: right;
    }

    /* ── BACK CARD ── */
    .back { background: #fff; display: flex; flex-direction: column; }
    .back-header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      padding: 14px 20px;
      text-align: center;
    }
    .back-header-title {
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .back-stripe {
      height: 6px;
      background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
    }
    .back-body { padding: 16px 20px; flex: 1; }
    .back-section-title {
      font-size: 9px;
      font-weight: 700;
      color: #7c3aed;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 1px solid #e9d5ff;
      padding-bottom: 4px;
      margin-bottom: 8px;
      margin-top: 12px;
    }
    .back-section-title:first-child { margin-top: 0; }
    .back-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      gap: 8px;
    }
    .back-field { flex: 1; }
    .back-field-label {
      font-size: 8px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .back-field-value {
      font-size: 10px;
      color: #1f2937;
      font-weight: 500;
      line-height: 1.4;
    }
    .back-choir-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ede9fe;
      color: #5b21b6;
      font-size: 9px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      margin-bottom: 8px;
    }
    .back-footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 10px 20px;
      text-align: center;
    }
    .back-footer-text {
      font-size: 8px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .back-footer-text strong { color: #6b7280; }

    @media print {
      body { background: white; padding: 10px; gap: 16px; }
      .page-title { display: none; }
      .cards-row { gap: 20px; }
      .card { box-shadow: 0 2px 8px rgba(0,0,0,0.12); break-inside: avoid; }
      /* Force both cards to the same height for double-sided printing */
      .cards-row { align-items: stretch; }
    }
  </style>
</head>
<body>
  <p class="page-title">${CHURCH_NAME} — Member ID Card</p>

  <div class="cards-row">

    <!-- ══ FRONT ══ -->
    <div class="card front">
      <div class="front-header">
        ${logoUrl
          ? `<img class="front-header-logo" src="${logoUrl}" alt="logo" />`
          : `<div class="front-header-logo-placeholder">✝</div>`}
        <div class="front-header-text">
          <div class="front-church-name">${CHURCH_NAME}</div>
          <div class="front-card-type">Official Member ID Card</div>
        </div>
      </div>

      <div class="front-body">
        <img class="front-photo" src="${photo}" alt="Photo" />
        <div class="front-info">
          <div class="front-name">${fullName}</div>
          <div class="front-code">${m.member_code || 'PENDING'}</div>
          <div class="front-badge">${roleLabel}</div>
          <div class="front-field">
            <div class="front-field-label">Gender</div>
            <div class="front-field-value">${m.gender || '—'}</div>
          </div>
          <div class="front-field">
            <div class="front-field-label">Date of Birth</div>
            <div class="front-field-value">${fmt(m.date_of_birth)}</div>
          </div>
          <div class="front-field">
            <div class="front-field-label">Phone</div>
            <div class="front-field-value">${m.phone || '—'}</div>
          </div>
          ${isChoir && (m.voice_group || m.voice_type) ? `
          <div class="front-field">
            <div class="front-field-label">Voice Group</div>
            <div class="front-field-value">${m.voice_group || m.voice_type}</div>
          </div>` : ''}
        </div>
      </div>

      <div class="front-footer">
        <div class="front-footer-status">
          Status: <strong>${(m.approval_status || 'Active').toUpperCase()}</strong>
        </div>
        <div class="front-footer-valid">
          Issued: ${fmt(m.approved_at || m.created_at)}<br/>
          ${m.date_joined ? `Joined: ${fmt(m.date_joined)}` : ''}
        </div>
      </div>
    </div>

    <!-- ══ BACK ══ -->
    <div class="card back">
      <div class="back-header">
        <div class="back-header-title">Member Information</div>
      </div>
      <div class="back-stripe"></div>

      <div class="back-body">

        ${isChoir ? `
        <div class="back-choir-badge">🎵 Choir Member — ${m.voice_group || m.voice_type || 'Voice'}</div>
        ` : ''}

        <div class="back-section-title">Contact Details</div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Email</div>
            <div class="back-field-value">${m.email || '—'}</div>
          </div>
        </div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Phone</div>
            <div class="back-field-value">${m.phone || '—'}</div>
          </div>
          <div class="back-field">
            <div class="back-field-label">WhatsApp</div>
            <div class="back-field-value">${m.whatsapp_number || '—'}</div>
          </div>
        </div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Address</div>
            <div class="back-field-value">${m.address || '—'}</div>
          </div>
          <div class="back-field">
            <div class="back-field-label">City</div>
            <div class="back-field-value">${m.city || '—'}</div>
          </div>
        </div>

        <div class="back-section-title">Personal Details</div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Marital Status</div>
            <div class="back-field-value">${m.marital_status || '—'}</div>
          </div>
          <div class="back-field">
            <div class="back-field-label">Occupation</div>
            <div class="back-field-value">${m.occupation || '—'}</div>
          </div>
        </div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Baptized</div>
            <div class="back-field-value">${(m.baptism_status ?? (m as any).baptized) ? 'Yes' : 'No'}</div>
          </div>
          <div class="back-field">
            <div class="back-field-label">Department</div>
            <div class="back-field-value">${m.department_name || m.department || '—'}</div>
          </div>
        </div>

        ${isChoir ? `
        <div class="back-section-title">Choir Details</div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Choir Role</div>
            <div class="back-field-value">${m.choir_role || '—'}</div>
          </div>
          <div class="back-field">
            <div class="back-field-label">Experience</div>
            <div class="back-field-value">${m.experience_level || '—'}</div>
          </div>
        </div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Main Role</div>
            <div class="back-field-value">${m.main_role || '—'}</div>
          </div>
          <div class="back-field">
            <div class="back-field-label">Instruments</div>
            <div class="back-field-value">${(m.instruments || []).join(', ') || '—'}</div>
          </div>
        </div>` : ''}

        <div class="back-section-title">Emergency Contact</div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Name</div>
            <div class="back-field-value">${m.emergency_name || (m as any).emergency_contact_name || '—'}</div>
          </div>
          <div class="back-field">
            <div class="back-field-label">Relationship</div>
            <div class="back-field-value">${m.emergency_relation || '—'}</div>
          </div>
        </div>
        <div class="back-row">
          <div class="back-field">
            <div class="back-field-label">Emergency Phone</div>
            <div class="back-field-value">${m.emergency_phone || (m as any).emergency_contact_phone || '—'}</div>
          </div>
        </div>

      </div>

      <div class="back-footer">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
          <div style="flex: 1;">
            <div class="back-footer-text">
              <strong>${CHURCH_NAME}</strong><br/>
              This card is the property of ${CHURCH_NAME}.<br/>
              If found, please return to the church office.
            </div>
          </div>
          <div style="text-align: center;">
            <img src="${qrCodeUrl}" alt="Verify" style="width: 80px; height: 80px; border: 2px solid #e9d5ff; border-radius: 6px;" />
            <div style="font-size: 7px; color: #9ca3af; margin-top: 2px;">Scan to Verify</div>
          </div>
        </div>
        <div style="font-size: 7px; color: #9ca3af; text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>

  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 700);</script>
</body>
</html>`);
  w.document.close();
}

// ── CSV EXPORT ────────────────────────────────────────────────
export function exportCSV(members: User[]) {
  const headers = ['Code','First Name','Middle Name','Last Name','Gender','DOB','Phone','WhatsApp','Email',
    'Address','City','Occupation','Marital Status','Role','Voice Group','Choir Role','Experience',
    'Instruments','Choir Activities','Department','Baptized','Emergency Name','Emergency Phone',
    'Emergency Relation','Bio','Status','Date Joined','Registered'];
  const rows = members.map((m) => [
    m.member_code, m.first_name, m.middle_name || '', m.last_name, m.gender || '', m.date_of_birth || '',
    m.phone || '', m.whatsapp_number || '', m.email, m.address || '', m.city || '',
    m.occupation || '', m.marital_status || '', m.role,
    m.voice_group || m.voice_type || '', m.choir_role || '', m.experience_level || '',
    (m.instruments || []).join(';'), (m.choir_activities || []).join(';'),
    m.department_name || m.department || '',
    (m.baptism_status ?? (m as any).baptized) ? 'Yes' : 'No',
    m.emergency_name || (m as any).emergency_contact_name || '',
    m.emergency_phone || (m as any).emergency_contact_phone || '',
    m.emergency_relation || '', m.bio || '',
    m.approval_status || m.status || '',
    m.date_joined || '', m.created_at || '',
  ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── MEMBER LIST PRINT ─────────────────────────────────────────
export function printMemberList(members: User[]) {
  const w = window.open('', '_blank', 'width=1100,height=800');
  if (!w) return;
  const rows = members.map((m) => `<tr>
    <td><img src="${m.profile_photo_url || 'https://placehold.co/40?text=?'}" style="width:36px;height:36px;border-radius:6px;object-fit:cover"></td>
    <td>${m.member_code || ''}</td>
    <td>${m.first_name} ${m.last_name}</td>
    <td>${m.gender || ''}</td>
    <td>${m.phone || ''}</td>
    <td>${m.email || ''}</td>
    <td style="text-transform:capitalize">${(m.role || '').replace(/_/g, ' ')}</td>
    <td>${m.voice_group || m.voice_type || ''}</td>
    <td>${m.approval_status || m.status || ''}</td>
  </tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>Member Directory</title><style>
    *{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box}
    body{padding:30px;color:#1f2937}
    h1{color:#6B46C1;text-align:center;margin-bottom:4px}
    .sub{text-align:center;color:#6b7280;font-size:13px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#6B46C1;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
    td{padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
    tr:nth-child(even){background:#f9fafb}
    tr:hover{background:#f3f4f6}
    .footer{margin-top:20px;text-align:center;font-size:11px;color:#9ca3af}
  </style></head><body>
  <h1>${CHURCH_NAME}</h1>
  <p class="sub">Member Directory — ${members.length} members — Generated ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
  <table>
    <thead><tr>
      <th>Photo</th><th>Code</th><th>Name</th><th>Gender</th>
      <th>Phone</th><th>Email</th><th>Role</th><th>Voice</th><th>Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">${CHURCH_NAME} Management System · Confidential</div>
  <script>window.onload=()=>setTimeout(()=>window.print(),400);</script>
  </body></html>`);
  w.document.close();
}
