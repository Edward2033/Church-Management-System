import React, { useEffect, useState } from 'react';
import { post, get, DEFAULT_CHURCH_ID } from '@/lib/api';
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContactSettings { [key: string]: string }

const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [settings, setSettings] = useState<ContactSettings>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    get<{ settings: ContactSettings }>(`/cms/settings?church_id=${DEFAULT_CHURCH_ID}&group=contact`)
      .then((r) => setSettings(r.settings || {}))
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await post('/contact', { ...form, church_id: DEFAULT_CHURCH_ID });
      setSent(true);
      const successMsg = settings.contact_success_message || "Message sent! We'll get back to you soon.";
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = settings.contact_page_title || 'Contact Us';
  const pageSubtitle = settings.contact_page_subtitle || "We'd love to hear from you. Reach out any time.";
  const address = settings.contact_address || '';
  const phone = settings.contact_phone || '';
  const email = settings.contact_email || '';
  const officeHours = settings.contact_office_hours || '';

  const sundayServices = [
    [settings.contact_service1_label || '', settings.contact_service1_time || ''],
    [settings.contact_service2_label || '', settings.contact_service2_time || ''],
    [settings.contact_service3_label || '', settings.contact_service3_time || ''],
  ].filter(([label, time]) => label && time);

  const midweekServices = [
    [settings.contact_midweek1_label || '', settings.contact_midweek1_time || ''],
    [settings.contact_midweek2_label || '', settings.contact_midweek2_time || ''],
  ].filter(([label, time]) => label && time);

  const formEnabled = settings.contact_form_enabled !== 'false';

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="relative overflow-hidden pt-24 pb-20">
          <div className="absolute inset-0 bg-gradient-brand opacity-20" />
          <div className="container-pad relative text-center">
            <div className="h-8 w-32 bg-slate-800 rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-12 w-64 bg-slate-800 rounded-xl mx-auto animate-pulse" />
          </div>
        </div>
        <div className="container-pad py-20 flex justify-center">
          <Loader2 size={40} className="animate-spin text-brand-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 bg-gradient-brand opacity-20" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="container-pad relative text-center">
          <span className="section-tag mb-5">Get In Touch</span>
          <h1 className="heading-lg text-white mt-4">{pageTitle}</h1>
          <p className="mt-5 text-xl text-slate-300 max-w-2xl mx-auto">{pageSubtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container-pad pb-20">
        <div className="grid gap-10 lg:grid-cols-2 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="card-solid rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Get In Touch</h2>
              <div className="space-y-5">
                {[
                  { icon: MapPin, label: 'Address', value: address },
                  { icon: Phone, label: 'Phone', value: phone },
                  { icon: Mail, label: 'Email', value: email },
                  { icon: Clock, label: 'Office Hours', value: officeHours },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                      <item.icon size={18} className="text-brand-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500">{item.label}</div>
                      {item.value ? (
                        <div className="text-slate-200 font-semibold">{item.value}</div>
                      ) : (
                        <div className="text-slate-500 italic text-sm">Not configured</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-solid rounded-2xl p-8">
              {sundayServices.length > 0 && (
                <>
                  <h3 className="font-bold text-white mb-4">Sunday Service Times</h3>
                  <div className="space-y-2 text-sm">
                    {sundayServices.map(([s, t]) => (
                      <div key={s} className="flex justify-between py-1 border-b border-slate-800 last:border-0">
                        <span className="text-slate-400">{s}</span>
                        <span className="font-semibold text-slate-200">{t}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {midweekServices.length > 0 && (
                <>
                  <h3 className={`font-bold text-white ${sundayServices.length > 0 ? 'mt-5' : ''} mb-3`}>Midweek Services</h3>
                  <div className="space-y-2 text-sm">
                    {midweekServices.map(([s, t]) => (
                      <div key={s} className="flex justify-between py-1 border-b border-slate-800 last:border-0">
                        <span className="text-slate-400">{s}</span>
                        <span className="font-semibold text-slate-200">{t}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {sundayServices.length === 0 && midweekServices.length === 0 && (
                <p className="text-slate-500 italic text-sm">Service times not configured. Please update in Admin &gt; CMS Settings &gt; Contact.</p>
              )}
            </div>
          </div>

          {/* Form */}
          {formEnabled ? (
            <div className="card-solid rounded-2xl p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <CheckCircle size={56} className="text-green-400 mb-4" />
                  <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                  <p className="mt-2 text-slate-400">{settings.contact_success_message || "Thank you for reaching out. We'll get back to you within 24 hours."}</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                    className="mt-6 btn-primary"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white mb-6">Send a Message</h2>
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                        <input required value={form.name} onChange={(e) => upd('name', e.target.value)}
                          className="w-full rounded-xl glass border-0 px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500"
                          placeholder="John Mensah" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                        <input required type="email" value={form.email} onChange={(e) => upd('email', e.target.value)}
                          className="w-full rounded-xl glass border-0 px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500"
                          placeholder="john@example.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                        <input type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)}
                          className="w-full rounded-xl glass border-0 px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500"
                          placeholder="+233..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                        <input value={form.subject} onChange={(e) => upd('subject', e.target.value)}
                          className="w-full rounded-xl glass border-0 px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500"
                          placeholder="Membership query" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Message *</label>
                      <textarea required rows={5} value={form.message} onChange={(e) => upd('message', e.target.value)}
                        className="w-full rounded-xl glass border-0 px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 resize-none"
                        placeholder="Type your message here..." />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Send Message
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            <div className="card-solid rounded-2xl p-8 text-center">
              <p className="text-slate-400">Contact form is currently disabled. Please reach out using the contact information on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
