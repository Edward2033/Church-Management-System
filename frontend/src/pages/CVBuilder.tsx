import React, { useEffect, useState } from 'react';
import { get, post, put, del, apiFetch } from '@/lib/api';
import { Plus, Trash2, Loader2, Save, Printer, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { EMPTY, uid, printCV, Sec, TagInput } from './CVBuilderUtils';
import type { CVData, WorkExp, Education, Certification, Project, CVRef } from './CVBuilderUtils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _unused = WorkExp | Education | Certification | Project | CVRef;

const CVBuilder: React.FC = () => {
  const [cvList, setCvList] = useState<CVData[]>([]);
  const [cv, setCv] = useState<CVData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<'list'|'edit'>('list');

  const upd = (k: keyof CVData, v: any) => setCv((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    get<{ cvs: CVData[] }>('/cv').then((r) => setCvList(r.cvs||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const loadCV = async (id: string) => {
    try { const { cv: d } = await get<{ cv: CVData }>(`/cv/${id}`); setCv(d); setView('edit'); }
    catch (err: any) { toast.error(err.message); }
  };

  const save = async () => {
    if (!cv.full_name?.trim()) { toast.error('Full name is required'); return; }
    setSaving(true);
    try {
      if (cv.id) {
        const { cv: u } = await put<{ cv: CVData }>(`/cv/${cv.id}`, cv); setCv(u);
      } else {
        const { cv: c } = await post<{ cv: CVData }>('/cv', cv); setCv(c); setCvList((l) => [c,...l]);
      }
      toast.success('CV saved!');
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this CV?')) return;
    try { await del(`/cv/${id}`); setCvList((l) => l.filter((c) => c.id!==id)); toast.success('Deleted'); }
    catch (err: any) { toast.error(err.message); }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('photo', file);
      const res = await apiFetch('/cv/upload-photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      upd('photo_url', data.url); toast.success('Photo uploaded');
    } catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
  };

  // Work helpers
  const addWork = () => upd('work_experience', [...cv.work_experience, { id: uid(), job_title:'', company:'', location:'', start_date:'', end_date:'', current:false, responsibilities:'', achievements:'' }]);
  const updWork = (id: string, k: string, v: any) => upd('work_experience', cv.work_experience.map((w) => w.id===id?{...w,[k]:v}:w));
  const delWork = (id: string) => upd('work_experience', cv.work_experience.filter((w) => w.id!==id));

  // Education helpers
  const addEdu = () => upd('education', [...cv.education, { id: uid(), institution:'', degree:'', field:'', start_date:'', end_date:'', achievements:'' }]);
  const updEdu = (id: string, k: string, v: any) => upd('education', cv.education.map((e) => e.id===id?{...e,[k]:v}:e));
  const delEdu = (id: string) => upd('education', cv.education.filter((e) => e.id!==id));

  // Cert helpers
  const addCert = () => upd('certifications', [...cv.certifications, { id: uid(), name:'', institution:'', date:'' }]);
  const updCert = (id: string, k: string, v: any) => upd('certifications', cv.certifications.map((c) => c.id===id?{...c,[k]:v}:c));
  const delCert = (id: string) => upd('certifications', cv.certifications.filter((c) => c.id!==id));

  // Project helpers
  const addProj = () => upd('projects', [...cv.projects, { id: uid(), name:'', description:'', technologies:'', link:'' }]);
  const updProj = (id: string, k: string, v: any) => upd('projects', cv.projects.map((p) => p.id===id?{...p,[k]:v}:p));
  const delProj = (id: string) => upd('projects', cv.projects.filter((p) => p.id!==id));

  // Ref helpers
  const addRef = () => upd('references', [...cv.references, { id: uid(), name:'', position:'', organization:'', contact:'' }]);
  const updRef = (id: string, k: string, v: any) => upd('references', cv.references.map((r) => r.id===id?{...r,[k]:v}:r));
  const delRef = (id: string) => upd('references', cv.references.filter((r) => r.id!==id));

  if (loading) return <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700"/></div>;

  // ── List view ──────────────────────────────────────────────
  if (view === 'list') return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CV / Resume Builder</h1>
          <p className="text-sm text-gray-500">Create and manage your professional CV</p>
        </div>
        <button onClick={() => { setCv(EMPTY); setView('edit'); }} className="btn-primary"><Plus size={16}/> New CV</button>
      </div>
      {cvList.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <FileText size={48} className="mx-auto mb-4 opacity-30"/>
          <p className="font-medium">No CVs yet</p>
          <p className="text-sm mt-1">Click "New CV" to build your first professional CV</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvList.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="font-semibold text-gray-900 mb-1">{c.title||'Untitled CV'}</div>
              <div className="text-sm text-gray-500 mb-1">{c.full_name||'—'}</div>
              <div className="text-xs text-gray-400 mb-4">{c.professional_title||''}</div>
              <div className="flex gap-2">
                <button onClick={() => loadCV(c.id!)} className="btn-primary py-1.5 text-xs flex-1 justify-center">Edit</button>
                <button onClick={() => printCV(c)} className="btn-outline py-1.5 text-xs px-3"><Printer size={14}/></button>
                <button onClick={() => remove(c.id!)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Edit view ──────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => setView('list')} className="text-sm text-purple-600 hover:underline mb-1">← Back to CVs</button>
          <h1 className="text-2xl font-bold text-gray-900">{cv.id ? 'Edit CV' : 'New CV'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => printCV(cv)} className="btn-outline py-2 text-sm"><Printer size={15}/> Print / Download</button>
          <button onClick={save} disabled={saving} className="btn-primary py-2 text-sm">
            {saving ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Save size={15}/> Save CV</>}
          </button>
        </div>
      </div>

      {/* CV Title */}
      <div className="card p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">CV Title (internal label)</label>
        <input value={cv.title} onChange={(e) => upd('title', e.target.value)} className="input-base" placeholder="e.g. Software Engineer CV 2024"/>
      </div>

      {/* Personal Info */}
      <Sec title="Personal Information">
        <div className="grid grid-cols-2 gap-4">
          {cv.photo_url && (
            <div className="col-span-2">
              <img src={cv.photo_url} alt="CV photo" className="h-24 w-20 object-cover rounded-lg border-2 border-purple-100"/>
            </div>
          )}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
            <label className="cursor-pointer btn-outline py-2 text-sm inline-flex items-center gap-2">
              <Upload size={14}/> {uploading ? 'Uploading…' : 'Upload Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f=e.target.files?.[0]; if(f) uploadPhoto(f); }}/>
            </label>
          </div>
          {([['full_name','Full Name *'],['professional_title','Professional Title'],['email','Email'],['phone','Phone'],['location','Location / City'],['website','Website / Portfolio'],['linkedin','LinkedIn / Social Link']] as [string,string][]).map(([k,l]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input value={(cv as any)[k]||''} onChange={(e) => upd(k as any, e.target.value)} className="input-base"/>
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
            <textarea rows={4} value={cv.summary} onChange={(e) => upd('summary', e.target.value)} className="input-base resize-none" placeholder="A brief professional summary about yourself..."/>
          </div>
        </div>
      </Sec>

      {/* Work Experience */}
      <Sec title={`Work Experience (${cv.work_experience.length})`}>
        {cv.work_experience.map((w, i) => (
          <div key={w.id} className="border border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Position {i+1}</span>
              <button onClick={() => delWork(w.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['job_title','Job Title *'],['company','Company *'],['location','Location'],['start_date','Start Date'],['end_date','End Date']] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input value={(w as any)[k]||''} onChange={(e) => updWork(w.id,k,e.target.value)} className="input-base text-sm" placeholder={k.includes('date')?'e.g. Jan 2020':''}/>
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                <input type="checkbox" checked={w.current} onChange={(e) => updWork(w.id,'current',e.target.checked)}/> Currently working here
              </label>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsibilities</label>
                <textarea rows={3} value={w.responsibilities} onChange={(e) => updWork(w.id,'responsibilities',e.target.value)} className="input-base text-sm resize-none" placeholder="Key responsibilities and duties..."/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Achievements</label>
                <textarea rows={2} value={w.achievements} onChange={(e) => updWork(w.id,'achievements',e.target.value)} className="input-base text-sm resize-none" placeholder="Notable achievements..."/>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addWork} className="btn-outline py-2 text-sm w-full"><Plus size={15}/> Add Work Experience</button>
      </Sec>

      {/* Education */}
      <Sec title={`Education (${cv.education.length})`}>
        {cv.education.map((e, i) => (
          <div key={e.id} className="border border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Education {i+1}</span>
              <button onClick={() => delEdu(e.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['institution','Institution *'],['degree','Degree / Qualification *'],['field','Field of Study'],['start_date','Start Date'],['end_date','End Date']] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input value={(e as any)[k]||''} onChange={(ev) => updEdu(e.id,k,ev.target.value)} className="input-base text-sm"/>
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Achievements / Honors</label>
                <textarea rows={2} value={e.achievements} onChange={(ev) => updEdu(e.id,'achievements',ev.target.value)} className="input-base text-sm resize-none"/>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addEdu} className="btn-outline py-2 text-sm w-full"><Plus size={15}/> Add Education</button>
      </Sec>

      {/* Skills */}
      <Sec title="Skills">
        <div className="space-y-4">
          <TagInput label="Technical Skills" tags={cv.skills.technical} onChange={(t: string[]) => upd('skills',{...cv.skills,technical:t})}/>
          <TagInput label="Soft Skills" tags={cv.skills.soft} onChange={(t: string[]) => upd('skills',{...cv.skills,soft:t})}/>
          <TagInput label="Languages" tags={cv.skills.languages} onChange={(t: string[]) => upd('skills',{...cv.skills,languages:t})}/>
        </div>
      </Sec>

      {/* Certifications */}
      <Sec title={`Certifications (${cv.certifications.length})`} open={false}>
        {cv.certifications.map((c, i) => (
          <div key={c.id} className="border border-gray-200 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Certification {i+1}</span>
              <button onClick={() => delCert(c.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([['name','Certification Name *'],['institution','Issuing Institution'],['date','Date']] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input value={(c as any)[k]||''} onChange={(e) => updCert(c.id,k,e.target.value)} className="input-base text-sm"/>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addCert} className="btn-outline py-2 text-sm w-full"><Plus size={15}/> Add Certification</button>
      </Sec>

      {/* Projects */}
      <Sec title={`Projects (${cv.projects.length})`} open={false}>
        {cv.projects.map((p, i) => (
          <div key={p.id} className="border border-gray-200 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Project {i+1}</span>
              <button onClick={() => delProj(p.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['name','Project Name *'],['technologies','Technologies / Skills'],['link','Project Link']] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input value={(p as any)[k]||''} onChange={(e) => updProj(p.id,k,e.target.value)} className="input-base text-sm"/>
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={2} value={p.description} onChange={(e) => updProj(p.id,'description',e.target.value)} className="input-base text-sm resize-none"/>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addProj} className="btn-outline py-2 text-sm w-full"><Plus size={15}/> Add Project</button>
      </Sec>

      {/* References */}
      <Sec title={`References (${cv.references.length})`} open={false}>
        {cv.references.map((r, i) => (
          <div key={r.id} className="border border-gray-200 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Reference {i+1}</span>
              <button onClick={() => delRef(r.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['name','Full Name *'],['position','Position / Title'],['organization','Organization'],['contact','Contact (Email / Phone)']] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                  <input value={(r as any)[k]||''} onChange={(e) => updRef(r.id,k,e.target.value)} className="input-base text-sm"/>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={addRef} className="btn-outline py-2 text-sm w-full"><Plus size={15}/> Add Reference</button>
      </Sec>

      <div className="flex gap-3 mt-4">
        <button onClick={() => printCV(cv)} className="btn-outline flex-1 justify-center"><Printer size={16}/> Print / Download PDF</button>
        <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? <><Loader2 size={16} className="animate-spin"/> Saving…</> : <><Save size={16}/> Save CV</>}
        </button>
      </div>
    </div>
  );
};

export default CVBuilder;
