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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-700 mb-4">
            <Church size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Welcome Back</h1>
          <p className="mt-2 text-gray-500">Sign in to your {CHURCH_NAME} account</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              Sign In
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-700 font-semibold hover:underline">Register here</Link>
          </p>
        </div>

        <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 text-sm text-gray-500 text-center">
          <strong className="text-gray-700">Note:</strong> After registering, an admin must approve your account before you can log in.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
