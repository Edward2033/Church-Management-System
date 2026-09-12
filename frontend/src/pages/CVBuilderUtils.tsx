import React, { useEffect, useState } from 'react';
import { get, post, put, del, apiFetch } from '@/lib/api';
import { Plus, Trash2, Loader2, Save, FileText, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { downloadAsPdf } from '@/lib/pdfDownload';

// ── Types ─────────────────────────────────────────────────────
interface WorkExp { id: string; job_title: string; company: string; location: string; start_date: string; end_date: string; current: boolean; responsibilities: string; achievements: string; }
interface Education { id: string; institution: string; degree: string; field: string; start_date: string; end_date: string; achievements: string; }
interface Certification { id: string; name: string; institution: string; date: string; }
interface Project { id: string; name: string; description: string; technologies: string; link: string; }
interface CVRef { id: string; name: string; position: string; organization: string; contact: string; }
interface CVData {
  id?: string; title: string; full_name: string; professional_title: string;
  email: string; phone: string; location: string; website: string; linkedin: string;
  photo_url: string; summary: string; work_experience: WorkExp[]; education: Education[];
  skills: { technical: string[]; soft: string[]; languages: string[] };
  certifications: Certification[]; projects: Project[]; references: CVRef[];
  template: string;
}

const uid = () => Math.random().toString(36).slice(2);
const EMPTY: CVData = {
  title: 'My CV', full_name: '', professional_title: '', email: '', phone: '',
  location: '', website: '', linkedin: '', photo_url: '', summary: '',
  work_experience: [], education: [],
  skills: { technical: [], soft: [], languages: [] },
  certifications: [], projects: [], references: [], template: 'classic',
};

// ── Download as PDF ───────────────────────────────────────────
function downloadCV(cv: CVData) {
  downloadAsPdf(buildCVHtml(cv), `CV_${(cv.full_name || 'document').replace(/\s+/g, '_')}`);
}

// ── Print ─────────────────────────────────────────────────────
function printCV(cv: CVData) {
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) { alert('Please allow popups to print.'); return; }
  const photo = cv.photo_url ? `<img src="${cv.photo_url}" style="width:110px;height:130px;object-fit:cover;border-radius:8px;border:3px solid #e9d5ff;float:right;margin-left:20px" alt="photo"/>` : '';
  const sec = (title: string, html: string) => html.trim() ? `<div style="margin-bottom:22px"><div style="font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#5b21b6;border-bottom:2px solid #e9d5ff;padding-bottom:4px;margin-bottom:12px">${title}</div>${html}</div>` : '';
  const workHtml = cv.work_experience.map((j) => `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><strong>${j.job_title}</strong><span style="color:#6b7280;font-size:10pt">${j.start_date}${j.end_date||j.current?' – '+(j.current?'Present':j.end_date):''}</span></div><div style="color:#7c3aed;font-size:11pt">${j.company}${j.location?' · '+j.location:''}</div>${j.responsibilities?`<p style="font-size:10.5pt;margin:4px 0;white-space:pre-line">${j.responsibilities}</p>`:''} ${j.achievements?`<p style="font-size:10.5pt;margin:4px 0;font-style:italic">Achievements: ${j.achievements}</p>`:''}</div>`).join('');
  const eduHtml = cv.education.map((e) => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><strong>${e.degree}${e.field?' in '+e.field:''}</strong><span style="color:#6b7280;font-size:10pt">${e.start_date}${e.end_date?' – '+e.end_date:''}</span></div><div style="color:#7c3aed">${e.institution}</div>${e.achievements?`<p style="font-size:10.5pt;margin:4px 0">${e.achievements}</p>`:''}</div>`).join('');
  const skillsHtml = [cv.skills.technical.length?`<div><strong>Technical:</strong> ${cv.skills.technical.join(', ')}</div>`:'', cv.skills.soft.length?`<div><strong>Soft Skills:</strong> ${cv.skills.soft.join(', ')}</div>`:'', cv.skills.languages.length?`<div><strong>Languages:</strong> ${cv.skills.languages.join(', ')}</div>`:''].filter(Boolean).join('');
  const certHtml = cv.certifications.map((c) => `<div style="margin-bottom:8px"><strong>${c.name}</strong>${c.institution?' — '+c.institution:''}${c.date?' ('+c.date+')':''}</div>`).join('');
  const projHtml = cv.projects.map((p) => `<div style="margin-bottom:12px"><strong>${p.name}</strong>${p.technologies?`<span style="color:#7c3aed"> · ${p.technologies}</span>`:''} ${p.description?`<p style="font-size:10.5pt;margin:4px 0">${p.description}</p>`:''} ${p.link?`<a href="${p.link}" style="color:#7c3aed;font-size:10pt">${p.link}</a>`:''}</div>`).join('');
  const refHtml = cv.references.map((r) => `<div style="margin-bottom:10px"><strong>${r.name}</strong>${r.position?', '+r.position:''}${r.organization?' — '+r.organization:''} ${r.contact?`<div style="font-size:10pt;color:#6b7280">${r.contact}</div>`:''}</div>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>CV – ${cv.full_name||'Resume'}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Calibri',Arial,sans-serif;font-size:11pt;color:#1f2937;background:#fff}.page{max-width:780px;margin:0 auto;padding:50px 60px}@media print{.page{padding:30px 40px}}</style>
</head><body><div class="page">
<div style="margin-bottom:28px;overflow:hidden">${photo}<h1 style="font-size:22pt;font-weight:700;line-height:1.2">${cv.full_name||'Full Name'}</h1>${cv.professional_title?`<div style="font-size:13pt;color:#7c3aed;margin:4px 0">${cv.professional_title}</div>`:''}<div style="font-size:10pt;color:#6b7280;margin-top:6px">${[cv.email?'✉ '+cv.email:'',cv.phone?'📞 '+cv.phone:'',cv.location?'📍 '+cv.location:'',cv.website?'🌐 '+cv.website:'',cv.linkedin?'🔗 '+cv.linkedin:''].filter(Boolean).join(' &nbsp;·&nbsp; ')}</div></div>
${sec('Professional Summary',cv.summary?`<p style="line-height:1.7">${cv.summary}</p>`:'')}
${sec('Work Experience',workHtml)}${sec('Education',eduHtml)}${sec('Skills',skillsHtml)}${sec('Certifications',certHtml)}${sec('Projects',projHtml)}${sec('References',refHtml)}
</div><script>window.onload=()=>setTimeout(()=>window.print(),600)</script></body></html>`);
  w.document.close();
}

// ── Collapsible section ───────────────────────────────────────
const Sec: React.FC<{ title: string; children: React.ReactNode; open?: boolean }> = ({ title, children, open: def = true }) => {
  const [open, setOpen] = useState(def);
  return (
    <div className="card mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="font-semibold text-gray-800">{title}</span>
        {open ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
};

// ── Tag input ─────────────────────────────────────────────────
const TagInput: React.FC<{ label: string; tags: string[]; onChange: (t: string[]) => void }> = ({ label, tags, onChange }) => {
  const [val, setVal] = useState('');
  const add = () => { const v = val.trim(); if (v && !tags.includes(v)) { onChange([...tags, v]); setVal(''); } };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
            {t}<button onClick={() => onChange(tags.filter((x) => x !== t))}><X size={11}/></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key==='Enter'){e.preventDefault();add();} }} className="input-base flex-1" placeholder="Type and press Enter"/>
        <button onClick={add} className="btn-outline px-3 py-2 text-sm">Add</button>
      </div>
    </div>
  );
};

export { EMPTY, uid, printCV, downloadCV, Sec, TagInput };
export type { CVData, WorkExp, Education, Certification, Project, CVRef };
