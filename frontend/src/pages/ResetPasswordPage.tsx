import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { post } from '@/lib/api';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired reset link');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="card-solid rounded-2xl p-8">
            <div className="h-16 w-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Invalid Reset Link</h1>
            <p className="text-slate-400 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password" className="btn-primary w-full justify-center">
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          {success ? (
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Password Reset!</h1>
              <p className="text-slate-400 mb-6">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <Link to="/login" className="btn-primary w-full justify-center">
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="h-12 w-12 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-brand-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                <p className="text-slate-400">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      required
                      minLength={8}
                      className="w-full rounded-xl glass border-0 px-4 py-3 pr-12 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      minLength={8}
                      className="w-full rounded-xl glass border-0 px-4 py-3 pr-12 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-red-400">Passwords do not match</p>
                )}

                <button
                  type="submit"
                  disabled={loading || password !== confirmPassword}
                  className="btn-primary w-full justify-center py-3"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Resetting...</>
                  ) : (
                    <><Lock size={18} /> Reset Password</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
