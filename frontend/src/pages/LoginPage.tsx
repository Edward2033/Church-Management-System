import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LogIn, Loader2, Church } from 'lucide-react';
import { CHURCH_NAME } from '@/lib/api';

const LoginPage: React.FC = () => {
  const { login, member } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (member) navigate(['admin','superadmin','pastor','elder'].includes(member.role as string) ? '/admin' : '/dashboard');
  }, [member, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const m = await login(form.email, form.password);
      toast.success(`Welcome back, ${m.first_name}!`);
      navigate(['admin','superadmin','pastor','elder'].includes(m.role as string) ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20 mb-4">
            <Church size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-serif">Welcome Back</h1>
          <p className="mt-2 text-slate-400">Sign in to your {CHURCH_NAME} account</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="john@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              Sign In
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">Register here</Link>
          </p>
        </div>

        <div className="mt-4 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl p-4 text-sm text-slate-400 text-center">
          <strong className="text-slate-300">Note:</strong> After registering, an admin must approve your account before you can log in.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
