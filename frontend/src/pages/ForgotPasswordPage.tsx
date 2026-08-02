import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '@/lib/api';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');
    
    setLoading(true);
    try {
      await post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If that email exists, a reset link has been sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back to Login */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {/* Card */}
        <div className="card-solid rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Check Your Email</h1>
              <p className="text-slate-400 mb-6">
                If an account exists with <strong className="text-white">{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="btn-outline w-full justify-center"
              >
                Try Different Email
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="h-12 w-12 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-brand-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                <p className="text-slate-400">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full rounded-xl glass border-0 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Mail size={18} /> Send Reset Link</>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Remember your password?{' '}
                  <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
                    Log In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
