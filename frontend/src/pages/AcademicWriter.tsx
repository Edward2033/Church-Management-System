import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '@/lib/api';
import { Plus, Trash2, Loader2, Save, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { downloadAsPdf } from '@/lib/pdfDownload';

interface AcademicSection { id: string; heading: string; content: string; }
interface AcademicDoc {
  id?: string; doc_type: string; title: string; author: string;
  institution: string; department: string; course: string; instructor: string;
  doc_date: string; abstract: string; introduction: string;
  sections: AcademicSection[]; methodology: string; results: string;
  discussion: string; conclusion: string; references_list: string;
}

const EMPTY: AcademicDoc = {
  doc_type: 'essay', title: '', author: '', institution: '', department: '',
  course: '', instructor: '', doc_date: '', abstract: '', introduction: '',
  sections: [], methodology: '', results: '', discussion: '', conclusion: '', references_list: '',
};

const uid = () => Math.random().toString(36).slice(2);

const DOC_TYPES = [
  { value: 'essay', label: 'Essay' }, { value: 'research_paper', label: 'Research Paper' },
  { value: 'report', label: 'Report' }, { value: 'assignment', label: 'Assignment' },
  { value: 'project_paper', label: 'Project Paper' }, { value: 'other', label: 'Other' },
];

function downloadAcademic(doc: AcademicDoc) {
  const sec = (title: string, content: string) => content?.trim()
    ? `<div style="margin-bottom:24px">
        <h2 style="font-size:13pt;font-weight:700;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px">${title}</h2>
        <p style="font-size:11pt;line-height:1.8;white-space:pre-line;text-align:justify">${content}</p>
       </div>` : '';
  const isResearch = ['research_paper','report','project_paper'].includes(doc.doc_type);
  const extraSecs = doc.sections.map((s) => sec(s.heading || 'Section', s.content)).join('');
  const html = `<!doctype html><html><head><meta charset="UTF-8">
<title>${doc.title || 'Academic Document'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Times New Roman',Times,serif;font-size:12pt;color:#1f2937;background:#fff}
  .page{max-width:750px;margin:0 auto;padding:60px 70px}
  @media print{.page{padding:40px 50px}}
</style></head><body><div class="page">
  <div style="text-align:center;padding:60px 0 40px">
    <h1 style="font-size:18pt;font-weight:700;margin-bottom:20px;line-height:1.4">${doc.title || 'Untitled'}</h1>
    <div style="font-size:11pt;color:#4b5563;line-height:2.2">
      ${doc.author ? `<div><strong>Author:</strong> ${doc.author}</div>` : ''}
      ${doc.institution ? `<div><strong>Institution:</strong> ${doc.institution}</div>` : ''}
      ${doc.department ? `<div><strong>Department:</strong> ${doc.department}</div>` : ''}
      ${doc.course ? `<div><strong>Course:</strong> ${doc.course}</div>` : ''}
      ${doc.instructor ? `<div><strong>Instructor:</strong> ${doc.instructor}</div>` : ''}
      ${doc.doc_date ? `<div><strong>Date:</strong> ${doc.doc_date}</div>` : ''}
    </div>
  </div>
  <hr style="border:1px solid #e5e7eb;margin:0 0 30px"/>
  ${doc.abstract?.trim() ? `<div style="background:#f9fafb;border-left:4px solid #7c3aed;padding:16px 20px;margin-bottom:24px;font-size:11pt;line-height:1.7;font-style:italic"><strong>Abstract:</strong> ${doc.abstract}</div>` : ''}
  ${sec('Introduction', doc.introduction)}
  ${extraSecs}
  ${isResearch ? sec('Methodology', doc.methodology) : ''}
  ${isResearch ? sec('Results / Findings', doc.results) : ''}
  ${isResearch ? sec('Discussion', doc.discussion) : ''}
  ${sec('Conclusion', doc.conclusion)}
  ${doc.references_list?.trim() ? `<div style="margin-top:30px"><h2 style="font-size:13pt;font-weight:700;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px">References</h2><div style="font-size:10.5pt;line-height:1.8;white-space:pre-line">${doc.references_list}</div></div>` : ''}
</div></body></html>`;
  downloadAsPdf(html, `${(doc.title || 'Academic_Document').replace(/\s+/g, '_')}`);
}

const Sec: React.FC<{ title: string; children: React.ReactNode; open?: boolean }> = ({ title, children, open: defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="font-semibold text-gray-800">{title}</span>
        {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
};

const AcademicWriter: React.FC = () => {
  const [docList, setDocList] = useState<AcademicDoc[]>([]);
  const [doc, setDoc] = useState<AcademicDoc>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'edit'>('list');

  const upd = (k: keyof AcademicDoc, v: any) => setDoc((d) => ({ ...d, [k]: v }));

  useEffect(() => {
    get<{ documents: AcademicDoc[] }>('/academic')
      .then((r) => setDocList(r.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadDoc = async (id: string) => {
    try {
      const { document: data } = await get<{ document: AcademicDoc }>(`/academic/${id}`);
      setDoc({ ...data, sections: Array.isArray(data.sections) ? data.sections : [] });
      setView('edit');
    } catch (err: any) { toast.error(err.message); }
  };

  const save = async () => {
    if (!doc.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (doc.id) {
        const { document: updated } = await put<{ document: AcademicDoc }>(`/academic/${doc.id}`, doc);
        setDoc({ ...updated, sections: Array.isArray(updated.sections) ? updated.sections : [] });
      } else {
        const { document: created } = await post<{ document: AcademicDoc }>('/academic', doc);
        setDoc({ ...created, sections: Array.isArray(created.sections) ? created.sections : [] });
        setDocList((l) => [created, ...l]);
      }
      toast.success('Document saved!');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try { await del(`/academic/${id}`); setDocList((l) => l.filter((d) => d.id !== id)); toast.success('Deleted'); }
    catch (err: any) { toast.error(err.message); }
  };

  const addSection = () => upd('sections', [...doc.sections, { id: uid(), heading: '', content: '' }]);
  const updSection = (id: string, k: string, v: string) => upd('sections', doc.sections.map((s) => s.id === id ? { ...s, [k]: v } : s));
  const delSection = (id: string) => upd('sections', doc.sections.filter((s) => s.id !== id));
  const isResearch = ['research_paper','report','project_paper'].includes(doc.doc_type);

  if (loading) return <div className="flex justify-center p-16"><Loader2 size={32} className="animate-spin text-purple-700" /></div>;

  if (view === 'list') return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Writing</h1>
          <p className="text-sm text-gray-500">Structure and format your academic documents professionally</p>
        </div>
        <button onClick={() => { setDoc(EMPTY); setView('edit'); }} className="btn-primary"><Plus size={16} /> New Document</button>
      </div>
      {docList.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm mt-1">Click "New Document" to start writing</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docList.map((d) => (
            <div key={d.id} className="card p-5">
              <span className="rounded-full bg-purple-100 text-purple-700 px-2.5 py-0.5 text-xs font-semibold capitalize mb-2 inline-block">{(d.doc_type || 'essay').replace('_',' ')}</span>
              <div className="font-semibold text-gray-900 mb-1 truncate">{d.title || 'Untitled'}</div>
              <div className="text-sm text-gray-500 mb-1">{d.author || '—'}</div>
              <div className="text-xs text-gray-400 mb-4">{d.institution || ''}</div>
              <div className="flex gap-2">
                <button onClick={() => loadDoc(d.id!)} className="btn-primary py-1.5 text-xs flex-1 justify-center">Edit</button>
                <button onClick={() => downloadAcademic(d)} className="btn-outline py-1.5 text-xs px-3" title="Download PDF"><Download size={14} /></button>
                <button onClick={() => remove(d.id!)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => setView('list')} className="text-sm text-purple-600 hover:underline mb-1">← Back to Documents</button>
          <h1 className="text-2xl font-bold text-gray-900">{doc.id ? 'Edit Document' : 'New Document'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadAcademic(doc)} className="btn-outline py-2 text-sm"><Download size={15} /> Download PDF</button>
          <button onClick={save} disabled={saving} className="btn-primary py-2 text-sm">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save</>}
          </button>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
        <div className="grid grid-cols-3 gap-2">
          {DOC_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => upd('doc_type', t.value)}
              className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${doc.doc_type === t.value ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Sec title="Document Information">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={doc.title} onChange={(e) => upd('title', e.target.value)} className="input-base" placeholder="Document title" />
          </div>
          {([['author','Author / Student Name'],['institution','Institution / University'],['department','Department / Faculty'],['course','Course / Module'],['instructor','Instructor / Supervisor'],['doc_date','Date']] as [string,string][]).map(([k,l]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input value={(doc as any)[k] || ''} onChange={(e) => upd(k as any, e.target.value)} className="input-base" />
            </div>
          ))}
        </div>
      </Sec>

      <Sec title="Abstract" open={false}>
        <textarea rows={5} value={doc.abstract} onChange={(e) => upd('abstract', e.target.value)} className="input-base resize-none w-full" placeholder="A concise summary (150–300 words)..." />
      </Sec>

      <Sec title="Introduction">
        <textarea rows={6} value={doc.introduction} onChange={(e) => upd('introduction', e.target.value)} className="input-base resize-none w-full" placeholder="Introduce the topic, background, and objectives..." />
      </Sec>

      <Sec title={`Main Sections (${doc.sections.length})`}>
        {doc.sections.map((s, i) => (
          <div key={s.id} className="border border-gray-200 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Section {i + 1}</span>
              <button onClick={() => delSection(s.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
            </div>
            <input value={s.heading} onChange={(e) => updSection(s.id, 'heading', e.target.value)} className="input-base mb-2 text-sm" placeholder="Section heading (e.g. Literature Review, Analysis...)" />
            <textarea rows={5} value={s.content} onChange={(e) => updSection(s.id, 'content', e.target.value)} className="input-base resize-none text-sm w-full" placeholder="Section content..." />
          </div>
        ))}
        <button onClick={addSection} className="btn-outline py-2 text-sm w-full"><Plus size={15} /> Add Section</button>
      </Sec>

      {isResearch && (
        <>
          <Sec title="Methodology" open={false}>
            <textarea rows={5} value={doc.methodology} onChange={(e) => upd('methodology', e.target.value)} className="input-base resize-none w-full" placeholder="Research methods, data collection, analysis approach..." />
          </Sec>
          <Sec title="Results / Findings" open={false}>
            <textarea rows={5} value={doc.results} onChange={(e) => upd('results', e.target.value)} className="input-base resize-none w-full" placeholder="Present your findings and results..." />
          </Sec>
          <Sec title="Discussion" open={false}>
            <textarea rows={5} value={doc.discussion} onChange={(e) => upd('discussion', e.target.value)} className="input-base resize-none w-full" placeholder="Interpret and discuss your findings..." />
          </Sec>
        </>
      )}

      <Sec title="Conclusion">
        <textarea rows={5} value={doc.conclusion} onChange={(e) => upd('conclusion', e.target.value)} className="input-base resize-none w-full" placeholder="Summarize key points and conclusions..." />
      </Sec>

      <Sec title="References / Bibliography" open={false}>
        <p className="text-xs text-gray-500 mb-2">Enter your references exactly as you want them to appear. One reference per line.</p>
        <textarea rows={8} value={doc.references_list} onChange={(e) => upd('references_list', e.target.value)} className="input-base resize-none w-full font-mono text-sm" placeholder={'Smith, J. (2020). Title of work. Publisher.\nJones, A. (2019). Another work. Journal, 5(2), 10-25.'} />
      </Sec>

      <div className="flex gap-3 mt-4">
        <button onClick={() => downloadAcademic(doc)} className="btn-outline flex-1 justify-center"><Download size={16} /> Download PDF</button>
        <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Document</>}
        </button>
      </div>
    </div>
  );
};

export default AcademicWriter;
