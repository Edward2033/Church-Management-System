import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Loader2, Church, CheckCircle2 } from 'lucide-react';
import { CHURCH_NAME } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SetupPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid setup link');
      navigate('/login');
      return;
    }

    // Validate token
    fetch(`${API_BASE_URL}/auth/validate-token?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsValid(true);
          setUserEmail(data.email || '');
        } else {
          toast.error('Invalid or expired setup link');
          navigate('/login');
        }
      })
      .catch(() => {
        toast.error('Failed to validate link');
        navigate('/login');
      })
      .finally(() => setValidating(false));
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to set password');
      
      toast.success('Password set successfully! You can now login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-slate-400">Validating setup link...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20 mb-4">
            <Church size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-serif">Set Your Password</h1>
          <p className="mt-2 text-slate-400">Welcome to {CHURCH_NAME}</p>
          {userEmail && (
            <p className="mt-1 text-sm text-brand-400">{userEmail}</p>
          )}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                New Password
              </label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Enter your password"
                minLength={8}
              />
              <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                required
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Confirm your password"
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Set Password & Continue
            </button>
          </form>
        </div>

        <div className="mt-4 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl p-4 text-sm text-slate-400 text-center">
          <Lock size={16} className="inline-block mr-2" />
          Your password will be encrypted and stored securely
        </div>
      </div>
    </div>
  );
};

export default SetupPasswordPage;
