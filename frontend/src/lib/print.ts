import { User, CHURCH_NAME } from './api';

function fmt(d?: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return d; }
}

export function printMember(m: User) {
  const w = window.open('', '_blank', 'width=850,height=1100');
  if (!w) return;
  const photo = m.profile_photo_url || 'https://placehold.co/200x200?text=No+Photo';
  const choirRows = (m.role === 'choir_member' || m.role === 'choir') ? `
    <tr><td class="lbl">Voice Group</td><td>${m.voice_group || m.voice_type || '—'}</td></tr>
    <tr><td class="lbl">Main Role</td><td>${m.main_role || '—'}</td></tr>
    <tr><td class="lbl">Experience</td><td>${m.experience_level || '—'}</td></tr>
    <tr><td class="lbl">Instruments</td><td>${(m.instruments || []).join(', ') || '—'}</td></tr>
    <tr><td class="lbl">Activities</td><td>${(m.choir_activities || []).join(', ') || '—'}</td></tr>` : '';

  w.document.write(`<!doctype html><html><head><title>${m.member_code} – Profile</title>
  <style>
    *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}
    body{margin:0;padding:40px;color:#1f2937}
    .header{text-align:center;border-bottom:4px solid #6B46C1;padding-bottom:16px;margin-bottom:24px}
    .header h1{margin:0;color:#6B46C1;font-size:26px}
    .header p{margin:4px 0 0;color:#6b7280;font-size:12px}
    .top{display:flex;gap:24px;align-items:flex-start;margin-bottom:24px}
    .photo{width:160px;height:160px;border-radius:12px;object-fit:cover;border:3px solid #F59E0B;flex-shrink:0}
    .code{font-size:28px;font-weight:700;color:#6B46C1;letter-spacing:2px}
    .name{font-size:20px;font-weight:600;margin-top:4px}
    .badge{display:inline-block;margin-top:8px;background:#6B46C1;color:#fff;padding:4px 14px;border-radius:999px;font-size:11px;text-transform:uppercase}
    table{width:100%;border-collapse:collapse}
    td{padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:14px}
    .lbl{font-weight:600;color:#6b7280;width:38%}
    .section{margin-top:20px;font-weight:700;font-size:13px;text-transform:uppercase;color:#6B46C1;letter-spacing:1px;padding:6px 0;border-bottom:2px solid #e5e7eb}
    .footer{margin-top:36px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb;padding-top:12px}
    @media print{body{padding:20px}}
  </style></head><body>
  <div class="header"><h1>${CHURCH_NAME}</h1><p>Official Member Profile Record</p></div>
  <div class="top">
    <img class="photo" src="${photo}" />
    <div>
      <div class="code">${m.member_code || '—'}</div>
      <div class="name">${m.first_name} ${m.last_name}</div>
      <span class="badge">${m.role}</span>
      <div style="margin-top:8px;color:#6b7280;font-size:13px">Status: <strong>${m.approval_status || m.status || '—'}</strong></div>
    </div>
  </div>
  <div class="section">Personal Information</div>
  <table>
    <tr><td class="lbl">Gender</td><td>${m.gender || '—'}</td></tr>
    <tr><td class="lbl">Date of Birth</td><td>${fmt(m.date_of_birth)}</td></tr>
  </table>
  <div class="section">Contact Information</div>
  <table>
    <tr><td class="lbl">Phone</td><td>${m.phone || '—'}</td></tr>
    <tr><td class="lbl">WhatsApp</td><td>${m.whatsapp_number || '—'}</td></tr>
    <tr><td class="lbl">Email</td><td>${m.email}</td></tr>
    <tr><td class="lbl">Address</td><td>${m.address || '—'}</td></tr>
  </table>
  <div class="section">Church Information</div>
  <table>
    <tr><td class="lbl">Department</td><td>${m.department_name || m.department || '—'}</td></tr>
    <tr><td class="lbl">Baptized</td><td>${(m.baptism_status ?? m.baptized) ? 'Yes' : 'No'}</td></tr>
    ${choirRows}
  </table>
  <div class="section">Emergency Contact</div>
  <table>
    <tr><td class="lbl">Name</td><td>${m.emergency_name || m.emergency_contact_name || '—'}</td></tr>
    <tr><td class="lbl">Phone</td><td>${m.emergency_phone || m.emergency_contact_phone || '—'}</td></tr>
  </table>
  ${m.bio ? `<div class="section">Bio</div><p style="padding:10px 14px;font-size:14px">${m.bio}</p>` : ''}
  <div class="footer">Generated on ${new Date().toLocaleString()} · ${CHURCH_NAME} Management System</div>
  <script>window.onload=()=>setTimeout(()=>window.print(),400);</script>
  </body></html>`);
  w.document.close();
}

export function exportCSV(members: User[]) {
  const headers = ['Code','First Name','Last Name','Gender','DOB','Phone','WhatsApp','Email','Address','Role',
    'Voice Type','Department','Baptized','Main Role','Experience','Instruments','Choir Activities',
    'Emergency Name','Emergency Phone','Status'];
  const rows = members.map((m) => [
    m.member_code, m.first_name, m.last_name, m.gender || '', m.date_of_birth || '',
    m.phone || '', m.whatsapp_number || '', m.email, m.address || '', m.role,
    m.voice_group || m.voice_type || '', m.department_name || m.department || '',
    (m.baptism_status ?? m.baptized) ? 'Yes' : 'No',
    m.main_role || '', m.experience_level || '',
    (m.instruments || []).join(';'), (m.choir_activities || []).join(';'),
    m.emergency_name || m.emergency_contact_name || '',
    m.emergency_phone || m.emergency_contact_phone || '',
    m.approval_status || m.status || '',
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `members-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export function printMemberList(members: User[]) {
  const w = window.open('', '_blank', 'width=1100,height=800');
  if (!w) return;
  const rows = members.map((m) => `<tr>
    <td><img src="${m.profile_photo_url || 'https://placehold.co/40?text=?'}" style="width:36px;height:36px;border-radius:6px;object-fit:cover"></td>
    <td>${m.member_code || ''}</td><td>${m.first_name} ${m.last_name}</td>
    <td>${m.gender || ''}</td><td>${m.phone || ''}</td>
    <td>${m.role}</td><td>${m.voice_group || m.voice_type || ''}</td><td>${m.approval_status || m.status || ''}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>Member Directory</title><style>
    *{font-family:'Segoe UI',Arial,sans-serif}
    h1{color:#6B46C1;text-align:center}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{background:#6B46C1;color:#fff;padding:9px;text-align:left}
    td{padding:7px 9px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
    tr:nth-child(even){background:#f9fafb}
  </style></head><body>
  <h1>${CHURCH_NAME} — Member Directory</h1>
  <table><thead><tr><th>Photo</th><th>Code</th><th>Name</th><th>Gender</th><th>Phone</th><th>Role</th><th>Voice</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <script>window.onload=()=>setTimeout(()=>window.print(),400);</script>
  </body></html>`);
  w.document.close();
}
